/* ==========================================================================
   Bento riordinabile — senza dipendenze, nessun componente da idratare.
   - Maniglia su ogni scheda (non l'intera scheda: dentro ci sono link e pulsanti).
   - Mouse: il trascinamento parte dopo 4px di movimento.
   - Touch/penna: pressione prolungata (260ms) con tolleranza di 8px; se il dito
     si muove prima, la pagina scorre normalmente.
   - Tastiera: Alt + frecce sposta subito; Spazio/Invio prende e rilascia, frecce
     spostano, Esc annulla. Ogni passo è annunciato in una regione aria-live.
   - Le altre schede si riposizionano con FLIP (320ms); la scheda rilasciata si
     assesta senza rimbalzi. Si salva solo l'ordine (id semantici), mai coordinate.
   ========================================================================== */
import { reducedMotion } from './ui';

const KEY = 'vfa:bento-order:v1';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const LONG_PRESS = 260;
const TOLERANCE = 8;

export function initBento() {
  const grid = document.querySelector<HTMLElement>('[data-bento]');
  if (!grid) return;
  const live = document.querySelector<HTMLElement>('[data-bento-live]');
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-arrange-reset]');
  const menuBtn = document.querySelector<HTMLButtonElement>('[data-arrange-btn]');
  const panel = document.querySelector<HTMLElement>('[data-arrange-panel]');
  const fixed = grid.querySelector<HTMLElement>('[data-bento-fixed]');

  const tip = document.querySelector<HTMLElement>('[data-arrange-tip]');
  const TIP_KEY = 'vfa:bento-hint:v1';
  const hideTip = () => {
    if (!tip || tip.hidden) return;
    try {
      localStorage.setItem(TIP_KEY, '1');
    } catch {
      /* niente */
    }
    tip.setAttribute('data-leaving', '');
    window.setTimeout(() => (tip.hidden = true), reducedMotion() ? 0 : 320);
  };
  try {
    if (tip && !localStorage.getItem(TIP_KEY)) tip.hidden = false;
  } catch {
    if (tip) tip.hidden = false;
  }
  tip?.querySelector('[data-arrange-tip-close]')?.addEventListener('click', hideTip);

  const ghost = document.createElement('span');
  ghost.className = 'bento__ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const placeGhost = (t: HTMLElement) => {
    ghost.style.left = `${t.offsetLeft}px`;
    ghost.style.top = `${t.offsetTop}px`;
    ghost.style.width = `${t.offsetWidth}px`;
    ghost.style.height = `${t.offsetHeight}px`;
  };

  const tiles = () => [...grid.querySelectorAll<HTMLElement>(':scope > [data-bento-id]')];
  const ids = () => tiles().map((t) => t.dataset.bentoId!);
  const defaultOrder = ids();
  const nameOf = (t: HTMLElement) => t.dataset.bentoName ?? t.dataset.bentoId ?? '';
  const posOf = (t: HTMLElement) => tiles().indexOf(t) + 1;
  const msg = (key: string, t: HTMLElement) =>
    (grid.dataset[key] ?? '')
      .replace('{name}', nameOf(t))
      .replace('{pos}', String(posOf(t)))
      .replace('{total}', String(tiles().length));
  const announce = (text: string) => {
    if (!live) return;
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = text));
  };

  /* ---------- Ordine: applica, salva, ripristina ---------- */
  const place = (order: string[]) => {
    const map = new Map(tiles().map((t) => [t.dataset.bentoId!, t]));
    const known = order.filter((id) => map.has(id));
    const rest = defaultOrder.filter((id) => !known.includes(id));
    for (const id of [...known, ...rest]) grid.insertBefore(map.get(id)!, fixed);
  };
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids()));
    } catch {
      /* archiviazione non disponibile: l'ordine vale solo per questa visita */
    }
    syncReset();
  };
  const syncReset = () => {
    if (resetBtn) resetBtn.disabled = ids().join() === defaultOrder.join();
  };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (Array.isArray(saved) && saved.every((x) => typeof x === 'string')) place(saved);
  } catch {
    /* ordine salvato non leggibile: resta quello originale */
  }
  syncReset();

  /* Dopo la rivelazione iniziale, niente ritardi scaglionati sulle transizioni */
  window.setTimeout(() => grid.setAttribute('data-arranged', ''), 1600);

  /* ---------- FLIP: le schede vicine scorrono verso il nuovo posto ---------- */
  const flip = (mutate: () => void, skip?: HTMLElement) => {
    const els = tiles().concat(fixed ? [fixed] : []);
    const first = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
    mutate();
    if (reducedMotion()) return;
    for (const e of els) {
      if (e === skip) continue;
      const a = first.get(e)!;
      const b = e.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: 320, easing: EASE });
    }
  };

  /* ---------- Menu della sezione: suggerimento + ripristino ---------- */
  if (menuBtn && panel) {
    const setOpen = (open: boolean) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    };
    menuBtn.addEventListener('click', () => setOpen(!!panel.hidden));
    document.addEventListener('pointerdown', (e) => {
      if (!panel.hidden && !(e.target as Element).closest('[data-arrange]')) setOpen(false);
    });
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtn.focus();
      }
    });
  }
  resetBtn?.addEventListener('click', () => {
    flip(() => place(defaultOrder));
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* niente da rimuovere */
    }
    syncReset();
    announce(grid.dataset.msgReset ?? '');
  });

  /* ---------- Trascinamento con puntatore ---------- */
  type Drag = {
    tile: HTMLElement;
    handle: HTMLElement;
    id: number;
    grabX: number;
    grabY: number;
    x: number;
    y: number;
    startOrder: string[];
    target: HTMLElement | null;
    cooldown: number;
  };
  let drag: Drag | null = null;
  let pending: { handle: HTMLElement; tile: HTMLElement; id: number; x: number; y: number; timer: number; type: string } | null = null;
  let raf = 0;

  // offsetLeft/Top ignorano i transform: posizione di layout reale della scheda
  const layoutRect = (t: HTMLElement) => ({ l: t.offsetLeft, t: t.offsetTop, w: t.offsetWidth, h: t.offsetHeight });

  const follow = () => {
    if (!drag) return;
    const g = grid.getBoundingClientRect();
    const r = layoutRect(drag.tile);
    placeGhost(drag.tile);
    drag.tile.style.setProperty('--dx', `${(drag.x - drag.grabX - (g.left + r.l)).toFixed(1)}px`);
    drag.tile.style.setProperty('--dy', `${(drag.y - drag.grabY - (g.top + r.t)).toFixed(1)}px`);
  };

  const hitTest = () => {
    if (!drag || performance.now() < drag.cooldown) return;
    const g = grid.getBoundingClientRect();
    const px = drag.x - g.left;
    const py = drag.y - g.top;
    const over = tiles().find((t) => {
      if (t === drag!.tile) return false;
      const r = layoutRect(t);
      return px >= r.l && px <= r.l + r.w && py >= r.t && py <= r.t + r.h;
    });
    if (!over || over === drag.target) {
      if (!over) drag.target = null;
      return;
    }
    drag.target = over;
    const list = tiles();
    const from = list.indexOf(drag.tile);
    const to = list.indexOf(over);
    const tile = drag.tile;
    flip(() => grid.insertBefore(tile, from < to ? over.nextElementSibling : over), tile);
    drag.cooldown = performance.now() + 140;
    follow();
  };

  /* scorrimento automatico vicino ai bordi dello schermo */
  const autoScroll = () => {
    if (!drag) return;
    const edge = 70;
    const h = window.innerHeight;
    let v = 0;
    if (drag.y < edge) v = -((edge - drag.y) / edge) * 14;
    else if (drag.y > h - edge) v = ((drag.y - (h - edge)) / edge) * 14;
    if (v) {
      window.scrollBy(0, v);
      follow();
      hitTest();
    }
    raf = requestAnimationFrame(autoScroll);
  };

  const begin = (tile: HTMLElement, handle: HTMLElement, id: number, x: number, y: number) => {
    const r = tile.getBoundingClientRect();
    drag = { tile, handle, id, grabX: x - r.left, grabY: y - r.top, x, y, startOrder: ids(), target: null, cooldown: 0 };
    tile.classList.add('is-dragging');
    grid.setAttribute('data-sorting', '');
    placeGhost(tile);
    grid.appendChild(ghost);
    hideTip();
    try {
      handle.setPointerCapture(id);
    } catch {
      /* cattura non disponibile: gli eventi arrivano comunque al documento */
    }
    follow();
    announce(msg('msgPicked', tile));
    raf = requestAnimationFrame(autoScroll);
  };

  const settle = (tile: HTMLElement) => {
    const dx = parseFloat(tile.style.getPropertyValue('--dx')) || 0;
    const dy = parseFloat(tile.style.getPropertyValue('--dy')) || 0;
    tile.classList.remove('is-dragging');
    tile.style.removeProperty('--dx');
    tile.style.removeProperty('--dy');
    if (!reducedMotion() && (dx || dy)) {
      tile.animate([{ transform: `translate(${dx}px, ${dy}px) scale(1.02)` }, { transform: 'translate(0, 0) scale(1)' }], { duration: 280, easing: EASE });
    }
  };

  const end = (cancelled: boolean) => {
    if (!drag) return;
    cancelAnimationFrame(raf);
    const { tile, startOrder } = drag;
    drag = null;
    ghost.remove();
    grid.removeAttribute('data-sorting');
    if (cancelled) {
      settle(tile);
      flip(() => place(startOrder));
      announce(msg('msgCancelled', tile));
      return;
    }
    settle(tile);
    save();
    announce(msg('msgDropped', tile));
  };

  const clearPending = () => {
    if (pending) window.clearTimeout(pending.timer);
    pending = null;
  };

  grid.addEventListener('pointerdown', (e) => {
    const handle = (e.target as Element).closest<HTMLElement>('[data-grip]');
    if (!handle || e.button !== 0 || drag) return;
    const tile = handle.closest<HTMLElement>('[data-bento-id]');
    if (!tile) return;
    clearPending();
    const touchLike = e.pointerType !== 'mouse';
    pending = {
      handle,
      tile,
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType,
      timer: touchLike
        ? window.setTimeout(() => {
            if (!pending) return;
            const p = pending;
            pending = null;
            navigator.vibrate?.(8);
            begin(p.tile, p.handle, p.id, p.x, p.y);
          }, LONG_PRESS)
        : 0,
    };
    if (!touchLike) e.preventDefault(); // niente selezione di testo col mouse
  });

  addEventListener('pointermove', (e) => {
    if (pending && e.pointerId === pending.id) {
      const moved = Math.hypot(e.clientX - pending.x, e.clientY - pending.y);
      if (pending.type === 'mouse' && moved > 4) {
        const p = pending;
        clearPending();
        begin(p.tile, p.handle, p.id, p.x, p.y);
      } else if (pending.type !== 'mouse' && moved > TOLERANCE) {
        clearPending(); // l'utente sta scorrendo la pagina
      }
    }
    if (drag && e.pointerId === drag.id) {
      drag.x = e.clientX;
      drag.y = e.clientY;
      follow();
      hitTest();
    }
  });
  addEventListener('pointerup', (e) => {
    if (pending && e.pointerId === pending.id) clearPending();
    if (drag && e.pointerId === drag.id) end(false);
  });
  addEventListener('pointercancel', (e) => {
    if (pending && e.pointerId === pending.id) clearPending();
    if (drag && e.pointerId === drag.id) end(true);
  });
  // Durante un trascinamento touch la pagina non deve scorrere (il listener non è passivo)
  grid.addEventListener(
    'touchmove',
    (e) => {
      if (drag) e.preventDefault();
    },
    { passive: false },
  );
  grid.addEventListener('contextmenu', (e) => {
    if ((e.target as Element).closest('[data-grip]')) e.preventDefault();
  });
  // un clic sulla maniglia non attiva la scheda sottostante
  grid.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-grip]')) e.preventDefault();
  });

  /* ---------- Tastiera ---------- */
  let picked: { tile: HTMLElement; startOrder: string[] } | null = null;
  const refocus = (tile: HTMLElement) => tile.querySelector<HTMLElement>('[data-grip]')?.focus({ preventScroll: true });
  const moveBy = (tile: HTMLElement, delta: number) => {
    const list = tiles();
    const i = list.indexOf(tile);
    const j = Math.max(0, Math.min(list.length - 1, i + delta));
    if (i === j) return false;
    flip(() => grid.insertBefore(tile, delta > 0 ? list[j]!.nextElementSibling : list[j]!), tile);
    refocus(tile);
    tile.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    return true;
  };
  const dropPicked = (cancel: boolean) => {
    if (!picked) return;
    const { tile, startOrder } = picked;
    picked = null;
    tile.removeAttribute('data-picked');
    grid.removeAttribute('data-sorting');
    if (cancel) {
      flip(() => place(startOrder));
      refocus(tile);
      announce(msg('msgCancelled', tile));
    } else {
      save();
      announce(msg('msgDropped', tile));
    }
  };

  grid.addEventListener('keydown', (e) => {
    const handle = (e.target as Element).closest<HTMLElement>('[data-grip]');
    if (!handle) return;
    const tile = handle.closest<HTMLElement>('[data-bento-id]')!;
    const dir = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (dir && (e.altKey || picked?.tile === tile)) {
      e.preventDefault();
      hideTip();
      if (moveBy(tile, dir)) {
        if (picked) announce(msg('msgMoved', tile));
        else {
          save();
          announce(msg('msgMoved', tile));
        }
      }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (picked?.tile === tile) dropPicked(false);
      else {
        dropPicked(false);
        picked = { tile, startOrder: ids() };
        hideTip();
        tile.setAttribute('data-picked', '');
        grid.setAttribute('data-sorting', '');
        announce(msg('msgPicked', tile));
      }
      return;
    }
    if (e.key === 'Escape' && picked) {
      e.preventDefault();
      dropPicked(true);
    }
  });
  // Tab o clic altrove: la scheda resta dove si trova. Controllo differito, perché spostare
  // la scheda nel DOM toglie e restituisce il focus alla maniglia nello stesso istante.
  grid.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (picked && !picked.tile.contains(document.activeElement)) dropPicked(false);
    }, 0);
  });
}
