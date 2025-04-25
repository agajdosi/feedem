import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// models
import { BigFive, User, React } from '../../models/game';
// components
import { RadarComponent, RadarData } from '../radar/radar.component';
// uuid
import { v4 as uuidv4 } from 'uuid';
import Typed from 'typed.js';
import { GameService } from '../../services/game/game.service';
import { getCommentChanceOfUser, getReactionChancesOfUser, getUserEmotionScores } from '../../shared/utils';


@Component({
  selector: 'app-user',
  imports: [ CommonModule, RadarComponent ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit, AfterViewInit {
  @Input() user!: User | undefined;
  @Input() following: string[] = [];
  @Input() followers: string[] = [];
  @ViewChild('bioElement') bioElement!: ElementRef;

  radarData: RadarData[] = [];
  isHero: boolean = false;

  constructor(
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    if (this.user && this.user.big_five) {
      const data: RadarData = {
        id: uuidv4(),
        items: [],
        name: '',
        color: '#ddd'
      };
      for (const key in this.user.big_five) {
        data.items.push({
          name: key,
          value: this.user.big_five[key as keyof BigFive],
          color: '#ddd'
        });
      }
      this.radarData.push(data);
    }
    this.isHero = this.user?.uuid === this.gameService.game.hero;
  }

  ngAfterViewInit() {
    if (this.user?.bio) {
      const bioTyped = new Typed(this.bioElement.nativeElement, {
        strings: [this.user.bio],
        typeSpeed: 5,
        showCursor: false,
        loop: true,
        backDelay: 60000, // 60 seconds
        backSpeed: 1,
        fadeOut: true,
        // fadeOutClass: 'typed-fade-out',
      });
    }
  }

  getUser(userId: string): User {
    return this.gameService.getUserById(userId);
  }

  getCommentChanceOfUser(user: User): number {
    return getCommentChanceOfUser(user, this.gameService.game.comments, this.gameService.game.views);
  }

  getReactionChancesOfUser(user: User): Map<React, number> {
    return getReactionChancesOfUser(user, this.gameService.game.reactions, this.gameService.game.views);
  }

  getUserEmotionScores(user: User): Map<string, number> {
    // TODO: JUST DO NOT KNOW WHY IT IS 😁 0.5 😢 0.3 😴 0.2 🤦‍♂️ 0.2 ALL THE FUCKING TIME
    // WHILE THE REACTIONS WORKS JUST FINE
    return getUserEmotionScores(user, this.gameService.game.views);
  }
}
