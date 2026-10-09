import { parseLevel, type LevelData } from './Level';

// Bu klasördeki tüm .txt dosyaları otomatik bulunur; dosya adı bölüm kimliği olur (ör. "1-1").
const files = import.meta.glob('./*.txt', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

const levels = new Map<string, LevelData>();
for (const [path, text] of Object.entries(files)) {
  const id = path.replace('./', '').replace('.txt', '');
  levels.set(id, parseLevel(id, text));
}

export function getLevel(id: string): LevelData {
  const level = levels.get(id);
  if (!level) throw new Error(`Bölüm bulunamadı: ${id}. Mevcut: ${[...levels.keys()].join(', ')}`);
  return level;
}
