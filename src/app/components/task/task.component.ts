import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
// interfaces
import { Task, TaskType, Post, User } from '../../models/game';
// components
import { PostComponent } from '../post/post.component';
import { UserComponent } from '../user/user.component';
import { OnScreenComponent } from '../on-screen/on-screen.component';
// services
import { GameService } from '../../services/game/game.service';
import { SocketService, SocketCommand } from '../../services/socket/socket.service';
// graphology
import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path/unweighted';
import { edgePathFromNodePath } from 'graphology-shortest-path/utils';



@Component({
  selector: 'app-task',
  imports: [ PostComponent, UserComponent, OnScreenComponent ],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent implements OnInit, OnDestroy {

  @Input() task!: Task;
  @Input() graph!: Graph;

  @Output() pathToTarget: EventEmitter<string[]> = new EventEmitter();

  posts: Post[] = [];
  showTo: string[] = [];
  selectedPostId: string | null = null;
  highlightedUser: string = '';
  // private graph!: Graph;

  get users(): User[] {
    return this.gameService.game.users.filter(user => user.uuid !== this.gameService.getHero().uuid);
  }

  get hero(): User {
    return this.gameService.getHero();
  }

  constructor(
    private readonly gameService: GameService,
    private readonly socketService: SocketService
  ){}

  ngOnInit(): void {
    console.log('task', this.task);
    // get task posts
    this.posts = this.task.posts.map(postId => this.gameService.getPost(postId));
    console.log('posts', this.posts);
    // this.graph = this.
  }

  ngOnDestroy(): void {
    this.graph.clear();
  }

  selectPost(postId: string): void {
    const post = this.gameService.getPost(postId);
    if (!post) return; // couldn't happen
    this.selectedPostId = postId;
    this.task.showPost = postId;
    const author = post ? post.author : null;
    const path = bidirectional(this.graph, this.gameService.getHero().uuid, author);
    if (path && path.length) {
      // emit path to parent
      this.pathToTarget.emit(path);
      // remove author from path
      path.pop();
      this.task.showTo = path;
    } else {
      this.task.showTo = [this.gameService.getHero().uuid];
    }
    this.completeTask();
  }

  getPostPath(postId: string): string[] {
    console.log('getPostPath');
    const post = this.gameService.getPost(postId);
    if (!post) return []; // couldn't happen
    const author = post ? post.author : null;
    const path = bidirectional(this.graph, this.gameService.getHero().uuid, author);
    if (path && path.length) return path;    
    return [];
  }

  notShowAny(): void {
    console.log('not show any posts', this.posts);
    this.task.showTo = [];
    this.completeTask();
  }

  selectUserForPost(userId: string): void {
    // calculate graph path
    if (this.graph) {
      // MARK: BUG
      const path = bidirectional(this.graph, this.gameService.getHero().uuid, userId);
      if (path) {
        // emit path to parent
        this.pathToTarget.emit(path);
        path.shift(); // remove hero from target
        console.warn(`🔥 path from HERO ${this.gameService.getHero().uuid} to USER ${userId}`, path);
        this.showTo = [...path];
        // this.showTo.pop(); // remove target user from path
      }
    }
    if (!this.showTo.includes(userId)) this.showTo.push(userId);
    if (this.showTo.length >= 2) {
      this.distribute();
    }
  }

  userIsOnScreen(userId: string): void {
    console.log(`user ${userId} is on screen...`);
    // send socket message to highlight on graph
    this.highlightedUser = userId;
    // compoute path from hero to this user
    if (this.graph) {
      // MARK: BUG
      // console.log('graph.nodes', this.graph.nodes());
      const path = bidirectional(this.graph, this.gameService.getHero().uuid, userId);
      // NOTE: THIS CANNOT WORK UNTIL A SYNCHRONISATION OF GAME
      if (path && path.length) {
        // emit path to parent
        this.pathToTarget.emit(path);
        this.socketService.sendSocketMessage({
          command: 'highlight-graph-path',
          data: {
            path: path
          }
        });
      }
    }
  }

  distribute(): void {
    console.log('distribute post to users: ', this.showTo);
    this.task.showTo = this.showTo;
    this.completeTask();
  }

  private completeTask(): void {
    this.pathToTarget.emit([]);
    this.task.completed = true;
    this.gameService.nextTask(this.task);
    this.notifyPeers();
  }

  private notifyPeers(): void {
    this.socketService.sendSocketMessage({
      command: 'update-game',
      data: {
        game: this.gameService.game
      }
    });
  }

  

}
