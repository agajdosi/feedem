import { Component, Input, OnInit } from '@angular/core';
// models
import { BigFive, User } from '../../models/game';
// components
import { RadarComponent, RadarData, RadarDataItem } from '../radar/radar.component';
// uuid
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-user',
  imports: [ RadarComponent ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit {
  @Input() user!: User | undefined;

  radarData: RadarData[] = [];
  constructor() {}

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
  }
}
