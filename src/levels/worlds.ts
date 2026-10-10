/**
 * Bölüm sırası: kolaydan zora. Her "dünya" bir zorluk kademesidir.
 * Yeni bölüm: src/levels/ içine <dosya-adı>.txt koy ve buraya ekle (dosya adı = bölüm kimliği).
 */
export interface World {
  id: number;
  name: string;
  levels: string[];
}

export const WORLDS: World[] = [
  { id: 1, name: 'Kolay Patika', levels: ['yesil-baslangic', 'col-kapisi', 'orman-patikasi', 'karli-zirve'] },
  { id: 2, name: 'Orta Yol', levels: ['tas-kale', 'mor-magara', 'yildiz-kulesi', 'mantar-tepeleri'] },
  { id: 3, name: 'Zorlu Geçit', levels: ['lav-kapisi', 'bulut-yolu', 'sarkit-gecidi', 'diken-tuneli'] },
  { id: 4, name: 'Son Sınav', levels: ['testere-salonu', 'erimis-kopruler', 'ruzgar-kopruleri', 'dev-slimein-kalesi'] },
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

/** Bölümün sıradaki numarası (1'den başlar); listede yoksa 0. */
export function levelNumber(id: string): number {
  return LEVEL_ORDER.indexOf(id) + 1;
}
