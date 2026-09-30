import { Component, inject } from '@angular/core';
import { PlaybackService } from '../core/playback.service';
import { SoundService } from '../core/sound.service';
import { fmt } from '../core/format';

@Component({
  selector: 'app-playback-controls',
  template: `
    <div class="playback">
      <button type="button" class="btn" (click)="sound.click(); playback.toggle()">
        {{ playback.playing() ? '❚❚ Pausar' : '▶ Continuar' }}
      </button>
      <button type="button" class="btn" (click)="sound.click(); playback.restart()">↺ Reiniciar</button>
      <label class="speed">
        Velocidade
        <select (change)="setSpeed($event)">
          @for (s of speeds; track s) {
            <option [value]="s" [selected]="s === playback.speed()">{{ s }}×</option>
          }
        </select>
      </label>
      <span class="clock">t = {{ fmt(playback.displayTime(), 2) }} s</span>
    </div>
  `,
})
export class PlaybackControls {
  protected readonly playback = inject(PlaybackService);
  protected readonly sound = inject(SoundService);
  protected readonly speeds = [0.1, 0.25, 0.5, 1, 2, 4];
  protected readonly fmt = fmt;

  protected setSpeed(event: Event): void {
    this.sound.click();
    this.playback.speed.set(Number((event.target as HTMLSelectElement).value));
  }
}
