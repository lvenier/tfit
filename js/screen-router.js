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
    snapshot: layoutSnapshot
  } = root.TfitLayoutState;

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
    const layout = layoutSnapshot();
    const remainingSeconds = remainingRoundSeconds({
      frameRate: layout.frameRate,
      gameDuration: gameState.gameDuration,
      gameTimer: gameState.gameTimer
    });

    if (shouldShowHitFeedback({ hitSuccessTime: timingState.hitSuccess, now })) {
      image(images.goodHit, layout.width / 2 - 2.5 * layout.objectPoseSize, layout.height / 5, 5 * layout.objectPoseSize);
    }

    const keepTrying = keepTryingFeedback({
      curMoves: gameState.curMoves,
      guardWarningTime: timingState.guardWarning,
      hitSuccessTime: timingState.hitSuccess,
      now,
      remainingSeconds
    });
    if (keepTrying.show) {
      image(images.keepTrying, layout.width / 2 - 2.5 * layout.objectPoseSize, layout.height / 5, 5 * layout.objectPoseSize);
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
      image(images.yourGuard, layout.width / 2 - 2.5 * layout.objectPoseSize, layout.height / 5, 5 * layout.objectPoseSize);
    }
  }

  function renderRoundScreen() {
    const layout = layoutSnapshot();

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
    textSize(7 * layout.coef);
    fill(255, 0, 0, hide_sensor);

    textSize(15 * layout.coef);
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
      image(images.stopButton, layout.width - 100 * layout.coef - 10, Math.trunc(layout.height - 60 * layout.coef), 100 * layout.coef, 50 * layout.coef);
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

    if (error.length > 0) {
      background(0);
      drawMessagePanel("Camera unavailable", error);
      return;
    }
    if (!root.TfitCameraRuntime.checkStartCondition()) {
      background(0);
      renderLoadingScreen();
      return;
    }
    if (typeof root.clear === "function") {
      root.clear();
    } else {
      background(0);
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
