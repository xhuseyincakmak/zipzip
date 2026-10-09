"""Bölüm üretme ve doğrulama yardımcıları.

Kullanım: python3 tools/world1.py  ->  src/levels/1-*.txt dosyalarını yazar ve doğrular.
Doğrulayıcı, başlangıçtan bitiş direğine zıplayarak gidilebildiğini kaba bir modelle kontrol eder.
"""
from collections import deque

# G (boss kapısı) oyun sırasında katıdır ama boss yenilince açılır; doğrulamada geçilebilir sayılır.
SOLID = set('#BX?M*')
PLATFORM_RANGE = 3
H = 12
GROUND = 10  # zeminin üst satırı; oyuncu 9. satırda durur


class Level:
    def __init__(self, width, name, theme, background, time=300):
        self.w = width
        self.virtual = set()
        self.ride = set()
        self.meta = dict(name=name, theme=theme, background=background, time=time)
        self.g = [[' '] * width for _ in range(H)]

    # --- yerleştirme -----------------------------------------------------
    def put(self, x, y, ch):
        self.g[y][x] = ch
        return self

    def fill(self, x0, x1, y0, y1, ch='#'):
        x1 = min(x1, self.w - 1)  # sağ kenarı aşan aralıklar kırpılır
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.g[y][x] = ch
        return self

    def ground(self, x0, x1, top=GROUND):
        return self.fill(x0, x1, top, H - 1)

    def row(self, x0, y, s):
        """s içindeki karakterleri x0'dan başlayarak y satırına yazar (boşluklar atlanır)."""
        for i, ch in enumerate(s):
            if ch != ' ':
                self.g[y][x0 + i] = ch
        return self

    def stairs_up(self, x, n, ch='X', base=GROUND):
        for i in range(n):
            self.fill(x + i, x + i, base - 1 - i, base - 1, ch)
        return self

    def stairs_down(self, x, n, ch='X', base=GROUND):
        for i in range(n):
            self.fill(x + i, x + i, base - n + i, base - 1, ch)
        return self

    def pit(self, x0, x1, lava=False):
        """Zemini kaldırır; lava=True ise çukur lavla dolar."""
        return self.fill(x0, x1, GROUND, H - 1, 'L' if lava else ' ')

    def ceiling(self, x0, x1, rows=1, ch='#'):
        return self.fill(x0, x1, 0, rows - 1, ch)

    def coins(self, x0, x1, y):
        for x in range(x0, x1 + 1):
            if self.g[y][x] == ' ':
                self.g[y][x] = 'o'
        return self

    # --- çıktı ---------------------------------------------------------------
    def text(self):
        head = [f'{k}: {v}' for k, v in self.meta.items()] + ['---']
        return '\n'.join(head + [''.join(r).rstrip() for r in self.g]) + '\n'

    def write(self, path):
        problems = self.check()
        if problems:
            raise SystemExit(f'{path}: ' + '; '.join(problems))
        open(path, 'w').write(self.text())
        print(f'{path}: {self.w} sütun, geçilebilir ✓')

    # --- doğrulama -----------------------------------------------------------
    def find(self, ch):
        return [(x, y) for y in range(H) for x in range(self.w) if self.g[y][x] == ch]

    def solid(self, x, y):
        return 0 <= x < self.w and 0 <= y < H and (self.g[y][x] in SOLID or (x, y) in self.virtual)

    def standable(self, x, y):
        if (x, y) in self.ride and not self.solid(x, y):
            return True
        return (0 <= x < self.w and 0 < y < H - 1 and not self.solid(x, y)
                and self.g[y][x] not in 'L^' and not self.solid(x, y - 1) and self.solid(x, y + 1))

    def platform_cells(self):
        """Yatay platform: gidip geldiği satır boyunca katı sayılır (iyimser model).
        Dikey platform: geçtiği her yükseklikte üstünde durulabilir (ride), ama katı değildir."""
        cells, ride = set(), set()
        for (x, y) in self.find('='):
            for cx in range(x - PLATFORM_RANGE, x + 3 + PLATFORM_RANGE):
                cells.add((cx, y))
        for (x, y) in self.find('|'):
            for cy in range(y - PLATFORM_RANGE, y + PLATFORM_RANGE + 1):
                for cx in range(x, x + 3):
                    ride.add((cx, cy - 1))
        return cells, ride

    def check(self):
        problems = []
        self.virtual, self.ride = self.platform_cells()
        s, f = self.find('S'), self.find('F')
        if len(s) != 1: problems.append('tek bir S olmalı')
        if len(f) != 1: problems.append('tek bir F olmalı')
        if problems: return problems
        (sx, sy), (fx, fy) = s[0], f[0]
        if not self.solid(fx, fy + 1): problems.append('F zeminde değil')
        if fx + 6 > self.w: problems.append('F sağında kapı için en az 6 sütun gerekli')
        for y in range(max(0, fy - 8), fy):
            if self.solid(fx, y): problems.append(f'direk hizasında blok var ({fx},{y})')
        for y in range(H):
            for x in range(self.w):
                if self.g[y][x] in 'EKCWZ' and not self.solid(x, y + 1):
                    problems.append(f"'{self.g[y][x]}' havada ({x},{y})")

        # Durulabilen hücreler arasında zıplama grafiği (temkinli değerler).
        def max_dx(rise):
            if rise > 4: return -1
            return {4: 2, 3: 4, 2: 5, 1: 5}.get(rise, 6 + max(0, -rise) // 2)

        cells = [(x, y) for y in range(H) for x in range(self.w) if self.standable(x, y)]
        by_col = {}
        for c in cells: by_col.setdefault(c[0], []).append(c)
        start = (sx, sy)
        if not self.standable(*start): problems.append('S durulabilir değil'); return problems
        seen, q = {start}, deque([start])
        while q:
            x, y = q.popleft()
            for x2 in range(x - 9, x + 10):
                for c in by_col.get(x2, []):
                    if c in seen: continue
                    rise = y - c[1]
                    md = max_dx(rise)
                    if md >= 0 and abs(x2 - x) <= md:
                        seen.add(c); q.append(c)
        if not any(c[0] >= fx for c in seen):
            far = max(c[0] for c in seen)
            problems.append(f'bitişe ulaşılamıyor (en uzak sütun {far})')
        return problems
