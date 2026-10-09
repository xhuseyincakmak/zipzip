import Phaser from 'phaser';
import { ATLAS, TILE } from '../config';
import { BLOCK_FRAMES, tileIndex, type BlockContent } from '../levels/buildLevel';
import { playSfx } from './audio';

export interface BlockHooks {
  /** Soru bloğu açıldı (karonun üst-orta noktası). */
  onContent(content: BlockContent, x: number, y: number): void;
  /** Blok alttan vuruldu; üstündeki düşman/coin etkilenir. */
  onBumpTop(area: Phaser.Geom.Rectangle): void;
}

const BUMP_HEIGHT = 14;
const BUMP_MS = 80;

/** Alttan kafa atılan blokları yönetir: soru bloğu, tuğla, düz blok. */
export class Blocks {
  private bumping = new Set<Phaser.Tilemaps.Tile>();
  private idx: Record<keyof typeof BLOCK_FRAMES, number>;

  constructor(
    private scene: Phaser.Scene,
    private layer: Phaser.Tilemaps.TilemapLayer,
    private hooks: BlockHooks,
    private contents: Map<string, BlockContent>,
  ) {
    this.idx = {
      question: tileIndex(scene, BLOCK_FRAMES.question),
      brick: tileIndex(scene, BLOCK_FRAMES.brick),
      used: tileIndex(scene, BLOCK_FRAMES.used),
    };
  }

  /** Oyuncunun kafası bu adımda bir karoya çarptıysa o karoyu bulup vurur. */
  checkHeadBump(body: Phaser.Physics.Arcade.Body, canBreak: boolean) {
    if (!body.blocked.up) return;
    const ty = this.layer.worldToTileY(body.top - 2);
    const at = (x: number) => this.layer.getTileAt(this.layer.worldToTileX(x), ty);
    // Önce kafanın ortasındaki karo, yoksa kenarlardaki.
    const tile = at(body.center.x) ?? at(body.left + 1) ?? at(body.right - 1);
    if (tile) this.hit(tile, canBreak);
  }

  private hit(tile: Phaser.Tilemaps.Tile, canBreak: boolean) {
    if (this.bumping.has(tile)) return;

    if (tile.index === this.idx.question) {
      tile.index = this.idx.used;
      this.bump(tile, BLOCK_FRAMES.used);
      const content = this.contents.get(`${tile.x},${tile.y}`) ?? 'coin';
      this.hooks.onContent(content, tile.pixelX + TILE / 2, tile.pixelY);
    } else if (tile.index === this.idx.brick) {
      if (canBreak) return this.breakBrick(tile);
      this.bump(tile, BLOCK_FRAMES.brick);
      playSfx(this.scene, 'bump', { volume: 0.6 });
    } else {
      playSfx(this.scene, 'bump', { volume: 0.4 });
      return;
    }
    this.hooks.onBumpTop(this.topArea(tile));
  }

  /** Karo yerinde kalır (çarpışma sürer); üstünde yukarı-aşağı oynayan bir kopyası gösterilir. */
  private bump(tile: Phaser.Tilemaps.Tile, frame: string) {
    this.bumping.add(tile);
    tile.visible = false;
    const img = this.scene.add.image(tile.pixelX + TILE / 2, tile.pixelY + TILE / 2, ATLAS.tiles, frame).setDepth(3);
    this.scene.tweens.add({
      targets: img,
      y: img.y - BUMP_HEIGHT,
      duration: BUMP_MS,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        img.destroy();
        tile.visible = true;
        this.bumping.delete(tile);
      },
    });
  }

  private breakBrick(tile: Phaser.Tilemaps.Tile) {
    const cx = tile.pixelX + TILE / 2;
    const cy = tile.pixelY + TILE / 2;
    this.hooks.onBumpTop(this.topArea(tile));
    this.layer.removeTileAt(tile.x, tile.y);
    playSfx(this.scene, 'disappear', { volume: 0.5 });
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 0], [1, 0]]) {
      const piece = this.scene.physics.add.image(cx + dx * 14, cy + dy * 14, ATLAS.tiles, 'brick_brown');
      piece.setDepth(20).setAngularVelocity(dx * 360);
      piece.body.checkCollision.none = true;
      piece.setVelocity(dx * 180, dy === -1 ? -750 : -500);
      this.scene.time.delayedCall(1500, () => piece.destroy());
    }
  }

  private topArea(tile: Phaser.Tilemaps.Tile) {
    return new Phaser.Geom.Rectangle(tile.pixelX + 4, tile.pixelY - 12, TILE - 8, 14);
  }
}
