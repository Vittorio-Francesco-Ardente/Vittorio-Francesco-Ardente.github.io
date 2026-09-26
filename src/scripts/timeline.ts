/* ==========================================================================
   Percorso — racconto guidato dallo scroll (GSAP + ScrollTrigger, un solo sistema).
   - GSAP si carica solo quando la sezione si avvicina (import dinamico).
   - Desktop (≥1100px, altezza ≥620px): la sezione si ferma (pin) per 110vh mentre la linea
     avanza e le tappe si accendono, poi rilascia. Altrove: linea verticale che scende con la lettura.
   - gsap.matchMedia ricrea e ripulisce i trigger al cambio di fascia; tutto si elimina con la pagina.
   - "Riduci movimento" o JavaScript assente: percorso completo e statico (stato già nel markup).
   ========================================================================== */
import { reducedMotion } from './ui';

export function initTimeline() {
  const root = document.querySelector<HTMLElement>('[data-journey]');
  const list = root?.querySelector<HTMLElement>('[data-journey-list]');
  if (!root || !list || reducedMotion() || !('IntersectionObserver' in window)) return;
  const items = [...list.querySelectorAll<HTMLElement>('.jt__item')];
  const yearEl = root.querySelector<HTMLElement>('[data-journey-year]');
  const years = items.map((li) => li.querySelector('time')?.textContent ?? '');
  const segs = Math.max(1, items.length - 1);
  let current = -1;

  const apply = (p: number) => {
    list.style.setProperty('--jp', p.toFixed(4));
    let cur = 0;
    items.forEach((_, i) => {
      if (p >= i / segs - 0.015) cur = i;
    });
    items.forEach((li, i) => (li.dataset.state = i < cur ? 'past' : i === cur ? 'current' : 'future'));
    if (cur !== current && yearEl) {
      current = cur;
      yearEl.textContent = years[cur] ?? '';
      yearEl.removeAttribute('data-swap');
      void yearEl.offsetWidth; // riavvia l'animazione del numero
      yearEl.setAttribute('data-swap', '');
    }
  };
  apply(0);

  const io = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        const state = { p: 0 };
        let active: gsap.core.Tween | null = null;
        const tween = (vars: ScrollTrigger.Vars) =>
          (active = gsap.to(state, { p: 1, ease: 'none', overwrite: true, onUpdate: () => apply(state.p), scrollTrigger: vars }));
        // Arrivo diretto (ancora, link del Dock, ricarica a metà pagina): allinea subito lo stato alla posizione
        const syncNow = () => {
          const st = active?.scrollTrigger;
          if (!active || !st) return;
          active.progress(st.progress);
          state.p = st.progress;
          apply(st.progress);
        };
        mm.add('(min-width: 1100px) and (min-height: 620px)', () => {
          state.p = 0;
          tween({ trigger: root, start: 'top top', end: () => `+=${Math.round(window.innerHeight * 1.1)}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true });
        });
        mm.add('(max-width: 1099px), (max-height: 619px)', () => {
          state.p = 0;
          tween({ trigger: list, start: 'top 70%', end: 'bottom 80%', scrub: 0.5, invalidateOnRefresh: true });
        });
        // la griglia riordinabile e le immagini cambiano l'altezza della pagina: ricalcola le soglie
        const ro = new ResizeObserver(() => ScrollTrigger.refresh());
        const bento = document.querySelector('[data-bento]');
        if (bento) ro.observe(bento);
        ScrollTrigger.refresh();
        syncNow();
        ScrollTrigger.addEventListener('refresh', syncNow);
        addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
        addEventListener('pagehide', (e) => {
          if (!(e as PageTransitionEvent).persisted) {
            ro.disconnect();
            mm.revert();
          }
        });
      } catch {
        apply(1); // se il modulo non si carica, il percorso si mostra completo
      }
    },
    { rootMargin: '400px 0px' },
  );
  io.observe(root);
}
