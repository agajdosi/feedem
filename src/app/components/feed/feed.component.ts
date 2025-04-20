import { Component, OnInit, OnDestroy } from '@angular/core';
// interfaces
import { Game, Post } from '../../models/game';
// components
import { PostComponent } from '../post/post.component';
// services
import { GameService } from '../../services/game/game.service';
// rxjs
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-feed',
  imports: [ PostComponent ],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit, OnDestroy {

  game!: Game;
  private gameSub: Subscription = new Subscription();

  constructor(
    private readonly gameService: GameService
  ){}

  ngOnInit(): void {
    this.gameSub = this.gameService.gameSubject.subscribe({
      next: (game: Game) => this.game = game
    });
  }

  getPost(id: string): Post {
    return this.gameService.getPost(id);
  }

  ngOnDestroy(): void {
    this.gameSub.unsubscribe();
  }
}
