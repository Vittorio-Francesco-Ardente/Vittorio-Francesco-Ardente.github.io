/**
 * Competenze: id + livello + area. I nomi e le etichette sono nei dizionari
 * (profile.skills, profile.levels, profile.areas).
 * Livelli dichiarati nel materiale di partenza: Git/GitHub = uso pratico,
 * CI/CD = familiarità, API e AWS = basi. Gli altri sono assegnati in modo prudente: controllali.
 */
export type Level = 'pratico' | 'familiare' | 'basi';
export type Area = 'dev' | 'data' | 'systems' | 'workflow' | 'web' | 'cloud' | 'tools';

export const levelRank: Record<Level, 1 | 2 | 3> = { pratico: 3, familiare: 2, basi: 1 };
export const levelOrder: Level[] = ['pratico', 'familiare', 'basi'];

export const skills = [
  { id: 'sqlserver', level: 'pratico', area: 'data' },
  { id: 'mysql', level: 'pratico', area: 'data' },
  { id: 'sql', level: 'pratico', area: 'data' },
  { id: 'excel', level: 'pratico', area: 'data' },
  { id: 'dataflows', level: 'pratico', area: 'data' },
  { id: 'vbnet', level: 'pratico', area: 'dev' },
  { id: 'python', level: 'pratico', area: 'dev' },
  { id: 'javascript', level: 'pratico', area: 'dev' },
  { id: 'htmlcss', level: 'pratico', area: 'dev' },
  { id: 'git', level: 'pratico', area: 'workflow' },
  { id: 'tcpip', level: 'pratico', area: 'systems' },
  { id: 'windows', level: 'pratico', area: 'systems' },
  { id: 'typescript', level: 'familiare', area: 'dev' },
  { id: 'cpp', level: 'familiare', area: 'dev' },
  { id: 'csharp', level: 'familiare', area: 'dev' },
  { id: 'processing', level: 'familiare', area: 'dev' },
  { id: 'branching', level: 'familiare', area: 'workflow' },
  { id: 'cicd', level: 'familiare', area: 'workflow' },
  { id: 'freecad', level: 'familiare', area: 'tools' },
  { id: 'aws', level: 'basi', area: 'cloud' },
  { id: 'api', level: 'basi', area: 'web' },
] as const satisfies readonly { id: string; level: Level; area: Area }[];

export type SkillId = (typeof skills)[number]['id'];
export const byLevel = (level: Level) => skills.filter((s) => s.level === level);

/** Sintesi per la bento: nomi propri, uguali in ogni lingua. */
export const stackSummary: { level: Level; items: string[] }[] = [
  { level: 'pratico', items: ['SQL Server · MySQL', 'VB.NET', 'Excel / VBA', 'Python', 'Git · GitHub'] },
  { level: 'familiare', items: ['TypeScript', 'C / C++', 'C#'] },
  { level: 'basi', items: ['AWS', 'API'] },
];

export const capabilityIcons = ['layout', 'flow', 'database'] as const;
