import Phaser from 'phaser';
import { ATLAS, GAME_WIDTH } from '../config';
import { GameState } from '../systems/GameState';

const DIGIT_SCALE = 0.6;
const DIGIT_STEP = 25;

/** Kenney'nin HUD rakamlarıyla yazılan sayı. */
class DigitText {
  private images: Phaser.GameObjects.Image[] = [];

  constructor(
    private scene: Phaser.Scene,
    private x: number,
    private y: number,
  ) {}

  set(text: string) {
    for (const img of this.images) img.destroy();
    this.images = [...text].map((ch, i) =>
      this.scene.add
        .image(this.x + i * DIGIT_STEP, this.y, ATLAS.tiles, ch === 'x' ? 'hud_character_multiply' : `hud_character_${ch}`)
        .setScale(DIGIT_SCALE)
        .setOrigin(0, 0.5),
    );
  }
}

/** Oyun sahnesinin üstünde paralel çalışan gösterge: can, coin, skor, süre. */
export class HUDScene extends Phaser.Scene {
  private lives!: DigitText;
  private coins!: DigitText;
  private score!: DigitText;
  private timeText!: DigitText;
  private levelText!: Phaser.GameObjects.Text;
  private banner?: Phaser.GameObjects.Text;

  constructor() {
    super('HUD');
  }

  create() {
    const y = 40;
    this.add.image(36, y, ATLAS.tiles, 'hud_player_helmet_green').setScale(0.7);
    this.lives = new DigitText(this, 64, y);
    this.add.image(210, y, ATLAS.tiles, 'hud_coin').setScale(0.7);
    this.coins = new DigitText(this, 238, y);

    const label = (x: number, text: string) =>
      this.add
        .text(x, y, text, { fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff' })
        .setOrigin(1, 0.5)
        .setStroke('#1f2937', 6);
    this.levelText = this.add
      .text(GAME_WIDTH / 2 - 120, y, '', { fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0, 0.5)
      .setStroke('#1f2937', 6);
    label(GAME_WIDTH - 410, 'SKOR');
    this.score = new DigitText(this, GAME_WIDTH - 396, y);
    label(GAME_WIDTH - 108, 'SÜRE');
    this.timeText = new DigitText(this, GAME_WIDTH - 94, y);

    this.banner = this.add
      .text(GAME_WIDTH / 2, 300, '', { fontFamily: 'system-ui, sans-serif', fontSize: '72px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setStroke('#1f2937', 12)
      .setVisible(false);

    const refresh = () => this.refresh();
    GameState.on('changed', refresh);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => GameState.off('changed', refresh));
    this.refresh();
  }

  showBanner(text: string) {
    this.banner?.setText(text).setVisible(true);
  }

  hideBanner() {
    this.banner?.setVisible(false); // HUD ilk karede henüz oluşmamış olabilir
  }

  private refresh() {
    this.lives.set('x' + GameState.lives);
    this.coins.set('x' + String(GameState.coins).padStart(2, '0'));
    this.score.set(String(GameState.score).padStart(6, '0'));
    this.levelText.setText(GameState.levelId ? `DÜNYA ${GameState.levelId}` : '');
    this.timeText.set(String(Math.max(0, GameState.time)).padStart(3, '0'));
  }
}
