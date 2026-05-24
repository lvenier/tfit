p5.disableFriendlyErrors = true;

const {
  loadGameAssets
} = globalThis.TfitAssets;

const {
  renderFightMode
} = globalThis.TfitFightMode;

const {
  calibrationDragUpdates,
  persistCalibrationUpdates
} = globalThis.TfitCalibration;

const {
  clearCalibrationDragFlags,
  keyAction,
  pointerAction
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
  guardFeedback,
  initialRoundMoveState,
  isRoundExpired,
  keepTryingFeedback,
  remainingRoundSeconds,
  roundEndState,
  scoreTotal,
  shouldShowHitFeedback
} = globalThis.TfitRound;

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

  calibrationState.left_init_pose_x = defaults.left_init_pose_x;
  calibrationState.left_init_pose_y = defaults.left_init_pose_y;
  calibrationState.right_init_pose_x = defaults.right_init_pose_x;
  calibrationState.right_init_pose_y = defaults.right_init_pose_y;
  calibrationState.init_jab_y = defaults.init_jab_y;
  calibrationState.init_uppercut_y = defaults.init_uppercut_y;
  calibrationState.left_init_hook_x = defaults.left_init_hook_x;
  calibrationState.right_init_hook_x = defaults.right_init_hook_x;

  for (const [key, value] of Object.entries(defaults)) {
    localStorage.setItem(key, value);
  }
}

function gameResultBool() { 
  return isRecent(timingState.gameResult);
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
  if (timingState.punchSoundTime + 1000 < Date.now()) {
    punch_sound.play();
    timingState.punchSoundTime = Date.now();
  }
}

function applyCalibrationDragFlags(flags) {
  calibrationState.init_uppercut_dragging = flags.init_uppercut_dragging;
  calibrationState.init_jab_dragging = flags.init_jab_dragging;
  calibrationState.left_init_hook_dragging = flags.left_init_hook_dragging;
  calibrationState.right_init_hook_dragging = flags.right_init_hook_dragging;
  calibrationState.right_init_pose_dragging = flags.right_init_pose_dragging;
  calibrationState.left_init_pose_dragging = flags.left_init_pose_dragging;
}

const calibrationSetters = {
  init_jab_y: value => { calibrationState.init_jab_y = value; },
  init_uppercut_y: value => { calibrationState.init_uppercut_y = value; },
  left_init_hook_x: value => { calibrationState.left_init_hook_x = value; },
  left_init_pose_x: value => { calibrationState.left_init_pose_x = value; },
  left_init_pose_y: value => { calibrationState.left_init_pose_y = value; },
  right_init_hook_x: value => { calibrationState.right_init_hook_x = value; },
  right_init_pose_x: value => { calibrationState.right_init_pose_x = value; },
  right_init_pose_y: value => { calibrationState.right_init_pose_y = value; }
};

function applyCalibrationUpdates(updates) {
  for (const [key, value] of Object.entries(updates)) {
    calibrationSetters[key](value);
  }
  persistCalibrationUpdates(updates, localStorage);
}

function applyInputAction(action) {
  if (action.type === "none") {return;}
  const playClick = () => {
    if (action.click) {
      click_sound.play();
    }
  };
  if (action.type === "start_fight") {
    letsfight();
    return;
  }
  if (action.type === "open_settings") {
    playClick();
    menu = 1;
    return;
  }
  if (action.type === "open_shadow") {
    playClick();
    menu = 2;
    curMoves = [];
    loadSongmoves();
    return;
  }
  if (action.type === "open_pad") {
    playClick();
    menu = 3;
    curMoves = [];
    loadSongmoves();
    return;
  }
  if (action.type === "open_fight") {
    playClick();
    menu = 4;
    curMoves = [];
    loadSongmoves();
    my_opponent = cloneOpponent(opponent);
    return;
  }
  if (action.type === "cycle_frame_rate") {
    playClick();
    FRAME_RATE = nextFrameRate(FRAME_RATE);
    localStorage.setItem("frame_rate", FRAME_RATE);
    return;
  }
  if (action.type === "cycle_level") {
    playClick();
    level = nextZeroBasedIndex(level, Object.keys(GAME_LEVEL).length);
    localStorage.setItem("level", level);
    return;
  }
  if (action.type === "cycle_length") {
    playClick();
    gameLengthIndex = nextOneBasedIndex(gameLengthIndex, Object.keys(GAME_LENGTH).length);
    localStorage.setItem("length", gameLengthIndex);
    gameLength = GAME_LENGTH[gameLengthIndex.toString()];
    return;
  }
  if (action.type === "cycle_series") {
    playClick();
    gameSeries = nextOneBasedIndex(gameSeries, 5);
    localStorage.setItem("series", gameSeries);
    return;
  }
  if (action.type === "cycle_shadow_focus") {
    shadow_focus = nextZeroBasedIndex(shadow_focus, Object.keys(SHADOW_SPECIFIC).length);
    localStorage.setItem("shadow_focus", shadow_focus);
    loadSongmoves();
    return;
  }
  if (action.type === "start_calibration") {
    playClick();
    gameCalibration = true;
    curMoves = [];
    hide_sensor = 64;
    return;
  }
  if (action.type === "stop_calibration") {
    gameCalibration = false;
    menu = 1;
    return;
  }
  if (action.type === "reset_calibration") {
    playClick();
    globalThis.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'r',
      code: 'KeyR',
      bubbles: true
    }));
    return;
  }
  if (action.type === "reset_calibration_defaults") {
    resetCalibrationDefaults();
    return;
  }
  if (action.type === "back_to_menu") {
    playClick();
    menu = 0;
    return;
  }
  if (action.type === "stop_current") {
    playClick();
    gameOver = true;
    return;
  }
  if (action.type === "calibration_drag") {
    applyCalibrationDragFlags(action.flags);
  }
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
  calibrationState.left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
  calibrationState.right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  song_letsfight.play();
  gameStarted = true;
  timingState.gameResult = Date.now() - 5001;
  timingState.guardWarning = Date.now();
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
  applyInputAction(pointerAction({
    coef,
    gameCalibration,
    gameStarted,
    init_jab_y: calibrationState.init_jab_y,
    init_uppercut_y: calibrationState.init_uppercut_y,
    left_init_hook_x: calibrationState.left_init_hook_x,
    left_init_pose_x: calibrationState.left_init_pose_x,
    left_init_pose_y: calibrationState.left_init_pose_y,
    menu,
    mouseX,
    mouseY,
    myWindowHeight,
    myWindowWidth,
    objectPoseSize: OBJECT_POSE_SIZE,
    recentResult: gameResultBool(),
    right_init_hook_x: calibrationState.right_init_hook_x,
    right_init_pose_x: calibrationState.right_init_pose_x,
    right_init_pose_y: calibrationState.right_init_pose_y
  }));
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
  const assets = await loadGameAssets({
    gameLength: GAME_LENGTH,
    gameLevel: GAME_LEVEL,
    loadImage,
    loadSound,
    menuTypes: MENUTYPE
  });

  Object.assign(images, {
    backButton: assets.back_button_image,
    backgrounds: assets.background_images,
    calibrateButton: assets.calibrate_button_image,
    configMenuButton: assets.config_menu_button_image,
    durationButtons: assets.duration_button_image,
    fightButton: assets.fight_button_image,
    fightMenuButton: assets.fight_menu_button_image,
    framerateButtons: assets.framerate_button_image,
    goodHit: assets.good_hit_image,
    keepTrying: assets.keep_trying_image,
    leftFoot: assets.lfeet_image,
    levelButtons: assets.level_button_image,
    logo: assets.logo_image,
    me: assets.me_image,
    meAnimations: assets.me_images,
    menu: assets.menu_image,
    opponentAnimations: assets.opponents_images,
    opponents: assets.opponent_image,
    padButton: assets.pad_button_image,
    resetButton: assets.reset_button_image,
    rightFoot: assets.rfeet_image,
    seriesButtons: assets.series_button_image,
    shadowButton: assets.shadow_button_image,
    stopButton: assets.stop_button_image,
    yourGuard: assets.your_guard_image
  });

  ({
    click_sound,
    punch_sound,
    song_awesome,
    song_continue,
    song_good,
    song_great,
    song_keep_trying,
    song_letsfight,
    song_perfect,
    song_thats_it,
    song_well_done,
    song_your_guard
  } = assets);
}

function keyPressed() {
  if (gameResultBool()) {return;}
  applyInputAction(keyAction({
    gameCalibration,
    gameStarted,
    key,
    menu
  }));
}

function switch_feet() {
  feet_position = 1;
  calibrationState.left_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  calibrationState.right_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
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
    timingState.hitSuccess = result.hitSuccess;
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
    timingState.gameResult = Date.now() - 5001;
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
      timingState.gameResult = Date.now() - 5001;
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

      image(images.stopButton, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      image(images.resetButton, myWindowWidth / 2 - 50 * coef, myWindowHeight - 100 * coef, 120 * coef, 60 * coef);
      applyCalibrationUpdates(calibrationDragUpdates({
        flags: {
          init_jab_dragging: calibrationState.init_jab_dragging,
          init_uppercut_dragging: calibrationState.init_uppercut_dragging,
          left_init_hook_dragging: calibrationState.left_init_hook_dragging,
          left_init_pose_dragging: calibrationState.left_init_pose_dragging,
          right_init_hook_dragging: calibrationState.right_init_hook_dragging,
          right_init_pose_dragging: calibrationState.right_init_pose_dragging
        },
        mouseX,
        mouseY
      }));
      renderCalibrationOverlay();
    } else {
      renderSettingsControls();
    }
  }

  if (menu > 1) {
    renderGuardTargets();
    fill(255, 255, 255, 192);
    if (isRoundExpired({ gameDuration, gameTimer })) {
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
      const roundEnd = roundEndState({
        currentSeries: gameCurrentSeries,
        curMoves,
        gameSeries,
        score
      });
      if (roundEnd.gameResultNow) {timingState.gameResult = Date.now();}
      if (roundEnd.shouldStartNextSeries) {
        setTimeout(() => {
          letsfight();
        }, 5100);
      }
      gameCurrentSeries = roundEnd.gameSeries;
      feet_position = 0;
      calibrationState.left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
      calibrationState.right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
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
      score = scoreTotal(arrayScore);
    }
    renderRoundHud(score);

    if (!gameCalibration && !gameStarted) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
    }

    if (gameTimer === 0) {
      ({
        arrayScore,
        curMoves,
        gameTimerNext
      } = initialRoundMoveState(moves));
    }

    if (gameStarted) {
      image(images.stopButton, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      fill(255, 0, 0, hide_sensor);
      const now = Date.now();
      const remainingSeconds = remainingRoundSeconds({
        frameRate: FRAME_RATE,
        gameDuration,
        gameTimer
      });

      if (shouldShowHitFeedback({ hitSuccessTime: timingState.hitSuccess, now })) {
        image(images.goodHit, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
      }

      const keepTrying = keepTryingFeedback({
        curMoves,
        guardWarningTime: timingState.guardWarning,
        hitSuccessTime: timingState.hitSuccess,
        now,
        remainingSeconds
      });
      if (keepTrying.show) {
        image(images.keepTrying, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
        if (keepTrying.playSound) {
          song_keep_trying.play();
        }
      }

      const guard = guardFeedback({
        gameTimer,
        guardWarningTime: timingState.guardWarning,
        leftPoseTime: timingState.leftPoses,
        now,
        remainingSeconds,
        rightPoseTime: timingState.rightPoses
      });
      timingState.guardWarning = guard.guardWarningTime;
      if (guard.playSound) {
        song_your_guard.play();
      }
      if (guard.show) {
        image(images.yourGuard, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
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
