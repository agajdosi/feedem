import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
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
// timer
import { CountDownTimerService, TimerData } from '@tomaszatoo/ngx-timer';

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

  canControl: boolean = false;
  game!: Game;
  highlightedUser: string = '';
  private connectedGameInstance: string | null = '';
  private maxIdleTime: number = 2 * 60 * 1000;
  countDownTimer!: TimerData;


  constructor(
    private readonly socketService: SocketService,
    private readonly gameService: GameService,
    private readonly route: ActivatedRoute,
    private readonly countDown: CountDownTimerService,
  ){}

  ngOnInit(): void {
    // TODO: if connectedGameInstance disconnect, remove control from this controller (server side)
    this.connectedGameInstance = this.route.snapshot.queryParams['from'];
    this.restartCountDown();
    
    window.addEventListener('click', this.userInteractionHandler.bind(this));
    window.addEventListener('scroll', this.userInteractionHandler.bind(this))
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
        switch (event.type) {
          case 'disconnected':
            console.log('someone is disconnected -> check if it is (not) controlled game instance');
            if (event.data.id === this.connectedGameInstance) {
              this.canControl = false;
              this.socketService.destroy();
            }
            break;
          default:
            console.log('got socket event', event);
        }
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
    this.gameControlSub = this.socketService.canControl.subscribe({
     next: (canControl: boolean) => this.canControl = canControl
    });
    // request control
    this.requestGameControl();
  }

  private userInteractionHandler(): void {
    this.restartCountDown();
  }

  private restartCountDown(): void {
    this.countDown.start(0, this.maxIdleTime, 'm', 1);
    const subscription = this.countDown.getObservable().subscribe({
      next: (data: TimerData) => {
        this.countDownTimer = data;
        // console.log('DOWN:', data)
      },
      complete: () => {
        subscription.unsubscribe();
        /* this.canControl = false;
        this.socketService */
        if (this.countDownTimer.valueNumber === 0) { // time passed
          this.canControl = false;
          this.socketService.destroy();
        }
        console.log('countDown complete', this.countDownTimer)
      }
    });
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
    this.countDown.stop();
    this.gameControlSub.unsubscribe();
    this.gameSub.unsubscribe();
    this.socketSub.unsubscribe();
    this.socketService.destroy();
    window.removeEventListener('click', this.userInteractionHandler);
    window.removeEventListener('scroll', this.userInteractionHandler)
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
