export interface DragPreset {
  id: string;
  name: string;
  icon: string;
  mass: number; // kg
  b: number; // arrasto linear (kg/s)
  c: number; // arrasto quadrático (kg/m) ≈ ½ ρ C_d A
  description: string;
}

// Objetos reais (valores aproximados; c = ½·ρ_ar·C_d·A).
export const DRAG_PRESETS: DragPreset[] = [
  { id: 'skydiver', name: 'Paraquedista (queda livre)', icon: '🧑‍🚀', mass: 80, b: 15, c: 0.25, description: 'Corpo de bruços, antes de abrir o paraquedas (~200 km/h).' },
  { id: 'parachute', name: 'Paraquedas aberto', icon: '🪂', mass: 80, b: 150, c: 30, description: 'Com o velame aberto a velocidade terminal cai para ~5 m/s.' },
  { id: 'tennis', name: 'Bola de tênis', icon: '🎾', mass: 0.057, b: 0.03, c: 0.0012, description: '57 g, diâmetro 6,7 cm.' },
  { id: 'bowling', name: 'Bola de boliche', icon: '🎳', mass: 7, b: 0.8, c: 0.01, description: 'Pesada e compacta: o arrasto quase não importa em quedas curtas.' },
  { id: 'rain', name: 'Gota de chuva', icon: '💧', mass: 3.4e-5, b: 3.7e-5, c: 4.1e-6, description: 'Gota de ~4 mm de diâmetro (v_t ≈ 9 m/s).' },
  { id: 'paper', name: 'Folha de papel', icon: '📄', mass: 0.005, b: 0.025, c: 0.012, description: 'Folha A4 caindo aberta, na horizontal.' },
];
