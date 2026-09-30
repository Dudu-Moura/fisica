import { Component, computed, inject, signal } from '@angular/core';
import type { SystemId } from '@ado-ii/shared';
import { SoundService } from './core/sound.service';
import { ThemeService } from './core/theme.service';
import { Centripetal } from './systems/centripetal/centripetal';
import { Drag } from './systems/drag/drag';
import { InclinedPlane } from './systems/inclined-plane/inclined-plane';

interface SystemOption {
  id: SystemId;
  num: string;
  label: string;
  summary: string;
}

@Component({
  selector: 'app-root',
  imports: [InclinedPlane, Centripetal, Drag],
  templateUrl: './app.html',
})
export class App {
  protected readonly sound = inject(SoundService);
  protected readonly theme = inject(ThemeService);

  protected readonly systems: SystemOption[] = [
    { id: 'inclined-plane', num: 'I.', label: 'I. Plano inclinado com atrito e tração', summary: 'Bloco no plano ligado por uma polia a uma massa pendurada: a aceleração é constante (MRUV).' },
    { id: 'centripetal', num: 'II.', label: 'II. Força centrípeta', summary: 'Movimento circular uniforme: a resultante aponta para o centro, Fc = mv²/R.' },
    { id: 'drag', num: 'III.', label: 'III. Força de arrasto', summary: 'Queda com resistência do ar: a velocidade satura na velocidade terminal.' },
  ];

  protected readonly selected = signal<SystemId>('inclined-plane');
  protected readonly current = computed(() => this.systems.find((s) => s.id === this.selected())!);

  protected onSelect(event: Event): void {
    this.sound.click();
    this.selected.set((event.target as HTMLSelectElement).value as SystemId);
  }
}
