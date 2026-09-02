import { isHandheld, localPointFromClient } from "../deviceFrame";

/** Finger travel on the stick is scaled so a short swipe covers most of the arena. */
const AIM_GAIN = 4.6;

export class AimJoystick {
  readonly el: HTMLElement;
  onNudge: ((dx: number, dy: number) => void) | null = null;

  private readonly canvas: HTMLElement;
  private readonly base: HTMLElement;
  private readonly knob: HTMLElement;
  private pointerId: number | null = null;
  private lastClientX = 0;
  private lastClientY = 0;
  private originX = 0;
  private originY = 0;

  constructor(root: HTMLElement, canvas: HTMLElement) {
    this.canvas = canvas;
    this.el = document.createElement("div");
    this.el.className = "aim-joystick interactive hidden";
    this.el.setAttribute("role", "slider");
    this.el.setAttribute("aria-label", "Aim");
    this.el.innerHTML = `
      <div class="aim-joystick-base">
        <span class="aim-joystick-ring" aria-hidden="true"></span>
        <span class="aim-joystick-knob" data-knob aria-hidden="true"></span>
      </div>
    `;
    root.appendChild(this.el);
    this.base = this.el.querySelector(".aim-joystick-base")!;
    this.knob = this.el.querySelector("[data-knob]")!;
    this.bind();
  }

  show(): void {
    if (!isHandheld()) {
      this.hide();
      return;
    }
    this.el.classList.remove("hidden");
  }

  hide(): void {
    this.endPointer();
    this.el.classList.add("hidden");
  }

  private bind(): void {
    this.el.addEventListener("pointerdown", (ev) => {
      if (!isHandheld() || this.el.classList.contains("hidden")) return;
      if (this.pointerId !== null) return;
      ev.preventDefault();
      this.pointerId = ev.pointerId;
      this.lastClientX = ev.clientX;
      this.lastClientY = ev.clientY;
      const rect = this.base.getBoundingClientRect();
      this.originX = rect.left + rect.width * 0.5;
      this.originY = rect.top + rect.height * 0.5;
      this.el.classList.add("is-held");
      this.setKnob(ev.clientX, ev.clientY);
      try {
        this.el.setPointerCapture(ev.pointerId);
      } catch {
        /* capture is optional */
      }
    });

    this.el.addEventListener("pointermove", (ev) => {
      if (this.pointerId !== ev.pointerId) return;
      ev.preventDefault();
      const prev = localPointFromClient(this.canvas, this.lastClientX, this.lastClientY);
      const next = localPointFromClient(this.canvas, ev.clientX, ev.clientY);
      this.lastClientX = ev.clientX;
      this.lastClientY = ev.clientY;
      this.setKnob(ev.clientX, ev.clientY);
      this.onNudge?.((next.x - prev.x) * AIM_GAIN, (next.y - prev.y) * AIM_GAIN);
    });

    const end = (ev: PointerEvent) => {
      if (this.pointerId !== ev.pointerId) return;
      this.endPointer();
    };
    this.el.addEventListener("pointerup", end);
    this.el.addEventListener("pointercancel", end);
    this.el.addEventListener("lostpointercapture", end);
  }

  private maxKnobTravel(): number {
    const base = this.base.clientWidth;
    const knob = this.knob.clientWidth;
    return Math.max(12, (base - knob) * 0.5);
  }

  private setKnob(clientX: number, clientY: number): void {
    let dx = clientX - this.originX;
    let dy = clientY - this.originY;
    const len = Math.hypot(dx, dy);
    const max = this.maxKnobTravel();
    if (len > max && len > 1e-6) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
  }

  private endPointer(): void {
    if (this.pointerId === null) return;
    const id = this.pointerId;
    this.pointerId = null;
    this.el.classList.remove("is-held");
    this.knob.style.transform = "translate(0px, 0px)";
    try {
      if (this.el.hasPointerCapture(id)) this.el.releasePointerCapture(id);
    } catch {
      /* already released */
    }
  }
}
