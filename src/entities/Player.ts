import Phaser from 'phaser';
import { ATLAS, PHYS } from '../config';
import type { InputState } from '../systems/Input';
import { playSfx } from '../systems/audio';

/** small: tek vuruşta ölür. big: tuğla kırar, vurulunca küçülür. fire: big + ateş topu atar. */
export type Form = 'small' | 'big' | 'fire';

const SCALE: Record<Form, number> = { small: 0.62, big: 0.95, fire: 0.95 };
const COLOR: Record<Form, string> = { small: 'green', big: 'green', fire: 'yellow' };

/**
 * Çarpışma kutusu, 128x128 karakter karesinin içinde (ölçeklenmemiş piksel).
 * Görsel 81x97 (x 23-104, y 31-127); kutu yanlardan biraz dar tutuldu ki kenarlara takılmasın.
 * Arcade fiziği kutuyu sprite ölçeğiyle birlikte büyütür.
 */
const BODY = { width: 60, height: 92, offsetX: 34, offsetY: 36 };

const HURT_INVULNERABLE_MS = 2000;
export const STAR_MS = 10000;

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private coyoteMs = 0;
  private jumpBufferMs = 0;
  private facing: 1 | -1 = 1;
  private jumpHeld = false;

  form: Form = 'small';
  dead = false;
  /** true iken sahne oyuncuyu yönetir (büyüme animasyonu, bayrak inişi...). */
  frozen = false;
  invulnerableMs = 0;
  starMs = 0;
  /** Yere değmeden art arda ezilen düşman sayısı (puan katlanır). */
  stompChain = 0;
  /** Ateş formunda koşma tuşuna basılınca çağrılır. */
  onFire?: () => void;
  /** Yüksekten yere inince (toz efekti için). */
  onLand?: () => void;
  private wasOnGround = true;
  private lastVy = 0;

  constructor(scene: Phaser.Scene, x: number, bottomY: number, form: Form = 'small') {
    super(scene, x, bottomY, ATLAS.characters, 'character_green_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.body.setSize(BODY.width, BODY.height).setOffset(BODY.offsetX, BODY.offsetY);
    // Zıplama hızı maxFall'dan büyük olduğu için düşüş hızını elle sınırlıyoruz.
    this.body.setMaxVelocity(PHYS.runSpeed + 50, 2000);
    this.form = form;
    this.setScale(SCALE[form]);
    this.setFrame(this.frameName('idle'));
    this.placeAt(x, bottomY);
  }

  get facingDir() {
    return this.facing;
  }

  get big() {
    return this.form !== 'small';
  }

  get hasStar() {
    return this.starMs > 0;
  }

  /** Ayaklar verilen y'ye gelecek şekilde konumlar ve hareketi sıfırlar. */
  placeAt(x: number, bottomY: number) {
    const bodyBottomFromCenter = (BODY.offsetY + BODY.height - this.height / 2) * this.scaleY;
    this.body.reset(x, bottomY - bodyBottomFromCenter);
  }

  /** Formu değiştirir; ayakların yeri ve hız korunur. */
  setForm(form: Form) {
    const { x, y } = this.body.velocity;
    const bottom = this.body.bottom;
    this.form = form;
    this.setScale(SCALE[form]);
    this.placeAt(this.x, bottom);
    this.body.setVelocity(x, y);
    this.setFrame(this.frameName('idle'));
  }

  /** Büyüme/küçülme sırasında yanıp sönen ara görüntü. */
  showFormPreview(form: Form) {
    const bottom = this.body.bottom;
    this.setScale(SCALE[form]);
    this.anims.stop();
    this.setFrame(`character_${COLOR[form]}_idle`);
    const bodyBottomFromCenter = (BODY.offsetY + BODY.height - this.height / 2) * this.scaleY;
    this.y = bottom - bodyBottomFromCenter;
  }

  /** Düşmana basınca sekme; zıplama tuşu basılıysa daha yükseğe. */
  bounce() {
    this.body.setVelocityY(this.jumpHeld ? -PHYS.jumpVelocity * 0.95 : -PHYS.jumpVelocity * 0.55);
    this.coyoteMs = 0;
  }

  /** Ölüm pozu: fizik dışı, sahne animasyonu oynatır. */
  setDeadPose() {
    this.dead = true;
    this.anims.stop();
    this.clearTint().setAlpha(1);
    this.setFrame(this.frameName('hit'));
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.setDepth(50);
  }

  startInvulnerable() {
    this.invulnerableMs = HURT_INVULNERABLE_MS;
  }

  startStar() {
    this.starMs = STAR_MS;
  }

  update(input: InputState, deltaMs: number) {
    if (this.dead || this.frozen) return;
    this.updateTimers(deltaMs);

    const dt = deltaMs / 1000;
    const body = this.body;
    const onGround = body.blocked.down || body.touching.down;
    this.jumpHeld = input.jumpHeld;
    if (onGround) this.stompChain = 0;
    if (onGround && !this.wasOnGround && this.lastVy > 650) this.onLand?.();
    this.wasOnGround = onGround;
    this.lastVy = body.velocity.y;

    this.coyoteMs = onGround ? PHYS.coyoteMs : this.coyoteMs - deltaMs;
    this.jumpBufferMs = input.jumpPressed ? PHYS.jumpBufferMs : this.jumpBufferMs - deltaMs;

    // --- Yatay hareket ---
    const ducking = onGround && input.down;
    const dir = ducking ? 0 : (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let vx = body.velocity.x;

    if (dir !== 0) {
      const maxSpeed = input.run ? PHYS.runSpeed : PHYS.walkSpeed;
      const turning = vx !== 0 && Math.sign(vx) !== dir;
      let accel: number;
      if (!onGround) accel = PHYS.airAccel;
      else if (turning) accel = PHYS.turnDecel;
      else if (Math.abs(vx) > maxSpeed) accel = PHYS.groundDecel; // koşu bırakıldı, yavaşla
      else if (Math.abs(vx) > PHYS.walkSpeed) accel = PHYS.runAccel;
      else accel = PHYS.groundAccel;
      vx = approach(vx, dir * maxSpeed, accel * dt);
      this.facing = dir as 1 | -1;
    } else {
      vx = approach(vx, 0, (onGround ? PHYS.groundDecel : PHYS.airDecel) * dt);
    }
    body.setVelocityX(vx);

    // --- Zıplama ---
    if (this.jumpBufferMs > 0 && this.coyoteMs > 0) {
      const runRatio = Math.min(1, Math.abs(vx) / PHYS.runSpeed);
      body.setVelocityY(-(PHYS.jumpVelocity + PHYS.runJumpBonus * runRatio));
      this.jumpBufferMs = 0;
      this.coyoteMs = 0;
      playSfx(this.scene, this.big ? 'jump-high' : 'jump', { volume: 0.5 });
    }

    // Değişken zıplama yüksekliği: tuş bırakılınca yükseliş kesilir, düşüş biraz hızlıdır.
    const vy = body.velocity.y;
    let gravityMul = 1;
    if (vy < 0 && !input.jumpHeld) gravityMul = PHYS.jumpCutGravity;
    else if (vy > 0) gravityMul = PHYS.fallGravity;
    body.setGravityY(PHYS.gravity * (gravityMul - 1));
    if (vy > PHYS.maxFall) body.setVelocityY(PHYS.maxFall);

    if (input.actionPressed && this.form === 'fire' && !ducking) this.onFire?.();

    this.updateAnimation(onGround, ducking, vx);
  }

  private updateTimers(deltaMs: number) {
    if (this.invulnerableMs > 0) {
      this.invulnerableMs -= deltaMs;
      this.setAlpha(this.invulnerableMs > 0 && Math.floor(this.invulnerableMs / 80) % 2 ? 0.3 : 1);
    }
    if (this.starMs > 0) {
      this.starMs -= deltaMs;
      // Yıldızlıyken renk döngüsü; son 2 saniyede yavaşlar.
      const speed = this.starMs > 2000 ? 60 : 160;
      const hue = (Math.floor(this.scene.time.now / speed) % 6) / 6;
      if (this.starMs > 0) this.setTint(Phaser.Display.Color.HSVToRGB(hue, 0.5, 1).color);
      else this.clearTint();
    }
  }

  private updateAnimation(onGround: boolean, ducking: boolean, vx: number) {
    this.setFlipX(this.facing < 0);
    if (!onGround) return this.setPose('jump');
    if (ducking) return this.setPose('duck');
    if (Math.abs(vx) > 15) {
      this.anims.play(`player-walk-${COLOR[this.form]}`, true);
      this.anims.timeScale = Phaser.Math.Clamp(Math.abs(vx) / PHYS.walkSpeed, 0.6, 2);
      return;
    }
    this.setPose('idle');
  }

  setPose(pose: string) {
    this.anims.stop();
    this.setFrame(this.frameName(pose));
  }

  private frameName(pose: string) {
    return `character_${COLOR[this.form]}_${pose}`;
  }
}

function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target);
}
