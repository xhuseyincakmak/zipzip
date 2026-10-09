import Phaser from 'phaser';
import { ATLAS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Music } from '../systems/Music';

const KENNEY = 'assets/kenney';
const SFX = ['jump', 'jump-high', 'coin', 'bump', 'hurt', 'disappear', 'magic', 'select', 'throw', 'gem'];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2, 0, 16, 0x4ade80).setOrigin(0, 0.5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 404, 20).setStrokeStyle(2, 0xffffff);
    this.load.on('progress', (p: number) => (bar.width = 400 * p));

    for (const key of Object.values(ATLAS)) {
      this.load.atlasXML(key, `${KENNEY}/spritesheet-${key}-default.png`, `${KENNEY}/spritesheet-${key}-default.xml`);
    }
    // Safari ogg çalmayabilir; Phaser tarayıcının desteklediği ilk formatı seçer.
    for (const name of SFX) {
      this.load.audio(name, [`${KENNEY}/sounds/sfx_${name}.ogg`, `${KENNEY}/sounds/sfx_${name}.m4a`]);
    }
  }

  create() {
    this.createAnimations();
    // Partiküller için küçük beyaz nokta
    this.make.graphics({}, false).fillStyle(0xffffff).fillCircle(6, 6, 6).generateTexture('dot', 12, 12).destroy();
    Music.init(this.game);
    this.createTransparentBackgrounds();
    // Geliştirme kolaylığı: ?level=1-3 ile doğrudan bölüm açılır.
    const level = new URLSearchParams(location.search).get('level');
    if (level) this.scene.start('Game', { levelId: level });
    else this.scene.start('Title');
  }

  /**
   * Kenney arka plan karelerinde tepelerin üstü opak beyaz; katmanları üst üste
   * koyabilmek (paralaks) için beyazı şeffaf yapıp "bg_<kare adı>" olarak kaydeder.
   */
  private createTransparentBackgrounds() {
    const tex = this.textures.get(ATLAS.backgrounds);
    const src = tex.getSourceImage() as HTMLImageElement;
    const names = tex.getFrameNames().filter((n) => /^background_(color|fade)_/.test(n));
    for (const name of names) {
      const f = tex.get(name);
      const canvas = this.textures.createCanvas(`bg_${name}`, f.cutWidth, f.cutHeight)!;
      const ctx = canvas.getContext();
      ctx.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
      const img = ctx.getImageData(0, 0, f.cutWidth, f.cutHeight);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] >= 250 && d[i + 1] >= 250 && d[i + 2] >= 250) d[i + 3] = 0;
      }
      ctx.putImageData(img, 0, 0);
      canvas.refresh();
    }
  }

  private createAnimations() {
    const loop = (key: string, atlas: string, frames: string[], frameRate: number) =>
      this.anims.create({ key, frames: frames.map((frame) => ({ key: atlas, frame })), frameRate, repeat: -1 });

    for (const color of ['green', 'yellow']) {
      loop(`player-walk-${color}`, ATLAS.characters, [`character_${color}_walk_a`, `character_${color}_walk_b`], 8);
    }
    loop('flag-wave', ATLAS.tiles, ['flag_green_a', 'flag_green_b'], 4);
    loop('slime-walk', ATLAS.enemies, ['slime_normal_walk_a', 'slime_normal_walk_b'], 5);
    loop('snail-walk', ATLAS.enemies, ['snail_walk_a', 'snail_walk_b'], 4);
    loop('coin-spin', ATLAS.tiles, ['coin_gold', 'coin_gold_side'], 4);
    loop('bee-walk', ATLAS.enemies, ['bee_a', 'bee_b'], 10);
    loop('fly-walk', ATLAS.enemies, ['fly_a', 'fly_b'], 10);
    loop('saw-walk', ATLAS.enemies, ['saw_a', 'saw_b'], 12);
    loop('boss-walk', ATLAS.enemies, ['slime_block_walk_a', 'slime_block_walk_b'], 4);
  }
}
