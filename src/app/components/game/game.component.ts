import { Component, OnInit, OnDestroy } from '@angular/core';
// components
import { UserComponent } from '../user/user.component';
import { FeedComponent } from '../feed/feed.component';
import { ScreensaverComponent } from '../screensaver/screensaver.component';
// models
import { Game, User, Relation, RelationType } from '../../models/game';
import { GraphNode } from '../../models/graph-node';
import { GraphEdge } from '../../models/graph-edge';
// services
import { SocketEvent, SocketCommand } from '../../services/socket/socket.service';
import { GameService } from '../../services/game/game.service';
import { GraphService } from '../../services/graph/graph.service';
// rxjs
import { Subscription } from 'rxjs';
// qr
import { QrCodeComponent } from 'ng-qrcode';
// utils
import * as utils from '../../shared/utils';
// user
import { FooterComponent } from '../footer/footer.component';
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
    FooterComponent,
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
  selectUser: string = '';
  clearUsersHighlight: {clear: boolean} = {clear: false};
  clearUserSelection: {clear: boolean} = {clear: false};
  clearConnectionsHighlight: {clear: boolean} = {clear: false};
  graph!: Graph;
  addGraphNodes: Record<string, any> = {}
  addGraphEdges: ReadonlyArray<{
    source: string;
    target: string;
    attributes: any;
  }> | null = null;
  private linkValidFrom: number = Date.now();
  private linkValidityInterval: any;
  private snapToHeroInterval: any;

  snapToNode: string | undefined = undefined;
  snapToCenter: boolean = false;

  game!: Game;

  private zoomScale: number = 0.8;
  zoom: any = { scale: this.zoomScale, center: true };
  

  private gameMessageSub: Subscription = new Subscription();
  private gameControllableSub: Subscription = new Subscription();
  private gameSub: Subscription = new Subscription();
  private buildedFromUpdate: boolean = false;
  private heroSelected: boolean = false;

  private nodesStorage: any = {};

  renderNode = this.createNodeRenderer();
  renderEdge = this.createEdgeRenderer();

  get nodesCount(): number {
    if (this.graph && this.graph.nodes().length) {
      return this.graph.nodes.length;
    }
    return 0;
  }

  get heroId(): string {
    if (this.game && this.game.hero) {
      return this.game.hero;
    }
    return '';
  } 

  constructor(
    private readonly gameService: GameService,
    private readonly graphService: GraphService
  ) {
    this.graphLayoutSettings = this.graphService.layoutSettings;
  }

  // MARK: INIT
  ngOnInit(): void {
    // update validity of link each 60s (controller has 2mins)
    this.linkValidityInterval = setInterval(() => {
      this.linkValidFrom = Date.now();
    }, 60 * 1000);
    // this.snapToHeroInterval = setInterval(() => {
    //   if (this.game && this.game.hero) {
    //     this.snapToUser(this.game.hero);
    //   }
    // }, 10 * 1000);
    // subscribe game json
    this.gameService.gameSubject.subscribe({
      next: (game: Game) => {
        if (game && game.uuid) {
          if (this.game/*  && game.updated > this.game.updated */) {
            // sync graph with new game (posts, comments, reactions)
            this.updateExistingGame(game);
            // this.buildGraphDataFromGame(this.game);
            if (!this.buildedFromUpdate) {
              this.buildGraphDataFromGame(this.game);
              this.selectHero();
              console.log('build graph with relations.length', game.relations.length);
            }
            this.buildedFromUpdate = true;
          } else {
            
            // set new game object
            this.game = game;
            console.log('updated game relations.length', game.relations.length);      
          }
          //console.warn('GOT GAME, IS HERO?', this.game.hero);
          if (this.game.hero) {
            setTimeout(() => {
              this.snapToUser(this.game.hero);
            }, 10 * 1000);
          }
          
        }
      }
    })
    // listen to all client messages
    this.gameMessageSub = this.gameService.gameMessage.subscribe({
      next: (e: SocketEvent) => this.gameMessageHandler(e)
    });
    // is game controllable? (can I take control?)
    this.gameControllableSub = this.gameService.controllable.subscribe({
      next: (controllable: boolean) => {
        this.controllable = controllable;
      }
    })
  }

  // MARK: DESTROY
  ngOnDestroy(): void {
    // window.removeEventListener('beforeunload', this.notifyUsersAboutLeaving);
    this.gameMessageSub.unsubscribe();
    this.gameControllableSub.unsubscribe();
    this.gameSub.unsubscribe();
    clearInterval(this.snapToHeroInterval);
    clearInterval(this.linkValidityInterval);
  }

  getUserById(id: string): User | undefined {
    return utils.getUserById(id, this.game.users);
  }

  // MARK: CONTROL LINK
  // requestGameControl(): void {
  //   this.gameService.requestGameControl();
  // }

  getControllerLink(): string {
    const location = window.location;
    const myGameId = this.gameService.gameId;
    console.log('getControllerLink location', location);
    const link = `${location.href.replace('game', 'controller')}?from=${myGameId}&valid=${this.linkValidFrom}`;
    // console.log(link);
    return link;
  }

  openController(): void {
    const link = this.getControllerLink();
    window.open(link, '_blank');
  }

  

  // MARK: GRAPH BUILD/SYNC

  graphUpdated(graph: Graph): void {
    if (!this.graph) console.log('graphInitialised', graph);
    if (this.graph) console.log('graphUpdated', graph);
    if (graph) this.graph = graph;
    if (this.game.hero) {
      // console.log('graph updated -> select hero', this.game.hero);
      this.selectHero();
    }
    this.zoom = { scale: this.zoomScale - (this.nodesCount / 80), center: true };
  }
  private buildGraphDataFromGame(game: Game): void {
    // build user graph
    // console.log('game', game);
    this.graphService.buildGraph(game).then((graphData: GraphData | undefined) => {
      if (graphData) {
        this.graphData = graphData;
        console.warn('NODES COUNT: ', graphData.nodes.length);
        console.warn('EDGES COUNT: ', graphData.edges.length);
        // console.log('RELATIONS', this.game.relations);
      }
    }).catch((e: any) => console.error(e));
  }

  private updateExistingGame(game: Game): void {
    // TODO: update graph
    // ... add posts, mainly
    //
    console.warn('GAME SHOULD BE JUST UPDATED:::tasks to update?', game.tasks, this.game.tasks);
    // update game object
    this.gameService.updateGame(this.game, game);
  }

  // MARK: GRAPH RENDERERS
  private createNodeRenderer() {
    return ({ node, attributes, position }: any) => {
      const nodeGfx = new GraphNode(node, position, attributes);
      this.nodesStorage[node] = nodeGfx;
      // console.log('nodesStorage', this.nodesStorage);
      return nodeGfx;
    };
  }

  private createEdgeRenderer() {
    return ({edge, attributes, targetSize}: any) => {
      return new GraphEdge(edge, {source: {x: 1, y: 1}, target: {x: 1, y: 1}}, attributes, targetSize);
    }
  }

  private gameMessageHandler(e: SocketEvent): void {
    switch (e.type) {
      case 'game':
        // console.log('game from server', e.data);
        if (e.data && e.data.uuid) this.gameService.gameSubject.next(e.data); // TODO: update game, not replace
        break;
      case 'message':
        this.gameCommandsHandler(e.data);
        break;
      default:
        console.log('recieved socket event', e);
    }
  }

  private gameCommandsHandler(c: SocketCommand): void {
    // console.log('socketCommand', c);
    switch (c.command) {
      case 'highlight-graph-user':
        this.highlighGraphUser(c.data.userId, true);
        break;
      case 'highlight-graph-path':
        this.highlightGraphPath(c.data.path);
        break;
      case 'select-hero':
        this.gameService.setHero(c.data.userId);
        this.snapToUser(this.gameService.getHero().uuid);
        this.selectHero();
        break;
      case 'update-game':
        this.gameService.gameSubject.next(c.data.game);
        break;
      case 'comment':
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
          edges.push({source: author, target: comment.uuid, attributes: { label: RelationType.Write, colors: { label: 0xdddddd} }});
          // comment to post
          edges.push({source: comment.uuid, target: comment.parent, attributes: { label: RelationType.Comment, colors: { label: 0xdddddd} }})
          // add to graph
          this.addGraphEdges = edges;
          // rehighlight hero
          // this.selectHero();
          // clear edge highlights
          this.clearConnectionsHighlight = {clear: true};
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
            this.graph.findEdge(reaction.author, post.uuid, (edge: string) => {
              console.log('EDGE FOUND', edge);
              if (edge) {
                // update edge label
                // remove label and create again with different label
                this.graph.dropEdge(edge);
                this.addGraphEdges = [{source: post.uuid, target: reaction.author, attributes: { label: reaction.value, colors: { label: 0xdddddd} }}];
              }
            })
          }
          // clear edge hightlights
          this.clearConnectionsHighlight = {clear: true};
        }
        break;
      case 'task':
        // console.log('NEW TASK', c.data.task);
        // add post to graph
        const task = c.data.task;
        const post = this.gameService.getPost(task.showPost);
        if (post) {
          // clear path highlight
          this.clearConnectionsHighlight = { clear: true };
          // clear users highlight
          this.clearUsersHighlight = { clear: true };
          //
          const author = post.author;
          const node = {};
          (node as any)[post.uuid] = {x: 1, y: 1, type: 'post'}
          this.addGraphNodes = node;
          // create edges
          const edges = [];
          // from author to post
          edges.push({source: author, target: post.uuid, attributes: {label: RelationType.Write, colors: { label: 0xdddddd} }});
          for (const readerId of task.showTo) {
            // from post to readers
            edges.push({source: post.uuid, target: readerId, attributes: {label: RelationType.Get, colors: { label: 0xdddddd} }})
          }
          this.addGraphEdges = edges;
          // this.selectHero();
        } else {
          console.error('POST NOT FOUND', task.showPost);
        }
        break;
      case 'set-fictional-time':
        this.gameService.setFictionalTime(c.data.ftime);
        break;
      default:
        console.warn('recieved unexpectedsocket command', c);
    }
  }
  

  userFollow(userId: string): string[] {
    return this.gameService.userIsFollowing(this.graph, userId);
  }
  userIsFollowed(userId: string): string[] {
    return this.gameService.userIsFollowed(this.graph, userId);
  }

  // MARK: GRAPH HIGHLIGHTING
  private highlighGraphUser(userId: string, withConnections: boolean = false): void {
    if (!this.graph) return;
    this.clearUsersHighlight = {clear: true};
    this.clearConnectionsHighlight = {clear: true};
    // console.log('highlightGraphUser', userId);
    setTimeout(() => {
      this.highlightUser = userId;
      if (withConnections) {
        const connections: string[] = [];
        this.graph.findEdge(userId, (edge: string, attributes: any) => {
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
      }
      
    }, 10);
  }

  private highlightGraphPath(path: string[]): void {
    if (!this.graph) return;
    this.clearConnectionsHighlight = {clear: true};
    this.highlightUsersConnection = undefined;
    // console.warn('highlightGraphPath', path);
    let highlightInterval: any;
    let edgeIndex: number = 0;
    const highlightEdge = (edges: string[]) => {
      this.highlightUsersConnection = edges[edgeIndex];
      edgeIndex++;
      if (edgeIndex === edges.length) clearInterval(highlightInterval); // 'comlete path highlighted'
    }
    const edges: string[] = [];
    for (let i = 0; i < path.length; i++) {
      if (path[i + 1]) {
        const source = path[i];
        const target = path[i+1];
        this.graph.findEdge(source, target, (edge: string) => {
          edges.push(edge);
          if (edges.length === path.length - 1) {
            // console.log('EDGES FOUND', edges);
            highlightInterval = setInterval(() => highlightEdge(edges), 10);
          }
        });
      }
    }
    this.highlighGraphUser(path[path.length - 1]);
  }

  // MARK: GRAPH SELECT
  private selectHero(): void {
    if (!this.graph || !this.game) return;
    if (this.heroSelected) return;
    // console.log('selectHero', 'hero selected?', this.heroSelected);
    if (this.nodesStorage[this.game.hero]) {
      this.nodesStorage[this.game.hero].select = true;
      this.heroSelected = true;
    }
  }

  // MARK: GRAPH SNAP
  private snapToUser(userId: string): void {
    if (!this.graph) return;
    console.log('snap to user', userId);
    this.snapToCenter = false;
    this.snapToNode = undefined;
    setTimeout(() => this.snapToNode = userId, 100);
  }

  log(key: any, value: any): void {
    console.log(key, value);
  }

  // saveGame(): void {
  //   // cannot save game from this point, only controllers can
  // }
  
  // CANNOT SEND SOCKET MESSAGE IF IM NOT ON CONTROL (ONLY CONTROLLER)
  // private sendSocketMessage(message: any): void {
  //   this.socketService.sendSocketMessage(message);
  // }

 
}
