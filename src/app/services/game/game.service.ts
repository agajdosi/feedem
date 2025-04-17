import { Injectable } from '@angular/core';
import { User, Post, Game } from '../../models/game';
// http client
import { HttpClient } from '@angular/common/http';
// rxjs
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class GameService {
  gameSubject: Subject<Game> = new Subject();
  private game!: Game;

  constructor(
    private readonly http: HttpClient
  ) {
    this.gameSubject.subscribe({
      next: (g: Game) => {
        if (!this.game) this.game = g;
      }
    });
    // get initial game json
    const initialGameSub = this.http.get<Game>('/initial-game.json').subscribe({
      next: (g: Game) => {
        // console.log('initial game', g);
        if (!this.game && g && g.uuid) {
          this.gameSubject.next(g);
          initialGameSub.unsubscribe();
        }
      }
    });
  }

  // MARK: USER

  getHero(): User {
    return this.game.users.find(user => this.game.hero === user.uuid)!;
  }

  getUserById(userId: string): User | undefined {
    return this.game.users.find(user => user.uuid === userId);
  }
  
  // MARK: POSTS

  getPostsByUser(userId: string): Post[] {
    return this.game.posts.filter(post => post.author === userId);
  }
}
