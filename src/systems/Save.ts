import { FIRST_LEVEL, LEVEL_ORDER } from '../levels/worlds';

// v2: bölümler numara yerine isimle kaydediliyor; eski kayıtlar geçersiz.
const KEY = 'zipzip-macera-save-v2';

export interface SaveData {
  /** Oynanabilir bölümler. */
  unlocked: string[];
  /** Bitirilmiş bölümler ve o anki en iyi skor. */
  best: Record<string, number>;
}

const fresh = (): SaveData => ({ unlocked: [FIRST_LEVEL], best: {} });

/**
 * İlerleme tarayıcının localStorage'ında tutulur. Gizli pencere vb. durumlarda
 * depolama erişilemezse oyun yine çalışır, yalnızca ilerleme kaydedilmez.
 */
export const Save = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      const data = JSON.parse(raw) as Partial<SaveData>;
      return {
        // Artık olmayan bölümleri ayıkla; ilk bölüm her zaman açık.
        unlocked: [FIRST_LEVEL, ...(Array.isArray(data.unlocked) ? data.unlocked : [])].filter(
          (id, i, all) => LEVEL_ORDER.includes(id) && all.indexOf(id) === i,
        ),
        best: data.best && typeof data.best === 'object' ? data.best : {},
      };
    } catch {
      return fresh();
    }
  },

  write(data: SaveData) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* depolama kapalı: ilerleme bu oturumla sınırlı */
    }
  },

  /** Bölüm bitti: skoru kaydet, sonrakinin kilidini aç. */
  complete(levelId: string, score: number, nextId: string | null) {
    const data = Save.load();
    data.best[levelId] = Math.max(data.best[levelId] ?? 0, score);
    if (nextId && !data.unlocked.includes(nextId)) data.unlocked.push(nextId);
    Save.write(data);
  },

  reset() {
    Save.write(fresh());
  },
};
