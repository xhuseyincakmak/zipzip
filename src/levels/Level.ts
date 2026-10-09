/**
 * Bölüm dosyası formatı (.txt):
 *
 *   name: Test Alanı
 *   theme: grass          -> grass | dirt | sand | snow | stone | purple
 *   background: hills     -> hills | trees | desert | mushrooms | cave
 *   time: 300
 *   ---
 *   <ASCII ızgara, her karakter bir karo>
 *
 * Karakterlerin anlamı LEGEND'da.
 */

export const THEMES = ['grass', 'dirt', 'sand', 'snow', 'stone', 'purple'] as const;
export type Theme = (typeof THEMES)[number];

export const BACKGROUNDS = ['hills', 'trees', 'desert', 'mushrooms', 'cave'] as const;
export type Background = (typeof BACKGROUNDS)[number];

export const LEGEND = {
  ' ': 'boşluk',
  '#': 'zemin (temaya göre otomatik kenar seçilir)',
  'B': 'tuğla',
  '?': 'soru bloğu (coin)',
  'M': 'soru bloğu (güç: küçükken kalp, büyükken ateş mücevheri)',
  '*': 'soru bloğu (yıldız)',
  'F': 'bitiş direği (dibi bu karede)',
  'C': 'checkpoint bayrağı',
  'X': 'sert blok (merdiven)',
  'S': 'oyuncu başlangıcı',
  'o': 'coin',
  'E': 'slime (ezilir)',
  'K': 'salyangoz (ezilince kabuğa girer, kabuk tekmelenir)',
  'A': 'arı (yerinde yukarı-aşağı uçar)',
  'Y': 'sinek (yatayda gidip gelir)',
  'W': 'testere (ezilemez, ateşten etkilenmez)',
  'L': 'lav (dokunan ölür)',
  '^': 'diken (dokunan hasar alır)',
  '=': 'yatay hareketli platform (3 karo, sol ucu)',
  '|': 'dikey hareketli platform (3 karo, sol ucu)',
  'G': 'boss kapısı (boss yenilince açılır)',
  'Z': 'boss',
  'b': 'çalı (dekor)',
  'm': 'mantar (dekor)',
} as const;

export interface LevelData {
  id: string;
  name: string;
  theme: Theme;
  background: Background;
  time: number;
  width: number;
  height: number;
  /** Hepsi aynı uzunlukta (sağdan boşlukla doldurulur). */
  rows: string[];
}

export function parseLevel(id: string, text: string): LevelData {
  const lines = text.replace(/\r/g, '').split('\n');
  const sep = lines.findIndex((l) => l.trim() === '---');
  if (sep < 0) throw new Error(`Bölüm "${id}": başlık ile harita arasında '---' satırı yok.`);

  const meta: Record<string, string> = {};
  for (const line of lines.slice(0, sep)) {
    const m = line.match(/^\s*(\w+)\s*:\s*(.*?)\s*$/);
    if (m) meta[m[1].toLowerCase()] = m[2];
  }

  const raw = lines.slice(sep + 1);
  while (raw.length && raw[raw.length - 1].trim() === '') raw.pop();
  const width = Math.max(...raw.map((r) => r.length));
  const rows = raw.map((r) => r.padEnd(width, ' '));

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x];
      if (!(ch in LEGEND)) console.warn(`Bölüm "${id}": bilinmeyen karakter '${ch}' (${x},${y})`);
    }
  }

  const theme = pick(meta.theme, THEMES, 'grass');
  const background = pick(meta.background, BACKGROUNDS, 'hills');
  return {
    id,
    name: meta.name ?? id,
    theme,
    background,
    time: Number(meta.time) || 300,
    width,
    height: rows.length,
    rows,
  };
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
