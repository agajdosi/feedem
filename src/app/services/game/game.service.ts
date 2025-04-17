import { Injectable } from '@angular/core';
import { User } from '../../models/game';
// models
import { Game } from '../../models/game';
// http client
import { HttpClient } from '@angular/common/http';
// rxjs
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class GameService {
  game: Subject<Game> = new Subject();
  private _game!: Game;
  // TODO -> USERS TO USERS.SERVICE
  private users: User[] = [];

  constructor(
    private readonly http: HttpClient
  ) {
    this.game.subscribe({
      next: (game: Game) => {
        if (!this._game) this._game = game;
        if (game.users) this.users = game.users;
      }
    });
    // get initial game json
    const initialGameSub = this.http.get<Game>('/initial-game.json').subscribe({
      next: (game: Game) => {
        // console.log('initial game', game);
        if (!this._game && game && game.uuid) {
          this.game.next(game);
          initialGameSub.unsubscribe();
        }
      }
    });
  }

  getUsers(): User[] {
    return this.users;
  }

  updateUser(userId: string, updates: Partial<User>): void {
    this.users = this.users.map(user => 
      user.uuid === userId ? { ...user, ...updates } : user
    );
  }

  getUserById(userId: string): User | undefined {
    return this.users.find(user => user.uuid === userId);
  }
  

}
