import type { ImageMetadata } from 'astro';
import planica from '../assets/places/planica.jpg';
import krasnaya from '../assets/places/krasnaya-polyana.jpg';
import scalea from '../assets/places/scalea.jpg';
import ayllon from '../assets/places/ayllon.jpg';
import cervino from '../assets/places/cervino.jpg';
import londra from '../assets/places/londra.jpg';

/**
 * Luogo della settimana.
 * La foto cambia ogni lunedì (00:00 UTC) seguendo l'ordine di questa lista.
 * Per aggiungere un luogo: metti la foto in src/assets/places/, aggiungi una voce
 * qui sotto con fuso orario, coordinate, nota breve e crediti. Solo luoghi certi:
 * se non sai dov'è stata scattata una foto, non usarla qui. La licenza è quella indicata oggi
 * nella pagina dell'autore o nel file debian/copyright del pacchetto da cui viene la foto.
 */
export type Place = {
  /** Deve coincidere con la chiave in places.<id> dei dizionari (nome, regione, paese, nota, alt). */
  id: 'planica' | 'krasnaya-polyana' | 'scalea' | 'ayllon' | 'cervino' | 'londra';
  lat: number;
  lon: number;
  timeZone: string;
  photo: ImageMetadata;
  position: string;
  credit: { author: string; source: string; license: string; licenseUrl: string };
};

const BYSA = 'https://creativecommons.org/licenses/by-sa/4.0/';
const BYSA2 = 'https://creativecommons.org/licenses/by-sa/2.0/';
const BYSA3 = 'https://creativecommons.org/licenses/by-sa/3.0/';
const BY2 = 'https://creativecommons.org/licenses/by/2.0/';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';

export const places: Place[] = [
  {
    id: 'planica',
    lat: 46.48,
    lon: 13.72,
    timeZone: 'Europe/Ljubljana',
    photo: planica,
    position: '50% 50%',
    credit: { author: 'Jan Makovecki (Scayris)', source: 'https://www.flickr.com/photos/144771899@N02/29123704861/', license: 'CC BY-SA 2.0', licenseUrl: BYSA2 },
  },
  {
    id: 'krasnaya-polyana',
    lat: 43.68,
    lon: 40.2,
    timeZone: 'Europe/Moscow',
    photo: krasnaya,
    position: '50% 55%',
    credit: { author: 'Alexander Lyubavin', source: 'https://www.flickr.com/photos/santea/21310226281/', license: 'CC BY 2.0', licenseUrl: BY2 },
  },
  {
    id: 'scalea',
    lat: 39.81,
    lon: 15.79,
    timeZone: 'Europe/Rome',
    photo: scalea,
    position: '68% 55%',
    credit: { author: 'Renatvs88', source: 'https://launchpad.net/ubuntu/+source/ubuntu-wallpapers', license: 'CC BY-SA 3.0', licenseUrl: BYSA3 },
  },
  {
    id: 'ayllon',
    lat: 41.42,
    lon: -3.38,
    timeZone: 'Europe/Madrid',
    photo: ayllon,
    position: '55% 50%',
    credit: { author: 'Fernando García Redondo', source: 'https://www.flickr.com/photos/fgr1986/9389885763', license: 'CC BY 2.0', licenseUrl: BY2 },
  },
  {
    id: 'cervino',
    lat: 45.98,
    lon: 7.66,
    timeZone: 'Europe/Zurich',
    photo: cervino,
    position: '45% 40%',
    credit: { author: 'William Beckwith', source: 'https://discourse.ubuntubudgie.org/t/ubuntu-budgie-20-04-wallpaper-contest/2753', license: 'CC BY-SA 4.0', licenseUrl: BYSA },
  },
  {
    id: 'londra',
    lat: 51.5,
    lon: -0.12,
    timeZone: 'Europe/London',
    photo: londra,
    position: '40% 50%',
    credit: { author: 'Paul Daniell', source: 'https://launchpad.net/ubuntu/+source/ubuntu-wallpapers', license: 'CC0', licenseUrl: CC0 },
  },
];

/** Crediti delle altre fotografie del sito (tutte CC0, crediti per cortesia). */
export const otherPhotoCredits = [
  { use: 'ips', author: 'Tim Allen', source: 'https://stocksnap.io/photo/architecture-infrastructures-ZWH6W6VEIT', license: 'CC0' },
  { use: 'sunfai', author: 'Eberhard Grossgasteiger', source: 'https://magdeleine.co/photo-by-eberhard-grossgasteiger-n-1228/', license: 'CC0' },
  { use: 'marconi', author: 'Rahul Pandit', source: 'https://discourse.ubuntubudgie.org/t/ubuntu-budgie-20-04-wallpaper-contest/2753', license: 'CC0' },
] as const;

/** Settimane intere trascorse dal lunedì 5 gennaio 1970 (UTC) — indice stabile per 7 giorni. */
export const weekIndex = (date = new Date()) => {
  const MONDAY_EPOCH = Date.UTC(1970, 0, 5);
  return Math.floor((date.getTime() - MONDAY_EPOCH) / 604_800_000);
};

export const placeForWeek = (date = new Date()) => places[((weekIndex(date) % places.length) + places.length) % places.length]!;

/** Coordinate nel formato della lingua (virgola o punto decimale). */
export const formatCoords = (lat: number, lon: number, intl = 'it-IT') => {
  const n = (v: number) => new Intl.NumberFormat(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
  const west = intl.startsWith('it') ? 'O' : intl.startsWith('pl') ? 'W' : 'W';
  return `${n(lat)}° ${lat >= 0 ? 'N' : 'S'}  ${n(lon)}° ${lon >= 0 ? 'E' : west}`;
};
