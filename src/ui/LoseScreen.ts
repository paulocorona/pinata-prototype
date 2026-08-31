export class LoseScreen {
  readonly el: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay hidden";
    root.appendChild(this.el);
  }

  show(onRestart: () => void): void {
    this.el.innerHTML = `
      <div class="panel boot-title">
        <div class="brand brand-lose">YOU LOSE</div>
        <p class="sub">A Fiesta Order came due and was not paid. The party is over.</p>
        <button class="btn btn-primary interactive" data-restart>Play Again</button>
      </div>
    `;
    this.el.classList.remove("hidden");
    this.el.querySelector("[data-restart]")!.addEventListener("click", () => {
      this.hide();
      onRestart();
    });
  }

  hide(): void {
    this.el.classList.add("hidden");
  }
}
