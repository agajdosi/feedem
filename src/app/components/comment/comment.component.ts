import { Component, Input } from '@angular/core';
import { Comment, User } from '../../models/game';
import { DatePipe } from '@angular/common';
// services
import { GameService } from '../../services/game/game.service';

@Component({
  selector: 'app-comment',
  imports: [DatePipe],
  providers: [DatePipe],
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.scss'
})
export class CommentComponent {

  @Input() comment!: Comment;

  get author(): User {
    return this.gameService.getUserById(this.comment.author);
  }

  constructor(
    private gameService: GameService
  ){}

}
