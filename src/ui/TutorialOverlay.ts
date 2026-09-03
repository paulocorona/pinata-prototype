import { assetUrl } from "../util/assetUrl";

const TYPE_MS = 22;
const DIALOGUE_GAP = 16;
const DIALOGUE_FRAME = "art/T_DialogueBox.png";

function preloadDialogueFrame(): Promise<void> {
  const img = new Image();
  img.src = assetUrl(DIALOGUE_FRAME);
  return img.decode().then(
    () => undefined,
    () => undefined,
  );
}

export type TutorialTarget = HTMLElement | (() => HTMLElement | null | undefined);

export type TutorialShowOpts = {
  text?: string;
  target: TutorialTarget;
  pad?: number;
  tightPulse?: boolean;
  /** Gold spotlight ring. Defaults to true. */
  pulse?: boolean;
  tapToAdvance?: boolean;
  /** Sit the dialogue just above the spotlight instead of the default top/center/bottom. */
  dialoguePlace?: "auto" | "above-target";
  doneHint?: string;
  onAdvance?: () => void;
  onSkip?: () => void;
  onUi?: () => void;
};

type Hole = { left: number; top: number; width: number; height: number; radius: number };

/** Spotlight coach-mark overlay that reuses intro dialogue styling. */
export class TutorialOverlay {
  readonly el: HTMLElement;
  private textEl: HTMLElement;
  private sizerEl: HTMLElement;
  private hintEl: HTMLElement;
  private pulseEl: HTMLElement;
  private holeCatchEl: HTMLElement;
  private stageEl: HTMLElement;
  private panes: Record<"t" | "l" | "r" | "b", HTMLElement>;
  private frameReady: Promise<void>;
  private showId = 0;
  private typed = 0;
  private lineComplete = false;
  private typeTimer = 0;
  private layoutRaf = 0;
  private followUntil = 0;
  private active = false;
  private text = "";
  private tapToAdvance = true;
  private doneHint = "Tap";
  private pad = 10;
  private dialoguePlace: "auto" | "above-target" = "auto";
  private target: TutorialTarget | null = null;
  private onAdvance: (() => void) | null = null;
  private onSkip: (() => void) | null = null;
  private onUi: (() => void) | null = null;
  private resizeObs: ResizeObserver;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-story overlay-tutorial is-idle";
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", "Tutorial");
    this.el.innerHTML = `
      <div class="tutorial-pane interactive" data-pane="t"></div>
      <div class="tutorial-pane interactive" data-pane="l"></div>
      <div class="tutorial-pane interactive" data-pane="r"></div>
      <div class="tutorial-pane interactive" data-pane="b"></div>
      <div class="tutorial-pulse" data-pulse hidden></div>
      <div class="tutorial-hole-catch interactive" data-hole-catch hidden></div>
      <button type="button" class="btn btn-secondary story-skip interactive" data-skip>Skip</button>
      <div class="story-stage" data-stage>
        <div class="story-dialogue interactive">
          <div class="tutorial-text-stack">
            <p class="story-text tutorial-text-sizer" data-story-sizer aria-hidden="true"></p>
            <p class="story-text tutorial-text-live" data-story-text></p>
          </div>
          <div class="story-hint" data-story-hint></div>
        </div>
      </div>
    `;
    root.appendChild(this.el);
    this.textEl = this.el.querySelector("[data-story-text]")!;
    this.sizerEl = this.el.querySelector("[data-story-sizer]")!;
    this.hintEl = this.el.querySelector("[data-story-hint]")!;
    this.pulseEl = this.el.querySelector("[data-pulse]")!;
    this.holeCatchEl = this.el.querySelector("[data-hole-catch]")!;
    this.stageEl = this.el.querySelector("[data-stage]")!;
    this.panes = {
      t: this.el.querySelector("[data-pane='t']")!,
      l: this.el.querySelector("[data-pane='l']")!,
      r: this.el.querySelector("[data-pane='r']")!,
      b: this.el.querySelector("[data-pane='b']")!,
    };
    this.frameReady = preloadDialogueFrame();
    this.resizeObs = new ResizeObserver(() => this.layout());

    this.el.querySelector("[data-skip]")!.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onUi?.();
      const skip = this.onSkip;
      this.hide();
      skip?.();
    });
    this.el.addEventListener("click", (event) => {
      if ((event.target as HTMLElement | null)?.closest("[data-skip]")) return;
      if (!this.tapToAdvance) return;
      this.advance();
    });
    window.addEventListener("resize", () => this.layout());
  }

  isActive(): boolean {
    return this.active;
  }

  show(opts: TutorialShowOpts): void {
    const nextText = opts.text ?? "";
    const silent = !nextText;
    const sameText = this.active && nextText === this.text && this.lineComplete;
    this.onAdvance = opts.onAdvance ?? null;
    this.onSkip = opts.onSkip ?? null;
    this.onUi = opts.onUi ?? null;
    this.tapToAdvance = opts.tapToAdvance !== false;
    this.doneHint = silent ? "" : (opts.doneHint ?? (this.tapToAdvance ? "Tap" : ""));
    this.pad = opts.pad ?? 10;
    this.dialoguePlace = opts.dialoguePlace ?? "auto";
    this.target = opts.target;
    this.el.classList.toggle("is-tap-advance", this.tapToAdvance);
    this.el.classList.toggle("is-silent", silent);
    this.el.classList.toggle("is-tight-pulse", !!opts.tightPulse);
    this.el.classList.toggle("is-no-pulse", opts.pulse === false);
    this.el.classList.toggle("is-dialogue-above", this.dialoguePlace === "above-target");
    this.active = true;
    const id = ++this.showId;
    const reveal = (): void => {
      if (!this.active || id !== this.showId) return;
      this.el.classList.remove("is-idle");
      this.resizeObs.observe(this.el);
      if (sameText) {
        this.updateHint();
        this.followTarget();
        return;
      }
      this.text = nextText;
      if (silent) {
        this.clearTimer();
        this.lineComplete = true;
        this.textEl.textContent = "";
        this.sizerEl.textContent = "";
        this.updateHint();
      } else {
        this.startTyping();
      }
      this.followTarget();
    };
    if (this.el.classList.contains("is-idle")) {
      void this.frameReady.then(reveal);
      return;
    }
    reveal();
  }

  hide(): void {
    this.showId += 1;
    this.clearTimer();
    this.stopFollow();
    this.resizeObs.disconnect();
    this.active = false;
    this.text = "";
    this.target = null;
    this.onAdvance = null;
    this.onSkip = null;
    this.onUi = null;
    this.textEl.textContent = "";
    this.sizerEl.textContent = "";
    this.el.classList.remove(
      "is-typing",
      "is-dialogue-top",
      "is-dialogue-bottom",
      "is-tap-advance",
      "is-silent",
      "is-tight-pulse",
      "is-no-pulse",
      "is-dialogue-above",
    );
    this.el.classList.add("is-idle");
    this.stageEl.style.top = "";
    this.pulseEl.hidden = true;
    this.holeCatchEl.hidden = true;
  }

  private startTyping(): void {
    this.clearTimer();
    this.typed = 0;
    this.lineComplete = false;
    this.sizerEl.textContent = this.text;
    this.textEl.textContent = "";
    this.updateHint();
    this.typeTick();
  }

  private typeTick(): void {
    this.typed = Math.min(this.text.length, this.typed + 1);
    this.textEl.textContent = this.text.slice(0, this.typed);
    if (this.typed >= this.text.length) {
      this.lineComplete = true;
      this.updateHint();
      return;
    }
    this.typeTimer = window.setTimeout(() => this.typeTick(), TYPE_MS);
  }

  private advance(): void {
    if (!this.active) return;
    this.onUi?.();
    if (!this.lineComplete) {
      this.clearTimer();
      this.typed = this.text.length;
      this.textEl.textContent = this.text;
      this.lineComplete = true;
      this.updateHint();
      return;
    }
    const next = this.onAdvance;
    next?.();
  }

  private updateHint(): void {
    this.el.classList.toggle("is-typing", !this.lineComplete);
    this.hintEl.textContent = !this.lineComplete ? "" : this.doneHint;
  }

  private resolveTarget(): HTMLElement | null {
    if (!this.target) return null;
    return typeof this.target === "function" ? this.target() ?? null : this.target;
  }

  private holeFromTarget(target: HTMLElement): Hole {
    const hostRect = this.el.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const sx = this.el.clientWidth / Math.max(hostRect.width, 1e-6);
    const sy = this.el.clientHeight / Math.max(hostRect.height, 1e-6);
    const pad = this.pad;
    const radiusRaw = getComputedStyle(target).borderTopLeftRadius;
    const radius = Number.parseFloat(radiusRaw);
    return {
      left: (rect.left - hostRect.left) * sx - pad,
      top: (rect.top - hostRect.top) * sy - pad,
      width: rect.width * sx + pad * 2,
      height: rect.height * sy + pad * 2,
      radius: (Number.isFinite(radius) ? radius : 12) + pad * 0.25,
    };
  }

  private placeDialogue(hole: Hole): void {
    this.el.classList.remove("is-dialogue-top", "is-dialogue-bottom");
    this.stageEl.style.top = "";
    if (this.el.classList.contains("is-silent")) return;
    if (this.dialoguePlace === "above-target") {
      const box = this.el.querySelector(".story-dialogue");
      if (!(box instanceof HTMLElement)) return;
      const gap = DIALOGUE_GAP;
      const top = Math.max(gap, hole.top - box.offsetHeight - gap);
      this.stageEl.style.top = `${top}px`;
      return;
    }
    const box = this.el.querySelector(".story-dialogue");
    if (!(box instanceof HTMLElement)) return;
    const current = this.relRect(box);
    if (!this.rectsOverlap(current, hole, DIALOGUE_GAP)) return;
    const holeMid = hole.top + hole.height / 2;
    this.el.classList.add(holeMid > this.el.clientHeight * 0.42 ? "is-dialogue-top" : "is-dialogue-bottom");
  }

  private relRect(el: HTMLElement): Hole {
    const hostRect = this.el.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const sx = this.el.clientWidth / Math.max(hostRect.width, 1e-6);
    const sy = this.el.clientHeight / Math.max(hostRect.height, 1e-6);
    return {
      left: (rect.left - hostRect.left) * sx,
      top: (rect.top - hostRect.top) * sy,
      width: rect.width * sx,
      height: rect.height * sy,
      radius: 0,
    };
  }

  private rectsOverlap(a: Hole, b: Hole, gap: number): boolean {
    return (
      a.left < b.left + b.width + gap &&
      a.left + a.width > b.left - gap &&
      a.top < b.top + b.height + gap &&
      a.top + a.height > b.top - gap
    );
  }

  private layout = (): void => {
    if (!this.active || this.el.classList.contains("is-idle")) return;
    const target = this.resolveTarget();
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (!target || w <= 0 || h <= 0) {
      this.pulseEl.hidden = true;
      this.holeCatchEl.hidden = true;
      this.setPane(this.panes.t, 0, 0, w, h);
      this.setPane(this.panes.l, 0, 0, 0, 0);
      this.setPane(this.panes.r, 0, 0, 0, 0);
      this.setPane(this.panes.b, 0, 0, 0, 0);
      this.el.classList.remove("is-dialogue-top", "is-dialogue-bottom");
      return;
    }
    const hole = this.holeFromTarget(target);
    if (hole.width < 8 || hole.height < 8) {
      this.pulseEl.hidden = true;
      this.holeCatchEl.hidden = true;
      this.setPane(this.panes.t, 0, 0, w, h);
      this.setPane(this.panes.l, 0, 0, 0, 0);
      this.setPane(this.panes.r, 0, 0, 0, 0);
      this.setPane(this.panes.b, 0, 0, 0, 0);
      return;
    }
    const left = Math.max(0, hole.left);
    const top = Math.max(0, hole.top);
    const right = Math.min(w, hole.left + hole.width);
    const bottom = Math.min(h, hole.top + hole.height);
    this.setPane(this.panes.t, 0, 0, w, top);
    this.setPane(this.panes.l, 0, top, left, Math.max(0, bottom - top));
    this.setPane(this.panes.r, right, top, Math.max(0, w - right), Math.max(0, bottom - top));
    this.setPane(this.panes.b, 0, bottom, w, Math.max(0, h - bottom));
    this.pulseEl.hidden = false;
    this.placeBox(this.pulseEl, hole);
    this.holeCatchEl.hidden = !this.tapToAdvance;
    this.placeBox(this.holeCatchEl, hole);
    this.placeDialogue(hole);
  };

  private placeBox(el: HTMLElement, hole: Hole): void {
    el.style.left = `${hole.left}px`;
    el.style.top = `${hole.top}px`;
    el.style.width = `${hole.width}px`;
    el.style.height = `${hole.height}px`;
    el.style.borderRadius = `${hole.radius}px`;
  }

  private setPane(el: HTMLElement, left: number, top: number, width: number, height: number): void {
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${Math.max(0, width)}px`;
    el.style.height = `${Math.max(0, height)}px`;
  }

  private followTarget(ms = 500): void {
    this.followUntil = performance.now() + ms;
    if (this.layoutRaf) {
      this.layout();
      return;
    }
    const tick = (now: number): void => {
      this.layout();
      if (this.active && now < this.followUntil) {
        this.layoutRaf = requestAnimationFrame(tick);
        return;
      }
      this.layoutRaf = 0;
    };
    this.layoutRaf = requestAnimationFrame(tick);
  }

  private stopFollow(): void {
    this.followUntil = 0;
    if (!this.layoutRaf) return;
    cancelAnimationFrame(this.layoutRaf);
    this.layoutRaf = 0;
  }

  private clearTimer(): void {
    window.clearTimeout(this.typeTimer);
    this.typeTimer = 0;
  }
}
