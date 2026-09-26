import type { ImageMetadata } from 'astro';
import ipsPhoto from '../assets/work/ips.jpg';
import sunfaiPhoto from '../assets/work/sunfai.jpg';
import marconiPhoto from '../assets/work/marconi.jpg';

/** Fatti delle esperienze. Titoli, descrizioni e attività sono nei dizionari (experiences.items.<slug>). */
export type Tone = 'ips' | 'sunfai' | 'marconi';
export type ActivityIcon = 'chart' | 'flow' | 'protocol' | 'check' | 'doc' | 'people' | 'database' | 'code' | 'model' | 'network' | 'layers';

export type Experience = {
  slug: Tone;
  kind: 'internship' | 'education';
  org: string;
  orgShort: string;
  place: string;
  year: string;
  /** Ore di tirocinio svolte (solo per i tirocini). */
  hours?: string;
  /** Votazione finale (solo per la formazione). */
  grade?: string;
  tutor?: string;
  activityIcons: ActivityIcon[];
  extra?: { href?: string; value?: string; note?: string };
  photo: ImageMetadata;
  photoPosition: string;
};

export const experiences: Experience[] = [
  {
    slug: 'sunfai',
    kind: 'internship',
    org: 'Sun-Fai',
    orgShort: 'Sun-Fai',
    place: 'Dalmine (BG)',
    year: '2025',
    hours: '75–80',
    activityIcons: ['chart', 'flow', 'protocol', 'check', 'doc', 'people'],
    extra: { href: 'https://sun-fai.org', value: 'sun-fai.org' },
    photo: sunfaiPhoto,
    photoPosition: '50% 45%',
  },
  {
    slug: 'ips',
    kind: 'internship',
    org: 'I.P.S. Informatica S.r.l.',
    orgShort: 'I.P.S. Informatica',
    place: 'Bergamo (BG)',
    year: '2024',
    hours: '40',
    activityIcons: ['database', 'code', 'model', 'network'],
    photo: ipsPhoto,
    photoPosition: '50% 50%',
  },
  {
    slug: 'marconi',
    kind: 'education',
    org: 'ITI G. Marconi',
    orgShort: 'ITI G. Marconi',
    place: 'Dalmine (BG)',
    year: '2026',
    grade: '94/100',
    activityIcons: ['code', 'database', 'network', 'layers', 'protocol'],
    extra: { note: 'CIVISUN' },
    photo: marconiPhoto,
    photoPosition: '55% 50%',
  },
];

export const getExperience = (slug: string) => experiences.find((e) => e.slug === slug);
export const nextExperience = (slug: string) => {
  const i = experiences.findIndex((e) => e.slug === slug);
  return experiences[(i + 1) % experiences.length]!;
};
