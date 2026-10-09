import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { playSfx } from '../systems/audio';
import { MenuPad } from '../systems/Input';
import { Music } from '../systems/Music';
import { Settings } from '../systems/Settings';

const FONT = 'system-ui, sans-serif';

interface PauseData {
  /** Oyun sahnesine geri bildirilen seçim. */
  onChoice: (choice: 'resume' | 'restart' | 'map') => void;
}

/** Esc / Start ile açılan duraklatma menüsü; oyun sahnesi bu sırada durur. */
export class PauseScene extends Phaser.Scene {
  private items: { label: () => string; action: () => void }[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private index = 0;
  private pad!: MenuPad;
  private onChoice!: PauseData['onChoice'];

  constructor() {
    super('Pause');
  }

  init(data: PauseData) {
    this.onChoice = data.onChoice;
    this.index = 0;
  }

  create() {
    this.pad = new MenuPad(this);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x111827, 0.7).setOrigin(0);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 440, 0xffffff, 0.95)
      .setStrokeStyle(6, 0x1f2937);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, 'DURAKLATILDI', {
        fontFamily: FONT,
        fontSize: '44px',
        fontStyle: '900',
        color: '#1f2937',
      })
      .setOrigin(0.5);

    const close = (choice: 'resume' | 'restart' | 'map') => {
      playSfx(this, 'select', { volume: 0.5 });
      this.scene.stop();
      this.onChoice(choice);
    };
    this.items = [
      { label: () => 'Devam et', action: () => close('resume') },
      { label: () => 'Bölümü yeniden başlat', action: () => close('restart') },
      { label: () => 'Haritaya dön', action: () => close('map') },
      {
        label: () => `Müzik: ${Settings.music ? 'Açık' : 'Kapalı'}`,
        action: () => {
          Settings.music = !Settings.music;
          Settings.save();
          if (!Settings.music) Music.stop();
        },
      },
      {
        label: () => `Ses efektleri: ${Settings.sfx ? 'Açık' : 'Kapalı'}`,
        action: () => {
          Settings.sfx = !Settings.sfx;
          Settings.save();
        },
      },
    ];
    this.texts = this.items.map((_, i) =>
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90 + i * 62, '', { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold' })
        .setOrigin(0.5),
    );
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 190, '↑ ↓ seç   Enter / Space onayla   Esc devam', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#6b7280',
      })
      .setOrigin(0.5);
    this.render();

    const kb = this.input.keyboard!;
    const move = (d: number) => {
      this.index = (this.index + d + this.items.length) % this.items.length;
      playSfx(this, 'select', { volume: 0.3 });
      this.render();
    };
    const choose = () => {
      this.items[this.index].action();
      if (this.scene.isActive()) this.render();
    };
    kb.on('keydown-UP', () => move(-1));
    kb.on('keydown-W', () => move(-1));
    kb.on('keydown-DOWN', () => move(1));
    kb.on('keydown-S', () => move(1));
    kb.on('keydown-ENTER', choose);
    kb.on('keydown-SPACE', choose);
    kb.on('keydown-ESC', () => close('resume'));
    kb.on('keydown-P', () => close('resume'));
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      const p = this.pad.poll();
      if (p.has('up')) move(-1);
      if (p.has('down')) move(1);
      if (p.has('ok')) choose();
      if (p.has('back')) close('resume');
    });
  }

  private render() {
    this.texts.forEach((t, i) => {
      const selected = i === this.index;
      t.setText((selected ? '▶ ' : '') + this.items[i].label());
      t.setColor(selected ? '#16a34a' : '#374151');
    });
  }
}
