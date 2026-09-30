import type { CentripetalMode } from '@ado-ii/shared';
import type { SurfaceKey } from './backdrops';

export interface CentripetalPreset {
  id: string;
  mode: CentripetalMode;
  name: string;
  icon: string;
  mass: number; // kg
  radius: number; // m
  speed: number; // m/s
  description: string;
}

// Situações reais (valores aproximados).
export const CENTRIPETAL_PRESETS: CentripetalPreset[] = [
  { id: 'ball', mode: 'string', name: 'Bola presa a um fio', icon: '⚽', mass: 0.45, radius: 1, speed: 4, description: 'Girando uma bola num barbante acima da cabeça.' },
  { id: 'sling', mode: 'string', name: 'Pedra na funda', icon: '🪨', mass: 0.2, radius: 0.8, speed: 15, description: 'Funda de Davi: o fio precisa aguentar a força centrípeta.' },
  { id: 'hammer', mode: 'string', name: 'Arremesso de martelo', icon: '🔨', mass: 7.26, radius: 1.8, speed: 25, description: 'Martelo olímpico masculino (7,26 kg) no instante da soltura.' },
  { id: 'washer', mode: 'string', name: 'Roupa na centrífuga', icon: '👕', mass: 1.5, radius: 0.25, speed: 12, description: 'Cesto da máquina de lavar (~900 rpm).' },
  { id: 'car', mode: 'car', name: 'Carro de passeio', icon: '🚗', mass: 1100, radius: 40, speed: 12, description: 'Curva de bairro a ~43 km/h.' },
  { id: 'moto', mode: 'car', name: 'Moto', icon: '🏍️', mass: 250, radius: 30, speed: 15, description: 'Moto com piloto numa rotatória.' },
  { id: 'truck', mode: 'car', name: 'Caminhão carregado', icon: '🚚', mass: 15000, radius: 60, speed: 16, description: 'Curva de rodovia a ~58 km/h.' },
  { id: 'kart', mode: 'car', name: 'Kart', icon: '🏎️', mass: 160, radius: 15, speed: 11, description: 'Grampo de pista de kart.' },
];

export interface Surface {
  key: SurfaceKey;
  name: string;
  muS: number;
}

// Coeficiente de atrito estático pneu-pista (valores típicos).
export const SURFACES: Surface[] = [
  { key: 'dry', name: 'Asfalto seco', muS: 0.8 },
  { key: 'wet', name: 'Asfalto molhado', muS: 0.5 },
  { key: 'gravel', name: 'Terra / cascalho', muS: 0.35 },
  { key: 'snow', name: 'Neve', muS: 0.2 },
  { key: 'ice', name: 'Gelo', muS: 0.08 },
];
