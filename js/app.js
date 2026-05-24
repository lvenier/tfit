p5.disableFriendlyErrors = true;

const {
  loadAssetsIntoState
} = globalThis.TfitAssets;

const {
  positionCanvas: positionAppCanvas,
  resizeCanvasLayout: resizeAppCanvas
} = globalThis.TfitLayoutState;

const {
  initCameraRuntime
} = globalThis.TfitCameraRuntime;

const {
  handleCanvasContextMenu: appContextMenu,
  handleKeyboardInput: appKeyPressed,
  handlePointerChange: appPointerChange,
  handlePointerRelease: appPointerRelease,
  preventContextMenu: preventAppContextMenu
} = globalThis.TfitAppEvents;

const {
  renderAppFrame
} = globalThis.TfitScreenRouter;

const {
  fetchSong
} = globalThis.TfitFlow;

document.addEventListener("contextmenu", preventAppContextMenu);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .catch(() => {});
}

async function loadAssets() {
  await loadAssetsIntoState({
    gameLength: GAME_LENGTH,
    gameLevel: GAME_LEVEL,
    loadImage,
    loadSound,
    menuTypes: MENUTYPE
  });
}

async function setup() {
  await loadAssets();
  frameRate(60);
  angleMode(DEGREES);

  cnv = createCanvas(myWindowWidth, myWindowHeight);
  cnv.elt.addEventListener("contextmenu", appContextMenu);
  positionAppCanvas(cnv);
  fetchSong(1);

  await initCameraRuntime();
}

function draw() {
  renderAppFrame();
}

function windowResized() {
  resizeAppCanvas({ canvas: cnv, resizeCanvasFn: resizeCanvas });
}

Object.assign(globalThis, {
  draw,
  keyPressed: appKeyPressed,
  mousePressed: appPointerChange,
  mouseReleased: appPointerRelease,
  setup,
  touchEnded: appPointerRelease,
  touchMoved: appPointerChange,
  windowResized
});
