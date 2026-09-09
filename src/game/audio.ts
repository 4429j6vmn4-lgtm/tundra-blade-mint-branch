export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  muted = false;
  private crowdLoop: { noise: AudioBufferSourceNode; gain: GainNode } | null = null;

  unlock() {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const master = ctx.createGain();
      const sfx = ctx.createGain();
      const music = ctx.createGain();
      sfx.gain.value = 0.85;
      music.gain.value = 0.28;
      master.gain.value = this.muted ? 0 : 0.7;
      sfx.connect(master);
      music.connect(master);
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      this.sfx = sfx;
      this.music = music;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(next ? 0 : 0.7, this.ctx.currentTime, 0.02);
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private env(duration: number, peak = 0.4, attack = 0.006): GainNode | null {
    if (!this.ctx || !this.sfx) return null;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    g.connect(this.sfx);
    return g;
  }

  private osc(type: OscillatorType, freq: number, duration: number, peak = 0.2, slide?: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = type;
    const t = this.ctx.currentTime;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + duration);
    const g = this.env(duration, peak);
    if (!g) return;
    o.connect(g);
    o.start(t);
    o.stop(t + duration + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  private noise(duration: number, peak: number, hp = 400, lp = 2400) {
    if (!this.ctx || !this.sfx) return;
    const n = this.ctx.sampleRate;
    const frames = Math.floor(n * duration);
    const buf = this.ctx.createBuffer(1, frames, n);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = (hp + lp) / 2;
    filter.Q.value = 0.7;
    const g = this.env(duration, peak, 0.003);
    if (!g) return;
    src.connect(filter);
    filter.connect(g);
    src.start();
    src.stop(this.ctx.currentTime + duration + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  jab() {
    this.noise(0.07, 0.18, 1200, 5000);
    this.osc("triangle", 420, 0.08, 0.08, 0.5);
  }

  hook() {
    this.noise(0.12, 0.28, 200, 1400);
    this.osc("sine", 140, 0.16, 0.22, 0.45);
  }

  whoosh() {
    this.noise(0.09, 0.12, 1800, 6000);
    this.osc("sine", 380, 0.1, 0.05, 1.8);
  }

  hit(heavy: boolean) {
    this.noise(heavy ? 0.18 : 0.1, heavy ? 0.4 : 0.24, 120, heavy ? 900 : 1800);
    this.osc("sine", heavy ? 90 : 160, heavy ? 0.22 : 0.12, heavy ? 0.32 : 0.16, 0.4);
    if (heavy) this.osc("triangle", 55, 0.18, 0.18, 0.5);
  }

  block() {
    this.noise(0.08, 0.16, 800, 3000);
    this.osc("square", 520, 0.06, 0.05, 0.7);
  }

  duck() {
    this.osc("sine", 220, 0.07, 0.06, 0.6);
  }

  bell() {
    this.osc("sine", 880, 0.9, 0.2);
    this.osc("sine", 1320, 0.7, 0.08);
    setTimeout(() => {
      this.osc("sine", 880, 0.7, 0.16);
    }, 220);
  }

  roar() {
    this.osc("sawtooth", 90, 0.55, 0.18, 0.7);
    this.noise(0.4, 0.22, 80, 600);
  }

  ko() {
    this.osc("sine", 180, 0.5, 0.2, 0.3);
    this.osc("triangle", 70, 0.7, 0.25, 0.4);
    this.noise(0.35, 0.3, 80, 500);
  }

  crowd(on: boolean) {
    if (!this.ctx || !this.music) return;
    if (!on) {
      if (this.crowdLoop) {
        const t = this.ctx.currentTime;
        this.crowdLoop.gain.gain.setTargetAtTime(0.0001, t, 0.08);
        const node = this.crowdLoop;
        this.crowdLoop = null;
        setTimeout(() => {
          try {
            node.noise.stop();
            node.noise.disconnect();
            node.gain.disconnect();
          } catch {
            /* already stopped */
          }
        }, 400);
      }
      return;
    }
    if (this.crowdLoop) return;
    const frames = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.music);
    src.start();
    g.gain.setTargetAtTime(0.45, this.ctx.currentTime, 0.2);
    this.crowdLoop = { noise: src, gain: g };
  }

  swell() {
    if (!this.ctx || !this.crowdLoop) return;
    const t = this.ctx.currentTime;
    const g = this.crowdLoop.gain.gain;
    g.setTargetAtTime(0.85, t, 0.03);
    g.setTargetAtTime(0.45, t + 0.35, 0.12);
  }
}
