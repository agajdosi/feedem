import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
// models
import { BigFive, User } from '../../models/game';
// components
import { RadarComponent, RadarData, RadarDataItem } from '../radar/radar.component';
// uuid
import { v4 as uuidv4 } from 'uuid';
import Typed from 'typed.js';
import { GameService } from '../../services/game/game.service';

@Component({
  selector: 'app-user',
  imports: [ RadarComponent ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit, AfterViewInit {
  @Input() user!: User | undefined;
  @ViewChild('bioElement') bioElement!: ElementRef;

  radarData: RadarData[] = [];
  isHero: boolean = false;

  constructor(private gameService: GameService) {}

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
}
