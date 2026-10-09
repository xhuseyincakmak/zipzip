/**
 * Bölüm doğrulayıcı (tools/levelkit.py ile aynı kaba model).
 * Başlangıçtan bitiş direğine zıplayarak gidilebildiğini kontrol eder; sorunları Türkçe döndürür.
 */
const SOLID = new Set(['#', 'B', 'X', '?', 'M', '*']);
const PLATFORM_RANGE = 3;

export function validateRows(rows: string[]): string[] {
  const H = rows.length;
  const W = Math.max(0, ...rows.map((r) => r.length));
  const at = (x: number, y: number) => (y >= 0 && y < H ? rows[y][x] ?? ' ' : ' ');
  const find = (ch: string) => {
    const out: [number, number][] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === ch) out.push([x, y]);
    return out;
  };
  const key = (x: number, y: number) => `${x},${y}`;

  // Yatay platform satırı boyunca katı; dikey platform geçtiği her yükseklikte üstünde durulabilir.
  const virtual = new Set<string>();
  const ride = new Set<string>();
  for (const [x, y] of find('=')) for (let cx = x - PLATFORM_RANGE; cx < x + 3 + PLATFORM_RANGE; cx++) virtual.add(key(cx, y));
  for (const [x, y] of find('|'))
    for (let cy = y - PLATFORM_RANGE; cy <= y + PLATFORM_RANGE; cy++) for (let cx = x; cx < x + 3; cx++) ride.add(key(cx, cy - 1));

  const solid = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H && (SOLID.has(at(x, y)) || virtual.has(key(x, y)));
  const standable = (x: number, y: number) => {
    if (ride.has(key(x, y)) && !solid(x, y)) return true;
    return x >= 0 && x < W && y > 0 && y < H - 1 && !solid(x, y) && !'L^'.includes(at(x, y)) && !solid(x, y - 1) && solid(x, y + 1);
  };

  const problems: string[] = [];
  const s = find('S');
  const f = find('F');
  if (s.length !== 1) problems.push(`Tek bir başlangıç (S) olmalı (şu an ${s.length})`);
  if (f.length !== 1) problems.push(`Tek bir bitiş direği (F) olmalı (şu an ${f.length})`);
  if (problems.length) return problems;
  const [[sx, sy]] = s;
  const [[fx, fy]] = f;
  if (!solid(fx, fy + 1)) problems.push('Bitiş direği (F) zeminde değil');
  if (fx + 6 > W) problems.push('Bitiş direğinin sağında kapı için en az 6 sütun gerekli');
  for (let y = Math.max(0, fy - 8); y < fy; y++) if (solid(fx, y)) problems.push(`Direğin hizasında blok var (${fx},${y})`);
  for (const ch of 'EKCWZ')
    for (const [x, y] of find(ch)) if (!solid(x, y + 1)) problems.push(`'${ch}' havada duruyor (${x},${y})`);
  if (find('Z').length && !find('G').length) problems.push('Boss (Z) var ama kapı (G) yok');
  if (!standable(sx, sy)) {
    problems.push('Başlangıç (S) altında zemin yok');
    return problems;
  }

  const maxDx = (rise: number) => (rise > 4 ? -1 : rise >= 1 ? ({ 4: 2, 3: 4, 2: 5, 1: 5 } as Record<number, number>)[rise] : 6 + Math.floor(Math.max(0, -rise) / 2));
  const byCol = new Map<number, number[]>();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (standable(x, y)) {
        if (!byCol.has(x)) byCol.set(x, []);
        byCol.get(x)!.push(y);
      }
  const seen = new Set([key(sx, sy)]);
  const queue: [number, number][] = [[sx, sy]];
  let far = sx;
  while (queue.length) {
    const [x, y] = queue.shift()!;
    far = Math.max(far, x);
    for (let x2 = x - 9; x2 <= x + 9; x2++) {
      for (const y2 of byCol.get(x2) ?? []) {
        const k = key(x2, y2);
        if (seen.has(k)) continue;
        const md = maxDx(y - y2);
        if (md >= 0 && Math.abs(x2 - x) <= md) {
          seen.add(k);
          queue.push([x2, y2]);
        }
      }
    }
  }
  if (far < fx) problems.push(`Bitişe ulaşılamıyor: en uzak gidilebilen sütun ${far}, direk ${fx}`);
  return problems;
}
