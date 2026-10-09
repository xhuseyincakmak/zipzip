import Phaser from 'phaser';
import { ATLAS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { Background } from '../levels/Level';

const BG_SCALE = 2;

export interface ParallaxBackground {
  /** Kamera yatay konumuna göre katmanları kaydırır. */
  scrollTo(cameraX: number): void;
}

/**
 * Gökyüzü + bulutlar + soluk tepeler + renkli tepeler; uzaktaki katman daha yavaş kayar.
 * Tepe katmanları BootScene'de beyazı şeffaf yapılmış dokulardır ("bg_" önekli).
 */
export function createParallaxBackground(scene: Phaser.Scene, bg: Background): ParallaxBackground {
  if (bg === 'cave') return createCave(scene);
  const h = 256 * BG_SCALE;
  const layers: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];
  const add = (key: string, frame: string | undefined, y: number, factor: number) => {
    const sprite = scene.add
      .tileSprite(0, y, GAME_WIDTH, h, key, frame)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setTileScale(BG_SCALE);
    // Doku dikeyde tekrar ettiği için üst kenar alttaki satırla karışıp ince bir çizgi
    // bırakıyordu; bir piksel kaydırınca kayboluyor.
    sprite.tilePositionY = 1;
    layers.push({ sprite, factor });
  };

  scene.add
    .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, ATLAS.backgrounds, 'background_solid_sky')
    .setOrigin(0, 0)
    .setScrollFactor(0);
  // Bulut karesinin opak beyaz alt kısmı, soluk tepelerin arkasında kalır.
  add(ATLAS.backgrounds, 'background_clouds', -40, 0.1);
  add(`bg_background_fade_${bg}`, undefined, 130, 0.25);

  // Renkli tepe karesi ekranın altına yetmiyor; altını aynı renkle doldur.
  const nearKey = `bg_background_color_${bg}`;
  const nearY = 220;
  const fill = scene.textures.getPixel(128, 255, nearKey)!;
  scene.add
    .rectangle(0, nearY + h - 4, GAME_WIDTH, GAME_HEIGHT, fill.color)
    .setOrigin(0, 0)
    .setScrollFactor(0);
  add(nearKey, undefined, nearY, 0.45);

  return {
    scrollTo(cameraX: number) {
      for (const l of layers) l.sprite.tilePositionX = (cameraX * l.factor) / BG_SCALE;
    },
  };
}

/** Yeraltı/kale: koyu zemin üstünde karartılmış tepe ve mantar siluetleri. */
function createCave(scene: Phaser.Scene): ParallaxBackground {
  const h = 256 * BG_SCALE;
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1e1b2e).setOrigin(0).setScrollFactor(0);
  const layers = [
    { key: 'bg_background_fade_mushrooms', y: 60, tint: 0x2c2742, factor: 0.2 },
    { key: 'bg_background_color_trees', y: 200, tint: 0x3a3356, factor: 0.4 },
  ].map(({ key, y, tint, factor }) => {
    const sprite = scene.add
      .tileSprite(0, y, GAME_WIDTH, h, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setTileScale(BG_SCALE)
      .setTint(tint);
    sprite.tilePositionY = 1;
    return { sprite, factor };
  });
  scene.add.rectangle(0, 200 + h - 4, GAME_WIDTH, GAME_HEIGHT, 0x3a3356).setOrigin(0).setScrollFactor(0);
  return {
    scrollTo(cameraX: number) {
      for (const l of layers) l.sprite.tilePositionX = (cameraX * l.factor) / BG_SCALE;
    },
  };
}
