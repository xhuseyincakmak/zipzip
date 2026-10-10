import Phaser from 'phaser';
import { isTouchDevice } from './Touch';

/**
 * Tam ekran. Tarayıcılar tam ekranı yalnızca bir kullanıcı hareketinin içinde açar:
 * farede basma anında, dokunmatikte parmak kalkınca, klavyede tuşa basınca. Düğmeler bu yüzden
 * onActivate ile, F tuşu doğrudan DOM olayıyla çalışır. iPhone Safari tam ekran API'sini
 * desteklemez; orada düğme gizlenir.
 */

/** Fare: basınca; dokunmatik: parmak kalkınca. İkisi de tarayıcının "kullanıcı hareketi" sayılır. */
export function onActivate(obj: Phaser.GameObjects.GameObject, fn: () => void) {
  obj.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (!p.wasTouch) fn();
  });
  obj.on('pointerup', (p: Phaser.Input.Pointer) => {
    if (p.wasTouch) fn();
  });
}

export function fullscreenAvailable(game: Phaser.Game) {
  return game.scale.fullscreen.available;
}

export function toggleFullscreen(game: Phaser.Game) {
  const scale = game.scale;
  if (scale.isFullscreen) {
    scale.stopFullscreen();
    return;
  }
  scale.startFullscreen();
  if (isTouchDevice()) {
    // Telefonda yatay kilitlemeyi dene (desteklenmezse sessizce geçer).
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('landscape').catch(() => {});
  }
}

export function fullscreenLabel(game: Phaser.Game) {
  return game.scale.isFullscreen ? '⛶ Tam ekrandan çık' : '⛶ Tam ekran';
}

/** Tam ekran durumu değişince metni günceller; sahne kapanınca dinlemeyi bırakır. */
export function onFullscreenChange(scene: Phaser.Scene, refresh: () => void) {
  const scale = scene.scale;
  scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, refresh);
  scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, refresh);
    scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, refresh);
  });
}

/** Sağ üst köşe tipi bir "⛶ Tam ekran" düğmesi. Tam ekran desteklenmiyorsa hiç eklenmez. */
export function addFullscreenButton(scene: Phaser.Scene, x: number, y: number, originX = 1) {
  if (!fullscreenAvailable(scene.game)) return undefined;
  const btn = scene.add
    .text(x, y, fullscreenLabel(scene.game), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#1f2937',
      padding: { x: 14, y: 10 },
    })
    .setOrigin(originX, 0.5)
    .setDepth(8)
    .setInteractive({ useHandCursor: true });
  onActivate(btn, () => toggleFullscreen(scene.game));
  onFullscreenChange(scene, () => btn.setText(fullscreenLabel(scene.game)));
  return btn;
}

/** F tuşu: her ekranda tam ekranı aç/kapat (editörde F bayrak aracı olduğu için orada değil). */
export function installFullscreenKey(game: Phaser.Game) {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'f' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (game.scene.isActive('Editor')) return;
    toggleFullscreen(game);
  });
}
