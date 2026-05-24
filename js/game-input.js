(function(root) {
  const CALIBRATION_DRAG_FLAGS = {
    init_jab_dragging: false,
    init_uppercut_dragging: false,
    left_init_hook_dragging: false,
    left_init_pose_dragging: false,
    right_init_hook_dragging: false,
    right_init_pose_dragging: false
  };

  function clearCalibrationDragFlags() {
    return { ...CALIBRATION_DRAG_FLAGS };
  }

  function calibrationDragFlagsFromPointer({
    left_init_hook_x,
    left_init_pose_x,
    left_init_pose_y,
    mouseX,
    mouseY,
    objectPoseSize,
    right_init_hook_x,
    right_init_pose_x,
    right_init_pose_y,
    init_jab_y,
    init_uppercut_y
  }) {
    return {
      init_jab_dragging: mouseY < init_jab_y + 8,
      init_uppercut_dragging: mouseY > init_uppercut_y - 8,
      left_init_hook_dragging: mouseX < left_init_hook_x + 8,
      left_init_pose_dragging: mouseX > left_init_pose_x - objectPoseSize / 2 &&
        mouseX < left_init_pose_x + objectPoseSize / 2 &&
        mouseY > left_init_pose_y - 24 &&
        mouseY < left_init_pose_y + 24,
      right_init_hook_dragging: mouseX > right_init_hook_x - 8,
      right_init_pose_dragging: mouseX > right_init_pose_x - objectPoseSize / 2 &&
        mouseX < right_init_pose_x + objectPoseSize / 2 &&
        mouseY > right_init_pose_y - 24 &&
        mouseY < right_init_pose_y + 24
    };
  }

  function isWithin(value, min, max) {
    return value > min && value < max;
  }

  function pointerAction({
    coef,
    gameCalibration,
    gameStarted,
    menu,
    mouseX,
    mouseY,
    myWindowHeight,
    myWindowWidth,
    objectPoseSize,
    left_init_hook_x,
    left_init_pose_x,
    left_init_pose_y,
    right_init_hook_x,
    right_init_pose_x,
    right_init_pose_y,
    init_jab_y,
    init_uppercut_y,
    recentResult
  }) {
    if (recentResult) {
      return { type: "none" };
    }

    const centerXHit = isWithin(mouseX, myWindowWidth / 2 - 40 * coef, myWindowWidth / 2 + 60 * coef);

    if (menu === 0 && isWithin(mouseX, Math.trunc(myWindowWidth / 6), Math.trunc(myWindowWidth / 6) + 100 * coef)) {
      if (isWithin(mouseY, Math.trunc(myWindowHeight / 6 + 300 * coef), Math.trunc(myWindowHeight / 6 + 350 * coef))) {
        return { click: true, type: "open_settings" };
      }
      if (isWithin(mouseY, Math.trunc(myWindowHeight / 6), Math.trunc(myWindowHeight / 6 + 50 * coef))) {
        return { click: true, type: "open_shadow" };
      }
      if (isWithin(mouseY, Math.trunc(myWindowHeight / 6 + 100 * coef), Math.trunc(myWindowHeight / 6 + 150 * coef))) {
        return { click: true, type: "open_pad" };
      }
      if (isWithin(mouseY, Math.trunc(myWindowHeight / 6 + 200 * coef), Math.trunc(myWindowHeight / 6 + 250 * coef))) {
        return { click: true, type: "open_fight" };
      }
    }

    if ([2, 3, 4].includes(menu) && centerXHit && isWithin(mouseY, myWindowHeight - 148 * coef, myWindowHeight - 108 * coef)) {
      return { type: "start_fight" };
    }

    if (menu === 1 && !gameCalibration && centerXHit) {
      if (isWithin(mouseY, myWindowHeight - 148 * coef, myWindowHeight - 108 * coef)) {
        return { click: true, type: "cycle_frame_rate" };
      }
      if (isWithin(mouseY, myWindowHeight - 198 * coef, myWindowHeight - 158 * coef)) {
        return { click: true, type: "cycle_level" };
      }
      if (isWithin(mouseY, myWindowHeight - 248 * coef, myWindowHeight - 208 * coef)) {
        return { click: true, type: "cycle_length" };
      }
      if (isWithin(mouseY, myWindowHeight - 298 * coef, myWindowHeight - 258 * coef)) {
        return { click: true, type: "cycle_series" };
      }
    }

    if (menu === 1 && centerXHit && isWithin(mouseY, myWindowHeight - 98 * coef, myWindowHeight - 58 * coef)) {
      return { click: true, type: gameCalibration ? "reset_calibration" : "start_calibration" };
    }

    if (menu > 0 && isWithin(mouseX, myWindowWidth - 100 * coef, myWindowWidth) && isWithin(mouseY, Math.trunc(myWindowHeight - 60 * coef), Math.trunc(myWindowHeight - 10 * coef))) {
      return { click: true, type: gameStarted || gameCalibration ? "stop_current" : "back_to_menu" };
    }

    if (gameCalibration) {
      return {
        flags: calibrationDragFlagsFromPointer({
          init_jab_y,
          init_uppercut_y,
          left_init_hook_x,
          left_init_pose_x,
          left_init_pose_y,
          mouseX,
          mouseY,
          objectPoseSize,
          right_init_hook_x,
          right_init_pose_x,
          right_init_pose_y
        }),
        type: "calibration_drag"
      };
    }

    return { type: "none" };
  }

  function keyAction({ gameCalibration, gameStarted, key, menu }) {
    if (['b', 'B'].includes(key) && [1, 2, 3, 4].includes(menu) && !gameStarted) {
      return { type: "back_to_menu" };
    }
    if (['s', 'S'].includes(key) && menu === 1) {
      return { type: gameCalibration ? "stop_calibration" : "cycle_series" };
    }
    if (['t', 'T'].includes(key) && menu === 2 && !gameStarted) {
      return { type: "cycle_shadow_focus" };
    }
    if (['l', 'L'].includes(key) && menu === 1) {
      return { type: "cycle_level" };
    }
    if (['d', 'D'].includes(key) && menu === 1) {
      return { type: "cycle_length" };
    }
    if (['c', 'C'].includes(key) && menu === 1) {
      return { type: "start_calibration" };
    }
    if (['c', 'C'].includes(key) && menu === 0) {
      return { type: "open_settings" };
    }
    if (['s', 'S'].includes(key) && menu === 0) {
      return { type: "open_shadow" };
    }
    if (['s', 'S'].includes(key) && menu > 1) {
      return { type: "stop_current" };
    }
    if (['p', 'P'].includes(key) && menu === 0) {
      return { type: "open_pad" };
    }
    if (['i', 'I'].includes(key) && menu === 0) {
      return { type: "open_fight" };
    }
    if (['r', 'R'].includes(key) && menu === 1 && gameCalibration) {
      return { type: "reset_calibration_defaults" };
    }
    if (['f', 'F'].includes(key) && menu === 1) {
      return { type: "cycle_frame_rate" };
    }
    if (['f', 'F'].includes(key) && [2, 3, 4].includes(menu)) {
      return { type: "start_fight" };
    }
    return { type: "none" };
  }

  const api = {
    calibrationDragFlagsFromPointer,
    clearCalibrationDragFlags,
    keyAction,
    pointerAction
  };

  root.TfitInput = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
