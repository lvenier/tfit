(function(root) {
  const {
    startPoseDetection,
    stopPoseDetection
  } = root.TfitCameraRuntime;

  const {
    renderFightMode
  } = root.TfitFightMode;

  const {
    renderPadMode
  } = root.TfitPadMode;

  const {
    drawMessagePanel,
    renderBackButton,
    renderFightButton,
    renderGuardTargets,
    renderLoadingScreen,
    renderMainMenu,
    renderRoundHud,
    renderSceneBackground,
    renderSpeech
  } = root.TfitRender;

  const {
    guardFeedback,
    initialRoundMoveState,
    isRoundExpired,
    keepTryingFeedback,
    remainingRoundSeconds,
    scoreTotal,
    shouldShowHitFeedback
  } = root.TfitRound;

  const {
    renderShadowMode
  } = root.TfitShadowMode;

  const {
    renderSettingsScreen
  } = root.TfitSettingsScreen;

  const {
    finishRound,
    gameResultBool
  } = root.TfitFlow;

  function renderBackNavigation() {
    if ((gameState.menu === 2 || gameState.menu === 3 || gameState.menu === 4 || gameState.menu === 1) && !gameState.gameStarted && !gameResultBool()) {
      renderBackButton();
    }
  }

  function renderMenuScreen() {
    stopPoseDetection();
    timingState.gameResult = Date.now() - 5001;
    renderMainMenu();
  }

  function renderRoundFeedback() {
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

  function renderRoundScreen() {
    renderGuardTargets();
    fill(255, 255, 255, 192);
    if (isRoundExpired({ gameDuration: gameState.gameDuration, gameTimer: gameState.gameTimer })) {
      gameState.gameOver = true;
    }
    if (gameState.gameOver) {
      stopPoseDetection();
      finishRound();
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
      renderRoundFeedback();
    }
  }

  function renderActiveMode() {
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

  function renderGameScreen() {
    renderSceneBackground();
    if (gameState.menu === 0) {
      renderMenuScreen();
    } else {
      renderBackNavigation();
    }

    if (gameState.menu === 1) {
      renderSettingsScreen();
    }

    if (gameState.menu > 1) {
      renderRoundScreen();
    }

    renderActiveMode();
  }

  function renderAppFrame() {
    if (innerWidth < innerHeight) {
      return;
    }

    background(0);
    if (error.length > 0) {
      drawMessagePanel("Camera unavailable", error);
      return;
    }
    if (!root.TfitCameraRuntime.checkStartCondition()) {
      renderLoadingScreen();
      return;
    }
    renderGameScreen();
  }

  const api = {
    renderActiveMode,
    renderAppFrame,
    renderBackNavigation,
    renderGameScreen,
    renderMenuScreen,
    renderRoundFeedback,
    renderRoundScreen
  };

  root.TfitScreenRouter = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
