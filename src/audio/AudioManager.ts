const STORAGE_KEY = "pinata-audio-v1";
const MASTER_GAIN = 0.35;
const MUSIC_GAIN = 0.08;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function loadVolumes(): { master: number; sfx: number; music: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { master: 1, sfx: 1, music: 1 };
    const parsed = JSON.parse(raw) as { master?: unknown; sfx?: unknown; music?: unknown };
    return {
      master: typeof parsed.master === "number" ? clamp01(parsed.master) : 1,
      sfx: typeof parsed.sfx === "number" ? clamp01(parsed.sfx) : 1,
      music: typeof parsed.music === "number" ? clamp01(parsed.music) : 1,
    };
  } catch {
    return { master: 1, sfx: 1, music: 1 };
  }
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private masterVolume = 1;
  private sfxVolume = 1;
  private musicVolume = 1;
  muted = true;
  unlocked = false;

  constructor() {
    const saved = loadVolumes();
    this.masterVolume = saved.master;
    this.sfxVolume = saved.sfx;
    this.musicVolume = saved.music;
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  setMasterVolume(value: number): void {
    this.masterVolume = clamp01(value);
    this.applyVolumes();
    this.saveVolumes();
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = clamp01(value);
    this.applyVolumes();
    this.saveVolumes();
  }

  setMusicVolume(value: number): void {
    this.musicVolume = clamp01(value);
    this.applyVolumes();
    this.saveVolumes();
  }

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.master);
    this.applyVolumes();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.unlocked = true;
    this.muted = false;
    this.startMusicBed();
  }

  private ensure(): AudioContext | null {
    if (!this.unlocked || this.muted || !this.ctx || !this.sfxGain) return null;
    return this.ctx;
  }

  private noiseBuffer(duration: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = rngNoise();
    return buf;
  }

  hit(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g);
    g.connect(this.sfxGain);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.06);
    const ng = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    ng.gain.setValueAtTime(0.35, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
    noise.start(t);
    noise.stop(t + 0.06);
  }

  break(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.35);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.35);

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 320 + i * 140 + Math.random() * 40;
      og.gain.setValueAtTime(0.12, t + i * 0.03);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.2 + i * 0.03);
      osc.connect(og);
      og.connect(this.sfxGain);
      osc.start(t + i * 0.03);
      osc.stop(t + 0.25);
    }
  }

  ui(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.06);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  countdown(kind: "count" | "go"): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = kind === "go" ? "triangle" : "sine";
    if (kind === "go") {
      osc.frequency.setValueAtTime(392, t);
      osc.frequency.exponentialRampToValueAtTime(784, t + 0.16);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    } else {
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(330, t + 0.14);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    }
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + (kind === "go" ? 0.24 : 0.18));
  }

  zap(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(920 + Math.random() * 180, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.1);
    const ng = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1800;
    ng.gain.setValueAtTime(0.22, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.1);
  }

  shockwave(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.22);
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.26);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.18);
    const ng = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.18);
    ng.gain.setValueAtTime(0.28, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  phantom(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1480, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.16);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.12);
    const ng = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    ng.gain.setValueAtTime(0.16, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.12);
  }

  crit(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  combo(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(1040, t + 0.12);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  rage(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.18);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.24);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.16);
    const ng = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 700;
    ng.gain.setValueAtTime(0.2, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.16);
  }

  tantrum(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.16);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.14);
    const ng = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    ng.gain.setValueAtTime(0.22, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.14);
  }

  candyRain(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 520 + i * 160 + Math.random() * 40;
      const start = t + i * 0.045;
      g.gain.setValueAtTime(0.14, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.2);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.22);
    const ng = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1400;
    ng.gain.setValueAtTime(0.16, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    noise.connect(filter);
    filter.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.22);
  }

  ignite(): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.22);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(420, t + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.22);
  }

  private applyVolumes(): void {
    if (this.master) this.master.gain.value = MASTER_GAIN * this.masterVolume;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
    if (this.musicGain) this.musicGain.gain.value = MUSIC_GAIN * this.musicVolume;
  }

  private saveVolumes(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          master: this.masterVolume,
          sfx: this.sfxVolume,
          music: this.musicVolume,
        }),
      );
    } catch {
      // Ignore quota / private-mode failures.
    }
  }

  private startMusicBed(): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const notes = [262, 330, 392, 523, 392, 330];
    let i = 0;
    const play = () => {
      if (!this.unlocked || this.muted || !this.musicGain) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = notes[i % notes.length]!;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.3);
      i++;
      this.musicTimer = window.setTimeout(play, 320);
    };
    play();
  }

  dispose(): void {
    if (this.musicTimer != null) window.clearTimeout(this.musicTimer);
    void this.ctx?.close();
  }
}

function rngNoise(): number {
  return Math.random() * 2 - 1;
}
