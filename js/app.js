p5.disableFriendlyErrors = true;

const {
  handleKeyboardInput: appKeyPressed,
  handlePointerChange: appPointerChange,
  handlePointerRelease: appPointerRelease,
  preventContextMenu: preventAppContextMenu
} = globalThis.TfitAppEvents;

const {
  draw: appDraw,
  setup: appSetup,
  windowResized: appWindowResized
} = globalThis.TfitAppLifecycle;

document.addEventListener("contextmenu", preventAppContextMenu);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .catch(() => {});
}

Object.assign(globalThis, {
  draw: appDraw,
  keyPressed: appKeyPressed,
  mousePressed: appPointerChange,
  mouseReleased: appPointerRelease,
  setup: appSetup,
  touchEnded: appPointerRelease,
  touchMoved: appPointerChange,
  windowResized: appWindowResized
});
