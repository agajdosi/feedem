import { Component, OnInit, OnDestroy } from '@angular/core';
// components
import { UserComponent } from '../user/user.component';
// models
import { Game } from '../../models/game';
// services
import { SocketService, SocketEvent } from '../../services/socket/socket.service';
import { HttpService } from '../../services/http/http.service';
import { GameService } from '../../services/game/game.service';
// rxjs
import { Subscription } from 'rxjs';
// qr
import { QrCodeComponent } from 'ng-qrcode';
// user
import { User } from '../../models/game';
import { ScoreComponent } from '../score/score.component';
import { LlmsService } from '../../services/llms/llms.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [ UserComponent, QrCodeComponent, ScoreComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  
  controllable: boolean = false;

  game!: Game;

  private socketSub: Subscription = new Subscription();
  private gameControllableSub: Subscription = new Subscription();
  private gameSub: Subscription = new Subscription();

  constructor(
    private readonly socketService: SocketService,
    private readonly httpService: HttpService,
    private readonly gameService: GameService,
    private readonly llmsService: LlmsService
  ) {}

  ngOnInit(): void {
    // subscribe game json
    this.gameService.game.subscribe({
      next: (game: Game) => {
        if (game && game.uuid) {
          if (this.game && game.updated > this.game.updated || !this.game) {
            this.game = game;
          } 
        }
        console.log('this.game', this.game);
      }
    })
    // get initial game json
    this.httpService.get<Game>('/initial-game.json').subscribe({
      next: (game: Game) => {
        // console.log('initial game', game);
        if (game && game.uuid) this.gameService.game.next(game);
      }
    });
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
