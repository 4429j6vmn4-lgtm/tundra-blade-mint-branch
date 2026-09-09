export type Actions = {
  moveX: number;
  duck: boolean;
  block: boolean;
  jab: boolean;
  hook: boolean;
  roar: boolean;
  pause: boolean;
  confirm: boolean;
  jabJust: boolean;
  hookJust: boolean;
  roarJust: boolean;
  pauseJust: boolean;
  confirmJust: boolean;
};

const GAME_KEYS = new Set([
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
  "Enter",
]);

export class Input {
  private keys = new Set<string>();
  private prev = {
    jab: false,
    hook: false,
    roar: false,
    pause: false,
    confirm: false,
  };
  touchMove = 0;
  touch = {
    duck: false,
    block: false,
    jab: false,
    hook: false,
    roar: false,
  };
  private padJab = false;
  private padHook = false;
  private padRoar = false;
  private padPause = false;
  private padDuck = false;
  private padBlock = false;
  private padMove = 0;

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

  private onKeyDown = (e: KeyboardEvent) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private clear = () => {
    this.keys.clear();
    this.touchMove = 0;
    this.touch.duck = false;
    this.touch.block = false;
    this.touch.jab = false;
    this.touch.hook = false;
    this.touch.roar = false;
  };

  setTouch(action: keyof Input["touch"], down: boolean) {
    this.touch[action] = down;
  }

  poll(): Actions {
    this.pollPad();
    const left =
      this.keys.has("KeyA") || this.keys.has("ArrowLeft") || this.touchMove < -0.3 || this.padMove < -0.3;
    const right =
      this.keys.has("KeyD") || this.keys.has("ArrowRight") || this.touchMove > 0.3 || this.padMove > 0.3;
    let moveX = 0;
    if (left) moveX -= 1;
    if (right) moveX += 1;
    if (!left && !right && Math.abs(this.touchMove) > 0.15) moveX = this.touchMove;
    else if (!left && !right && Math.abs(this.padMove) > 0.15) moveX = this.padMove;

    const duck =
      this.keys.has("KeyS") || this.keys.has("ArrowDown") || this.touch.duck || this.padDuck;
    const block =
      this.keys.has("KeyL") ||
      this.keys.has("ShiftLeft") ||
      this.keys.has("ShiftRight") ||
      this.touch.block ||
      this.padBlock;
    const jab = this.keys.has("KeyJ") || this.touch.jab || this.padJab;
    const hook = this.keys.has("KeyK") || this.touch.hook || this.padHook;
    const roar = this.keys.has("KeyU") || this.touch.roar || this.padRoar;
    const pause = this.keys.has("KeyP") || this.keys.has("Escape") || this.padPause;
    const confirm = this.keys.has("Enter") || this.keys.has("Space");

    const actions: Actions = {
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
      confirmJust: confirm && !this.prev.confirm,
    };
    this.prev = { jab, hook, roar, pause, confirm };
    return actions;
  }

  private pollPad() {
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
      if (mag > 0.18) this.padMove = Math.sign(x) * ((mag - 0.18) / 0.82);
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
}
