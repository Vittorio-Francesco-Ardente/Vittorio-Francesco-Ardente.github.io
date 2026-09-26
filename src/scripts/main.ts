import { initTheme, initClocks, initPlace, initCopy, initMenu, initReveal, initGlow, initCvDialog, initLocaleLinks, initJourney, initIdle, restoreLocalePosition } from './ui';
import { initAnchors, initSpy, initNavDevice, goToHash } from './nav';
import { initBento } from './bento';
import { initTimeline } from './timeline';
import { initPassions } from './passions';
import { initIntro } from './intro';

// Ogni modulo è isolato: un errore in uno non blocca gli altri (né lascia testi invisibili)
const safe = (name: string, fn: () => void) => {
  try {
    fn();
  } catch (e) {
    console.error(`[vfa] ${name}`, e);
  }
};
safe('theme', initTheme);
safe('clocks', initClocks);
safe('place', initPlace);
safe('copy', initCopy);
safe('anchors', initAnchors);
safe('spy', initSpy);
safe('nav', initNavDevice);
safe('menu', () => initMenu((hash) => goToHash(hash)));
safe('bento', initBento); // prima delle rivelazioni: lo scaglionamento segue l'ordine scelto
safe('reveal', initReveal);
safe('timeline', initTimeline);
safe('passions', initPassions);
safe('locale-position', restoreLocalePosition); // dopo il cambio di lingua: stessa sezione, stessa posizione
safe('glow', initGlow);
safe('cv', initCvDialog);
safe('locale-links', initLocaleLinks);
safe('journey', initJourney);
// l'app è partita: il paracadute del boot (che toglie .js dopo 4 s) non serve più
document.documentElement.setAttribute('data-app', '');

// Il contenuto dell'hero si rivela dopo l'intro (o subito, se l'intro non c'è)
const heroReady = () => {
  document.documentElement.setAttribute('data-hero-ready', '');
  document.querySelectorAll<HTMLElement>('.hero').forEach((h) => h.setAttribute('data-ready', ''));
};
try {
  initIntro(heroReady);
} catch (e) {
  console.error('[vfa] intro', e);
  heroReady();
}

// Modalità inattiva: solo sulla home, dove esiste l'apertura con il luogo della settimana
safe('idle', initIdle);

// Arrivo da un link con ancora (es. /#contatti da un'altra pagina)
if (location.hash && document.documentElement.dataset.intro !== 'play') {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = document.getElementById(id);
  if (el) requestAnimationFrame(() => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' as ScrollBehavior }));
}
