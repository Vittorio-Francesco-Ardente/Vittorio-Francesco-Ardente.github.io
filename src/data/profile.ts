/**
 * FATTI su Vittorio: un'unica fonte di verità, indipendente dalla lingua.
 * I testi descrittivi (ruolo, disponibilità, FAQ…) stanno nei dizionari
 * src/i18n/locales/*.json; qui solo dati verificabili.
 */
export const profile = {
  name: 'Vittorio Francesco Ardente',
  shortName: 'Vittorio Ardente',
  firstName: 'Vittorio',
  middleName: 'Francesco',
  lastName: 'Ardente',
  monogram: 'VFA',
  base: { city: 'Dalmine', province: 'BG', lat: 45.6497, lon: 9.6044, timeZone: 'Europe/Rome' },
  contacts: {
    email: 'vittorio.ardente.07@gmail.com',
    linkedin: 'https://www.linkedin.com/in/vittorio-ardente-812775388',
    github: 'https://github.com/Vittorio-Francesco-Ardente',
  },
  /** Lingue parlate: codice + livello (i nomi sono tradotti nei dizionari). */
  languages: [
    { code: 'IT', level: 'native' },
    { code: 'EN', level: 'b2' },
    { code: 'PL', level: 'b2' },
  ] as const,
  /**
   * Modalità di lavoro vere. NON aggiungere tirocini o trasferte:
   * Vittorio valuta collaborazioni e posizioni junior, anche in smart working,
   * e non è disponibile per trasferte lavorative.
   */
  workModes: ['remote', 'licence'] as const,
  /** Ore di tirocinio GIÀ svolte (esperienza passata, non disponibilità). */
  internshipHours: '115+',
  grade: '94/100',
  site: 'https://vittorio-francesco-ardente.github.io',
} as const;

export type LanguageLevel = (typeof profile.languages)[number]['level'];
