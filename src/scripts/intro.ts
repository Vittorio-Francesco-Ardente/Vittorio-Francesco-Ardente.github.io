/* Intro: breve, saltabile, una sola volta per sessione. */
import { applyPlacePicture, currentPlace, fillPlace } from './ui';

const TOTAL = 2600; // ms prima che il sipario si alzi da solo
const LIFT = 1000; // durata dell'uscita

export function initIntro(onDone: () => void) {
  const root = document.documentElement;
  const el = document.querySelector<HTMLElement>('[data-intro-root]');
  if (root.dataset.intro !== 'play' || !el) {
    onDone(); // l'elemento resta nel documento: lo riusa la modalità inattiva
    return;
  }

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

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    try {
      sessionStorage.setItem('vfa-intro', '1');
    } catch {
      /* nessun problema: l'intro potrà ripetersi */
    }
    el.setAttribute('data-leaving', '');
    // Il contenuto parte mentre il sipario si alza: un solo movimento continuo
    window.setTimeout(onDone, 180);
    window.setTimeout(() => {
      root.removeAttribute('data-intro');
      el.removeAttribute('data-leaving');
      el.removeAttribute('data-photo-ready');
    }, LIFT + 60);
    removeEventListener('keydown', finish);
    removeEventListener('wheel', finish);
    removeEventListener('touchmove', finish);
  };

  el.addEventListener('click', finish);
  addEventListener('keydown', finish);
  addEventListener('wheel', finish, { passive: true });
  addEventListener('touchmove', finish, { passive: true });
  window.setTimeout(finish, TOTAL);
}
