/**
 * Dünyalar ve bölüm sırası. Yeni bölüm: src/levels/ içine <id>.txt koy ve buraya ekle.
 */
export interface World {
  id: number;
  name: string;
  levels: string[];
}

export const WORLDS: World[] = [
  { id: 1, name: 'Çayır Diyarı', levels: ['1-1', '1-2', '1-3', '1-4'] },
  { id: 2, name: 'Yeraltı Mağaraları', levels: ['2-1', '2-2', '2-3', '2-4'] },
  { id: 3, name: 'Gökyüzü Adaları', levels: ['3-1', '3-2', '3-3', '3-4'] },
  { id: 4, name: 'Ateş Kalesi', levels: ['4-1', '4-2', '4-3', '4-4'] },
];

export const FIRST_LEVEL = WORLDS[0].levels[0];

/** Tüm bölümler oynanma sırasıyla. */
export const LEVEL_ORDER = WORLDS.flatMap((w) => w.levels);

export function nextLevelOf(id: string): string | null {
  const i = LEVEL_ORDER.indexOf(id);
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;
}

export function worldOf(id: string): World | undefined {
  return WORLDS.find((w) => w.levels.includes(id));
}
