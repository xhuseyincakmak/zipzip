import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { TouchState } from '../systems/Touch';

type ButtonKey = 'left' | 'right' | 'jump' | 'run' | 'pause';

interface Button {
  key: ButtonKey;
  x: number;
  y: number;
  r: number;
  circle: Phaser.GameObjects.Arc;
}

const FONT = 'system-ui, sans-serif';
/** Parmak düğmenin biraz dışında kalsa da sayılsın. */
const HIT_SLOP = 1.3;
const IDLE_ALPHA = 0.28;
const PRESSED_ALPHA = 0.6;

/**
 * Oyun sahnesinin üstünde çalışan sanal tuşlar: sol altta yön, sağ altta zıpla ve koş/ateş,
 * sağ üstte duraklat. Birden fazla parmak aynı anda kullanılabilir (ör. sağa koşarken zıplamak).
 */
export class TouchControlsScene extends Phaser.Scene {
  private buttons: Button[] = [];

  constructor() {
    super('TouchControls');
  }

  create() {
    TouchState.reset();
    // Tuşlar zemin satırlarının üstünde durur; karakter genelde bunların hemen üstündedir.
    const by = GAME_HEIGHT - 92;
    this.buttons = [
      this.button('left', 110, by, 72, '◀'),
      this.button('right', 280, by, 72, '▶'),
      this.button('run', GAME_WIDTH - 290, by - 6, 60, 'B', 'koş / ateş'),
      this.button('jump', GAME_WIDTH - 120, by - 40, 80, 'A', 'zıpla'),
      this.button('pause', GAME_WIDTH - 52, 112, 38, 'II'),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => TouchState.reset());
  }

  private button(key: ButtonKey, x: number, y: number, r: number, label: string, caption?: string): Button {
    const circle = this.add.circle(x, y, r, 0xffffff, IDLE_ALPHA).setStrokeStyle(4, 0x1f2937, 0.5);
    this.add
      .text(x, y, label, { fontFamily: FONT, fontSize: `${Math.round(r * 0.7)}px`, fontStyle: 'bold', color: '#1f2937' })
      .setOrigin(0.5)
      .setAlpha(0.8);
    if (caption) {
      this.add
        .text(x, y - r - 16, caption, { fontFamily: FONT, fontSize: '18px', color: '#ffffff' })
        .setOrigin(0.5)
        .setStroke('#1f2937', 4)
        .setAlpha(0.7);
    }
    return { key, x, y, r, circle };
  }

  update() {
    const pressed = new Set<ButtonKey>();
    for (const p of this.input.manager.pointers) {
      if (!p?.isDown) continue;
      for (const b of this.buttons) {
        if (Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) <= b.r * HIT_SLOP) pressed.add(b.key);
      }
    }
    for (const b of this.buttons) {
      const on = pressed.has(b.key);
      TouchState[b.key] = on;
      b.circle.setFillStyle(0xffffff, on ? PRESSED_ALPHA : IDLE_ALPHA);
    }
  }
}
