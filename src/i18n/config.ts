/**
 * Lingue del sito. Per aggiungerne una:
 *   1. crea src/i18n/locales/<codice>.json (stesse chiavi di it.json)
 *   2. registrala qui sotto e nel dizionario di src/i18n/index.ts
 * Pagine, selettore, sitemap e hreflang si aggiornano da soli.
 */
export const locales = {
  it: { label: 'Italiano', short: 'IT', intl: 'it-IT', og: 'it_IT' },
  en: { label: 'English', short: 'EN', intl: 'en-GB', og: 'en_GB' },
  pl: { label: 'Polski', short: 'PL', intl: 'pl-PL', og: 'pl_PL' },
} as const;

export type Locale = keyof typeof locales;
export const supportedLocales = Object.keys(locales) as Locale[];
export const defaultLocale: Locale = 'it';
export const LOCALE_STORAGE_KEY = 'vfa-locale';
