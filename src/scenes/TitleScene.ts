import Phaser from 'phaser';
import { ATLAS, GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { playSfx } from '../systems/audio';
import { createParallaxBackground } from '../systems/background';
import { GameState } from '../systems/GameState';
import { Save } from '../systems/Save';
import { MenuPad } from '../systems/Input';
import { Music } from '../systems/Music';
import { Settings } from '../systems/Settings';
import { isTouchDevice } from '../systems/Touch';

const FONT = 'system-ui, sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    if (this.scene.isActive('HUD')) this.scene.stop('HUD');
    if (this.scene.isActive('TouchControls')) this.scene.stop('TouchControls');
    const bg = createParallaxBackground(this, 'hills');
    let scroll = 0;
    this.events.on(Phaser.Scenes.Events.UPDATE, (_t: number, dt: number) => bg.scrollTo((scroll += dt * 0.08)));

    // Zemin şeridi
    for (let x = 0; x < GAME_WIDTH; x += TILE) {
      this.add.image(x + TILE / 2, GAME_HEIGHT - TILE * 1.5, ATLAS.tiles, 'terrain_grass_block_top');
      this.add.image(x + TILE / 2, GAME_HEIGHT - TILE / 2, ATLAS.tiles, 'terrain_grass_block_center');
    }

    const cx = GAME_WIDTH / 2;
    const touch = isTouchDevice();
    this.add
      .text(cx, 190, 'Zıpzıp Macera', { fontFamily: FONT, fontSize: '104px', fontStyle: '900', color: '#facc15' })
      .setOrigin(0.5)
      .setStroke('#1f2937', 18)
      .setShadow(0, 8, '#1f2937', 0, true, true);

    const hero = this.add.image(cx, GAME_HEIGHT - TILE * 2 - 4, ATLAS.characters, 'character_green_front').setOrigin(0.5, 1);
    this.tweens.add({ targets: hero, y: hero.y - 18, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.image(cx - 260, GAME_HEIGHT - TILE * 2, ATLAS.enemies, 'slime_normal_rest').setOrigin(0.5, 1);
    this.add.image(cx + 260, GAME_HEIGHT - TILE * 2, ATLAS.enemies, 'snail_rest').setOrigin(0.5, 1).setFlipX(true);

    const press = this.add
      .text(cx, 360, touch ? 'Başlamak için dokun' : 'Başlamak için Space / Enter', { fontFamily: FONT, fontSize: '36px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setStroke('#1f2937', 8);
    this.tweens.add({ targets: press, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });

    const info = this.add
      .text(cx, 420, this.progressText(), { fontFamily: FONT, fontSize: '22px', color: '#1f2937' })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH - 16, GAME_HEIGHT - 12, (touch ? '' : 'E: bölüm editörü   M: müzik aç/kapat   N: kaydı sıfırla   •   ') + 'Grafik & ses efektleri: Kenney.nl (CC0)', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(1, 1);

    Music.play('title');
    const kb = this.input.keyboard!;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      playSfx(this, 'select', { volume: 0.6 });
      GameState.reset();
      this.scene.start('WorldMap');
    };
    // Fare/dokunma: boş bir yere dokununca başla. Telefonda tam ekran ve yatay kilit dene.
    this.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      if (touch && this.scale.fullscreen.available && !this.scale.isFullscreen) {
        this.scale.startFullscreen();
        const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        orientation.lock?.('landscape').catch(() => {});
      }
      start();
    });
    const musicBtn = this.add
      .text(GAME_WIDTH - 16, 16, '', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#1f2937', padding: { x: 14, y: 10 } })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    const refreshMusicBtn = () => musicBtn.setText(`♪ Müzik: ${Settings.music ? 'Açık' : 'Kapalı'}`);
    refreshMusicBtn();
    const toggleMusic = () => {
      Settings.music = !Settings.music;
      Settings.save();
      Music.refresh('title');
      refreshMusicBtn();
    };
    musicBtn.on('pointerdown', toggleMusic);
    kb.once('keydown-SPACE', start);
    kb.once('keydown-ENTER', start);
    kb.on('keydown-E', () => this.scene.start('Editor'));
    kb.on('keydown-M', toggleMusic);
    const pad = new MenuPad(this);
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      if (pad.poll().has('ok')) start();
    });
    kb.on('keydown-N', () => {
      Save.reset();
      info.setText(this.progressText());
      playSfx(this, 'disappear', { volume: 0.5 });
    });
  }

  private progressText() {
    const save = Save.load();
    const done = Object.keys(save.best).length;
    return done ? `Kayıt: ${done} bölüm tamamlandı` : 'Yeni oyun';
  }
}
