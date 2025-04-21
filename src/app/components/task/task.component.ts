import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
// interfaces
import { Task, TaskType, Post, User } from '../../models/game';
// components
import { PostComponent } from '../post/post.component';
import { UserComponent } from '../user/user.component';
// services
import { GameService } from '../../services/game/game.service';
import { SocketService } from '../../services/socket/socket.service';

@Component({
  selector: 'app-task',
  imports: [ PostComponent, UserComponent ],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent implements OnInit, OnDestroy {

  @Input() task!: Task;

  posts: Post[] = [];
  showTo: string[] = [];
  selectedPostId: string | null = null;

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
    this.showTo.push(userId);
    if (this.showTo.length >= 2) {
      this.distribute();
    }
  }

  distribute(): void {
    console.log('distribute post to users: ', this.showTo);
    this.task.completed = true;
    this.task.showTo = this.showTo;
    this.gameService.nextTask(this.task);
    this.notifyPeers();
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
