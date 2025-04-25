import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { GameService } from '../../services/game/game.service';
import { Subscription } from 'rxjs';
import { Game } from '../../models/game';
import { getLimit, getAvgEngagement } from '../../shared/utils';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [ CommonModule ],
  providers: [ DatePipe ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  gameData?: Game;
  get time(): string | null {
    if (!this._time) return null;
    const date = new Date(this._time);
    return `${this.datePipe.transform(date, 'EE, MMMM d y, HH:mm:ss')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  }
  private _time: number = 0;
  public gameMode: string = 'endless';
  private gameSub: Subscription = new Subscription();
  private timeSub: Subscription = new Subscription();
  constructor(
    private gameService: GameService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.gameSub = this.gameService.gameSubject.subscribe((gameDataUpdate: Game) => {
      this.gameData = gameDataUpdate;
    });
    this.timeSub = this.gameService.gameTime.subscribe({
      next: (value: any) => {
        this._time = value;
      }
    });
  }

  ngOnDestroy(): void {
    this.gameSub.unsubscribe();
    this.timeSub.unsubscribe();
  }

  getLimit(): number {
    return getLimit(this.gameData?.tasks.length || 0);
  }

  getAvgEngagement(): number {
    const views = this.gameData?.views.length || 0;
    const comments = this.gameData?.comments.length || 0;
    const reactions = this.gameData?.reactions.length || 0;
    return getAvgEngagement(views, comments, reactions);
  }

  /**
   * Transcribe the reserve between required and achieved engagement into lives.
   * This is to make the game score more engaging and easier to understand.
   */
  getLives(): string {
    const engagement = this.getAvgEngagement();
    const limit = this.getLimit();

    const maxDiff = 200 - limit;
    const difference = engagement - limit;
    const percentage = (difference / maxDiff) * 100;

    if (percentage > 40) return "♡♡♡♡♡";
    if (percentage > 20) return "♡♡♡♡";
    if (percentage > 15) return "♡♡♡";
    if (percentage > 5) return "♡♡";
    if (percentage > 0) return "♡";
    return "💀";
  }
}




