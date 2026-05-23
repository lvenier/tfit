const MENUTYPE = {
  "0": "main",
  "1": "settings",
  "2": "shadow",
  "3": "pad",
  "4": "fight"
};

const MODELS = ["MoveNet", "BlazePose"];

const MOVE_TYPE = {
  "0": "None",
  "1": "LEFT_JAB",
  "2": "RIGHT_JAB",
  "3": "LEFT_HOOK",
  "4": "RIGHT_HOOK",
  "5": "LEFT_UPPERCUT",
  "6": "RIGHT_UPPERCUT",
  "7": "LEFT_DODGE",
  "8": "RIGHT_DODGE",
  "9": "DOWN_DODGE",
  "10": "SWITCH_GUARD"
};

const GAME_LEVEL = {
  "0": "easy",
  "1": "medium",
  "2": "hard"
};

const GAME_LENGTH = {
  "1": "30",
  "2": "60",
  "3": "120",
  "4": "180",
  "5": "300"
};

const SHADOW_SPECIFIC = {
  "0": "ALL",
  "1": "JAB",
  "2": "HOOK",
  "3": "UCUT",
  "4": "DODGE",
  "5": "PUNCHES"
};

const OPPONENTS = {
  "0": {
    "name": "Raja",
    "stamina": 6
  },
  "1": {
    "name": "Theo",
    "stamina": 8
  },
  "2": {
    "name": "Vehbo",
    "stamina": 10
  }
};

const { cloneFromMap, randomInteger, storageJson, storageNumber } = globalThis.TfitUtils;

function cloneOpponent(id) {
  return cloneFromMap(OPPONENTS, id, "0");
}

let error = "";
let errorTimer = 0;
let loading_k = 0;
let loading_m = 0;

let menu = 0;
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
let score = 0;
let score_max = 0;
let score_max_prev = 0;
let level = storageNumber("level", 0, { min: 0, max: Object.keys(GAME_LEVEL).length - 1 });
let shadow_focus = storageNumber("shadow_focus", 0, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 });
let arrayScore = [];
let background_images = [];
let logo_image;
let menu_image;
let rfeet_image;
let lfeet_image;
let good_hit_image;
let your_guard_image;
let fight_button_image;
let fight_menu_button_image;
let config_menu_button_image;
let framerate_button_image = [];
let level_button_image = [];
let duration_button_image = [];
let series_button_image = [];
let calibrate_button_image;
let reset_button_image;
let back_button_image;
let stop_button_image;
let shadow_button_image;
let pad_button_image;

let keep_trying_image;

let me_image;
let me_images = [];
let punch_animation = -1;
let punch_animation_type = 0;
let punch_animation_delay = 0;
const opponent = 0;
let my_opponent = cloneOpponent(opponent);

let opponent_image = [];
let opponents_images = [];
let puncho_animation = -1;
let puncho_animation_type = 0;
let puncho_animation_delay = 0;

let hide_sensor = 0;
let video;
let punch_sound;
let click_sound;
let song_letsfight;
let song_your_guard;
let song_keep_trying;
let song_well_done;
let song_great;
let song_awesome;
let song_good;
let song_perfect;
let song_continue;
let song_thats_it;

let bodyPose;
let isDetecting = false;
let cnv;
let pose = {};
let poses = [];
let gameTimer = -1;
let gameTimerNext = 0;
let gameLengthIndex = storageNumber("length", 2, { min: 1, max: Object.keys(GAME_LENGTH).length });
let gameLength = GAME_LENGTH[gameLengthIndex.toString()];
let gameSeries = storageNumber("series", 1, { min: 1, max: 5 });
let gameCurrentSeries = 1;
let gameDuration = gameLength * 100;
let gameOver = false;
let gameStarted = false;
let gameReady = false;
let gameCalibration = false;
let song = {};
let song_result = {};
let feet_position = 0;

let moves = [];
let curMoves = [];

let pad_x;
let pad_y;
let pad_type = 1;

let left_init_pose_dragging = false;
let left_init_pose_x = storageNumber("left_init_pose_x", myWindowWidth / 3);
let left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
let right_init_pose_dragging = false;
let right_init_pose_x = storageNumber("right_init_pose_x", 2 * myWindowWidth / 3);
let right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);

let left_init_hook_dragging = false;
let left_init_hook_x = storageNumber("left_init_hook_x", 120);
let right_init_hook_dragging = false;
let right_init_hook_x = storageNumber("right_init_hook_x", myWindowWidth - 120);

let init_uppercut_dragging = false;
let init_uppercut_y = storageNumber("init_uppercut_y", myWindowHeight * 3 / 4);

let init_jab_dragging = false;
let init_jab_y = storageNumber("init_jab_y", myWindowHeight / 4);

let left_poses = Date.now() - 1000;
let right_poses = Date.now() - 1000;
let left_hook = Date.now() - 1000;
let right_hook = Date.now() - 1000;
let left_jab = Date.now() - 1000;
let right_jab = Date.now() - 1000;
let left_uppercut = Date.now() - 1000;
let right_uppercut = Date.now() - 1000;
let left_dodge = Date.now() - 1000;
let right_dodge = Date.now() - 1000;
let down_dodge = Date.now() - 1000;
let down_dodge_done = false;
let down_dodge_switch = false;
let switch_guard = Date.now() - 10000;
let punch_sound_time = Date.now() - 1000;
let hit_success = Date.now() - 1000;
let gameResult = Date.now() - 5000;
let guard_warning = Date.now();

let speechString = null;
const selectedPlayer = localStorage.getItem("selected_player") || "player";
storageJson(selectedPlayer, {
  "name": (Math.random() + 1).toString(36).substring(2),
  "score": 0,
  "scores": {}
});
