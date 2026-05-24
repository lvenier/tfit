const { randomInteger, storageNumber } = globalThis.TfitUtils;

let error = "";
let errorTimer = 0;
let loading_k = 0;
let loading_m = 0;

let myWindowWidth = 480;
let myWindowHeight = 320;
let coef = 0.75;

coef = Math.max(0.5, 0.05 * (Math.floor(Math.min(window.innerWidth / 32, window.innerHeight / 24))));
myWindowWidth = coef * 640;
myWindowHeight = coef * 480;

let OBJECT_POSE_SIZE = 48 * coef;
let FRAME_RATE = storageNumber("frame_rate", 20, { allowed: [20, 40, 60, 80, 100, 120] });
let LEVEL = 50;

const poseModelIndex = 0;
let leftHand;
let rightHand;
let nose;

let hide_sensor = 0;
let video;

let bodyPose;
let isDetecting = false;
let cnv;
let pose = {};
let poses = [];

const calibrationState = {
  init_jab_dragging: false,
  init_jab_y: storageNumber("init_jab_y", myWindowHeight / 4),
  init_uppercut_dragging: false,
  init_uppercut_y: storageNumber("init_uppercut_y", myWindowHeight * 3 / 4),
  left_init_hook_dragging: false,
  left_init_hook_x: storageNumber("left_init_hook_x", 120),
  left_init_pose_dragging: false,
  left_init_pose_x: storageNumber("left_init_pose_x", myWindowWidth / 3),
  left_init_pose_y: storageNumber("left_init_pose_y", myWindowHeight / 3),
  right_init_hook_dragging: false,
  right_init_hook_x: storageNumber("right_init_hook_x", myWindowWidth - 120),
  right_init_pose_dragging: false,
  right_init_pose_x: storageNumber("right_init_pose_x", 2 * myWindowWidth / 3),
  right_init_pose_y: storageNumber("right_init_pose_y", myWindowHeight / 3)
};

const timingState = {
  downDodge: Date.now() - 1000,
  downDodgeDone: false,
  downDodgeSwitch: false,
  gameResult: Date.now() - 5000,
  guardWarning: Date.now(),
  hitSuccess: Date.now() - 1000,
  leftDodge: Date.now() - 1000,
  leftHook: Date.now() - 1000,
  leftJab: Date.now() - 1000,
  leftPoses: Date.now() - 1000,
  leftUppercut: Date.now() - 1000,
  punchSoundTime: Date.now() - 1000,
  rightDodge: Date.now() - 1000,
  rightHook: Date.now() - 1000,
  rightJab: Date.now() - 1000,
  rightPoses: Date.now() - 1000,
  rightUppercut: Date.now() - 1000,
  switchGuard: Date.now() - 10000
};

let speechString = null;
