import Phaser from 'phaser';
import { Settings } from './Settings';

/** Ses efektleri kapalıysa ya da dosya yüklenemediyse (tarayıcı formatı desteklemiyorsa) sessizce geçer. */
export function playSfx(scene: Phaser.Scene, key: string, config?: Phaser.Types.Sound.SoundConfig) {
  if (Settings.sfx && scene.cache.audio.exists(key)) scene.sound.play(key, config);
}
