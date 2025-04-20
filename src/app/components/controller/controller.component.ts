import { Component, OnInit, OnDestroy } from '@angular/core';
// router
import { ActivatedRoute } from '@angular/router';
// models
import { Game } from '../../models/game';
// components
import { UserComponent } from '../user/user.component';
import { OnScreenComponent } from '../on-screen/on-screen.component';
import { TaskComponent } from '../task/task.component';
// services
import { SocketEvent, SocketService, SocketCommand } from '../../services/socket/socket.service';
import { GameService } from '../../services/game/game.service';
// rxjs
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-controller',
  imports: [ UserComponent, OnScreenComponent, TaskComponent ],
  templateUrl: './controller.component.html',
  styleUrl: './controller.component.scss'
})
export class ControllerComponent implements OnInit, OnDestroy {

  private gameControlSub: Subscription = new Subscription();
  private gameSub: Subscription = new Subscription();
  private socketSub: Subscription = new Subscription();

  controllable: boolean = false;
  game!: Game;
  highlightedUser: string = '';
  connectedGameInstance: string | null = '';

  constructor(
    private readonly socketService: SocketService,
    private readonly gameService: GameService,
    private readonly route: ActivatedRoute
  ){}

  ngOnInit(): void {
    // TODO: if connectedGameInstance disconnect, remove control from this controller (server side)
    this.connectedGameInstance = this.route.snapshot.queryParams['from'];
    /* 
      1. wait for game
      2. request game control
      3. if not here, choose one (-> let others know)
      -- loop start --
      4. on new post
        - if by hero, choose from users who to show (min 2)
        - if by others, choose if show to hero
      -- loop end --
    */
    // subscribe sockets
    this.socketSub = this.socketService.socketMessage.subscribe({
      next: (event: SocketEvent) => {
        console.log('got socket event', event);
      }
    });
    // subscribe game
    this.gameSub = this.gameService.gameSubject.subscribe({
      next: (game: Game) => {
        if (game && game.uuid) {
          if (!this.game || this.game.updated < game.updated) {
            this.game = game;
          }
        }
      }
    })
    // subscribe controllable from sockets
    this.gameControlSub = this.socketService.controllable.subscribe({
     next: (controllable: boolean) => this.controllable = controllable
    });
    // request control
    this.requestGameControl();
  }

  selectHero(userId: string): void {
    console.log('select HERO', userId);
    this.gameService.setHero(userId);
    this.socketService.sendSocketMessage({
      command: 'select-hero',
      data: {
        userId: userId
      }
    });
    this.gameService.nextTask();
  }

  ngOnDestroy(): void {
    this.gameControlSub.unsubscribe();
    this.gameSub.unsubscribe();
    this.socketSub.unsubscribe();
  }

  userIsOnScreen(id: string): void {
    console.log(`user ${id} is on screen...`);
    // send socket message to highlight on graph
    this.highlightedUser = id;
    const socketCommand: SocketCommand = {
      command: 'highlight-user-on-graph',
      data: {
        userId: id
      }
    }
    this.socketService.sendSocketMessage(socketCommand);
  }

  isAnyOpenTask(): boolean {
    if (!this.game.tasks.length) return false;
    for (const task of this.game.tasks) {
      if (!task.completed) return true;
    }
    return false;
  }

  private requestGameControl(): void {
    this.socketService.requestGameControl();
  }

}
