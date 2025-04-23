import { Injectable } from '@angular/core';
import { User, Post, Game , Reaction, TaskType, Task, View, Comment} from '../../models/game';
import { LlmsService } from '../llms/llms.service';
// http client
import { HttpClient } from '@angular/common/http';
// rxjs
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { postToText, describeRecentActivity } from '../../shared/textual';

@Injectable({
  providedIn: 'root'
})

export class GameService {
  gameSubject: Subject<Game> = new Subject();
  private _game!: Game;

  onReaction: Subject<Reaction> = new Subject();
  onComment: Subject<Comment> = new Subject();

  gameTime: Subject<number> = new Subject();

  get game(): Game {
    return this._game;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly llmsService: LlmsService
  ) {
    this.gameSubject.subscribe({
      next: (g: Game) => {
        if (!this.game) {
          this._game = g;
          // start counting global time
          this.startGameTime();
        }
        if (this.game) { // update game
          this.updateGame(this.game, g);
        }
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

  private startGameTime(): void {
    let startTime = 0;
    let time = startTime;
    const SLOWDOWN_VALUE: number = 1000;
    const count = () => {
      if (this.game && this.game.created) {
        // console.log('game.created', Number(this.game.created));
        if (!startTime) {
          startTime = Number(this.game.created) + Math.floor(((Date.now() - this.game.created) / SLOWDOWN_VALUE));
          time = startTime;
        }
        setTimeout(() => {
          time++;
          this.gameTime.next(time);
          count();
        }, SLOWDOWN_VALUE); // 
      } else {
        setTimeout(() => count(), SLOWDOWN_VALUE);
      }
    }
    count();
  }

  // update values in existing game object (not a copy)
  updateGame(game: Game, newGame: Game): Game {
    // oldGame.updated = Date.now();
    for (const key in game) {
      const value: any = newGame[key as keyof Game];
      (game as any)[key] = value;
      // game[key] = newGame[key];
    }
    return game;
  }

  /** Generate a new task for the game. This is basically a next round of the game. Next post to solve.
   * 1. REACT TO OLD TASK - First we take the taskDone and we ask all targeted users (taskDone.showTo) to react to the post (taskDone.showPost).
   * If the taskDone.type is DistributePost, showPost is predefined basically and we are interested mostly in the showTo -
   * the player has selected few users from many users to distribute the post to.
   * If the taskDone.type is ShowPost, showTo is predefined basically (the Hero) and we are interested mostly in the showPost -
   * the player has selected a one post of many to show to her hero.
   * 2. GENERATE NEW TASK - Then we generate a new task, either DistributePost or ShowPost.
   * @param taskDone - The task that was just completed, is null if we have just started the game
  */
  async nextTask(taskDone: Task | null = null) {
    if (taskDone && taskDone.showPost) {
      for (const showTo of taskDone.showTo) {
        const user = this.getUserById(showTo);
        const post = this.getPost(taskDone.showPost);
        console.log('showing post to user', user.name, user.surname);

        const postContext = postToText(post, this.game.comments, this.game.reactions, this.game.users);
        if (!postContext) {
          console.error('❌ post context is null');
          continue;
        }
        console.log('nextTask - postContext for view:', postContext);

        const view = await this.llmsService.viewPost(post, user, postContext);
        this.game.views.unshift(view);

        const reaction = this.llmsService.decideReaction(view);
        if (reaction) {
          this.game.reactions.unshift(reaction);
          this.onReaction.next(reaction);
          console.log(`ℹ️ ${user.name} ${user.surname} reacted: ${reaction.value}`);
        } else {
          console.log(`ℹ️ ${user.name} ${user.surname} did not react`);
        }

        const comment = await this.llmsService.decideComment(view, user, post);
        if (comment) {
          this.game.comments.unshift(comment);
          this.onComment.next(comment);
          console.log(`ℹ️ ${user.name} ${user.surname} commented: ${comment.text}`);
        } else {
          console.log(`ℹ️ ${user.name} ${user.surname} did not comment`);
        }
      }
    }

    // GENERATE NEW TASK
    const rx = Math.random();
    let task: Task;
    if (rx < 0.5) {
      task = await this.createTaskDistributePost();
    } else {
      task = await this.createTaskShowPost();
    }
  
    this.game.tasks.unshift(task);
    this.gameSubject.next(this.game);
  }

  async createTaskDistributePost(): Promise<Task> {
    const postAuthor = this.getHero()!;
    const recentActivity: string = describeRecentActivity(postAuthor, this.game.posts, this.game.comments, this.game.reactions);
    const post = await this.llmsService.generatePost(postAuthor, recentActivity); // TODO: send history of the user's posts to the LLM
    this.game.posts.unshift(post);

    const task: Task = {
      uuid: uuidv4(),
      users: [postAuthor.uuid],
      posts: [post.uuid],
      completed: false,
      type: TaskType.DistributePost,
      time: Date.now(),
      showTo: [],
      showPost: post.uuid // We can fill this right away, because there is only one post for this task type
    };
    return task;
  }

  async createTaskShowPost(): Promise<Task> {
    const authors = this.getRandomNonHeroUsers(2);
    let posts: Post[] = [];
    for (const author of authors) {
      const recentActivity: string = describeRecentActivity(author, this.game.posts, this.game.comments, this.game.reactions);
      const post = await this.llmsService.generatePost(author, recentActivity);
      this.game.posts.unshift(post);
      posts.push(post);
    }

    const task: Task = {
      uuid: uuidv4(),
      users: authors.map(author => author.uuid),
      posts: posts.map(post => post.uuid),
      completed: false,
      type: TaskType.ShowPost,
      time: Date.now(),
      showTo: [],
      showPost: "", // This will be filled when user selects a post to show to her hero
    };
    return task;
  }


  // MARK: USER

  getHero(): User {
    return this.game.users.find(user => this.game.hero === user.uuid)!;
  }

  setHero(userId: string): void {
    this.game.hero = userId;
  }

  getUserById(userId: string): User {
    return this.game.users.find(user => userId === user.uuid)!;
  }

  getRandomNonHeroUsers(n: number = 1): User[] {
    const nonHeroUsers = this.game.users.filter(user => user.uuid !== this.game.hero);
    if (nonHeroUsers.length === 0) {
      console.error('No non-hero users available');
      return [];
    }
    const shuffled = [...nonHeroUsers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(n, nonHeroUsers.length));
  }

  // MARK: POST

  getPost(postId: string): Post {
    return this.game.posts.find(post => postId === post.uuid)!;
  }

}
