const MENUTYPE = {
  "0": "main",
  "1": "settings",
  "2": "shadow",
  "3": "pad",
  "4": "fight"
}

const MODELS = ["MoveNet", "BlazePose"]

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
}

const GAME_LEVEL = {
  "0": "easy",
  "1": "medium",
  "2": "hard"
}

const GAME_LENGTH = {
  "1": "30",
  "2": "60",
  "3": "120",
  "4": "180",
  "5": "300"
}

const SHADOW_SPECIFIC = {
  "0": "ALL",
  "1": "JAB",
  "2": "HOOK",
  "3": "UCUT",
  "4": "DODGE",
  "5": "PUNCHES"
}

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
}

function storageNumber(key, fallback, options = {}) {
  const value = Number(localStorage.getItem(key));
  if (!Number.isFinite(value)) return fallback;
  if (Number.isFinite(options.min) && value < options.min) return fallback;
  if (Number.isFinite(options.max) && value > options.max) return fallback;
  if (options.allowed && !options.allowed.includes(value)) return fallback;
  return value;
}

function storageJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (err) {
    localStorage.removeItem(key);
    return fallback;
  }
}

function cloneOpponent(id) {
  return JSON.parse(JSON.stringify(OPPONENTS[id] || OPPONENTS[0]));
}

var error = "";
var errorTimer = 0;
var loading_k = 0;
var loading_m = 0;

var menu = 0;
var myWindowWidth = 480;
var myWindowHeight = 320;
var coef = 0.75;

coef = Math.max(0.5, 0.05 * (Math.floor(Math.min(window.innerWidth / 32, window.innerHeight / 24))));
myWindowWidth = coef * 640;
myWindowHeight = coef * 480;

var OBJECT_POSE_SIZE = 48 * coef;
var FRAME_RATE = storageNumber("frame_rate", 20, { allowed: [20, 40, 60, 80, 100, 120] });
var LEVEL = 50;

var model = 0;
var leftHand;
var rightHand;
var nose;
var score = 0;
var score_max = 0;
var score_max_prev = 0;
var level = storageNumber("level", 0, { min: 0, max: Object.keys(GAME_LEVEL).length - 1 });
var shadow_focus = storageNumber("shadow_focus", 0, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 });
var arrayScore = [];
var background_image;
var background_images = [];
var logo_image;
var menu_image;
var rfeet_image;
var lfeet_image;
var good_hit_image;
var your_guard_image;
var fight_button_image;
var fight_menu_button_image;
var config_menu_button_image;
var framerate_button_image = [];
var level_button_image = [];
var duration_button_image = [];
var series_button_image = [];
var calibrate_button_image;
var reset_button_image;
var back_button_image;
var stop_button_image;
var shadow_button_image;
var pad_button_image;

var keep_trying_image;

var me_image;
var me_images = [];
var punch_animation = -1;
var punch_animation_type = 0;
var punch_animation_delay = 0;
var opponent = 0;
var my_opponent = cloneOpponent(opponent);

var opponent_image = [];
var opponents_images = [];
var puncho_animation = -1;
var puncho_animation_type = 0;
var puncho_animation_delay = 0;

var backgroundId = storageNumber("background_id", 1, { min: 0, max: Object.keys(MENUTYPE).length - 1 });
var hide_sensor = 0;
var video;
var punch_sound;
var click_sound;
var song_letsfight;
var song_bg_not_found;
var song_song_over;
var song_your_guard;
var song_keep_trying;
var song_well_done;
var song_great;
var song_awesome;
var song_good;
var song_perfect;
var song_continue;
var song_thats_it;

var bodyPose;
var isDetecting = false;
var cnv;
var pose = {};
var poses = [];
var gameTimer = -1;
var gameTimerNext = 0;
var gameLengthIndex = storageNumber("length", 2, { min: 1, max: Object.keys(GAME_LENGTH).length });
var gameLength = GAME_LENGTH[gameLengthIndex.toString()];
var gameSeries = storageNumber("series", 1, { min: 1, max: 5 });
var gameCurrentSeries = 1;
var gameDuration = gameLength * 100;
var gameOver = false;
var gameStarted = false;
var gameReady = false;
var gameCalibration = false;
var song = {};
var songId = storageNumber("song_id", 1, { min: 1 });
var song_result = {};
var feet_position = 0;

var moves = [];
var curMoves = [];

var pad_x;
var pad_y;
var pad_type = 1;

var left_init_pose_dragging = false;
var left_init_pose_x = storageNumber("left_init_pose_x", myWindowWidth / 3);
var left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
var right_init_pose_dragging = false;
var right_init_pose_x = storageNumber("right_init_pose_x", 2 * myWindowWidth / 3);
var right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);

var left_init_hook_dragging = false;
var left_init_hook_x = storageNumber("left_init_hook_x", 120);
var right_init_hook_dragging = false;
var right_init_hook_x = storageNumber("right_init_hook_x", myWindowWidth - 120);

var init_uppercut_dragging = false;
var init_uppercut_y = storageNumber("init_uppercut_y", myWindowHeight * 3 / 4);

var init_jab_dragging = false;
var init_jab_y = storageNumber("init_jab_y", myWindowHeight / 4);

var left_poses = Date.now() - 1000;
var right_poses = Date.now() - 1000;
var left_hook = Date.now() - 1000;
var right_hook = Date.now() - 1000;
var left_jab = Date.now() - 1000;
var right_jab = Date.now() - 1000;
var left_uppercut = Date.now() - 1000;
var right_uppercut = Date.now() - 1000;
var left_dodge = Date.now() - 1000;
var right_dodge = Date.now() - 1000;
var down_dodge = Date.now() - 1000;
var down_dodge_done = false;
var down_dodge_switch = false;
var switch_guard = Date.now() - 10000;
var punch_sound_time = Date.now() - 1000;
var hit_success = Date.now() - 1000;
var gameOverTime = Date.now() - 1000;
var gameResult = Date.now() - 5000;
var guard_warning = Date.now();

var speechString = null;
var selected_player = localStorage.getItem("selected_player") || "player";
var player = storageJson(selected_player, {
  "name": (Math.random() + 1).toString(36).substring(2),
  "score": 0,
  "scores": {}
});

p5.disableFriendlyErrors = true;

document.oncontextmenu = function() {
  return false;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.error('Service Worker error:', err));
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function positionCanvas() {
  if (!cnv) return;
  cnv.position(Math.max((window.innerWidth - myWindowWidth) / 2, 0), 0);
}

function resetCalibrationDefaults() {
  left_init_pose_x = myWindowWidth / 3;
  localStorage.setItem("left_init_pose_x", left_init_pose_x);
  left_init_pose_y = myWindowHeight / 3;
  localStorage.setItem("left_init_pose_y", left_init_pose_y);
  right_init_pose_x = 2 * myWindowWidth / 3;
  localStorage.setItem("right_init_pose_x", right_init_pose_x);
  right_init_pose_y = myWindowHeight / 3;
  localStorage.setItem("right_init_pose_y", right_init_pose_y);
  init_jab_y = myWindowHeight / 3 - OBJECT_POSE_SIZE * coef;
  localStorage.setItem("init_jab_y", init_jab_y);
  init_uppercut_y = myWindowHeight / 3 + OBJECT_POSE_SIZE * coef;
  localStorage.setItem("init_uppercut_y", init_uppercut_y);
  left_init_hook_x = myWindowWidth / 3 - OBJECT_POSE_SIZE * coef;
  localStorage.setItem("left_init_hook_x", left_init_hook_x);
  right_init_hook_x = myWindowWidth * 2 / 3 + OBJECT_POSE_SIZE * coef;
  localStorage.setItem("right_init_hook_x", right_init_hook_x);
}

function drawMessagePanel(title, details) {
  stroke(255, 255, 255, 48);
  strokeWeight(1);
  fill(0, 0, 0, 184);
  rect(myWindowWidth / 2 - 170 * coef, myWindowHeight / 2 - 54 * coef, 340 * coef, 108 * coef, 8 * coef);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(16 * coef);
  text(title, myWindowWidth / 2, myWindowHeight / 2 - 18 * coef);
  textStyle(NORMAL);
  textSize(8 * coef);
  text(details, myWindowWidth / 2, myWindowHeight / 2 + 18 * coef);
  textAlign(LEFT, CENTER);
}

function gameResultBool() { 
  return (Date.now() - gameResult < 5000)
}

function loadSongmoves() {
  LEVEL = 50 - level * 10;
  if (song) {
    gameDuration = gameLength * FRAME_RATE;
    if (song.moveLength === 0) {
      song.moves = [];
      song.moves[0] = 0
      song.moves[1] = 0
      let rand = 0;
      if (menu === 4) shadow_focus = storageNumber("shadow_focus", shadow_focus, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 });
      for (let i = 2; i < gameLength - 5; i++) {
        if (shadow_focus === 0) rand = randomInteger(1, 9);
        if (shadow_focus === 1) rand = randomInteger(1, 2);
        if (shadow_focus === 2) rand = randomInteger(3, 4);
        if (shadow_focus === 3) rand = randomInteger(5, 6);
        if (shadow_focus === 4) rand = randomInteger(7, 9);
        if (shadow_focus === 5) rand = randomInteger(1, 6);
        if (level === 2) {};
        if (level === 1) {
          if (i % 5 === 0) rand = 0;
        }
        if (level === 0) {
          if (i % 2 === 0) rand = 0;
        }
        song.moves.push(rand);
      }
      for (let s = gameLength - 5; s < gameLength; s++) {
        song.moves[s] = 0;
      }
      if (menu === 2) song.moves[Math.floor(gameLength / 2)] = 10;
    }
    moves = song.moves;
    score_max = 0;
    for (let m = 0; m < moves.length; m++) {
      if (moves[m] != 0 && moves[m] != 10) score_max++;
    }
  }
}

function fetchSong(id = 1) {
  song = {};
  song.name = "";
  song.url = "";
  song.author = "";
  song.moves = [];
  song.length = 120;
  song.moveLength = 0;
}

function punchSound() {
  if (punch_sound_time + 1000 < Date.now()) {
    punch_sound.play();
    punch_sound_time = Date.now();
  }
}

function letsfight() {
  click_sound.play();
  if (gameCalibration) return speechString = "Calibrating !";
  if (gameStarted) return speechString = "Already fighting !"
  feet_position = 0;
  left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
  right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  song_letsfight.play();
  gameStarted = true;
  gameResult = Date.now() - 5001;
  guard_warning = Date.now();
  my_opponent = cloneOpponent(opponent);
  curMoves = [];
  gameCalibration = false;
  hide_sensor = 0;
  gameTimer = 0;
  score = 0;
  arrayScore = [];
  loadSongmoves();
  score_max_prev = score_max;
}

function handleChange() {
  if (gameResultBool()) return;
  if (menu === 0) {
    if (mouseX < parseInt(myWindowWidth / 6) + 100 * coef && mouseX > parseInt(myWindowWidth / 6)) {
      if (mouseY < parseInt(myWindowHeight / 6 + 350 * coef) && mouseY > parseInt(myWindowHeight / 6 + 300 * coef)) {
          click_sound.play();
          menu = 1;
          return;
      }
      if (mouseY < parseInt(myWindowHeight / 6 + 50 * coef) && mouseY > parseInt(myWindowHeight / 6)) {
        click_sound.play();
        menu = 2;
        curMoves = [];
        loadSongmoves();
        return;
      }
      if (mouseY < parseInt(myWindowHeight / 6 + 150 * coef) && mouseY > parseInt(myWindowHeight / 6 + 100 * coef)) {
        click_sound.play();
        menu = 3;
        curMoves = [];
        loadSongmoves();
        return;
      }
      if (mouseY < parseInt(myWindowHeight / 6 + 250 * coef) && mouseY > parseInt(myWindowHeight / 6 + 200 * coef)) {
        click_sound.play();
        menu = 4
        curMoves = [];
        loadSongmoves();
        my_opponent = JSON.parse(JSON.stringify(OPPONENTS[opponent]));
        return;
      }
    }
  }
  if ([2, 3, 4].includes(menu)) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (mouseY > myWindowHeight - 148 * coef && mouseY < myWindowHeight - 108 * coef) {
        letsfight()
        return;
      }
    }
  }
  if ([1].includes(menu) && !gameCalibration) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (mouseY > myWindowHeight - 148 * coef && mouseY < myWindowHeight - 108 * coef) {
        click_sound.play();
        if (FRAME_RATE === 120) FRAME_RATE = 20
        else FRAME_RATE = FRAME_RATE + 20;
        localStorage.setItem("frame_rate", FRAME_RATE);
      }
      if (mouseY > myWindowHeight - 198 * coef && mouseY < myWindowHeight - 158 * coef) {
        click_sound.play();
        if (level < Object.keys(GAME_LEVEL).length - 1) level++;
        else level = 0;
        localStorage.setItem("level", level);
      }
      if (mouseY > myWindowHeight - 248 * coef && mouseY < myWindowHeight - 208 * coef) {
        click_sound.play();
        if (gameLengthIndex < Object.keys(GAME_LENGTH).length) gameLengthIndex++;
        else gameLengthIndex = 1;
        localStorage.setItem("length", gameLengthIndex);
        gameLength = GAME_LENGTH[gameLengthIndex.toString()];
      }
      if (mouseY > myWindowHeight - 298 * coef && mouseY < myWindowHeight - 258 * coef) {
        click_sound.play();
        if (gameSeries < 5) gameSeries++;
        else gameSeries = 1;
        localStorage.setItem("series", gameSeries);
      }
    }
  }
  if ([1].includes(menu) && mouseY > myWindowHeight - 98 * coef && mouseY < myWindowHeight - 58 * coef) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (gameCalibration) {
        click_sound.play();
        window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'r',
            keyCode: 82,
            code: 'KeyR',
            which: 82,
            bubbles: true
          }))
      } else {
        click_sound.play();
        gameCalibration = true;
        curMoves = [];
        hide_sensor = 64;
      }
      return;
    }
  }
  if (menu > 0) {
    if (mouseX > myWindowWidth - 100 * coef && mouseX < myWindowWidth && mouseY < parseInt(myWindowHeight - 10 * coef) && mouseY > parseInt(myWindowHeight - 60 * coef)) {
      click_sound.play();
      if (menu > 0 && !gameStarted && !gameCalibration) menu = 0;
      else if (menu > 0 && (gameStarted || gameCalibration)) {
        gameOver = true;
      } else menu = 0;
      return;
    }
  }
  if (gameCalibration) {
    if (mouseY < init_jab_y + 8) {
      init_jab_dragging = true;
    }
    if (mouseY > init_uppercut_y - 8) {
      init_uppercut_dragging = true;
    }
    if (mouseX < left_init_hook_x + 8) {
      left_init_hook_dragging = true;
    }
    if (mouseX > right_init_hook_x - 8) {
      right_init_hook_dragging = true;
    }
    if (mouseX > left_init_pose_x - OBJECT_POSE_SIZE / 2 && mouseX < left_init_pose_x + OBJECT_POSE_SIZE / 2 && mouseY > left_init_pose_y - 24 && mouseY < left_init_pose_y + 24) {
      left_init_pose_dragging = true;
    }
    if (mouseX > right_init_pose_x - OBJECT_POSE_SIZE / 2 && mouseX < right_init_pose_x + OBJECT_POSE_SIZE / 2 && mouseY > right_init_pose_y - 24 && mouseY < right_init_pose_y + 24) {
      right_init_pose_dragging = true;
    }
  }
}

function touchMoved() {
  handleChange();
}

function mousePressed() {
  handleChange();
}

function touchEnded() {
  if (gameCalibration) {
    init_uppercut_dragging = false;
    init_jab_dragging = false;
    left_init_hook_dragging = false;
    right_init_hook_dragging = false;
    right_init_pose_dragging = false;
    left_init_pose_dragging = false;
  }
}

function mouseReleased() {
  if (gameCalibration) {
    init_uppercut_dragging = false;
    init_jab_dragging = false;
    left_init_hook_dragging = false;
    right_init_hook_dragging = false;
    right_init_pose_dragging = false;
    left_init_pose_dragging = false;
  }
}

function preload() {
  for (let m in MENUTYPE) {
    background_images[m] = loadImage('assets/backgrounds/' + m + '.jpg');
  }
  background_image = loadImage('assets/backgrounds/' + backgroundId + '.jpg');
  logo_image = loadImage('assets/logos/logo.512.rounded.png');
  menu_image = loadImage('assets/images/menu_image.png');
  rfeet_image = loadImage('assets/images/RFoot.png');
  lfeet_image = loadImage('assets/images/LFoot.png');
  your_guard_image = loadImage('assets/images/your_guard.png');
  fight_button_image = loadImage('assets/images/fight.png');
  fight_menu_button_image = loadImage('assets/images/fightmenu.png');
  config_menu_button_image = loadImage('assets/images/config.png');
  shadow_button_image = loadImage('assets/images/shadow.png');
  pad_button_image = loadImage('assets/images/pad.png');
  calibrate_button_image = loadImage('assets/images/calibrate.png');
  reset_button_image = loadImage('assets/images/reset.png');
  back_button_image = loadImage('assets/images/back.png');
  stop_button_image = loadImage('assets/images/stop.png');
  keep_trying_image = loadImage('assets/images/keep_trying.png');
  good_hit_image = loadImage('assets/images/good_hit.png');
  for (let i = 0; i < 7; i++ ) framerate_button_image[i] = loadImage('assets/images/fr' + (i * 20) + '.png');
  for (let i = 0; i < Object.keys(GAME_LEVEL).length; i++ ) level_button_image[i] = loadImage('assets/images/' + GAME_LEVEL[i.toString()] + '.png');
  for (let i = 1; i <= Object.keys(GAME_LENGTH).length; i++ ) duration_button_image[i] = loadImage('assets/images/' + GAME_LENGTH[i.toString()] + '.png');
  for (let i = 1; i <= 5; i++ ) series_button_image[i]  = loadImage('assets/images/s' + i + '.png');

  me_image = loadImage('assets/images/boxers/0-me.png');
  me_images[0] = [];
  me_images[1] = [];
  for (let j = 1; j < 7; j++) {
    me_images[j] = [];
    for (let i = 0; i < 7; i++) {
      me_images[j][i] = loadImage('assets/images/boxers/' + j + '-me-' + i + '.png');
    }
  }

  opponent_image[0] = loadImage('assets/images/opponents/0/0-1.png');
  opponents_images[0] = [];
  opponents_images[1] = [];
  for (let j = 1; j <= 6; j++) {
    opponents_images[j] = [];
    for (let i = 0; i < 7; i++) {
      opponents_images[j][i] = loadImage('assets/images/opponents/0/' + j + '-' + i + '.png');
    }
  }

  click_sound = loadSound('assets/sounds/click.mp3');
  punch_sound = loadSound('assets/sounds/punch.mp3');
  song_letsfight = loadSound('assets/sounds/letsfight.mp3');
  song_bg_not_found = loadSound('assets/sounds/bg_not_found.mp3');
  song_song_over = loadSound('assets/sounds/song_over.mp3');
  song_your_guard = loadSound('assets/sounds/your_guard.mp3');
  song_keep_trying = loadSound('assets/sounds/keep_trying.mp3');
  song_well_done = loadSound('assets/sounds/well_done.mp3');
  song_great = loadSound('assets/sounds/great.mp3');
  song_awesome = loadSound('assets/sounds/awesome.mp3');
  song_good = loadSound('assets/sounds/good.mp3');
  song_perfect = loadSound('assets/sounds/perfect.mp3');
  song_continue = loadSound('assets/sounds/continue.mp3');
  song_thats_it = loadSound('assets/sounds/thats_it.mp3');

  bodyPose = ml5.bodyPose(MODELS[model], {
    modelUrl: "js/ml5js/model.json",
    flipped: true
  });
}

function keyPressed() {
  if (gameResultBool()) return;
  if (['b', 'B'].includes(key) && [1, 2, 3, 4].includes(menu)) {
    if (!gameStarted) {
      menu = 0;
    }
  }
  if (['s', 'S'].includes(key) && [1].includes(menu)) {
      if (!gameCalibration) {
        if (gameSeries < 5) gameSeries++;
        else gameSeries = 1;
        localStorage.setItem("series", gameSeries);
      } else {
        gameCalibration = false;
        menu = 1;
      }
  }
  if (['t', 'T'].includes(key) && [2].includes(menu)) {
    if (!gameStarted) {
      if (shadow_focus < Object.keys(SHADOW_SPECIFIC).length - 1) shadow_focus++;
      else shadow_focus = 0;
      localStorage.setItem("shadow_focus", shadow_focus);
      loadSongmoves();
    }
  }
  if (['l', 'L'].includes(key) && [1].includes(menu)) {
    if (level < Object.keys(GAME_LEVEL).length - 1) level++;
    else level = 0;
    localStorage.setItem("level", level);
  }
  if (['d', 'D'].includes(key) && [1].includes(menu)) {
      if (gameLengthIndex < Object.keys(GAME_LENGTH).length) gameLengthIndex++;
      else gameLengthIndex = 1;
      localStorage.setItem("length", gameLengthIndex);
      gameLength = GAME_LENGTH[gameLengthIndex.toString()];
  }
  if (['c', 'C'].includes(key) && menu === 1) {
      gameCalibration = true;
      hide_sensor = 64;
  }
  if (['c', 'C'].includes(key) && menu === 0) {
    menu = 1;
  }
  if (['s', 'S'].includes(key) && menu === 0) {
    loadSongmoves();
    menu = 2;
  }
  if (['s', 'S'].includes(key) && menu > 1) {
    gameOver = true;
  }
  if (['p', 'P'].includes(key) && menu === 0) {
    loadSongmoves();
    menu = 3;
  }
  if (['i', 'I'].includes(key) && menu === 0) {
    loadSongmoves();
    menu = 4;
  }
  if (['r', 'R'].includes(key) && [1].includes(menu) && gameCalibration) {
    resetCalibrationDefaults();
  }
  if (['f', 'F'].includes(key) && [1].includes(menu)) {
    if (FRAME_RATE === 120) FRAME_RATE = 20
    else FRAME_RATE = FRAME_RATE + 20;
    localStorage.setItem("frame_rate", FRAME_RATE);
  }
  if (['f', 'F'].includes(key) && [2, 3, 4].includes(menu)) {
    letsfight();
  }
}

function switch_feet() {
  feet_position = 1;
  left_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  right_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
}

function hitSuccess(c) {
  if (arrayScore[c] === 0) {
    if (c >= 3) {
      let s = 0;
      for (let k = 1; k < c - 2; k++) {
        if (s > 1) break;
        if (curMoves[c - k].type === 0) continue;
        if (curMoves[c - k].hit === false) break;
        s++;
      }
      if (s > 1) {
        let r = Math.floor(Math.random() * 20);
        if (r === 0 || r === 1) song_great.play();
        if (r === 2 || r === 3) song_awesome.play();
        if (r === 4 || r === 5) song_good.play();
        if (r === 6 || r === 7) song_perfect.play();
        if (r === 8 || r === 9) song_continue.play();
        if (r === 10 || r === 11) song_thats_it.play();
        if (r === 12 || r === 13) song_well_done.play();
      }
    }
    hit_success = Date.now();
  }
  arrayScore[c] = 1;
  curMoves[c].hit = true;
}

function handleRightClick(e) {
  e.preventDefault();
  if (gameStarted) {
    return window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      keyCode: 83,
      code: 'KeyS',
      which: 83,
      bubbles: true
    }))
  }
  return window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'b',
      keyCode: 66,
      code: 'KeyB',
      which: 66,
      bubbles: true
  }))
}

function setup() {
  frameRate(60);
  angleMode(DEGREES);
  cnv = createCanvas(myWindowWidth, myWindowHeight);
  cnv.elt.addEventListener('contextmenu', handleRightClick);
  positionCanvas();
  fetchSong(1);

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    error = "Camera access is not available in this browser.";
    return;
  }

  navigator.mediaDevices.getUserMedia({
      video: true
    })
    .then(stream => {
      video = createCapture(VIDEO, {
        flipped: true
      });
      video.hide();
      bodyPose.detectStart(video, gotPoses);
      isDetecting = true;
    })
    .catch(err => {
      error = "Failed to access camera: " + err.message;
    });

}

function draw() {
  if (innerWidth < innerHeight) return;
  background(0);
  if (error.length > 0) {
    drawMessagePanel("Camera unavailable", error);
    return;
  }
  if (!checkStartCondition()) {
    fill(255);
    image(logo_image, myWindowWidth / 2 - 50 * coef, myWindowHeight / 4, 100 * coef, 100 * coef);
    translate(myWindowWidth / 2, myWindowHeight / 2);
    ellipse(100 * sin(radians(loading_k)), 0, 20 * cos(radians(loading_m)), 20 * cos(radians(loading_m)));
    ellipse(100 * sin(radians(loading_k) + PI / 3), 0, 20 * cos(radians(loading_m) + PI / 3), 20 * cos(radians(loading_m) + PI / 3));
    ellipse(100 * sin(radians(loading_k) + PI / 6), 0, 20 * cos(radians(loading_m) + PI / 6), 20 * cos(radians(loading_m) + PI / 6));
    if (loading_k < 360) {
      loading_k += 4;
      if (90 < loading_k) {
        if (loading_m < 360) loading_m += 8;
        else loading_m = 0;
      }
    } else {
      loading_k = 0;
      loading_m = 0;
    }
    drawMessagePanel("Detecting your guard", "Stand in frame with both hands visible");
    return;
  }
  tint(255, 236);
  image(background_images[menu], 0, 0, myWindowWidth, myWindowHeight);
  tint(255, 255);
  textSize(10 * coef);
  fill(0, 0, 0);
  strokeWeight(0);
  if (menu === 0) {
    if (isDetecting === true) {
      bodyPose.detectStop();
      isDetecting = false;
    }
    gameResult = Date.now() - 5001;
    fill(0, 0, 0);
    image(logo_image, myWindowWidth - 60 * coef, myWindowHeight - 55 * coef, 50 * coef, 50 * coef);
    image(menu_image, myWindowWidth / 2.5, myWindowHeight / 8, myWindowWidth / 2, myWindowWidth / 2);
    image(shadow_button_image, myWindowWidth / 6, parseInt(myWindowHeight / 6), 100 * coef, 50 * coef);
    image(pad_button_image, myWindowWidth / 6, parseInt(myWindowHeight / 6 + 100 * coef), 100 * coef, 50 * coef);
    image(fight_menu_button_image, myWindowWidth / 6, parseInt(myWindowHeight / 6 + 200 * coef), 100 * coef, 50 * coef);
    image(config_menu_button_image, myWindowWidth / 6, parseInt(myWindowHeight / 6 + 300 * coef), 100 * coef, 50 * coef);
  } else {
    if ((menu === 2 || menu === 3 || menu === 4 || menu === 1) && !gameStarted && !gameResultBool()) {
      image(back_button_image,myWindowWidth - 100 * coef - 10, parseInt(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
    }
  }

  if (menu === 1) {
    if (gameOver) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
      gameCalibration = false;
      gameOver = false;
    }
    if (gameCalibration) {
      fill(255, 255, 255, 128);
      circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
      circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
      fill(255, 0, 0, hide_sensor);
      gameResult = Date.now() - 5001;
      if (isDetecting === false) {
        bodyPose.detectStart(video, gotPoses);
        isDetecting = true;
      }

      if (poses.length > 0) {
        pose = poses[0];
        leftHand = pose["left_wrist"];
        rightHand = pose["right_wrist"];
        nose = pose["nose"];
        if (nose && nose.confidence > 0.1 && isDetecting) {
          fill(0, 255, 0, 128);
          circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
          fill(255, 255, 255, hide_sensor);
        }
      }

      image(stop_button_image, myWindowWidth - 100 * coef - 10, parseInt(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      image(reset_button_image, myWindowWidth / 2 - 50 * coef, myWindowHeight - 100 * coef, 120 * coef, 60 * coef);
      if (right_init_pose_dragging) {
        right_init_pose_x = mouseX;
        right_init_pose_y = mouseY;
        localStorage.setItem("right_init_pose_x", right_init_pose_x);
        localStorage.setItem("right_init_pose_y", right_init_pose_y);
      }
      if (left_init_pose_dragging) {
        left_init_pose_x = mouseX;
        left_init_pose_y = mouseY;
        localStorage.setItem("left_init_pose_x", left_init_pose_x);
        localStorage.setItem("left_init_pose_y", left_init_pose_y);
      }
      if (init_jab_dragging) {
        init_jab_y = mouseY;
        localStorage.setItem("init_jab_y", init_jab_y);
      }
      if (init_uppercut_dragging) {
        init_uppercut_y = mouseY;
        localStorage.setItem("init_uppercut_y", init_uppercut_y);
      }
      if (left_init_hook_dragging) {
        left_init_hook_x = mouseX;
        localStorage.setItem("left_init_hook_x", left_init_hook_x);
      }
      if (right_init_hook_dragging) {
        right_init_hook_x = mouseX;
        localStorage.setItem("right_init_hook_x", right_init_hook_x);
      }
      stroke(0);
      strokeWeight(hide_sensor / 255);
      fill(255, 255, 255, 32);
      rect(left_init_pose_x - OBJECT_POSE_SIZE / 2, 0, OBJECT_POSE_SIZE, myWindowHeight);
      rect(right_init_pose_x - OBJECT_POSE_SIZE / 2, 0, OBJECT_POSE_SIZE, myWindowHeight);
      fill(255, 255, 255, hide_sensor);
      rect(0, 0, myWindowWidth, init_jab_y);
      rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
      rect(0, 0, left_init_hook_x, myWindowHeight);
      rect(right_init_hook_x, 0, right_init_hook_x, myWindowHeight);
    } else {
      image(series_button_image[gameSeries], myWindowWidth / 2 - 50 * coef, myWindowHeight - 300 * coef, 120 * coef, 60 * coef)
      image(duration_button_image[gameLengthIndex], myWindowWidth / 2 - 50 * coef, myWindowHeight - 250 * coef, 120 * coef, 60 * coef);
      image(level_button_image[level], myWindowWidth / 2 - 50 * coef, myWindowHeight - 200 * coef, 120 * coef, 60 * coef);
      image(framerate_button_image[FRAME_RATE/20], myWindowWidth / 2 - 50 * coef, myWindowHeight - 150 * coef, 120 * coef, 60 * coef);
      image(calibrate_button_image, myWindowWidth / 2 - 50 * coef, myWindowHeight - 100 * coef, 120 * coef, 60 * coef);
    }
  }

  if (menu > 1) {
    fill(255, 255, 255, 128);
    circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
    circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
    fill(255, 255, 255, 192);
    if (gameDuration - gameTimer <= 0) {
      gameOver = true;
      gameOverTime = Date.now();
    }
    if (gameOver) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
      gameCalibration = false;
      my_opponent = cloneOpponent(opponent);
      gameStarted = false;
      hide_sensor = 0;
      gameTimer = -1;
      gameOver = false;
      if (curMoves.length > 0 && score > 0) gameResult = Date.now();
      if (gameCurrentSeries < gameSeries) {
        setTimeout(function() {
          letsfight();
        }, 5100);
        gameCurrentSeries++;
      } else gameCurrentSeries = 1;
      feet_position = 0;
      left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
      right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
    }

    if (speechString) {
      fill(255, 255, 255, 255);
      textSize(15 * coef);
      text(speechString.toUpperCase(), myWindowWidth / 2.1, myWindowHeight - 50);
      fill(255, 0, 0, hide_sensor);
      speechString = null;
    }

    if (!gameStarted && !gameCalibration && !gameResultBool()) {
      image(fight_button_image, myWindowWidth / 2 - 50 * coef, myWindowHeight - 150 * coef, 120 * coef, 60 * coef);
    }
    textSize(7 * coef);
    fill(255, 0, 0, hide_sensor);

    textSize(15 * coef);
    fill(255, 255, 255, 255);
    score = 0;
    if (gameStarted) {
      if (isDetecting === false) {
        bodyPose.detectStart(video, gotPoses);
        isDetecting = true;
      } 
      for (let i = 0; i < arrayScore.length; i++) {
        score += arrayScore[i];
      }
    }
    textStyle(BOLD);
    textSize(12 * coef);
    let myCurrentTime = Math.ceil((gameDuration - gameTimer - 1) / FRAME_RATE);
    strokeWeight(8 * coef);
    stroke(80);
    noFill();
    ellipse(myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);
    stroke(0,128,128);
    arc(myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, -90, -90 + map(Math.ceil(gameDuration / FRAME_RATE) - myCurrentTime, 0, Math.ceil(gameDuration / FRAME_RATE), 0, 360));
    noStroke();
    fill(255);
    textSize(20 * coef);
    textAlign(CENTER,CENTER)
    text(myCurrentTime, myWindowWidth / 3, OBJECT_POSE_SIZE);
    textAlign(LEFT,CENTER)
    textSize(12 * coef);
    strokeWeight(8 * coef);
    stroke(80);
    noFill();
    ellipse(2 * myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);
    stroke(128,0,128);
    arc(2 * myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, -90, -90 + map(score, 0, score_max, 0, 360));
    noStroke();
    fill(255);
    textSize(20 * coef);
    textAlign(CENTER,CENTER);
    text(score, 2 * myWindowWidth / 3, OBJECT_POSE_SIZE);
    textAlign(LEFT,CENTER);
    textStyle(NORMAL);
    textSize(12 * coef);
    if (menu === 2) {
      text("(T)ype: " + SHADOW_SPECIFIC[shadow_focus].toLowerCase(), 15, 36 * coef);
      text("(S)eries: " + gameCurrentSeries + " / " + gameSeries, 15, 56 * coef);
    }
    textSize(10 * coef);
    fill(255, 0, 0, hide_sensor);

    if (!gameCalibration && !gameStarted) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
    }

    if (gameTimer === 0) {
      curMoves = [];
      gameTimerNext = 0;
      arrayScore = [];
      for (let i = 0; i < moves.length; i++) arrayScore.push(0);
    }

    if (gameStarted) {
      image(stop_button_image, myWindowWidth - 100 * coef - 10, parseInt(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      fill(255, 0, 0, hide_sensor);
      if (Date.now() - hit_success < 1000) {
        image(good_hit_image, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
      }
      if (Date.now() - hit_success > 3000 && Date.now() - hit_success < 4000 && guard_warning - Date.now() < 2000 && Math.ceil((gameDuration - gameTimer) / FRAME_RATE) > 5) {
        if (curMoves.length > 3 && curMoves[curMoves.length - 1].hit === false && curMoves[curMoves.length - 2].hit === false && curMoves[curMoves.length - 3].hit === false) {
          image(keep_trying_image, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
          if (Date.now() - hit_success < 3019) {
            song_keep_trying.play();
          }
        }
      }
      if ((Date.now() - left_poses > 2000 || Date.now() - right_poses > 2000) && Math.ceil((gameDuration - gameTimer) / FRAME_RATE) > 5 && gameTimer > 100) {
        guard_warning += 100;
        if (guard_warning - Date.now() > 1000) {
          if (guard_warning - Date.now() < 1089) {
            song_your_guard.play();
          }
          if (guard_warning - Date.now() < 3000) {
            image(your_guard_image, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
          }
        }
        if (guard_warning - Date.now() > 10000) {
          guard_warning = Date.now();
        }
      } else {
        guard_warning = Date.now();
      }
    }
  }

  if (menu === 4) {
    shadow_focus = 0;
    stroke(0);
    strokeWeight(4);
    noFill();
    rect(myWindowWidth / 2 - 75 * coef, 15, 150 * coef, 20);
    rect(myWindowWidth / 2 - 75 * coef, 45, 150 * coef, 20);
    noStroke();
    fill(255, 0, 0);
    rect(myWindowWidth / 2 - 75 * coef + 2, 17, 148 * coef, 16);
    rect(myWindowWidth / 2 - 75 * coef + 2, 45, 148 * coef, 16);
    fill(255);
    if (my_opponent.stamina > 0) rect(myWindowWidth / 2 - 75 * coef + 2, 17, 148 * coef - (OPPONENTS[opponent].stamina - my_opponent.stamina) * coef * 24, 16);
    rect(myWindowWidth / 2 - 75 * coef + 2, 45, 148 * coef, 16);
    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
        if (nose.x * coef > right_init_pose_x + OBJECT_POSE_SIZE / 2) {
          right_dodge = Date.now();
        }
        if (nose.x * coef < left_init_pose_x - OBJECT_POSE_SIZE / 2) {
          left_dodge = Date.now();
        }
      }
      if (leftHand && leftHand.confidence > 0.1) {
        if (leftHand.x * coef < left_init_pose_x + OBJECT_POSE_SIZE && leftHand.x * coef > left_init_pose_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < left_init_pose_y && leftHand.y * coef + OBJECT_POSE_SIZE > left_init_pose_y) {
          left_poses = Date.now();
          left_hook = Date.now() - LEVEL * 10;
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (leftHand.y * coef > init_uppercut_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            left_uppercut = Date.now();
          }
        }
        if (leftHand.y * coef < init_jab_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            left_jab = Date.now();
          }
        }
        if (leftHand.x * coef < left_init_hook_x) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            left_hook = Date.now();
          }
        }
      }
      if (rightHand && rightHand.confidence > 0.1) {
        if (rightHand.x * coef < right_init_pose_x + OBJECT_POSE_SIZE && rightHand.x * coef > right_init_pose_x - OBJECT_POSE_SIZE && rightHand.y * coef < right_init_pose_y + OBJECT_POSE_SIZE && rightHand.y * coef > right_init_pose_y - OBJECT_POSE_SIZE) {
          right_poses = Date.now();
          right_hook = Date.now() - LEVEL * 10;
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (rightHand.y * coef > init_uppercut_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_uppercut = Date.now();
          }
        }
        if (rightHand.y * coef < init_jab_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_jab = Date.now();
          }
        }
        if (rightHand.x * coef > right_init_hook_x) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_hook = Date.now();
          }
        }
      }
      if (Date.now() - right_dodge < LEVEL * 10 && right_dodge - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        //punch_animation_type = 8;
        punch_animation_type = 1;
        punch_animation = 0;
        punch_animation_delay = 0;
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - left_dodge < LEVEL * 10 && left_dodge - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        //punch_animation_type = 9;
        punch_animation_type = 2;
        punch_animation = 0;
        punch_animation_delay = 0;
      }
      if (Date.now() - left_uppercut < LEVEL * 10 && left_uppercut - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 5;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves[curMoves.length - 1] && curMoves[curMoves.length - 1].type === 5) my_opponent.stamina--;
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - left_jab < LEVEL * 10 && left_jab - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 1;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves[curMoves.length - 1] && curMoves[curMoves.length - 1].type === 1) my_opponent.stamina--;
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - left_hook < LEVEL * 10 && left_hook - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 3;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves[curMoves.length - 1] && curMoves[curMoves.length - 1].type === 3) my_opponent.stamina--;
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - right_uppercut < LEVEL * 10 && right_uppercut - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 6;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves[curMoves.length - 1] && curMoves[curMoves.length - 1].type === 6) my_opponent.stamina--;
        right_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - right_jab < LEVEL * 10 && right_jab - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 2;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves[curMoves.length - 1] && curMoves[curMoves.length - 1].type === 2) my_opponent.stamina--;
        right_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - right_hook < LEVEL * 10 && right_hook - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 4;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves[curMoves.length - 1] && curMoves[curMoves.length - 1].type === 4) my_opponent.stamina--;
        right_poses = Date.now() - LEVEL * 10;
      }
      if (gameStarted) {
        if (gameTimerNext < Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))) {
          if (moves.length >= Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2)) && moves[Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))] >= 0) {
            curMoves.push({
              "hit": false,
              "type": curMoves.length < 4 ? 0 : parseInt(moves[Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))]),
              "x": 0,
              "y": 0
            })
          }
          gameTimerNext++;
        }
        let c = curMoves.length - 1;
        if (curMoves.length > 0 && 'type' in curMoves[c] && curMoves[c].type !== 0) {
          if (curMoves[c].type === 1 || curMoves[c].type === 2) {
            fill(100, 100, 0);
          } else if (curMoves[c].type === 3 || curMoves[c].type === 4) {
            fill(100, 0, 100);
          } else if (curMoves[c].type === 5 || curMoves[c].type === 6) {
            fill(0, 100, 100);
          } else if (curMoves[c].type === 7 || curMoves[c].type === 8) {
            fill(0, 0, 100);
          } else if (curMoves[c].type === 9) {
            fill(0, 0, 200);
          }
          if ([1,2].includes(curMoves[c].type)) circle(myWindowWidth / 2, myWindowHeight / 5, OBJECT_POSE_SIZE);
          else if (curMoves[c].type === 3) quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 4) quad(myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 5) quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2)
          else if (curMoves[c].type === 6) quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2)
          else if (curMoves[c].type === 7) quad(myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 8) quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 9) quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 6, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 6, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2)
          textSize(10 * coef);
          fill(255, 255, 255, 255);
          text(MOVE_TYPE[curMoves[c].type], myWindowWidth / 2 - coef * MOVE_TYPE[curMoves[c].type].length * 3, myWindowHeight / 5);
          tint(255, 224);
          if (curMoves[c].hit === false) {
            if (gameStarted && puncho_animation === -1 && curMoves[c].hit === false) {
              if (curMoves[c].type >= 7) puncho_animation_type = randomInteger(1,2);
              else puncho_animation_type = curMoves[c].type;
              puncho_animation = 0;
              puncho_animation_delay = 0;
            }
            if (puncho_animation >= 0 && curMoves[c].hit === false) {
              image(opponents_images[puncho_animation_type][puncho_animation], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
              if (puncho_animation_delay % 3 === 0) {
                if (puncho_animation >= 6) {
                  puncho_animation = -1;
                  puncho_animation_delay = 0;
                  curMoves[c].hit = true;
                } else puncho_animation++;
              }
              puncho_animation_delay++;
            }
          } else image(opponent_image[opponent], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);         
          tint(255, 192);
        } else {
          tint(255, 224);
          image(opponent_image[opponent], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
          tint(255, 192);
        }
        if (punch_animation >= 0) {
          image(me_images[punch_animation_type][punch_animation], myWindowWidth / 3.5, myWindowHeight / 2, myWindowWidth / 2.2, myWindowHeight / 2);
          if (punch_animation_delay % 3 === 0) {
            if (punch_animation >= 6) {
              punch_animation = -1;
              punch_animation_delay = 0;
            } else punch_animation++;
          }
          punch_animation_delay++;
        } else image(me_image, myWindowWidth / 3.5, myWindowHeight / 2, myWindowWidth / 2.2, myWindowHeight / 2);
        tint(255, 255);
        gameTimer++;
      }
    }
  }

  if (menu === 3) {
    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1 && isDetecting) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (leftHand && leftHand.confidence > 0.1) {
        if (leftHand.x * coef < left_init_pose_x + OBJECT_POSE_SIZE && leftHand.x * coef > left_init_pose_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < left_init_pose_y && leftHand.y * coef + OBJECT_POSE_SIZE > left_init_pose_y) {
          left_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (rightHand && rightHand.confidence > 0.1) {
        if (rightHand.x * coef < right_init_pose_x + OBJECT_POSE_SIZE && rightHand.x * coef > right_init_pose_x - OBJECT_POSE_SIZE && rightHand.y * coef < right_init_pose_y + OBJECT_POSE_SIZE && rightHand.y * coef > right_init_pose_y - OBJECT_POSE_SIZE) {
          right_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (gameStarted) {
        textSize(20 * coef);
        textAlign(CENTER,CENTER);
        textStyle(BOLD);
        if (gameTimer === 0) {
          pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
          pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
          pad_type = 1;
          curMoves = [];
          if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
            pad_type = 2;
          curMoves.push({
            "hit": false,
            "type": pad_type,
            "x": pad_x,
            "y": pad_y
          })
        }
        fill(100, 100, 0, 255);
        if (pad_type === 1) circle(pad_x, pad_y, OBJECT_POSE_SIZE);
        fill(0, 0, 100, 255);
        if (pad_type === 2) rect(OBJECT_POSE_SIZE, init_uppercut_y - OBJECT_POSE_SIZE / 2, myWindowWidth - 2 * OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, 20);
        fill(255, 255, 255, 192);
        if (pad_type === 1) {
          if (pad_x < myWindowWidth / 2) {
            text("L", pad_x, pad_y);
            if (leftHand && leftHand.confidence > 0.1 && leftHand.x * coef < pad_x + OBJECT_POSE_SIZE && leftHand.x * coef > pad_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < pad_y && leftHand.y * coef + OBJECT_POSE_SIZE > pad_y && Date.now() - left_poses < LEVEL * 10) {
              pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
              pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
              pad_type = 1;
              if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
                pad_type = 2;
              left_poses = Date.now() - LEVEL * 10;
              hitSuccess(curMoves.length - 1);
              curMoves.push({
                "hit": false,
                "type": pad_type,
                "x": pad_x,
                "y": pad_y
              })
            }
          } else {
            text("R", pad_x, pad_y);
            if (rightHand && rightHand.confidence > 0.1 && rightHand.x * coef < pad_x + OBJECT_POSE_SIZE && rightHand.x * coef > pad_x - OBJECT_POSE_SIZE && rightHand.y * coef - OBJECT_POSE_SIZE < pad_y && rightHand.y * coef + OBJECT_POSE_SIZE > pad_y && Date.now() - right_poses < LEVEL * 10) {
              pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
              pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
              pad_type = 1;
              if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
                pad_type = 2;
              right_poses = Date.now() - LEVEL * 10;
              hitSuccess(curMoves.length - 1);
              curMoves.push({
                "hit": false,
                "type": pad_type,
                "x": pad_x,
                "y": pad_y
              })
            }
          }
        } else if (pad_type === 2) {
          text("D", myWindowWidth / 2, init_uppercut_y);
          if (nose && nose.confidence > 0.1 && nose.y * coef > init_uppercut_y) {
            down_dodge = Date.now();
            down_dodge_done = true;
            down_dodge_switch = false;
          }
          if (nose && nose.confidence > 0.1 && nose.y * coef < init_uppercut_y) {
            if (down_dodge_done === true) {
              down_dodge_done = false;
              down_dodge_switch = true;
            }
          }
          if (Date.now() - down_dodge < LEVEL * 10 && down_dodge_switch === true) {
            down_dodge = Date.now() - LEVEL * 10;
            down_dodge_switch = false;
            down_dodge_done = false;
            pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
            pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
            pad_type = 1;
            if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) && (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) && (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) && (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
              pad_type = 2;
            hitSuccess(curMoves.length - 1);
            curMoves.push({
              "hit": false,
              "type": pad_type,
              "x": pad_x,
              "y": pad_y
            })
          }
        }
        textSize(10 * coef);
        textAlign(LEFT,CENTER);
        textStyle(NORMAL);
        gameTimer++;
      }
    }
  }

  if (menu === 2) {
    fill(255, 255, 255, 192);
    circle(myWindowWidth / 2, 50 + OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE + 10)
    if (feet_position === 0) image(lfeet_image, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, 50, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);
    if (feet_position === 1) image(rfeet_image, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, 50, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);
    if (gameResultBool() && curMoves.length > 0) {
      image(background_images[0],0, 0, myWindowWidth,myWindowHeight)
      score = 0;
      for (let i = 0; i < arrayScore.length; i++) {
        score += arrayScore[i];
      }
      textSize(20 * coef);
      text('Score: ' + score + " / " + score_max_prev, parseInt(myWindowWidth / 2.5) + 20 * coef, parseInt(myWindowHeight / 5));
      textSize(10 * coef);
      song_result = {};
      for (let r in curMoves) {
        if (curMoves[r].type === 0 || curMoves[r].type === 10) continue;
        if (!(curMoves[r].type.toString() in song_result)) {
          song_result[curMoves[r].type.toString()] = {
            "type": parseInt(curMoves[r].type),
            "text": curMoves[r].text,
            "success": 0,
            "total": 0
          }
        }
        song_result[curMoves[r].type.toString()]["total"]++;
        if (curMoves[r].hit === true) song_result[curMoves[r].type.toString()]["success"]++;
      }
      song_result.score = score;
      song_result.length = curMoves.length;
      let num = 0;
      for (let mt of Object.keys(song_result)) {
        if (["score","length"].includes(mt)) continue;
        fill(255);
        textSize(10 * coef);
        text(song_result[mt.toString()].success + " / " + song_result[mt.toString()].total, parseInt((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2), parseInt(myWindowHeight / 5 + 30 + 30 * Math.ceil((num + 1) / 2) * coef));
        let h = "R_";
        if ([1, 3, 5, 7].includes(song_result[mt.toString()].type)) h = "L_"
        if (song_result[mt.toString()].type === 1 || song_result[mt.toString()].type === 2) {
          fill(100, 100, 0, 255);
        } else if (song_result[mt.toString()].type === 3 || song_result[mt.toString()].type === 4) {
          fill(100, 0, 100, 255);
        } else if (song_result[mt.toString()].type === 5 || song_result[mt.toString()].type === 6) {
          fill(0, 100, 100, 255);
        } else if (song_result[mt.toString()].type === 7 || song_result[mt.toString()].type === 8) {
          fill(0, 0, 100, 255);
        } else if (song_result[mt.toString()].type === 9) {
          fill(0, 0, 200, 255);
        }
        circle(parseInt((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2) + 100, parseInt(myWindowHeight / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * coef), OBJECT_POSE_SIZE / 2);
        fill(255);
        textSize(5 * coef);
        text(h + song_result[mt.toString()].text, parseInt((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2) + 84, parseInt(myWindowHeight / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * coef));
        num++;
      }
      return;
    }

    if (gameStarted) {
      if (gameTimerNext < Math.ceil(gameTimer / FRAME_RATE)) {
        if (moves.length >= Math.ceil(gameTimer / FRAME_RATE) && moves[Math.ceil(gameTimer / FRAME_RATE)] >= 0) {
          let xt = parseInt(moves[Math.ceil(gameTimer / FRAME_RATE)]) % 2 ? left_init_pose_x : right_init_pose_x;
          if (moves[Math.ceil(gameTimer / FRAME_RATE)] === 10) xt = left_init_pose_x;
          curMoves.push({
            "hit": moves[Math.ceil(gameTimer / FRAME_RATE)] === 0 ? true : false,
            "type": parseInt(moves[Math.ceil(gameTimer / FRAME_RATE)]),
            "x": xt,
            "y": myWindowHeight
          })
        }
        gameTimerNext++;
      }
      for (let c = 0; c < curMoves.length; c++) {
        curMoves[c].y = curMoves[c].y - Math.ceil(240 / FRAME_RATE);
        let alpha = 128;
        if ([10].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
          alpha = 255;
          if (Date.now() - switch_guard > 10000 && curMoves[c].type === 10) {
            switch_guard = Date.now();
            switch_feet();
          }
        }
        if ([1, 3, 5, 7].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
          alpha = 255;
          if (Date.now() - left_jab < LEVEL * 10 && left_jab - left_poses < LEVEL * 10 && curMoves[c].type === 1) {
            hitSuccess(c);
          }
          if (Date.now() - left_hook < LEVEL * 10 && left_hook - left_poses < LEVEL * 10 && curMoves[c].type === 3) {
            hitSuccess(c);
          }
          if (Date.now() - left_uppercut < LEVEL * 10 && left_uppercut - left_poses < LEVEL * 10 && curMoves[c].type === 5) {
            hitSuccess(c);
          }
          if (Date.now() - left_dodge < LEVEL * 10 && left_dodge - left_poses < LEVEL * 10 && curMoves[c].type === 7) {
            hitSuccess(c);
          }
        }
        if ([2, 4, 6, 8, 9].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > right_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < right_init_pose_y) {
          alpha = 255;
          if (Date.now() - right_jab < LEVEL * 10 && right_jab - right_poses < LEVEL * 10 && curMoves[c].type === 2) {
            hitSuccess(c);
          }
          if (Date.now() - right_hook < LEVEL * 10 && right_hook - right_poses < LEVEL * 10 && curMoves[c].type === 4) {
            hitSuccess(c);
          }
          if (Date.now() - right_uppercut < LEVEL * 10 && right_uppercut - right_poses < LEVEL * 10 && curMoves[c].type === 6) {
            hitSuccess(c);
          }
          if (Date.now() - right_dodge < LEVEL * 10 && right_dodge - right_poses < LEVEL * 10 && curMoves[c].type === 8) {
            hitSuccess(c);
          }
          if (Date.now() - down_dodge < LEVEL * 10 && curMoves[c].type === 9) {
            hitSuccess(c);
          }
        }
        if (curMoves[c].type === 1 || curMoves[c].type === 2) {
          fill(100, 100, 0, alpha);
          if (feet_position === 1 && curMoves[c].type === 1) curMoves[c].text = "S";
          if (feet_position === 1 && curMoves[c].type === 2) curMoves[c].text = "J";
          if (feet_position === 0 && curMoves[c].type === 1) curMoves[c].text = "J";
          if (feet_position === 0 && curMoves[c].type === 2) curMoves[c].text = "S";
        } else if (curMoves[c].type === 3 || curMoves[c].type === 4) {
          fill(100, 0, 100, alpha);
          curMoves[c].text = "H";
        } else if (curMoves[c].type === 5 || curMoves[c].type === 6) {
          fill(0, 100, 100, alpha);
          curMoves[c].text = "U";
        } else if (curMoves[c].type === 7 || curMoves[c].type === 8) {
          fill(0, 0, 100, alpha);
          curMoves[c].text = "D";
        } else if (curMoves[c].type === 9) {
          fill(0, 0, 200, alpha);
          curMoves[c].text = "D";
        } else if (curMoves[c].type === 10) {
          fill(224, 224, 224, alpha);
          curMoves[c].text = "S";
        }
        if (curMoves[c].hit === true) fill(0, 255, 0, 127);
        if (curMoves[c].type > 0) {
          if (curMoves[c].type === 3) quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 4) quad(curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 5) quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2)
          else if (curMoves[c].type === 6) quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2)
          else if (curMoves[c].type === 7) quad(curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 8) quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)
          else if (curMoves[c].type === 9) {
            quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2)
            quad(right_init_pose_x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, right_init_pose_x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, right_init_pose_x + OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2, right_init_pose_x - OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2)
          } else circle(curMoves[c].x, curMoves[c].y, OBJECT_POSE_SIZE);
        }
        if ([10].includes(curMoves[c].type)) circle(right_init_pose_x, curMoves[c].y, OBJECT_POSE_SIZE);
        fill(255, 255, 255, 255);
        textSize(20 * coef);
        textStyle(BOLD);
        textAlign(CENTER,CENTER);
        if (curMoves[c].type > 0) text(curMoves[c].text, curMoves[c].x, curMoves[c].y);
        if ([9, 10].includes(curMoves[c].type)) text(curMoves[c].text, right_init_pose_x, curMoves[c].y);
        textAlign(LEFT,CENTER);
        textStyle(NORMAL);
      }
      gameTimer++;
    }

    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1 && isDetecting) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (leftHand && leftHand.confidence > 0.1) {
        if (leftHand.x * coef < left_init_pose_x + OBJECT_POSE_SIZE && leftHand.x * coef > left_init_pose_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < left_init_pose_y && leftHand.y * coef + OBJECT_POSE_SIZE > left_init_pose_y) {
          left_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted ) {
            if (Date.now() - left_hook < LEVEL * 10) {
              punchSound();
            }
            if (Date.now() - left_uppercut < LEVEL * 10) {
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (leftHand.x * coef < left_init_hook_x) {
          left_hook = Date.now();
          rect(0, 0, left_init_hook_x, myWindowHeight);
        }
        if (leftHand.y * coef > init_uppercut_y) {
          left_uppercut = Date.now();
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (leftHand.y * coef < init_jab_y) {
          fill(255, 255, 255, hide_sensor);
          rect(0, 0, myWindowWidth, init_jab_y);
          if (Date.now() - left_poses < LEVEL * 10 && Date.now() - right_poses < LEVEL * 10) {
            left_jab = Date.now();
            if (gameStarted) punchSound();
          }
        }
        if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          if (nose.x * coef < left_init_pose_x - OBJECT_POSE_SIZE / 2) {
            left_dodge = Date.now();
          }
          if (nose.x * coef > right_init_pose_x + OBJECT_POSE_SIZE / 2) {
            right_dodge = Date.now();
          }
          if (nose.y * coef > init_uppercut_y) {
            down_dodge = Date.now();
          }
        }
      }
      if (rightHand && rightHand.confidence > 0.1) {
        if (rightHand.x * coef < right_init_pose_x + OBJECT_POSE_SIZE && rightHand.x * coef > right_init_pose_x - OBJECT_POSE_SIZE && rightHand.y * coef < right_init_pose_y + OBJECT_POSE_SIZE && rightHand.y * coef > right_init_pose_y - OBJECT_POSE_SIZE) {
          right_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted || gameCalibration) {
            if (Date.now() - right_hook < LEVEL * 10) {
              punchSound();
            }
            if (Date.now() - right_uppercut < LEVEL * 10) {
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        if (isDetecting) circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (rightHand.x * coef > right_init_hook_x) {
          right_hook = Date.now();
          rect(right_init_hook_x, 0, right_init_hook_x, myWindowHeight);
        }
        if (rightHand.y * coef > init_uppercut_y) {
          right_uppercut = Date.now();
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (rightHand.y * coef < init_jab_y) {
          rect(0, 0, myWindowWidth, init_jab_y);
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_jab = Date.now();
            if (gameStarted) punchSound();
          }
        }
      }
    }
  }
}

function windowResized() {
  coef = Math.max(0.5, 0.05 * (Math.floor(Math.min(window.innerWidth / 32, window.innerHeight / 24))));
  myWindowWidth = coef * 640;
  myWindowHeight = coef * 480;
  resizeCanvas(myWindowWidth, myWindowHeight);
  OBJECT_POSE_SIZE = 48 * coef;
  positionCanvas();
}

function checkStartCondition() {
  if (gameReady) {
    errorTimer = 0;
    return gameReady;
  }
  if (poses.length > 0) {
    pose = poses[0];
    leftHand = pose["left_wrist"];
    rightHand = pose["right_wrist"];
    nose = pose["nose"]
    if (
      nose && leftHand &&
      rightHand &&
      leftHand.confidence > 0.1 &&
      rightHand.confidence > 0.1 &&
      nose.confidence > 0.1
    ) {
      gameReady = true;
    }
  }
  errorTimer++;
  if (errorTimer > 500) {
    error = "We failed to detect hands or others.";
  }
  return gameReady;
}

function gotPoses(results) {
  poses = results;
}
