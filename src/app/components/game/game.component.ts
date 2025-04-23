import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
// components
import { UserComponent } from '../user/user.component';
import { FeedComponent } from '../feed/feed.component';
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
    FeedComponent
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
            // TODO: update graph
            // ... add posts, mainly
            //
            console.warn('GAME SHOULD BE JUST UPDATED');
            // if length of posts
            if (this.game.tasks.length !== game.tasks.length) {
              console.warn('ADD POSTS, COMMENTS... TO GRAPH!!!', this.game.tasks, game.tasks);
              for (const t of game.tasks) {
                const taskExist = this.game.tasks.filter(task => task.uuid === t.uuid);
                console.log('taskExist?', taskExist);
                if (!taskExist.length) {
                  console.log('NEW TASK', t);
                  // 
                  const post = game.posts.filter(post => post.uuid === t.showPost)[0];
                  const author = post && post.author ? post.author : null;
                  if (post && author) {
                    const node = {};
                    (node as any)[post.uuid] = {type: 'post', x: 1, y: 1};
                    this.addGraphNodes = node;
                    // this.graph.addNode(post.uuid, {type: 'post', x: 1, y: 1});

                    if (t.type === 'showPost' && t.showTo.length) {
                      const showTo = t.showTo[0];
                      this.addGraphEdges = [
                        {source: author, target: post.uuid, attributes: {label: 'sent'}},
                        {source: post.uuid, target: showTo, attributes: {label: 'got'}}
                      ];
                    }
                    if (t.type === 'distributePost') {
                      console.warn('TODO');
                      // for (const showTo of t.showTo) {
                      //   const tmp: {source: string, target: string, attributes: any}[] = [];
                      //   let edgesSolved = 0;
                      //   this.graph.findEdge(author, post.uuid, (edge: string) => {
                      //     if (edge) {
                      //       console.log('edge already exist, add label', edge);
                      //       this.graph.setEdgeAttribute(edge, 'label', `${this.graph.getEdgeAttribute(edge, 'label')}, ${RelationType.Write}`);
                      //     } else {
                      //       tmp.push({source: author, target: post.uuid, attributes: { label: RelationType.Write}});
                      //       // const relation: Relation = {
                      //       //   source: author,
                      //       //   target: post.uuid,
                      //       //   label: RelationType.Write
                      //       // }
                      //       // this.game.relations.push(relation);
                      //     }
                      //     edgesSolved++;
                      //     if (edgesSolved === 2) {
                      //       this.addGraphEdges = tmp;
                      //     }
                      //   });
                      //   this.graph.findEdge(post.uuid, showTo, (edge: string) => {
                      //     if (edge) {
                      //       this.graph.setEdgeAttribute(edge, 'label', `${this.graph.getEdgeAttribute(edge, 'label')}, ${RelationType.Get}`);
                      //     } else {
                      //       tmp.push({source: post.uuid, target: showTo, attributes: {label: RelationType.Get}});
                      //       
                      //     }
                      //   })
                      // }
                      
                    } 
                  }
                                   
                }
                // console.log('POST TO ADD', post);
                // const record = {};
                // (record as any)[post.uuid as string] = {type: 'post', x: 1, y: 1};
                // console.log('add node record', record);
                // this.addGraphNodes = record;
              }
            }
            this.gameService.updateGame(this.game, game);
            console.log('some posts?', game.posts);
            

          } else {
            this.game = game;
            // build user graph
            console.log('this.game', this.game);
            this.graphService.buildGraph(this.game.users, this.game.relations, this.game.posts).then((graphData: GraphData | undefined) => {
              if (graphData) {
                this.graphData = graphData;
                // temp – create realtions
                // for (const edge of graphData.edges) {
                //   const relation: Relation = {
                //     source: edge.source,
                //     target: edge.target,
                //     label: RelationType.Follow
                //   }
                //   this.game.relations.push(relation);
                // }
                console.log('RELATIONS', this.game.relations);
              }
            }).catch((e: any) => console.error(e));
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
        console.log('game from server', e.data);
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
    console.log('socketCommand', c);
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
        console.log('TODO: highlight-graph-path', path);
        console.warn('debug');
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
        this.gameService.game.comments.push(c.data.comment);
        break;
      case 'reaction':
        this.gameService.game.reactions.push(c.data.reaction);
        break;
      default:
        console.log('recieved socket command', c);
    }
  }

  saveGame(): void {
    // cannot save game from this point, only controllers can
  }

  

  
  // CANNOT SEND SOCKET MESSAGE IF IM NOT ON CONTROL (ONLY CONTROLLER)
  private sendSocketMessage(message: any): void {
    this.socketService.sendSocketMessage(message);
  }

 
}
