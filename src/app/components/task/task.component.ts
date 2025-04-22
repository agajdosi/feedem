import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
// interfaces
import { Task, TaskType, Post, User } from '../../models/game';
// components
import { PostComponent } from '../post/post.component';
import { UserComponent } from '../user/user.component';
// services
import { GameService } from '../../services/game/game.service';
import { SocketService } from '../../services/socket/socket.service';
// graphology
import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path/unweighted';



@Component({
  selector: 'app-task',
  imports: [ PostComponent, UserComponent ],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent implements OnInit, OnDestroy {

  @Input() task!: Task;
  @Input() graph!: Graph;

  posts: Post[] = [];
  showTo: string[] = [];
  selectedPostId: string | null = null;
  // private graph!: Graph;

  get users(): User[] {
    return this.gameService.game.users.filter(user => user.uuid !== this.gameService.getHero().uuid);
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
    
  }

  selectPost(postId: string): void {
    this.selectedPostId = postId;
    this.task.showPost = postId;
    if (this.task.type === 'showPost') {
      this.task.showTo = [this.gameService.getHero().uuid];
      this.completeTask();
    }
  }

  notShowAny(): void {
    console.log('not show any posts', this.posts);
    this.task.showTo = [];
    this.completeTask();
  }

  selectUserForPost(userId: string): void {
    // calculate graph path
    if (this.graph) {
      const path = bidirectional(this.graph, this.gameService.getHero().uuid, userId);
      if (path) {
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

  distribute(): void {
    console.log('distribute post to users: ', this.showTo);
    this.task.showTo = this.showTo;
    this.completeTask();
  }

  private completeTask(): void {
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
    })
  }

  // nextTask(): void {
  //   this.task.completed;
  //   this.gameService.nextTask();
  //   // rate post
  // }

}
