import it from './locales/it.json';
import en from './locales/en.json';
import pl from './locales/pl.json';
import { defaultLocale, locales, supportedLocales, type Locale } from './config';

export type Dict = typeof it;

/* `satisfies` garantisce in fase di build che ogni lingua abbia tutte le chiavi dell'italiano */
const dictionaries = { it, en: en satisfies Dict, pl: pl satisfies Dict } satisfies Record<Locale, Dict>;

export { defaultLocale, locales, supportedLocales };
export type { Locale };

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && v in locales;
export const useT = (locale: Locale): Dict => dictionaries[locale];

/** Sostituisce i segnaposto {nome} con i valori forniti. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/** Percorso localizzato: l'italiano resta alla radice, le altre lingue hanno il prefisso. */
export const localizePath = (path: string, locale: Locale) => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
};

/** Toglie il prefisso di lingua da un percorso (/en/cv → /cv). */
export const stripLocale = (pathname: string) => {
  const seg = pathname.split('/')[1];
  if (seg && isLocale(seg) && seg !== defaultLocale) {
    const rest = pathname.slice(seg.length + 1);
    return rest === '' ? '/' : rest;
  }
  return pathname || '/';
};

/** Parametri per getStaticPaths: una pagina per lingua (italiano senza prefisso). */
export const localeStaticPaths = () =>
  supportedLocales.map((l) => ({ params: { locale: l === defaultLocale ? undefined : l }, props: { locale: l } }));

/** Da `Astro.params.locale` alla lingua effettiva. */
export const localeFromParam = (param: string | undefined): Locale => (param && isLocale(param) ? param : defaultLocale);
