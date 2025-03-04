const NUM_SONG = 310;

const MENUTYPE = {
  "0": "main",
  "1": "settings",
  "2": "shadow",
  "3": "pad",
  "4": "fight"
}

const OBJECT_NUMBERS = {
  'zero': 0,
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'eleven': 11,
  'twelve': 12,
  'thirteen': 13,
  'fourteen': 14,
  'fifteen': 15,
  'sixteen': 16,
  'seventeen': 17,
  'eighteen': 18,
  'nineteen': 19,
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'sixty': 60,
  'seventy': 70,
  'eighty': 80,
  'ninety': 90
};

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

const SHADOW_SPECIFIC = {
  "0": "ALL",
  "1": "JAB",
  "2": "HOOK",
  "3": "UCUT",
  "4": "DODGE",
  "5": "PUNCHES"
}

var wakeLock = null;
var menu = 0;
var myWindowWidth = 480;
var myWindowHeight = 320;
var coef = 0.75;

coef = 0.05 * (Math.floor(Math.min(window.innerWidth / 32, window.innerHeight / 24)));
myWindowWidth = coef * 640;
myWindowHeight = coef * 480;

const OBJECT_POSE_SIZE = 48 * coef;
const FRAME_RATE = 30;
var LEVEL = 50;

var leftHand;
var rightHand;
var nose;
var score = 0;
var level = parseFloat(localStorage.getItem("level")) || 0;
var shadow_focus = parseFloat(localStorage.getItem("shadow_focus")) || 0;
var arrayScore = [];
var background_image;
var menu_image;
var rfeet_image;
var lfeet_image;
var settings_image;
var microphone_image;
var fullscreen_image;
var leave_image;
var plus_image;
var backgroundId = parseFloat(localStorage.getItem("background_id")) || 1;
var hide_sensor = 0;
var video;
var punch_sound;
var click_sound;
var bodyPose;
var pose = {};
var poses = [];
var gameTimer = -1;
var gameTimerNext = 0;
var gameLength = 60;
var gameDuration = FRAME_RATE * 100;
var gameOver = false;
var gameStarted = false;
var gameReady = false;
var gameCalibration = false;
var song = {};
var songId = parseFloat(localStorage.getItem("song_id")) || 1;
var song_result = {};
var song_random = false;
var feet_position = parseInt(localStorage.getItem("feet_position")) || 0;

var moves = [];
var curMoves = [];

var pad_x;
var pad_y;

var left_init_pose_dragging = false;
var left_init_pose_x = parseFloat(localStorage.getItem("left_init_pose_x")) || myWindowWidth / 3;
var left_init_pose_y = parseFloat(localStorage.getItem("left_init_pose_y")) || myWindowWidth / 3;
var right_init_pose_dragging = false;
var right_init_pose_x = parseFloat(localStorage.getItem("right_init_pose_x")) || 2 * myWindowWidth / 3;
var right_init_pose_y = parseFloat(localStorage.getItem("right_init_pose_y")) || myWindowHeight / 3;

var left_init_hook_dragging = false;
var left_init_hook_x = parseFloat(localStorage.getItem("left_init_hook_x")) || 120;
var right_init_hook_dragging = false;
var right_init_hook_x = parseFloat(localStorage.getItem("right_init_hook_x")) || myWindowWidth - 120;

var init_uppercut_dragging = false;
var init_uppercut_y = parseFloat(localStorage.getItem("init_uppercut_y")) || myWindowHeight * 3 / 4;

var init_jab_dragging = false;
var init_jab_y = parseFloat(localStorage.getItem("init_jab_y")) || myWindowHeight / 4;

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
var switch_guard = Date.now() - 10000;
var punch_sound_time = Date.now() - 1000;
var hit_success = Date.now() - 1000;
var gameOverTime = Date.now() - 1000;
var gameResult = Date.now() - 1000;
var guard_warning = Date.now();

var speechRec = {
  "resultString": ""
};
var speechRecEnabled = true;
var recognizing = false;
var speechSpeak;
var speechTime = Date.now();
var music;
var songwait = false;
var songwaittime = Date.now();
var songvalue = "";
var playerwait = false;
var playervalue = "";
var players = [];
var logged_player = false;
var selected_player = localStorage.getItem("selected_player") || "player";
var player = JSON.parse(localStorage.getItem(selected_player)) || {
  "name": (Math.random() + 1).toString(36).substring(2),
  "score": 0,
  "scores": {}
};
for (let s of Object.keys(player.scores)) {
  player.score += player.scores[s].score
}

function getPlayers() {
  players = [];
  for (let p of Object.keys(localStorage)) {
    if (p.startsWith("player-")) players.push(p);
  }
  if (selected_player && selected_player != "player") logged_player = true;
}
getPlayers();

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request();
    wakeLock.addEventListener('release', () => {
      console.log('Screen Wake Lock released:', wakeLock.released);
    });
    console.log('Screen Wake Lock released:', wakeLock.released);
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
};
requestWakeLock();

function feach(w) {
  var x = OBJECT_NUMBERS[w];
  if (x != null) {
    g = g + x;
  } else if (w == "hundred") {
    g = g * 100;
  }
}

function text2num(s) {
  a = s.toString().split(/[\s-]+/);
  n = 0;
  g = 0;
  a.forEach(feach);
  return n + g;
}

function fetchBackground(id = 1) {
  background_image = loadImage('assets/backgrounds/' + backgroundId + '.jpg');
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadSongmoves() {
  LEVEL = 50 - level * 10;
  if (song) {
    gameLength = parseInt(song.length);
    gameDuration = gameLength * FRAME_RATE;
    if (song.moveLength === 0) {
      song.moves = [];
      song.moves[0] = 0
      let rand = 0;
      for (let i = 1; i < gameLength - 5; i++) {
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
      song.moves[Math.floor(gameLength / 2)] = 10;
    }
    moves = song.moves;
  }
}

function fetchSong(id = 1, speak = true) {
  fetch("/db/" + id + ".json?v=" + hit_success)
    .then(response => response.json())
    .then(data => {
      song = data;
      song.moveLength = song.moves.length;
      localStorage.setItem("song_id", id);
      loadSongmoves();
      music = loadSound(song.url);
      if (speak) speechSpeak.speak("song " + song.name + " selected !");
    })
    .catch(function (err) {
      songId = parseFloat(localStorage.getItem("song_id")) || 1;
      localStorage.setItem("song_id", songId);
      if (speak) speechSpeak.speak("this song does not exist !");
    });
}

function punchSound() {
  if (punch_sound_time + 1000 < Date.now()) {
    punch_sound.play();
    punch_sound_time = Date.now();
  }
}

function handleChange() {
  if (mouseX > myWindowWidth / 4 - OBJECT_POSE_SIZE / 2 - 100 * coef && mouseX < myWindowWidth / 4 - 100 * coef + OBJECT_POSE_SIZE / 2 && mouseY > myWindowHeight - 40 * coef && mouseY < myWindowHeight - 40 * coef + OBJECT_POSE_SIZE / 2) {
    if (!recognizing) speechRec.start();
    recognizing = true;
  }
  if (menu === 0) {
    if (mouseX > myWindowWidth / 2 - OBJECT_POSE_SIZE / 2 + 100 * coef && mouseX < myWindowWidth / 2 + OBJECT_POSE_SIZE / 2 + 100 * coef && mouseY > myWindowHeight - 40 * coef && mouseY < myWindowHeight - 40 * coef + OBJECT_POSE_SIZE / 2) {
      menu = 1;
    }
    if (mouseX > myWindowWidth / 2 - OBJECT_POSE_SIZE / 2 && mouseX < myWindowWidth / 2 + OBJECT_POSE_SIZE / 2 && mouseY > myWindowHeight - 40 * coef && mouseY < myWindowHeight - 40 * coef + OBJECT_POSE_SIZE / 2) {
      let fs = fullscreen();
      fullscreen(!fs);
    }
    for (let p = 0; p < players.length; p++) {
      if (mouseX > myWindowWidth - 175 - 75 * p && mouseX < myWindowWidth - 175 - 75 * p + 25 * coef && mouseY > 10 && mouseY < 25 * coef + 20) {
        click_sound.play();
        selected_player = players[p];
        localStorage.setItem("selected_player", selected_player);
        player = JSON.parse(localStorage.getItem(selected_player));
        logged_player = true;
      }
    }
    if (mouseX > myWindowWidth - 100 && mouseX < myWindowWidth - 100 + 25 * coef && mouseY > 20 && mouseY < 20 + 25 * coef) {
      click_sound.play();
      if (logged_player === false && playerwait === false) {
        playerwait = true;
        playervalue = "";
      } else {
        logged_player = false;
        playerwait = false;
        selected_player = "player"
        player = JSON.parse(localStorage.getItem(selected_player));
      }
    }
    if (mouseX < parseInt(myWindowWidth / 6) + 100 * coef && mouseX > parseInt(myWindowWidth / 6)) {
      if (mouseY < parseInt(myWindowHeight / 6 + 50 * coef) && mouseY > parseInt(myWindowHeight / 6)) {
        click_sound.play();
        menu = 2;
        curMoves = [];
        return;
      }
      if (mouseY < parseInt(myWindowHeight / 6 + 150 * coef) && mouseY > parseInt(myWindowHeight / 6 + 100 * coef)) {
        click_sound.play();
        menu = 3;
        curMoves = [];
        return;
      }
      if (mouseY < parseInt(myWindowHeight / 6 + 250 * coef) && mouseY > parseInt(myWindowHeight / 6 + 200 * coef)) {
        click_sound.play();
        menu = 4
        curMoves = [];
        return;
      }
    }
  }
  if (menu === 2) {
    if (!gameStarted && mouseX > myWindowWidth / 2 - OBJECT_POSE_SIZE / 2 && mouseX < myWindowWidth / 2 + OBJECT_POSE_SIZE && mouseY > 50 && mouseY < 50 + OBJECT_POSE_SIZE) {
      switch_feet();
      localStorage.setItem("feet_position", feet_position);
    }
  }
  if ([2, 3].includes(menu)) {
    if (mouseX > width / 2.5 - 40 && mouseX < width / 2.5 - 40 + 100 * coef) {
      if (mouseY > height - 148 * coef && mouseY < height - 108 * coef) {
        click_sound.play();
        if (!gameStarted) {
          feet_position = parseInt(localStorage.getItem("feet_position")) || 0;
          speechSpeak.speak("let's fight!");
          gameStarted = true;
          curMoves = [];
          gameCalibration = false;
          hide_sensor = 0;
          gameTimer = 0;
          score = 0;
          arrayScore = [];
        } else speechRec.resultString = "Already fighting"
        return;
      }
      if ([2, 3].includes(menu) && mouseY > height - 98 * coef && mouseY < height - 58 * coef) {
        click_sound.play();
        if (!gameStarted) {
          gameCalibration = true;
          hide_sensor = 64;
        }
        return;
      }
      if (mouseY > height - 48 * coef && mouseY < height - 8 * coef) {
        click_sound.play();
        songwait = true;
        songvalue = "";
        return;
      }
    }
  }
  if (menu != 0) {
    if (mouseX > myWindowWidth - 100 * coef && mouseX < myWindowWidth && mouseY < parseInt(myWindowHeight - 10 * coef) && mouseY > parseInt(myWindowHeight - 60 * coef)) {
      click_sound.play();
      if (menu === 2 && !gameStarted && !gameCalibration) menu = 0;
      else if (menu === 2 && (gameStarted || gameCalibration)) gameOver = true;
      else menu = 0;
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
  background_image = loadImage('assets/backgrounds/' + backgroundId + '.jpg');
  menu_image = loadImage('assets/images/menu_image.png');
  rfeet_image = loadImage('assets/images/RFoot.png');
  lfeet_image = loadImage('assets/images/LFoot.png');
  settings_image = loadImage('assets/images/settings.png');
  microphone_image = loadImage('assets/images/microphone.png');
  fullscreen_image = loadImage('assets/images/fullscreen.png');
  adduser_image = loadImage('assets/images/plus.png');
  leave_image = loadImage('assets/images/leave.png');
  bodyPose = ml5.bodyPose("BlazePose", {
    flipped: true
  });
}

function keyPressed() {
  if (menu === 0 && playerwait === true && (key.match(/^[\d\w]$/i) || keyCode === 13)) {
    if (keyCode !== 13) playervalue += key;
    if (playervalue.length === 16 || keyCode === 13) {
      playerwait = false;
      let exists = false;
      for (let p of players) {
        if (p.startsWith("player-" + playervalue + "-")) {
          logged_player = false;
          exists = true;
        }
      }
      if (!exists) {
        logged_player = true;
        player = {
          "name": playervalue,
          "score": 0,
          "scores": {}
        };
        localStorage.setItem("player-" + playervalue + "-" + Date.now(), JSON.stringify(player));
      }
      getPlayers();
    }
    return;
  }
  if (['g', 'G'].includes(key) && menu === 2) {
    songwait = true;
    songvalue = "";
  }
  if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(parseInt(key))) {
    if (songwait) {
      songvalue += key;
      if (songvalue.length === 3) {
        songwait = false;
        songwaittime = Date.now();
        songId = parseInt(songvalue);
        if (songId === 0) {
          song_random = true;
          songId = Math.floor(Math.random() * NUM_SONG) + 1
        } else song_random = false
        fetchSong(songId);
      }
    }
  }
  if (['b', 'B'].includes(key) && [1, 2, 3].includes(menu)) {
    if (!gameStarted) {
      menu = 0;
    }
  }
  if (['c', 'C'].includes(key) && [2, 3].includes(menu)) {
    if (!gameStarted) {
      gameCalibration = true;
      hide_sensor = 64;
    } else speechRec.resultString = "No calibration in game"
  }
  if (['s', 'S'].includes(key) && [2, 3].includes(menu)) {
    gameOver = true;
  }
  if (['t', 'T'].includes(key) && [2, 3].includes(menu)) {
    if (shadow_focus < Object.keys(SHADOW_SPECIFIC).length - 1) shadow_focus++;
    else shadow_focus = 0;
    localStorage.setItem("shadow_focus", shadow_focus);
    loadSongmoves();
  }
  if (['l', 'L'].includes(key) && [2, 3].includes(menu)) {
    if (level < Object.keys(GAME_LEVEL).length - 1) level++;
    else level = 0;
    localStorage.setItem("level", level);
    loadSongmoves();
  }
  if (['s', 'S'].includes(key) && menu === 0) {
    menu = 2;
  }
  if (['p', 'P'].includes(key) && menu === 0) {
    menu = 3;
  }
  if (['f', 'F'].includes(key) && menu === 0) {
    menu = 4;
  }
  if (['r', 'R'].includes(key) && [2, 3].includes(menu)) {
    left_init_pose_x = myWindowWidth / 3;
    localStorage.setItem("left_init_pose_x", left_init_pose_x);
    left_init_pose_y = myWindowWidth / 3;
    localStorage.setItem("left_init_pose_y", left_init_pose_x);
    right_init_pose_x = 2 * myWindowWidth / 3;
    localStorage.setItem("right_init_pose_x", right_init_pose_x);
    right_init_pose_y = myWindowHeight / 3;
    localStorage.setItem("right_init_pose_y", right_init_pose_y);
    init_jab_y = myWindowHeight / 4;
    localStorage.setItem("init_jab_y", init_jab_y);
    init_uppercut_y = myWindowHeight * 3 / 4;
    localStorage.setItem("init_uppercut_y", init_uppercut_y);
    left_init_hook_x = 120;
    localStorage.setItem("left_init_hook_x", left_init_hook_x);
    right_init_hook_x = myWindowWidth - 120;
    localStorage.setItem("right_init_hook_x", right_init_hook_x);
  }
  if (['f', 'F'].includes(key) && [2, 3].includes(menu)) {
    if (!gameStarted) {
      feet_position = parseInt(localStorage.getItem("feet_position")) || 0;
      speechSpeak.speak("let's fight!");
      gameStarted = true;
      curMoves = [];
      gameCalibration = false;
      hide_sensor = 0;
      gameTimer = 0;
      score = 0;
      arrayScore = [];
    } else speechRec.resultString = "Already fighting"
  }
}

function gotSpeech() {
  if (speechRec.resultValue) {
    console.log(speechRec.resultString)
    if (menu === 0) {
      if (speechRec.resultString.includes("shadow")) {
        speechTime = Date.now();
        menu = 2;
        click_sound.play();
        menu = 2;
        curMoves = [];
      }
    }
    if (menu === 2) {
      if (speechRec.resultString.includes("fight")) {
        speechTime = Date.now();
        if (!gameStarted) {
          speechSpeak.speak("let's fight!");
          gameStarted = true;
          curMoves = [];
          gameCalibration = false;
          hide_sensor = 0;
          gameTimer = 0;
          score = 0;
          arrayScore = [];
        } else speechRec.resultString = "Already fighting"
      } else if (speechRec.resultString.includes("calibrate")) {
        speechTime = Date.now();
        if (!gameStarted) {
          gameCalibration = true;
          hide_sensor = 64;
        } else speechRec.resultString = "No calibration in game"
      } else if (speechRec.resultString.includes("stop")) {
        speechTime = Date.now();
        gameOver = true;
      } else if (speechRec.resultString.includes("reset")) {
        speechTime = Date.now();
        left_init_pose_x = myWindowWidth / 3;
        localStorage.setItem("left_init_pose_x", left_init_pose_x);
        left_init_pose_y = myWindowWidth / 3;
        localStorage.setItem("left_init_pose_y", left_init_pose_x);
        right_init_pose_x = 2 * myWindowWidth / 3;
        localStorage.setItem("right_init_pose_x", right_init_pose_x);
        right_init_pose_y = myWindowHeight / 3;
        localStorage.setItem("right_init_pose_y", right_init_pose_y);
        init_jab_y = myWindowHeight / 4;
        localStorage.setItem("init_jab_y", init_jab_y);
        init_uppercut_y = myWindowHeight * 3 / 4;
        localStorage.setItem("init_uppercut_y", init_uppercut_y);
        left_init_hook_x = 120;
        localStorage.setItem("left_init_hook_x", left_init_hook_x);
        right_init_hook_x = myWindowWidth - 120;
        localStorage.setItem("right_init_hook_x", right_init_hook_x);
      } else if (speechRec.resultString.startsWith("song number")) {
        speechTime = Date.now();
        if (speechRec.resultString.split(" ").length > 2)
          songId = text2num(speechRec.resultString.split(" ")[2]);
        if (songId === 0) {
          speechSpeak.speak("song not found!");
          fill(255, 255, 255, 255);
          textSize(30);
          text("song not found!", myWindowWidth / 2.1, myWindowHeight - 50);
          fill(255, 0, 0, hide_sensor);
        } else fetchSong(songId);
      } else if (speechRec.resultString.startsWith("background number")) {
        speechTime = Date.now();
        if (speechRec.resultString.split(" ").length > 2)
          backgroundId = text2num(speechRec.resultString.split(" ")[2]);
        if (backgroundId < 1 || backgroundId > 3) {
          speechSpeak.speak("background not found!");
          fill(255, 255, 255, 255);
          textSize(30);
          text("background not found!", myWindowWidth / 2.1, myWindowHeight - 50);
          fill(255, 0, 0, hide_sensor);
        } else fetchBackground(backgroundId);
      } else if (speechRec.resultString.startsWith("change feet")) {
        speechTime = Date.now();
        switch_feet()
      }
    }
  }
}

function onEndSpeechRec() {
  recognizing = false;
}

function switch_feet() {
  if (feet_position === 0) feet_position = 1;
  else feet_position = 0;
}

function hitSuccess() {
  if (arrayScore[c] === 0) {
    if (c < 2) speechSpeak.speak("well done!");
    if (c >= 2 && arrayScore[c - 2] + arrayScore[c - 1] === 2) {
      let r = Math.floor(Math.random() * 11)
      if (r === 0 || r === 1) speechSpeak.speak("great!");
      if (r === 2 || r === 3) speechSpeak.speak("awesome!");
      if (r === 4 || r === 5) speechSpeak.speak("good!");
      if (r === 6 || r === 7) speechSpeak.speak("perfect!");
      if (r === 8 || r === 9) speechSpeak.speak("continue!");
      if (r === 10 || r === 11) speechSpeak.speak("that's it!");
    }
    hit_success = Date.now();
  }
  curMoves[c].hit = true;
  arrayScore[c] = 1;
}

function setup() {
  frameRate(FRAME_RATE);
  speechSpeak = new p5.Speech();
  if (speechRecEnabled) {
    speechRec = new p5.SpeechRec('en-US', gotSpeech);
    speechRec.continuous = false;
    speechRec.interimResults = false;
    speechRec.start();
    recognizing = true;
    speechRec.onEnd = onEndSpeechRec;
  }
  cnv = createCanvas(myWindowWidth, myWindowHeight);
  cnv.position((window.innerWidth - myWindowWidth) / 2, 0)
  fetchSong(songId, false);
  click_sound = loadSound('assets/sounds/click.mp3');
  punch_sound = loadSound('assets/sounds/punch.mp3');

  video = createCapture(VIDEO, {
    flipped: true
  });
  video.hide();
  bodyPose.detectStart(video, gotPoses);
  checkStartCondition();

}

function draw() {
  background(background_image);
  textSize(10 * coef);
  fill(0, 0, 0);
  if (recognizing){
    stroke(192, 204, 0);
    strokeWeight(4);
  }
  rect(myWindowWidth / 4 - OBJECT_POSE_SIZE / 2 - 100 * coef, myWindowHeight - 40 * coef, OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE / 2, 20);
  image(microphone_image, myWindowWidth / 4 - OBJECT_POSE_SIZE / 2 - 100 * coef, myWindowHeight - 40 * coef, OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE / 2);
  strokeWeight(0);
  if (menu === 0) {
    for (let i = 0; i < players.length; i++) {
      fill(0, 0, 0);
      stroke(192, 64, 204);
      if (players[i].startsWith("player-" + player.name)) stroke(255, 64, 127);
      strokeWeight(4);
      rect(myWindowWidth - 175 - 75 * i, 20, 25 * coef, 25 * coef, 20);
      stroke(0);
      strokeWeight(0);
      fill(255);
      text(players[i].split("-")[1].substring(0, 3), myWindowWidth - 175 - 75 * i + 5 * coef, 20 + 15 * coef);
    }
    if (logged_player) {
      fill(0, 0, 0);
      stroke(192, 204, 0);
      strokeWeight(4);
      rect(myWindowWidth - 100, 20, 25 * coef, 25 * coef, 20);
      stroke(0);
      strokeWeight(0);
      fill(255);
      image(leave_image, myWindowWidth - 100 + 2.5 * coef, 20 + 2.5 * coef, 20 * coef, 20 * coef);
    } else {
      if (players.length < 6) {
        fill(0, 0, 0);
        stroke(192, 204, 0);
        strokeWeight(4);
        rect(myWindowWidth - 100, 20, 25 * coef, 25 * coef, 20);
        stroke(0);
        strokeWeight(0);
        fill(255);
        image(adduser_image, myWindowWidth - 100 + 2.5 * coef, 20 + 2.5 * coef, 20 * coef, 20 * coef);
      }
    }
    gameResult = Date.now() - 5001;
    fill(0, 0, 0);
    image(menu_image, myWindowWidth / 2.5, myWindowHeight / 6, myWindowWidth / 2, myWindowWidth / 2);
    rect(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight - 40 * coef, OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE / 2, 20);
    image(fullscreen_image, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight - 40 * coef, OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE / 2);
    rect(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2 + 100 * coef, myWindowHeight - 40 * coef, OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE / 2, 20);
    image(settings_image, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2 + 100 * coef, myWindowHeight - 40 * coef, OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE / 2);
    rect(myWindowWidth / 6, parseInt(myWindowHeight / 6), 100 * coef, 50 * coef, 20);
    rect(myWindowWidth / 6, parseInt(myWindowHeight / 6 + 100 * coef), 100 * coef, 50 * coef, 20);
    rect(myWindowWidth / 6, parseInt(myWindowHeight / 6 + 200 * coef), 100 * coef, 50 * coef, 20);
    fill(255);
    text('(S)HADOW', parseInt(myWindowWidth / 6) + 20 * coef, parseInt(myWindowHeight / 6 + 30 * coef));
    text('(P)AD', parseInt(myWindowWidth / 6) + 20 * coef, parseInt(myWindowHeight / 6 + 130 * coef));
    text('(F)IGHT', parseInt(myWindowWidth / 6) + 20 * coef, parseInt(myWindowHeight / 6 + 230 * coef));
    if (playerwait) {
      fill(0, 0, 0, 255);
      rect(parseInt(myWindowWidth / 3), parseInt(myWindowHeight / 4), parseInt(myWindowWidth / 3), parseInt(myWindowHeight / 5), 20);
      fill(255);
      text('Name : ', parseInt(myWindowWidth / 3) + 20 * coef, parseInt(myWindowHeight / 4 + 30 * coef));
      textSize(40);
      text(playervalue.padEnd(16, "_"), parseInt(myWindowWidth / 3) + 20 * coef, parseInt(myWindowHeight / 4 + 60 * coef));
    }
  } else {
    if (menu === 2 && !gameStarted || (menu === 3 || menu === 4 || menu === 1)) {
      fill(0, 0, 0);
      rect(myWindowWidth - 100 * coef - 10, parseInt(myWindowHeight - 60 * coef), 100 * coef, 50 * coef, 20);
      fill(255);
      text('(B)ACK', myWindowWidth - 80 * coef, parseInt(myWindowHeight - 60 * coef) + 30 * coef);
    }
  }

  if (menu > 1) {

    if (gameDuration - gameTimer <= 0) {
      gameOver = true;
      speechSpeak.speak("good job! song is over!");
      gameOverTime = Date.now();
    }

    if (gameOver) {
      gameCalibration = false;
      gameStarted = false;
      hide_sensor = 0;
      gameTimer = -1;
      music.stop();
      gameOver = false;
      gameResult = Date.now();
      if (song_random === true) {
        songId = Math.floor(Math.random() * NUM_SONG) + 1
        fetchSong(songId);
      }
      player.score = 0;
      for (let s of Object.keys(player.scores)) {
        player.score += player.scores[s].score
      }
      localStorage.setItem(selected_player, JSON.stringify(player));
      feet_position = parseInt(localStorage.getItem("feet_position")) || 0;
    }

    if (Date.now() - gameOverTime < 2000) {
      textSize(40);
      fill(255, 255, 255, 255);
      text("Good job!", myWindowWidth / 2.3, myWindowHeight / 6);
      text("Song is over!", myWindowWidth / 2.3, myWindowHeight / 6 + 50);
      fill(255, 0, 0, hide_sensor);
      textSize(20);
    }

    if (Date.now() - gameResult < 5000 && curMoves.length > 0) {
      fill(0, 0, 0, 255);
      rect(parseInt(myWindowWidth / 8), parseInt(myWindowHeight / 6), parseInt(3 * myWindowWidth / 4), parseInt(3 * myWindowHeight / 4), 20);
      fill(255);
      text('Score : ' + score, parseInt(myWindowWidth / 2.5) + 20 * coef, parseInt(myWindowHeight / 5 + 30 * coef));
      textSize(20);
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
      let num = 0;
      if (!(songId in player.scores)) {
        song_result.count = 1;
        player.scores[songId] = song_result;
        localStorage.setItem(selected_player, JSON.stringify(player));
      } else if (player.scores[songId].score < score) {
        "count" in song_result ? song_result.count++ : song_result.count = 2;
        player.scores[songId] = song_result;
        localStorage.setItem(selected_player, JSON.stringify(player));
      }
      for (let mt of Object.keys(song_result)) {
        if (mt === "score") continue;
        fill(255);
        textSize(20);
        text(song_result[mt.toString()].success + " / " + song_result[mt.toString()].total, parseInt((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2), parseInt(myWindowHeight / 5 + 30 + 30 * Math.ceil((num + 1) / 2) * coef));
        let h = "R_";
        if ([1, 3, 5, 7].includes[song_result[mt.toString()].type]) h = "L_"
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
        } else if (song_result[mt.toString()].type === 10) {
          fill(0, 200, 0, 255);
        }
        circle(parseInt((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2) + 100, parseInt(myWindowHeight / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * coef), OBJECT_POSE_SIZE / 2);
        fill(255);
        textSize(9);
        text(h + song_result[mt.toString()].text, parseInt((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2) + 84, parseInt(myWindowHeight / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * coef));
        num++;
      }
      return;
    }

    if (gameTimer === 0) {
      curMoves = [];
      gameTimerNext = 0;
      music.play();
      for (let i = 0; i < moves.length; i++) arrayScore.push(0);
    }

    if (speechRec && 'resultString' in speechRec && speechTime > Date.now() - 1000) {
      console.log(speechRec.resultString)
      fill(255, 255, 255, 255);
      textSize(30);
      text(speechRec.resultString.toUpperCase(), width / 2.1, height - 50);
      fill(255, 0, 0, hide_sensor);
    }

    if (!gameStarted && !(speechTime > Date.now() - 1000)) {
      textSize(10 * coef);
      fill(0, 0, 0);
      rect(width / 2.5 - 40, height - 148 * coef, 100 * coef, 40 * coef, 20);
      rect(width / 2.5 - 40, height - 98 * coef, 100 * coef, 40 * coef, 20);
      rect(width / 2.5 - 40, height - 48 * coef, 100 * coef, 40 * coef, 20);
      fill(255, 255, 255, 224);
      text("(F)IGHT", width / 2.5 - 30, height - 125 * coef);
      text("(C)ALIBRATE", width / 2.5 - 30, height - 75 * coef);
      text("SON(G) NUM X", width / 2.5 - 30, height - 25 * coef);
    }

    fill(255, 255, 255, 255);
    textSize(14);
    if (song) text(`Song (${songId}): ${song.name}`, myWindowWidth - 200, 30);
    text(`Length: ${song.length}s`, myWindowWidth - 200, 50);
    fill(255, 0, 0, hide_sensor);

    textSize(30);
    fill(255, 255, 255, 255);
    score = 0;
    for (let i = 0; i < arrayScore.length; i++) {
      score += arrayScore[i];
    }
    text("Score: " + score, 15, 30);
    textSize(30);
    text("Name: " + ('name' in player ? player.name : ""), 15, 60);
    textSize(20);
    text("(L)evel: " + GAME_LEVEL[level.toString()], 15, 85);
    text("(T)ype: " + SHADOW_SPECIFIC[shadow_focus].toLowerCase(), 15, 110);
    fill(255, 0, 0, hide_sensor);
    if (songwait || songwaittime + 1000 > Date.now()) {
      fill(0, 0, 0, 255);
      rect(parseInt(myWindowWidth / 2.5), parseInt(myWindowHeight / 4), parseInt(myWindowWidth / 4), parseInt(myWindowHeight / 5), 20);
      fill(255);
      text('SONG : ', parseInt(myWindowWidth / 2.5) + 20 * coef, parseInt(myWindowHeight / 4 + 30 * coef));
      textSize(40);
      text(songvalue.padEnd(3, "_"), parseInt(myWindowWidth / 2.5) + 20 * coef, parseInt(myWindowHeight / 4 + 60 * coef));
    }
  }

  if (menu === 3) {
    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (leftHand && leftHand.confidence > 0.1) {
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (rightHand && rightHand.confidence > 0.1) {
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (gameStarted) {
        if (gameTimer === 0) {
          pad_x = floor(Math.random() * (width - 100) + 50);
          pad_y = Math.floor(Math.random() * (height - 100) + 50);
        }
        fill(255, 255, 255, 64);
        circle(pad_x, pad_y, OBJECT_POSE_SIZE);
        if (pad_x < width / 2) {
          if (leftHand.x * coef < pad_x + OBJECT_POSE_SIZE && leftHand.x * coef > pad_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < pad_y && leftHand.y * coef + OBJECT_POSE_SIZE > pad_y) {
            pad_x = floor(Math.random() * (width - 50) + 50);
            pad_y = Math.floor(Math.random() * (height - 50) + 50);
          }
        } else {
          if (rightHand.x * coef < pad_x + OBJECT_POSE_SIZE && rightHand.x * coef > pad_x - OBJECT_POSE_SIZE && rightHand.y * coef - OBJECT_POSE_SIZE < pad_y && rightHand.y * coef + OBJECT_POSE_SIZE > pad_y) {
            pad_x = floor(Math.random() * (width - 50) + 50);
            pad_y = Math.floor(Math.random() * (height - 50) + 50);
          }
        }
        gameTimer++;
      }
    }
  }

  if (menu === 2) {
    fill(255, 255, 255, 192);
    circle(myWindowWidth / 2, 50 + OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE + 10)
    if (feet_position === 0) image(lfeet_image, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, 50, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);
    if (feet_position === 1) image(rfeet_image, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, 50, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);

    if (gameCalibration) {
      fill(0, 0, 0);
      rect(myWindowWidth - 100 * coef - 10, parseInt(myWindowHeight - 60 * coef), 100 * coef, 50 * coef, 20);
      fill(255);
      text('(S)TOP', myWindowWidth - 80 * coef, parseInt(myWindowHeight - 60 * coef) + 30 * coef);
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

    stroke(255);
    strokeWeight(hide_sensor / 255);
    fill(255, 255, 255, 64);
    circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
    circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
    fill(255, 255, 255, 32);
    rect(left_init_pose_x - OBJECT_POSE_SIZE / 2, 0, OBJECT_POSE_SIZE, myWindowHeight);
    rect(right_init_pose_x - OBJECT_POSE_SIZE / 2, 0, OBJECT_POSE_SIZE, myWindowHeight);
    fill(255, 255, 255, hide_sensor);
    rect(0, 0, myWindowWidth, init_jab_y);
    rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
    rect(0, 0, left_init_hook_x, myWindowHeight);
    rect(right_init_hook_x, 0, right_init_hook_x, myWindowHeight);

    if (gameStarted) {
      fill(255, 255, 255, 255);
      text(`Time Left: ${Math.ceil((gameDuration - gameTimer) / FRAME_RATE)}s`, 15, 135);
      textSize(10 * coef);
      fill(0, 0, 0);
      rect(myWindowWidth - 100 * coef - 10, parseInt(myWindowHeight - 60 * coef), 100 * coef, 50 * coef, 20);
      fill(255);
      text('(S)TOP', myWindowWidth - 80 * coef, parseInt(myWindowHeight - 60 * coef) + 30 * coef);
      fill(255, 0, 0, hide_sensor);
      if (gameTimerNext < Math.ceil(gameTimer / FRAME_RATE)) {
        if (moves.length >= Math.ceil(gameTimer / FRAME_RATE) && moves[Math.ceil(gameTimer / FRAME_RATE)] >= 0) {
          xt = parseInt(moves[Math.ceil(gameTimer / FRAME_RATE)]) % 2 ? left_init_pose_x : right_init_pose_x;
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
      if (Date.now() - hit_success < 1000) {
        textSize(40);
        fill(255, 255, 255, 255);
        text("Good Hit!", myWindowWidth / 2.3, myWindowHeight / 2);
        fill(255, 0, 0, hide_sensor);
        textSize(20);
      }
      if ((Date.now() - left_poses > 2000 || Date.now() - left_poses > 2000)) {
        guard_warning += 100;
        if (guard_warning - Date.now() > 1000) {
          if (guard_warning - Date.now() < 1099) {
            speechSpeak.speak("Your guard!");
          }
          textSize(40);
          fill(255, 255, 255, 255);
          text("Your Guard !!!", myWindowWidth / 2.3, myWindowHeight / 2);
          fill(255, 0, 0, hide_sensor);
          textSize(20);
        }
        if (guard_warning - Date.now() > 10000) guard_warning = Date.now();
      } else guard_warning = Date.now();
      for (c = 0; c < curMoves.length; c++) {
        curMoves[c].y = curMoves[c].y - Math.ceil(240 / FRAME_RATE);
        let alpha = 128;
        if ([1, 3, 5, 7, 10].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
          alpha = 255;
          if (Date.now() - switch_guard > 10000 && curMoves[c].type === 10) {
            switch_guard = Date.now();
            switch_feet();
          }
          if (Date.now() - left_jab < LEVEL * 10 && left_jab - left_poses < LEVEL * 10 && curMoves[c].type === 1) {
            hitSuccess();
          }
          if (Date.now() - left_hook < LEVEL * 10 && left_hook - left_poses < LEVEL * 10 && curMoves[c].type === 3) {
            hitSuccess();
          }
          if (Date.now() - left_uppercut < LEVEL * 10 && left_uppercut - left_poses < LEVEL * 10 && curMoves[c].type === 5) {
            hitSuccess();
          }
          if (Date.now() - left_dodge < LEVEL * 10 && left_dodge - left_poses < LEVEL * 10 && curMoves[c].type === 7) {
            hitSuccess();
          }
        }
        if ([2, 4, 6, 8, 9, 10].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > right_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < right_init_pose_y) {
          alpha = 255;
          if (Date.now() - switch_guard > 10000 && curMoves[c].type === 10) {
            switch_guard = Date.now();
            switch_feet();
          }
          if (Date.now() - right_jab < LEVEL * 10 && right_jab - right_poses < LEVEL * 10 && curMoves[c].type === 2) {
            hitSuccess();
          }
          if (Date.now() - right_hook < LEVEL * 10 && right_hook - right_poses < LEVEL * 10 && curMoves[c].type === 4) {
            hitSuccess();
          }
          if (Date.now() - right_uppercut < LEVEL * 10 && right_uppercut - right_poses < LEVEL * 10 && curMoves[c].type === 6) {
            hitSuccess();
          }
          if (Date.now() - right_dodge < LEVEL * 10 && right_dodge - right_poses < LEVEL * 10 && curMoves[c].type === 8) {
            hitSuccess();
          }
          if (Date.now() - down_dodge < LEVEL * 10 && curMoves[c].type === 9) {
            hitSuccess();
          }
        }
        if (curMoves[c].type === 1 || curMoves[c].type === 2) {
          fill(100, 100, 0, alpha);
          if (feet_position === 1 && curMoves[c].type === 1) curMoves[c].text = "JAB";
          if (feet_position === 1 && curMoves[c].type === 2) curMoves[c].text = "STG";
          if (feet_position === 0 && curMoves[c].type === 1) curMoves[c].text = "JAB";
          if (feet_position === 0 && curMoves[c].type === 2) curMoves[c].text = "STG";
        } else if (curMoves[c].type === 3 || curMoves[c].type === 4) {
          fill(100, 0, 100, alpha);
          curMoves[c].text = "HOOK";
        } else if (curMoves[c].type === 5 || curMoves[c].type === 6) {
          fill(0, 100, 100, alpha);
          curMoves[c].text = "UCUT";
        } else if (curMoves[c].type === 7 || curMoves[c].type === 8) {
          fill(0, 0, 100, alpha);
          curMoves[c].text = "DODGE";
        } else if (curMoves[c].type === 9) {
          fill(0, 0, 200, alpha);
          curMoves[c].text = "DODGE";
        } else if (curMoves[c].type === 10) {
          fill(0, 200, 0, alpha);
          curMoves[c].text = "SWITCH";
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
        textSize(20);
        if (curMoves[c].type > 0) text(curMoves[c].text, curMoves[c].x - curMoves[c].text.length * 7, curMoves[c].y + (16 - curMoves[c].text.length * 2));
        if ([9, 10].includes(curMoves[c].type)) text(curMoves[c].text, right_init_pose_x - curMoves[c].text.length * 7, curMoves[c].y + (16 - curMoves[c].text.length * 2));
      }
      gameTimer++;
    }

    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (leftHand && leftHand.confidence > 0.1) {
        if (leftHand.x * coef < left_init_pose_x + OBJECT_POSE_SIZE && leftHand.x * coef > left_init_pose_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < left_init_pose_y && leftHand.y * coef + OBJECT_POSE_SIZE > left_init_pose_y) {
          left_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted || gameCalibration) {
            if (Date.now() - left_hook < LEVEL * 10) {
              if (gameCalibration) {
                textSize(32);
                fill(255, 255, 255, 127);
                text("LEFT HOOK!", width / 2.5, height / 2);
              }
              punchSound();
            }
            if (Date.now() - left_uppercut < LEVEL * 10) {
              if (gameCalibration) {
                textSize(32);
                fill(255, 255, 255, 127);
                text("LEFT UPPERCUT!", width / 2.5, height / 2);
              }
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
          if (Date.now() - left_poses < LEVEL * 10 && Date.now() - right_poses < LEVEL) {
            left_jab = Date.now();
            if (gameCalibration) {
              textSize(32);
              fill(255, 255, 255, 127);
              text("LEFT JAB!", width / 2.5, height / 2);
            }
            punchSound();
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
              if (gameCalibration) {
                textSize(32);
                fill(255, 255, 255, 127);
                text("RIGHT HOOK!", width / 2.5, height / 2);
              }
              punchSound();
            }
            if (Date.now() - right_uppercut < LEVEL * 10) {
              if (gameCalibration) {
                textSize(32);
                fill(255, 255, 255, 127);
                text("RIGHT UPPERCUT!", width / 2.5, height / 2);
              }
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
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
            if (gameCalibration) {
              textSize(32);
              fill(255, 255, 255, 127);
              text("RIGHT JAB!", width / 2.5, height / 2);
            }
            punchSound();
          }
        }
      }
    }
  }
}

function checkStartCondition() {
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
}

function gotPoses(results) {
  poses = results;
}