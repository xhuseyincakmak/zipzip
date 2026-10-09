import Phaser from 'phaser';
import { ATLAS, TILE } from '../config';

/** grow: kalp (küçük → büyük). fire: kırmızı mücevher (ateş formu). star: yıldız (geçici dokunulmazlık). */
export type ItemKind = 'grow' | 'fire' | 'star';

const FRAMES: Record<ItemKind, string> = { grow: 'heart', fire: 'gem_red', star: 'star' };
const SPEED = 160;
const STAR_HOP = -820;
const EMERGE_MS = 550;

/** Soru bloğundan yükselerek çıkan, sonra yürüyen (yıldız sekerek) güç artırıcı. */
export class Item extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  readonly kind: ItemKind;
  ready = false;
  private dir: 1 | -1 = 1;

  constructor(scene: Phaser.Scene, kind: ItemKind, x: number, blockTop: number) {
    super(scene, x, blockTop + TILE / 2, ATLAS.tiles, FRAMES[kind]);
    this.kind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(44, 44);
    this.body.enable = false;
    // Bloğun arkasından çıkar.
    this.setDepth(1.5);

    scene.tweens.add({
      targets: this,
      y: blockTop - TILE / 2,
      duration: EMERGE_MS,
      ease: 'Linear',
      onComplete: () => this.release(),
    });
  }

  private release() {
    if (!this.active) return;
    this.ready = true;
    this.setDepth(6);
    this.body.enable = true;
    this.body.reset(this.x, this.y);
    if (this.kind === 'fire') return; // mücevher yerinde durur
    this.body.setVelocityX(this.dir * SPEED);
    if (this.kind === 'star') this.body.setVelocityY(STAR_HOP);
  }

  update() {
    if (!this.ready || this.kind === 'fire') return;
    const b = this.body;
    if (b.blocked.left) this.dir = 1;
    else if (b.blocked.right) this.dir = -1;
    b.setVelocityX(this.dir * SPEED);
    if (this.kind === 'star' && b.blocked.down) b.setVelocityY(STAR_HOP);
  }
}
