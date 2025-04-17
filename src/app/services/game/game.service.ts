import { Injectable } from '@angular/core';
import { User, Post, Game , Reaction} from '../../models/game';
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

  getHero(): User | undefined {
    return this.game.users.find(user => this.game.hero === user.uuid)!;
  }

  getUserById(userId: string): User | undefined {
    return this.game.users.find(user => user.uuid === userId);
  }
  
  // MARK: POSTS

  /** Get all posts by a author-user. */
  getPostsByAuthor(userId: string): Post[] {
    return this.game.posts.filter(post => post.author === userId);
  }

  /** Get posts by another user seen by this user. Basically what this user recalls about another user's post activity.
   * @param userID - uuid of the user who saw something, the recalling user
   * @param authorID - uuid of the user who wrote the posts
   * @returns all posts by the other user, author of the posts
   */
  getPostsByAuthorSeenByUser(userID: string, authorID: string): Post[] {
    const viewsByUser = this.game.views.filter(view => view.user === userID);
    const postsByAuthor = this.getPostsByAuthor(authorID);
    const posts = viewsByUser.map(view => postsByAuthor.find(post => post.uuid === view.post));
    return posts.filter(post => post !== undefined) as Post[];
  }

  /** Get all posts by a user. */
  getRecentlyViewedPosts(userId: string): Post[] {
    const views = this.game.views.filter(view => view.user === userId);
    const posts = views.map(view => this.game.posts.find(post => post.uuid === view.post));
    return posts.filter(post => post !== undefined) as Post[];
  }

  // MARK: REACTIONS

  /** Get all reactions by a author-user. */
  getReactionsByUser(authorID: string): Reaction[] {
    const reactions = this.game.reactions.filter(reaction => reaction.author === authorID);
    return reactions;
  }
}
