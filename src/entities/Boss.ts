import Phaser from 'phaser';
import { ATLAS, TILE } from '../config';

const SCALE = 2.6;
/** slime_block karesinde görselin kapladığı alan (x 4-59, y 8-63). */
const BODY = { w: 50, h: 52, x: 7, y: 12 };
const MAX_HP = 3;
const FIRE_DAMAGE = 1 / 3; // 3 ateş topu = 1 basma
const HIT_INVULNERABLE_MS = 1100;

/**
 * Dev Blok Slime: oyuncuya doğru yürür, aralıklarla zıplar.
 * 3 kez üstüne basılınca (ya da 9 ateş topuyla) yenilir; her vuruşta hızlanır.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  hp = MAX_HP;
  dead = false;
  active2 = false;
  private invulnerableMs = 0;
  private jumpTimer = 1500;

  constructor(scene: Phaser.Scene, x: number, bottomY: number) {
    super(scene, x, bottomY - (TILE * SCALE) / 2, ATLAS.enemies, 'slime_block_rest');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(SCALE).setDepth(6);
    this.body.setSize(BODY.w, BODY.h).setOffset(BODY.x, BODY.y);
    this.body.setMaxVelocity(600, 1400);
  }

  get canBeHit() {
    return !this.dead && this.invulnerableMs <= 0;
  }

  /** Oyuncu arenaya girince başlar. */
  wake() {
    if (this.active2) return;
    this.active2 = true;
    this.anims.play('boss-walk');
  }

  update(deltaMs: number, playerX: number) {
    if (!this.active2 || this.dead) return;
    const body = this.body;
    const speed = 110 + (MAX_HP - this.hp) * 70;
    const dir = playerX < this.x ? -1 : 1;
    const onGround = body.blocked.down;

    if (this.invulnerableMs > 0) {
      this.invulnerableMs -= deltaMs;
      this.setAlpha(Math.floor(this.invulnerableMs / 90) % 2 ? 0.4 : 1);
      if (this.invulnerableMs <= 0) this.setAlpha(1);
    }

    if (onGround) {
      body.setVelocityX(dir * speed);
      this.jumpTimer -= deltaMs;
      if (this.jumpTimer <= 0) {
        body.setVelocityY(-900 - (MAX_HP - this.hp) * 120);
        this.jumpTimer = Phaser.Math.Between(1300, 2400) - (MAX_HP - this.hp) * 250;
      }
    }
    this.setFlipX(dir > 0);
    if (!onGround) {
      this.anims.stop();
      this.setFrame('slime_block_jump');
    } else if (!this.anims.isPlaying) {
      this.anims.play('boss-walk');
    }
  }

  /** Üstüne basıldı (1) veya ateş topu (1/3). Yenildiyse true. */
  damage(amount: number): boolean {
    if (!this.canBeHit) return false;
    this.wake();
    this.hp -= amount;
    this.invulnerableMs = amount >= 1 ? HIT_INVULNERABLE_MS : 150;
    if (this.hp > 0.001) return false;
    this.dead = true;
    this.anims.stop();
    this.setFrame('slime_block_rest').setFlipY(true).setAlpha(1);
    this.body.checkCollision.none = true;
    this.body.setVelocity(0, -700);
    return true;
  }

  static readonly fireDamage = FIRE_DAMAGE;
}
