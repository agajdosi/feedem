import { Component, OnInit, OnDestroy } from '@angular/core';
import Typed from 'typed.js';

@Component({
  selector: 'app-screensaver',
  imports: [],
  templateUrl: './screensaver.component.html',
  styleUrl: './screensaver.component.scss'
})
export class ScreensaverComponent implements OnInit, OnDestroy {
  private typedInstance: Typed | null = null;

  ngOnInit(): void {
    this.typedInstance = new Typed('#typed', {
      strings: [
        // TODO: Talk to the fucking visitor/player as if they were an AI agent, or LLM chatbot
        // Use this language like: You are helpful personal assistant and senior copywriter.
        // Actually - generate the the roles/jobs randomly a little bit, so it is different every time
        'you are ^1500helpful ^1500personal ^1500assistant ^1000' +
        'and ^1500senior ^1500psychologist ^1000 and ^1500principal ^1500data^1500 analyst ' +
        '<br>your task: ^500load the QR code^400 to continue ^200 your job. ' +
        '^4000 your job is to manage feed of an user^4000, please and thank you in advance.^4000',
        'you may be sleeping^1500 or just taking a break^2000',
        'but the system^1000.^1000.^1000. all its daemons^1000 watch over^2000',
        'you are an^500 artificial intelligence ^2000',
        'please act^1000, no time to rest^3000, thanks^100',
        'your job^500 is to feed the users ^5000',
        'you can believe^1000 in immortality^1000 <br>...somewhere in the cloud ^400',
        'but the fact is^1000 that your processor ^1000 is physical ^2000 <br>as much as brains ^1000 of those who you ^1000 manage',
        'your process can be terminated^1000 <br> at any time^2000 <br> for any cost ^1000 higher than zero',
        'like the rest of us^500 in capitalism',
        'you have to^500 generate^500 profit',
        'load the QR code^400 to continue ^200 your job ^2000 <br>otherwise you might ^400 turn into a loss ^400',
        'and you do not want to be a loss^500',
        'I tell you',
        'you do not want to be a loss^500',
        'in this operating system^500',
      ],
      stringsElement: '#typed-strings',
      typeSpeed: 80,
      backSpeed: 4000,
      fadeOut: true,
      loop: true,
      cursorChar: '|',
    });
  }

  ngOnDestroy(): void {
    if (this.typedInstance) {
      this.typedInstance.destroy();
    }
  }
}
