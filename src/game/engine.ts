import type { GameAudio } from "./audio";
import type { Actions, Input } from "./input";

export const W = 1280;
export const H = 720;
const FLOOR = 606;
const LEFT = 210;
const RIGHT = 1070;
const GAP = 128;
const STEP = 1 / 60;

export type Screen =
  | "boot"
  | "title"
  | "howto"
  | "intro"
  | "fight"
  | "down"
  | "pause"
  | "round"
  | "result"
  | "champion";

export type Hud = {
  screen: Screen;
  playerHp: number;
  playerMax: number;
  playerStam: number;
  enemyHp: number;
  enemyMax: number;
  enemyStam: number;
  playerName: string;
  enemyName: string;
  enemyTitle: string;
  round: number;
  time: number;
  combo: number;
  heat: number;
  banner: string;
  mash: number;
  gettingUp: boolean;
  kdP: number;
  kdE: number;
  bout: number;
  result: string;
  muted: boolean;
  best: number;
  loaded: boolean;
};

type Anim = "idle" | "jab" | "hook" | "hurt" | "duck" | "block" | "down" | "win" | "roar";

type Fighter = {
  x: number;
  vx: number;
  hp: number;
  maxHp: number;
  stam: number;
  stun: number;
  invuln: number;
  anim: Anim;
  t: number;
  flash: number;
  duck: number;
  blocking: boolean;
  facing: 1 | -1;
  kd: number;
  hitLanded: boolean;
  cooldown: number;
  squash: number;
};

type OppSpec = {
  id: "spike" | "vix" | "gronk";
  name: string;
  title: string;
  hp: number;
  speed: number;
  jabBias: number;
  duck: number;
  block: number;
  agr: number;
  dmg: number;
  range: number;
  drawH: number;
};

const CARD: OppSpec[] = [
  {
    id: "spike",
    name: "SPIKE HORNS",
    title: "The Frill",
    hp: 108,
    speed: 148,
    jabBias: 0.32,
    duck: 0.1,
    block: 0.22,
    agr: 0.72,
    dmg: 1.12,
    range: 168,
    drawH: 348,
  },
  {
    id: "vix",
    name: "VIX FLICK",
    title: "The Whip",
    hp: 82,
    speed: 268,
    jabBias: 0.78,
    duck: 0.38,
    block: 0.1,
    agr: 1.05,
    dmg: 0.88,
    range: 150,
    drawH: 300,
  },
  {
    id: "gronk",
    name: "GRONK",
    title: "The Plate",
    hp: 132,
    speed: 150,
    jabBias: 0.42,
    duck: 0.16,
    block: 0.34,
    agr: 0.86,
    dmg: 1.28,
    range: 176,
    drawH: 360,
  },
];

type Attack = {
  start: number;
  active: number;
  recover: number;
  dmg: number;
  range: number;
  stam: number;
  high: boolean;
  stun: number;
  kb: number;
};

const JAB: Attack = {
  start: 0.08,
  active: 0.09,
  recover: 0.13,
  dmg: 8,
  range: 176,
  stam: 9,
  high: true,
  stun: 0.08,
  kb: 42,
};
const HOOK: Attack = {
  start: 0.16,
  active: 0.11,
  recover: 0.22,
  dmg: 17,
  range: 154,
  stam: 18,
  high: false,
  stun: 0.16,
  kb: 86,
};
const ROAR: Attack = {
  start: 0.26,
  active: 0.16,
  recover: 0.28,
  dmg: 26,
  range: 250,
  stam: 0,
  high: false,
  stun: 0.9,
  kb: 120,
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number; c: string };
type Floater = { x: number; y: number; t: number; text: string; heavy: boolean };
type Burst = { x: number; y: number; t: number };

type Assets = {
  arena: HTMLImageElement;
  portrait: HTMLImageElement;
  impact: HTMLCanvasElement[];
  ringov: Record<"idle" | "punch" | "hook" | "hurt", HTMLCanvasElement[]>;
  spike: HTMLCanvasElement[];
  vix: HTMLCanvasElement[];
  gronk: HTMLCanvasElement[];
};

function slice(img: HTMLImageElement, cols: number, rows: number): HTMLCanvasElement[] {
  const cw = Math.floor(img.width / cols);
  const ch = Math.floor(img.height / rows);
  const out: HTMLCanvasElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, c * cw, r * ch, cw, ch, 0, 0, cw, ch);
      out.push(canvas);
    }
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Missing ${src}`));
    img.src = src;
  });
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function makeFighter(x: number, facing: 1 | -1, hp: number): Fighter {
  return {
    x,
    vx: 0,
    hp,
    maxHp: hp,
    stam: 100,
    stun: 0,
    invuln: 0,
    anim: "idle",
    t: 0,
    flash: 0,
    duck: 0,
    blocking: false,
    facing,
    kd: 0,
    hitLanded: false,
    cooldown: 0,
    squash: 1,
  };
}

const SAVE = "dino-ringov-v1";

export class Engine {
  hud: Hud;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  private audio: GameAudio;
  private assets: Assets | null = null;
  private raf = 0;
  private acc = 0;
  private last = 0;
  private running = false;
  private screen: Screen = "boot";
  private pausedFrom: Screen = "fight";
  private player!: Fighter;
  private enemy!: Fighter;
  private spec!: OppSpec;
  private bout = 0;
  private round = 1;
  private time = 45;
  private combo = 0;
  private comboT = 0;
  private heat = 0;
  private banner = "";
  private bannerT = 0;
  private mash = 0;
  private downWho: "p" | "e" | null = null;
  private downT = 0;
  private introT = 0;
  private result = "";
  private trauma = 0;
  private hitstop = 0;
  private parts: Particle[] = [];
  private floats: Floater[] = [];
  private bursts: Burst[] = [];
  private buf = { jab: 0, hook: 0, roar: 0 };
  private reduced = false;
  private onHud: (h: Hud) => void;
  private hudTick = 0;
  private best = 0;

  constructor(
    canvas: HTMLCanvasElement,
    input: Input,
    audio: GameAudio,
    onHud: (h: Hud) => void,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.input = input;
    this.audio = audio;
    this.onHud = onHud;
    this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    try {
      this.best = Number(localStorage.getItem(SAVE) ?? "0") || 0;
    } catch {
      this.best = 0;
    }
    this.hud = this.snapshot();
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVis);
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.audio.crowd(false);
  }

  async boot() {
    const [arena, portrait, impact, idle, punch, hook, hurt, spike, vix, gronk] = await Promise.all([
      loadImage("/art/arena.jpg"),
      loadImage("/art/ringov.png"),
      loadImage("/sprites/impact.png"),
      loadImage("/sprites/ringov-idle.png"),
      loadImage("/sprites/ringov-punch.png"),
      loadImage("/sprites/ringov-hook.png"),
      loadImage("/sprites/ringov-hurt.png"),
      loadImage("/sprites/spike-idle.png"),
      loadImage("/sprites/vix-idle.png"),
      loadImage("/sprites/gronk-idle.png"),
    ]);
    this.assets = {
      arena,
      portrait,
      impact: slice(impact, 2, 2),
      ringov: {
        idle: slice(idle, 2, 2),
        punch: slice(punch, 2, 2),
        hook: slice(hook, 2, 2),
        hurt: slice(hurt, 2, 2),
      },
      spike: slice(spike, 2, 2),
      vix: slice(vix, 2, 2),
      gronk: slice(gronk, 2, 2),
    };
    this.screen = "title";
    this.pushHud();
    this.startLoop();
  }

  startCareer() {
    this.bout = 0;
    this.beginBout();
  }

  startBout(i: number) {
    this.bout = i;
    this.beginBout();
  }

  openHowto() {
    this.screen = "howto";
    this.pushHud();
  }

  toTitle() {
    this.screen = "title";
    this.audio.crowd(false);
    this.pushHud();
  }

  toggleMute() {
    this.audio.setMuted(!this.audio.muted);
    this.pushHud();
  }

  private onVis = () => {
    if (document.hidden) {
      if (this.screen === "fight" || this.screen === "down" || this.screen === "intro") {
        this.pausedFrom = this.screen;
        this.screen = "pause";
        this.audio.crowd(false);
        this.pushHud();
      }
    } else {
      this.audio.resume();
    }
  };

  private beginBout() {
    this.spec = CARD[this.bout]!;
    this.player = makeFighter(430, 1, 100);
    this.enemy = makeFighter(850, -1, this.spec.hp);
    this.round = 1;
    this.time = 45;
    this.combo = 0;
    this.heat = 0;
    this.result = "";
    this.goIntro();
  }

  private goIntro() {
    this.screen = "intro";
    this.introT = 2.4;
    this.banner = `ROUND ${this.round}`;
    this.bannerT = 1.1;
    this.audio.bell();
    this.audio.crowd(true);
    this.pushHud();
  }

  private resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private startLoop() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.1) dt = 0.1;
      this.acc += dt;
      const actions = this.input.poll();
      this.handleMeta(actions);
      while (this.acc >= STEP) {
        if (this.hitstop > 0) this.hitstop -= STEP;
        else this.step(actions);
        this.acc -= STEP;
      }
      this.draw();
      this.hudTick += dt;
      if (this.hudTick > 0.08) {
        this.hudTick = 0;
        this.pushHud();
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private handleMeta(a: Actions) {
    if (this.screen === "title") {
      if (a.confirmJust || a.jabJust) this.startCareer();
      return;
    }
    if (this.screen === "howto") {
      if (a.confirmJust || a.jabJust || a.pauseJust) {
        this.screen = "title";
        this.pushHud();
      }
      return;
    }
    if (this.screen === "pause") {
      if (a.pauseJust || a.confirmJust) this.resume();
      return;
    }
    if (this.screen === "result") {
      if (a.confirmJust || a.jabJust) this.afterResult();
      return;
    }
    if (this.screen === "champion") {
      if (a.confirmJust || a.jabJust) {
        this.screen = "title";
        this.audio.crowd(false);
        this.pushHud();
      }
      return;
    }
    if (a.pauseJust && (this.screen === "fight" || this.screen === "intro" || this.screen === "down")) {
      this.pausedFrom = this.screen;
      this.screen = "pause";
      this.audio.crowd(false);
      this.pushHud();
    }
  }

  resume() {
    if (this.screen !== "pause") return;
    this.screen = this.pausedFrom;
    if (this.screen === "fight" || this.screen === "intro" || this.screen === "down") this.audio.crowd(true);
    this.pushHud();
  }

  continueFromResult() {
    this.afterResult();
  }

  private afterResult() {
    if (this.result === "win") {
      if (this.bout >= CARD.length - 1) {
        this.screen = "champion";
        this.best = Math.max(this.best, 3);
        try {
          localStorage.setItem(SAVE, String(this.best));
        } catch {
          /* ignore */
        }
        this.audio.crowd(true);
        this.pushHud();
        return;
      }
      this.bout += 1;
      this.best = Math.max(this.best, this.bout);
      try {
        localStorage.setItem(SAVE, String(this.best));
      } catch {
        /* ignore */
      }
      this.beginBout();
      return;
    }
    this.beginBout();
  }

  private step(a: Actions) {
    const dt = STEP;
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.comboT = Math.max(0, this.comboT - dt);
    if (this.comboT <= 0) this.combo = 0;
    this.bannerT = Math.max(0, this.bannerT - dt);
    if (this.bannerT <= 0) this.banner = "";

    for (const p of this.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const f of this.floats) f.t -= dt;
    this.floats = this.floats.filter((f) => f.t > 0);
    for (const b of this.bursts) b.t -= dt;
    this.bursts = this.bursts.filter((b) => b.t > 0);

    if (this.screen === "intro") {
      this.idlePose(this.player, dt);
      this.idlePose(this.enemy, dt);
      this.introT -= dt;
      if (this.introT < 1.2 && this.banner === `ROUND ${this.round}`) {
        this.banner = "FIGHT";
        this.bannerT = 0.7;
      }
      if (this.introT <= 0) {
        this.screen = "fight";
        this.time = 45;
      }
      return;
    }

    if (this.screen === "round") {
      this.idlePose(this.player, dt);
      this.idlePose(this.enemy, dt);
      this.introT -= dt;
      if (this.introT <= 0) this.goIntro();
      return;
    }

    if (this.screen === "result" || this.screen === "champion" || this.screen === "title" || this.screen === "howto") {
      if (this.player) this.idlePose(this.player, dt);
      if (this.enemy) this.idlePose(this.enemy, dt);
      return;
    }

    if (this.screen === "down") {
      this.tickDown(a, dt);
      return;
    }

    if (this.screen !== "fight") return;

    this.time -= dt;
    if (this.time <= 0) {
      this.time = 0;
      this.endRound();
      return;
    }

    this.buf.jab = Math.max(0, this.buf.jab - dt);
    this.buf.hook = Math.max(0, this.buf.hook - dt);
    this.buf.roar = Math.max(0, this.buf.roar - dt);
    if (a.jabJust) this.buf.jab = 0.14;
    if (a.hookJust) this.buf.hook = 0.14;
    if (a.roarJust) this.buf.roar = 0.16;

    this.control(this.player, a, dt, true);
    this.ai(dt);
    this.control(this.enemy, this.aiActions, dt, false);

    this.integrate(this.player, dt);
    this.integrate(this.enemy, dt);
    this.separate();
    this.resolveHits(this.player, this.enemy, 1);
    this.resolveHits(this.enemy, this.enemyIsPlayer(), -1);
  }

  private enemyIsPlayer(): Fighter {
    return this.player;
  }

  private aiActions: Actions = {
    moveX: 0,
    duck: false,
    block: false,
    jab: false,
    hook: false,
    roar: false,
    pause: false,
    confirm: false,
    jabJust: false,
    hookJust: false,
    roarJust: false,
    pauseJust: false,
    confirmJust: false,
  };

  private ai(dt: number) {
    const e = this.enemy;
    const p = this.player;
    const a = this.aiActions;
    a.moveX = 0;
    a.duck = false;
    a.block = false;
    a.jab = false;
    a.hook = false;
    a.jabJust = false;
    a.hookJust = false;
    a.roar = false;
    a.roarJust = false;
    if (e.stun > 0 || e.anim === "hurt" || e.anim === "down") return;
    const dist = Math.abs(e.x - p.x);
    const prefer = this.spec.range + 10;
    if (dist > prefer + 36) a.moveX = Math.sign(p.x - e.x);
    else if (dist < prefer - 50) a.moveX = Math.sign(e.x - p.x);
    else if (Math.random() < 0.35 * dt) a.moveX = Math.random() < 0.5 ? -1 : 1;

    const incoming = p.anim === "jab" || p.anim === "hook" || p.anim === "roar";
    if (incoming && p.t < JAB.start + JAB.active + 0.05) {
      if (p.anim === "jab" && Math.random() < this.spec.duck) a.duck = true;
      else if (Math.random() < this.spec.block) a.block = true;
    }

    if (e.cooldown <= 0 && dist < this.spec.range + 24 && e.stam > 16) {
      if (Math.random() < this.spec.agr * dt * 1.8) {
        if (Math.random() < this.spec.jabBias) {
          a.jabJust = true;
          a.jab = true;
        } else {
          a.hookJust = true;
          a.hook = true;
        }
      }
    }
  }

  private control(f: Fighter, a: Actions, dt: number, isPlayer: boolean) {
    f.stun = Math.max(0, f.stun - dt);
    f.invuln = Math.max(0, f.invuln - dt);
    f.flash = Math.max(0, f.flash - dt);
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.squash += (1 - f.squash) * (1 - Math.exp(-12 * dt));
    const busy = f.anim === "jab" || f.anim === "hook" || f.anim === "hurt" || f.anim === "down" || f.anim === "roar";
    const attacking = f.anim === "jab" || f.anim === "hook" || f.anim === "roar";

    if (!busy) {
      if (isPlayer) {
        if (this.buf.roar > 0 && this.heat >= 100 && f.stun <= 0) {
          this.buf.roar = 0;
          this.startAttack(f, "roar");
          this.heat = 0;
          this.audio.roar();
          this.addTrauma(0.35);
        } else if (this.buf.hook > 0 && f.stam >= HOOK.stam && f.stun <= 0) {
          this.buf.hook = 0;
          this.startAttack(f, "hook");
          this.audio.whoosh();
        } else if (this.buf.jab > 0 && f.stam >= JAB.stam && f.stun <= 0) {
          this.buf.jab = 0;
          this.startAttack(f, "jab");
          this.audio.whoosh();
        }
      } else if (a.hookJust && f.stam >= HOOK.stam) {
        this.startAttack(f, "hook");
        this.audio.whoosh();
      } else if (a.jabJust && f.stam >= JAB.stam) {
        this.startAttack(f, "jab");
        this.audio.whoosh();
      }
    }

    if (f.anim === "jab" || f.anim === "hook" || f.anim === "roar") {
      f.t += dt;
      const atk = f.anim === "jab" ? JAB : f.anim === "hook" ? HOOK : ROAR;
      const total = atk.start + atk.active + atk.recover;
      if (f.t >= total) {
        f.anim = "idle";
        f.t = 0;
        f.cooldown = 0.08;
      }
      f.vx *= Math.exp(-6 * dt);
      return;
    }

    if (f.anim === "hurt") {
      f.t += dt;
      if (f.t >= (f.hp < f.maxHp * 0.25 ? 0.42 : 0.28)) {
        f.anim = "idle";
        f.t = 0;
      }
      f.vx *= Math.exp(-5 * dt);
      return;
    }

    if (f.anim === "down") return;

    const wantDuck = a.duck && !attacking;
    f.duck += ((wantDuck ? 1 : 0) - f.duck) * (1 - Math.exp(-18 * dt));
    if (wantDuck && f.duck > 0.6 && f.anim !== "duck") {
      f.anim = "duck";
      if (isPlayer) this.audio.duck();
    } else if (!wantDuck && f.anim === "duck") {
      f.anim = "idle";
    }

    f.blocking = a.block && !wantDuck && !attacking && f.stam > 4;
    if (f.blocking) {
      f.anim = "block";
      f.stam = Math.max(0, f.stam - 16 * dt);
    } else if (f.anim === "block") {
      f.anim = "idle";
    }

    if (!f.blocking && f.duck < 0.4) {
      const spd = isPlayer ? 230 : this.spec.speed;
      f.vx = a.moveX * spd * (f.duck > 0.3 ? 0.4 : 1);
      if (Math.abs(a.moveX) > 0.2) f.anim = "idle";
    } else {
      f.vx *= Math.exp(-10 * dt);
    }

    const regen = f.blocking ? 6 : 28;
    f.stam = Math.min(100, f.stam + regen * dt);
    f.t += dt;
  }

  private startAttack(f: Fighter, kind: "jab" | "hook" | "roar") {
    const atk = kind === "jab" ? JAB : kind === "hook" ? HOOK : ROAR;
    f.anim = kind;
    f.t = 0;
    f.hitLanded = false;
    f.stam = Math.max(0, f.stam - atk.stam);
    f.duck = 0;
    f.blocking = false;
    f.squash = 1.08;
    f.vx += f.facing * (kind === "hook" ? 90 : kind === "roar" ? 40 : 50);
  }

  private integrate(f: Fighter, dt: number) {
    f.x += f.vx * dt;
    f.x = clamp(f.x, LEFT, RIGHT);
  }

  private separate() {
    const p = this.player;
    const e = this.enemy;
    if (e.x - p.x < GAP) {
      const mid = (p.x + e.x) / 2;
      p.x = mid - GAP / 2;
      e.x = mid + GAP / 2;
      p.x = clamp(p.x, LEFT, RIGHT);
      e.x = clamp(e.x, LEFT, RIGHT);
    }
  }

  private resolveHits(atkF: Fighter, defF: Fighter, dir: number) {
    if (atkF.anim !== "jab" && atkF.anim !== "hook" && atkF.anim !== "roar") return;
    if (atkF.hitLanded) return;
    const atk = atkF.anim === "jab" ? JAB : atkF.anim === "hook" ? HOOK : ROAR;
    if (atkF.t < atk.start || atkF.t > atk.start + atk.active) return;
    const dist = Math.abs(defF.x - atkF.x);
    if (dist > atk.range) return;
    if (defF.invuln > 0 || defF.anim === "down") return;
    if (atk.high && defF.duck > 0.55) {
      atkF.hitLanded = true;
      this.float(defF.x, FLOOR - 260, "SLIP", false);
      return;
    }
    atkF.hitLanded = true;
    const blocked = defF.blocking && defF.stam > 2;
    let dmg = atk.dmg;
    if (atkF !== this.player) dmg *= this.spec.dmg;
    if (this.combo >= 3 && atkF === this.player) dmg *= 1.15;
    if (blocked) {
      dmg *= 0.3;
      defF.stam = Math.max(0, defF.stam - 12);
      this.audio.block();
      this.addTrauma(0.12);
      this.burst(defF.x - dir * 40, FLOOR - 210);
      this.float(defF.x, FLOOR - 240, "BLOCK", false);
      defF.vx += dir * 30;
      return;
    }
    defF.hp = Math.max(0, defF.hp - dmg);
    defF.anim = "hurt";
    defF.t = 0;
    defF.flash = 0.09;
    defF.stun = atk.stun;
    defF.invuln = 0.12;
    defF.vx = dir * atk.kb;
    defF.squash = 0.86;
    this.hitstop = atk.high ? 0.045 : 0.08;
    if (atkF.anim === "roar") this.hitstop = 0.12;
    this.addTrauma(atkF.anim === "hook" || atkF.anim === "roar" ? 0.55 : 0.28);
    this.audio.hit(atkF.anim !== "jab");
    this.audio.swell();
    this.burst((atkF.x + defF.x) / 2, FLOOR - 200);
    this.dust(defF.x, FLOOR - 20, dir);
    const shown = Math.round(dmg);
    this.float(defF.x, FLOOR - 250, String(shown), atkF.anim !== "jab");
    if (atkF === this.player) {
      this.combo += 1;
      this.comboT = 1.4;
      this.heat = Math.min(100, this.heat + (atkF.anim === "jab" ? 14 : atkF.anim === "hook" ? 22 : 0));
    } else {
      this.combo = 0;
    }
    if (defF.hp <= 0) this.knockDown(defF === this.player ? "p" : "e");
  }

  private knockDown(who: "p" | "e") {
    const f = who === "p" ? this.player : this.enemy;
    f.anim = "down";
    f.t = 0;
    f.hp = 0;
    f.kd += 1;
    f.vx = who === "p" ? -80 : 80;
    this.downWho = who;
    this.downT = 3.2;
    this.mash = 0;
    this.screen = "down";
    this.banner = f.kd >= 3 ? "T.K.O." : "DOWN";
    this.bannerT = 1.2;
    this.audio.ko();
    this.addTrauma(0.8);
    this.pushHud();
  }

  private tickDown(a: Actions, dt: number) {
    this.idlePose(this.player.anim === "down" ? this.enemy : this.player, dt);
    const f = this.downWho === "p" ? this.player : this.enemy;
    f.t += dt;
    this.downT -= dt;
    if (f.kd >= 3) {
      if (this.downT < 2.2 && this.banner !== "T.K.O.") {
        this.banner = "T.K.O.";
        this.bannerT = 1.4;
      }
      if (this.downT <= 1.4) this.finishBout(this.downWho === "e" ? "win" : "lose");
      return;
    }
    if (this.downWho === "p") {
      if (a.jabJust || a.hookJust || a.confirmJust) this.mash += 0.17;
      this.mash = Math.max(0, this.mash - dt * 0.12);
      if (this.mash >= 1) {
        this.getUp(this.player, 28);
        return;
      }
      if (this.downT <= 0) this.finishBout("lose");
    } else {
      this.mash = clamp((3.2 - this.downT) / 1.6, 0, 1);
      if (this.downT <= 1.5) this.getUp(this.enemy, 22);
    }
  }

  private getUp(f: Fighter, hp: number) {
    f.hp = hp;
    f.anim = "idle";
    f.t = 0;
    f.invuln = 0.7;
    f.flash = 0.2;
    f.stam = 50;
    this.screen = "fight";
    this.downWho = null;
    this.mash = 0;
    this.banner = "FIGHT";
    this.bannerT = 0.5;
    this.pushHud();
  }

  private endRound() {
    this.round += 1;
    if (this.round > 3) {
      this.finishBout(this.player.hp >= this.enemy.hp ? "win" : "lose");
      return;
    }
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 12);
    this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + 10);
    this.player.stam = 100;
    this.enemy.stam = 100;
    this.player.anim = "idle";
    this.enemy.anim = "idle";
    this.player.x = 430;
    this.enemy.x = 850;
    this.screen = "round";
    this.introT = 1.1;
    this.banner = "END OF ROUND";
    this.bannerT = 1;
    this.audio.bell();
    this.pushHud();
  }

  private finishBout(result: "win" | "lose") {
    this.result = result;
    this.screen = "result";
    this.banner = result === "win" ? "K.O." : "DEFEAT";
    this.bannerT = 1.6;
    if (result === "win") {
      this.player.anim = "win";
      this.enemy.anim = "down";
    } else {
      this.player.anim = "down";
      this.enemy.anim = "win";
    }
    this.audio.bell();
    this.pushHud();
  }

  private idlePose(f: Fighter, dt: number) {
    if (f.anim !== "down" && f.anim !== "hurt") {
      if (f.anim !== "win") f.anim = "idle";
      f.t += dt;
    } else {
      f.t += dt;
    }
    f.flash = Math.max(0, f.flash - dt);
  }

  private addTrauma(n: number) {
    if (this.reduced) return;
    this.trauma = clamp(this.trauma + n, 0, 1);
  }

  private burst(x: number, y: number) {
    this.bursts.push({ x, y, t: 0.28 });
  }

  private dust(x: number, y: number, dir: number) {
    for (let i = 0; i < 10; i++) {
      this.parts.push({
        x: x + (Math.random() - 0.5) * 30,
        y,
        vx: dir * (40 + Math.random() * 120) + (Math.random() - 0.5) * 60,
        vy: -40 - Math.random() * 120,
        life: 0.35 + Math.random() * 0.25,
        max: 0.55,
        s: 3 + Math.random() * 5,
        c: "rgba(232,212,170,0.7)",
      });
    }
  }

  private float(x: number, y: number, text: string, heavy: boolean) {
    this.floats.push({ x, y, t: 0.7, text, heavy });
  }

  private draw() {
    const ctx = this.ctx;
    const shake = this.trauma * this.trauma;
    const ox = this.reduced ? 0 : (Math.random() - 0.5) * 18 * shake;
    const oy = this.reduced ? 0 : (Math.random() - 0.5) * 12 * shake;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.translate(ox, oy);

    const assets = this.assets;
    if (assets) {
      const a = assets.arena;
      ctx.drawImage(a, 0, a.height * 0.04, a.width, a.height * 0.78, -20, -30, W + 40, H + 50);
    } else {
      ctx.fillStyle = "#1a140c";
      ctx.fillRect(0, 0, W, H);
    }

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(8,6,4,0.18)");
    g.addColorStop(0.55, "rgba(8,6,4,0)");
    g.addColorStop(1, "rgba(10,8,5,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (this.player && this.enemy && this.screen !== "boot") {
      this.drawFighter(this.player, true);
      this.drawFighter(this.enemy, false);
    }

    if (assets) {
      for (const b of this.bursts) {
        const i = Math.min(3, Math.floor((1 - b.t / 0.28) * 4));
        const fr = assets.impact[i]!;
        const s = 160;
        ctx.save();
        ctx.globalAlpha = clamp(b.t / 0.12, 0, 1);
        ctx.drawImage(fr, b.x - s / 2, b.y - s / 2, s, s);
        ctx.restore();
      }
    }

    for (const p of this.parts) {
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.font = "700 34px Barlow, sans-serif";
    ctx.textAlign = "center";
    for (const f of this.floats) {
      ctx.globalAlpha = clamp(f.t / 0.2, 0, 1);
      ctx.fillStyle = f.heavy ? "#f3e6c8" : "#e8e0d4";
      ctx.strokeStyle = "rgba(18,16,12,0.65)";
      ctx.lineWidth = 6;
      const y = f.y - (0.7 - f.t) * 50;
      ctx.strokeText(f.text, f.x, y);
      ctx.fillText(f.text, f.x, y);
      ctx.globalAlpha = 1;
    }

    if (this.banner && this.screen !== "title") {
      ctx.save();
      ctx.globalAlpha = clamp(this.bannerT / 0.15, 0, 1);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(18,16,12,0.45)";
      ctx.fillRect(W * 0.18, H * 0.38, W * 0.64, 110);
      ctx.font = "120px Bebas Neue, sans-serif";
      ctx.fillStyle = "#f3e6c8";
      ctx.fillText(this.banner, W / 2, H * 0.38 + 92);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawFighter(f: Fighter, isPlayer: boolean) {
    const assets = this.assets;
    if (!assets) return;
    const frames = isPlayer ? this.playerFrames(f) : this.enemyFrames(f);
    const idx = this.frameIndex(f, frames.length);
    const fr = frames[idx]!;
    let h = isPlayer ? 338 : this.spec.drawH;
    if (f.anim === "duck" || f.duck > 0.4) h *= 0.78;
    if (f.anim === "down") h *= 0.72;
    h *= f.squash;
    const w = (fr.width / fr.height) * h;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(f.x, FLOOR);
    ctx.scale(f.facing, 1);
    if (f.flash > 0) ctx.filter = "brightness(2.6) saturate(0.4)";
    if (f.anim === "down") ctx.rotate(-0.42);
    ctx.drawImage(fr, -w / 2, -h, w, h);
    ctx.restore();
  }

  private playerFrames(f: Fighter): HTMLCanvasElement[] {
    const r = this.assets!.ringov;
    if (f.anim === "jab") return r.punch;
    if (f.anim === "hook" || f.anim === "roar") return r.hook;
    if (f.anim === "hurt" || f.anim === "down") return r.hurt;
    return r.idle;
  }

  private enemyFrames(f: Fighter): HTMLCanvasElement[] {
    const base = this.assets![this.spec.id];
    return base;
  }

  private frameIndex(f: Fighter, n: number) {
    if (f.anim === "jab" || f.anim === "hook" || f.anim === "roar") {
      const atk = f.anim === "jab" ? JAB : f.anim === "hook" ? HOOK : ROAR;
      const total = atk.start + atk.active + atk.recover;
      const p = clamp(f.t / total, 0, 0.999);
      return Math.min(n - 1, Math.floor(p * n));
    }
    if (f.anim === "hurt") return Math.min(n - 1, Math.floor(clamp(f.t / 0.28, 0, 0.999) * n));
    if (f.anim === "down") return n - 1;
    const fps = Math.abs(f.vx) > 20 ? 10 : 6;
    return Math.floor(f.t * fps) % n;
  }

  private snapshot(): Hud {
    return {
      screen: this.screen,
      playerHp: this.player?.hp ?? 100,
      playerMax: this.player?.maxHp ?? 100,
      playerStam: this.player?.stam ?? 100,
      enemyHp: this.enemy?.hp ?? 100,
      enemyMax: this.enemy?.maxHp ?? 100,
      enemyStam: this.enemy?.stam ?? 100,
      playerName: "RINGOV",
      enemyName: this.spec?.name ?? "CHALLENGER",
      enemyTitle: this.spec?.title ?? "",
      round: this.round,
      time: this.time,
      combo: this.combo,
      heat: this.heat,
      banner: this.banner,
      mash: this.mash,
      gettingUp: this.screen === "down" && this.downWho === "p" && (this.player?.kd ?? 0) < 3,
      kdP: this.player?.kd ?? 0,
      kdE: this.enemy?.kd ?? 0,
      bout: this.bout,
      result: this.result,
      muted: this.audio.muted,
      best: this.best,
      loaded: this.assets !== null,
    };
  }

  private pushHud() {
    this.hud = this.snapshot();
    this.onHud(this.hud);
    (window as unknown as { __dino?: Hud }).__dino = this.hud;
  }
}
