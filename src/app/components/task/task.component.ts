import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
// interfaces
import { Task, TaskType, Post, User } from '../../models/game';
// components
import { PostComponent } from '../post/post.component';
import { UserComponent } from '../user/user.component';
import { OnScreenComponent } from '../on-screen/on-screen.component';
// services
import { GameService } from '../../services/game/game.service';
// graphology
import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path/unweighted';



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
    private readonly gameService: GameService
  ){}

  ngOnInit(): void {
    console.log('task', this.task);
    // get task posts
    this.posts = this.task.posts.map(postId => this.gameService.getPost(postId));
    console.log('posts', this.posts);
    // TODO
    // save game whenever a new task is initialised (previous task was completed, if this will stay open, will see what happen)
    if (this.gameService.game) {
      this.gameService.saveGame(this.gameService.game);
    }
  }

  ngOnDestroy(): void {
    this.graph.clear();
  }

  selectPost(postId: string): void {
    if (!this.graph.nodes().length || !this.gameService.getHero()) return;
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

  private getPostPath(postId: string): string[] {
    if (!this.graph.nodes().length || !this.gameService.getHero()) return [];
    // console.log('getPostPath');
    const post = this.gameService.getPost(postId);
    if (!post) return []; // couldn't happen
    const author = post ? post.author : null;
    const path = bidirectional(this.graph, this.gameService.getHero().uuid, author);
    if (path && path.length) return path;    
    return [];
  }

  // userConnections(userId: string): string[] {
  //   if (!this.graph) return [];
  //   const neighbours = this.graph.outNeighbors(userId);
  //   if (neighbours.length) return neighbours;
  //   return [];
  // }
  userFollow(userId: string): string[] {
    return this.gameService.userIsFollowing(this.graph, userId);
  }
  userIsFollowed(userId: string): string[] {
    return this.gameService.userIsFollowed(this.graph, userId);
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
    if (this.graph.nodes().length) {
      // MARK: BUG
      // console.log('graph.nodes', this.graph.nodes());
      const path = bidirectional(this.graph, this.gameService.getHero().uuid, userId);
      // NOTE: THIS CANNOT WORK UNTIL A SYNCHRONISATION OF GAME
      if (path && path.length) {
        // emit path to parent
        this.pathToTarget.emit(path);
        this.gameService.sendGameMessage({
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

  getUserInvolved(postId: string): string {
    const path = this.getPostPath(postId);
    // return `${path.length - 1} User${path.length - 1 > 1 ? 's' : ''} on path`;
    return this.gameService.usersOnPathNotification(path);
  }

  private completeTask(): void {
    this.pathToTarget.emit([]);
    this.task.completed = true;
    this.gameService.nextTask(this.task);
    this.notifyPeers();
    // BUG: DON'T KNOW WHY, BUT HERE THE NOTIFICATION ABOUT TASK WORKS FOR THE GAME, NOR IN GAME.SERVICE
    this.gameService.createPostRelations(this.task);
    this.gameService.onTask.next(this.task);
  }

  private notifyPeers(): void {
    this.gameService.sendGameMessage({
      command: 'update-game',
      data: {
        game: this.gameService.game
      }
    });
  }

  

}
