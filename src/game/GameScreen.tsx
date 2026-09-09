import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Engine, type Hud } from "./engine";
import { GameAudio } from "./audio";
import { Input } from "./input";

const BOOT: Hud = {
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
  loaded: false,
};

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const inputRef = useRef<Input | null>(null);
  const audioRef = useRef<GameAudio | null>(null);
  const [hud, setHud] = useState<Hud>(BOOT);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const input = new Input();
    const audio = new GameAudio();
    const engine = new Engine(canvas, input, audio, setHud);
    inputRef.current = input;
    audioRef.current = audio;
    engineRef.current = engine;
    (window as unknown as { __engine?: Engine }).__engine = engine;
    engine.boot().catch((e: unknown) => {
      setErr(e instanceof Error ? e.message : "Could not load the ring");
    });
    const onVis = () => audio.resume();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      delete (window as unknown as { __engine?: Engine }).__engine;
      engine.dispose();
      input.dispose();
    };
  }, []);

  useEffect(() => {
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

  const hold = (key: "duck" | "block" | "jab" | "hook" | "roar", down: boolean) => {
    unlock();
    inputRef.current?.setTouch(key, down);
  };

  const move = (dir: number, down: boolean) => {
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

  return (
    <div
      ref={wrapRef}
      className="relative h-dvh w-full overflow-hidden bg-bg text-fg select-none"
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 m-auto max-h-full max-w-full"
        width={1280}
        height={720}
        aria-label="Dino Ringov boxing ring"
      />

      {hud.screen === "boot" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-bg">
          <p className="font-display text-5xl tracking-wide text-fg">DINO RINGOV</p>
          <p className="text-sm text-muted">{err ?? "Lacing the gloves…"}</p>
        </div>
      )}

      {hud.screen === "title" && <Title hud={hud} unlock={unlock} />}
      {hud.screen === "howto" && <Howto unlock={unlock} />}
      {fight && <HudBar hud={hud} unlock={unlock} />}
      {hud.screen === "pause" && <PauseCard unlock={unlock} />}
      {hud.screen === "result" && <ResultCard hud={hud} unlock={unlock} />}
      {hud.screen === "champion" && <ChampionCard unlock={unlock} />}
      {hud.gettingUp && <Mash hud={hud} />}

      {showTouch && (
        <TouchBar
          heat={hud.heat}
          onHold={hold}
          onMove={move}
          onPause={() => {
            unlock();
            engineRef.current?.resume();
          }}
        />
      )}
    </div>
  );
}

function fitCanvas(wrap: HTMLElement, canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  const scale = Math.min(w / 1280, h / 720);
  canvas.style.width = `${Math.round(1280 * scale)}px`;
  canvas.style.height = `${Math.round(720 * scale)}px`;
}

function Title({ hud, unlock }: { hud: Hud; unlock: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center p-4 sm:items-center sm:p-8">
      <div className="flex w-full max-w-5xl flex-col items-center gap-6 rounded-xl border border-border bg-bg/80 px-5 py-6 sm:flex-row sm:gap-10 sm:px-10 sm:py-8">
        <img
          src="/art/ringov.png"
          alt="Ringov the T-Rex boxer"
          className="h-44 w-auto shrink-0 object-contain sm:h-72"
          crossOrigin="anonymous"
        />
        <div className="flex w-full flex-col items-center text-center sm:items-start sm:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted">Cretaceous Boxing Commission</p>
          <h1 className="mt-2 font-display text-6xl leading-none text-fg sm:text-7xl">DINO RINGOV</h1>
          <p className="mt-2 max-w-md text-base text-muted">King of the Cretaceous Ring. Three challengers. One belt.</p>
          <div className="mt-5 flex items-center gap-2">
            {["Spike", "Vix", "Gronk"].map((name, i) => (
              <span
                key={name}
                className={`h-2 w-8 rounded-full ${i < hud.best ? "bg-accent" : "bg-border"}`}
                title={name}
              />
            ))}
          </div>
          <div className="mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="h-12 flex-1 rounded-md bg-accent px-6 text-sm font-semibold tracking-wide text-accent-fg transition-transform duration-150 hover:opacity-90 active:scale-[0.98]"
              onClick={() => {
                unlock();
                engine()?.startCareer();
              }}
            >
              Fight
            </button>
            <button
              type="button"
              className="h-12 flex-1 rounded-md border border-border bg-surface px-6 text-sm font-medium text-fg transition-opacity hover:opacity-90"
              onClick={() => {
                unlock();
                engine()?.openHowto();
              }}
            >
              How to play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Howto({ unlock }: { unlock: () => void }) {
  const rows = [
    ["A / D", "Move along the ropes"],
    ["S", "Duck — slips jabs"],
    ["J", "Jab — fast, high"],
    ["K", "Hook — heavy, body"],
    ["L", "Block"],
    ["U", "Roar when heat is full"],
    ["P", "Pause"],
  ];
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg/90 p-6">
        <h2 className="font-display text-4xl text-fg">In the ring</h2>
        <ul className="mt-5 space-y-2.5 text-sm">
          {rows.map(([k, v]) => (
            <li key={k} className="flex items-baseline justify-between gap-6">
              <span className="font-medium tracking-wide text-fg">{k}</span>
              <span className="text-muted">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted">
          On a pad: left stick moves, A jabs, X hooks, B ducks, bumpers block, Y roars.
        </p>
        <button
          type="button"
          className="mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
          onClick={() => {
            unlock();
            engine()?.toTitle();
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

function HudBar({ hud, unlock }: { hud: Hud; unlock: () => void }) {
  const t = Math.max(0, Math.ceil(hud.time));
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <FighterMeter
          name={hud.playerName}
          sub="You"
          hp={hud.playerHp}
          max={hud.playerMax}
          stam={hud.playerStam}
          kd={hud.kdP}
          align="left"
        />
        <div className="flex min-w-16 flex-col items-center pt-1">
          <p className="font-display text-3xl tabular-nums leading-none text-fg">{String(t).padStart(2, "0")}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Rnd {hud.round}</p>
        </div>
        <FighterMeter
          name={hud.enemyName}
          sub={hud.enemyTitle}
          hp={hud.enemyHp}
          max={hud.enemyMax}
          stam={hud.enemyStam}
          kd={hud.kdE}
          align="right"
        />
      </div>
      <div className="pointer-events-auto mx-auto mt-3 flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Heat value={hud.heat} />
          {hud.combo > 1 && (
            <span className="rounded-sm bg-surface px-2 py-1 text-xs font-semibold tabular-nums text-fg">
              {hud.combo} hit
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <IconBtn
            label={hud.muted ? "Unmute" : "Mute"}
            onClick={() => {
              unlock();
              engine()?.toggleMute();
            }}
          >
            {hud.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconBtn>
          <IconBtn
            label="Pause"
            onClick={() => {
              unlock();
              inputRefPause();
            }}
          >
            <Pause className="size-4" />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function inputRefPause() {
  const ev = new KeyboardEvent("keydown", { code: "KeyP" });
  window.dispatchEvent(ev);
  setTimeout(() => window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyP" })), 40);
}

function FighterMeter({
  name,
  sub,
  hp,
  max,
  stam,
  kd,
  align,
}: {
  name: string;
  sub: string;
  hp: number;
  max: number;
  stam: number;
  kd: number;
  align: "left" | "right";
}) {
  const hpPct = Math.max(0, hp / max);
  const stamPct = Math.max(0, stam / 100);
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className={`flex items-baseline gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <p className="truncate font-display text-2xl leading-none text-fg sm:text-3xl">{name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{sub}</p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-raised">
        <div
          className={`h-full rounded-full bg-hp ${align === "right" ? "ml-auto" : ""}`}
          style={{ width: `${hpPct * 100}%` }}
        />
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-raised">
        <div
          className={`h-full rounded-full bg-stam ${align === "right" ? "ml-auto" : ""}`}
          style={{ width: `${stamPct * 100}%` }}
        />
      </div>
      <div className={`mt-1.5 flex gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < kd ? "bg-hp" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}

function Heat({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-sm bg-surface px-2 py-1">
      <span className="text-xs uppercase tracking-[0.16em] text-muted">Heat</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-raised">
        <span className="block h-full bg-accent" style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-md border border-border bg-surface text-fg"
    >
      {children}
    </button>
  );
}

function PauseCard({ unlock }: { unlock: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
        <h2 className="font-display text-5xl text-fg">Paused</h2>
        <p className="mt-2 text-sm text-muted">The crowd is waiting.</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-accent-fg"
            onClick={() => {
              unlock();
              engine()?.resume();
            }}
          >
            <Play className="size-4" />
            Resume
          </button>
          <button
            type="button"
            className="h-12 rounded-md border border-border text-sm font-medium text-fg"
            onClick={() => {
              unlock();
              engine()?.toTitle();
            }}
          >
            Leave ring
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ hud, unlock }: { hud: Hud; unlock: () => void }) {
  const win = hud.result === "win";
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center p-4 pb-8 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg/90 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">{win ? "Winner" : "On the canvas"}</p>
        <h2 className="mt-1 font-display text-5xl text-fg">{win ? "Ringov" : hud.enemyName}</h2>
        <p className="mt-2 text-sm text-muted">
          {win
            ? hud.bout >= 2
              ? "The belt stays with the T-Rex."
              : "Next challenger is already climbing in."
            : "Get up. The belt is still on the line."}
        </p>
        <button
          type="button"
          className="mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
          onClick={() => {
            unlock();
            engine()?.continueFromResult();
          }}
        >
          {win ? (hud.bout >= 2 ? "Take the belt" : "Next fight") : "Rematch"}
        </button>
      </div>
    </div>
  );
}

function ChampionCard({ unlock }: { unlock: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg/90 p-7 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Undisputed</p>
        <h2 className="mt-2 font-display text-6xl leading-none text-fg">CHAMPION</h2>
        <p className="mt-3 text-sm text-muted">Ringov holds the Cretaceous belt. The jungle remembers.</p>
        <button
          type="button"
          className="mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
          onClick={() => {
            unlock();
            engine()?.toTitle();
          }}
        >
          Title screen
        </button>
      </div>
    </div>
  );
}

function Mash({ hud }: { hud: Hud }) {
  if (hud.kdP >= 3) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-6 justify-center">
      <div className="w-56 rounded-md border border-border bg-surface/90 p-3 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Get up</p>
        <p className="mt-1 text-sm font-medium text-fg">Mash jab</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised">
          <div className="h-full bg-accent" style={{ width: `${Math.min(100, hud.mash * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function TouchBar({
  heat,
  onHold,
  onMove,
  onPause,
}: {
  heat: number;
  onHold: (k: "duck" | "block" | "jab" | "hook" | "roar", d: boolean) => void;
  onMove: (dir: number, down: boolean) => void;
  onPause: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="mx-auto flex max-w-lg items-end justify-between gap-3">
        <div className="flex gap-2">
          <Pad label="Left" onHold={(d) => onMove(-1, d)} />
          <Pad label="Right" onHold={(d) => onMove(1, d)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Pad label="Duck" onHold={(d) => onHold("duck", d)} />
          <Pad label="Block" onHold={(d) => onHold("block", d)} />
          <Pad label="Jab" primary onHold={(d) => onHold("jab", d)} />
          <Pad label="Hook" primary onHold={(d) => onHold("hook", d)} />
        </div>
      </div>
      <div className="mx-auto mt-2 flex max-w-lg justify-between">
        <button
          type="button"
          className={`h-11 rounded-md px-4 text-xs font-semibold uppercase tracking-wider ${
            heat >= 100 ? "bg-accent text-accent-fg" : "border border-border bg-surface text-muted"
          }`}
          onPointerDown={(e) => {
            e.preventDefault();
            onHold("roar", true);
          }}
          onPointerUp={() => onHold("roar", false)}
          onPointerCancel={() => onHold("roar", false)}
        >
          Roar
        </button>
        <button type="button" className="h-11 px-3 text-xs uppercase tracking-wider text-muted" onClick={onPause}>
          Pause
        </button>
      </div>
    </div>
  );
}

function Pad({
  label,
  onHold,
  primary,
}: {
  label: string;
  onHold: (d: boolean) => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`h-14 min-w-16 rounded-md px-4 text-xs font-semibold uppercase tracking-wider ${
        primary ? "bg-accent text-accent-fg" : "border border-border bg-surface/90 text-fg"
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
    >
      {label}
    </button>
  );
}

function engine() {
  return (window as unknown as { __engine?: Engine }).__engine ?? null;
}
