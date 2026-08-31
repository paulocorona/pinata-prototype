import type { AudioManager } from "../audio/AudioManager";

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
        <button class="btn btn-secondary interactive" data-back>Back</button>
      </div>
    `;
    this.el.classList.remove("hidden");

    this.bindSlider("master", (value) => this.audio?.setMasterVolume(value), () => this.audio?.ui());
    this.bindSlider("sfx", (value) => this.audio?.setSfxVolume(value), () => this.audio?.ui());
    this.bindSlider("music", (value) => this.audio?.setMusicVolume(value));

    this.el.querySelector("[data-back]")!.addEventListener("click", () => {
      const back = this.onBack;
      this.hide();
      back?.();
    });
  }

  private bindSlider(
    key: "master" | "sfx" | "music",
    setVolume: (value: number) => void,
    onRelease?: () => void,
  ): void {
    const slider = this.el.querySelector(`[data-${key}]`) as HTMLInputElement;
    const label = this.el.querySelector(`[data-${key}-value]`) as HTMLElement;
    slider.addEventListener("input", () => {
      const next = Number(slider.value) / 100;
      setVolume(next);
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
