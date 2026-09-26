/* ==========================================================================
   «Ciò che mi muove» — Stack Spread 3D.
   Stessa meccanica del riferimento Hyperiux (scroll → avanzamento → valore levigato), senza
   librerie e senza isola React, con una vera profondità:
   - le carte vivono in uno spazio prospettico (perspective sul contenitore, origine sul titolo);
     ognuna ha il suo piano Z (20 % davanti, 55 % in mezzo, 25 % dietro), piccole rotazioni
     X/Y/Z e un'ombra coerente col piano;
   - pila fisica sotto il titolo → costellazione 3D: la carta davanti parte per prima, le altre
     seguono; ogni carta conserva la sua profondità per tutto il percorso, nessun appiattimento;
   - posizioni finali con casualità controllata e riproducibile (seme fisso per fascia):
     campionamento "best candidate" dentro lo spazio libero, esclusi titolo (+ margine),
     Dock (+ margine), bordi; collisioni limitate; tra più varianti vince la più equilibrata;
   - chi deve superare il titolo lo aggira (curva di Bézier nello spazio dello schermo);
   - curva cubic-bezier(.22,.8,.24,1), nessun rimbalzo; composizione ferma alla fine;
   - dopo l'apertura: parallasse leggerissima allo scroll e al puntatore, più forte davanti;
   - un solo ciclo rAF, attivo solo se la sezione è visibile e qualcosa si muove;
   - ogni carta appare solo quando la sua immagine è decodificata; se un'immagine non si carica
     la carta viene tolta e la composizione ricalcolata (mai cornici vuote).
   "Riduci movimento" e schermi bassi: costellazione finale ferma, sempre in 3D.
   ========================================================================== */
type Size = 'L' | 'M' | 'S';
type Plane = 'fg' | 'mid' | 'bg';
type LayoutKey = 'desk' | 'tab' | 'mob' | 'short';
type Layout = {
  sizes: Record<Size, number>; axis: 'h' | 'w'; motion: boolean; seed: number;
  perspective: number; depth: number; tilt: number; cards: { id: string; size: Size }[];
};
type Rect = { l: number; t: number; r: number; b: number };
type Card = {
  id: string; el: HTMLElement; img: HTMLImageElement; size: Size; ratio: number;
  plane: Plane; rank: number;
  w: number; h: number; // misura CSS della carta
  // posa finale (schermo): centro, profondità, rotazioni
  X: number; Y: number; z: number; rx: number; ry: number; rz: number;
  // posa in pila (schermo): centro, profondità, rotazioni, larghezza apparente
  sX: number; sY: number; sz: number; srx: number; sry: number; srz: number; sk: number;
  c1X: number; c1Y: number; c2X: number; c2Y: number; // punti di controllo del percorso
  hover: number; hv: number;
  /** true = non parte dalla pila: emerge dal basso vicino alla sua posa (telefono, tablet) */
  rise: boolean;
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const clamp01 = (v: number) => clamp(v, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => {
  const v = clamp01(x);
  return v * v * (3 - 2 * v);
};
/* cubic-bezier(x1, y1, x2, y2) come in CSS */
const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dsx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(clamp01(t));
  };
};
const ease = bezier(0.22, 0.8, 0.24, 1);
/* generatore pseudo-casuale con seme (mulberry32): stessa fascia → stessa composizione */
const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const inter = (a: Rect, b: Rect) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
const hits = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
const area = (a: Rect) => (a.r - a.l) * (a.b - a.t);
const grow = (a: Rect, d: number): Rect => ({ l: a.l - d, t: a.t - d, r: a.r + d, b: a.b + d });
const DEG = Math.PI / 180;

/* piani: profondità (px, desktop) e ampiezze di parallasse (puntatore, scroll) */
const PLANE_Z: Record<Plane, [number, number]> = { fg: [100, 180], mid: [20, 90], bg: [-160, -60] };
const PTR: Record<Plane, number> = { fg: 7, mid: 4, bg: 2 };
const DRIFT: Record<Plane, number> = { fg: 12, mid: 7, bg: 3 };

export function initPassions() {
  const root = document.querySelector<HTMLElement>('[data-passions]');
  if (!root) return;
  const stage = root.querySelector<HTMLElement>('[data-ps-stage]')!;
  const box = root.querySelector<HTMLElement>('[data-ps-cards]')!;
  const textBox = root.querySelector<HTMLElement>('[data-ps-text]')!;
  const title = root.querySelector<HTMLElement>('[data-ps-block]')!;
  const els = new Map([...root.querySelectorAll<HTMLElement>('.pc')].map((el) => [el.dataset.id!, el]));
  let layouts: Record<LayoutKey, Layout>;
  try {
    layouts = JSON.parse(root.dataset.layouts ?? '{}');
  } catch {
    return;
  }
  const rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const broken = new Set<string>();

  let cards: Card[] = [];
  let animated = false, near = false, visible = false, raf = 0, last = 0;
  let P = 1500, ox = 0, oy = 0, depth = 1;
  let target = 0, shown = 0, enter = 0, hold = 0;
  // fondo della pila (coordinate dello stage) e fascia del Dock: la pila non passa mai dietro al Dock
  let stackBottom = 0, dockZone = 82, pileIn = 1;
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };

  const pickLayout = (): LayoutKey => {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (vh < 560) return 'short';
    if (vw < 700) return 'mob';
    if (vw < 1100 && vh >= vw) return 'tab';
    return 'desk';
  };

  /* riquadro sullo schermo di una carta: proiezione esatta dei quattro angoli
     (scala → rotateZ → rotateY → rotateX → traslazione → prospettiva) */
  const project = (X: number, Y: number, z: number, w: number, h: number, rx: number, ry: number, rz: number, k = 1): Rect => {
    const f0 = P / (P - z);
    const x = ox + (X - ox) / f0, y = oy + (Y - oy) / f0;
    const cz = Math.cos(rz * DEG), sz = Math.sin(rz * DEG);
    const cy = Math.cos(ry * DEG), sy = Math.sin(ry * DEG);
    const cx = Math.cos(rx * DEG), sx = Math.sin(rx * DEG);
    const R: Rect = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
    for (const [u0, v0] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      let u = (u0 * w * k) / 2, v = (v0 * h * k) / 2, q = 0;
      [u, v] = [u * cz - v * sz, u * sz + v * cz];
      [u, q] = [u * cy + q * sy, -u * sy + q * cy];
      [v, q] = [v * cx - q * sx, v * sx + q * cx];
      const f = P / (P - (z + q));
      const px = ox + (x + u - ox) * f, py = oy + (y + v - oy) * f;
      R.l = Math.min(R.l, px); R.r = Math.max(R.r, px);
      R.t = Math.min(R.t, py); R.b = Math.max(R.b, py);
    }
    return R;
  };

  /* ---------- Composizione: casualità controllata ---------- */
  const compose = (key: LayoutKey, lay: Layout) => {
    const W = stage.clientWidth, H = stage.clientHeight;
    P = lay.perspective;
    depth = lay.depth;
    // offset* ignorano le trasformazioni d'ingresso: misura la posizione finale del titolo
    const T: Rect = { l: textBox.offsetLeft + title.offsetLeft, t: textBox.offsetTop + title.offsetTop, r: 0, b: 0 };
    T.r = T.l + title.offsetWidth;
    T.b = T.t + title.offsetHeight;
    ox = (T.l + T.r) / 2;
    oy = (T.t + T.b) / 2;
    const dockTop = textBox.offsetTop + textBox.offsetHeight;
    const unit = lay.axis === 'h' ? H : W;
    const mob = key === 'mob';
    const m = mob ? 16 : key === 'tab' ? clamp(W * 0.035, 24, 40) : clamp(W * 0.033, 32, 64);
    const mTop = mob ? 22 : m;
    // zona protetta del titolo: generosa su desktop, proporzionalmente più ampia su schermi piccoli
    const g = mob ? 22 : key === 'tab' ? 30 : clamp(W * 0.026, 34, 52);
    const minHalf = key === 'desk' ? W * 0.2 : 0;
    const prot: Rect = {
      l: Math.min(T.l - g, W / 2 - minHalf),
      r: Math.max(T.r + g, W / 2 + minHalf),
      t: T.t - g,
      b: T.b + g + 12, // + deriva della parallasse
    };
    // Dock: barra a tutta larghezza sul telefono, pannello centrale altrove
    const gd = mob ? 28 : key === 'tab' ? 40 : 48;
    // misura di layout (offsetWidth ignora le trasformazioni della goccia): il Dock è sempre centrato
    const panelW = document.querySelector<HTMLElement>('[data-dock-panel]')?.offsetWidth ?? 0;
    const dockW = mob ? W : panelW > 200 ? panelW : Math.min(W * 0.6, 560);
    const dockL = (W - dockW) / 2;
    const dock: Rect = { l: dockL - gd, r: dockL + dockW + gd, t: dockTop - gd, b: H + 100 };
    const safe: Rect = { l: m, t: mTop, r: W - m, b: H - m };

    const pool = lay.cards.filter((c) => els.has(c.id) && !broken.has(c.id));
    const n = pool.length;
    const nFg = Math.max(1, Math.round(n * 0.2));
    const nBg = Math.max(1, Math.round(n * 0.25));
    const gap = mob ? 10 : key === 'tab' ? 14 : 18;

    type Draft = {
      id: string; size: Size; ratio: number; plane: Plane; z: number; rz: number; rx: number; ry: number;
      rxm: number; rym: number; face: boolean; sx: number; sy: number;
      w: number; h: number; X: number; Y: number; placed: boolean; shrink: number;
    };
    // la maggior parte delle foto si volta appena verso il titolo (una conca attorno al centro),
    // qualcuna no: lo spazio sembra vero ma non costruito
    const tiltAt = (d: Draft, X: number, Y: number) => ({
      ry: (d.face ? (X < ox ? 1 : -1) : d.sy) * d.rym,
      rx: (d.face ? (Y < oy ? -1 : 1) : d.sx) * d.rxm,
    });

    const attempt = (seed: number) => {
      const rand = rng(seed ^ hash(key + pool.map((c) => c.id).join()));
      const pick = (a: number, b: number) => lerp(a, b, rand());
      // piani: davanti le protagoniste, dietro le carte di supporto (con un po' di mescolanza)
      const order = [...pool].sort((a, b) => 'LMS'.indexOf(a.size) - 'LMS'.indexOf(b.size) || rand() - 0.5);
      const plane = new Map<string, Plane>();
      order.slice(0, nFg).forEach((c) => plane.set(c.id, 'fg'));
      order.slice(-nBg).forEach((c) => plane.set(c.id, 'bg'));
      if (nFg >= 2 && order.length > 3 && rand() < 0.5) {
        // a volte una media passa davanti al posto di una protagonista
        const a = order[nFg - 1]!, b = order[nFg]!;
        plane.set(a.id, 'mid');
        plane.set(b.id, 'fg');
      }
      const drafts: Draft[] = order.map((c) => {
        const el = els.get(c.id)!;
        const ratio = Number(el.dataset.ratio) || 1;
        const pl = plane.get(c.id) ?? 'mid';
        const [z0, z1] = PLANE_Z[pl];
        const eq = lay.sizes[c.size] * unit * pick(0.94, 1.06);
        // rotazioni: quasi tutte piccole, qualcuna un po' più decisa, qualcuna quasi dritta
        const r = rand();
        const rz = (r < 0.25 ? pick(-0.8, 0.8) : r < 0.85 ? pick(1, 3) * (rand() < 0.5 ? -1 : 1) : pick(3.5, 6) * (rand() < 0.5 ? -1 : 1)) * lay.tilt;
        return {
          id: c.id, size: c.size, ratio, plane: pl,
          z: pick(z0, z1) * lay.depth, rz,
          rx: 0, ry: 0,
          rxm: (rand() < 0.15 ? pick(0, 1.2) : pick(1.5, 5)) * lay.tilt,
          rym: (rand() < 0.15 ? pick(0, 1.5) : pick(3, 9)) * lay.tilt,
          face: rand() < 0.72,
          sx: rand() < 0.5 ? -1 : 1,
          sy: rand() < 0.5 ? -1 : 1,
          w: eq * Math.sqrt(ratio), h: eq / Math.sqrt(ratio),
          X: 0, Y: 0, placed: false, shrink: 1,
        };
      });
      const placed: { d: Draft; R: Rect }[] = [];
      const inside = (R: Rect) => R.l >= safe.l && R.r <= safe.r && R.t >= safe.t && R.b <= safe.b;
      for (const d of drafts) {
        for (let tries = 0; tries < 7 && !d.placed; tries++) {
          let best: { X: number; Y: number; R: Rect; s: number } | null = null;
          for (let k = 0; k < 90; k++) {
            const X = pick(safe.l, safe.r), Y = pick(safe.t, safe.b);
            const { rx, ry } = tiltAt(d, X, Y);
            const R = project(X, Y, d.z, d.w, d.h, rx, ry, d.rz);
            if (!inside(R) || hits(R, prot) || hits(R, dock)) continue;
            let ok = true, nn = Infinity;
            for (const o of placed) {
              const ov = inter(R, o.R) / Math.min(area(R), area(o.R));
              // un piccolo sormonto è ammesso solo fra piani diversi (davanti/dietro)
              const allow = o.d.plane !== d.plane && (o.d.plane === 'bg' || d.plane === 'bg') ? 0.06 : 0;
              if (ov > allow || (allow === 0 && hits(grow(R, gap / 2), grow(o.R, gap / 2)))) {
                ok = false;
                break;
              }
              const dx = Math.max(0, Math.max(R.l - o.R.r, o.R.l - R.r)), dy = Math.max(0, Math.max(R.t - o.R.b, o.R.t - R.b));
              nn = Math.min(nn, Math.hypot(dx, dy));
            }
            if (!ok) continue;
            // distanza dal vicino più prossimo (blue noise) + un filo di caso: spontaneo, non uniforme
            // oltre una distanza comoda conta il caso (niente file ordinate lungo i bordi);
            // penalità per allineamenti evidenti (righe, colonne) e per chi si incolla al bordo
            const cap = Math.max(gap * 2.5, W * 0.07);
            let s = (Math.min(nn, cap) / cap) * pick(0.6, 1.4);
            for (const o of placed) {
              if (Math.abs(Y - o.d.Y) < H * 0.05 && Math.abs(X - o.d.X) < W * 0.45) s -= 0.35;
              if (Math.abs(X - o.d.X) < W * 0.04 && Math.abs(Y - o.d.Y) < H * 0.5) s -= 0.25;
            }
            const edge = Math.min(R.l - safe.l, safe.r - R.r, R.t - safe.t, safe.b - R.b);
            if (edge < 10) s -= 0.3;
            if (!best || s > best.s) best = { X, Y, R, s };
          }
          if (best) {
            d.X = best.X; d.Y = best.Y; d.placed = true;
            Object.assign(d, tiltAt(d, d.X, d.Y));
            placed.push({ d, R: best.R });
          } else {
            d.w *= 0.92; d.h *= 0.92; d.shrink *= 0.92;
          }
        }
      }
      // punteggio: equilibrio orizzontale e verticale dei pesi, protagoniste non tutte da un lato,
      // nessun settore vuoto attorno al titolo, nessuna carta persa o rimpicciolita
      let sw = 0, mx = 0, my = 0, lL = 0, lR = 0;
      const sectors = [0, 0, 0, 0, 0, 0];
      for (const { d, R } of placed) {
        const a = area(R);
        sw += a; mx += a * (d.X - W / 2); my += a * (d.Y - oy);
        if (d.size === 'L') d.X < W / 2 ? lL++ : lR++;
        const col = d.X < W / 3 ? 0 : d.X < (2 * W) / 3 ? 1 : 2;
        sectors[col + (d.Y < oy ? 0 : 3)]! += a;
      }
      const empty = [0, 2, 3, 5].filter((i) => sectors[i]! < sw * 0.04).length;
      const lost = drafts.filter((d) => !d.placed).length;
      // telefono e tablet: foto alternate a sinistra e a destra scendendo lungo la pagina
      let same = 0;
      if (key === 'mob' || key === 'tab') {
        const byY = placed.map((o) => o.d).sort((a, b) => a.Y - b.Y);
        for (let i = 1; i < byY.length; i++) if (byY[i]!.X < W / 2 === byY[i - 1]!.X < W / 2) same++;
        // tante foto sopra quante sotto il titolo
        const above = byY.filter((d) => d.Y < oy).length;
        same += Math.max(0, Math.abs(above - (byY.length - above)) - 1) * 1.5;
      }
      const shrunk = drafts.reduce((s, d) => s + (1 - d.shrink), 0);
      const score =
        Math.abs(mx) / Math.max(1, sw * W * 0.5) * 3 +
        Math.abs(my) / Math.max(1, sw * H * 0.5) +
        (lL === 0 || lR === 0 ? 0.6 : 0) + empty * 0.5 + lost * 4 + shrunk * 2 + same * 0.35;
      return { drafts, score };
    };

    let bestA = attempt(lay.seed);
    for (let v = 1, nv = key === 'desk' ? 8 : 16; v < nv; v++) {
      const a = attempt(lay.seed + v * 101);
      if (a.score < bestA.score) bestA = a;
    }

    // carte finali, ordinate per profondità: davanti = prima a partire, disegnata sopra
    const drafts = bestA.drafts.filter((d) => d.placed).sort((a, b) => b.z - a.z);
    const dropped = new Set(bestA.drafts.filter((d) => !d.placed).map((d) => d.id));
    const rand = rng(lay.seed * 7 + 3);
    const nn = drafts.length;

    cards = drafts.map((d, i) => {
      const el = els.get(d.id)!;
      return {
        id: d.id, el, img: el.querySelector('img')!, size: d.size, ratio: d.ratio, plane: d.plane, rank: i,
        w: d.w, h: d.h, // misura CSS = misura base; la prospettiva la porta a schermo
        X: d.X, Y: d.Y, z: d.z, rx: d.rx, ry: d.ry, rz: d.rz,
        sX: 0, sY: 0, sz: 0, srx: 0, sry: 0, srz: 0, sk: 1,
        c1X: 0, c1Y: 0, c2X: 0, c2Y: 0, hover: 0, hv: 0, rise: false,
      };
    });

    /* Pile. Di norma una sola, sopra il titolo e lontana dal Dock anche mentre la sezione entra.
       Se una carta non può raggiungere la sua posa girando attorno al titolo (colonne laterali
       troppo strette: tablet, telefono), parte da una seconda pila sotto il titolo:
       sul telefono la costellazione si apre così in verticale, verso l'alto e verso il basso. */
    type Zone = { top: number; bot: number; dir: -1 | 1 };
    const zTop: Zone = { top: mTop, bot: prot.t + 6, dir: -1 };
    const pile = (list: Card[], zone: Zone) => {
      const room = Math.max(40, zone.bot - zone.top);
      const eq = Math.max(36, Math.min(lay.sizes.M * unit * 0.9, room * 0.74));
      const cx = W / 2, cy = (zone.top + zone.bot) / 2;
      const n2 = list.length;
      list.forEach((c, j) => {
        const r = j / Math.max(1, n2 - 1);
        c.sz = (40 - j * 9) * depth;
        const sw = eq * Math.sqrt(c.ratio) * (1 - j * 0.012);
        c.sX = cx + (rand() * 2 - 1) * eq * (0.05 + 0.1 * r);
        c.sY = cy + zone.dir * j * eq * 0.014 + (rand() * 2 - 1) * eq * 0.03;
        c.srx = (rand() * 2 - 1) * 2;
        c.sry = (rand() * 2 - 1) * 3;
        c.srz = (j === 0 ? -1.2 : (rand() < 0.5 ? -1 : 1) * lerp(2, 7.5, rand())) * lay.tilt;
        c.sk = sw / (c.w * (P / (P - c.sz)));
      });
      // tutta la pila dentro la sua fascia
      const U0 = () => list.reduce<Rect>((U, c) => {
        const R = project(c.sX, c.sY, c.sz, c.w, c.h, c.srx, c.sry, c.srz, c.sk);
        return { l: Math.min(U.l, R.l), t: Math.min(U.t, R.t), r: Math.max(U.r, R.r), b: Math.max(U.b, R.b) };
      }, { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity });
      for (let k = 0; k < 10 && list.length; k++) {
        const U = U0();
        if (U.t >= zone.top && U.b <= zone.bot) break;
        const f = Math.min(1, (room - 4) / Math.max(1, U.b - U.t)) * 0.97;
        for (const c of list) {
          c.sk *= f;
          c.sY = cy + (c.sY - cy) * f;
          c.sX = cx + (c.sX - cx) * f;
        }
      }
    };

    // percorsi (curve cubiche nello spazio dello schermo): chi attraverserebbe il titolo lo aggira
    // di lato; chi sfiorerebbe il Dock resta alto e scende solo alla fine
    const route = (c: Card, dir: -1 | 1): boolean => {
      const Rf = project(c.X, c.Y, c.z, c.w, c.h, c.rx, c.ry, c.rz);
      const hw = (Rf.r - Rf.l) / 2, hh = (Rf.b - Rf.t) / 2;
      // misura apparente lungo il volo: dalla pila alla posa finale, + sollevamento e rotazioni
      const e0 = (c.sk * (P / (P - c.sz))) / (P / (P - c.z));
      const at = (s: number) => {
        const u = 1 - s;
        return [
          u * u * u * c.sX + 3 * u * u * s * c.c1X + 3 * u * s * s * c.c2X + s * s * s * c.X,
          u * u * u * c.sY + 3 * u * u * s * c.c1Y + 3 * u * s * s * c.c2Y + s * s * s * c.Y,
        ] as const;
      };
      const crosses = (): '' | 'p' | 'd' => {
        for (let s = 0.03; s < 0.99; s += 0.025) {
          const [px, py] = at(s);
          const e = lerp(e0, 1, s) * 1.16;
          const R = { l: px - hw * e, r: px + hw * e, t: py - hh * e, b: py + hh * e };
          if (hits(R, grow(prot, -g * 0.35))) return 'p';
          if (hits(R, dock)) return 'd';
        }
        return '';
      };
      const set = (x1: number, y1: number, x2: number, y2: number) => {
        c.c1X = x1; c.c1Y = y1; c.c2X = x2; c.c2Y = y2;
      };
      set(lerp(c.sX, c.X, 1 / 3), lerp(c.sY, c.Y, 1 / 3), lerp(c.sX, c.X, 2 / 3), lerp(c.sY, c.Y, 2 / 3));
      let why = crosses();
      if (why === 'd') {
        // resta alta finché non è fuori dalla fascia del Dock, poi scende quasi in verticale
        const wy = Math.min(c.sY, dock.t - hh - 12);
        dock: for (const a of [0.33, 0.7]) {
          for (const k of [0, 0.15, 0.3]) {
            set(lerp(c.sX, c.X, a), wy, c.X + (c.X - c.sX) * k, wy);
            why = crosses();
            if (why !== 'd') break dock;
          }
        }
      }
      if (why === 'p') {
        // prima ci si allontana appena dal titolo e si esce di lato, poi si scende (o si sale)
        // lungo la colonna laterale fino alla posa finale
        const side = c.X < ox ? -1 : 1;
        search: for (const extra of [16, 60, 120, 190]) {
          const wx = clamp(side < 0 ? prot.l - hw - extra : prot.r + hw + extra, m + hw * 0.5, W - m - hw * 0.5);
          for (const f of [0.35, 0.15, 0, 1, 1.12]) {
            for (const up of [0.25, 0.6]) {
              const y1 = c.sY + dir * hh * up;
              set(lerp(c.sX, wx, 0.95), y1, wx, lerp(y1, c.Y, f));
              why = crosses();
              if (!why) break search;
            }
          }
        }
      }
      return !why;
    };

    let upper = [...cards];
    dockZone = H - dockTop;
    pile(upper, zTop);
    const failed = upper.filter((c) => !route(c, -1));
    if (failed.length) {
      // chi non può girare attorno al titolo (colonne laterali troppo strette) non parte dalla pila:
      // compare sul posto, salendo di pochi pixel e sfumando, già nel suo piano di profondità.
      // Sul telefono la costellazione si apre così in verticale: la pila verso l'alto, il resto dal basso.
      // salita breve (resta nel margine del Dock): la foto "si sviluppa" quasi sul posto
      const rise = clamp(H * 0.02, 10, 16);
      for (const c of failed) {
        c.rise = true;
        c.sX = c.X;
        c.sY = c.Y + rise;
        c.sz = c.z - 50 * depth;
        c.srx = c.rx * 1.4; c.sry = c.ry * 1.4; c.srz = c.rz * 1.5;
        c.sk = (0.92 * (P / (P - c.z))) / (P / (P - c.sz));
        c.c1X = c.X; c.c1Y = lerp(c.sY, c.Y, 1 / 3); c.c2X = c.X; c.c2Y = lerp(c.sY, c.Y, 2 / 3);
      }
      upper = cards.filter((c) => !c.rise);
      pile(upper, zTop);
      upper.forEach((c) => route(c, -1));
    }

    stackBottom = cards.filter((c) => !c.rise).reduce((b, c) => Math.max(b, project(c.sX, c.sY, c.sz, c.w, c.h, c.srx, c.sry, c.srz, c.sk).b), 0);
    els.forEach((el, id) => {
      const on = cards.some((c) => c.id === id);
      el.hidden = !on;
      if (dropped.has(id)) el.hidden = true;
    });
    for (const c of cards) {
      c.el.style.width = `${c.w.toFixed(1)}px`;
      c.el.style.height = `${c.h.toFixed(1)}px`;
      c.el.style.zIndex = String(nn - c.rank);
      c.el.dataset.size = c.size;
      c.el.dataset.plane = c.plane;
    }
    box.style.setProperty('--ps-p', `${P}px`);
    box.style.setProperty('--ps-ox', `${ox.toFixed(1)}px`);
    box.style.setProperty('--ps-oy', `${oy.toFixed(1)}px`);
  };

  /* ---------- Immagini: carica vicino alla sezione, mostra solo se decodificata ---------- */
  const load = () => {
    for (const c of cards) {
      const img = c.img;
      if (c.el.dataset.ready !== undefined || img.dataset.wait) continue;
      img.dataset.wait = '1';
      const done = () => {
        if (img.naturalWidth > 0) c.el.setAttribute('data-ready', '');
        delete img.dataset.wait;
      };
      const fail = () => {
        // immagine non disponibile: niente cornice vuota, la composizione si rifà senza
        if (broken.has(c.id)) return;
        broken.add(c.id);
        c.el.hidden = true;
        delete img.dataset.wait;
        relayout();
      };
      const decode = () => img.decode().then(done, done);
      img.addEventListener('load', decode, { once: true });
      img.addEventListener('error', fail, { once: true });
      img.loading = 'eager';
      if (img.complete && img.naturalWidth > 0) decode();
      else if (img.complete && img.currentSrc) fail(); // errore già avvenuto prima dell'ascolto
      // rete lenta: nessun timeout che mostri una cornice vuota, la carta resta semplicemente nascosta
    }
  };

  const layout = () => {
    const key = pickLayout();
    const lay = layouts[key];
    if (!lay) return;
    animated = lay.motion && !rmQuery.matches;
    root.toggleAttribute('data-static', !animated);
    root.dataset.layout = key;
    compose(key, lay);
    if (!animated) target = shown = 1;
    if (near) load();
  };

  /* ---------- Avanzamento dallo scroll ---------- */
  const read = () => {
    const r = root.getBoundingClientRect();
    const vh = window.innerHeight;
    enter = clamp01((vh - r.top) / vh);
    // la pila compare solo quando il suo bordo basso ha superato la fascia del Dock
    pileIn = animated ? clamp01((vh - dockZone - 10 - (r.top + stackBottom)) / 70) : 1;
    if (!animated) return;
    // inizia quando la pila è tutta sullo schermo, finisce all'80 % della corsa sticky
    const start = -0.15 * vh, end = 0.8 * Math.max(1, r.height - vh);
    target = clamp01((-r.top - start) / (end - start));
    hold = clamp01((-r.top - end) / Math.max(1, r.height - vh - end));
  };

  const write = () => {
    const d = 0.035;
    const maxDelay = d * Math.max(0, cards.length - 1);
    const settled = shown > 0.985;
    for (const c of cards) {
      const lin = animated ? clamp01((shown - c.rank * d) / (1 - maxDelay)) : 1;
      const t = ease(lin);
      const u = 1 - t;
      // centro sullo schermo lungo la curva; profondità, rotazioni e misura interpolate
      let X = u * u * u * c.sX + 3 * u * u * t * c.c1X + 3 * u * t * t * c.c2X + t * t * t * c.X;
      let Y = u * u * u * c.sY + 3 * u * u * t * c.c1Y + 3 * u * t * t * c.c2Y + t * t * t * c.Y;
      const flight = Math.sin(Math.PI * lin);
      const z = lerp(c.sz, c.z, t) + 30 * depth * flight + 36 * c.hv;
      const f = P / (P - z), f1 = P / (P - c.z), f0 = P / (P - c.sz);
      // misura apparente: dalla pila alla posa finale (la prospettiva del piano dà la scala finale)
      const sw = lerp(c.sk * f0, f1, t) * (1 + 0.02 * c.hv) * (1 + 0.025 * flight);
      const k = sw / f;
      if (animated) {
        X += -ptr.sx * PTR[c.plane] * depth;
        Y += -ptr.sy * PTR[c.plane] * 0.7 * depth - DRIFT[c.plane] * hold * depth;
      }
      const x = ox + (X - ox) / f, y = oy + (Y - oy) / f;
      const rx = lerp(c.srx, c.rx, t), ry = lerp(c.sry, c.ry, t), rz = lerp(c.srz, c.rz, t);
      if (c.rise) {
        // la foto "esce" dal basso con un taglio netto (niente trasparenze che sembrano cornici vuote)
        const k = animated ? ease(clamp01((lin - 0.05) / 0.4)) : 1;
        const cut = k >= 0.999 ? '' : k <= 0.001 ? 'inset(100% 0 0 0)' : `inset(${((1 - k) * 100).toFixed(2)}% 0 0 0 round var(--pr))`;
        if (c.el.style.clipPath !== cut) c.el.style.clipPath = cut;
      }
      c.el.style.transform = `translate3d(${(x - c.w / 2).toFixed(1)}px, ${(y - c.h / 2).toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${k.toFixed(4)})`;
    }
    stage.style.setProperty('--to', animated ? smooth((enter - 0.15) / 0.5).toFixed(3) : '1');
    box.style.opacity = shown > 0.02 ? '' : pileIn.toFixed(3);
    stage.style.setProperty('--tp', animated ? ease(clamp01(shown / 0.7)).toFixed(3) : '1');
    root.toggleAttribute('data-spread', settled);
  };

  const frame = (ts: number) => {
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 1 / 60);
    last = ts;
    // valore levigato molto smorzato: segue lo scroll senza rimbalzo
    shown += (target - shown) * (1 - Math.exp(-dt * 9));
    if (Math.abs(target - shown) < 0.0004) shown = target;
    const spread = shown > 0.985 && fine.matches && animated;
    const canLift = !rmQuery.matches && (animated ? shown > 0.985 : true);
    const tx = spread ? ptr.x : 0, ty = spread ? ptr.y : 0;
    ptr.sx += (tx - ptr.sx) * (1 - Math.exp(-dt * 5));
    ptr.sy += (ty - ptr.sy) * (1 - Math.exp(-dt * 5));
    let hoverMoving = false;
    for (const c of cards) {
      const h = canLift ? c.hover : 0;
      c.hv += (h - c.hv) * (1 - Math.exp(-dt * 14));
      if (Math.abs(h - c.hv) < 0.002) c.hv = h;
      else hoverMoving = true;
    }
    write();
    const moving = shown !== target || Math.abs(tx - ptr.sx) > 0.002 || Math.abs(ty - ptr.sy) > 0.002 || hoverMoving;
    root.toggleAttribute('data-moving', moving);
    raf = visible && moving ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  };
  const kick = () => {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  };
  const onScroll = () => {
    read();
    if (!animated) return write();
    kick();
  };

  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) onScroll();
    else root.removeAttribute('data-moving');
  }).observe(root);
  // le immagini partono un po' prima che la sezione entri
  new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !near) {
        near = true;
        load();
      }
    },
    { rootMargin: '120% 0px 120% 0px' },
  ).observe(root);
  addEventListener('scroll', onScroll, { passive: true });

  let rt = 0, lastKey = '';
  function relayout() {
    cancelAnimationFrame(rt);
    rt = requestAnimationFrame(() => {
      layout();
      read();
      shown = target;
      write();
    });
  }
  let lastW = 0, lastH = 0;
  addEventListener(
    'resize',
    () => {
      // la barra degli indirizzi dei telefoni cambia solo l'altezza visibile: lo stage (svh) no
      const w = window.innerWidth, h = stage.clientHeight, key = pickLayout();
      if (w === lastW && h === lastH && key === lastKey) return;
      lastW = w; lastH = h; lastKey = key;
      relayout();
    },
    { passive: true },
  );
  rmQuery.addEventListener('change', relayout);

  // puntatore (solo mouse, solo a composizione aperta) e sollevamento al passaggio
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' || !visible) return;
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    },
    { passive: true },
  );
  const cardOf = (el: EventTarget | null) => cards.find((c) => c.el === el);
  els.forEach((el) => {
    el.addEventListener('pointerenter', (e) => {
      const c = cardOf(el);
      if (!c || e.pointerType !== 'mouse') return;
      c.hover = 1;
      el.setAttribute('data-hover', '');
      el.style.zIndex = '60';
      kick();
    });
    el.addEventListener('pointerleave', () => {
      const c = cardOf(el);
      if (!c) return;
      c.hover = 0;
      el.removeAttribute('data-hover');
      el.style.zIndex = String(cards.length - c.rank);
      kick();
    });
    // touch: un tocco solleva la foto per un istante (niente dipende dall'hover)
    el.addEventListener('pointerup', (e) => {
      const c = cardOf(el);
      if (!c || e.pointerType === 'mouse') return;
      c.hover = 1;
      el.setAttribute('data-hover', '');
      kick();
      setTimeout(() => {
        c.hover = 0;
        el.removeAttribute('data-hover');
        kick();
      }, 650);
    });
  });

  // stato iniziale coerente con la posizione (arrivo diretto, ricarica a metà pagina);
  // le carte compaiono solo dopo la composizione con i caratteri definitivi (niente salti)
  lastW = window.innerWidth; lastH = stage.clientHeight; lastKey = pickLayout();
  layout();
  read();
  shown = target;
  write();
  const reveal = () => {
    layout();
    read();
    shown = target;
    write();
    root.setAttribute('data-laid', '');
  };
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(reveal, reveal);
}
