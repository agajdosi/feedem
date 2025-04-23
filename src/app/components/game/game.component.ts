import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
// components
import { UserComponent } from '../user/user.component';
import { FeedComponent } from '../feed/feed.component';
import { ScreensaverComponent } from '../screensaver/screensaver.component';
// models
import { Game, User, Relation, RelationType } from '../../models/game';
import { GraphNode } from '../../models/graph-node';
import { GraphEdge } from '../../models/graph-edge';
// services
import { SocketService, SocketEvent, SocketCommand } from '../../services/socket/socket.service';
// import { HttpService } from '../../services/http/http.service';
import { GameService } from '../../services/game/game.service';
import { GraphService } from '../../services/graph/graph.service';
// rxjs
import { Subscription } from 'rxjs';
// qr
import { QrCodeComponent } from 'ng-qrcode';
// utils
import * as utils from '../../shared/utils';
// user
import { ScoreComponent } from '../score/score.component';
import { LlmsService } from '../../services/llms/llms.service';
// graph
import {
  GraphViewerComponent,
  GraphLayoutSettings,
  GraphData
} from '@tomaszatoo/graph-viewer';
import Graph from 'graphology';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    UserComponent,
    QrCodeComponent,
    ScoreComponent,
    GraphViewerComponent,
    FeedComponent,
    ScreensaverComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  

  controllable: boolean = false;

  graphLayoutSettings!: GraphLayoutSettings
  graphData!: GraphData;
  highlightUser: string | undefined  = undefined;
  highlightUsersConnection: string | undefined = undefined;
  selectUser: string | undefined = undefined;
  clearUsersHighlight: boolean = false;
  clearConnectionsHighlight: boolean = false;
  graph!: Graph;
  addGraphNodes: Record<string, any> = {}
  addGraphEdges: ReadonlyArray<{
    source: string;
    target: string;
    attributes: any;
  }> | null = null;
  private linkValidFrom: number = Date.now();
  private linkValidityInterval: any;

  game!: Game;

  private socketSub: Subscription = new Subscription();
  private gameControllableSub: Subscription = new Subscription();
  private gameSub: Subscription = new Subscription();

  renderNode = this.createNodeRenderer();
  renderEdge = this.createEdgeRenderer();

  constructor(
    private readonly socketService: SocketService,
    // private readonly httpService: HttpService,
    private readonly gameService: GameService,
    private readonly llmsService: LlmsService,
    private readonly graphService: GraphService
  ) {
    this.graphLayoutSettings = this.graphService.layoutSettings;
  }

  ngOnInit(): void {
    // update validity of link each 60s (controller has 2mins)
    this.linkValidityInterval = setInterval(() => {
      this.linkValidFrom = Date.now();
    }, 60 * 1000);
    // window.addEventListener('beforeunload', this.notifyUsersAboutLeaving.bind(this));
    // this.socketService.sendSocketMessage({
    //   command: 'deactivate-controller-of',
    //   data: {
    //     userId: this.socketService.socketId
    //   }
    // });
    // subscribe game json
    this.gameService.gameSubject.subscribe({
      next: (game: Game) => {
        if (game && game.uuid) {
          if (this.game/*  && game.updated > this.game.updated */) {
            // sync graph with new game (posts, comments, reactions)
            this.syncGraphWithGame(game);

          } else {
            
            this.buildGraphDataFromGame(game); 
            // set new game object
            this.game = game;           
          }
        }
      }
    })
    // listen to all client messages
    this.socketSub = this.socketService.socketMessage.subscribe({
      next: (e: SocketEvent) => this.socketMessageHandler(e)
    });
    // is game controllable? (can I take control?)
    this.gameControllableSub = this.socketService.controllable.subscribe({
      next: (controllable: boolean) => {
        this.controllable = controllable;
      }
    })
  }

  getUserById(id: string): User | undefined {
    return utils.getUserById(id, this.game.users);
  }

  ngOnDestroy(): void {
    // window.removeEventListener('beforeunload', this.notifyUsersAboutLeaving);
    this.socketSub.unsubscribe();
    this.gameControllableSub.unsubscribe();
    this.gameSub.unsubscribe();
  }

  requestGameControl(): void {
    this.socketService.requestGameControl();
  }

  getControllerLink(): string {
    const location = window.location;
    const mySocketId = this.socketService.socketId;
    const link = `${location.protocol}//${location.host}/controller?from=${mySocketId}&valid=${this.linkValidFrom}`;
    // console.log(link);
    return link;
  }

  openController(): void {
    const link = this.getControllerLink();
    window.open(link, '_blank');
  }

  graphUpdated(graph: Graph): void {
    if (!this.graph) console.log('graphInitialised', graph);
    if (this.graph) console.log('graphUpdated', graph);
    if (graph) this.graph = graph;
  }

  private buildGraphDataFromGame(game: Game): void {
    // build user graph
    // console.log('game', game);
    this.graphService.buildGraph(game.users, game.relations, game.posts).then((graphData: GraphData | undefined) => {
      if (graphData) {
        this.graphData = graphData;
        // console.log('RELATIONS', this.game.relations);
      }
    }).catch((e: any) => console.error(e));
  }

  private syncGraphWithGame(game: Game): void {
    // TODO: update graph
    // ... add posts, mainly
    //
    console.warn('GAME SHOULD BE JUST UPDATED:::tasks to update?', game.tasks, this.game.tasks);
    // update game object
    this.gameService.updateGame(this.game, game);
  }

  // TODO !!! -> ONLY SERVER CAN TRIGGER LEAVING (should know if the controlled game instance stoped)
  // private notifyUsersAboutLeaving(e: BeforeUnloadEvent): void {
  //   // send message to deactivate controller of this instance of game being controlled
  //   e.preventDefault();
  //   console.log('BEFOREUNLOAD', e);
  //   this.socketService.sendSocketMessage({
  //     command: 'deactivate-controller-of',
  //     data: {
  //       userId: this.socketService.socketId
  //     }
  //   });
  //   // e.preventDefault();
  //   // return 'Test';
  // }

  private createNodeRenderer() {
    return ({ attributes, position }: any) => {
      return new GraphNode(position, attributes);
    };
  }

  private createEdgeRenderer() {
    return ({attributes, targetSize}: any) => {
      return new GraphEdge({source: {x: 1, y: 1}, target: {x: 1, y: 1}}, attributes, targetSize);
    }
  }

  private socketMessageHandler(e: SocketEvent): void {
    switch (e.type) {
      case 'game':
        // console.log('game from server', e.data);
        if (e.data && e.data.uuid) this.gameService.gameSubject.next(e.data); // TODO: update game, not replace
        break;
      case 'message':
        this.socketCommandsHandler(e.data);
        break;
      default:
        console.log('recieved socket event', e);
    }
  }

  private socketCommandsHandler(c: SocketCommand): void {
    // console.log('socketCommand', c);
    switch (c.command) {
      case 'highlight-graph-user':
        // TODO: not a nice solution :/
        this.clearUsersHighlight = true;
        this.clearConnectionsHighlight = true;
        setTimeout(() => {
          this.highlightUser = c.data.userId;
          this.clearUsersHighlight = false;
          this.clearConnectionsHighlight = false;
          const connections: string[] = [];
          this.graph.findEdge(c.data.userId, (edge: string, attributes: any) => {
            // console.log('user connection to highlight', edge);
            connections.push(edge);
          });
          if (connections.length) {
            let i = 0;
            const add = setInterval(() => {
              if (i > connections.length) clearInterval(add);
              this.highlightUsersConnection = connections[i];
              i++;
            }, 10);
          }
        }, 100);        
        break;
      case 'highlight-graph-path':
        const path = c.data.path;
        // console.log('TODO: highlight-graph-path', path);
        // console.warn('debug');
        this.clearConnectionsHighlight = true;
        this.highlightUsersConnection = undefined;
        let i = 0;
        const highlightEdge = () => {
          const source = path[i];
          const target = path[i+1];
          if (target && source) {
            this.highlightUsersConnection = undefined;
            // console.log('source----> surname: ', this.gameService.getUserById(source).surname);
            // console.log('target----> surname: ', this.gameService.getUserById(target).surname);
            this.graph.findEdge(source, target, (edge: string) => {
              // console.log('FOUND EDGE', edge);
              this.highlightUsersConnection = edge;
              i++;
              setTimeout(() => highlightEdge(), 10);
            });
          } else {
            this.clearConnectionsHighlight = false;
          }
          
        }
        setTimeout(() => highlightEdge(), 10);
        break;
      case 'select-hero':
        this.gameService.setHero(c.data.userId);
        console.log('SELECT HERO', c.data.userId);
        this.selectUser = c.data.userId;
        break;
      case 'update-game':
        this.gameService.gameSubject.next(c.data.game);
        break;
      case 'comment':
        // this.gameService.game.comments.unshift(c.data.comment);
        // add comment to graph
        const comment = c.data.comment;
        // console.log('ADD COMMENT', comment);
        if (comment) {
          const author = comment.author;
          const node = {};
          (node as any)[comment.uuid] = {x: 1, y: 1, type: 'comment'};
          this.addGraphNodes = node;
          // create edges
          const edges = [];
          // author to comment
          edges.push({source: author, target: comment.uuid, attributes: { label: RelationType.Write }});
          // comment to post
          edges.push({source: comment.uuid, target: comment.parent, attributes: { label: RelationType.Comment}})
          // add to graph
          this.addGraphEdges = edges;
        }
        
        
        break;
      case 'reaction':
        // this.gameService.game.reactions.unshift(c.data.reaction);
        const reaction = c.data.reaction;
        console.log('NEW REACTION', reaction);
        if (reaction) {
          // this.clearConnectionsHighlight = true;
          // find edge
          const post = this.gameService.getPost(reaction.parent);
          if (post) {
            this.graph.findEdge(post.uuid, reaction.author, (edge: string) => {
              console.log('EDGE FOUND', edge);
              if (edge) {
                // update edge label
                // remove label and create again with different label
                this.graph.dropEdge(edge);
                this.addGraphEdges = [{source: post.uuid, target: reaction.author, attributes: { label: reaction.value }}];
                // const edgeLabel = this.graph.getEdgeAttribute(edge, 'label');
                // this.graph.setEdgeAttribute(edge, 'label', `${reaction.value}`);
                // // this.highlightUsersConnection = edge;
                // this.addGraphEdges = [];

              }
            })
          }
        }
        break;
      case 'task':
        // console.log('NEW TASK', c.data.task);
        // add post to graph
        const task = c.data.task;
        const post = this.gameService.getPost(task.showPost);
        if (post) {
          const author = post.author;
          const node = {};
          (node as any)[post.uuid] = {x: 1, y: 1, type: 'post'}
          this.addGraphNodes = node;
          // create edges
          const edges = [];
          edges.push({source: author, target: post.uuid, attributes: {label: RelationType.Write }});
          for (const readerId of task.showTo) {
            edges.push({source: post.uuid, target: readerId, attributes: {label: RelationType.Get}})
          }
          this.addGraphEdges = edges;
        } else {
          console.error('POST NOT FOUND', task.showPost);
        }
        

        break;
      default:
        console.log('recieved socket command', c);
    }
  }

  userFollow(userId: string): string[] {
    return this.gameService.userIsFollowing(this.graph, userId);
  }
  userIsFollowed(userId: string): string[] {
    return this.gameService.userIsFollowed(this.graph, userId);
  }

  saveGame(): void {
    // cannot save game from this point, only controllers can
  }

  

  
  // CANNOT SEND SOCKET MESSAGE IF IM NOT ON CONTROL (ONLY CONTROLLER)
  private sendSocketMessage(message: any): void {
    this.socketService.sendSocketMessage(message);
  }

 
}
