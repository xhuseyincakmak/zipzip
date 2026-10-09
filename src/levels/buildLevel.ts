import Phaser from 'phaser';
import { ATLAS, TILE } from '../config';
import type { LevelData, Theme } from './Level';

/** Kenney tiles atlas'ı 64px karo + 1px boşluklu bir ızgara; karo indeksi buradan hesaplanır. */
const SHEET_STEP = TILE + 1;
const SHEET_COLUMNS = 18;

/** Bloklarla ilgili karo isimleri (Blocks sistemi kullanır). */
export const BLOCK_FRAMES = {
  question: 'block_exclamation_active',
  brick: 'bricks_brown',
  used: 'block_empty',
} as const;

const SOLID_TILES: Record<string, string> = {
  B: BLOCK_FRAMES.brick,
  '?': BLOCK_FRAMES.question,
  M: BLOCK_FRAMES.question,
  '*': BLOCK_FRAMES.question,
  X: 'block_strong_empty',
  G: 'block_strong_danger',
};

/** Soru bloklarının içinden ne çıkacağı. */
export type BlockContent = 'coin' | 'power' | 'star';
const CONTENTS: Record<string, BlockContent> = { '?': 'coin', M: 'power', '*': 'star' };

const DECOR_TILES: Record<string, string> = {
  b: 'bush',
  m: 'mushroom_red',
};

export type SpawnType = 'coin' | 'slime' | 'snail' | 'bee' | 'fly' | 'saw';

const SPAWNS: Record<string, SpawnType> = { o: 'coin', E: 'slime', K: 'snail', A: 'bee', Y: 'fly', W: 'saw' };

export interface Spawn {
  type: SpawnType;
  /** Karonun yatay ortası ve alt kenarı (px). */
  x: number;
  bottom: number;
}

export interface Platform {
  /** Sol üst köşe (px). */
  x: number;
  y: number;
  axis: 'x' | 'y';
}

export interface BuiltLevel {
  map: Phaser.Tilemaps.Tilemap;
  solid: Phaser.Tilemaps.TilemapLayer;
  /** Lav ve diken: çarpışmasız, dokunulduğu kontrol edilir. */
  hazards: Phaser.Tilemaps.TilemapLayer;
  platforms: Platform[];
  /** Boss yenilince kaldırılacak kapı karoları. */
  gates: { x: number; y: number }[];
  boss?: { x: number; bottom: number };
  spawn: { x: number; y: number };
  spawns: Spawn[];
  /** "x,y" karo koordinatı → içerik. */
  contents: Map<string, BlockContent>;
  /** Bitiş direğinin dibi (karo ortası, alt kenar). */
  flag?: { x: number; bottom: number };
  checkpoints: { x: number; bottom: number }[];
  widthPx: number;
  heightPx: number;
}

export function buildLevel(scene: Phaser.Scene, level: LevelData): BuiltLevel {
  const map = scene.make.tilemap({
    tileWidth: TILE,
    tileHeight: TILE,
    width: level.width,
    height: level.height,
  });
  const tileset = map.addTilesetImage('tiles', ATLAS.tiles, TILE, TILE, 0, 1)!;
  const decor = map.createBlankLayer('decor', tileset)!.setDepth(1);
  const solid = map.createBlankLayer('solid', tileset)!.setDepth(2);
  const hazards = map.createBlankLayer('hazards', tileset)!.setDepth(2);

  const index = (name: string) => tileIndex(scene, name);
  const isGround = (x: number, y: number) => {
    if (y >= level.height) return true; // haritanın altı zemin gibi davranır
    if (y < 0) return level.rows[0][Phaser.Math.Clamp(x, 0, level.width - 1)] === '#'; // tavan yukarı devam eder
    const cx = Phaser.Math.Clamp(x, 0, level.width - 1); // yan kenarlar devam ediyormuş gibi
    return level.rows[y][cx] === '#';
  };

  let spawn = { x: 2 * TILE, y: (level.height - 3) * TILE };
  const spawns: Spawn[] = [];
  const contents = new Map<string, BlockContent>();
  const checkpoints: { x: number; bottom: number }[] = [];
  let flag: BuiltLevel['flag'];
  let boss: BuiltLevel['boss'];
  const platforms: Platform[] = [];
  const gates: { x: number; y: number }[] = [];

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const ch = level.rows[y][x];
      if (ch === '#') {
        solid.putTileAt(index(terrainFrame(level.theme, x, y, isGround)), x, y);
      } else if (SOLID_TILES[ch]) {
        solid.putTileAt(index(SOLID_TILES[ch]), x, y);
        if (CONTENTS[ch]) contents.set(`${x},${y}`, CONTENTS[ch]);
        if (ch === 'G') gates.push({ x, y });
      } else if (ch === 'L') {
        const top = y === 0 || level.rows[y - 1][x] !== 'L';
        hazards.putTileAt(index(top ? 'lava_top' : 'lava'), x, y);
      } else if (ch === '^') {
        hazards.putTileAt(index('spikes'), x, y);
      } else if (ch === '=' || ch === '|') {
        platforms.push({ x: x * TILE, y: y * TILE, axis: ch === '=' ? 'x' : 'y' });
      } else if (ch === 'Z') {
        boss = { x: x * TILE + TILE / 2, bottom: (y + 1) * TILE };
      } else if (DECOR_TILES[ch]) {
        decor.putTileAt(index(DECOR_TILES[ch]), x, y);
      } else if (SPAWNS[ch]) {
        spawns.push({ type: SPAWNS[ch], x: x * TILE + TILE / 2, bottom: (y + 1) * TILE });
      } else if (ch === 'S') {
        spawn = { x: x * TILE + TILE / 2, y: (y + 1) * TILE };
      } else if (ch === 'F') {
        flag = { x: x * TILE + TILE / 2, bottom: (y + 1) * TILE };
      } else if (ch === 'C') {
        checkpoints.push({ x: x * TILE + TILE / 2, bottom: (y + 1) * TILE });
      }
    }
  }

  solid.setCollisionByExclusion([-1]);

  return { map, solid, hazards, platforms, gates, boss, spawn, spawns, contents, flag, checkpoints, widthPx: map.widthInPixels, heightPx: map.heightInPixels };
}

export function tileIndex(scene: Phaser.Scene, frameName: string): number {
  const frame = scene.textures.getFrame(ATLAS.tiles, frameName);
  if (!frame || frame.name !== frameName) throw new Error(`Karo bulunamadı: ${frameName}`);
  return (frame.cutY / SHEET_STEP) * SHEET_COLUMNS + frame.cutX / SHEET_STEP;
}

/** Komşu zemin karolarına bakarak doğru kenar/köşe parçasını seçer. */
export function terrainFrame(
  theme: Theme,
  x: number,
  y: number,
  isGround: (x: number, y: number) => boolean,
): string {
  const p = `terrain_${theme}_`;
  const up = isGround(x, y - 1);
  const down = isGround(x, y + 1);
  const left = isGround(x - 1, y);
  const right = isGround(x + 1, y);

  if (!up && !down) {
    if (!left && !right) return p + 'block';
    if (!left) return p + 'horizontal_left';
    if (!right) return p + 'horizontal_right';
    return p + 'horizontal_middle';
  }
  if (!left && !right) {
    if (!up) return p + 'vertical_top';
    if (!down) return p + 'vertical_bottom';
    return p + 'vertical_middle';
  }
  const v = !up ? 'top' : !down ? 'bottom' : '';
  const h = !left ? 'left' : !right ? 'right' : '';
  if (!v && !h) return p + 'block_center';
  return p + 'block_' + [v, h].filter(Boolean).join('_');
}
