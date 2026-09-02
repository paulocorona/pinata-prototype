import { assetUrl } from "../util/assetUrl";

const STORY_LINES = [
  "TODAY IS FIESTA DAY! 🎉\n\nThe neighborhood is ready.\nThe piñatas are hanging.\nThe kids are waiting...",
  "...but we're out of candy, and kids are getting desperate!",
  "You know what to do.",
];

export const FIRST_KID_STORY = [
  "The first kid is coming soon! Save some candy for him.\nIf you don't have enough money to give to a kid, you'll lose.",
];

const TYPE_MS = 22;
const DIALOGUE_FRAME = "art/T_DialogueBox.png";

function preloadDialogueFrame(): Promise<void> {
  const img = new Image();
  img.src = assetUrl(DIALOGUE_FRAME);
  return img.decode().then(
    () => undefined,
    () => undefined,
  );
}

/** Short Fiesta Day premise before the first round of a run. */
export class StoryScreen {
  readonly el: HTMLElement;
  private onDone: (() => void) | null = null;
  private onUi: (() => void) | null = null;
  private lineIndex = 0;
  private typed = 0;
  private lineComplete = false;
  private typeTimer = 0;
  private finished = false;
  private textEl: HTMLElement;
  private hintEl: HTMLElement;
  private lines: readonly string[] = STORY_LINES;
  private doneHint = "Tap to start";
  private frameReady: Promise<void>;
  private showId = 0;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-story is-idle";
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", "Fiesta Day");
    this.el.innerHTML = `
      <button type="button" class="btn btn-secondary story-skip interactive" data-skip>Skip</button>
      <div class="story-stage">
        <div class="story-dialogue">
          <div class="story-warn" data-story-warn aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path fill="#ffd166" d="M12 2.2 23.2 21.8H.8L12 2.2Z" />
              <path fill="#1a2433" d="M12 8.6c.5 0 .9.4.9.9v4.3c0 .5-.4.9-.9.9s-.9-.4-.9-.9V9.5c0-.5.4-.9.9-.9Zm0 8.3a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
            </svg>
          </div>
          <p class="story-text" data-story-text></p>
          <div class="story-hint" data-story-hint>Tap</div>
        </div>
      </div>
    `;
    root.appendChild(this.el);
    this.textEl = this.el.querySelector("[data-story-text]")!;
    this.hintEl = this.el.querySelector("[data-story-hint]")!;
    this.frameReady = preloadDialogueFrame();

    this.el.addEventListener("click", (event) => {
      if ((event.target as HTMLElement | null)?.closest("[data-skip]")) return;
      this.advance();
    });
    this.el.querySelector("[data-skip]")!.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onUi?.();
      this.finish();
    });
  }

  show(handlers: {
    onDone: () => void;
    onUi?: () => void;
    lines?: readonly string[];
    doneHint?: string;
    warn?: boolean;
  }): void {
    this.clearTimer();
    this.onDone = handlers.onDone;
    this.onUi = handlers.onUi ?? null;
    this.lines = handlers.lines ?? STORY_LINES;
    this.doneHint = handlers.doneHint ?? (this.lines === STORY_LINES ? "Tap to start" : "Tap");
    this.el.classList.toggle("is-warn", !!handlers.warn);
    this.lineIndex = 0;
    this.finished = false;
    const id = ++this.showId;
    void this.frameReady.then(() => {
      if (this.finished || id !== this.showId) return;
      this.el.classList.remove("is-idle");
      this.startTyping();
    });
  }

  hide(): void {
    this.showId += 1;
    this.clearTimer();
    this.finished = true;
    this.onDone = null;
    this.onUi = null;
    this.textEl.textContent = "";
    this.el.classList.remove("is-typing", "is-warn");
    this.el.classList.add("is-idle");
  }

  private startTyping(): void {
    this.clearTimer();
    this.typed = 0;
    this.lineComplete = false;
    this.textEl.textContent = "";
    this.updateHint();
    this.typeTick();
  }

  private typeTick(): void {
    const line = this.lines[this.lineIndex] ?? "";
    this.typed = Math.min(line.length, this.typed + 1);
    this.textEl.textContent = line.slice(0, this.typed);
    if (this.typed >= line.length) {
      this.lineComplete = true;
      this.updateHint();
      return;
    }
    this.typeTimer = window.setTimeout(() => this.typeTick(), TYPE_MS);
  }

  private advance(): void {
    if (this.finished) return;
    const line = this.lines[this.lineIndex] ?? "";
    this.onUi?.();
    if (!this.lineComplete) {
      this.clearTimer();
      this.typed = line.length;
      this.textEl.textContent = line;
      this.lineComplete = true;
      this.updateHint();
      return;
    }
    if (this.lineIndex >= this.lines.length - 1) {
      this.finish();
      return;
    }
    this.lineIndex += 1;
    this.startTyping();
  }

  private updateHint(): void {
    this.el.classList.toggle("is-typing", !this.lineComplete);
    const last = this.lineIndex >= this.lines.length - 1;
    this.hintEl.textContent = !this.lineComplete ? "" : last ? this.doneHint : "Tap";
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.clearTimer();
    const done = this.onDone;
    this.onDone = null;
    this.onUi = null;
    this.textEl.textContent = "";
    this.el.classList.remove("is-typing", "is-warn");
    this.el.classList.add("is-idle");
    done?.();
  }

  private clearTimer(): void {
    window.clearTimeout(this.typeTimer);
    this.typeTimer = 0;
  }
}
