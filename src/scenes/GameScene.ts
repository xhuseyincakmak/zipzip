import Phaser from 'phaser';
import { ATLAS, GAME_HEIGHT, GAME_WIDTH, PHYS, TILE } from '../config';
import { Boss } from '../entities/Boss';
import { Enemy } from '../entities/Enemy';
import { Item, type ItemKind } from '../entities/Item';
import { Player, type Form } from '../entities/Player';
import { buildLevel, tileIndex, type BlockContent, type BuiltLevel } from '../levels/buildLevel';
import { getLevel } from '../levels';
import { LEVEL_ORDER, levelNumber, nextLevelOf, worldOf } from '../levels/worlds';
import type { LevelData } from '../levels/Level';
import { playSfx } from '../systems/audio';
import { createParallaxBackground, type ParallaxBackground } from '../systems/background';
import { Blocks } from '../systems/Blocks';
import { GameState } from '../systems/GameState';
import { InputController } from '../systems/Input';
import { Music, trackForTheme } from '../systems/Music';
import { Save } from '../systems/Save';
import { Settings } from '../systems/Settings';
import type { HUDScene } from './HUDScene';

const LOOK_AHEAD = 110;
/** Süre birimi gerçek zamanda ne kadar sürer (300 birim = 2 dakika). */
const TIME_TICK_MS = 400;
/** Art arda ezme / kabukla vurma puanları; listenin sonunda her vuruş +1 can. */
const CHAIN_POINTS = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
/** Direğe tutunulan yüksekliğe göre puan (aşağıdan yukarı). */
const FLAG_POINTS = [100, 400, 800, 2000, 4000, 5000];
const FLAG_HEIGHT_TILES = 9;
const MAX_FIREBALLS = 2;
const FIREBALL_SPEED = 680;
const PLATFORM_SPEED = 100;
const PLATFORM_RANGE = TILE * 3;
/** Boss, oyuncu bu kadar yaklaşınca uyanır. */
const BOSS_WAKE_DISTANCE = TILE * 9;

interface MovingPlatform {
  parts: Phaser.Physics.Arcade.Image[];
  axis: 'x' | 'y';
  origin: number;
  dir: 1 | -1;
  /** Önceki karedeki sol parça x'i (üstündeki oyuncuyu taşımak için). */
  lastX: number;
}

type Body = Phaser.Physics.Arcade.Body;

export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private built!: BuiltLevel;
  private player!: Player;
  private input2!: InputController;
  private blocks!: Blocks;
  private enemies!: Phaser.GameObjects.Group;
  private coins!: Phaser.GameObjects.Group;
  private items!: Phaser.GameObjects.Group;
  private fireballs!: Phaser.GameObjects.Group;
  private finishing = false;
  private platforms: MovingPlatform[] = [];
  private platformGroup!: Phaser.Physics.Arcade.Group;
  private boss?: Boss;
  private dustFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private background!: ParallaxBackground;
  /** Bölüm başındaki tanıtım ekranı açıkken oyun durur. */
  private intro = false;
  private lookAhead = 0;
  private dying = false;
  private shellChains = new WeakMap<Enemy, number>();

  constructor() {
    super('Game');
  }

  /** Editörden "Test et" ile açıldıysa: can düşmez, bitince/çıkınca editöre dönülür, kayıt tutulmaz. */
  private testMode = false;

  init(data: { levelId?: string; levelData?: LevelData; testMode?: boolean }) {
    this.level = data.levelData ?? getLevel(data.levelId ?? 'test');
    this.testMode = !!data.testMode;
    this.lookAhead = 0;
    this.dying = false;
    this.finishing = false;
    this.platforms = [];
    this.boss = undefined;
  }

  create() {
    this.background = createParallaxBackground(this, this.level.background);
    this.built = buildLevel(this, this.level);
    const { widthPx, heightPx, solid } = this.built;

    // Checkpoint'e ulaşıldıysa oradan devam.
    const cp = GameState.checkpoint;
    const spawn = cp && cp.levelId === this.level.id ? { x: cp.x, y: cp.bottom } : this.built.spawn;
    this.player = new Player(this, spawn.x, spawn.y, GameState.form);
    this.player.onFire = () => this.throwFireball();
    this.physics.add.collider(this.player, solid);

    // Sol/sağ kenar duvar gibi; üst ve alt açık (aşağı düşen ölür).
    this.physics.world.setBounds(0, 0, widthPx, heightPx + TILE * 4);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.player.setCollideWorldBounds(true);

    this.createPlatforms();
    this.createEffects();
    this.createEntities();
    this.createBoss();
    this.blocks = new Blocks(
      this,
      solid,
      {
        onContent: (content, x, y) => this.openBlock(content, x, y),
        onBumpTop: (area) => this.bumpFromBelow(area),
      },
      this.built.contents,
    );
    this.createGoal();
    this.createCheckpoints();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, widthPx, heightPx);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setRoundPixels(true);

    GameState.levelId = this.level.id;
    GameState.levelName = this.level.name;
    GameState.setTime(this.level.time);
    this.time.addEvent({ delay: TIME_TICK_MS, loop: true, callback: () => this.tickTime() });

    if (!this.scene.isActive('HUD')) this.scene.launch('HUD');
    this.hud()?.hideBanner();

    this.input2 = new InputController(this);
    this.createDebugKeys();
    this.showIntro();
  }

  /** Mario tarzı kısa siyah ekran: bölüm adı ve kalan can. Checkpoint dönüşünde gösterilmez. */
  private showIntro() {
    const fromCheckpoint = GameState.checkpoint?.levelId === this.level.id;
    if (fromCheckpoint) {
      Music.play(trackForTheme(this.level.theme));
      return this.createHelpText();
    }
    Music.stop();
    this.intro = true;
    this.physics.pause();
    const cx = GAME_WIDTH / 2;
    const style = { fontFamily: 'system-ui, sans-serif', fontStyle: 'bold', color: '#ffffff' };
    const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(200);
    overlay.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x111827).setOrigin(0));
    const n = levelNumber(this.level.id);
    const subtitle = this.testMode ? 'TEST' : n ? `${n}. bölüm / ${LEVEL_ORDER.length} • ${worldOf(this.level.id)?.name}` : '';
    overlay.add(this.add.text(cx, 250, this.level.name, { ...style, fontSize: '56px' }).setOrigin(0.5));
    overlay.add(this.add.text(cx, 320, subtitle, { ...style, fontSize: '28px', color: '#fde68a' }).setOrigin(0.5));
    overlay.add(this.add.image(cx - 40, 430, ATLAS.tiles, 'hud_player_helmet_green').setScale(0.9));
    overlay.add(this.add.text(cx + 10, 430, `× ${GameState.lives}`, { ...style, fontSize: '40px' }).setOrigin(0, 0.5));
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: overlay, alpha: 0, duration: 250, onComplete: () => overlay.destroy() });
      this.physics.resume();
      this.intro = false;
      Music.play(trackForTheme(this.level.theme));
      this.createHelpText();
    });
  }

  private openPause() {
    this.scene.pause();
    Music.pause();
    this.scene.launch('Pause', {
      onChoice: (choice: 'resume' | 'restart' | 'map') => {
        this.scene.resume();
        Music.resume();
        if (Settings.music && !Music.current) Music.play(this.boss?.active2 && !this.boss.dead ? 'boss' : trackForTheme(this.level.theme));
        if (choice === 'restart') this.restartLevel();
        if (choice === 'map') {
          GameState.checkpoint = null;
          this.goToMap();
        }
      },
    });
  }

  private restartLevel() {
    this.scene.restart({ levelId: this.level.id, levelData: this.level, testMode: this.testMode });
  }

  private goToMap(focus?: string) {
    if (this.testMode) {
      GameState.checkpoint = null;
      this.scene.start('Editor');
      return;
    }
    this.scene.start('WorldMap', { focus: focus ?? this.level.id });
  }

  update(time: number, delta: number) {
    // Uzun takılmalarda (sekme değişimi vb.) oyuncu duvarlardan geçmesin.
    const dt = Math.min(delta, 50);
    if (this.dying || this.finishing || this.intro) return;

    if (!this.player.frozen) this.blocks.checkHeadBump(this.player.body, this.player.big);
    const input = this.input2.read();
    if (input.pausePressed) return this.openPause();
    this.player.update(input, dt);
    this.updateEnemies(time, dt);
    for (const it of this.items.getChildren()) (it as Item).update();
    this.updateFireballs();
    this.updatePlatforms();
    this.updateBoss(dt);
    this.checkHazards();

    if (this.player.body.top > this.built.heightPx) this.killPlayer(false);

    // Kamera, bakılan yöne doğru biraz önden gider.
    const cam = this.cameras.main;
    this.lookAhead = Phaser.Math.Linear(this.lookAhead, this.player.facingDir * LOOK_AHEAD, 0.04);
    cam.setFollowOffset(-this.lookAhead, 0);

    this.background.scrollTo(cam.scrollX);
  }

  // ---------------------------------------------------------------- varlıklar

  private createEffects() {
    const base = {
      emitting: false,
      lifespan: 450,
      speed: { min: 60, max: 200 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      gravityY: 400,
    };
    this.dustFx = this.add.particles(0, 0, 'dot', { ...base, tint: 0xf3f4f6 }).setDepth(15);
    this.sparkFx = this.add.particles(0, 0, 'dot', { ...base, tint: [0xfde047, 0xfacc15, 0xffffff], gravityY: 0, lifespan: 380 }).setDepth(15);
    this.player.onLand = () => this.dustFx.explode(8, this.player.x, this.player.body.bottom);
  }

  private createEntities() {
    this.enemies = this.add.group();
    this.coins = this.add.group();
    this.items = this.add.group();
    this.fireballs = this.add.group();

    for (const s of this.built.spawns) {
      if (s.type === 'coin') {
        const coin = this.physics.add.staticSprite(s.x, s.bottom - TILE / 2, ATLAS.tiles, 'coin_gold');
        coin.body.setSize(34, 40);
        coin.anims.play({ key: 'coin-spin', startFrame: Phaser.Math.Between(0, 1) });
        this.coins.add(coin);
      } else {
        this.enemies.add(new Enemy(this, s.type, s.x, s.bottom));
      }
    }

    const solid = this.built.solid;
    this.physics.add.collider(this.enemies, solid);
    this.physics.add.collider(this.enemies, this.platformGroup);
    // Yürüyen düşmanlar birbirine çarpınca döner; hareketli kabuk ise çarptığını devirir.
    this.physics.add.collider(this.enemies, this.enemies, undefined, (a, b) => {
      const ea = a as Enemy;
      const eb = b as Enemy;
      return ea.alive && eb.alive && !ea.isMovingShell && !eb.isMovingShell;
    });
    this.physics.add.overlap(this.enemies, this.enemies, (a, b) => this.shellHit(a as Enemy, b as Enemy));
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.playerTouchesEnemy(e as Enemy));
    this.physics.add.overlap(this.player, this.coins, (_p, c) => this.collectCoin(c as Phaser.Physics.Arcade.Sprite));
    this.physics.add.collider(this.items, solid);
    this.physics.add.collider(this.items, this.platformGroup);
    this.physics.add.overlap(this.player, this.items, (_p, i) => this.collectItem(i as Item));
    this.physics.add.collider(this.fireballs, solid, (f) => this.fireballHitsWall(f as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.fireballs, this.enemies, (f, e) => this.fireballHitsEnemy(f as Phaser.Physics.Arcade.Image, e as Enemy));
  }

  private updateEnemies(time: number, dt: number) {
    const wakeX = this.cameras.main.scrollX + GAME_WIDTH + TILE;
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (e.state === 'idle' && e.x < wakeX) e.activate();
      e.update(time, dt);
      if (e.y > this.built.heightPx + TILE * 2) e.destroy();
    }
  }

  private playerTouchesEnemy(e: Enemy) {
    if (this.dying || this.finishing || !e.alive || this.player.frozen) return;
    const p = this.player.body;
    const eb = e.body as Body;

    if (this.player.hasStar) {
      e.knockOut(e.x < this.player.x ? -1 : 1);
      this.chainPoints(this.player.stompChain++, e.x, eb.top);
      playSfx(this, 'hurt', { volume: 0.4, rate: 0.8 });
      return;
    }
    const stomp = e.stompable && p.velocity.y > 0 && p.bottom < eb.center.y;

    if (stomp) {
      if (e.isHarmlessShell) {
        e.kick(this.player.x, this.time.now);
        this.addPoints(400, e.x, eb.top);
      } else {
        e.stomp();
        this.dustFx.explode(10, e.x, eb.top);
        this.chainPoints(this.player.stompChain++, e.x, eb.top);
      }
      playSfx(this, 'hurt', { volume: 0.4, rate: 1.4 });
      this.player.bounce();
      return;
    }

    if (e.isHarmlessShell) {
      e.kick(this.player.x, this.time.now);
      this.addPoints(400, e.x, eb.top);
      playSfx(this, 'hurt', { volume: 0.4, rate: 1.4 });
      return;
    }
    if (e.canHurtPlayer(this.time.now)) this.hurtPlayer();
  }

  // ---------------------------------------------------------------- platformlar, tehlikeler, boss

  private createPlatforms() {
    this.platformGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    const theme = this.level.theme;
    for (const pl of this.built.platforms) {
      const parts = ['left', 'middle', 'right'].map((side, i) => {
        const img = this.platformGroup.create(
          pl.x + i * TILE + TILE / 2,
          pl.y + TILE / 2,
          ATLAS.tiles,
          `terrain_${theme}_cloud_${side}`,
        ) as Phaser.Physics.Arcade.Image;
        img.setDepth(2);
        const b = img.body as Body;
        b.setSize(TILE, 52).setOffset(0, 0);
        // Yalnızca üstten basılır; alttan geçilebilir.
        b.checkCollision.down = false;
        b.checkCollision.left = false;
        b.checkCollision.right = false;
        return img;
      });
      this.platforms.push({ parts, axis: pl.axis, origin: pl.axis === 'x' ? pl.x : pl.y, dir: 1, lastX: parts[0].x });
    }
    this.physics.add.collider(this.player, this.platformGroup);
  }

  private updatePlatforms() {
    const pb = this.player.body;
    for (const mp of this.platforms) {
      const first = mp.parts[0];
      // Arcade fiziği yatay platformdaki oyuncuyu kendisi taşımıyor; platformun yer değiştirmesini ekle.
      const dx = first.x - mp.lastX;
      mp.lastX = first.x;
      const top = (first.body as Body).top;
      const onTop =
        pb.touching.down &&
        Math.abs(pb.bottom - top) < 6 &&
        pb.right > first.x - TILE / 2 &&
        pb.left < first.x - TILE / 2 + TILE * 3;
      if (dx !== 0 && onTop && !this.player.frozen) this.player.x += dx;

      const pos = mp.axis === 'x' ? first.x - TILE / 2 : first.y - TILE / 2;
      if (pos > mp.origin + PLATFORM_RANGE) mp.dir = -1;
      else if (pos < mp.origin - PLATFORM_RANGE) mp.dir = 1;
      for (const part of mp.parts) {
        const b = part.body as Body;
        if (mp.axis === 'x') b.setVelocity(mp.dir * PLATFORM_SPEED, 0);
        else b.setVelocity(0, mp.dir * PLATFORM_SPEED);
      }
    }
  }

  /** Lav öldürür, diken hasar verir. Çarpışma kutusunun biraz içi kontrol edilir. */
  private checkHazards() {
    const p = this.player;
    if (p.frozen || p.dead) return;
    const b = p.body;
    const tiles = this.built.hazards.getTilesWithinWorldXY(b.left + 6, b.top + 6, b.width - 12, b.height - 6);
    for (const t of tiles) {
      if (t.index < 0) continue;
      if (this.lavaTiles.has(t.index)) return this.killPlayer(true);
      // Diken karosunun görseli alt yarıda.
      if (b.bottom > t.pixelY + TILE / 2) {
        this.hurtPlayer();
        if (!this.dying) b.setVelocityY(-700);
        return;
      }
    }
  }

  private get lavaTiles() {
    return new Set([tileIndex(this, 'lava'), tileIndex(this, 'lava_top')]);
  }

  private createBoss() {
    const spawn = this.built.boss;
    if (!spawn) return;
    const boss = new Boss(this, spawn.x, spawn.bottom);
    this.boss = boss;
    this.physics.add.collider(boss, this.built.solid);
    this.physics.add.overlap(this.player, boss, () => this.playerTouchesBoss());
    this.physics.add.overlap(this.fireballs, boss, (_b, f) => {
      const fb = f as Phaser.Physics.Arcade.Image;
      if (!fb.active || boss.dead) return;
      this.popFireball(fb);
      if (boss.damage(Boss.fireDamage)) this.bossDefeated();
      else playSfx(this, 'bump', { volume: 0.4 });
    });
  }

  private updateBoss(dt: number) {
    const boss = this.boss;
    if (!boss || boss.dead) return;
    if (!boss.active2 && Math.abs(boss.x - this.player.x) < BOSS_WAKE_DISTANCE) {
      boss.wake();
      Music.play('boss');
      this.hud()?.showBanner('DEV BLOK SLIME!');
      this.time.delayedCall(1500, () => this.hud()?.hideBanner());
    }
    boss.update(dt, this.player.x);
    // Lava/çukura düşerse de yenilmiş sayılır (aksi halde kapı hiç açılmazdı).
    if (boss.y > this.built.heightPx + TILE) {
      boss.dead = true;
      this.bossDefeated();
    }
  }

  private playerTouchesBoss() {
    const boss = this.boss!;
    if (boss.dead || this.dying || this.player.frozen) return;
    const p = this.player.body;
    const stomp = p.velocity.y > 0 && p.bottom < boss.body.top + 30;
    if (stomp) {
      // Yüksek ve boss'tan uzağa sek; aksi halde hemen tekrar üstüne düşülüyor.
      p.setVelocity(Math.sign(this.player.x - boss.x || 1) * 380, -PHYS.jumpVelocity);
      boss.wake();
      if (!boss.canBeHit) return;
      playSfx(this, 'hurt', { volume: 0.6, rate: 0.7 });
      this.cameras.main.shake(150, 0.006);
      if (boss.damage(1)) this.bossDefeated();
      return;
    }
    if (this.player.hasStar) return; // yıldız boss'a işlemez ama koruyor
    this.hurtPlayer();
  }

  private bossDefeated() {
    this.addPoints(5000, this.boss!.x, this.boss!.y - 80);
    playSfx(this, 'magic', { volume: 0.8 });
    this.cameras.main.shake(400, 0.01);
    this.hud()?.showBanner('KAPI AÇILDI!');
    this.time.delayedCall(1500, () => this.hud()?.hideBanner());
    // Kapı karoları sırayla patlar.
    this.built.gates.forEach((g, i) =>
      this.time.delayedCall(250 + i * 90, () => {
        this.built.solid.removeTileAt(g.x, g.y);
        playSfx(this, 'disappear', { volume: 0.4 });
      }),
    );
  }

  /** Büyükse küçülür ve kısa süre dokunulmaz olur; küçükse ölür. */
  private hurtPlayer() {
    const p = this.player;
    if (p.invulnerableMs > 0 || p.hasStar) return;
    if (!p.big) return this.killPlayer(true);
    playSfx(this, 'hurt', { volume: 0.6 });
    this.transformPlayer('small', () => p.startInvulnerable());
  }

  /** Büyüme/küçülme: oyun kısa bir an durur, karakter iki boy arasında yanıp söner. */
  private transformPlayer(to: Form, done?: () => void) {
    const p = this.player;
    const from = p.form;
    p.frozen = true;
    this.physics.pause();
    let i = 0;
    this.time.addEvent({
      delay: 70,
      repeat: 7,
      callback: () => {
        p.showFormPreview(i++ % 2 === 0 ? to : from);
        if (i === 8) {
          this.physics.resume();
          p.setForm(to);
          GameState.form = to;
          p.frozen = false;
          done?.();
        }
      },
    });
  }

  // ---------------------------------------------------------------- bloklar, eşyalar, ateş

  private openBlock(content: BlockContent, x: number, y: number) {
    if (content === 'coin') return this.coinFromBlock(x, y);
    const kind: ItemKind = content === 'star' ? 'star' : this.player.big ? 'fire' : 'grow';
    this.items.add(new Item(this, kind, x, y));
    playSfx(this, 'gem', { volume: 0.5 });
  }

  private collectItem(item: Item) {
    if (!item.ready || this.player.frozen) return;
    item.destroy();
    this.addPoints(1000, item.x, item.y - 20);
    playSfx(this, 'magic', { volume: 0.6 });
    const p = this.player;
    if (item.kind === 'star') return p.startStar();
    if (item.kind === 'grow' && p.form === 'small') return this.transformPlayer('big');
    if (item.kind === 'fire' && p.form !== 'fire') this.transformPlayer('fire');
    // Zaten o formdaysa yalnızca puan.
  }

  private throwFireball() {
    if (this.fireballs.countActive() >= MAX_FIREBALLS) return;
    const p = this.player;
    const dir = p.facingDir;
    const fb = this.physics.add.image(p.x + dir * 30, p.y, ATLAS.tiles, 'fireball').setScale(0.6).setDepth(9);
    fb.body.setCircle(18, 14, 14);
    fb.setVelocity(dir * FIREBALL_SPEED, 200);
    fb.setAngularVelocity(dir * 720);
    this.fireballs.add(fb);
    playSfx(this, 'throw', { volume: 0.5 });
  }

  private updateFireballs() {
    const cam = this.cameras.main;
    for (const obj of [...this.fireballs.getChildren()]) {
      const fb = obj as Phaser.Physics.Arcade.Image;
      const b = fb.body as Body;
      if (b.blocked.down) b.setVelocityY(-520);
      // Hızı sabit tut (zemine çarpınca yatay hız kaybolmasın).
      if (Math.abs(b.velocity.x) < FIREBALL_SPEED - 1 && !b.blocked.left && !b.blocked.right) {
        b.setVelocityX(Math.sign(b.velocity.x || 1) * FIREBALL_SPEED);
      }
      if (fb.x < cam.scrollX - TILE || fb.x > cam.scrollX + GAME_WIDTH + TILE || fb.y > this.built.heightPx) fb.destroy();
    }
  }

  private fireballHitsWall(fb: Phaser.Physics.Arcade.Image) {
    const b = fb.body as Body;
    if (b.blocked.left || b.blocked.right) this.popFireball(fb);
  }

  private fireballHitsEnemy(fb: Phaser.Physics.Arcade.Image, e: Enemy) {
    if (!e.alive || !fb.active) return;
    if (!e.vulnerable) return this.popFireball(fb);
    e.knockOut(Math.sign((fb.body as Body).velocity.x) || 1);
    this.addPoints(200, e.x, e.y - 20);
    playSfx(this, 'hurt', { volume: 0.4, rate: 0.8 });
    this.popFireball(fb);
  }

  private popFireball(fb: Phaser.Physics.Arcade.Image) {
    const puff = this.add.image(fb.x, fb.y, ATLAS.tiles, 'fireball').setDepth(9).setScale(0.6);
    this.tweens.add({ targets: puff, scale: 1.2, alpha: 0, duration: 180, onComplete: () => puff.destroy() });
    fb.destroy();
  }

  // ---------------------------------------------------------------- bayrak, checkpoint

  private createGoal() {
    const flag = this.built.flag;
    if (!flag) return;
    const top = flag.bottom - FLAG_HEIGHT_TILES * TILE;
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x1f2937).fillRect(flag.x - 7, top, 14, flag.bottom - top);
    g.fillStyle(0xe5e7eb).fillRect(flag.x - 4, top, 8, flag.bottom - top);
    g.fillStyle(0x1f2937).fillCircle(flag.x, top, 13);
    g.fillStyle(0xfacc15).fillCircle(flag.x, top, 9);
    // Kenney bayrağının kendi direği karonun sol kenarında; direğimizle hizalanır.
    this.add.sprite(flag.x + 22, top + 40, ATLAS.tiles, 'flag_green_a').setDepth(3).play('flag-wave');
    this.add.image(flag.x, flag.bottom - TILE / 2, ATLAS.tiles, 'block_strong_empty').setDepth(2);

    // Bitiş kapısı direğin 4 karo sağında.
    const doorX = flag.x + 4 * TILE;
    this.add.image(doorX, flag.bottom - TILE * 1.5, ATLAS.tiles, 'door_open_top').setDepth(1);
    this.add.image(doorX, flag.bottom - TILE / 2, ATLAS.tiles, 'door_open').setDepth(1);

    const zone = this.add.zone(flag.x, (top + flag.bottom) / 2, 16, flag.bottom - top);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.player, zone, () => this.reachFlag(top, flag.bottom - TILE, doorX));
  }

  private createCheckpoints() {
    for (const cp of this.built.checkpoints) {
      const reached = GameState.checkpoint?.levelId === this.level.id && GameState.checkpoint.x === cp.x;
      const sprite = this.add.sprite(cp.x + 22, cp.bottom - TILE / 2, ATLAS.tiles, 'flag_off').setDepth(1);
      if (reached) {
        sprite.play('flag-wave');
        continue;
      }
      const zone = this.add.zone(cp.x, cp.bottom - TILE * 2, TILE, TILE * 4);
      this.physics.add.existing(zone, true);
      const collider = this.physics.add.overlap(this.player, zone, () => {
        collider.destroy();
        sprite.play('flag-wave');
        GameState.checkpoint = { levelId: this.level.id, x: cp.x, bottom: cp.bottom };
        playSfx(this, 'select', { volume: 0.6 });
        this.popup('CHECKPOINT', cp.x, cp.bottom - TILE * 2);
      });
    }
  }

  /** Direğe tutun → aşağı kay → kapıya yürü → kalan süre puana dönsün → sonraki bölüm. */
  private reachFlag(poleTop: number, poleBottom: number, doorX: number) {
    if (this.finishing || this.dying || this.player.frozen) return;
    this.finishing = true;
    const p = this.player;
    const grabY = p.body.top;
    const ratio = Phaser.Math.Clamp((poleBottom - grabY) / (poleBottom - poleTop), 0, 1);
    this.addPoints(FLAG_POINTS[Math.min(FLAG_POINTS.length - 1, Math.floor(ratio * FLAG_POINTS.length))], p.x, grabY);
    playSfx(this, 'jump-high', { volume: 0.6 });
    Music.play('clear');

    p.frozen = true;
    p.body.enable = false;
    p.clearTint().setAlpha(1);
    p.starMs = 0;
    p.setPose('climb_a');
    p.setFlipX(false);
    p.x = this.built.flag!.x - 14;
    const footOffset = p.body.bottom - p.y;
    const groundY = this.built.flag!.bottom - footOffset;

    this.tweens.chain({
      targets: p,
      tweens: [
        { y: groundY - TILE, duration: 200 + (groundY - p.y) * 1.2, ease: 'Linear' },
        { y: groundY, x: p.x + 40, duration: 250, delay: 250, ease: 'Quad.easeIn' },
        {
          x: doorX,
          duration: Math.max(400, (doorX - p.x) * 4),
          onStart: () => p.anims.play(`player-walk-${p.form === 'fire' ? 'yellow' : 'green'}`),
        },
        { alpha: 0, duration: 200 },
      ],
      onComplete: () => this.countTimeBonus(),
    });
  }

  private countTimeBonus() {
    const step = () => {
      if (GameState.time <= 0) {
        this.hud()?.showBanner('BÖLÜM TAMAM!');
        GameState.checkpoint = null;
        GameState.form = this.player.form;
        const next = nextLevelOf(this.level.id);
        if (this.level.id !== 'test' && !this.testMode) Save.complete(this.level.id, GameState.score, next);
        this.time.delayedCall(1800, () => this.goToMap(next ?? this.level.id));
        return;
      }
      const n = Math.min(5, GameState.time);
      GameState.time -= n;
      GameState.addScore(50 * n);
      if (GameState.time % 20 < 5) playSfx(this, 'coin', { volume: 0.25 });
      this.time.delayedCall(16, step);
    };
    step();
  }

  private shellHit(a: Enemy, b: Enemy) {
    if (!a.alive || !b.alive) return;
    if (!a.isMovingShell && !b.isMovingShell) return;
    const [shell, victim] = a.isMovingShell ? [a, b] : [b, a];
    if (!victim.vulnerable) return;
    if (victim.isMovingShell) shell.knockOut(Math.sign(shell.x - victim.x));
    victim.knockOut(Math.sign(victim.x - shell.x) || 1);
    const n = this.shellChains.get(shell) ?? 0;
    this.shellChains.set(shell, n + 1);
    this.chainPoints(n, victim.x, victim.y - 20);
    playSfx(this, 'hurt', { volume: 0.4, rate: 0.8 });
  }

  private collectCoin(coin: Phaser.Physics.Arcade.Sprite) {
    this.sparkFx.explode(8, coin.x, coin.y);
    coin.destroy();
    if (GameState.addCoin()) this.oneUp(this.player.x, this.player.y);
    playSfx(this, 'coin', { volume: 0.5 });
  }

  private coinFromBlock(x: number, y: number) {
    const coin = this.add.sprite(x, y - TILE / 2, ATLAS.tiles, 'coin_gold').play('coin-spin').setDepth(4);
    coin.anims.timeScale = 4;
    this.tweens.add({
      targets: coin,
      y: y - TILE * 2.2,
      duration: 260,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 40,
      onComplete: () => {
        coin.destroy();
        this.popup('200', x, y - TILE);
      },
    });
    if (GameState.addCoin()) this.oneUp(x, y);
    playSfx(this, 'coin', { volume: 0.5 });
  }

  /** Alttan vurulan bloğun üstündeki düşmanlar devrilir, coinler toplanır. */
  private bumpFromBelow(area: Phaser.Geom.Rectangle) {
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.alive || !e.body.enable) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(area, e.getBounds())) {
        e.knockOut(e.x < area.centerX ? -1 : 1);
        this.addPoints(100, e.x, e.y - 20);
      }
    }
    for (const obj of [...this.coins.getChildren()]) {
      const c = obj as Phaser.Physics.Arcade.Sprite;
      if (Phaser.Geom.Intersects.RectangleToRectangle(area, c.getBounds())) {
        this.coinFromBlock(c.x, c.y + TILE / 2);
        c.destroy();
      }
    }
  }

  // ---------------------------------------------------------------- puan, süre, ölüm

  private chainPoints(index: number, x: number, y: number) {
    if (index < CHAIN_POINTS.length) this.addPoints(CHAIN_POINTS[index], x, y);
    else this.oneUp(x, y);
  }

  private addPoints(points: number, x: number, y: number) {
    GameState.addScore(points);
    this.popup(String(points), x, y);
  }

  private oneUp(x: number, y: number) {
    GameState.lives++;
    GameState.emit('changed');
    this.popup('1UP', x, y);
    playSfx(this, 'magic', { volume: 0.6 });
  }

  private popup(text: string, x: number, y: number) {
    const t = this.add
      .text(x, y, text, { fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setStroke('#1f2937', 5)
      .setDepth(60);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  private tickTime() {
    if (this.dying || this.finishing) return;
    GameState.setTime(GameState.time - 1);
    if (GameState.time <= 0) this.killPlayer(true);
  }

  /** withAnimation: düşmana çarpınca karakter zıplayıp ekrandan düşer; çukurda doğrudan biter. */
  private killPlayer(withAnimation: boolean) {
    if (this.dying) return;
    this.dying = true;
    GameState.form = 'small';
    this.physics.pause();
    this.anims.pauseAll();
    this.player.setDeadPose();
    playSfx(this, 'hurt', { volume: 0.7 });
    Music.play('death');

    const finish = () => this.time.delayedCall(withAnimation ? 600 : 1200, () => this.afterDeath());
    if (!withAnimation) return finish();

    this.tweens.chain({
      targets: this.player,
      tweens: [
        { y: this.player.y - TILE * 2, duration: 380, ease: 'Quad.easeOut', delay: 350 },
        { y: this.cameras.main.scrollY + GAME_HEIGHT + TILE * 2, duration: 900, ease: 'Quad.easeIn' },
      ],
      onComplete: finish,
    });
  }

  private afterDeath() {
    this.anims.resumeAll();
    if (!this.testMode) GameState.loseLife();
    if (GameState.lives > 0) {
      this.restartLevel();
      return;
    }
    this.hud()?.showBanner('OYUN BİTTİ');
    Music.play('gameover');
    this.time.delayedCall(2500, () => {
      GameState.reset();
      this.goToMap();
    });
  }

  private hud() {
    return this.scene.get('HUD') as unknown as HUDScene | undefined;
  }

  private createDebugKeys() {
    const kb = this.input.keyboard!;
    kb.on('keydown-R', () => this.restartLevel());
    kb.on('keydown-F2', () => {
      const world = this.physics.world;
      if (!world.debugGraphic) world.createDebugGraphic();
      world.drawDebug = !world.drawDebug;
      world.debugGraphic.clear();
    });
  }

  private createHelpText() {
    const help = this.add
      .text(16, 84, `${this.level.name}\n← → hareket   Space/Z zıpla   Shift/X koş   ↓ eğil   Esc duraklat`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#1f2937',
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.tweens.add({ targets: help, alpha: 0, delay: 6000, duration: 800 });
  }
}
