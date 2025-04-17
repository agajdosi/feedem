import { Component, OnInit, OnDestroy } from '@angular/core';
// components
import { UserComponent } from '../user/user.component';
import { FeedComponent } from '../feed/feed.component';
// models
import { Game, User } from '../../models/game';
import { GraphNode } from '../../models/graph-node';
import { GraphEdge } from '../../models/graph-edge';
// services
import { SocketService, SocketEvent } from '../../services/socket/socket.service';
import { HttpService } from '../../services/http/http.service';
import { GameService } from '../../services/game/game.service';
import { GraphService } from '../../services/graph/graph.service';
// rxjs
import { Subscription } from 'rxjs';
// qr
import { QrCodeComponent } from 'ng-qrcode';
// user
import { ScoreComponent } from '../score/score.component';
import { LlmsService } from '../../services/llms/llms.service';
// graph
import {
  GraphViewerComponent,
  GraphLayoutSettings,
  GraphData
} from '@tomaszatoo/graph-viewer';

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

  game!: Game;

  private socketSub: Subscription = new Subscription();
  private gameControllableSub: Subscription = new Subscription();
  private gameSub: Subscription = new Subscription();

  renderNode = this.createNodeRenderer();
  renderEdge = this.createEdgeRenderer();

  constructor(
    private readonly socketService: SocketService,
    private readonly httpService: HttpService,
    private readonly gameService: GameService,
    private readonly llmsService: LlmsService,
    private readonly graphService: GraphService
  ) {
    this.graphLayoutSettings = this.graphService.layoutSettings;
  }

  ngOnInit(): void {
    // subscribe game json
    this.gameService.game.subscribe({
      next: (game: Game) => {
        if (game && game.uuid) {
          if (this.game && game.updated > this.game.updated || !this.game) {
            this.game = game;
            // build user graph
            console.log('this.game', this.game);
            this.graphService.buildGraph(this.game.users, this.game.relationships, this.game.posts).then((graphData: GraphData | undefined) => {
              if (graphData) this.graphData = graphData;
            }).catch((e: any) => console.error(e));
          } 
        }
      }
    })
    // get initial game json
    // this.httpService.get<Game>('/initial-game.json').subscribe({
    //   next: (game: Game) => {
    //     // console.log('initial game', game);
    //     if (game && game.uuid) this.gameService.game.next(game);
    //   }
    // });
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
    for (const user of this.game.users) {
      if (user.uuid === id) return user;
    }
    return undefined;
  }

  ngOnDestroy(): void {
    this.socketSub.unsubscribe();
    this.gameControllableSub.unsubscribe();
    this.gameSub.unsubscribe();
  }

  requestGameControl(): void {
    this.socketService.requestGameControl();
  }

  getControllerLink(): string {
    const location = window.location;
    const link = `${location.protocol}//${location.host}/controller`;
    // console.log(link);
    return link;
  }

  openController(): void {
    const link = this.getControllerLink();
    window.open(link, '_blank');
  }

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
        if (e.data && e.data.uuid) this.gameService.game.next(e.data);
        break;
      default:
        console.log('recieved socket event', e);
    }
  }

  saveGame(): void {

  }

  

  

  private sendSocketMessage(message: any): void {
    this.socketService.sendSocketMessage(message);
  }

 
}
