import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// interfaces
import { Post, User } from '../../models/game';
// services
import { GameService } from '../../services/game/game.service';

@Component({
  selector: 'app-post',
  imports: [ CommonModule ],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss'
})
export class PostComponent implements OnInit {

  @Input() post!: Post;

  constructor(
    private readonly gameService: GameService
  ){}

  ngOnInit(): void {
    
  }

  getPostAuthor(): User {
    return this.gameService.getUserById(this.post.author);
  }
}
