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

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-settings hidden";
    root.appendChild(this.el);
  }

  show(audio: AudioManager, onBack: () => void): void {
    this.audio = audio;
    this.onBack = onBack;
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
        <button class="btn btn-secondary interactive" data-back>Back</button>
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
  }
}
