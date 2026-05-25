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

  function applyKeyInputAction() {
    if (gameResultBool()) {return;}
    applyInputAction(keyAction({
      gameCalibration: gameState.gameCalibration,
      gameStarted: gameState.gameStarted,
      key,
      menu: gameState.menu
    }));
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
    applyCalibrationDragFlags,
    applyCalibrationUpdates,
    applyInputAction,
    applyKeyInputAction,
    applyPointerInputAction,
    resetCalibrationDefaults,
    updateCalibrationFromPointer
  };

  root.TfitAppInputActions = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
