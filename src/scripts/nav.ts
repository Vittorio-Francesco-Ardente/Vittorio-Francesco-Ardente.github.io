/* Navigazione: scroll con curva personalizzata, sezione attiva, stato della barra. */
import { reducedMotion } from './ui';

/* Curva di Bézier cubica: parte con una spinta netta, corre, poi frena a lungo. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    // Bisezione di sicurezza
    let lo = 0, hi = 1;
    for (let i = 0; i < 12 && Math.abs(sx(t) - x) > 1e-5; i++) {
      if (sx(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}
/* Spinta iniziale breve e decisa, corsa rapida, frenata progressiva (= --ease-scroll) */
const ease = bezier(0.35, 0, 0.1, 1);

let animating = false;
let cancel: (() => void) | null = null;
/* Sezione "bloccata": durante uno scroll comandato il marcatore va subito sul numero di destinazione,
   così non insegue le sezioni attraversate e non resta mai disallineato. */
let lockId: string | null = null;
let applyActive: ((id: string) => void) | null = null;
export function lockActive(id: string | null) {
  lockId = id;
  if (id) applyActive?.(id);
}

const targetY = (el: Element) => Math.round(el.getBoundingClientRect().top + window.scrollY);

/** Scorre fino all'elemento con accelerazione iniziale e frenata precisa. */
export function scrollToEl(el: HTMLElement, onDone?: () => void, onEnd?: () => void) {
  cancel?.();
  const start = window.scrollY;
  let dest = Math.min(targetY(el), document.documentElement.scrollHeight - window.innerHeight);
  const dist = Math.abs(dest - start);
  if (reducedMotion() || dist < 2) {
    window.scrollTo({ top: dest, behavior: 'instant' as ScrollBehavior });
    onDone?.();
    onEnd?.();
    return;
  }
  // breve ≈ 420–560 ms · media ≈ 550–720 ms · lunga ≈ 700–900 ms (oltre 1 s solo per distanze enormi)
  const duration = Math.min(dist > 12000 ? 1000 : 900, Math.max(420, 360 + Math.sqrt(dist) * 7.2));
  const t0 = performance.now();
  animating = true;
  let raf = 0;
  const stop = () => {
    animating = false;
    cancelAnimationFrame(raf);
    removeEventListener('wheel', stop);
    removeEventListener('touchstart', stop);
    removeEventListener('keydown', stop);
    cancel = null;
    onEnd?.();
  };
  cancel = stop;
  addEventListener('wheel', stop, { passive: true });
  addEventListener('touchstart', stop, { passive: true });
  addEventListener('keydown', stop);

  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration);
    // Ricalcola la destinazione: immagini caricate a metà corsa non spostano l'arrivo
    if (p > 0.6) dest = Math.min(targetY(el), document.documentElement.scrollHeight - window.innerHeight);
    const y = start + (dest - start) * ease(p);
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
    if (p < 1) raf = requestAnimationFrame(step);
    else {
      window.scrollTo({ top: dest, behavior: 'instant' as ScrollBehavior });
      stop();
      onDone?.();
    }
  };
  raf = requestAnimationFrame(step);
}

/** Naviga verso un'ancora interna. Restituisce false se l'ancora non esiste. */
export function goToHash(hash: string, push = true) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  const el = id ? document.getElementById(id) : null;
  if (!el) return false;
  // il numero attivo passa subito alla destinazione; si sblocca all'arrivo o se l'utente interviene
  lockActive(id);
  scrollToEl(
    el,
    () => {
      const focusTarget = el.querySelector<HTMLElement>('h1, h2') ?? el;
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    },
    () => lockActive(null),
  );
  if (push && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  return true;
}

export function initAnchors() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a || a.closest('[data-menu-link]')) return;
    const hash = a.getAttribute('href') ?? '';
    if (hash.length < 2) return;
    if (goToHash(hash)) e.preventDefault();
  });
  addEventListener('popstate', () => {
    if (location.hash) goToHash(location.hash, false);
  });
}

/* ---------------- Sezione attiva (una sola fonte per barra, Dock e menu) ---------------- */
export function initSpy() {
  const sections = [...document.querySelectorAll<HTMLElement>('main [data-section][id]')];
  if (!sections.length) return;
  const onHome = document.querySelector('[data-dock][data-home]') !== null;
  const dockItems = onHome ? [...document.querySelectorAll<HTMLAnchorElement>('[data-dock-item][data-covers]')] : [];
  const navLinks = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')].map((a) => [a.dataset.nav!, a]));
  const menuLinks = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-menu-link]')].map((a) => [(a.getAttribute('href') ?? '').split('#')[1] ?? '', a]));
  const darkZones = [...document.querySelectorAll<HTMLElement>('[data-surface="dark"]')];

  let active = '';
  const setActive = (id: string) => {
    if (id === active) return;
    active = id;
    for (const item of dockItems) item.setAttribute('aria-current', String((item.dataset.covers ?? '').split(' ').includes(id)));
    navLinks.forEach((a, key) => a.setAttribute('aria-current', String(key === id)));
    menuLinks.forEach((a, key) => a.setAttribute('aria-current', String(key === id)));
  };
  applyActive = setActive;

  const onDarkAt = (y: number) =>
    darkZones.some((z) => {
      const r = z.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });

  /* Profondità delle fotografie: pochi pixel, dentro lo stesso fotogramma della spia di sezione */
  const depths = [...document.querySelectorAll<HTMLElement>('[data-depth] picture')];
  const depthOn = depths.length > 0 && !reducedMotion() && matchMedia('(min-width: 861px)').matches;
  const moveDepths = () => {
    if (!depthOn) return;
    const h = window.innerHeight;
    for (const img of depths) {
      const r = img.getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) continue;
      const shift = Math.max(-6, Math.min(6, ((r.top + r.height / 2 - h / 2) / h) * -12));
      img.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.035)`;
    }
  };

  /* Ritratto dell'hero: parallasse leggerissima nel primo tratto di scroll (solo desktop/tablet) */
  const hero = document.querySelector<HTMLElement>('.hero');
  const heroPx = !!hero && !reducedMotion() && matchMedia('(min-width: 761px) and (min-height: 521px)').matches;
  let lastPy = -1;
  const moveHero = () => {
    if (!heroPx || !hero) return;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.2 && lastPy === 36) return;
    const py = Math.min(36, Math.max(0, y * 0.07));
    if (Math.abs(py - lastPy) < 0.2) return;
    lastPy = py;
    hero.style.setProperty('--py', `${py.toFixed(1)}px`);
  };

  const update = () => {
    moveDepths();
    moveHero();
    const line = window.innerHeight * 0.4;
    let id = sections[0]!.id;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
    setActive(lockId ?? id);
    document.querySelector('[data-backhome]')?.toggleAttribute('data-on-dark', onDarkAt(window.innerHeight - 110));
  };
  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ==========================================================================
   Barra → goccia → Dock. Un solo stato continuo derivato dallo scroll (--nav-progress 0 → 1),
   diviso in fasi normalizzate (nessun timer: scroll veloce, cambi di direzione, ancore e
   ridimensionamenti non possono lasciare stati a metà):
     A  0–40 px     barra stabile
     B  40–90       tensione superficiale: la barra si restringe, gli angoli si arrotondano,
                    sotto il centro nasce un rigonfiamento
     C  90–130      formazione: la superficie si raccoglie verso la larghezza del Dock, i testi
                    si comprimono, il rigonfiamento cresce
     D  130–160     distacco: la goccia si separa (capsula → goccia appena allungata),
                    la barra si ritira; il monogramma entra nella goccia
     E  160–220     caduta: accelerazione lieve, traiettoria appena curva, scaleY > scaleX
     F  220–250     posa: la goccia si allarga nel guscio del Dock, le icone compaiono,
                    l'ingrandimento si attiva solo a Dock posato
   Tablet: caduta più corta; telefono: la goccia scende di pochi pixel e la barra inferiore
   si posa al suo posto. "Riduci movimento": semplice dissolvenza tra i due stati.
   ========================================================================== */
type Rect = { l: number; t: number; r: number; b: number };
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeIn = (x: number) => clamp01(x) ** 2;
const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const easeInOut = (x: number) => {
  const v = clamp01(x);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/* caduta della goccia: parte lenta, accelera appena, rallenta prima del Dock — cubic-bezier(.45,.05,.3,1) */
const fallEase = (x: number) => {
  const v = clamp01(x);
  let t = v;
  for (let i = 0; i < 6; i++) {
    const bx = 3 * (1 - t) * (1 - t) * t * 0.45 + 3 * (1 - t) * t * t * 0.3 + t * t * t - v;
    const dx = 3 * (1 - t) * (1 - t) * 0.45 + 6 * (1 - t) * t * (0.3 - 0.45) + 3 * t * t * (1 - 0.3);
    if (Math.abs(dx) < 1e-6) break;
    t = clamp01(t - bx / dx);
  }
  return 3 * (1 - t) * (1 - t) * t * 0.05 + 3 * (1 - t) * t * t * 1 + t * t * t;
};
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ l: lerp(a.l, b.l, t), t: lerp(a.t, b.t, t), r: lerp(a.r, b.r, t), b: lerp(a.b, b.b, t) });
const phase = (y: number, a: number, b: number) => clamp01((y - a) / (b - a));
const centered = (cx: number, w: number, t: number, h: number): Rect => ({ l: cx - w / 2, r: cx + w / 2, t, b: t + h });

export function initNavDevice() {
  const nd = document.querySelector<HTMLElement>('[data-nd]');
  const dock = document.querySelector<HTMLElement>('[data-dock]');
  const panel = document.querySelector<HTMLElement>('[data-dock-panel]');
  if (!nd || !dock || !panel) return;
  const q = <T extends HTMLElement>(sel: string) => nd.querySelector<T>(sel)!;
  const edge = q('[data-nd-edge]'), fill = q('[data-nd-fill]');
  const dEdge = q('[data-nd-dedge]'), drop = q('[data-nd-drop]');
  const mark = q('[data-nd-mark]'), slot = q('[data-nd-slot]');
  const gName = q('[data-nd-name]'), gLinks = q('[data-nd-links]'), gTools = q('[data-nd-tools]');
  const homeTile = panel.querySelector<HTMLElement>('[data-slot-home]');

  let mode: 'desk' | 'tab' | 'mob' = 'desk';
  let vw = 0, vh = 0, dockW = 480, dockH = 64, radius = 22;
  let dockR: Rect = { l: 0, t: 0, r: 0, b: 0 };
  let markA = { x: 0, y: 0 }, home = { x: 0, y: 0 }, markScale = 0.6, mw = 52;
  let linksRight = 0, toolsRight = 0, toolsW = 0;
  let last = '';
  let closeLang: (() => void) | null = null;

  const measure = () => {
    vw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    mode = vw <= 700 ? 'mob' : vw < 1100 ? 'tab' : 'desk';
    nd.dataset.mode = mode;
    panel.querySelectorAll<HTMLElement>('[data-dock-item]').forEach((i) => i.style.removeProperty('--w'));
    // misura il Dock a riposo e nella sua posizione finale
    nd.style.setProperty('--dockin', '1');
    const p = panel.getBoundingClientRect();
    dockR = { l: p.left, t: p.top, r: p.right, b: p.bottom };
    dockW = p.width;
    dockH = p.height;
    radius = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 22;
    nd.style.setProperty('--dw', `${dockW}px`);
    nd.style.setProperty('--dh', `${dockH}px`);
    for (const g of [gName, gLinks, gTools]) g.style.transform = '';
    const a = slot.getBoundingClientRect();
    mw = mark.offsetWidth;
    const mh = mark.offsetHeight;
    markA = { x: a.left + (a.width - mw) / 2, y: a.top + (a.height - mh) / 2 };
    linksRight = gLinks.getBoundingClientRect().right;
    const tr = gTools.getBoundingClientRect();
    toolsRight = tr.right;
    toolsW = tr.width;
    if (homeTile) {
      const h = homeTile.getBoundingClientRect();
      markScale = Math.min(1, (h.width * 0.78) / mw);
      home = { x: h.left + h.width / 2 - dockR.l - (mw * markScale) / 2, y: h.top + h.height / 2 - dockR.t - (mh * markScale) / 2 };
    }
    last = '';
    render();
  };

  const clipOf = (r: Rect, rad: number) =>
    `inset(${r.t.toFixed(1)}px ${(vw - r.r).toFixed(1)}px ${(vh - r.b).toFixed(1)}px ${r.l.toFixed(1)}px round ${rad.toFixed(1)}px)`;

  /* disegna la goccia nel rettangolo r con raggio visivo rad (deformazione solo via transform) */
  const placeDrop = (r: Rect, rad: number) => {
    const w = Math.max(0.01, r.r - r.l), h = Math.max(0.01, r.b - r.t);
    const sx = w / dockW, sy = h / dockH;
    const tf = `translate3d(${r.l.toFixed(1)}px, ${r.t.toFixed(1)}px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
    const br = `${(rad / sx).toFixed(1)}px / ${(rad / sy).toFixed(1)}px`;
    drop.style.transform = dEdge.style.transform = tf;
    drop.style.borderRadius = dEdge.style.borderRadius = br;
  };

  const render = () => {
    const y = Math.max(0, window.scrollY);
    const rm = reducedMotion();
    nd.toggleAttribute('data-rm', rm);
    if (rm) {
      // cambio di stato semplice: la barra svanisce, il Dock appare (dissolvenza CSS)
      const docked = y > 160;
      const key = `rm|${docked}|${vw}|${vh}`;
      if (key === last) return;
      last = key;
      for (const g of [gName, gLinks, gTools]) {
        g.style.opacity = docked ? '0' : '1';
        g.style.transform = '';
      }
      mark.style.transform = `translate3d(${markA.x}px, ${markA.y}px, 0)`;
      mark.style.opacity = docked ? '0' : '1';
      nd.style.setProperty('--so', '0');
      nd.style.setProperty('--dockin', docked ? '1' : '0');
      nd.style.setProperty('--di', docked ? '1' : '0');
      nd.style.setProperty('--nav-progress', docked ? '1' : '0');
      nd.toggleAttribute('data-drop', false);
      nd.toggleAttribute('data-bar-live', !docked);
      nd.toggleAttribute('data-dock-live', docked);
      nd.toggleAttribute('data-docked', docked);
      if (!docked) closeLang?.();
      return;
    }

    const pB = phase(y, 40, 90), pC = phase(y, 90, 130), pD = phase(y, 130, 160), pE = phase(y, 160, 220), pF = phase(y, 220, 250);
    const key = `${y > 260 ? 260 : Math.round(y * 2) / 2}|${vw}|${vh}`;
    if (key === last) return;
    last = key;
    const cx = vw / 2;

    /* ---- superficie della barra ---- */
    const S0: Rect = { l: 0, t: 0, r: vw, b: 68 };
    const W1 = mode === 'mob' ? vw - 24 : Math.min(vw - 48, Math.max(dockW + 260, vw * 0.7));
    const W2 = mode === 'mob' ? vw - 40 : dockW + 60;
    const S1 = centered(cx, W1, 6, 56), S2 = centered(cx, W2, 8, 52), S3 = centered(cx, W2 * 0.55, 10, 36);
    let S = S0, sRad = 0, so = 0;
    if (pD > 0) {
      S = lerpRect(S2, S3, easeIn(pD));
      sRad = lerp(26, 18, pD);
      so = 1 - clamp01((pD - 0.25) / 0.75);
    } else if (pC > 0) {
      S = lerpRect(S1, S2, easeInOut(pC));
      sRad = 26;
      so = 1;
    } else {
      S = lerpRect(S0, S1, easeIn(pB)); // formazione: ease-in morbido
      sRad = lerp(0, 26, pB);
      so = Math.min(1, pB * 2.2);
    }
    if (so > 0.001) {
      edge.style.clipPath = clipOf(S, sRad);
      fill.style.clipPath = clipOf({ l: S.l + 1, t: S.t + 1, r: S.r - 1, b: S.b - 1 }, Math.max(0, sRad - 1));
    }
    nd.style.setProperty('--so', so.toFixed(3));

    /* ---- goccia ---- */
    let D: Rect | null = null, dRad = 0, dOp = 1, stretch = 0, ds = 0;
    const capW = dockW * 0.9;
    const topDetached = S3.b + 12;
    const fallEnd = mode === 'desk' ? dockR.t : mode === 'tab' ? topDetached + (dockR.t - topDetached) * 0.38 : topDetached + 34;
    if (pF > 0 && mode === 'desk') {
      // posa: si allarga nel guscio del Dock, decelerazione morbida, nessun rimbalzo
      const e = easeOut(pF);
      stretch = 0.75 * (1 - e);
      D = centered(cx, lerp(capW, dockW, e), dockR.t, dockH);
      dRad = lerp(dockH / 2, radius, e);
      ds = 0.6 * (1 - e);
    } else if (pE > 0) {
      // caduta: accelerazione lieve, poi decelerazione morbida prima della posa (nessun rimbalzo)
      const e = fallEase(pE);
      stretch = 1 - 0.25 * pE;
      const top = lerp(topDetached, fallEnd, e);
      D = centered(cx + Math.sin(Math.PI * pE) * 10, capW, top, dockH);
      dRad = dockH / 2;
      ds = 0.6 + 0.4 * Math.sin(Math.PI * pE);
      if (mode !== 'desk') dOp = 1 - clamp01((pE - 0.35) / 0.65);
    } else if (pD > 0) {
      // distacco: dal rigonfiamento alla capsula separata, un po' più rapido
      const e = easeInOut(pD);
      const from = centered(cx, W2 * 0.62, S2.b - 46 + 14, 46);
      D = lerpRect(from, centered(cx, capW, topDetached, dockH), e);
      dRad = (D.b - D.t) / 2;
      stretch = pD;
      ds = 0.6 * pD;
    } else if (pB > 0) {
      // rigonfiamento sotto il centro della barra (tensione superficiale)
      const wb = pC > 0 ? lerp(120, W2 * 0.62, easeInOut(pC)) : lerp(0, 120, easeIn(pB));
      const pr = pC > 0 ? lerp(5, 14, pC) : lerp(0, 5, pB);
      const hb = 2 * pr + 18;
      D = centered(cx, wb, S.b - hb + pr, hb);
      dRad = hb / 2;
    }
    if (D) {
      // allungamento verticale da goccia: scaleY appena > scaleX, poi di nuovo 1
      const w = D.r - D.l, h = D.b - D.t, mx = (D.l + D.r) / 2, my = (D.t + D.b) / 2;
      const kw = 1 - 0.04 * stretch, kh = 1 + 0.045 * stretch;
      D = { l: mx - (w * kw) / 2, r: mx + (w * kw) / 2, t: my - (h * kh) / 2, b: my + (h * kh) / 2 };
      placeDrop(D, dRad);
      drop.style.opacity = dEdge.style.opacity = dOp.toFixed(3);
    }
    nd.style.setProperty('--ds', ds.toFixed(3));
    nd.toggleAttribute('data-drop', !!D && pB > 0);

    /* ---- monogramma: resta per ultimo nella barra, poi entra nella goccia ---- */
    let mx = Math.max(markA.x, S.l + 16), my = markA.y, ms = 1, mo = 1;
    if (D && pD > 0) {
      const sx = (D.r - D.l) / dockW, sy = (D.b - D.t) / dockH;
      const tx = D.l + home.x * sx, ty = D.t + home.y * sy;
      const k = pE > 0 || pF > 0 ? 1 : easeInOut(pD);
      mx = lerp(mx, tx, k);
      my = lerp(my, ty, k);
      ms = lerp(1, markScale, k);
      mo = dOp;
    }
    mark.style.transform = `translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0) scale(${ms.toFixed(3)})`;
    mark.style.opacity = mo.toFixed(3);

    /* ---- testi della barra: si comprimono verso il centro; lingua e tema per ultimi ---- */
    const inner = S.r - 18;
    gName.style.transform = `translateX(${(mx - markA.x).toFixed(1)}px)`;
    gName.style.opacity = clamp01(1 - pB * 0.3 - pC * 1.6).toFixed(3);
    gTools.style.transform = `translateX(${Math.min(0, inner - toolsRight).toFixed(1)}px) scale(${(1 - 0.08 * pC).toFixed(3)})`;
    gTools.style.opacity = clamp01(1 - clamp01((pC - 0.35) / 0.65) * 0.7 - pD * 1.4).toFixed(3);
    gLinks.style.transform = `translateX(${Math.min(0, inner - toolsW - 22 - linksRight).toFixed(1)}px) scale(${(1 - 0.08 * pB).toFixed(3)})`;
    gLinks.style.opacity = clamp01(1 - pB * 0.55 - pC * 1.8).toFixed(3);

    /* ---- Dock ---- */
    const dockin = mode === 'desk' ? (pF > 0 ? 1 : 0) : easeOut(pF);
    nd.style.setProperty('--dockin', dockin.toFixed(3));
    nd.style.setProperty('--di', pF.toFixed(3));
    nd.style.setProperty('--nav-progress', (pB * 0.2 + pC * 0.2 + pD * 0.2 + pE * 0.25 + pF * 0.15).toFixed(3));
    nd.toggleAttribute('data-bar-live', pB < 0.5 && pC === 0);
    nd.toggleAttribute('data-dock-live', pF > 0);
    nd.toggleAttribute('data-docked', pF >= 1);
    if (pF < 1) closeLang?.();
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      render();
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  let rt = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(rt);
    rt = requestAnimationFrame(measure);
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', measure);
  document.fonts?.ready.then(measure).catch(() => {});
  measure();
  nd.setAttribute('data-ready', '');

  /* ---------- Lingua: piccolo pannello sopra il Dock ---------- */
  const langBtn = dock.querySelector<HTMLButtonElement>('[data-dock-langbtn]');
  const langBox = dock.querySelector<HTMLElement>('[data-dock-lang]');
  if (langBtn && langBox) {
    const set = (open: boolean) => {
      langBtn.setAttribute('aria-expanded', String(open));
      langBox.hidden = !open;
    };
    closeLang = () => {
      if (!langBox.hidden) set(false);
    };
    langBtn.addEventListener('click', () => set(!!langBox.hidden));
    document.addEventListener('pointerdown', (e) => {
      const tgt = e.target as Element;
      if (!langBox.hidden && !langBox.contains(tgt) && !langBtn.contains(tgt)) set(false);
    });
    dock.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !langBox.hidden) {
        set(false);
        langBtn.focus();
      }
    });
    dock.addEventListener('focusout', (e) => {
      const to = (e as FocusEvent).relatedTarget as Node | null;
      if (to && !langBox.contains(to) && to !== langBtn) set(false);
    });
  }

  initMagnify(panel, () => nd.hasAttribute('data-docked'));
}

/* ==========================================================================
   Ingrandimento del Dock (comportamento del Dock di ibelick, reimplementato):
   - un solo tracciatore del puntatore sull'intero pannello;
   - per ogni voce, la distanza orizzontale dal puntatore decide la dimensione:
     massima sotto il puntatore, intermedia per le vicine, base oltre 150px (caduta a coseno);
   - ogni dimensione segue una molla (massa 0.1, rigidità 150, smorzamento 12);
   - un solo ciclo rAF, attivo solo finché qualche molla è in movimento.
   Solo con puntatore fine e passaggio del mouse; mai su touch o con "riduci movimento".
   ========================================================================== */
function initMagnify(panel: HTMLElement, settled: () => boolean) {
  const canHover = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)');
  const BASE = 44, MAX = 76, DIST = 150;
  const MASS = 0.1, K = 150, C = 12;
  type S = { el: HTMLElement; w: number; v: number; target: number };
  let springs: S[] = [];
  let mouseX = Infinity;
  let raf = 0;
  let last = 0;

  const collect = () => {
    springs = [...panel.querySelectorAll<HTMLElement>('[data-dock-item]')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ el, w: BASE, v: 0, target: BASE }));
  };

  const frame = (ts: number) => {
    const dt = Math.min(0.034, last ? (ts - last) / 1000 : 1 / 60);
    last = ts;
    // lettura (un solo layout), poi scrittura
    const centers = springs.map((s) => {
      const r = s.el.getBoundingClientRect();
      return r.left + r.width / 2;
    });
    let moving = false;
    springs.forEach((s, i) => {
      const d = Math.abs(mouseX - centers[i]!);
      s.target = d < DIST ? BASE + (MAX - BASE) * (0.5 + 0.5 * Math.cos((Math.PI * d) / DIST)) : BASE;
      // integrazione semi-implicita in sotto-passi: stabile anche con fotogrammi lenti
      const steps = Math.ceil(dt / 0.004);
      const h = dt / steps;
      for (let k = 0; k < steps; k++) {
        const a = (-K * (s.w - s.target) - C * s.v) / MASS;
        s.v += a * h;
        s.w += s.v * h;
      }
      if (Math.abs(s.w - s.target) > 0.05 || Math.abs(s.v) > 0.5) moving = true;
      else {
        s.w = s.target;
        s.v = 0;
      }
    });
    springs.forEach((s) => {
      if (s.w === BASE && s.v === 0) s.el.style.removeProperty('--w');
      else s.el.style.setProperty('--w', `${s.w.toFixed(2)}px`);
    });
    raf = moving || mouseX !== Infinity ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  // attivo solo a Dock posato: mai durante la caduta
  const enabled = () => canHover.matches && !reducedMotion() && settled();
  panel.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !enabled()) return;
    collect();
  });
  panel.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !enabled()) return;
    if (!springs.length) collect();
    mouseX = e.clientX;
    kick();
  });
  panel.addEventListener('pointerleave', () => {
    mouseX = Infinity;
    if (springs.length) kick();
  });
  canHover.addEventListener('change', () => {
    mouseX = Infinity;
    springs.forEach((s) => s.el.style.removeProperty('--w'));
    springs = [];
  });
}

export const isAnimatingScroll = () => animating;
