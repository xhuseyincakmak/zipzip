import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PHYS } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { TitleScene } from './scenes/TitleScene';
import { EditorScene } from './scenes/EditorScene';
import { PauseScene } from './scenes/PauseScene';
import { TouchControlsScene } from './scenes/TouchControlsScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { GameState } from './systems/GameState';
import { Music } from './systems/Music';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#111111',
  // Karo kenarlarında ince çizgi (texture bleeding) oluşmasını önler.
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: PHYS.gravity }, tileBias: 32, debug: false },
  },
  // Dokunmatikte aynı anda birkaç parmak (ör. sağa yürürken zıplamak).
  input: { gamepad: true, activePointers: 4 },
  scene: [BootScene, TitleScene, WorldMapScene, GameScene, HUDScene, TouchControlsScene, PauseScene, EditorScene],
});

// Geliştirme sırasında konsoldan erişim için.
if (import.meta.env.DEV) Object.assign(window, { __game: game, __state: GameState, __music: Music });
