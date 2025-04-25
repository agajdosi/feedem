import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
// router
import { ActivatedRoute } from '@angular/router';
// models
import { Game, Reaction, Comment, Task, User, Relation, RelationType } from '../../models/game';
// components
import { UserComponent } from '../user/user.component';
import { OnScreenComponent } from '../on-screen/on-screen.component';
import { TaskComponent } from '../task/task.component';
// services
import { SocketEvent, SocketService, SocketCommand } from '../../services/socket/socket.service';
import { GameService } from '../../services/game/game.service';
import { GraphService } from '../../services/graph/graph.service';
// rxjs
import { Subscription } from 'rxjs';
// timer
import { CountDownTimerService, TimerData } from '@tomaszatoo/ngx-timer';
// graphology
import Graph from 'graphology';
import { GraphData } from '@tomaszatoo/graph-viewer';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-controller',
  imports: [ UserComponent, OnScreenComponent, TaskComponent, FooterComponent ],
  templateUrl: './controller.component.html',
  styleUrl: './controller.component.scss'
})
export class ControllerComponent implements OnInit, OnDestroy {

  private gameControlSub: Subscription = new Subscription();
  private gameSub: Subscription = new Subscription();
  private socketSub: Subscription = new Subscription();
  private commentsSub: Subscription = new Subscription();
  private reactionsSub: Subscription = new Subscription();
  private taskSub: Subscription = new Subscription();

  canControl: boolean = false;
  game!: Game;
  highlightedUser: string = '';
  private connectedGameInstance: string | null = '';
  private connectionValidFrom!: number;
  private maxIdleTime: number = 5 * 60 * 1000;
  countDownTimer!: TimerData;
  socialGraph: Graph = new Graph({
    multi: false,
    allowSelfLoops: true,
    type: 'directed'
  });
  private graph: Graph = new Graph({
    multi: false,
    allowSelfLoops: true,
    type: 'directed'
  });
  pathToTarget: string[] = [];

  constructor(
    private readonly socketService: SocketService,
    private readonly gameService: GameService,
    private readonly route: ActivatedRoute,
    private readonly countDown: CountDownTimerService,
    private readonly graphService: GraphService
  ){}

  ngOnInit(): void {
    // from is the instance of the game from which a controller took a link..., if this instance will close the controller should stop working as well
    this.connectedGameInstance = this.route.snapshot.queryParams['from'];
    this.connectionValidFrom = parseInt(this.route.snapshot.queryParams['valid']);
    // check the validity of connection first, otherwise do not allow to start controllers' initialisation and control request
    console.log('valid', this.connectionValidFrom);
    console.log('Date.now() - this.connectionValidFrom', Date.now() - this.connectionValidFrom);

    if (this.connectionValidFrom && Date.now() - this.connectionValidFrom < 2 * 60 * 1000 ) {
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
        next: (e: SocketEvent) => {
          // console.log('socket message in controller', e);
          switch (e.type) {
            case 'disconnected':
              // console.log('someone is disconnected -> check if it is (not) controlled game instance');
              // if disconnected instance is the instance of that controller was taken from, controller should stop working
              // console.log('disconnected instance', e.data.id);
              // console.log('game instance taken control from', this.connectedGameInstance);
              if (e.data.id === this.connectedGameInstance) {
                this.canControl = false;
                this.socketService.destroy();
              }
              break;
            case 'game': 
            if (e.data && e.data.uuid) {
              // console.log('GOT GAME', e.data);
              this.gameService.gameSubject.next(e.data);
              // this.game = e.data;
              // this.buildGraphs();
              // this.game = e.data;
              // if (this.game) {
                // console.error('TBD:', 'CANNOT SET GAME FROM SERVER', this.game, e.data);
                // this.gameService.updateGame(this.game, e.data);
                // console.log('this.game after update', this.game);
              // }
              // this.gameService.gameSubject.next(e.data)
            };
            break;
            default:
              console.log('got socket event', e);
          }
        }
      });
      // subscribe game
      this.gameSub = this.gameService.gameSubject.subscribe({
        next: (game: Game) => {
          // console.warn('GAME UPDATE...');
          if (game && game.uuid) {
            if (!this.game) {
              this.game = game;
              this.game.created = Date.now();
              // calculate graph
              console.warn('GRAPH SHOULD BE CALCULATED FROM REAL RELATIONS, NOT A RANDOM ONE...');
            } else {
              console.warn('GAME EXIST AND SHOULD BE ONLY UPDATED...');
              this.gameService.updateGame(this.game, game);
            }
            console.warn('HERO?', this.game.hero);
            this.buildGraphs();
          }
          
        }
      })
      // subscribe controllable from sockets
      this.gameControlSub = this.socketService.canControl.subscribe({
        next: (canControl: boolean) => this.canControl = canControl
      });
      // request control
      this.requestGameControl();
      // subscribe reactions
      this.reactionsSub = this.gameService.onReaction.subscribe({
        next: (reaction: Reaction) => {
          // send to socket
          // console.log('got new reaction', reaction);
          // create RELATION (for reaction, it should be existing edge)
          // 1. find RELATION
          const relation = this.game.relations.find(relation => relation.source === reaction.parent && relation.target === reaction.author);
          // update relation label to reaction
          if (relation && relation.label) relation.label = reaction.value;
          
          this.sendGameToPeers();
          // notify peers about reaction
          this.socketService.sendSocketMessage({
            command: 'reaction',
            data: {
              reaction: reaction
            }
          })
        }
      });
      // subscribe comments
      this.commentsSub = this.gameService.onComment.subscribe({
        next: (comment: Comment) => {
          // send to socket
          console.log('got new comment', comment);
          // create RELATION
          const relationToComment: Relation = {
            source: comment.author,
            target: comment.uuid,
            label: RelationType.Write
          }
          const relationToPost: Relation = {
            source: comment.uuid,
            target: comment.parent,
            label: RelationType.Comment
          }
          this.game.relations.push(relationToComment, relationToPost); 
          // console.error('CREATE REALTION FOR COMMENT', comment, [relationToComment, relationToPost]);
          this.sendGameToPeers();
          // notify peers about comment
          this.socketService.sendSocketMessage({
            command: 'comment',
            data: {
              comment: comment
            }
          })
        }
      });
      // subscribe tasks (complete)
      this.taskSub = this.gameService.onTask.subscribe({
        next: (task: Task) => {
          console.log('on task', task);
          // notify peers about task
          this.socketService.sendSocketMessage({
            command: 'task',
            data: {
              task: task
            }
          });
        }
      })
    }
  }

  ngOnDestroy(): void {
    this.countDown.stop();
    this.gameControlSub.unsubscribe();
    this.gameSub.unsubscribe();
    this.socketSub.unsubscribe();
    this.socketService.destroy();
    window.removeEventListener('click', this.userInteractionHandler);
    window.removeEventListener('scroll', this.userInteractionHandler);
    this.commentsSub.unsubscribe();
    this.reactionsSub.unsubscribe();
    this.taskSub.unsubscribe();
  }

  private userInteractionHandler(): void {
    this.restartCountDown();
  }

  private buildGraphs(): void {
    if (this.game) {
      this.graphService.buildGraph(this.game, true).then((graphData: GraphData | undefined) => {
        if (graphData) {
          console.log('recalculating socialGraph...', graphData);
          this.socialGraph.clear();
          for (const node of graphData.nodes) this.socialGraph.addNode(node.id, node.attributes ? node.attributes : {});
          for (const edge of graphData.edges) this.socialGraph.addEdge(edge.source, edge.target);
        }
      });
      this.graphService.buildGraph(this.game, false).then((graphData: GraphData | undefined) => {
        if (graphData) {
          console.log('recalculating complete graph...', graphData);
          this.graph.clear();
          for (const node of graphData.nodes) this.graph.addNode(node.id, node.attributes ? node.attributes : {});
          for (const edge of graphData.edges) this.graph.addEdge(edge.source, edge.target);
        }
      });
    }
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
        // console.log('countDown complete', this.countDownTimer)
      }
    });
  }

  private sendGameToPeers(): void {
    this.socketService.sendSocketMessage({
      command: 'update-game',
      data: {
        game: this.game
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
    this.sendGameToPeers();
    this.gameService.nextTask(this.game.tasks[0]);
  }

  increaseFictionalTime(milliseconds: number): void {
    this.gameService.increaseFictionalTime(milliseconds);
    this.socketService.sendSocketMessage({
      command: 'set-fictional-time',
      data: {
        ftime: this.gameService.getFictionalTime()
      }
    });
  }

  onPathToTarget(path: string[]): void {
    console.log('path to target', path);
    this.pathToTarget = path;
  }

  usersByNeighbours(): User[] {
    if (!this.socialGraph.nodes().length) return [];
    return this.game.users.sort((a: User, b: User) => {
      const neigboursA = this.socialGraph.neighbors(a.uuid).length;
      const neigboursB = this.socialGraph.neighbors(b.uuid).length;
      return neigboursA - neigboursB;
    });
  }

  // userConnections(userId: string): string[] {
  //   if (!this.socialGraph.nodes().length) return [];
  //   const neighbours = this.socialGraph.outNeighbors(userId);
  //   if (neighbours.length) return neighbours;
  //   return [];
  // }

  userFollow(userId: string): string[] {
    return this.gameService.userIsFollowing(this.socialGraph, userId);
  }
  userIsFollowed(userId: string): string[] {
    return this.gameService.userIsFollowed(this.socialGraph, userId);
  }
  

  userIsOnScreen(id: string): void {
    console.log(`user ${id} is on screen...`);
    // send socket message to highlight on graph
    this.highlightedUser = id;
    const socketCommand: SocketCommand = {
      command: 'highlight-graph-user',
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
