p5.disableFriendlyErrors = true;

const {
  loadGameAssets
} = globalThis.TfitAssets;

const {
  renderFightMode
} = globalThis.TfitFightMode;

const {
  calibrationDragFlagsFromPointer,
  clearCalibrationDragFlags
} = globalThis.TfitInput;

const {
  renderPadMode
} = globalThis.TfitPadMode;

const {
  calibrationDefaults,
  countScoringMoves,
  createEmptySong,
  createSongMoves,
  detectStartCondition,
  isRecent,
  levelDelay,
  nextFrameRate,
  nextOneBasedIndex,
  nextZeroBasedIndex
} = globalThis.TfitGameLogic;

const {
  drawMessagePanel,
  renderBackButton,
  renderCalibrationOverlay,
  renderFeetIndicator,
  renderFightButton,
  renderFightMeters,
  renderGuardTargets,
  renderLoadingScreen,
  renderMainMenu,
  renderRoundHud,
  renderSceneBackground,
  renderSettingsControls,
  renderSpeech
} = globalThis.TfitRender;

const {
  renderShadowMode
} = globalThis.TfitShadowMode;

const {
  markHit
} = globalThis.TfitScore;

document.addEventListener("contextmenu", event => event.preventDefault());

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .catch(() => {});
}

function positionCanvas() {
  if (!cnv) {return;}
  cnv.position(Math.max((window.innerWidth - myWindowWidth) / 2, 0), 0);
}

function resetCalibrationDefaults() {
  const defaults = calibrationDefaults(myWindowWidth, myWindowHeight, OBJECT_POSE_SIZE, coef);

  left_init_pose_x = defaults.left_init_pose_x;
  left_init_pose_y = defaults.left_init_pose_y;
  right_init_pose_x = defaults.right_init_pose_x;
  right_init_pose_y = defaults.right_init_pose_y;
  init_jab_y = defaults.init_jab_y;
  init_uppercut_y = defaults.init_uppercut_y;
  left_init_hook_x = defaults.left_init_hook_x;
  right_init_hook_x = defaults.right_init_hook_x;

  for (const [key, value] of Object.entries(defaults)) {
    localStorage.setItem(key, value);
  }
}

function gameResultBool() { 
  return isRecent(gameResult);
}

function loadSongmoves() {
  LEVEL = levelDelay(level);
  if (song) {
    gameDuration = gameLength * FRAME_RATE;
    if (song.moveLength === 0) {
      if (menu === 4) {shadow_focus = storageNumber("shadow_focus", shadow_focus, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 });}
      song.moves = createSongMoves({ gameLength, level, menu, randomInteger, shadowFocus: shadow_focus });
    }
    moves = song.moves;
    score_max = countScoringMoves(moves);
  }
}

function fetchSong(_id = 1) {
  song = createEmptySong();
}

function punchSound() {
  if (punch_sound_time + 1000 < Date.now()) {
    punch_sound.play();
    punch_sound_time = Date.now();
  }
}

function applyCalibrationDragFlags(flags) {
  init_uppercut_dragging = flags.init_uppercut_dragging;
  init_jab_dragging = flags.init_jab_dragging;
  left_init_hook_dragging = flags.left_init_hook_dragging;
  right_init_hook_dragging = flags.right_init_hook_dragging;
  right_init_pose_dragging = flags.right_init_pose_dragging;
  left_init_pose_dragging = flags.left_init_pose_dragging;
}

function letsfight() {
  click_sound.play();
  if (gameCalibration) {
    speechString = "Calibrating !";
    return;
  }
  if (gameStarted) {
    speechString = "Already fighting !";
    return;
  }
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
  if (gameResultBool()) {return;}
  if (menu === 0) {
    if (mouseX < Math.trunc(myWindowWidth / 6) + 100 * coef && mouseX > Math.trunc(myWindowWidth / 6)) {
      if (mouseY < Math.trunc(myWindowHeight / 6 + 350 * coef) && mouseY > Math.trunc(myWindowHeight / 6 + 300 * coef)) {
          click_sound.play();
          menu = 1;
          return;
      }
      if (mouseY < Math.trunc(myWindowHeight / 6 + 50 * coef) && mouseY > Math.trunc(myWindowHeight / 6)) {
        click_sound.play();
        menu = 2;
        curMoves = [];
        loadSongmoves();
        return;
      }
      if (mouseY < Math.trunc(myWindowHeight / 6 + 150 * coef) && mouseY > Math.trunc(myWindowHeight / 6 + 100 * coef)) {
        click_sound.play();
        menu = 3;
        curMoves = [];
        loadSongmoves();
        return;
      }
      if (mouseY < Math.trunc(myWindowHeight / 6 + 250 * coef) && mouseY > Math.trunc(myWindowHeight / 6 + 200 * coef)) {
        click_sound.play();
        menu = 4;
        curMoves = [];
        loadSongmoves();
        my_opponent = cloneOpponent(opponent);
        return;
      }
    }
  }
  if ([2, 3, 4].includes(menu)) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (mouseY > myWindowHeight - 148 * coef && mouseY < myWindowHeight - 108 * coef) {
        letsfight();
        return;
      }
    }
  }
  if ([1].includes(menu) && !gameCalibration) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (mouseY > myWindowHeight - 148 * coef && mouseY < myWindowHeight - 108 * coef) {
        click_sound.play();
        FRAME_RATE = nextFrameRate(FRAME_RATE);
        localStorage.setItem("frame_rate", FRAME_RATE);
      }
      if (mouseY > myWindowHeight - 198 * coef && mouseY < myWindowHeight - 158 * coef) {
        click_sound.play();
        level = nextZeroBasedIndex(level, Object.keys(GAME_LEVEL).length);
        localStorage.setItem("level", level);
      }
      if (mouseY > myWindowHeight - 248 * coef && mouseY < myWindowHeight - 208 * coef) {
        click_sound.play();
        gameLengthIndex = nextOneBasedIndex(gameLengthIndex, Object.keys(GAME_LENGTH).length);
        localStorage.setItem("length", gameLengthIndex);
        gameLength = GAME_LENGTH[gameLengthIndex.toString()];
      }
      if (mouseY > myWindowHeight - 298 * coef && mouseY < myWindowHeight - 258 * coef) {
        click_sound.play();
        gameSeries = nextOneBasedIndex(gameSeries, 5);
        localStorage.setItem("series", gameSeries);
      }
    }
  }
  if ([1].includes(menu) && mouseY > myWindowHeight - 98 * coef && mouseY < myWindowHeight - 58 * coef) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (gameCalibration) {
        click_sound.play();
        globalThis.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'r',
            code: 'KeyR',
            bubbles: true
          }));
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
    if (mouseX > myWindowWidth - 100 * coef && mouseX < myWindowWidth && mouseY < Math.trunc(myWindowHeight - 10 * coef) && mouseY > Math.trunc(myWindowHeight - 60 * coef)) {
      click_sound.play();
      if (menu > 0 && !gameStarted && !gameCalibration) {
        menu = 0;
      } else if (menu > 0 && (gameStarted || gameCalibration)) {
        gameOver = true;
      } else {
        menu = 0;
      }
      return;
    }
  }
  if (gameCalibration) {
    applyCalibrationDragFlags(calibrationDragFlagsFromPointer({
      init_jab_y,
      init_uppercut_y,
      left_init_hook_x,
      left_init_pose_x,
      left_init_pose_y,
      mouseX,
      mouseY,
      objectPoseSize: OBJECT_POSE_SIZE,
      right_init_hook_x,
      right_init_pose_x,
      right_init_pose_y
    }));
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
    applyCalibrationDragFlags(clearCalibrationDragFlags());
  }
}

function mouseReleased() {
  if (gameCalibration) {
    applyCalibrationDragFlags(clearCalibrationDragFlags());
  }
}

async function loadAssets() {
  ({
    background_images,
    back_button_image,
    calibrate_button_image,
    click_sound,
    config_menu_button_image,
    duration_button_image,
    fight_button_image,
    fight_menu_button_image,
    framerate_button_image,
    good_hit_image,
    keep_trying_image,
    level_button_image,
    lfeet_image,
    logo_image,
    me_image,
    me_images,
    menu_image,
    opponent_image,
    opponents_images,
    pad_button_image,
    punch_sound,
    reset_button_image,
    rfeet_image,
    series_button_image,
    shadow_button_image,
    song_awesome,
    song_continue,
    song_good,
    song_great,
    song_keep_trying,
    song_letsfight,
    song_perfect,
    song_thats_it,
    song_well_done,
    song_your_guard,
    stop_button_image,
    your_guard_image
  } = await loadGameAssets({
    gameLength: GAME_LENGTH,
    gameLevel: GAME_LEVEL,
    loadImage,
    loadSound,
    menuTypes: MENUTYPE
  }));
}

function keyPressed() {
  if (gameResultBool()) {return;}
  if (['b', 'B'].includes(key) && [1, 2, 3, 4].includes(menu)) {
    if (!gameStarted) {
      menu = 0;
    }
  }
  if (['s', 'S'].includes(key) && [1].includes(menu)) {
    if (gameCalibration) {
      gameCalibration = false;
      menu = 1;
    } else {
      gameSeries = nextOneBasedIndex(gameSeries, 5);
      localStorage.setItem("series", gameSeries);
    }
  }
  if (['t', 'T'].includes(key) && [2].includes(menu)) {
    if (!gameStarted) {
      shadow_focus = nextZeroBasedIndex(shadow_focus, Object.keys(SHADOW_SPECIFIC).length);
      localStorage.setItem("shadow_focus", shadow_focus);
      loadSongmoves();
    }
  }
  if (['l', 'L'].includes(key) && [1].includes(menu)) {
    level = nextZeroBasedIndex(level, Object.keys(GAME_LEVEL).length);
    localStorage.setItem("level", level);
  }
  if (['d', 'D'].includes(key) && [1].includes(menu)) {
    gameLengthIndex = nextOneBasedIndex(gameLengthIndex, Object.keys(GAME_LENGTH).length);
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
    FRAME_RATE = nextFrameRate(FRAME_RATE);
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
  const result = markHit({
    arrayScore,
    curMoves,
    index: c,
    playComboFeedback: key => {
      const sounds = {
        awesome: song_awesome,
        continue: song_continue,
        good: song_good,
        great: song_great,
        perfect: song_perfect,
        thats_it: song_thats_it,
        well_done: song_well_done
      };
      sounds[key].play();
    }
  });
  if (result.hitSuccess !== null) {
    hit_success = result.hitSuccess;
  }
}

function handleRightClick(e) {
  e.preventDefault();
  if (gameStarted) {
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
  positionCanvas();
  fetchSong(1);

  try {
    video = createCapture(VIDEO, { flipped: true });
  } catch {
    error = "Camera access is not available in this browser.";
    return;
  }

  video.hide();

  bodyPose = await ml5.bodyPose(MODELS[poseModelIndex], {
    modelUrl: "js/ml5js/model.json",
    flipped: true
  });

  bodyPose.detectStart(video, gotPoses);
  isDetecting = true;
}

function draw() {
  if (innerWidth < innerHeight) {return;}
  background(0);
  if (error.length > 0) {
    drawMessagePanel("Camera unavailable", error);
    return;
  }
  if (!checkStartCondition()) {
    renderLoadingScreen();
    return;
  }
  renderSceneBackground();
  if (menu === 0) {
    if (isDetecting === true) {
      bodyPose.detectStop();
      isDetecting = false;
    }
    gameResult = Date.now() - 5001;
    renderMainMenu();
  } else {
    if ((menu === 2 || menu === 3 || menu === 4 || menu === 1) && !gameStarted && !gameResultBool()) {
      renderBackButton();
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
      renderGuardTargets();
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

      image(stop_button_image, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
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
      renderCalibrationOverlay();
    } else {
      renderSettingsControls();
    }
  }

  if (menu > 1) {
    renderGuardTargets();
    fill(255, 255, 255, 192);
    if (gameDuration - gameTimer <= 0) {
      gameOver = true;
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
      if (curMoves.length > 0 && score > 0) {gameResult = Date.now();}
      if (gameCurrentSeries < gameSeries) {
        setTimeout(() => {
          letsfight();
        }, 5100);
        gameCurrentSeries++;
      } else {gameCurrentSeries = 1;}
      feet_position = 0;
      left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
      right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
    }

    if (speechString) {
      renderSpeech();
      speechString = null;
    }

    if (!gameStarted && !gameCalibration && !gameResultBool()) {
      renderFightButton();
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
      for (const element of arrayScore) {
        score += element;
      }
    }
    renderRoundHud(score);

    if (!gameCalibration && !gameStarted) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
    }

    if (gameTimer === 0) {
      curMoves = [];
      gameTimerNext = 0;
      arrayScore = Array(moves.length).fill(0);
    }

    if (gameStarted) {
      image(stop_button_image, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      fill(255, 0, 0, hide_sensor);
      if (Date.now() - hit_success < 1000) {
        image(good_hit_image, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
      }
      if (Date.now() - hit_success > 3000 && Date.now() - hit_success < 4000 && guard_warning - Date.now() < 2000 && Math.ceil((gameDuration - gameTimer) / FRAME_RATE) > 5) {
        if (curMoves.length > 3 && curMoves.at(-1).hit === false && curMoves.at(-2).hit === false && curMoves.at(-3).hit === false) {
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
    renderFightMode();
  }

  if (menu === 3) {
    renderPadMode();
  }

  if (menu === 2) {
    renderShadowMode();
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
  const result = detectStartCondition({ errorTimer, gameReady, poses });
  errorTimer = result.errorTimer;
  gameReady = result.gameReady;
  if (result.error) {error = result.error;}
  if (result.pose) {pose = result.pose;}
  if (result.leftHand) {leftHand = result.leftHand;}
  if (result.rightHand) {rightHand = result.rightHand;}
  if (result.nose) {nose = result.nose;}
  return gameReady;
}

function gotPoses(results) {
  poses = results;
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
