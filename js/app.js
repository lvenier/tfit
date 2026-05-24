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
  applyCalibrationDragFlags,
  applyKeyInputAction,
  applyPointerInputAction
} = globalThis.TfitAppInputActions;

const {
  clearCalibrationDragFlags
} = globalThis.TfitInput;

const {
  renderAppFrame
} = globalThis.TfitScreenRouter;

const {
  fetchSong,
  letsfight
} = globalThis.TfitFlow;

document.addEventListener("contextmenu", event => event.preventDefault());

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .catch(() => {});
}

function handleChange() {
  applyPointerInputAction();
}

function touchMoved() {
  handleChange();
}

function mousePressed() {
  handleChange();
}

function touchEnded() {
  if (gameState.gameCalibration) {
    applyCalibrationDragFlags(clearCalibrationDragFlags());
  }
}

function mouseReleased() {
  if (gameState.gameCalibration) {
    applyCalibrationDragFlags(clearCalibrationDragFlags());
  }
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

function keyPressed() {
  applyKeyInputAction();
}

function handleRightClick(e) {
  e.preventDefault();
  if (gameState.gameStarted) {
    return globalThis.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      code: 'KeyS',
      bubbles: true
    }));
  }
  return globalThis.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'b',
      code: 'KeyB',
      bubbles: true
  }));
}

async function setup() {
  await loadAssets();
  frameRate(60);
  angleMode(DEGREES);

  cnv = createCanvas(myWindowWidth, myWindowHeight);
  cnv.elt.addEventListener("contextmenu", handleRightClick);
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
  keyPressed,
  mousePressed,
  mouseReleased,
  setup,
  touchEnded,
  touchMoved,
  windowResized
});
