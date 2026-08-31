import { fitPhoneFrame } from "./deviceFrame";
import { UpgradeLayoutEditor } from "./ui/UpgradeLayoutEditor";
import { applyAssetCssVars } from "./util/assetUrl";

applyAssetCssVars();

const phoneSlot = document.querySelector<HTMLElement>("#phone-slot");
const root = document.querySelector<HTMLElement>("#layout-root");
if (!phoneSlot || !root) throw new Error("Missing layout frame");
fitPhoneFrame(phoneSlot);
new UpgradeLayoutEditor(root);
