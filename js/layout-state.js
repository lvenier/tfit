var myWindowWidth = 480;
var myWindowHeight = 320;
var coef = 0.75;

coef = Math.max(0.5, 0.05 * (Math.floor(Math.min(window.innerWidth / 32, window.innerHeight / 24))));
myWindowWidth = coef * 640;
myWindowHeight = coef * 480;

var OBJECT_POSE_SIZE = 48 * coef;
var FRAME_RATE = storageNumber("frame_rate", 20, { allowed: [20, 40, 60, 80, 100, 120] });
var LEVEL = 50;

function resizeLayoutState(width = window.innerWidth, height = window.innerHeight) {
  coef = Math.max(0.5, 0.05 * (Math.floor(Math.min(width / 32, height / 24))));
  myWindowWidth = coef * 640;
  myWindowHeight = coef * 480;
  OBJECT_POSE_SIZE = 48 * coef;

  return {
    coef,
    height: myWindowHeight,
    objectPoseSize: OBJECT_POSE_SIZE,
    width: myWindowWidth
  };
}

function positionCanvas(canvas = globalThis.cnv, width = window.innerWidth) {
  if (!canvas) {
    return false;
  }

  canvas.position(Math.max((width - myWindowWidth) / 2, 0), 0);
  return true;
}

function resizeCanvasLayout({
  canvas = globalThis.cnv,
  height = window.innerHeight,
  resizeCanvasFn = globalThis.resizeCanvas,
  width = window.innerWidth
} = {}) {
  const layout = resizeLayoutState(width, height);
  resizeCanvasFn(myWindowWidth, myWindowHeight);
  positionCanvas(canvas, width);
  return layout;
}

globalThis.TfitLayoutState = {
  get coef() { return coef; },
  get frameRate() { return FRAME_RATE; },
  get height() { return myWindowHeight; },
  get levelWindowBase() { return LEVEL; },
  get objectPoseSize() { return OBJECT_POSE_SIZE; },
  positionCanvas,
  resizeCanvasLayout,
  resizeLayoutState,
  get width() { return myWindowWidth; }
};
