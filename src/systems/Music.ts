import Phaser from 'phaser';
import { Settings } from './Settings';

/**
 * Küçük bir chiptune sıralayıcı: müzikler ses dosyası değil, Web Audio osilatörleriyle
 * çalınan nota dizileridir. Melodiler bu oyun için yazıldı.
 *
 * Nota yazımı: "C5", "D#4"; "." = sus. Her adım bir sekizlik nota.
 */
interface Track {
  bpm: number;
  lead: string;
  bass: string;
  /** x = vuruş, . = boş (adım sayısı lead ile aynı olmalı değil; kendi içinde döner). */
  drums?: string;
  leadWave: OscillatorType;
  /** Döngü yerine bir kez çalınır. */
  once?: boolean;
}

const TRACKS: Record<string, Track> = {
  // Çayır: neşeli, majör
  overworld: {
    bpm: 140,
    leadWave: 'square',
    lead:
      'E5 . G5 . A5 G5 E5 . D5 . E5 C5 D5 . . . ' +
      'E5 . G5 . A5 . C6 . B5 A5 G5 . A5 . . . ' +
      'F5 . A5 . G5 F5 E5 . D5 E5 F5 . E5 . C5 . ' +
      'D5 . E5 . G5 . F5 E5 D5 . C5 . C5 . . . ',
    bass:
      'C3 . G3 . C3 . G3 . G2 . D3 . G2 . D3 . ' +
      'A2 . E3 . A2 . E3 . F2 . C3 . G2 . B2 . ' +
      'F2 . C3 . F2 . C3 . C3 . G3 . A2 . E3 . ' +
      'D3 . A3 . G2 . D3 . C3 . G2 . C3 . . . ',
    drums: 'x . . x x . . . ',
  },
  // Mağara: yavaş, minör, seyrek
  cave: {
    bpm: 108,
    leadWave: 'triangle',
    lead:
      'A4 . C5 . E5 . . . D5 . C5 . B4 . . . ' +
      'A4 . C5 . E5 . G5 . F5 . E5 . D5 . . . ' +
      'C5 . . E5 . . A5 . G5 . . E5 . . D5 . ' +
      'C5 . B4 . A4 . . . . . . . . . . . ',
    bass:
      'A2 . . . A2 . . . F2 . . . E2 . . . ' +
      'A2 . . . A2 . . . D2 . . . E2 . . . ' +
      'F2 . . . F2 . . . C3 . . . G2 . . . ' +
      'E2 . . . E2 . . . A2 . . . . . . . ',
    drums: 'x . . . . . x . ',
  },
  // Gökyüzü: hafif, yüksek, akıcı
  sky: {
    bpm: 150,
    leadWave: 'triangle',
    lead:
      'G5 A5 B5 . D6 . B5 . A5 . G5 . E5 . . . ' +
      'G5 A5 B5 . D6 . E6 . D6 . B5 . A5 . . . ' +
      'C6 . B5 A5 G5 . E5 . F#5 . G5 A5 B5 . . . ' +
      'A5 . G5 . F#5 . D5 . G5 . . . . . . . ',
    bass:
      'G2 . D3 . B2 . D3 . C3 . G3 . E3 . G3 . ' +
      'G2 . D3 . B2 . D3 . A2 . E3 . C3 . E3 . ' +
      'C3 . G3 . E3 . G3 . D3 . A3 . F#3 . A3 . ' +
      'D3 . A3 . D3 . C3 . G2 . D3 . G2 . . . ',
    drums: 'x . x . x . x . ',
  },
  // Kale: gergin, minör, alçak
  castle: {
    bpm: 126,
    leadWave: 'sawtooth',
    lead:
      'D5 . . D5 F5 . E5 . D5 . C#5 . D5 . . . ' +
      'A4 . . A4 C5 . A#4 . A4 . G4 . A4 . . . ' +
      'D5 . F5 . A5 . G5 F5 E5 . F5 . D5 . . . ' +
      'C#5 . E5 . A4 . . . D5 . . . . . . . ',
    bass:
      'D2 D2 . D2 D2 . D2 . A#1 A#1 . A#1 A1 . A1 . ' +
      'D2 D2 . D2 D2 . D2 . G1 G1 . G1 A1 . A1 . ',
    drums: 'x . x x x . x . ',
  },
  // Boss: hızlı, sürükleyici
  boss: {
    bpm: 168,
    leadWave: 'square',
    lead:
      'E5 . E5 G5 . E5 D5 . E5 . E5 A5 . G5 E5 . ' +
      'C5 . C5 E5 . C5 B4 . C5 . D5 . E5 . . . ',
    bass: 'E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 C2 C3 D2 D3 D2 D3 ',
    drums: 'x . x . x x x . ',
  },
  // Başlık ekranı: geniş, kahramanca
  title: {
    bpm: 120,
    leadWave: 'square',
    lead:
      'C5 . . G4 C5 . E5 . D5 . . C5 D5 . G5 . E5 . . D5 C5 . A4 . G4 . . . . . . . ' +
      'A4 . . F4 A4 . C5 . B4 . . A4 B4 . D5 . C5 . E5 . G5 . F5 E5 D5 . . . . . . . ',
    bass:
      'C3 . G2 . C3 . G2 . G2 . D3 . G2 . D3 . A2 . E3 . A2 . E3 . F2 . C3 . G2 . . . ' +
      'F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . A2 . E3 . C3 . G3 . G2 . D3 . G2 . . . ',
    drums: 'x . . . x . . . ',
  },
  // Harita: sakin yürüyüş
  map: {
    bpm: 112,
    leadWave: 'triangle',
    lead:
      'G4 . C5 . E5 . D5 C5 A4 . . . F4 . A4 . C5 . B4 A4 G4 . . . E4 . G4 . C5 . . . ' +
      'D5 . C5 . B4 . G4 . A4 . B4 . C5 . . . E5 . D5 C5 B4 . A4 . G4 . . . . . . . ',
    bass:
      'C3 . . . G2 . . . F2 . . . F2 . . . D3 . . . G2 . . . C3 . . . C3 . . . ' +
      'G2 . . . G2 . . . F2 . . . A2 . . . E2 . . . F2 . . . G2 . . . G2 . . . ',
    drums: 'x . . . . . . . ',
  },
  // Çöl: doğu esintili, gergin aralıklar
  desert: {
    bpm: 128,
    leadWave: 'square',
    lead:
      'E5 . F5 . G#5 . . F5 E5 . . . D5 . E5 . F5 . E5 . D5 C5 . . B4 . C5 . D5 . . . ' +
      'E5 . . E5 F5 . G#5 . A5 . G#5 . F5 . E5 . F5 . E5 D5 C5 . B4 . A4 . . . . . . . ',
    bass: 'A2 . E3 . A2 . E3 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . E2 . B2 . E2 . G#2 . ',
    drums: 'x . . x . . x . ',
  },
  // Yıldız: dokunulmazken hızlı ve coşkulu
  star: {
    bpm: 190,
    leadWave: 'square',
    lead: 'C6 . G5 C6 . G5 C6 D6 E6 . D6 C6 . G5 . . A5 . F5 A5 . F5 A5 B5 C6 . B5 A5 . G5 . . ',
    bass: 'C3 C4 C3 C4 C3 C4 C3 C4 F2 F3 F2 F3 G2 G3 G2 G3 ',
    drums: 'x . x x x . x x ',
  },
  // Kısa parçalar
  clear: {
    bpm: 200,
    leadWave: 'square',
    once: true,
    lead: 'C5 E5 G5 C6 . G5 C6 . E6 . . . . . ',
    bass: 'C3 . . . . G2 . . C3 . . . . . ',
  },
  death: {
    bpm: 180,
    leadWave: 'square',
    once: true,
    lead: 'B4 . F5 . F5 E5 . D5 . C5 . . . ',
    bass: 'G2 . . . . . . G1 . C2 . . . ',
  },
  gameover: {
    bpm: 120,
    leadWave: 'triangle',
    once: true,
    lead: 'C5 . G4 . E4 . A4 . B4 . A4 . G#4 . . . ',
    bass: 'C3 . . . A2 . . . F2 . . . E2 . . . ',
  },
};

export type TrackName = keyof typeof TRACKS;

const NOTE_INDEX: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

function freq(note: string): number {
  const m = note.match(/^([A-G]#?)(\d)$/);
  if (!m) return 0;
  const midi = NOTE_INDEX[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const parse = (s: string) => s.trim().split(/\s+/);

const LOOKAHEAD_S = 0.12;
const MASTER_VOLUME = 0.12;

class MusicPlayer {
  private ctx?: AudioContext;
  private out?: GainNode;
  private noise?: AudioBuffer;
  private track?: { name: TrackName; def: Track; lead: string[]; bass: string[]; drums: string[] };
  private step = 0;
  private nextTime = 0;
  private timer?: number;
  private paused = false;
  private onDone?: () => void;
  current: TrackName | null = null;

  /** Phaser oyunu Web Audio kullanıyorsa onun ses bağlamını paylaşır. */
  init(game: Phaser.Game) {
    const sm = game.sound as Phaser.Sound.WebAudioSoundManager;
    if (!sm.context || this.ctx) return;
    this.ctx = sm.context;
    this.out = this.ctx.createGain();
    this.out.gain.value = MASTER_VOLUME;
    this.out.connect(this.ctx.destination);
    // Davul için kısa beyaz gürültü
    const len = Math.floor(this.ctx.sampleRate * 0.05);
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  play(name: TrackName, onDone?: () => void) {
    if (this.current === name && !TRACKS[name].once && !this.paused) return;
    this.stop();
    const def = TRACKS[name];
    if (!this.ctx || !Settings.music) {
      // Müzik kapalıysa tek seferlik parçanın süresi kadar bekleyip devam et.
      if (def.once && onDone) setTimeout(onDone, this.lengthMs(def));
      return;
    }
    this.current = name;
    this.onDone = onDone;
    this.track = { name, def, lead: parse(def.lead), bass: parse(def.bass), drums: def.drums ? parse(def.drums) : [] };
    this.step = 0;
    this.paused = false;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop() {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    this.track = undefined;
    this.current = null;
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.paused || !this.ctx) return;
    this.paused = false;
    this.nextTime = this.ctx.currentTime + 0.05;
  }

  /** Ayar değişince çağrılır: kapatıldıysa durdurur, açıldıysa verilen parçayı başlatır. */
  refresh(fallback: TrackName | null) {
    if (!Settings.music) this.stop();
    else if (fallback && !this.current) this.play(fallback);
  }

  private lengthMs(def: Track) {
    return (parse(def.lead).length * 60000) / def.bpm / 2;
  }

  private schedule() {
    const ctx = this.ctx!;
    const t = this.track;
    if (!t) return;
    if (this.paused) return;
    const stepDur = 60 / t.def.bpm / 2;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const len = t.lead.length;
      if (t.def.once && this.step >= len) {
        const done = this.onDone;
        this.stop();
        done?.();
        return;
      }
      const lead = t.lead[this.step % len];
      const bass = t.bass[this.step % t.bass.length];
      if (lead !== '.') this.tone(freq(lead), this.nextTime, stepDur * 0.9, t.def.leadWave, 0.5);
      if (bass !== '.') this.tone(freq(bass), this.nextTime, stepDur * 0.95, 'triangle', 0.8);
      if (t.drums.length && t.drums[this.step % t.drums.length] === 'x') this.hat(this.nextTime);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private tone(f: number, at: number, dur: number, wave: OscillatorType, vol: number) {
    if (!f) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(g).connect(this.out!);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private hat(at: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise!;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
    src.connect(filter).connect(g).connect(this.out!);
    src.start(at);
  }
}

export const Music = new MusicPlayer();

/** Bölüm temasına göre müzik. */
export function trackForTheme(theme: string): TrackName {
  if (theme === 'purple') return 'cave';
  if (theme === 'snow') return 'sky';
  if (theme === 'stone') return 'castle';
  if (theme === 'sand') return 'desert';
  return 'overworld';
}
