import Phaser from 'phaser';

/**
 * Tam ekran, tarayıcının kendi Fullscreen API'siyle bütün sayfaya uygulanır. Phaser'ın
 * startFullscreen'i oyun tuvalini başka bir kutuya taşıdığı için kullanılmıyor; sayfa tam ekrana
 * geçince Phaser pencere boyutu değişikliğini görüp oyunu kendisi ölçekler.
 *
 * iPhone Safari bu API'yi desteklemez: düğme orada "Ana Ekrana Ekle" talimatını gösterir
 * (ana ekrandan açılan oyun Safari çubukları olmadan, tam ekran çalışır).
 */
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => void };

const doc = document as FsDocument;
const root = document.documentElement as FsElement;

export function fullscreenSupported() {
  return Boolean(root.requestFullscreen || root.webkitRequestFullscreen);
}

export function isFullscreen() {
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

/** Ana ekrandan uygulama gibi açıldıysa zaten tam ekrandır. */
function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches
  );
}

function isIOS() {
  return /iPhone|iPod/.test(navigator.userAgent);
}

/** Tam ekran düğmesi gösterilsin mi: destekleniyorsa ya da iPhone'da talimat verilecekse. */
export function fullscreenOffered() {
  if (isStandalone()) return false;
  return fullscreenSupported() || isIOS();
}

export function toggleFullscreen() {
  if (isFullscreen()) {
    if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
    else doc.webkitExitFullscreen?.();
    return;
  }
  if (!fullscreenSupported()) {
    showHint('iPhone\'da tam ekran için: Safari\'de Paylaş (⬆︎) → "Ana Ekrana Ekle", sonra oyunu ana ekrandaki ikondan aç.');
    return;
  }
  try {
    if (root.requestFullscreen) {
      root
        .requestFullscreen({ navigationUI: 'hide' })
        .then(lockLandscape)
        .catch(() => showHint('Tarayıcı tam ekrana izin vermedi. F tuşuna ya da düğmeye tekrar bas.'));
    } else {
      root.webkitRequestFullscreen?.();
      lockLandscape();
    }
  } catch {
    showHint('Tarayıcı tam ekrana izin vermedi.');
  }
}

function lockLandscape() {
  // Yalnızca telefonda anlamlı; desteklenmezse sessizce geçer.
  const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  orientation?.lock?.('landscape').catch(() => {});
}

export function fullscreenLabel() {
  return isFullscreen() ? '⛶ Tam ekrandan çık' : '⛶ Tam ekran';
}

/** Tam ekran durumu değişince çağrılır; sahne kapanınca dinlemeyi bırakır. */
export function onFullscreenChange(scene: Phaser.Scene, refresh: () => void) {
  const events = ['fullscreenchange', 'webkitfullscreenchange'];
  for (const e of events) document.addEventListener(e, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const e of events) document.removeEventListener(e, refresh);
  });
}

/**
 * Fare: basınca; dokunmatik: parmak kalkınca. Tarayıcılar tam ekranı ancak böyle bir
 * kullanıcı hareketinin hemen ardından açar.
 */
export function onActivate(obj: Phaser.GameObjects.GameObject, fn: () => void) {
  obj.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (!p.wasTouch) fn();
  });
  obj.on('pointerup', (p: Phaser.Input.Pointer) => {
    if (p.wasTouch) fn();
  });
}

/** "⛶ Tam ekran" düğmesi. Gerek yoksa (ör. ana ekrandan açılmışsa) eklenmez. */
export function addFullscreenButton(scene: Phaser.Scene, x: number, y: number, originX = 1) {
  if (!fullscreenOffered()) return undefined;
  const btn = scene.add
    .text(x, y, fullscreenLabel(), {
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
  onActivate(btn, toggleFullscreen);
  onFullscreenChange(scene, () => btn.setText(fullscreenLabel()));
  return btn;
}

/** F tuşu: her ekranda tam ekranı aç/kapat (editörde F bayrak aracı olduğu için orada değil). */
export function installFullscreenKey(game: Phaser.Game) {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'f' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (game.scene.isActive('Editor')) return;
    toggleFullscreen();
  });
}

let hintTimer: number | undefined;

/** Ekranın altında birkaç saniye görünen kısa bilgi notu. */
function showHint(text: string) {
  let el = document.getElementById('hint');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hint';
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      bottom: '16px',
      transform: 'translateX(-50%)',
      maxWidth: 'min(90vw, 560px)',
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'rgba(17, 24, 39, 0.92)',
      color: '#fff',
      font: '600 16px system-ui, sans-serif',
      textAlign: 'center',
      zIndex: '20',
      pointerEvents: 'none',
    });
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
  window.clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => (el!.style.display = 'none'), 7000);
}
