import { Injectable } from '@angular/core';
import { User, Post, Game , Reaction, TaskType, Task} from '../../models/game';
import { LlmsService } from '../llms/llms.service';
// http client
import { HttpClient } from '@angular/common/http';
// rxjs
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})

export class GameService {
  gameSubject: Subject<Game> = new Subject();
  private game!: Game;

  constructor(
    private readonly http: HttpClient,
    private readonly llmsService: LlmsService
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

  /** Generate a new task for the game. This is basically a next round of the game. Next post to solve. */
  async nextTask() {
    let taskType: TaskType;
    let postAuthor: User;
    const rx = Math.random();
    if (rx < 0.5) {
      taskType = TaskType.DistributePost;
      postAuthor = this.getHero()!;
    } else {
      taskType = TaskType.ShowPost;
      postAuthor = this.getRandomNonHeroUser()!;
    }

    const post = await this.llmsService.generatePost(postAuthor); // TODO: send history of the user's posts to the LLM
    this.game.posts.push(post);

    const task: Task = {
      uuid: uuidv4(),
      user: postAuthor.uuid,
      post: post.uuid,
      completed: false,
      type: taskType,
      time: Date.now()
    };  
    this.game.tasks.push(task);
    this.gameSubject.next(this.game);
  }

  // MARK: USER

  getHero(): User {
    return this.game.users.find(user => this.game.hero === user.uuid)!;
  }

  getRandomNonHeroUser(): User {
    const users = this.game.users.filter(user => user.uuid !== this.game.hero);
    return users[Math.floor(Math.random() * users.length)];
  }

}
