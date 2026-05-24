p5.disableFriendlyErrors = true;

const {
  loadAssetsIntoState
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
  LEVEL = levelDelay(gameState.level);
  if (gameState.song) {
    gameState.gameDuration = gameState.gameLength * FRAME_RATE;
    if (gameState.song.moveLength === 0) {
      if (gameState.menu === 4) {
        gameState.shadow_focus = storageNumber("shadow_focus", gameState.shadow_focus, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 });
      }
      gameState.song.moves = createSongMoves({
        gameLength: gameState.gameLength,
        level: gameState.level,
        menu: gameState.menu,
        randomInteger,
        shadowFocus: gameState.shadow_focus
      });
    }
    gameState.moves = gameState.song.moves;
    gameState.score_max = countScoringMoves(gameState.moves);
  }
}

function fetchSong(_id = 1) {
  gameState.song = createEmptySong();
}

function punchSound() {
  if (timingState.punchSoundTime + 1000 < Date.now()) {
    sounds.punch.play();
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
      sounds.click.play();
    }
  };
  if (action.type === "start_fight") {
    letsfight();
    return;
  }
  if (action.type === "open_settings") {
    playClick();
    gameState.menu = 1;
    return;
  }
  if (action.type === "open_shadow") {
    playClick();
    gameState.menu = 2;
    gameState.curMoves = [];
    loadSongmoves();
    return;
  }
  if (action.type === "open_pad") {
    playClick();
    gameState.menu = 3;
    gameState.curMoves = [];
    loadSongmoves();
    return;
  }
  if (action.type === "open_fight") {
    playClick();
    gameState.menu = 4;
    gameState.curMoves = [];
    loadSongmoves();
    gameState.my_opponent = cloneOpponent(gameState.opponent);
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
    gameState.level = nextZeroBasedIndex(gameState.level, Object.keys(GAME_LEVEL).length);
    localStorage.setItem("level", gameState.level);
    return;
  }
  if (action.type === "cycle_length") {
    playClick();
    gameState.gameLengthIndex = nextOneBasedIndex(gameState.gameLengthIndex, Object.keys(GAME_LENGTH).length);
    localStorage.setItem("length", gameState.gameLengthIndex);
    gameState.gameLength = GAME_LENGTH[gameState.gameLengthIndex.toString()];
    return;
  }
  if (action.type === "cycle_series") {
    playClick();
    gameState.gameSeries = nextOneBasedIndex(gameState.gameSeries, 5);
    localStorage.setItem("series", gameState.gameSeries);
    return;
  }
  if (action.type === "cycle_shadow_focus") {
    gameState.shadow_focus = nextZeroBasedIndex(gameState.shadow_focus, Object.keys(SHADOW_SPECIFIC).length);
    localStorage.setItem("shadow_focus", gameState.shadow_focus);
    loadSongmoves();
    return;
  }
  if (action.type === "start_calibration") {
    playClick();
    gameState.gameCalibration = true;
    gameState.curMoves = [];
    hide_sensor = 64;
    return;
  }
  if (action.type === "stop_calibration") {
    gameState.gameCalibration = false;
    gameState.menu = 1;
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
    gameState.menu = 0;
    return;
  }
  if (action.type === "stop_current") {
    playClick();
    gameState.gameOver = true;
    return;
  }
  if (action.type === "calibration_drag") {
    applyCalibrationDragFlags(action.flags);
  }
}

function letsfight() {
  sounds.click.play();
  if (gameState.gameCalibration) {
    speechString = "Calibrating !";
    return;
  }
  if (gameState.gameStarted) {
    speechString = "Already fighting !";
    return;
  }
  gameState.feet_position = 0;
  calibrationState.left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
  calibrationState.right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  sounds.letsFight.play();
  gameState.gameStarted = true;
  timingState.gameResult = Date.now() - 5001;
  timingState.guardWarning = Date.now();
  gameState.my_opponent = cloneOpponent(gameState.opponent);
  gameState.curMoves = [];
  gameState.gameCalibration = false;
  hide_sensor = 0;
  gameState.gameTimer = 0;
  gameState.score = 0;
  gameState.arrayScore = [];
  loadSongmoves();
  gameState.score_max_prev = gameState.score_max;
}

function handleChange() {
  applyInputAction(pointerAction({
    coef,
    gameCalibration: gameState.gameCalibration,
    gameStarted: gameState.gameStarted,
    init_jab_y: calibrationState.init_jab_y,
    init_uppercut_y: calibrationState.init_uppercut_y,
    left_init_hook_x: calibrationState.left_init_hook_x,
    left_init_pose_x: calibrationState.left_init_pose_x,
    left_init_pose_y: calibrationState.left_init_pose_y,
    menu: gameState.menu,
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
  if (gameResultBool()) {return;}
  applyInputAction(keyAction({
    gameCalibration: gameState.gameCalibration,
    gameStarted: gameState.gameStarted,
    key,
    menu: gameState.menu
  }));
}

function switch_feet() {
  gameState.feet_position = 1;
  calibrationState.left_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  calibrationState.right_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
}

function hitSuccess(c) {
  const result = markHit({
    arrayScore: gameState.arrayScore,
    curMoves: gameState.curMoves,
    index: c,
    playComboFeedback: key => {
      const comboSounds = {
        awesome: sounds.awesome,
        continue: sounds.continue,
        good: sounds.good,
        great: sounds.great,
        perfect: sounds.perfect,
        thats_it: sounds.thatsIt,
        well_done: sounds.wellDone
      };
      comboSounds[key].play();
    }
  });
  if (result.hitSuccess !== null) {
    timingState.hitSuccess = result.hitSuccess;
  }
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
  if (gameState.menu === 0) {
    if (isDetecting === true) {
      bodyPose.detectStop();
      isDetecting = false;
    }
    timingState.gameResult = Date.now() - 5001;
    renderMainMenu();
  } else {
    if ((gameState.menu === 2 || gameState.menu === 3 || gameState.menu === 4 || gameState.menu === 1) && !gameState.gameStarted && !gameResultBool()) {
      renderBackButton();
    }
  }

  if (gameState.menu === 1) {
    if (gameState.gameOver) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
      gameState.gameCalibration = false;
      gameState.gameOver = false;
    }
    if (gameState.gameCalibration) {
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

  if (gameState.menu > 1) {
    renderGuardTargets();
    fill(255, 255, 255, 192);
    if (isRoundExpired({ gameDuration: gameState.gameDuration, gameTimer: gameState.gameTimer })) {
      gameState.gameOver = true;
    }
    if (gameState.gameOver) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
      gameState.gameCalibration = false;
      gameState.my_opponent = cloneOpponent(gameState.opponent);
      gameState.gameStarted = false;
      hide_sensor = 0;
      gameState.gameTimer = -1;
      gameState.gameOver = false;
      const roundEnd = roundEndState({
        currentSeries: gameState.gameCurrentSeries,
        curMoves: gameState.curMoves,
        gameSeries: gameState.gameSeries,
        score: gameState.score
      });
      if (roundEnd.gameResultNow) {timingState.gameResult = Date.now();}
      if (roundEnd.shouldStartNextSeries) {
        setTimeout(() => {
          letsfight();
        }, 5100);
      }
      gameState.gameCurrentSeries = roundEnd.gameSeries;
      gameState.feet_position = 0;
      calibrationState.left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
      calibrationState.right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
    }

    if (speechString) {
      renderSpeech();
      speechString = null;
    }

    if (!gameState.gameStarted && !gameState.gameCalibration && !gameResultBool()) {
      renderFightButton();
    }
    textSize(7 * coef);
    fill(255, 0, 0, hide_sensor);

    textSize(15 * coef);
    fill(255, 255, 255, 255);
    gameState.score = 0;
    if (gameState.gameStarted) {
      if (isDetecting === false) {
        bodyPose.detectStart(video, gotPoses);
        isDetecting = true;
      } 
      gameState.score = scoreTotal(gameState.arrayScore);
    }
    renderRoundHud(gameState.score);

    if (!gameState.gameCalibration && !gameState.gameStarted) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
    }

    if (gameState.gameTimer === 0) {
      ({
        arrayScore: gameState.arrayScore,
        curMoves: gameState.curMoves,
        gameTimerNext: gameState.gameTimerNext
      } = initialRoundMoveState(gameState.moves));
    }

    if (gameState.gameStarted) {
      image(images.stopButton, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      fill(255, 0, 0, hide_sensor);
      const now = Date.now();
      const remainingSeconds = remainingRoundSeconds({
        frameRate: FRAME_RATE,
        gameDuration: gameState.gameDuration,
        gameTimer: gameState.gameTimer
      });

      if (shouldShowHitFeedback({ hitSuccessTime: timingState.hitSuccess, now })) {
        image(images.goodHit, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
      }

      const keepTrying = keepTryingFeedback({
        curMoves: gameState.curMoves,
        guardWarningTime: timingState.guardWarning,
        hitSuccessTime: timingState.hitSuccess,
        now,
        remainingSeconds
      });
      if (keepTrying.show) {
        image(images.keepTrying, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
        if (keepTrying.playSound) {
          sounds.keepTrying.play();
        }
      }

      const guard = guardFeedback({
        gameTimer: gameState.gameTimer,
        guardWarningTime: timingState.guardWarning,
        leftPoseTime: timingState.leftPoses,
        now,
        remainingSeconds,
        rightPoseTime: timingState.rightPoses
      });
      timingState.guardWarning = guard.guardWarningTime;
      if (guard.playSound) {
        sounds.yourGuard.play();
      }
      if (guard.show) {
        image(images.yourGuard, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
      }
    }
  }

  if (gameState.menu === 4) {
    renderFightMode();
  }

  if (gameState.menu === 3) {
    renderPadMode();
  }

  if (gameState.menu === 2) {
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
  const result = detectStartCondition({ errorTimer, gameReady: gameState.gameReady, poses });
  errorTimer = result.errorTimer;
  gameState.gameReady = result.gameReady;
  if (result.error) {error = result.error;}
  if (result.pose) {pose = result.pose;}
  if (result.leftHand) {leftHand = result.leftHand;}
  if (result.rightHand) {rightHand = result.rightHand;}
  if (result.nose) {nose = result.nose;}
  return gameState.gameReady;
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
