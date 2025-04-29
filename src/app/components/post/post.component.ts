import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// components
import { CommentComponent } from '../comment/comment.component';
// interfaces
import { Post, User, Game, Reaction, React } from '../../models/game';
// services
import { GameService } from '../../services/game/game.service';

@Component({
  selector: 'app-post',
  imports: [ CommonModule, CommentComponent ],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss'
})
export class PostComponent implements OnInit {

  @Input() post!: Post;

  get game(): Game {
    return this.gameService.game;
  }

  get author(): User {
    return this.gameService.getUserById(this.post.author);
  }

  get reactionTypes(): string[] {
    return Object.values(React);
  }

  constructor(
    private readonly gameService: GameService
  ){}

  ngOnInit(): void {
    
  }

  hasReactions(): boolean {
    return this.game.reactions.some(reaction => reaction.parent === this.post.uuid);
  }

  getReactionsByType(reactionType: string): Reaction[] {
    return this.game.reactions.filter(
      reaction => reaction.parent === this.post.uuid && reaction.value === reactionType
    );
  }

  getUserById(userId: string): User {
    return this.gameService.getUserById(userId);
  }
}
