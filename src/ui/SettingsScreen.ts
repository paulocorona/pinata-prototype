import type { AudioManager } from "../audio/AudioManager";
import { isHandheld } from "../deviceFrame";
import {
  AIM_SENSITIVITY_MAX,
  AIM_SENSITIVITY_MIN,
  getAimMode,
  getAimSensitivity,
  setAimMode,
  setAimSensitivity,
  type AimMode,
} from "../game/aimSettings";

function volumePercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export class SettingsScreen {
  readonly el: HTMLElement;
  private audio: AudioManager | null = null;
  private onBack: (() => void) | null = null;
  private onWipe: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-settings hidden";
    root.appendChild(this.el);
  }

  show(audio: AudioManager, onBack: () => void, onWipe: () => void): void {
    this.audio = audio;
    this.onBack = onBack;
    this.onWipe = onWipe;
    const handheld = isHandheld();
    const aimMode = getAimMode();
    this.el.innerHTML = `
      <div class="panel panel-settings">
        <h1>Settings</h1>
        <p class="sub">Audio</p>
        <label class="settings-row">
          <span class="settings-row-head">
            <span>Master Volume</span>
            <span data-master-value>${volumePercent(audio.getMasterVolume())}</span>
          </span>
          <input
            class="settings-slider interactive"
            type="range"
            min="0"
            max="100"
            step="1"
            value="${Math.round(audio.getMasterVolume() * 100)}"
            data-master
          />
        </label>
        <label class="settings-row">
          <span class="settings-row-head">
            <span>Music</span>
            <span data-music-value>${volumePercent(audio.getMusicVolume())}</span>
          </span>
          <input
            class="settings-slider interactive"
            type="range"
            min="0"
            max="100"
            step="1"
            value="${Math.round(audio.getMusicVolume() * 100)}"
            data-music
          />
        </label>
        <label class="settings-row">
          <span class="settings-row-head">
            <span>SFX</span>
            <span data-sfx-value>${volumePercent(audio.getSfxVolume())}</span>
          </span>
          <input
            class="settings-slider interactive"
            type="range"
            min="0"
            max="100"
            step="1"
            value="${Math.round(audio.getSfxVolume() * 100)}"
            data-sfx
          />
        </label>
        ${handheld ? `
        <p class="sub">Controls</p>
        <div class="settings-row">
          <span class="settings-row-head">Aim</span>
          <div class="settings-checks">
            <label class="settings-check interactive">
              <input type="checkbox" data-aim-mode="joystick"${aimMode === "joystick" ? " checked" : ""} />
              <span>Joystick</span>
            </label>
            <label class="settings-check interactive">
              <input type="checkbox" data-aim-mode="slide"${aimMode === "slide" ? " checked" : ""} />
              <span>Slide</span>
            </label>
          </div>
        </div>
        <label class="settings-row${aimMode === "joystick" ? "" : " hidden"}" data-aim-row>
          <span class="settings-row-head">
            <span>Aim Sensitivity</span>
            <span data-aim-value>${volumePercent(getAimSensitivity())}</span>
          </span>
          <input
            class="settings-slider interactive"
            type="range"
            min="${Math.round(AIM_SENSITIVITY_MIN * 100)}"
            max="${Math.round(AIM_SENSITIVITY_MAX * 100)}"
            step="5"
            value="${Math.round(getAimSensitivity() * 100)}"
            data-aim
          />
        </label>
        ` : ""}
        <button type="button" class="btn btn-danger interactive" data-wipe>DELETE ALL PROGRESS</button>
        <button type="button" class="btn btn-secondary interactive" data-back>Back</button>
      </div>
      <div class="settings-confirm hidden" data-wipe-confirm>
        <div class="panel panel-settings-confirm">
          <p class="settings-confirm-copy">Are you sure? This will delete all of your progress, including tickets and ticket upgrades.</p>
          <button type="button" class="btn btn-danger interactive" data-wipe-yes>YES</button>
          <button type="button" class="btn btn-secondary interactive" data-wipe-no>NO</button>
        </div>
      </div>
    `;
    this.el.classList.remove("hidden");

    this.bindSlider("master", (value) => this.audio?.setMasterVolume(value), () => this.audio?.ui());
    this.bindSlider("sfx", (value) => this.audio?.setSfxVolume(value), () => this.audio?.ui());
    this.bindSlider("music", (value) => this.audio?.setMusicVolume(value));
    this.bindSlider("aim", (value) => setAimSensitivity(value), () => this.audio?.ui());
    this.bindAimMode();

    this.el.querySelector("[data-back]")!.addEventListener("click", () => {
      const back = this.onBack;
      this.hide();
      back?.();
    });

    const confirm = this.el.querySelector("[data-wipe-confirm]") as HTMLElement;
    this.el.querySelector("[data-wipe]")!.addEventListener("click", () => {
      this.audio?.ui();
      confirm.classList.remove("hidden");
    });
    this.el.querySelector("[data-wipe-no]")!.addEventListener("click", () => {
      this.audio?.ui();
      confirm.classList.add("hidden");
    });
    this.el.querySelector("[data-wipe-yes]")!.addEventListener("click", () => {
      this.audio?.ui();
      const wipe = this.onWipe;
      this.hide();
      wipe?.();
    });
    confirm.addEventListener("click", (event) => {
      if (event.target !== confirm) return;
      this.audio?.ui();
      confirm.classList.add("hidden");
    });
  }

  private bindAimMode(): void {
    const boxes = this.el.querySelectorAll<HTMLInputElement>("[data-aim-mode]");
    if (!boxes.length) return;
    const row = this.el.querySelector("[data-aim-row]");
    const sync = () => {
      const mode = getAimMode();
      for (const box of boxes) {
        box.checked = box.dataset.aimMode === mode;
      }
      row?.classList.toggle("hidden", mode !== "joystick");
    };
    for (const box of boxes) {
      box.addEventListener("change", () => {
        const next = (box.dataset.aimMode ?? "joystick") as AimMode;
        setAimMode(box.checked ? next : next === "joystick" ? "slide" : "joystick");
        this.audio?.ui();
        sync();
      });
    }
  }

  private bindSlider(
    key: string,
    setValue: (value: number) => void,
    onRelease?: () => void,
  ): void {
    const slider = this.el.querySelector(`[data-${key}]`) as HTMLInputElement | null;
    const label = this.el.querySelector(`[data-${key}-value]`) as HTMLElement | null;
    if (!slider || !label) return;
    slider.addEventListener("input", () => {
      const next = Number(slider.value) / 100;
      setValue(next);
      label.textContent = volumePercent(next);
    });
    if (onRelease) slider.addEventListener("change", onRelease);
  }

  hide(): void {
    this.el.classList.add("hidden");
    this.audio = null;
    this.onBack = null;
    this.onWipe = null;
  }
}
