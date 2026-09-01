export class Reticle {
  constructor(private el: HTMLElement) {}

  move(x: number, y: number): void {
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
  }

  /** Diameter in CSS pixels — grows with hit-radius upgrades. */
  setSize(diameterPx: number): void {
    const size = Number.isFinite(diameterPx) ? Math.max(45, diameterPx) : 58;
    this.el.style.setProperty("--ch-size", `${size}px`);
  }

  setLocked(locked: boolean): void {
    this.el.classList.toggle("locked", locked);
  }

  show(): void {
    this.el.classList.add("visible");
  }

  hide(): void {
    this.el.classList.remove("visible");
  }
}
