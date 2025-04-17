import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef } from '@angular/core';

@Component({
  selector: 'app-on-screen',
  imports: [],
  templateUrl: './on-screen.component.html',
  styleUrl: './on-screen.component.scss'
})
export class OnScreenComponent implements OnInit, OnDestroy {

  @Input() data!: any;
  @Output() onScreen: EventEmitter<any> = new EventEmitter();

  onscreen: boolean = false;
  private eventFired: boolean = false;

  constructor(
    private elm: ElementRef
  ) {}

  ngOnInit(): void {
    window.addEventListener('scroll', this.scrollHandler.bind(this), false);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
  }

  private scrollHandler(e: any): void {
    const rect = this.elm.nativeElement.getBoundingClientRect();
    // console.log('on scroll', rect);
    const viewHeight = window.innerHeight; 
    const offset = viewHeight / 4;
    if (
      rect.top >= 0 /* + offset - (offset * .2) */ && 
      rect.top <= viewHeight - ((viewHeight - rect.height) / 2)
    ) {
      // element is on screen
      
      this.onscreen = true;
      if (!this.eventFired) {
        // console.log('on screen data', this.data);
        this.onScreen.emit(this.data);
        this.eventFired = true;
      }
    } else {
      this.onscreen = false;
      this.eventFired = false;
    }
  }

}
