import { Component, Input } from '@angular/core';
import { Comment, User } from '../../models/game';
// services
import { GameService } from '../../services/game/game.service';

@Component({
  selector: 'app-comment',
  imports: [],
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
