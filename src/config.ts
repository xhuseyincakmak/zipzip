/** Bir karonun piksel boyutu (Kenney New Platformer Pack, default çözünürlük). */
export const TILE = 64;

/** Mantıksal ekran: 20 x 12 karo. Tarayıcı penceresine orantılı ölçeklenir. */
export const GAME_WIDTH = 20 * TILE;
export const GAME_HEIGHT = 12 * TILE;

/** Oyuncu hareket ayarları. Hız: px/sn, ivme: px/sn², süre: ms. */
export const PHYS = {
  gravity: 2400,
  walkSpeed: 330,
  runSpeed: 520,
  groundAccel: 1500,
  runAccel: 1100,      // yürüme hızından koşma hızına çıkarken
  groundDecel: 1900,
  turnDecel: 3400,     // ters yöne basınca kayarak dönme
  airAccel: 1300,
  airDecel: 500,
  jumpVelocity: 1150,  // ~4 karo zıplama
  runJumpBonus: 110,   // tam koşuda ~5 karo
  jumpCutGravity: 2.8, // tuş erken bırakılınca yükselişte yerçekimi çarpanı
  fallGravity: 1.35,   // düşerken yerçekimi çarpanı
  maxFall: 1100,
  coyoteMs: 90,        // kenardan düştükten sonra hâlâ zıplayabilme süresi
  jumpBufferMs: 130,   // yere inmeden hemen önce basılan zıplamayı hatırlama
} as const;

/** Atlas anahtarları (BootScene yükler). */
export const ATLAS = {
  tiles: 'tiles',
  characters: 'characters',
  enemies: 'enemies',
  backgrounds: 'backgrounds',
} as const;
