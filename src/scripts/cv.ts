/* Pagina CV: tema del documento, stampa, lingua. */
import { initLocaleLinks } from './ui';

const root = document.documentElement;
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-cv-theme-btn]');
const download = document.querySelector<HTMLAnchorElement>('[data-cv-download]');
const locale = document.documentElement.lang || 'it';
const sync = () => {
  const cur = root.getAttribute('data-cv-theme') ?? 'light';
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cvThemeBtn === cur)));
  // il PDF scaricato segue il tema scelto
  if (download) download.href = `/cv-pdf/${locale}-${cur}.pdf`;
};
buttons.forEach((b) =>
  b.addEventListener('click', () => {
    const theme = b.dataset.cvThemeBtn === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-cv-theme', theme);
    const url = new URL(location.href);
    url.searchParams.set('theme', theme);
    history.replaceState(null, '', url);
    sync();
  }),
);
sync();
document.querySelectorAll('[data-cv-print]').forEach((b) =>
  b.addEventListener('click', () => {
    (b.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
    window.print();
  }),
);
/* Menu "⋯": resta sempre dentro lo schermo, anche quando la barra va a capo sul telefono */
document.querySelectorAll<HTMLDetailsElement>('.cv-more').forEach((d) => {
  const panel = d.querySelector<HTMLElement>('.cv-more__panel');
  if (!panel) return;
  const fit = () => {
    panel.style.removeProperty('--shift');
    if (!d.open) return;
    const margin = 12;
    const r = panel.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let shift = 0;
    if (r.left < margin) shift = margin - r.left;
    else if (r.right > vw - margin) shift = vw - margin - r.right;
    if (shift) panel.style.setProperty('--shift', `${Math.round(shift)}px`);
  };
  d.addEventListener('toggle', fit);
  addEventListener('resize', fit, { passive: true });
  document.addEventListener('pointerdown', (e) => {
    if (d.open && !d.contains(e.target as Node)) d.removeAttribute('open');
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && d.open) {
      d.removeAttribute('open');
      d.querySelector('summary')?.focus();
    }
  });
});
initLocaleLinks();
