/* Piccoli comportamenti del sito, senza dipendenze esterne. */

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Tema ---------------- */
export function initTheme() {
  const root = document.documentElement;
  const meta = document.querySelector<HTMLMetaElement>('[data-theme-color]');
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const sync = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    buttons.forEach((b) => {
      b.setAttribute('aria-pressed', String(dark));
      const label = dark ? b.dataset.labelLight : b.dataset.labelDark;
      if (label) b.setAttribute('aria-label', label);
    });
    if (meta) meta.content = dark ? '#0b0c0c' : '#f2f1ed';
  };
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      // dissolvenza di 240 ms su colori e superfici (solo durante il cambio)
      root.setAttribute('data-theme-anim', '');
      window.setTimeout(() => root.removeAttribute('data-theme-anim'), 280);
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('vfa-theme', next);
      } catch {
        /* archiviazione non disponibile: il tema vale solo per questa pagina */
      }
      sync();
    }),
  );
  sync();
}

/* ---------------- Orologi (lingua della pagina, fuso del luogo) ---------------- */
export const activeIntl = () => document.documentElement.dataset.intl || 'it-IT';
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string, kind: string) {
  const key = `${tz}|${kind}`;
  let f = fmtCache.get(key);
  if (!f) {
    const opts: Intl.DateTimeFormatOptions =
      kind === 'time'
        ? { hour: '2-digit', minute: '2-digit', hour12: false }
        : kind === 'day'
          ? { weekday: 'short', day: 'numeric', month: 'short' }
          : { weekday: 'long', day: 'numeric', month: 'long' };
    f = new Intl.DateTimeFormat(activeIntl(), { ...opts, timeZone: tz });
    fmtCache.set(key, f);
  }
  return f;
}
export function formatIn(tz: string, kind: 'time' | 'day' | 'date', d = new Date()) {
  return fmt(tz, kind).format(d).replace(/\.$/, '');
}

export function initClocks() {
  const tick = () => {
    const now = new Date();
    document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => {
      const tz = el.dataset.tz || 'Europe/Rome';
      const kind = (el.dataset.format as 'time' | 'day' | 'date') || 'time';
      el.textContent = formatIn(tz, kind, now);
      if (el instanceof HTMLTimeElement) el.dateTime = now.toISOString();
    });
  };
  tick();
  // Allinea gli aggiornamenti all'inizio del minuto
  const delay = 60_000 - (Date.now() % 60_000) + 50;
  window.setTimeout(() => {
    tick();
    window.setInterval(tick, 60_000);
  }, delay);
}

/* ---------------- Luogo della settimana ---------------- */
export type PlaceInfo = {
  id: string;
  name: string;
  where: string;
  coords: string;
  tz: string;
  note: string;
  alt: string;
  position: string;
  credit: string;
  creditHref: string;
  avif: string;
  webp: string;
  src: string;
};

export function currentPlace(): PlaceInfo | null {
  const el = document.getElementById('place-data');
  if (!el?.textContent) return null;
  try {
    const list = JSON.parse(el.textContent) as PlaceInfo[];
    if (!list.length) return null;
    const MONDAY_EPOCH = Date.UTC(1970, 0, 5);
    const week = Math.floor((Date.now() - MONDAY_EPOCH) / 604_800_000);
    return list[((week % list.length) + list.length) % list.length] ?? null;
  } catch {
    return null;
  }
}

/** Compila testi, orari e sorgenti di tutti i blocchi "luogo della settimana". */
export function fillPlace(place: PlaceInfo, scope: ParentNode = document) {
  const now = new Date();
  scope.querySelectorAll<HTMLElement>('[data-place]').forEach((el) => {
    const key = el.dataset.place;
    if (key === 'time') el.textContent = formatIn(place.tz, 'time', now);
    else if (key === 'date') el.textContent = formatIn(place.tz, 'date', now);
    else if (key === 'credit' && el instanceof HTMLAnchorElement) {
      el.textContent = place.credit;
      el.href = place.creditHref;
    } else if (key && key in place) el.textContent = String(place[key as keyof PlaceInfo]);
  });
}

export function applyPlacePicture(root: ParentNode, place: PlaceInfo, sel: { avif: string; webp: string; img: string }, sizes = '100vw') {
  const avif = root.querySelector<HTMLSourceElement>(sel.avif);
  const webp = root.querySelector<HTMLSourceElement>(sel.webp);
  const img = root.querySelector<HTMLImageElement>(sel.img);
  if (!img) return null;
  if (avif) { avif.srcset = place.avif; avif.sizes = sizes; }
  if (webp) { webp.srcset = place.webp; webp.sizes = sizes; }
  img.style.objectPosition = place.position;
  img.src = place.src;
  return img;
}

export function initPlace() {
  const place = currentPlace();
  if (!place) return;
  fillPlace(place);
  const band = document.querySelector<HTMLElement>('[data-place-picture]');
  if (band) applyPlacePicture(band, place, { avif: '[data-place-avif]', webp: '[data-place-webp]', img: '[data-place-img]' });
  // Aggiorna l'ora locale del luogo ogni minuto
  window.setInterval(() => {
    document.querySelectorAll<HTMLElement>('[data-place="time"]').forEach((el) => (el.textContent = formatIn(place.tz, 'time')));
  }, 30_000);
}

/* ---------------- Copia email ---------------- */
export function initCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy ?? '';
      const status = btn.dataset.copyStatus ? document.getElementById(btn.dataset.copyStatus) : null;
      const label = btn.querySelector<HTMLElement>('[data-copy-label]');
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        ok = false;
      }
      const msg = (ok ? btn.dataset.msgOk : btn.dataset.msgFail) ?? '';
      if (status) status.textContent = msg;
      if (label) label.textContent = (ok ? btn.dataset.labelDone : btn.dataset.labelCopy) ?? label.textContent;
      btn.toggleAttribute('data-copied', ok);
      window.setTimeout(() => {
        if (status) status.textContent = '';
        if (label && btn.dataset.labelCopy) label.textContent = btn.dataset.labelCopy;
        btn.removeAttribute('data-copied');
      }, 2600);
    });
  });
}

/* ---------------- Dialoghi: chiusura animata e ritorno del focus ---------------- */
function closeAnimated(dialog: HTMLDialogElement) {
  if (!dialog.open || dialog.hasAttribute('data-closing')) return;
  if (reducedMotion()) return dialog.close();
  dialog.setAttribute('data-closing', '');
  window.setTimeout(() => {
    dialog.removeAttribute('data-closing');
    dialog.close();
  }, 170);
}
function wireDialog(dialog: HTMLDialogElement, openers: NodeListOf<HTMLElement>, closeSel: string) {
  let trigger: HTMLElement | null = null;
  openers.forEach((o) =>
    o.addEventListener('click', () => {
      trigger = o;
      dialog.showModal();
    }),
  );
  dialog.querySelectorAll(closeSel).forEach((c) => c.addEventListener('click', () => closeAnimated(dialog)));
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeAnimated(dialog);
  });
  // clic sullo sfondo del dialogo modale
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && dialog.id !== 'menu') closeAnimated(dialog);
  });
  dialog.addEventListener('close', () => trigger?.focus());
}

/* ---------------- Menu mobile ---------------- */
export function initMenu(onNavigate: (hash: string) => boolean) {
  const dialog = document.getElementById('menu') as HTMLDialogElement | null;
  if (!dialog) return;
  wireDialog(dialog, document.querySelectorAll<HTMLElement>('[data-menu-open]'), '[data-menu-close]');
  dialog.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href') ?? '';
      if (!hash.startsWith('#')) return;
      e.preventDefault();
      dialog.close();
      onNavigate(hash);
    }),
  );
  dialog.querySelectorAll<HTMLElement>('[data-cv-open]').forEach((b) => b.addEventListener('click', () => dialog.close()));
}

/* ---------------- Dialogo del CV ---------------- */
export function initCvDialog() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-cv-dialog]');
  if (!dialog) return;
  wireDialog(dialog, document.querySelectorAll<HTMLElement>('[data-cv-open]'), '[data-cv-close]');
}

/* ---------------- Lingua: la scelta manuale viene ricordata ---------------- */
export function initLocaleLinks() {
  document.querySelectorAll<HTMLAnchorElement>('[data-locale-link]').forEach((a) => {
    a.addEventListener('click', () => {
      // indicatore subito sulla lingua scelta, in tutti i selettori (barra, Dock, menu), prima del cambio pagina
      document.querySelectorAll<HTMLAnchorElement>('[data-locale-link]').forEach((x) => {
        if (x.dataset.localeLink === a.dataset.localeLink) x.setAttribute('aria-current', 'true');
        else x.removeAttribute('aria-current');
      });
      try {
        localStorage.setItem('vfa-locale', a.dataset.localeLink ?? '');
      } catch {
        /* preferenza non salvabile: vale solo per questa navigazione */
      }
      // stessa pagina nell'altra lingua: conserva parametri (es. tema del CV), sezione e
      // posizione di lettura (ripristinata all'arrivo da restoreLocalePosition)
      a.href = a.href.split(/[?#]/)[0] + location.search;
      try {
        const line = window.innerHeight * 0.4;
        const secs = [...document.querySelectorAll<HTMLElement>('main [data-section][id]')];
        let sec = secs[0];
        for (const s of secs) if (s.getBoundingClientRect().top <= line) sec = s;
        if (sec) {
          const off = window.scrollY - (sec.getBoundingClientRect().top + window.scrollY);
          sessionStorage.setItem('vfa:locale-pos', JSON.stringify({ id: sec.id, off, t: Date.now() }));
        }
      } catch {
        /* archiviazione non disponibile: si arriva in cima alla pagina */
      }
    });
  });
}

/* Dopo il cambio di lingua: stessa sezione, stessa posizione, nessun salto visibile */
export function restoreLocalePosition() {
  try {
    const raw = sessionStorage.getItem('vfa:locale-pos');
    if (!raw) return;
    sessionStorage.removeItem('vfa:locale-pos');
    const { id, off, t } = JSON.parse(raw) as { id: string; off: number; t: number };
    if (location.hash || Date.now() - t > 15000) return;
    const sec = document.getElementById(id);
    if (!sec) return;
    const y = sec.getBoundingClientRect().top + window.scrollY + off;
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' as ScrollBehavior });
  } catch {
    /* niente da ripristinare */
  }
}

/* ---------------- Rivelazioni: titoli, metadati, foto, griglie ---------------- */
export function initReveal() {
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((g) =>
    [...g.children].forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i))),
  );
  const items = document.querySelectorAll<HTMLElement>('[data-reveal], [data-stagger]');
  if (!items.length) return;
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('is-in'));
    return;
  }
  // I titoli partono ritagliati (clip-path): si osserva il contenitore, che ha area visibile
  const targets = new Map<Element, HTMLElement[]>();
  items.forEach((el) => {
    const watch = el.dataset.reveal === 'title' && el.parentElement ? el.parentElement : el;
    targets.set(watch, [...(targets.get(watch) ?? []), el]);
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          targets.get(en.target)?.forEach((el) => el.classList.add('is-in'));
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.04 },
  );
  targets.forEach((_, watch) => io.observe(watch));
}

/* ---------------- Luce che segue il puntatore (solo mouse, solo tile principali) ---------------- */
export function initGlow() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || reducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-glow]').forEach((el) => {
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  });
}

/* ---------------- Continuità tra home e schede ---------------- */
const ORIGIN_KEY = 'vfa-origin';

export function initJourney() {
  // da dove si è aperta la scheda: per tornare vicino a quel punto
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href*="/esperienza-"]') as HTMLAnchorElement | null;
    if (!a) return;
    const active = document.querySelector('[data-rail][aria-current="true"]') as HTMLElement | null;
    try {
      sessionStorage.setItem(ORIGIN_KEY, JSON.stringify({ path: location.pathname, section: active?.dataset.rail ?? 'esperienze' }));
    } catch {
      /* senza sessionStorage si torna alla sezione Esperienze */
    }
    // la foto cliccata resta collegata alla pagina di destinazione
    const img = a.querySelector<HTMLElement>('img');
    if (img && !reducedMotion() && 'startViewTransition' in document) img.style.viewTransitionName = 'xphoto';
  });

  const back = document.querySelector<HTMLAnchorElement>('[data-backhome]');
  if (back) {
    try {
      const raw = sessionStorage.getItem(ORIGIN_KEY);
      if (raw) {
        const o = JSON.parse(raw) as { path?: string; section?: string };
        if (o.path) back.href = `${o.path}#${o.section || 'esperienze'}`;
      }
    } catch {
      /* si tiene la destinazione predefinita */
    }
  }
}

/* ---------------- Modalità inattiva: torna all'atmosfera iniziale, senza perdere il punto ---------------- */
export function initIdle() {
  const el = document.querySelector<HTMLElement>('[data-intro-root]');
  if (!el || reducedMotion()) return;
  const DELAY = 100_000;
  let timer = 0;
  let open = false;

  const dialogOpen = () => !!document.querySelector('dialog[open]');

  const show = () => {
    if (open || dialogOpen() || document.hidden || document.documentElement.dataset.intro === 'play') return;
    const place = currentPlace();
    if (place) {
      fillPlace(place, el);
      const img = applyPlacePicture(el, place, { avif: '[data-intro-avif]', webp: '[data-intro-webp]', img: '[data-intro-img]' });
      if (img) {
        const ready = () => el.setAttribute('data-photo-ready', '');
        if (img.complete && img.naturalWidth) ready();
        else img.addEventListener('load', ready, { once: true });
      }
    }
    open = true;
    el.setAttribute('data-idle', '');
    requestAnimationFrame(() => el.setAttribute('data-idle-in', ''));
  };

  const hide = () => {
    if (!open) return;
    open = false;
    el.removeAttribute('data-idle-in');
    window.setTimeout(() => el.removeAttribute('data-idle'), 240);
  };

  const reset = () => {
    if (open) hide();
    window.clearTimeout(timer);
    timer = window.setTimeout(show, DELAY);
  };

  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((ev) =>
    addEventListener(ev, reset, { passive: true }),
  );
  document.addEventListener('visibilitychange', () => (document.hidden ? window.clearTimeout(timer) : reset()));
  reset();
}
