/** Public-folder path under Vite's base (`/` locally, `/pinata-prototype/` on Pages). */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

/** CSS backgrounds that Vite does not rewrite (root-absolute `url(/art/...)`). */
export function applyAssetCssVars(): void {
  document.documentElement.style.setProperty(
    "--art-courtyard",
    `url("${assetUrl("art/courtyard.jpg")}")`,
  );
  document.documentElement.style.setProperty(
    "--art-dialogue-box",
    `url("${assetUrl("art/T_DialogueBox.png")}")`,
  );
}
