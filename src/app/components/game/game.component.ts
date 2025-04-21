import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
// components
import { UserComponent } from '../user/user.component';
import { FeedComponent } from '../feed/feed.component';
// models
import { Game, User } from '../../models/game';
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
  clearUsersHighlight: boolean = false;
  clearConnectionsHighlight: boolean = false;
  graph!: Graph;

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
            this.gameService.updateGame(this.game, game);
            console.log('updated game', this.game);
          } else {
            this.game = game;
            // build user graph
            console.log('this.game', this.game);
            this.graphService.buildGraph(this.game.users, this.game.relations, this.game.posts).then((graphData: GraphData | undefined) => {
              if (graphData) this.graphData = graphData;
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
    const now = Date.now();
    const link = `${location.protocol}//${location.host}/controller?from=${mySocketId}&time=${now}`;
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

  _development_generatePost(): void {
    this.llmsService.generatePost(this.game.users[0]);
  }

  _development_ratePost(): void {
    this.llmsService.ratePost(this.game.posts[0], this.game.users[0]);
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
      case 'highlight-user-on-graph':
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
      case 'select-hero':
        this.gameService.setHero(c.data.userId);
        break;
      case 'update-game':
        this.gameService.gameSubject.next(c.data.game);
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
