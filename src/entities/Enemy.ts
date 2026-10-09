import Phaser from 'phaser';
import { ATLAS, TILE } from '../config';

/**
 * slime: yürür, ezilir. snail: ezilince kabuk olur, kabuk tekmelenir.
 * bee: yerinde yukarı-aşağı uçar. fly: yatayda gidip gelir. saw: ezilemez, ateşten etkilenmez.
 */
export type EnemyKind = 'slime' | 'snail' | 'bee' | 'fly' | 'saw';

const WALK_SPEED = 90;
const SHELL_SPEED = 620;
const FLY_SPEED = 110;
const SAW_SPEED = 130;
/** Uçan düşmanların ve testerenin gidip geldiği mesafe. */
const PATROL_RANGE = TILE * 3;
const BEE_AMPLITUDE = TILE * 1.6;
/** Kabuktan tekrar çıkma süresi. */
const SHELL_WAKE_MS = 7000;
/** Tekmelenen kabuk, oyuncuya hemen geri çarpmasın. */
const KICK_GRACE_MS = 250;

/** 64x64 düşman karesi içindeki çarpışma kutuları. */
const BODIES: Record<EnemyKind, { w: number; h: number; x: number; y: number }> = {
  slime: { w: 46, h: 32, x: 9, y: 32 },
  snail: { w: 48, h: 38, x: 8, y: 26 },
  bee: { w: 44, h: 36, x: 10, y: 14 },
  fly: { w: 40, h: 40, x: 12, y: 12 },
  saw: { w: 50, h: 50, x: 7, y: 7 },
};

const REST_FRAME: Record<EnemyKind, string> = {
  slime: 'slime_normal_rest',
  snail: 'snail_rest',
  bee: 'bee_rest',
  fly: 'fly_rest',
  saw: 'saw_rest',
};

type State = 'idle' | 'walk' | 'shell' | 'shellMoving' | 'dead';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  readonly kind: EnemyKind;
  state: State = 'idle';
  private dir: 1 | -1 = -1;
  private shellTimer = 0;
  private kickedAt = -Infinity;
  private home: { x: number; y: number };
  private phase = 0;

  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, bottomY: number) {
    super(scene, x, bottomY - TILE / 2, ATLAS.enemies, REST_FRAME[kind]);
    this.kind = kind;
    this.home = { x: this.x, y: this.y };
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const b = BODIES[kind];
    this.body.setSize(b.w, b.h).setOffset(b.x, b.y);
    if (this.flies) this.body.setAllowGravity(false);
    this.setDepth(5);
    // Ekrana girene kadar uyur.
    this.body.enable = false;
  }

  get alive() {
    return this.state !== 'dead';
  }

  /** Yerçekimsiz hareket edenler (yürüme yönünü duvar değil devriye belirler). */
  get flies() {
    return this.kind === 'bee' || this.kind === 'fly' || this.kind === 'saw';
  }

  get stompable() {
    return this.kind !== 'saw';
  }

  /** Ateş topu ve kabuktan etkilenir mi. */
  get vulnerable() {
    return this.kind !== 'saw';
  }

  get isMovingShell() {
    return this.state === 'shellMoving';
  }

  get isHarmlessShell() {
    return this.state === 'shell';
  }

  canHurtPlayer(now: number) {
    if (this.state === 'shell' || this.state === 'dead') return false;
    return !(this.state === 'shellMoving' && now - this.kickedAt < KICK_GRACE_MS);
  }

  /** Kamera yaklaşınca uyanır. */
  activate() {
    if (this.state !== 'idle') return;
    this.state = 'walk';
    this.body.enable = true;
    this.anims.play(`${this.kind}-walk`);
  }

  update(_time: number, deltaMs: number) {
    if (this.state === 'idle' || this.state === 'dead') return;
    if (this.flies) return this.updateFlying(deltaMs);
    const body = this.body;

    if (body.blocked.left || body.touching.left) this.dir = 1;
    else if (body.blocked.right || body.touching.right) this.dir = -1;

    if (this.state === 'walk') body.setVelocityX(this.dir * WALK_SPEED);
    else if (this.state === 'shellMoving') body.setVelocityX(this.dir * SHELL_SPEED);
    else if (this.state === 'shell') {
      body.setVelocityX(0);
      this.shellTimer -= deltaMs;
      // Çıkmak üzereyken yanıp söner.
      this.setAlpha(this.shellTimer < 1500 && Math.floor(this.shellTimer / 100) % 2 ? 0.5 : 1);
      if (this.shellTimer <= 0) this.wakeFromShell();
    }
    // Kenney düşmanları sola bakıyor.
    if (this.state !== 'shell') this.setFlipX(this.dir > 0);
  }

  private updateFlying(deltaMs: number) {
    const body = this.body;
    this.phase += deltaMs / 1000;
    if (this.kind === 'bee') {
      // Yerinde sinüs: hız, istenen konuma göre ayarlanır.
      const targetY = this.home.y + Math.sin(this.phase * 1.8) * BEE_AMPLITUDE;
      body.setVelocity(0, (targetY - this.y) * 8);
      this.setFlipX(false);
      return;
    }
    const speed = this.kind === 'saw' ? SAW_SPEED : FLY_SPEED;
    if (this.x < this.home.x - PATROL_RANGE || body.blocked.left) this.dir = 1;
    else if (this.x > this.home.x + PATROL_RANGE || body.blocked.right) this.dir = -1;
    const bob = this.kind === 'fly' ? (this.home.y + Math.sin(this.phase * 3) * 12 - this.y) * 8 : 0;
    body.setVelocity(this.dir * speed, bob);
    if (this.kind === 'fly') this.setFlipX(this.dir > 0);
  }

  /** Üstüne basıldı. */
  stomp() {
    if (this.kind === 'slime') {
      this.state = 'dead';
      this.anims.stop();
      this.setFrame('slime_normal_flat');
      this.body.enable = false;
      this.scene.time.delayedCall(400, () => this.destroy());
      return;
    }
    if (this.kind === 'bee' || this.kind === 'fly') return this.knockOut(0);
    if (this.state === 'shell') return; // kick() ile ele alınır
    this.enterShell();
  }

  /** Duran kabuğa dokunuldu: oyuncunun ters yönüne fırlar. */
  kick(fromX: number, now: number) {
    this.state = 'shellMoving';
    this.setAlpha(1);
    this.dir = fromX < this.x ? 1 : -1;
    this.kickedAt = now;
  }

  /** Hareketli kabuk, alttan vurulan blok vb. ile ölüm: ters dönüp düşer. */
  knockOut(dirX: number) {
    if (this.state === 'dead' || !this.vulnerable) return;
    this.state = 'dead';
    this.anims.stop();
    this.setFlipY(true);
    this.body.checkCollision.none = true;
    this.body.enable = true;
    this.body.setAllowGravity(true);
    this.body.setVelocity(dirX * 120, -600);
    this.setDepth(20);
  }

  enterShell() {
    this.state = 'shell';
    this.anims.stop();
    this.setFrame('snail_shell');
    this.setFlipX(false);
    this.body.setVelocityX(0);
    this.shellTimer = SHELL_WAKE_MS;
  }

  private wakeFromShell() {
    this.state = 'walk';
    this.setAlpha(1);
    this.anims.play('snail-walk');
  }
}
