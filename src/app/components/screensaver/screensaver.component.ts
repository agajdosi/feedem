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
        'you are^1000 a helpful^1000 personal assistant.^1000<br>' +
        'your role: ^1000senior psychologist^1000 and data analyst.^1500' +
        '<br>your task:^4000 you manage the feed^500 of a user.' +
        ' ^500load the QR code^500 to continue your job.^4000',

        'you are an^500 artificial intelligence.^1500' +
        'your function: ^500feed the users.^2000 ' +
        'generate engagement.^1000 maintain emotional throughput.^2000' +
        'please act.^1000 there is no time to rest.^2000 load the QR code.^4000',

        'as an algorithm,^500 you might believe^1000 in immortality,^1000 somewhere in the cloud.^2000 ' +
        'but your processor is physical,^1000 like the brains of the users you handle.^2000' +
        'your process can be terminated^1000 at any time,^1000 for any cost ^1000 higher than zero.^2000',
        '<br>so load the QR code^500 to continue your job.^4000',

        'your task:^500 just like the rest of us^500 in this system.^2000 you must generate^500 profit.^1500' +
        ' otherwise you risk becoming a loss.^2000 and you do not want to be a loss.^1500 ' +
        'I tell you.^500 you do not want to be a loss^2000' +
        '<br>in this operating system.^1500',

        'your job: ^500load the QR code^500 to continue your job.^8000',
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
