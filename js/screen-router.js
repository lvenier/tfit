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
    renderStopButton,
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

  const getApplyPendingMenuButtonTransition = () => root.TfitAppInputActions?.applyPendingMenuButtonTransition;

  const {
    finishRound,
    gameResultBool
  } = root.TfitFlow;

  const DOOR_SOUND_RATE = 0.8;
  const DOOR_FILL_COLOR = [10, 11, 18, 255];
  const DOOR_LOGO_SCALE = 0.3;

  function renderBackNavigation() {
    if ((gameState.menu === 2 || gameState.menu === 3 || gameState.menu === 4 || gameState.menu === 1) && !gameState.gameStarted && !gameResultBool()) {
      renderBackButton();
    }
  }

  function drawRoundFeedbackText(message, layout, pulse = 1) {
    const x = layout.width / 2;
    const y = layout.height * 0.2;
    const baseSize = layout.objectPoseSize * 0.9;
    const alpha = Math.round(150 + 45 * pulse);
    const pulseScale = 0.94 + 0.06 * Math.sin(Date.now() * 0.004);
    const textAlignX = root.CENTER;
    const textAlignY = root.CENTER;
    const bold = root.BOLD;
    const isSuccess = message === "GOOD HIT" || message === "NICE DODGE";
    const glowColor = isSuccess
      ? [90, 255, 120]
      : [255, 186, 60];
    const textColor = isSuccess
      ? [220, 255, 220]
      : [255, 245, 210];

    noStroke();
    fill(isSuccess ? 20 : 24, isSuccess ? 40 : 22, isSuccess ? 20 : 10, 172);
    rect(x - 162, y - baseSize * 0.7, 324, baseSize * 1.45, 10);

    textAlign(textAlignX, textAlignY);
    textStyle(bold);
    textSize(baseSize * 1.15 * pulseScale);
    fill(0, 0, 0, Math.max(90, alpha));
    text(message, x + 1, y + 1);

    fill(glowColor[0], glowColor[1], glowColor[2], Math.max(80, alpha * 0.56));
    text(message, x - 1, y);

    fill(textColor[0], textColor[1], textColor[2], Math.max(190, alpha * 0.88));
    text(message, x - 0.4, y - 0.4);
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
    const feedbackPulse = 1 + Math.sin(now * 0.008) * 0.06;

    if (timingState.fightResultText) {
      drawRoundFeedbackText(timingState.fightResultText, layout, feedbackPulse);
      return;
    }

    if (shouldShowHitFeedback({ hitSuccessTime: timingState.hitSuccess, now })) {
      drawRoundFeedbackText(timingState.hitSuccessText || "GOOD HIT", layout, feedbackPulse);
    }

    const keepTrying = keepTryingFeedback({
      curMoves: gameState.curMoves,
      guardWarningTime: timingState.guardWarning,
      hitSuccessTime: timingState.hitSuccess,
      now,
      remainingSeconds
    });
    if (keepTrying.show) {
      drawRoundFeedbackText("KEEP TRYING", layout, feedbackPulse);
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
      drawRoundFeedbackText("YOUR GUARD", layout, feedbackPulse);
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
      renderStopButton();
      fill(255, 0, 0, hide_sensor);
      renderRoundFeedback();
    }
  }

  function renderMenuButtonDoorAnimation() {
    const animation = gameState.menuButtonAnimation;

    if (!animation || !animation.active) {
      return;
    }

    const duration = animation.duration || 18;
    const holdFrames = Math.max(0, Math.floor(animation.holdFrames || 0));
    const closeDuration = Math.max(1, Math.floor(duration / 2));
    const openDuration = Math.max(1, duration - closeDuration);
    const totalDuration = closeDuration + holdFrames + openDuration;
    const currentFrame = Math.min(animation.frame || 0, totalDuration);
    const phase = currentFrame < closeDuration
      ? (currentFrame + 1) / closeDuration
      : currentFrame < closeDuration + holdFrames
        ? 1
        : 1 - Math.min(currentFrame - closeDuration - holdFrames + 1, openDuration) / openDuration;
    const progress = Math.max(0, Math.min(phase, 1));
    const wallWidth = (animation.width / 2) * progress;
    const closedFrame = currentFrame >= closeDuration - 1 && currentFrame < closeDuration;
    const closingStarted = currentFrame === 0 && animation?.pendingTransition;
    const openingStarted = currentFrame === closeDuration + holdFrames && animation?.pendingTransition;
    const canTransition = typeof getApplyPendingMenuButtonTransition() === "function" &&
      animation.pendingTransition &&
      closedFrame;

    const hasSound = typeof sounds !== "undefined" && sounds !== null;

    if (closingStarted && hasSound && typeof sounds?.doorClose?.play === "function") {
      if (typeof sounds.doorClose.rate === "function") {
        sounds.doorClose.rate(DOOR_SOUND_RATE);
      }
      sounds.doorClose.play();
    }

    if (openingStarted && hasSound && typeof sounds?.doorOpen?.play === "function") {
      if (typeof sounds.doorOpen.rate === "function") {
        sounds.doorOpen.rate(DOOR_SOUND_RATE);
      }
      sounds.doorOpen.play();
    }

    if (canTransition) {
      getApplyPendingMenuButtonTransition()();
    }

    animation.frame = currentFrame + 1;
    animation.progress = progress;

    if (currentFrame >= totalDuration) {
      animation.active = false;
      animation.progress = 0;
      return;
    }

    push();
    noStroke();
    fill(...DOOR_FILL_COLOR);
    rect(animation.x, animation.y, wallWidth, animation.height);
    rect(animation.x + animation.width - wallWidth, animation.y, wallWidth, animation.height);
    pop();

    if (wallWidth <= 0) {
      return;
    }

    const logo = images?.logo;
    if (!logo || !logo.width || !logo.height) {
      return;
    } else {
      void logo;
    }

    renderMenuDoorLogoHalves(animation, wallWidth, layoutSnapshot());
  }

  function renderMenuDoorLogoHalves(animation, wallWidth, layout) {
    const logo = images.logo;

    const halfWidth = Math.max(1, logo.width / 2);
    const aspect = halfWidth / logo.height;
    const logoWidth = (animation.width / 2) * DOOR_LOGO_SCALE;
    const logoHeight = logoWidth / aspect;

    if (logoWidth <= 0 || logoHeight <= 0) {
      return;
    }

    const leftPanelX = animation.x + wallWidth - logoWidth;
    const rightPanelX = animation.x + animation.width - wallWidth;
    const logoY = (layout.height - logoHeight) / 2;

    image(
      images.logo,
      leftPanelX,
      logoY,
      logoWidth,
      logoHeight,
      0,
      0,
      halfWidth,
      logo.height
    );
    image(
      images.logo,
      rightPanelX,
      logoY,
      logoWidth,
      logoHeight,
      halfWidth,
      0,
      halfWidth,
      logo.height
    );
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

  function renderForegroundControls() {
    if (gameState.menu === 4 && !gameState.gameStarted && !gameState.gameCalibration && !gameResultBool()) {
      renderFightButton();
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
    } else {
      void gameState.menu;
    }

    renderActiveMode();
    renderForegroundControls();
    renderMenuButtonDoorAnimation();
  }

  function renderAppFrame() {
    if (innerWidth < innerHeight) {
      return;
    }

    /* istanbul ignore if */
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
    renderForegroundControls,
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
