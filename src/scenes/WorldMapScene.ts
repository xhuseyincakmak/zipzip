import Phaser from 'phaser';
import { ATLAS, GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { getLevel } from '../levels';
import { LEVEL_ORDER, worldOf, WORLDS } from '../levels/worlds';
import { playSfx } from '../systems/audio';
import { createParallaxBackground } from '../systems/background';
import { GameState } from '../systems/GameState';
import { Save, type SaveData } from '../systems/Save';
import { MenuPad } from '../systems/Input';
import { Music } from '../systems/Music';

const FONT = 'system-ui, sans-serif';
const NODE_Y = 470;

/** Dünya haritası: bölümler bir yol üzerinde düğüm; ← → seç, Space/Enter oyna. */
export class WorldMapScene extends Phaser.Scene {
  private save!: SaveData;
  private selected = 0;
  private marker!: Phaser.GameObjects.Image;
  private nodes: { id: string; x: number }[] = [];
  private title!: Phaser.GameObjects.Text;
  private detail!: Phaser.GameObjects.Text;
  private shownWorld = -1;
  private worldLayer?: Phaser.GameObjects.Container;

  constructor() {
    super('WorldMap');
  }

  init(data: { focus?: string }) {
    this.save = Save.load();
    const focus = data.focus && this.save.unlocked.includes(data.focus) ? data.focus : this.lastUnlocked();
    this.selected = Math.max(0, LEVEL_ORDER.indexOf(focus));
    this.shownWorld = -1;
  }

  create() {
    if (this.scene.isActive('HUD')) this.scene.stop('HUD');
    createParallaxBackground(this, 'hills').scrollTo(0);
    for (let x = 0; x < GAME_WIDTH; x += TILE) {
      this.add.image(x + TILE / 2, GAME_HEIGHT - TILE * 1.5, ATLAS.tiles, 'terrain_grass_block_top');
      this.add.image(x + TILE / 2, GAME_HEIGHT - TILE / 2, ATLAS.tiles, 'terrain_grass_block_center');
    }

    const panel = this.add.rectangle(GAME_WIDTH / 2, 120, 900, 150, 0xffffff, 0.82).setStrokeStyle(4, 0x1f2937);
    panel.setDepth(5);
    this.title = this.add
      .text(GAME_WIDTH / 2, 85, '', { fontFamily: FONT, fontSize: '44px', fontStyle: '900', color: '#1f2937' })
      .setOrigin(0.5)
      .setDepth(6);
    this.detail = this.add
      .text(GAME_WIDTH / 2, 150, '', { fontFamily: FONT, fontSize: '26px', color: '#374151', align: 'center' })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '← → seç    Space / Enter oyna    Esc başlık ekranı', {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#1f2937', 6)
      .setDepth(6);

    this.add.image(28, 28, ATLAS.tiles, 'hud_player_helmet_green').setScale(0.6).setDepth(6);
    this.add
      .text(52, 28, `× ${GameState.lives}    SKOR ${String(GameState.score).padStart(6, '0')}`, {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5)
      .setStroke('#1f2937', 6)
      .setDepth(6);

    this.marker = this.add.image(0, NODE_Y - 44, ATLAS.characters, 'character_green_front').setScale(0.55).setDepth(10);
    this.tweens.add({ targets: this.marker, y: '-=10', duration: 350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.refresh(false);

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-SPACE', () => this.play());
    kb.on('keydown-ENTER', () => this.play());
    kb.on('keydown-ESC', () => this.scene.start('Title'));
    Music.play('overworld');
    const pad = new MenuPad(this);
    this.events.on(Phaser.Scenes.Events.UPDATE, () => {
      const p = pad.poll();
      if (p.has('left')) this.move(-1);
      if (p.has('right')) this.move(1);
      if (p.has('ok')) this.play();
      if (p.has('back')) this.scene.start('Title');
    });
  }

  private move(dir: number) {
    const next = this.selected + dir;
    if (next < 0 || next >= LEVEL_ORDER.length) return;
    if (!this.save.unlocked.includes(LEVEL_ORDER[next])) {
      playSfx(this, 'bump', { volume: 0.4 });
      return;
    }
    this.selected = next;
    playSfx(this, 'select', { volume: 0.4 });
    this.refresh(true);
  }

  private play() {
    const id = LEVEL_ORDER[this.selected];
    playSfx(this, 'select', { volume: 0.6 });
    GameState.checkpoint = null;
    this.scene.start('Game', { levelId: id });
  }

  /** Seçili bölümün dünyasını çizer (değiştiyse) ve işaretçiyi taşır. */
  private refresh(animate: boolean) {
    const id = LEVEL_ORDER[this.selected];
    const world = worldOf(id)!;
    const worldIndex = WORLDS.indexOf(world);
    if (worldIndex !== this.shownWorld) {
      this.drawWorld(worldIndex);
      animate = false;
    }

    const node = this.nodes.find((n) => n.id === id)!;
    if (animate) this.tweens.add({ targets: this.marker, x: node.x, duration: 220, ease: 'Quad.easeOut' });
    else this.marker.x = node.x;

    const level = getLevel(id);
    const best = this.save.best[id];
    this.title.setText(`${world.name} — ${id}`);
    this.detail.setText(`${level.name}\n${best !== undefined ? `En iyi skor: ${best}` : 'Henüz bitirilmedi'}`);
  }

  private drawWorld(worldIndex: number) {
    this.worldLayer?.destroy();
    this.shownWorld = worldIndex;
    const world = WORLDS[worldIndex];
    const layer = this.add.container(0, 0).setDepth(4);
    this.worldLayer = layer;

    const gap = Math.min(260, (GAME_WIDTH - 300) / Math.max(1, world.levels.length - 1));
    const startX = GAME_WIDTH / 2 - (gap * (world.levels.length - 1)) / 2;
    this.nodes = world.levels.map((id, i) => ({ id, x: startX + i * gap }));

    // Yol (noktalı)
    const path = this.add.graphics();
    path.fillStyle(0xfef3c7);
    for (let x = this.nodes[0].x; x <= this.nodes[this.nodes.length - 1].x; x += 22) path.fillCircle(x, NODE_Y, 6);
    layer.add(path);

    for (const n of this.nodes) {
      const unlocked = this.save.unlocked.includes(n.id);
      const done = this.save.best[n.id] !== undefined;
      const color = done ? 0x22c55e : unlocked ? 0xfacc15 : 0x9ca3af;
      layer.add(this.add.circle(n.x, NODE_Y, 34, color).setStrokeStyle(6, 0x1f2937));
      if (!unlocked) layer.add(this.add.image(n.x, NODE_Y, ATLAS.tiles, 'lock_yellow').setScale(0.6));
      else if (done) layer.add(this.add.image(n.x + 4, NODE_Y - 4, ATLAS.tiles, 'flag_green_a').setScale(0.7));
      layer.add(
        this.add
          .text(n.x, NODE_Y + 58, n.id, { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffffff' })
          .setOrigin(0.5)
          .setStroke('#1f2937', 6),
      );
    }
  }

  private lastUnlocked() {
    const unlocked = LEVEL_ORDER.filter((id) => this.save.unlocked.includes(id));
    return unlocked[unlocked.length - 1] ?? LEVEL_ORDER[0];
  }
}
