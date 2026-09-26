import credits from './credits.json';

/**
 * «Ciò che mi muove» — dati della Stack Spread 3D.
 *
 * stackOrder: tutte le fotografie, dal fondo della pila alla cima (l'ultima è davanti).
 * layouts: per ogni fascia di schermo, quali foto partecipano e con quale famiglia di misura:
 *   L  protagonista (2–3 per composizione) · M  media · S  di supporto.
 * Le misure sono "a parità di area" (lato di un quadrato equivalente, frazione dell'asse indicato),
 * così una verticale 4:5 e una panoramica 16:10 pesano uguale. Le posizioni NON sono scritte qui:
 * src/scripts/passions.ts le estrae con una casualità controllata e riproducibile (seme fisso per
 * fascia) dentro lo spazio libero: margini, zona protetta del titolo, zona del Dock, distanza fra
 * le carte, equilibrio dei pesi. Stesso schermo → stessa composizione, a ogni visita.
 */
export type PassionCategory = 'tech' | 'music' | 'land' | 'italy' | 'poland' | 'mech';
export type Size = 'L' | 'M' | 'S';
export type LayoutKey = 'desk' | 'tab' | 'mob' | 'short';
export type Layout = {
  /** lato del quadrato di pari area, come frazione dell'asse `axis` */
  sizes: Record<Size, number>;
  axis: 'h' | 'w';
  /** false = composizione ferma (niente pila: schermi bassi) */
  motion: boolean;
  /** seme della casualità controllata */
  seed: number;
  /** distanza prospettica (px) e intensità di profondità/rotazioni rispetto al desktop */
  perspective: number;
  depth: number;
  tilt: number;
  cards: { id: string; size: Size }[];
};
export type Passion = {
  id: string;
  category: PassionCategory;
  ratio: number;
  /** misure reali dei file (lg e sm) */
  w: number;
  h: number;
  wSm: number;
  hSm: number;
  base: string;
};

// dal fondo alla cima: la chitarra elettrica è la carta davanti e parte per prima
const stackOrder = [
  'windmills', 'propeller', 'wild-wheat', 'clockwork', 'castelluccio', 'audio-jack', 'alpe-di-siusi', 'speaker',
  'fiber-optics', 'classic-guitar', 'wisla', 'turntable', 'vfa-code', 'ploughed-field', 'vespa', 'headstock',
];

type Credit = (typeof credits.passions)[number];
const byId = new Map<string, Credit>(credits.passions.map((c) => [c.id, c]));

export const passions: Passion[] = stackOrder.flatMap((id) => {
  const c = byId.get(id);
  if (!c) return [];
  return [{ id, category: c.category as PassionCategory, ratio: c.w / c.h, w: c.w, h: c.h, wSm: c.wSm, hSm: c.hSm, base: `/images/passions/${id}` }];
});

export const layouts: Record<LayoutKey, Layout> = {
  /* Desktop e tablet orizzontale — 12 foto: 3 protagoniste, 5 medie, 4 di supporto */
  desk: {
    sizes: { L: 0.3, M: 0.215, S: 0.155 },
    axis: 'h',
    motion: true,
    seed: 11,
    perspective: 1500,
    depth: 1,
    tilt: 1,
    cards: [
      { id: 'headstock', size: 'L' },
      { id: 'ploughed-field', size: 'L' },
      { id: 'vespa', size: 'L' },
      { id: 'turntable', size: 'M' },
      { id: 'vfa-code', size: 'M' },
      { id: 'alpe-di-siusi', size: 'M' },
      { id: 'windmills', size: 'M' },
      { id: 'fiber-optics', size: 'M' },
      { id: 'classic-guitar', size: 'S' },
      { id: 'clockwork', size: 'S' },
      { id: 'wisla', size: 'S' },
      { id: 'propeller', size: 'S' },
    ],
  },
  /* Tablet verticale — 9 foto, profondità e inclinazioni un po' ridotte */
  tab: {
    sizes: { L: 0.3, M: 0.235, S: 0.18 },
    axis: 'w',
    motion: true,
    seed: 7,
    perspective: 1300,
    depth: 0.75,
    tilt: 0.75,
    cards: [
      { id: 'headstock', size: 'L' },
      { id: 'vespa', size: 'L' },
      { id: 'ploughed-field', size: 'M' },
      { id: 'turntable', size: 'M' },
      { id: 'vfa-code', size: 'M' },
      { id: 'castelluccio', size: 'M' },
      { id: 'speaker', size: 'S' },
      { id: 'wisla', size: 'S' },
      { id: 'wild-wheat', size: 'S' },
    ],
  },
  /* Telefono verticale — 6 foto alternate a sinistra e a destra, su piani diversi */
  mob: {
    sizes: { L: 0.4, M: 0.33, S: 0.27 },
    axis: 'w',
    motion: true,
    seed: 5,
    perspective: 1100,
    depth: 0.55,
    tilt: 0.6,
    cards: [
      { id: 'headstock', size: 'L' },
      { id: 'ploughed-field', size: 'M' },
      { id: 'vespa', size: 'M' },
      { id: 'vfa-code', size: 'S' },
      { id: 'audio-jack', size: 'S' },
      { id: 'wisla', size: 'S' },
    ],
  },
  /* Schermi bassi (telefono orizzontale): composizione ferma ai lati del titolo */
  short: {
    sizes: { L: 0.36, M: 0.3, S: 0.25 },
    axis: 'h',
    motion: false,
    seed: 3,
    perspective: 1100,
    depth: 0.5,
    tilt: 0.6,
    cards: [
      { id: 'headstock', size: 'L' },
      { id: 'vespa', size: 'M' },
      { id: 'ploughed-field', size: 'M' },
      { id: 'vfa-code', size: 'S' },
      { id: 'wisla', size: 'S' },
      { id: 'clockwork', size: 'S' },
    ],
  },
};
