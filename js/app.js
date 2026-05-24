p5.disableFriendlyErrors = true;

const {
  loadAssetsIntoState
} = globalThis.TfitAssets;

const {
  checkStartCondition,
  initCameraRuntime,
  startPoseDetection,
  stopPoseDetection
} = globalThis.TfitCameraRuntime;

const {
  applyCalibrationDragFlags,
  applyKeyInputAction,
  applyPointerInputAction,
  updateCalibrationFromPointer
} = globalThis.TfitAppInputActions;

const {
  renderFightMode
} = globalThis.TfitFightMode;

const {
  clearCalibrationDragFlags
} = globalThis.TfitInput;

const {
  renderPadMode
} = globalThis.TfitPadMode;

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
  fetchSong,
  gameResultBool,
  letsfight
} = globalThis.TfitFlow;

document.addEventListener("contextmenu", event => event.preventDefault());

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .catch(() => {});
}

function positionCanvas() {
  if (!cnv) {return;}
  cnv.position(Math.max((window.innerWidth - myWindowWidth) / 2, 0), 0);
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
  positionCanvas();
  fetchSong(1);

  await initCameraRuntime();
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
    stopPoseDetection();
    timingState.gameResult = Date.now() - 5001;
    renderMainMenu();
  } else {
    if ((gameState.menu === 2 || gameState.menu === 3 || gameState.menu === 4 || gameState.menu === 1) && !gameState.gameStarted && !gameResultBool()) {
      renderBackButton();
    }
  }

  if (gameState.menu === 1) {
    if (gameState.gameOver) {
      stopPoseDetection();
      gameState.gameCalibration = false;
      gameState.gameOver = false;
    }
    if (gameState.gameCalibration) {
      renderGuardTargets();
      fill(255, 0, 0, hide_sensor);
      timingState.gameResult = Date.now() - 5001;
      startPoseDetection();

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
      updateCalibrationFromPointer();
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
      stopPoseDetection();
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
      startPoseDetection();
      gameState.score = scoreTotal(gameState.arrayScore);
    }
    renderRoundHud(gameState.score);

    if (!gameState.gameCalibration && !gameState.gameStarted) {
      stopPoseDetection();
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
