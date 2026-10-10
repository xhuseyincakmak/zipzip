import Phaser from 'phaser';
import { ATLAS, GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { getLevel } from '../levels';
import { LEVEL_ORDER } from '../levels/worlds';
import { terrainFrame } from '../levels/buildLevel';
import { BACKGROUNDS, LEGEND, parseLevel, THEMES, type Background, type LevelData, type Theme } from '../levels/Level';
import { validateRows } from '../levels/validate';
import { playSfx } from '../systems/audio';
import { GameState } from '../systems/GameState';
import { Music } from '../systems/Music';

const FONT = 'system-ui, sans-serif';
const DRAFT_KEY = 'zipzip-macera-editor-draft-v1';
const TOOLBAR_H = 88;
const BOTTOM_H = 104;
const ZOOM = 0.75;
const MIN_WIDTH = 40;
const MAX_WIDTH = 400;
const UNDO_LIMIT = 50;
/** Bölümde yalnızca bir tane olabilen karakterler. */
const SINGLE = new Set(['S', 'F', 'Z']);

type Icon = { atlas: string; frame: string; scale?: number; badge?: string };

/** Paletteki araçlar: karakter → editörde görünen simge. */
const TOOLS: { ch: string; icon: Icon }[] = [
  { ch: '#', icon: { atlas: ATLAS.tiles, frame: 'terrain_grass_block_top' } },
  { ch: 'B', icon: { atlas: ATLAS.tiles, frame: 'bricks_brown' } },
  { ch: '?', icon: { atlas: ATLAS.tiles, frame: 'block_exclamation_active', badge: 'coin_gold' } },
  { ch: 'M', icon: { atlas: ATLAS.tiles, frame: 'block_exclamation_active', badge: 'heart' } },
  { ch: '*', icon: { atlas: ATLAS.tiles, frame: 'block_exclamation_active', badge: 'star' } },
  { ch: 'X', icon: { atlas: ATLAS.tiles, frame: 'block_strong_empty' } },
  { ch: 'G', icon: { atlas: ATLAS.tiles, frame: 'block_strong_danger' } },
  { ch: 'o', icon: { atlas: ATLAS.tiles, frame: 'coin_gold' } },
  { ch: 'E', icon: { atlas: ATLAS.enemies, frame: 'slime_normal_rest' } },
  { ch: 'K', icon: { atlas: ATLAS.enemies, frame: 'snail_rest' } },
  { ch: 'A', icon: { atlas: ATLAS.enemies, frame: 'bee_rest' } },
  { ch: 'Y', icon: { atlas: ATLAS.enemies, frame: 'fly_rest' } },
  { ch: 'W', icon: { atlas: ATLAS.enemies, frame: 'saw_rest' } },
  { ch: 'Z', icon: { atlas: ATLAS.enemies, frame: 'slime_block_rest' } },
  { ch: 'L', icon: { atlas: ATLAS.tiles, frame: 'lava_top' } },
  { ch: '^', icon: { atlas: ATLAS.tiles, frame: 'spikes' } },
  { ch: '=', icon: { atlas: ATLAS.tiles, frame: 'terrain_grass_cloud_middle', badge: '↔' } },
  { ch: '|', icon: { atlas: ATLAS.tiles, frame: 'terrain_grass_cloud_middle', badge: '↕' } },
  { ch: 'C', icon: { atlas: ATLAS.tiles, frame: 'flag_off' } },
  { ch: 'F', icon: { atlas: ATLAS.tiles, frame: 'flag_green_a' } },
  { ch: 'S', icon: { atlas: ATLAS.characters, frame: 'character_green_idle', scale: 0.5 } },
  { ch: 'b', icon: { atlas: ATLAS.tiles, frame: 'bush' } },
  { ch: 'm', icon: { atlas: ATLAS.tiles, frame: 'mushroom_red' } },
  { ch: ' ', icon: { atlas: ATLAS.tiles, frame: 'hud_character_multiply' } },
];

const TOOL_NAMES: Record<string, string> = { ...LEGEND, ' ': 'silgi (sağ tık da siler)' };

interface Meta {
  name: string;
  theme: Theme;
  background: Background;
  time: number;
}

/**
 * Tarayıcı içi bölüm editörü.
 * Sol tık: çiz, sağ tık: sil, ← → / tekerlek: kaydır, klavyede karakter: araç seç,
 * Ctrl/Cmd+Z: geri al, Enter: test et, Esc: başlık ekranı.
 */
export class EditorScene extends Phaser.Scene {
  private grid: string[][] = [];
  private meta!: Meta;
  private tool = '#';
  private undo: string[][] = [];
  private cells: (Phaser.GameObjects.GameObject | null)[][] = [];
  private world!: Phaser.GameObjects.Container;
  private ui!: Phaser.GameObjects.Container;
  private gridLines!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Rectangle;
  private toolMarks: Phaser.GameObjects.Rectangle[] = [];
  private metaTexts: Record<string, Phaser.GameObjects.Text> = {};
  private status!: Phaser.GameObjects.Text;
  private toolName!: Phaser.GameObjects.Text;
  private painting: 'paint' | 'erase' | null = null;
  private saveTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('Editor');
  }

  create() {
    if (this.scene.isActive('HUD')) this.scene.stop('HUD');
    if (this.scene.isActive('TouchControls')) this.scene.stop('TouchControls');
    Music.stop();
    this.world = this.add.container(0, 0);
    this.ui = this.add.container(0, 0).setDepth(100);

    const cam = this.cameras.main;
    cam.setViewport(0, TOOLBAR_H, GAME_WIDTH, GAME_HEIGHT - TOOLBAR_H - BOTTOM_H).setZoom(ZOOM);
    const uiCam = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
    cam.ignore(this.ui);
    uiCam.ignore(this.world);

    this.gridLines = this.add.graphics();
    this.hover = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0).setStrokeStyle(4, 0x16a34a).setFillStyle(0x16a34a, 0.15);
    this.createToolbar();
    this.createBottomBar();

    this.loadText(this.readDraft() ?? this.defaultLevelText(), false);
    this.setupInput();
  }

  // ---------------------------------------------------------------- veri

  private defaultLevelText() {
    const w = 120;
    const rows = Array.from({ length: 12 }, (_, y) => (y >= 10 ? '#'.repeat(w) : ' '.repeat(w)).split(''));
    rows[9][3] = 'S';
    rows[9][110] = 'F';
    return this.serialize({ name: 'Yeni Bölüm', theme: 'grass', background: 'hills', time: 300 }, rows);
  }

  private serialize(meta: Meta, grid: string[][]) {
    const head = [`name: ${meta.name}`, `theme: ${meta.theme}`, `background: ${meta.background}`, `time: ${meta.time}`, '---'];
    return [...head, ...grid.map((r) => r.join('').trimEnd())].join('\n') + '\n';
  }

  private text() {
    return this.serialize(this.meta, this.grid);
  }

  private loadText(text: string, announce = true) {
    let level: LevelData;
    try {
      level = parseLevel('custom', text);
    } catch (e) {
      this.setStatus(`Okunamadı: ${(e as Error).message}`, true);
      return;
    }
    this.meta = { name: level.name, theme: level.theme, background: level.background, time: level.time };
    this.grid = level.rows.map((r) => r.split(''));
    this.undo = [];
    this.redrawAll();
    this.refreshMeta();
    if (announce) this.setStatus(`"${level.name}" yüklendi (${level.width} sütun)`);
    this.scheduleSave();
  }

  private get width() {
    return this.grid[0]?.length ?? 0;
  }

  private get height() {
    return this.grid.length;
  }

  private readDraft(): string | null {
    try {
      return localStorage.getItem(DRAFT_KEY);
    } catch {
      return null;
    }
  }

  private scheduleSave() {
    this.saveTimer?.remove();
    this.saveTimer = this.time.delayedCall(400, () => {
      try {
        localStorage.setItem(DRAFT_KEY, this.text());
      } catch {
        /* depolama kapalı: taslak bu oturumla sınırlı */
      }
    });
  }

  private pushUndo() {
    this.undo.push(this.grid.map((r) => r.join('')));
    if (this.undo.length > UNDO_LIMIT) this.undo.shift();
  }

  private popUndo() {
    const snap = this.undo.pop();
    if (!snap) return this.setStatus('Geri alınacak bir şey yok');
    this.grid = snap.map((r) => r.split(''));
    this.redrawAll();
    this.refreshMeta();
    this.scheduleSave();
  }

  // ---------------------------------------------------------------- çizim

  private setCell(x: number, y: number, ch: string) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height || this.grid[y][x] === ch) return;
    if (SINGLE.has(ch)) {
      // Önceki örneği kaldır
      for (let yy = 0; yy < this.height; yy++)
        for (let xx = 0; xx < this.width; xx++)
          if (this.grid[yy][xx] === ch) {
            this.grid[yy][xx] = ' ';
            this.drawCell(xx, yy);
          }
    }
    this.grid[y][x] = ch;
    // Zemin kenarları komşulara bağlı; çevresini de yeniden çiz.
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) this.drawCell(x + dx, y + dy);
    this.scheduleSave();
  }

  private redrawAll() {
    for (const row of this.cells) for (const c of row) c?.destroy();
    this.cells = this.grid.map((r) => r.map(() => null));
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) this.drawCell(x, y);

    const w = this.width * TILE;
    const h = this.height * TILE;
    this.gridLines.clear().lineStyle(2, 0x000000, 0.12);
    for (let x = 0; x <= this.width; x++) this.gridLines.lineBetween(x * TILE, 0, x * TILE, h);
    for (let y = 0; y <= this.height; y++) this.gridLines.lineBetween(0, y * TILE, w, y * TILE);
    this.world.add([this.gridLines, this.hover]);
    this.world.bringToTop(this.gridLines);
    this.world.bringToTop(this.hover);

    const cam = this.cameras.main;
    cam.setBackgroundColor(this.meta.background === 'cave' ? 0x2a2540 : 0xc3e3ff);
    cam.setBounds(0, 0, w, Math.max(h, cam.height / ZOOM));
  }

  private drawCell(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.cells[y][x]?.destroy();
    this.cells[y][x] = null;
    const ch = this.grid[y][x];
    if (ch === ' ') return;
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    let obj: Phaser.GameObjects.GameObject;

    if (ch === '#') {
      const isGround = (gx: number, gy: number) => {
        if (gy >= this.height) return true;
        const col = Phaser.Math.Clamp(gx, 0, this.width - 1);
        if (gy < 0) return this.grid[0][col] === '#';
        return this.grid[gy][col] === '#';
      };
      obj = this.add.image(cx, cy, ATLAS.tiles, terrainFrame(this.meta.theme, x, y, isGround));
    } else if (ch === '=' || ch === '|') {
      // Hareketli platform 3 karo: sol ucunu işaretle, gövdeyi yarı saydam göster.
      const c = this.add.container(cx, cy);
      ['left', 'middle', 'right'].forEach((side, i) =>
        c.add(this.add.image(i * TILE, 0, ATLAS.tiles, `terrain_${this.meta.theme}_cloud_${side}`).setAlpha(i ? 0.5 : 1)),
      );
      c.add(this.badgeText(ch === '=' ? '↔' : '↕', TILE, 0));
      obj = c;
    } else if (ch === 'L') {
      const top = y === 0 || this.grid[y - 1][x] !== 'L';
      obj = this.add.image(cx, cy, ATLAS.tiles, top ? 'lava_top' : 'lava');
    } else {
      const tool = TOOLS.find((t) => t.ch === ch);
      obj = tool ? this.iconAt(cx, cy, tool.icon, 1) : this.badgeText(ch, cx, cy);
    }
    this.world.add(obj);
    this.world.bringToTop(this.gridLines);
    this.world.bringToTop(this.hover);
    this.cells[y][x] = obj;
  }

  private iconAt(x: number, y: number, icon: Icon, scale: number) {
    const c = this.add.container(x, y);
    c.add(this.add.image(0, 0, icon.atlas, icon.frame).setScale((icon.scale ?? 1) * scale));
    if (icon.badge) {
      if (icon.badge.length > 2) c.add(this.add.image(16 * scale, 16 * scale, ATLAS.tiles, icon.badge).setScale(0.5 * scale));
      else c.add(this.badgeText(icon.badge, 14 * scale, 14 * scale));
    }
    return c;
  }

  private badgeText(text: string, x: number, y: number) {
    return this.add
      .text(x, y, text, { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setStroke('#1f2937', 6);
  }

  // ---------------------------------------------------------------- arayüz

  private createToolbar() {
    this.ui.add(this.add.rectangle(0, 0, GAME_WIDTH, TOOLBAR_H, 0x1f2937).setOrigin(0));
    const step = 50;
    TOOLS.forEach((tool, i) => {
      const x = 30 + i * step;
      const y = 34;
      const mark = this.add.rectangle(x, y, 46, 46, 0xffffff, 0.12).setStrokeStyle(3, 0x4ade80, 0);
      const icon = this.iconAt(x, y, tool.icon, 0.62);
      const hit = this.add.rectangle(x, y, 46, 46, 0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.selectTool(tool.ch));
      hit.on('pointerover', () => this.toolName.setText(this.toolLabel(tool.ch)));
      hit.on('pointerout', () => this.toolName.setText(this.toolLabel(this.tool)));
      this.ui.add([mark, icon, hit]);
      this.toolMarks.push(mark);
    });
    this.toolName = this.add.text(16, 64, '', { fontFamily: FONT, fontSize: '17px', color: '#e5e7eb' });
    this.ui.add(this.toolName);
    this.selectTool('#');
  }

  private toolLabel(ch: string) {
    return `[${ch === ' ' ? 'boşluk' : ch}] ${TOOL_NAMES[ch as keyof typeof TOOL_NAMES] ?? ''}`;
  }

  private selectTool(ch: string) {
    this.tool = ch;
    TOOLS.forEach((t, i) => this.toolMarks[i].setStrokeStyle(3, 0x4ade80, t.ch === ch ? 1 : 0));
    this.toolName?.setText(this.toolLabel(ch));
  }

  private createBottomBar() {
    const top = GAME_HEIGHT - BOTTOM_H;
    this.ui.add(this.add.rectangle(0, top, GAME_WIDTH, BOTTOM_H, 0x1f2937).setOrigin(0));

    let x = 12;
    const row1 = top + 26;
    const row2 = top + 74;
    const button = (y: number, label: string, onClick: () => void, color = '#374151') => {
      const t = this.add
        .text(x, y, label, { fontFamily: FONT, fontSize: '19px', color: '#ffffff', backgroundColor: color, padding: { x: 10, y: 7 } })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setAlpha(0.8));
      t.on('pointerout', () => t.setAlpha(1));
      t.on('pointerdown', () => {
        playSfx(this, 'select', { volume: 0.3 });
        onClick();
      });
      this.ui.add(t);
      x += t.width + 8;
      return t;
    };

    this.metaTexts.name = button(row1, '', () => {
      const name = window.prompt('Bölüm adı:', this.meta.name);
      if (name?.trim()) this.updateMeta({ name: name.trim() });
    });
    this.metaTexts.theme = button(row1, '', () => this.updateMeta({ theme: cycle(THEMES, this.meta.theme) }));
    this.metaTexts.background = button(row1, '', () => this.updateMeta({ background: cycle(BACKGROUNDS, this.meta.background) }));
    this.metaTexts.time = button(row1, '', () => {
      const t = Number(window.prompt('Süre (100-999):', String(this.meta.time)));
      if (t >= 100 && t <= 999) this.updateMeta({ time: Math.round(t) });
    });
    this.metaTexts.width = button(row1, '', () => {});
    button(row1, '−10', () => this.resize(-10));
    button(row1, '+10', () => this.resize(10));

    x = 12;
    button(row2, '▶ Test et (Enter)', () => this.test(), '#15803d');
    button(row2, '✓ Kontrol et', () => this.check(), '#1d4ed8');
    button(row2, 'Kopyala', () => this.copy());
    button(row2, '.txt indir', () => this.download());
    button(row2, 'Dosyadan aç', () => this.openFile());
    button(row2, 'Panodan yapıştır', () => this.paste());
    button(row2, 'Bölüm aç…', () => this.openExisting());
    button(row2, 'Yeni', () => {
      if (window.confirm('Mevcut taslak silinsin ve yeni bölüm açılsın mı?')) this.loadText(this.defaultLevelText());
    });
    button(row2, 'Geri al', () => this.popUndo());

    this.status = this.add
      .text(GAME_WIDTH - 12, row1, '', { fontFamily: FONT, fontSize: '18px', color: '#a7f3d0', align: 'right', wordWrap: { width: 420 } })
      .setOrigin(1, 0.5);
    this.ui.add(this.status);
  }

  private refreshMeta() {
    const m = this.metaTexts;
    m.name.setText(`Ad: ${this.meta.name}`);
    m.theme.setText(`Tema: ${this.meta.theme}`);
    m.background.setText(`Arka plan: ${this.meta.background}`);
    m.time.setText(`Süre: ${this.meta.time}`);
    m.width.setText(`Genişlik: ${this.width}`);
    // Etiket uzunlukları değişince satırı yeniden hizala.
    let x = 12;
    for (const t of [m.name, m.theme, m.background, m.time, m.width]) {
      t.setX(x);
      x += t.width + 8;
    }
    const rest = this.ui.list.filter(
      (o) => o instanceof Phaser.GameObjects.Text && o.y === m.name.y && !Object.values(m).includes(o) && o !== this.status,
    ) as Phaser.GameObjects.Text[];
    for (const t of rest) {
      t.setX(x);
      x += t.width + 8;
    }
  }

  private updateMeta(patch: Partial<Meta>) {
    this.meta = { ...this.meta, ...patch };
    this.refreshMeta();
    if (patch.theme || patch.background) this.redrawAll();
    this.scheduleSave();
  }

  private resize(delta: number) {
    const w = Phaser.Math.Clamp(this.width + delta, MIN_WIDTH, MAX_WIDTH);
    if (w === this.width) return;
    this.pushUndo();
    this.grid = this.grid.map((row, y) => {
      if (w < row.length) return row.slice(0, w);
      // Genişlerken alttaki iki satır zeminle uzar.
      const fill = y >= this.height - 2 ? '#' : ' ';
      return [...row, ...Array(w - row.length).fill(fill)];
    });
    this.redrawAll();
    this.refreshMeta();
    this.scheduleSave();
  }

  private setStatus(text: string, error = false) {
    this.status.setText(text).setColor(error ? '#fca5a5' : '#a7f3d0');
  }

  // ---------------------------------------------------------------- eylemler

  private check(): boolean {
    const problems = validateRows(this.grid.map((r) => r.join('')));
    if (problems.length) this.setStatus('⚠ ' + problems.slice(0, 3).join(' • '), true);
    else this.setStatus('✓ Geçilebilir: başlangıçtan bitişe ulaşılıyor');
    return problems.length === 0;
  }

  private test() {
    const problems = validateRows(this.grid.map((r) => r.join('')));
    const blocking = problems.filter((p) => p.includes('(S)') || p.includes('(F)'));
    if (blocking.length) return this.setStatus('⚠ ' + blocking.join(' • '), true);
    const level = parseLevel('custom', this.text());
    level.name = this.meta.name;
    try {
      localStorage.setItem(DRAFT_KEY, this.text());
    } catch {
      /* yoksay */
    }
    GameState.reset();
    this.scene.start('Game', { levelId: 'custom', levelData: level, testMode: true });
  }

  private async copy() {
    try {
      await navigator.clipboard.writeText(this.text());
      this.setStatus('Panoya kopyalandı');
    } catch {
      this.setStatus('Pano erişimi reddedildi; ".txt indir" kullan', true);
    }
  }

  private download() {
    const blob = new Blob([this.text()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug(this.meta.name) || 'bolum'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.setStatus(`${a.download} indirildi → src/levels/ içine koyup worlds.ts'e ekle`);
  }

  private openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) this.loadText(await file.text());
    };
    input.click();
  }

  private async paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.includes('---')) return this.setStatus('Panoda bölüm metni yok (--- satırı bulunamadı)', true);
      this.loadText(text);
    } catch {
      this.setStatus('Pano erişimi reddedildi; "Dosyadan aç" kullan', true);
    }
  }

  private openExisting() {
    const input = window.prompt(`Açılacak bölümün sırası (1-${LEVEL_ORDER.length}) ya da adı:`, '1');
    if (!input) return;
    const id = findLevelId(input.trim());
    try {
      const level = getLevel(id);
      const meta: Meta = { name: level.name, theme: level.theme, background: level.background, time: level.time };
      this.loadText(this.serialize(meta, level.rows.map((r) => r.split(''))));
    } catch {
      this.setStatus(`"${id}" adında bölüm yok`, true);
    }
  }

  // ---------------------------------------------------------------- giriş

  private setupInput() {
    this.input.mouse?.disableContextMenu();
    const cam = this.cameras.main;

    const cellAt = (p: Phaser.Input.Pointer) => {
      if (p.y < TOOLBAR_H || p.y > GAME_HEIGHT - BOTTOM_H) return null;
      const w = cam.getWorldPoint(p.x, p.y);
      const x = Math.floor(w.x / TILE);
      const y = Math.floor(w.y / TILE);
      return x >= 0 && y >= 0 && x < this.width && y < this.height ? { x, y } : null;
    };
    const apply = (p: Phaser.Input.Pointer) => {
      const c = cellAt(p);
      if (c && this.painting) this.setCell(c.x, c.y, this.painting === 'erase' ? ' ' : this.tool);
    };

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length || !cellAt(p)) return;
      this.pushUndo();
      this.painting = p.rightButtonDown() ? 'erase' : 'paint';
      apply(p);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const c = cellAt(p);
      this.hover.setVisible(!!c);
      if (c) this.hover.setPosition(c.x * TILE, c.y * TILE);
      apply(p);
    });
    this.input.on('pointerup', () => (this.painting = null));
    this.input.on('wheel', (_p: unknown, _o: unknown, dx: number, dy: number) => {
      cam.scrollX += (Math.abs(dx) > Math.abs(dy) ? dx : dy) * 1.2;
    });

    const kb = this.input.keyboard!;
    const scroll = { left: kb.addKey('LEFT'), right: kb.addKey('RIGHT'), up: kb.addKey('UP'), down: kb.addKey('DOWN') };
    this.events.on(Phaser.Scenes.Events.UPDATE, (_t: number, dt: number) => {
      const s = dt * 1.4;
      if (scroll.left.isDown) cam.scrollX -= s;
      if (scroll.right.isDown) cam.scrollX += s;
      if (scroll.up.isDown) cam.scrollY -= s;
      if (scroll.down.isDown) cam.scrollY += s;
    });
    kb.on('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        return this.popUndo();
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') return this.test();
      if (e.key === 'Escape') return this.scene.start('Title');
      if (TOOLS.some((t) => t.ch === e.key)) {
        e.preventDefault();
        this.selectTool(e.key);
      }
    });
  }
}

function cycle<T>(list: readonly T[], current: T): T {
  return list[(list.indexOf(current) + 1) % list.length];
}

/** "3", "Orman Patikası" ya da "orman-patikasi" → bölüm kimliği. */
function findLevelId(input: string): string {
  const n = Number(input);
  if (Number.isInteger(n) && n >= 1 && n <= LEVEL_ORDER.length) return LEVEL_ORDER[n - 1];
  const s = slug(input);
  return LEVEL_ORDER.find((id) => id === s || slug(getLevel(id).name) === s) ?? s;
}

function slug(name: string) {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a' };
  return name
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâ]/g, (c) => map[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
