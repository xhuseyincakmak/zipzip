import Phaser from 'phaser';
import { TouchState } from './Touch';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  run: boolean;
  jumpHeld: boolean;
  /** Bu karede yeni basıldı mı. */
  jumpPressed: boolean;
  /** Koşma tuşu bu karede yeni basıldı (ateş formunda ateş topu atar). */
  actionPressed: boolean;
  /** Esc / P / gamepad Start. */
  pausePressed: boolean;
}

const K = Phaser.Input.Keyboard.KeyCodes;
const STICK_DEADZONE = 0.4;

/** Standart gamepad düzeni (Xbox/PlayStation): 0=A/✕, 1=B/○, 2=X/□, 9=Start, 12-15=yön tuşları. */
const PAD = { a: 0, b: 1, x: 2, start: 9, up: 12, down: 13, left: 14, right: 15 } as const;

/**
 * Klavye: ok tuşları / WASD, zıplama Space-Z-Yukarı-W, koşma Shift-X, duraklat Esc-P.
 * Gamepad: sol çubuk / yön tuşları, A zıpla, X veya B koş/ateş, Start duraklat.
 * Dokunmatik: TouchControlsScene'in ekrandaki tuşları (TouchState).
 */
export class InputController {
  private left: Phaser.Input.Keyboard.Key[];
  private right: Phaser.Input.Keyboard.Key[];
  private up: Phaser.Input.Keyboard.Key[];
  private down: Phaser.Input.Keyboard.Key[];
  private run: Phaser.Input.Keyboard.Key[];
  private jump: Phaser.Input.Keyboard.Key[];
  private pause: Phaser.Input.Keyboard.Key[];
  private prevPad = new Set<number>();
  private prevTouch = { jump: false, run: false, pause: false };

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    const keys = (...codes: number[]) => codes.map((c) => kb.addKey(c));
    this.left = keys(K.LEFT, K.A);
    this.right = keys(K.RIGHT, K.D);
    this.up = keys(K.UP, K.W);
    this.down = keys(K.DOWN, K.S);
    this.run = keys(K.SHIFT, K.X);
    this.jump = keys(K.SPACE, K.Z, K.UP, K.W);
    this.pause = keys(K.ESC, K.P);
  }

  /** Her karede bir kez çağrılmalı (JustDown durumu okununca sıfırlanır). */
  read(): InputState {
    const any = (ks: Phaser.Input.Keyboard.Key[]) => ks.some((k) => k.isDown);
    const justDown = (ks: Phaser.Input.Keyboard.Key[]) => ks.some((k) => Phaser.Input.Keyboard.JustDown(k));
    const pad = this.readPad();
    const t = TouchState;
    const prev = this.prevTouch;
    const touch = {
      jumpPressed: t.jump && !prev.jump,
      actionPressed: t.run && !prev.run,
      pausePressed: t.pause && !prev.pause,
    };
    this.prevTouch = { jump: t.jump, run: t.run, pause: t.pause };
    return {
      left: any(this.left) || pad.left || t.left,
      right: any(this.right) || pad.right || t.right,
      up: any(this.up) || pad.up,
      down: any(this.down) || pad.down,
      run: any(this.run) || pad.held(PAD.x) || pad.held(PAD.b) || t.run,
      jumpHeld: any(this.jump) || pad.held(PAD.a) || t.jump,
      jumpPressed: justDown(this.jump) || pad.pressed(PAD.a) || touch.jumpPressed,
      actionPressed: justDown(this.run) || pad.pressed(PAD.x) || pad.pressed(PAD.b) || touch.actionPressed,
      pausePressed: justDown(this.pause) || pad.pressed(PAD.start) || touch.pausePressed,
    };
  }

  private readPad() {
    const gp = this.scene.input.gamepad;
    const pad = gp && gp.total > 0 ? gp.getPad(0) : undefined;
    const down = new Set<number>();
    if (pad) pad.buttons.forEach((b, i) => b.pressed && down.add(i));
    const prev = this.prevPad;
    this.prevPad = down;
    const sx = pad?.leftStick.x ?? 0;
    const sy = pad?.leftStick.y ?? 0;
    return {
      left: down.has(PAD.left) || sx < -STICK_DEADZONE,
      right: down.has(PAD.right) || sx > STICK_DEADZONE,
      up: down.has(PAD.up) || sy < -STICK_DEADZONE,
      down: down.has(PAD.down) || sy > STICK_DEADZONE,
      held: (i: number) => down.has(i),
      pressed: (i: number) => down.has(i) && !prev.has(i),
    };
  }
}

/**
 * Menüler için basit yön/onay okuyucu (klavye olaylarına ek olarak gamepad).
 * Her karede poll() çağrılır; yeni basılan yönleri döndürür.
 */
export class MenuPad {
  private prev = new Set<string>();

  constructor(private scene: Phaser.Scene) {}

  poll(): Set<'up' | 'down' | 'left' | 'right' | 'ok' | 'back'> {
    const gp = this.scene.input.gamepad;
    const pad = gp && gp.total > 0 ? gp.getPad(0) : undefined;
    const now = new Set<string>();
    if (pad) {
      const b = (i: number) => pad.buttons[i]?.pressed;
      if (b(PAD.up) || pad.leftStick.y < -0.6) now.add('up');
      if (b(PAD.down) || pad.leftStick.y > 0.6) now.add('down');
      if (b(PAD.left) || pad.leftStick.x < -0.6) now.add('left');
      if (b(PAD.right) || pad.leftStick.x > 0.6) now.add('right');
      if (b(PAD.a) || b(PAD.start)) now.add('ok');
      if (b(PAD.b)) now.add('back');
    }
    const fresh = new Set([...now].filter((k) => !this.prev.has(k)));
    this.prev = now;
    return fresh as Set<'up' | 'down' | 'left' | 'right' | 'ok' | 'back'>;
  }
}
