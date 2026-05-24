var myWindowWidth = 480;
var myWindowHeight = 320;
var coef = 0.75;

coef = Math.max(0.5, 0.05 * (Math.floor(Math.min(window.innerWidth / 32, window.innerHeight / 24))));
myWindowWidth = coef * 640;
myWindowHeight = coef * 480;

var OBJECT_POSE_SIZE = 48 * coef;
var FRAME_RATE = storageNumber("frame_rate", 20, { allowed: [20, 40, 60, 80, 100, 120] });
var LEVEL = 50;

globalThis.TfitLayoutState = {
  get coef() { return coef; },
  get frameRate() { return FRAME_RATE; },
  get height() { return myWindowHeight; },
  get levelWindowBase() { return LEVEL; },
  get objectPoseSize() { return OBJECT_POSE_SIZE; },
  get width() { return myWindowWidth; }
};
