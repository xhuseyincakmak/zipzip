/**
 * Dokunmatik ekran desteği. Dokunmatik cihazda (ya da ?touch=1 ile) ekrana sanal tuşlar çizilir;
 * TouchControlsScene her karede bu durumu günceller, InputController okur.
 */
export const isTouchDevice = (): boolean => {
  if (new URLSearchParams(location.search).get('touch') === '1') return true;
  return window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
};

/** Sanal tuşların o anki (basılı tutulma) durumu. Yeni basılma kenarları InputController'da hesaplanır. */
export const TouchState = {
  left: false,
  right: false,
  jump: false,
  run: false,
  pause: false,

  reset() {
    this.left = this.right = this.jump = this.run = this.pause = false;
  },
};
