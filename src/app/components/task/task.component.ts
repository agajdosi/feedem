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

  post!: Post;
  distributeTo: string[] = [];

  get users(): User[] {
    return this.gameService.game.users.filter(user => user.uuid !== this.post.author);
  }

  constructor(
    private readonly gameService: GameService,
    private readonly socketService: SocketService
  ){}

  ngOnInit(): void {
    console.log('task', this.task);
    // get taks post
    this.post = this.gameService.getPost(this.task.post);
    console.log('post', this.post);

  }

  ngOnDestroy(): void {
    
  }

  accept(): void {
    console.log('accept post', this.post);
    this.task.denied = false;
    this.completeTask();
  }

  deny(): void {
    console.log('decline post', this.post);
    this.task.denied = true;
    this.completeTask();
  }

  selectUserForPost(userId: string): void {
    this.distributeTo.push(userId);
  }

  distribute(): void {
    console.log('distribute post to users: ', this.distributeTo);
    this.task.completed = true;
    this.gameService.nextTask();
    this.notifyPeers();

  }

  private completeTask(): void {
    this.task.completed = true;
    this.gameService.nextTask();
    // update game for other users
    this.notifyPeers();
  }

  private notifyPeers(): void {
    // this.gameService.updateGame(this.);
    // update game for other users
    this.socketService.sendSocketMessage({
      command: 'update-game',
      data: {
        game: this.gameService.game
      }
    })
  }

}
