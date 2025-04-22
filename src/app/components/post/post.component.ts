import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// components
import { CommentComponent } from '../comment/comment.component';
// interfaces
import { Post, User, Game, Reaction, Comment } from '../../models/game';
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

  constructor(
    private readonly gameService: GameService
  ){}

  ngOnInit(): void {
    
  }
}
