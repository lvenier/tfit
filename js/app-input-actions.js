(function(root) {
  const {
    calibrationDragUpdates,
    persistCalibrationUpdates
  } = root.TfitCalibration;

  const {
    keyAction,
    pointerAction
  } = root.TfitInput;

  const {
    calibrationDefaults,
    nextFrameRate,
    nextOneBasedIndex,
    nextZeroBasedIndex
  } = root.TfitGameLogic;

  const {
    gameResultBool,
    letsfight,
    loadSongmoves
  } = root.TfitFlow;

  const {
    setFrameRate,
    snapshot: layoutSnapshot
  } = root.TfitLayoutState;

  const DOOR_ANIMATION_DURATION_FRAMES = 60;
  const DOOR_ANIMATION_HOLD_FRAMES = 20;
  const MENU_BUTTON_TRANSITIONS = {
    back_to_menu: {
      menu: 0
    },
    open_settings: {
      menu: 1
    },
    open_shadow: {
      menu: 2,
      clearCurMoves: true,
      loadSongmoves: true
    },
    open_pad: {
      menu: 3,
      clearCurMoves: true,
      loadSongmoves: true
    },
    open_fight: {
      menu: 4,
      clearCurMoves: true,
      loadSongmoves: true,
      resetOpponent: true
    },
    start_calibration: {
      menu: 1,
      onApply: () => {
        gameState.gameCalibration = true;
        gameState.curMoves = [];
        hide_sensor = 64;
      }
    },
    leave_calibration: {
      menu: 1,
      onApply: () => {
        gameState.gameOver = true;
      }
    }
  };

  function menuButtonTransition(button) {
    return MENU_BUTTON_TRANSITIONS[button] ? { ...MENU_BUTTON_TRANSITIONS[button], button } : null;
  }

  function applyMenuButtonTransition(transition) {
    if (!transition) {
      return;
    }

    if (Number.isInteger(transition.menu)) {
      gameState.menu = transition.menu;
    }
    if (transition.clearCurMoves) {
      gameState.curMoves = [];
    }
    if (transition.loadSongmoves) {
      loadSongmoves();
    }
    if (transition.resetOpponent) {
      gameState.my_opponent = cloneOpponent(gameState.opponent);
    }
    if (typeof transition.onApply === "function") {
      transition.onApply();
    }
  }

  function applyPendingMenuButtonTransition() {
    const transition = gameState.menuButtonAnimation?.pendingTransition;
    if (!transition) {
      return false;
    }

    applyMenuButtonTransition(transition);
    gameState.menuButtonAnimation.pendingTransition = null;
    return true;
  }

  function queueMenuDoorAnimation(button) {
    const transition = menuButtonTransition(button);
    const layout = layoutSnapshot();
    if (!transition) {
      return;
    }

    const closeFrames = Math.max(1, Math.floor(DOOR_ANIMATION_DURATION_FRAMES / 2));
    const transitionDelayMs = Math.max(1, Math.round(closeFrames * (1000 / 60)));

    if (gameState.menuButtonAnimation?.transitionTimeout) {
      clearTimeout(gameState.menuButtonAnimation.transitionTimeout);
    }

    gameState.menuButtonAnimation = {
      active: true,
      button,
      duration: DOOR_ANIMATION_DURATION_FRAMES,
      holdFrames: DOOR_ANIMATION_HOLD_FRAMES,
      frame: 0,
      x: 0,
      y: 0,
      width: layout.width,
      height: layout.height,
      progress: 0,
      transitionTimeout: setTimeout(() => {
        if (gameState.menuButtonAnimation?.pendingTransition) {
          applyPendingMenuButtonTransition();
        }
      }, transitionDelayMs),
      pendingTransition: transition
    };
  }

  function clearMenuDoorTransition() {
    if (gameState.menuButtonAnimation?.transitionTimeout) {
      clearTimeout(gameState.menuButtonAnimation.transitionTimeout);
    }
    if (gameState.menuButtonAnimation) {
      gameState.menuButtonAnimation.transitionTimeout = null;
      gameState.menuButtonAnimation.pendingTransition = null;
    }
  }

  function queueMenuRestore() {
    const appState = root.TfitState?.gameState || root.gameState;

    if (!appState) {
      return;
    }

    if (appState.menuButtonAnimation?.restoreTimeout) {
      clearTimeout(appState.menuButtonAnimation.restoreTimeout);
    }

    if (!appState.menuButtonAnimation) {
      appState.menuButtonAnimation = {
        active: false,
        button: null,
        duration: DOOR_ANIMATION_DURATION_FRAMES,
        holdFrames: DOOR_ANIMATION_HOLD_FRAMES,
        frame: 0,
        x: 0,
        y: 0,
        width: layoutSnapshot().width,
        height: layoutSnapshot().height,
        progress: 0
      };
    }

    appState.menuButtonAnimation.restoreTimeout = setTimeout(() => {
      if (!appState.gameCalibration && !appState.gameStarted) {
        appState.menu = 1;
      }
      if (appState.menuButtonAnimation) {
        appState.menuButtonAnimation.restoreTimeout = null;
      }
    }, 16);
  }

  function handleMenuOpenAction(button, useDoorAnimation) {
    if (useDoorAnimation) {
      queueMenuDoorAnimation(button);
      return;
    }
    applyMenuButtonTransition(menuButtonTransition(button));
  }

  function resetCalibrationDefaults() {
    const layout = layoutSnapshot();
    const defaults = calibrationDefaults(layout.width, layout.height, layout.objectPoseSize, layout.coef);

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
      handleMenuOpenAction("open_settings", true);
      playClick();
      return;
    }
    if (action.type === "open_shadow") {
      handleMenuOpenAction("open_shadow", true);
      playClick();
      return;
    }
    if (action.type === "open_pad") {
      handleMenuOpenAction("open_pad", true);
      playClick();
      return;
    }
    if (action.type === "open_fight") {
      handleMenuOpenAction("open_fight", true);
      playClick();
      return;
    }
    if (action.type === "cycle_frame_rate") {
      playClick();
      const frameRate = setFrameRate(nextFrameRate(layoutSnapshot().frameRate));
      localStorage.setItem("frame_rate", frameRate);
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
    if (action.type === "cycle_opponent") {
      playClick();
      gameState.opponent = nextZeroBasedIndex(gameState.opponent, Object.keys(root.OPPONENTS).length);
      localStorage.setItem("opponent", gameState.opponent);
      gameState.my_opponent = cloneOpponent(gameState.opponent);
      gameState.my_stamina = gameState.my_opponent.stamina;
      return;
    }
    if (action.type === "cycle_shadow_focus") {
      gameState.shadow_focus = nextZeroBasedIndex(gameState.shadow_focus, Object.keys(SHADOW_SPECIFIC).length);
      localStorage.setItem("shadow_focus", gameState.shadow_focus);
      loadSongmoves();
      return;
    }
    if (action.type === "start_calibration") {
      handleMenuOpenAction("start_calibration", true);
      playClick();
      return;
    }
    if (action.type === "leave_calibration") {
      playClick();
      handleMenuOpenAction("leave_calibration", true);
      return;
    }
    if (action.type === "stop_calibration") {
      clearMenuDoorTransition();
      queueMenuRestore();
      gameState.gameCalibration = false;
      gameState.menu = 1;
      return;
    }
    if (action.type === "reset_calibration") {
      playClick();
      root.dispatchEvent(new KeyboardEvent('keydown', {
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
      handleMenuOpenAction("back_to_menu", true);
      return;
    }
    if (action.type === "stop_current") {
      playClick();
      gameState.manualStop = true;
      gameState.gameOver = true;
      return;
    }
    if (action.type === "calibration_drag") {
      applyCalibrationDragFlags(action.flags);
    }
  }

  function applyPointerInputAction() {
    const layout = layoutSnapshot();

    applyInputAction(pointerAction({
      coef: layout.coef,
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
      myWindowHeight: layout.height,
      myWindowWidth: layout.width,
      objectPoseSize: layout.objectPoseSize,
      recentResult: gameResultBool(),
      right_init_hook_x: calibrationState.right_init_hook_x,
      right_init_pose_x: calibrationState.right_init_pose_x,
      right_init_pose_y: calibrationState.right_init_pose_y
    }));
  }

  function canApplyDuringRecentResult(action) {
    return [
      "reset_calibration",
      "reset_calibration_defaults",
      "start_calibration",
      "stop_calibration",
      "leave_calibration"
    ].includes(action.type);
  }

  function applyKeyInputAction(keyOverride = key) {
    const isRecentResultVisible = gameResultBool();
    const activeAnimation = gameState.menuButtonAnimation;
    const menu = activeAnimation?.pendingTransition?.menu === 1 && activeAnimation?.active
      ? 1
      : gameState.menu;
    const action = keyAction({
      gameCalibration: gameState.gameCalibration,
      gameStarted: gameState.gameStarted,
      key: keyOverride,
      menu
    });

    /* c8 ignore next 5 -- Behavior is covered; V8 reports this nested guard inconsistently. */
    if (isRecentResultVisible) {
      if (!canApplyDuringRecentResult(action)) {
        return;
      }
    }

    applyInputAction(action);
  }

  function updateCalibrationFromPointer() {
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
  }

  const api = {
    clearMenuDoorTransition,
    applyMenuButtonTransition,
    applyCalibrationDragFlags,
    applyCalibrationUpdates,
    applyInputAction,
    applyPendingMenuButtonTransition,
    canApplyDuringRecentResult,
    applyKeyInputAction,
    applyPointerInputAction,
    handleMenuOpenAction,
    queueMenuDoorAnimation,
    queueMenuRestore,
    resetCalibrationDefaults,
    updateCalibrationFromPointer
  };

  root.TfitAppInputActions = api;

  /* c8 ignore next */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
