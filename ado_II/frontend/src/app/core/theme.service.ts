import { Injectable, effect, signal } from '@angular/core';
import { COLORS, DARK_COLORS, LIGHT_COLORS } from '../ui/canvas-scene';

const STORAGE_KEY = 'ado-ii-theme';

// Tema claro/escuro. Sem escolha salva, segue o sistema operacional.
// Aplica `data-theme` no <html> (CSS) e troca a paleta do canvas (COLORS).
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly stored = signal<'light' | 'dark' | null>(readStored());
  private readonly systemDark = signal(this.media.matches);

  readonly dark = () => (this.stored() ?? (this.systemDark() ? 'dark' : 'light')) === 'dark';

  constructor() {
    this.media.addEventListener('change', (e) => this.systemDark.set(e.matches));
    effect(() => {
      const dark = this.dark();
      document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
      Object.assign(COLORS, dark ? DARK_COLORS : LIGHT_COLORS);
    });
  }

  toggle(): void {
    const next = this.dark() ? 'light' : 'dark';
    this.stored.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* armazenamento indisponível: vale só nesta sessão */
    }
  }
}

function readStored(): 'light' | 'dark' | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}
