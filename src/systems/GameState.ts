import Phaser from 'phaser';
import type { Form } from '../entities/Player';

export const START_LIVES = 3;
const COINS_PER_LIFE = 100;

/**
 * Bölümler arası korunan oyun durumu. Değişince 'changed' olayı yayılır (HUD dinler).
 */
class GameStateStore extends Phaser.Events.EventEmitter {
  score = 0;
  coins = 0;
  lives = START_LIVES;
  /** Kalan süre (oyun birimi); GameScene her bölüm başında ayarlar. */
  time = 0;
  /** Oynanan bölüm. */
  levelId = '';
  /** HUD'da gösterilen bölüm adı. */
  levelName = '';
  /** Bölümler arası taşınan form; ölünce küçülür. */
  form: Form = 'small';
  /** Ölünce bu noktadan devam edilir (aynı bölümdeyse). */
  checkpoint: { levelId: string; x: number; bottom: number } | null = null;

  reset() {
    this.score = 0;
    this.coins = 0;
    this.lives = START_LIVES;
    this.form = 'small';
    this.checkpoint = null;
    this.emit('changed');
  }

  addScore(points: number) {
    this.score += points;
    this.emit('changed');
  }

  /** 100 coin = 1 can. Can kazanıldıysa true döner. */
  addCoin(): boolean {
    this.coins++;
    this.score += 200;
    let extraLife = false;
    if (this.coins >= COINS_PER_LIFE) {
      this.coins -= COINS_PER_LIFE;
      this.lives++;
      extraLife = true;
    }
    this.emit('changed');
    return extraLife;
  }

  loseLife() {
    this.lives--;
    this.emit('changed');
  }

  setTime(t: number) {
    this.time = t;
    this.emit('changed');
  }
}

export const GameState = new GameStateStore();
