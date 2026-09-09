import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, i as Play, n as Volume2, t as VolumeX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D7WWloCf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var W = 1280;
var FLOOR = 606;
var LEFT = 210;
var RIGHT = 1070;
var GAP = 128;
var STEP = 1 / 60;
var CARD = [
	{
		id: "spike",
		name: "SPIKE HORNS",
		title: "The Frill",
		hp: 108,
		speed: 148,
		jabBias: .32,
		duck: .1,
		block: .22,
		agr: .72,
		dmg: 1.12,
		range: 168,
		drawH: 348
	},
	{
		id: "vix",
		name: "VIX FLICK",
		title: "The Whip",
		hp: 82,
		speed: 268,
		jabBias: .78,
		duck: .38,
		block: .1,
		agr: 1.05,
		dmg: .88,
		range: 150,
		drawH: 300
	},
	{
		id: "gronk",
		name: "GRONK",
		title: "The Plate",
		hp: 132,
		speed: 150,
		jabBias: .42,
		duck: .16,
		block: .34,
		agr: .86,
		dmg: 1.28,
		range: 176,
		drawH: 360
	}
];
var JAB = {
	start: .08,
	active: .09,
	recover: .13,
	dmg: 8,
	range: 176,
	stam: 9,
	high: true,
	stun: .08,
	kb: 42
};
var HOOK = {
	start: .16,
	active: .11,
	recover: .22,
	dmg: 17,
	range: 154,
	stam: 18,
	high: false,
	stun: .16,
	kb: 86
};
var ROAR = {
	start: .26,
	active: .16,
	recover: .28,
	dmg: 26,
	range: 250,
	stam: 0,
	high: false,
	stun: .9,
	kb: 120
};
function slice(img, cols, rows) {
	const cw = Math.floor(img.width / cols);
	const ch = Math.floor(img.height / rows);
	const out = [];
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const canvas = document.createElement("canvas");
		canvas.width = cw;
		canvas.height = ch;
		canvas.getContext("2d").drawImage(img, c * cw, r * ch, cw, ch, 0, 0, cw, ch);
		out.push(canvas);
	}
	return out;
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error(`Missing ${src}`));
		img.src = src;
	});
}
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function makeFighter(x, facing, hp) {
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
		squash: 1
	};
}
var SAVE = "dino-ringov-v1";
var Engine = class {
	hud;
	canvas;
	ctx;
	input;
	audio;
	assets = null;
	raf = 0;
	acc = 0;
	last = 0;
	running = false;
	screen = "boot";
	pausedFrom = "fight";
	player;
	enemy;
	spec;
	bout = 0;
	round = 1;
	time = 45;
	combo = 0;
	comboT = 0;
	heat = 0;
	banner = "";
	bannerT = 0;
	mash = 0;
	downWho = null;
	downT = 0;
	introT = 0;
	result = "";
	trauma = 0;
	hitstop = 0;
	parts = [];
	floats = [];
	bursts = [];
	buf = {
		jab: 0,
		hook: 0,
		roar: 0
	};
	reduced = false;
	onHud;
	hudTick = 0;
	best = 0;
	constructor(canvas, input, audio, onHud) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
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
			loadImage("/sprites/gronk-idle.png")
		]);
		this.assets = {
			arena,
			portrait,
			impact: slice(impact, 2, 2),
			ringov: {
				idle: slice(idle, 2, 2),
				punch: slice(punch, 2, 2),
				hook: slice(hook, 2, 2),
				hurt: slice(hurt, 2, 2)
			},
			spike: slice(spike, 2, 2),
			vix: slice(vix, 2, 2),
			gronk: slice(gronk, 2, 2)
		};
		this.screen = "title";
		this.pushHud();
		this.startLoop();
	}
	startCareer() {
		this.bout = 0;
		this.beginBout();
	}
	startBout(i) {
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
	onVis = () => {
		if (document.hidden) {
			if (this.screen === "fight" || this.screen === "down" || this.screen === "intro") {
				this.pausedFrom = this.screen;
				this.screen = "pause";
				this.audio.crowd(false);
				this.pushHud();
			}
		} else this.audio.resume();
	};
	beginBout() {
		this.spec = CARD[this.bout];
		this.player = makeFighter(430, 1, 100);
		this.enemy = makeFighter(850, -1, this.spec.hp);
		this.round = 1;
		this.time = 45;
		this.combo = 0;
		this.heat = 0;
		this.result = "";
		this.goIntro();
	}
	goIntro() {
		this.screen = "intro";
		this.introT = 2.4;
		this.banner = `ROUND ${this.round}`;
		this.bannerT = 1.1;
		this.audio.bell();
		this.audio.crowd(true);
		this.pushHud();
	}
	resize = () => {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		this.canvas.width = Math.round(W * dpr);
		this.canvas.height = Math.round(720 * dpr);
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};
	startLoop() {
		if (this.running) return;
		this.running = true;
		this.last = performance.now();
		const tick = (now) => {
			if (!this.running) return;
			let dt = (now - this.last) / 1e3;
			this.last = now;
			if (dt > .1) dt = .1;
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
			if (this.hudTick > .08) {
				this.hudTick = 0;
				this.pushHud();
			}
			this.raf = requestAnimationFrame(tick);
		};
		this.raf = requestAnimationFrame(tick);
	}
	handleMeta(a) {
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
	afterResult() {
		if (this.result === "win") {
			if (this.bout >= CARD.length - 1) {
				this.screen = "champion";
				this.best = Math.max(this.best, 3);
				try {
					localStorage.setItem(SAVE, String(this.best));
				} catch {}
				this.audio.crowd(true);
				this.pushHud();
				return;
			}
			this.bout += 1;
			this.best = Math.max(this.best, this.bout);
			try {
				localStorage.setItem(SAVE, String(this.best));
			} catch {}
			this.beginBout();
			return;
		}
		this.beginBout();
	}
	step(a) {
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
				this.bannerT = .7;
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
		if (a.jabJust) this.buf.jab = .14;
		if (a.hookJust) this.buf.hook = .14;
		if (a.roarJust) this.buf.roar = .16;
		this.control(this.player, a, dt, true);
		this.ai(dt);
		this.control(this.enemy, this.aiActions, dt, false);
		this.integrate(this.player, dt);
		this.integrate(this.enemy, dt);
		this.separate();
		this.resolveHits(this.player, this.enemy, 1);
		this.resolveHits(this.enemy, this.enemyIsPlayer(), -1);
	}
	enemyIsPlayer() {
		return this.player;
	}
	aiActions = {
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
		confirmJust: false
	};
	ai(dt) {
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
		else if (Math.random() < .35 * dt) a.moveX = Math.random() < .5 ? -1 : 1;
		if ((p.anim === "jab" || p.anim === "hook" || p.anim === "roar") && p.t < JAB.start + JAB.active + .05) {
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
	control(f, a, dt, isPlayer) {
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
					this.addTrauma(.35);
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
				f.cooldown = .08;
			}
			f.vx *= Math.exp(-6 * dt);
			return;
		}
		if (f.anim === "hurt") {
			f.t += dt;
			if (f.t >= (f.hp < f.maxHp * .25 ? .42 : .28)) {
				f.anim = "idle";
				f.t = 0;
			}
			f.vx *= Math.exp(-5 * dt);
			return;
		}
		if (f.anim === "down") return;
		const wantDuck = a.duck && !attacking;
		f.duck += ((wantDuck ? 1 : 0) - f.duck) * (1 - Math.exp(-18 * dt));
		if (wantDuck && f.duck > .6 && f.anim !== "duck") {
			f.anim = "duck";
			if (isPlayer) this.audio.duck();
		} else if (!wantDuck && f.anim === "duck") f.anim = "idle";
		f.blocking = a.block && !wantDuck && !attacking && f.stam > 4;
		if (f.blocking) {
			f.anim = "block";
			f.stam = Math.max(0, f.stam - 16 * dt);
		} else if (f.anim === "block") f.anim = "idle";
		if (!f.blocking && f.duck < .4) {
			const spd = isPlayer ? 230 : this.spec.speed;
			f.vx = a.moveX * spd * (f.duck > .3 ? .4 : 1);
			if (Math.abs(a.moveX) > .2) f.anim = "idle";
		} else f.vx *= Math.exp(-10 * dt);
		const regen = f.blocking ? 6 : 28;
		f.stam = Math.min(100, f.stam + regen * dt);
		f.t += dt;
	}
	startAttack(f, kind) {
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
	integrate(f, dt) {
		f.x += f.vx * dt;
		f.x = clamp(f.x, LEFT, RIGHT);
	}
	separate() {
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
	resolveHits(atkF, defF, dir) {
		if (atkF.anim !== "jab" && atkF.anim !== "hook" && atkF.anim !== "roar") return;
		if (atkF.hitLanded) return;
		const atk = atkF.anim === "jab" ? JAB : atkF.anim === "hook" ? HOOK : ROAR;
		if (atkF.t < atk.start || atkF.t > atk.start + atk.active) return;
		if (Math.abs(defF.x - atkF.x) > atk.range) return;
		if (defF.invuln > 0 || defF.anim === "down") return;
		if (atk.high && defF.duck > .55) {
			atkF.hitLanded = true;
			this.float(defF.x, 346, "SLIP", false);
			return;
		}
		atkF.hitLanded = true;
		const blocked = defF.blocking && defF.stam > 2;
		let dmg = atk.dmg;
		if (atkF !== this.player) dmg *= this.spec.dmg;
		if (this.combo >= 3 && atkF === this.player) dmg *= 1.15;
		if (blocked) {
			dmg *= .3;
			defF.stam = Math.max(0, defF.stam - 12);
			this.audio.block();
			this.addTrauma(.12);
			this.burst(defF.x - dir * 40, 396);
			this.float(defF.x, 366, "BLOCK", false);
			defF.vx += dir * 30;
			return;
		}
		defF.hp = Math.max(0, defF.hp - dmg);
		defF.anim = "hurt";
		defF.t = 0;
		defF.flash = .09;
		defF.stun = atk.stun;
		defF.invuln = .12;
		defF.vx = dir * atk.kb;
		defF.squash = .86;
		this.hitstop = atk.high ? .045 : .08;
		if (atkF.anim === "roar") this.hitstop = .12;
		this.addTrauma(atkF.anim === "hook" || atkF.anim === "roar" ? .55 : .28);
		this.audio.hit(atkF.anim !== "jab");
		this.audio.swell();
		this.burst((atkF.x + defF.x) / 2, 406);
		this.dust(defF.x, 586, dir);
		const shown = Math.round(dmg);
		this.float(defF.x, 356, String(shown), atkF.anim !== "jab");
		if (atkF === this.player) {
			this.combo += 1;
			this.comboT = 1.4;
			this.heat = Math.min(100, this.heat + (atkF.anim === "jab" ? 14 : atkF.anim === "hook" ? 22 : 0));
		} else this.combo = 0;
		if (defF.hp <= 0) this.knockDown(defF === this.player ? "p" : "e");
	}
	knockDown(who) {
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
		this.addTrauma(.8);
		this.pushHud();
	}
	tickDown(a, dt) {
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
			if (a.jabJust || a.hookJust || a.confirmJust) this.mash += .17;
			this.mash = Math.max(0, this.mash - dt * .12);
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
	getUp(f, hp) {
		f.hp = hp;
		f.anim = "idle";
		f.t = 0;
		f.invuln = .7;
		f.flash = .2;
		f.stam = 50;
		this.screen = "fight";
		this.downWho = null;
		this.mash = 0;
		this.banner = "FIGHT";
		this.bannerT = .5;
		this.pushHud();
	}
	endRound() {
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
	finishBout(result) {
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
	idlePose(f, dt) {
		if (f.anim !== "down" && f.anim !== "hurt") {
			if (f.anim !== "win") f.anim = "idle";
			f.t += dt;
		} else f.t += dt;
		f.flash = Math.max(0, f.flash - dt);
	}
	addTrauma(n) {
		if (this.reduced) return;
		this.trauma = clamp(this.trauma + n, 0, 1);
	}
	burst(x, y) {
		this.bursts.push({
			x,
			y,
			t: .28
		});
	}
	dust(x, y, dir) {
		for (let i = 0; i < 10; i++) this.parts.push({
			x: x + (Math.random() - .5) * 30,
			y,
			vx: dir * (40 + Math.random() * 120) + (Math.random() - .5) * 60,
			vy: -40 - Math.random() * 120,
			life: .35 + Math.random() * .25,
			max: .55,
			s: 3 + Math.random() * 5,
			c: "rgba(232,212,170,0.7)"
		});
	}
	float(x, y, text, heavy) {
		this.floats.push({
			x,
			y,
			t: .7,
			text,
			heavy
		});
	}
	draw() {
		const ctx = this.ctx;
		const shake = this.trauma * this.trauma;
		const ox = this.reduced ? 0 : (Math.random() - .5) * 18 * shake;
		const oy = this.reduced ? 0 : (Math.random() - .5) * 12 * shake;
		ctx.save();
		ctx.clearRect(0, 0, W, 720);
		ctx.translate(ox, oy);
		const assets = this.assets;
		if (assets) {
			const a = assets.arena;
			ctx.drawImage(a, 0, a.height * .04, a.width, a.height * .78, -20, -30, 1320, 770);
		} else {
			ctx.fillStyle = "#1a140c";
			ctx.fillRect(0, 0, W, 720);
		}
		const g = ctx.createLinearGradient(0, 0, 0, 720);
		g.addColorStop(0, "rgba(8,6,4,0.18)");
		g.addColorStop(.55, "rgba(8,6,4,0)");
		g.addColorStop(1, "rgba(10,8,5,0.35)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, W, 720);
		if (this.player && this.enemy && this.screen !== "boot") {
			this.drawFighter(this.player, true);
			this.drawFighter(this.enemy, false);
		}
		if (assets) for (const b of this.bursts) {
			const i = Math.min(3, Math.floor((1 - b.t / .28) * 4));
			const fr = assets.impact[i];
			const s = 160;
			ctx.save();
			ctx.globalAlpha = clamp(b.t / .12, 0, 1);
			ctx.drawImage(fr, b.x - s / 2, b.y - s / 2, s, s);
			ctx.restore();
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
			ctx.globalAlpha = clamp(f.t / .2, 0, 1);
			ctx.fillStyle = f.heavy ? "#f3e6c8" : "#e8e0d4";
			ctx.strokeStyle = "rgba(18,16,12,0.65)";
			ctx.lineWidth = 6;
			const y = f.y - (.7 - f.t) * 50;
			ctx.strokeText(f.text, f.x, y);
			ctx.fillText(f.text, f.x, y);
			ctx.globalAlpha = 1;
		}
		if (this.banner && this.screen !== "title") {
			ctx.save();
			ctx.globalAlpha = clamp(this.bannerT / .15, 0, 1);
			ctx.textAlign = "center";
			ctx.fillStyle = "rgba(18,16,12,0.45)";
			ctx.fillRect(W * .18, 273.6, W * .64, 110);
			ctx.font = "120px Bebas Neue, sans-serif";
			ctx.fillStyle = "#f3e6c8";
			ctx.fillText(this.banner, W / 2, 365.6);
			ctx.restore();
		}
		ctx.restore();
	}
	drawFighter(f, isPlayer) {
		if (!this.assets) return;
		const frames = isPlayer ? this.playerFrames(f) : this.enemyFrames(f);
		const fr = frames[this.frameIndex(f, frames.length)];
		let h = isPlayer ? 338 : this.spec.drawH;
		if (f.anim === "duck" || f.duck > .4) h *= .78;
		if (f.anim === "down") h *= .72;
		h *= f.squash;
		const w = fr.width / fr.height * h;
		const ctx = this.ctx;
		ctx.save();
		ctx.translate(f.x, FLOOR);
		ctx.scale(f.facing, 1);
		if (f.flash > 0) ctx.filter = "brightness(2.6) saturate(0.4)";
		if (f.anim === "down") ctx.rotate(-.42);
		ctx.drawImage(fr, -w / 2, -h, w, h);
		ctx.restore();
	}
	playerFrames(f) {
		const r = this.assets.ringov;
		if (f.anim === "jab") return r.punch;
		if (f.anim === "hook" || f.anim === "roar") return r.hook;
		if (f.anim === "hurt" || f.anim === "down") return r.hurt;
		return r.idle;
	}
	enemyFrames(f) {
		return this.assets[this.spec.id];
	}
	frameIndex(f, n) {
		if (f.anim === "jab" || f.anim === "hook" || f.anim === "roar") {
			const atk = f.anim === "jab" ? JAB : f.anim === "hook" ? HOOK : ROAR;
			const total = atk.start + atk.active + atk.recover;
			const p = clamp(f.t / total, 0, .999);
			return Math.min(n - 1, Math.floor(p * n));
		}
		if (f.anim === "hurt") return Math.min(n - 1, Math.floor(clamp(f.t / .28, 0, .999) * n));
		if (f.anim === "down") return n - 1;
		const fps = Math.abs(f.vx) > 20 ? 10 : 6;
		return Math.floor(f.t * fps) % n;
	}
	snapshot() {
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
			loaded: this.assets !== null
		};
	}
	pushHud() {
		this.hud = this.snapshot();
		this.onHud(this.hud);
		window.__dino = this.hud;
	}
};
var GameAudio = class {
	ctx = null;
	master = null;
	sfx = null;
	music = null;
	muted = false;
	crowdLoop = null;
	unlock() {
		if (!this.ctx) {
			const ctx = new AudioContext({ latencyHint: "interactive" });
			const master = ctx.createGain();
			const sfx = ctx.createGain();
			const music = ctx.createGain();
			sfx.gain.value = .85;
			music.gain.value = .28;
			master.gain.value = this.muted ? 0 : .7;
			sfx.connect(master);
			music.connect(master);
			master.connect(ctx.destination);
			this.ctx = ctx;
			this.master = master;
			this.sfx = sfx;
			this.music = music;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(next) {
		this.muted = next;
		if (this.master && this.ctx) this.master.gain.setTargetAtTime(next ? 0 : .7, this.ctx.currentTime, .02);
	}
	resume() {
		if (this.ctx?.state === "suspended") this.ctx.resume();
	}
	env(duration, peak = .4, attack = .006) {
		if (!this.ctx || !this.sfx) return null;
		const g = this.ctx.createGain();
		const t = this.ctx.currentTime;
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(peak, t + attack);
		g.gain.exponentialRampToValueAtTime(1e-4, t + duration);
		g.connect(this.sfx);
		return g;
	}
	osc(type, freq, duration, peak = .2, slide) {
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
		o.stop(t + duration + .02);
		o.onended = () => {
			o.disconnect();
			g.disconnect();
		};
	}
	noise(duration, peak, hp = 400, lp = 2400) {
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
		filter.Q.value = .7;
		const g = this.env(duration, peak, .003);
		if (!g) return;
		src.connect(filter);
		filter.connect(g);
		src.start();
		src.stop(this.ctx.currentTime + duration + .02);
		src.onended = () => {
			src.disconnect();
			filter.disconnect();
			g.disconnect();
		};
	}
	jab() {
		this.noise(.07, .18, 1200, 5e3);
		this.osc("triangle", 420, .08, .08, .5);
	}
	hook() {
		this.noise(.12, .28, 200, 1400);
		this.osc("sine", 140, .16, .22, .45);
	}
	whoosh() {
		this.noise(.09, .12, 1800, 6e3);
		this.osc("sine", 380, .1, .05, 1.8);
	}
	hit(heavy) {
		this.noise(heavy ? .18 : .1, heavy ? .4 : .24, 120, heavy ? 900 : 1800);
		this.osc("sine", heavy ? 90 : 160, heavy ? .22 : .12, heavy ? .32 : .16, .4);
		if (heavy) this.osc("triangle", 55, .18, .18, .5);
	}
	block() {
		this.noise(.08, .16, 800, 3e3);
		this.osc("square", 520, .06, .05, .7);
	}
	duck() {
		this.osc("sine", 220, .07, .06, .6);
	}
	bell() {
		this.osc("sine", 880, .9, .2);
		this.osc("sine", 1320, .7, .08);
		setTimeout(() => {
			this.osc("sine", 880, .7, .16);
		}, 220);
	}
	roar() {
		this.osc("sawtooth", 90, .55, .18, .7);
		this.noise(.4, .22, 80, 600);
	}
	ko() {
		this.osc("sine", 180, .5, .2, .3);
		this.osc("triangle", 70, .7, .25, .4);
		this.noise(.35, .3, 80, 500);
	}
	crowd(on) {
		if (!this.ctx || !this.music) return;
		if (!on) {
			if (this.crowdLoop) {
				const t = this.ctx.currentTime;
				this.crowdLoop.gain.gain.setTargetAtTime(1e-4, t, .08);
				const node = this.crowdLoop;
				this.crowdLoop = null;
				setTimeout(() => {
					try {
						node.noise.stop();
						node.noise.disconnect();
						node.gain.disconnect();
					} catch {}
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
		g.gain.value = 1e-4;
		src.connect(filter);
		filter.connect(g);
		g.connect(this.music);
		src.start();
		g.gain.setTargetAtTime(.45, this.ctx.currentTime, .2);
		this.crowdLoop = {
			noise: src,
			gain: g
		};
	}
	swell() {
		if (!this.ctx || !this.crowdLoop) return;
		const t = this.ctx.currentTime;
		const g = this.crowdLoop.gain.gain;
		g.setTargetAtTime(.85, t, .03);
		g.setTargetAtTime(.45, t + .35, .12);
	}
};
var GAME_KEYS = /* @__PURE__ */ new Set([
	"KeyA",
	"KeyD",
	"KeyS",
	"KeyW",
	"KeyJ",
	"KeyK",
	"KeyL",
	"KeyU",
	"KeyP",
	"Space",
	"ArrowLeft",
	"ArrowRight",
	"ArrowDown",
	"ArrowUp",
	"ShiftLeft",
	"ShiftRight",
	"Escape",
	"Enter"
]);
var Input = class {
	keys = /* @__PURE__ */ new Set();
	prev = {
		jab: false,
		hook: false,
		roar: false,
		pause: false,
		confirm: false
	};
	touchMove = 0;
	touch = {
		duck: false,
		block: false,
		jab: false,
		hook: false,
		roar: false
	};
	padJab = false;
	padHook = false;
	padRoar = false;
	padPause = false;
	padDuck = false;
	padBlock = false;
	padMove = 0;
	constructor() {
		if (typeof window === "undefined") return;
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.clear);
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) this.clear();
		});
	}
	dispose() {
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.clear);
	}
	onKeyDown = (e) => {
		if (GAME_KEYS.has(e.code)) e.preventDefault();
		this.keys.add(e.code);
	};
	onKeyUp = (e) => {
		this.keys.delete(e.code);
	};
	clear = () => {
		this.keys.clear();
		this.touchMove = 0;
		this.touch.duck = false;
		this.touch.block = false;
		this.touch.jab = false;
		this.touch.hook = false;
		this.touch.roar = false;
	};
	setTouch(action, down) {
		this.touch[action] = down;
	}
	poll() {
		this.pollPad();
		const left = this.keys.has("KeyA") || this.keys.has("ArrowLeft") || this.touchMove < -.3 || this.padMove < -.3;
		const right = this.keys.has("KeyD") || this.keys.has("ArrowRight") || this.touchMove > .3 || this.padMove > .3;
		let moveX = 0;
		if (left) moveX -= 1;
		if (right) moveX += 1;
		if (!left && !right && Math.abs(this.touchMove) > .15) moveX = this.touchMove;
		else if (!left && !right && Math.abs(this.padMove) > .15) moveX = this.padMove;
		const duck = this.keys.has("KeyS") || this.keys.has("ArrowDown") || this.touch.duck || this.padDuck;
		const block = this.keys.has("KeyL") || this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.touch.block || this.padBlock;
		const jab = this.keys.has("KeyJ") || this.touch.jab || this.padJab;
		const hook = this.keys.has("KeyK") || this.touch.hook || this.padHook;
		const roar = this.keys.has("KeyU") || this.touch.roar || this.padRoar;
		const pause = this.keys.has("KeyP") || this.keys.has("Escape") || this.padPause;
		const confirm = this.keys.has("Enter") || this.keys.has("Space");
		const actions = {
			moveX,
			duck,
			block,
			jab,
			hook,
			roar,
			pause,
			confirm,
			jabJust: jab && !this.prev.jab,
			hookJust: hook && !this.prev.hook,
			roarJust: roar && !this.prev.roar,
			pauseJust: pause && !this.prev.pause,
			confirmJust: confirm && !this.prev.confirm
		};
		this.prev = {
			jab,
			hook,
			roar,
			pause,
			confirm
		};
		return actions;
	}
	pollPad() {
		const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : [];
		this.padJab = false;
		this.padHook = false;
		this.padRoar = false;
		this.padPause = false;
		this.padDuck = false;
		this.padBlock = false;
		this.padMove = 0;
		if (!pads) return;
		for (const pad of pads) {
			if (!pad || pad.mapping !== "standard") continue;
			const x = pad.axes[0] ?? 0;
			const mag = Math.abs(x);
			if (mag > .18) this.padMove = Math.sign(x) * ((mag - .18) / .82);
			if (pad.buttons[14]?.pressed) this.padMove = -1;
			if (pad.buttons[15]?.pressed) this.padMove = 1;
			if (pad.buttons[0]?.pressed) this.padJab = true;
			if (pad.buttons[2]?.pressed) this.padHook = true;
			if (pad.buttons[1]?.pressed) this.padDuck = true;
			if (pad.buttons[5]?.pressed || pad.buttons[4]?.pressed) this.padBlock = true;
			if (pad.buttons[3]?.pressed) this.padRoar = true;
			if (pad.buttons[9]?.pressed) this.padPause = true;
			if (pad.buttons[13]?.pressed) this.padDuck = true;
		}
	}
};
var BOOT = {
	screen: "boot",
	playerHp: 100,
	playerMax: 100,
	playerStam: 100,
	enemyHp: 100,
	enemyMax: 100,
	enemyStam: 100,
	playerName: "RINGOV",
	enemyName: "CHALLENGER",
	enemyTitle: "",
	round: 1,
	time: 45,
	combo: 0,
	heat: 0,
	banner: "",
	mash: 0,
	gettingUp: false,
	kdP: 0,
	kdE: 0,
	bout: 0,
	result: "",
	muted: false,
	best: 0,
	loaded: false
};
function GameScreen() {
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(BOOT);
	const [err, setErr] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const input = new Input();
		const audio = new GameAudio();
		const engine = new Engine(canvas, input, audio, setHud);
		inputRef.current = input;
		audioRef.current = audio;
		engineRef.current = engine;
		window.__engine = engine;
		engine.boot().catch((e) => {
			setErr(e instanceof Error ? e.message : "Could not load the ring");
		});
		const onVis = () => audio.resume();
		document.addEventListener("visibilitychange", onVis);
		return () => {
			document.removeEventListener("visibilitychange", onVis);
			delete window.__engine;
			engine.dispose();
			input.dispose();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		const sync = () => fitCanvas(el, canvasRef.current);
		sync();
		const ro = new ResizeObserver(sync);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	const unlock = () => {
		audioRef.current?.unlock();
	};
	const hold = (key, down) => {
		unlock();
		inputRef.current?.setTouch(key, down);
	};
	const move = (dir, down) => {
		unlock();
		const input = inputRef.current;
		if (!input) return;
		if (!down) {
			if (Math.sign(input.touchMove) === dir) input.touchMove = 0;
			return;
		}
		input.touchMove = dir;
	};
	const fight = hud.screen === "fight" || hud.screen === "intro" || hud.screen === "down" || hud.screen === "round";
	const showTouch = fight || hud.screen === "pause";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg select-none",
		style: { touchAction: "none" },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 m-auto max-h-full max-w-full",
				width: 1280,
				height: 720,
				"aria-label": "Dino Ringov boxing ring"
			}),
			hud.screen === "boot" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-bg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-5xl tracking-wide text-fg",
					children: "DINO RINGOV"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: err ?? "Lacing the gloves…"
				})]
			}),
			hud.screen === "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {
				hud,
				unlock
			}),
			hud.screen === "howto" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Howto, { unlock }),
			fight && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudBar, {
				hud,
				unlock
			}),
			hud.screen === "pause" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseCard, { unlock }),
			hud.screen === "result" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
				hud,
				unlock
			}),
			hud.screen === "champion" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChampionCard, { unlock }),
			hud.gettingUp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mash, { hud }),
			showTouch && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBar, {
				heat: hud.heat,
				onHold: hold,
				onMove: move,
				onPause: () => {
					unlock();
					engineRef.current?.resume();
				}
			})
		]
	});
}
function fitCanvas(wrap, canvas) {
	if (!canvas) return;
	const w = wrap.clientWidth;
	const h = wrap.clientHeight;
	const scale = Math.min(w / 1280, h / 720);
	canvas.style.width = `${Math.round(1280 * scale)}px`;
	canvas.style.height = `${Math.round(720 * scale)}px`;
}
function Title({ hud, unlock }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-10 flex items-end justify-center p-4 sm:items-center sm:p-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-full max-w-5xl flex-col items-center gap-6 rounded-xl border border-border bg-bg/80 px-5 py-6 sm:flex-row sm:gap-10 sm:px-10 sm:py-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/art/ringov.png",
				alt: "Ringov the T-Rex boxer",
				className: "h-44 w-auto shrink-0 object-contain sm:h-72",
				crossOrigin: "anonymous"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-full flex-col items-center text-center sm:items-start sm:text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.28em] text-muted",
						children: "Cretaceous Boxing Commission"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-6xl leading-none text-fg sm:text-7xl",
						children: "DINO RINGOV"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-md text-base text-muted",
						children: "King of the Cretaceous Ring. Three challengers. One belt."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 flex items-center gap-2",
						children: [
							"Spike",
							"Vix",
							"Gronk"
						].map((name, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `h-2 w-8 rounded-full ${i < hud.best ? "bg-accent" : "bg-border"}`,
							title: name
						}, name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-12 flex-1 rounded-md bg-accent px-6 text-sm font-semibold tracking-wide text-accent-fg transition-transform duration-150 hover:opacity-90 active:scale-[0.98]",
							onClick: () => {
								unlock();
								engine()?.startCareer();
							},
							children: "Fight"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-12 flex-1 rounded-md border border-border bg-surface px-6 text-sm font-medium text-fg transition-opacity hover:opacity-90",
							onClick: () => {
								unlock();
								engine()?.openHowto();
							},
							children: "How to play"
						})]
					})
				]
			})]
		})
	});
}
function Howto({ unlock }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-10 flex items-center justify-center p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-xl border border-border bg-bg/90 p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-4xl text-fg",
					children: "In the ring"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-5 space-y-2.5 text-sm",
					children: [
						["A / D", "Move along the ropes"],
						["S", "Duck — slips jabs"],
						["J", "Jab — fast, high"],
						["K", "Hook — heavy, body"],
						["L", "Block"],
						["U", "Roar when heat is full"],
						["P", "Pause"]
					].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-baseline justify-between gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium tracking-wide text-fg",
							children: k
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: v
						})]
					}, k))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 text-sm text-muted",
					children: "On a pad: left stick moves, A jabs, X hooks, B ducks, bumpers block, Y roars."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg",
					onClick: () => {
						unlock();
						engine()?.toTitle();
					},
					children: "Back"
				})
			]
		})
	});
}
function HudBar({ hud, unlock }) {
	const t = Math.max(0, Math.ceil(hud.time));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-x-0 top-0 z-10 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-5xl items-start gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FighterMeter, {
					name: hud.playerName,
					sub: "You",
					hp: hud.playerHp,
					max: hud.playerMax,
					stam: hud.playerStam,
					kd: hud.kdP,
					align: "left"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-16 flex-col items-center pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl tabular-nums leading-none text-fg",
						children: String(t).padStart(2, "0")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs uppercase tracking-[0.2em] text-muted",
						children: ["Rnd ", hud.round]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FighterMeter, {
					name: hud.enemyName,
					sub: hud.enemyTitle,
					hp: hud.enemyHp,
					max: hud.enemyMax,
					stam: hud.enemyStam,
					kd: hud.kdE,
					align: "right"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto mx-auto mt-3 flex max-w-5xl items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heat, { value: hud.heat }), hud.combo > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-sm bg-surface px-2 py-1 text-xs font-semibold tabular-nums text-fg",
					children: [hud.combo, " hit"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
					label: hud.muted ? "Unmute" : "Mute",
					onClick: () => {
						unlock();
						engine()?.toggleMute();
					},
					children: hud.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
					label: "Pause",
					onClick: () => {
						unlock();
						inputRefPause();
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
				})]
			})]
		})]
	});
}
function inputRefPause() {
	const ev = new KeyboardEvent("keydown", { code: "KeyP" });
	window.dispatchEvent(ev);
	setTimeout(() => window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyP" })), 40);
}
function FighterMeter({ name, sub, hp, max, stam, kd, align }) {
	const hpPct = Math.max(0, hp / max);
	const stamPct = Math.max(0, stam / 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `min-w-0 flex-1 ${align === "right" ? "text-right" : "text-left"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex items-baseline gap-2 ${align === "right" ? "flex-row-reverse" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate font-display text-2xl leading-none text-fg sm:text-3xl",
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.18em] text-muted",
					children: sub
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1.5 h-2.5 overflow-hidden rounded-full bg-raised",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `h-full rounded-full bg-hp ${align === "right" ? "ml-auto" : ""}`,
					style: { width: `${hpPct * 100}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 h-1 overflow-hidden rounded-full bg-raised",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `h-full rounded-full bg-stam ${align === "right" ? "ml-auto" : ""}`,
					style: { width: `${stamPct * 100}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `mt-1.5 flex gap-1 ${align === "right" ? "justify-end" : ""}`,
				children: [
					0,
					1,
					2
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 w-1.5 rounded-full ${i < kd ? "bg-hp" : "bg-border"}` }, i))
			})
		]
	});
}
function Heat({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 rounded-sm bg-surface px-2 py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs uppercase tracking-[0.16em] text-muted",
			children: "Heat"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "h-1.5 w-16 overflow-hidden rounded-full bg-raised",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block h-full bg-accent",
				style: { width: `${value}%` }
			})
		})]
	});
}
function IconBtn({ label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: "grid size-11 place-items-center rounded-md border border-border bg-surface text-fg",
		children
	});
}
function PauseCard({ unlock }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/50 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-5xl text-fg",
					children: "Paused"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "The crowd is waiting."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex h-12 items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-accent-fg",
						onClick: () => {
							unlock();
							engine()?.resume();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), "Resume"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-12 rounded-md border border-border text-sm font-medium text-fg",
						onClick: () => {
							unlock();
							engine()?.toTitle();
						},
						children: "Leave ring"
					})]
				})
			]
		})
	});
}
function ResultCard({ hud, unlock }) {
	const win = hud.result === "win";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-end justify-center p-4 pb-8 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-xl border border-border bg-bg/90 p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.24em] text-muted",
					children: win ? "Winner" : "On the canvas"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-5xl text-fg",
					children: win ? "Ringov" : hud.enemyName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: win ? hud.bout >= 2 ? "The belt stays with the T-Rex." : "Next challenger is already climbing in." : "Get up. The belt is still on the line."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg",
					onClick: () => {
						unlock();
						engine()?.continueFromResult();
					},
					children: win ? hud.bout >= 2 ? "Take the belt" : "Next fight" : "Rematch"
				})
			]
		})
	});
}
function ChampionCard({ unlock }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-xl border border-border bg-bg/90 p-7 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.28em] text-muted",
					children: "Undisputed"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-6xl leading-none text-fg",
					children: "CHAMPION"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Ringov holds the Cretaceous belt. The jungle remembers."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg",
					onClick: () => {
						unlock();
						engine()?.toTitle();
					},
					children: "Title screen"
				})
			]
		})
	});
}
function Mash({ hud }) {
	if (hud.kdP >= 3) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-6 justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-56 rounded-md border border-border bg-surface/90 p-3 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.2em] text-muted",
					children: "Get up"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm font-medium text-fg",
					children: "Mash jab"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 h-2 overflow-hidden rounded-full bg-raised",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-accent",
						style: { width: `${Math.min(100, hud.mash * 100)}%` }
					})
				})
			]
		})
	});
}
function TouchBar({ heat, onHold, onMove, onPause }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-lg items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
					label: "Left",
					onHold: (d) => onMove(-1, d)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
					label: "Right",
					onHold: (d) => onMove(1, d)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
						label: "Duck",
						onHold: (d) => onHold("duck", d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
						label: "Block",
						onHold: (d) => onHold("block", d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
						label: "Jab",
						primary: true,
						onHold: (d) => onHold("jab", d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
						label: "Hook",
						primary: true,
						onHold: (d) => onHold("hook", d)
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-2 flex max-w-lg justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `h-11 rounded-md px-4 text-xs font-semibold uppercase tracking-wider ${heat >= 100 ? "bg-accent text-accent-fg" : "border border-border bg-surface text-muted"}`,
				onPointerDown: (e) => {
					e.preventDefault();
					onHold("roar", true);
				},
				onPointerUp: () => onHold("roar", false),
				onPointerCancel: () => onHold("roar", false),
				children: "Roar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 px-3 text-xs uppercase tracking-wider text-muted",
				onClick: onPause,
				children: "Pause"
			})]
		})]
	});
}
function Pad({ label, onHold, primary }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `h-14 min-w-16 rounded-md px-4 text-xs font-semibold uppercase tracking-wider ${primary ? "bg-accent text-accent-fg" : "border border-border bg-surface/90 text-fg"}`,
		onPointerDown: (e) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			onHold(true);
		},
		onPointerUp: () => onHold(false),
		onPointerCancel: () => onHold(false),
		children: label
	});
}
function engine() {
	return window.__engine ?? null;
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameScreen, {});
}
//#endregion
export { Home as component };
