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

    const mainMenuButtonBounds = index => {
      if (root.TfitRender?.getMainMenuButtonBounds) {
        return root.TfitRender.getMainMenuButtonBounds(index);
      }
      const buttonH = 42 * coef;
      const gap = Math.max(12 * coef, Math.min(24 * coef, (myWindowHeight - buttonH * 5 - 28 * coef) / 4));
      const top = Math.trunc(Math.max(14 * coef, myWindowHeight / 6) + index * (buttonH + gap));
      const left = Math.trunc(myWindowWidth / 6 + 20 * coef);
      return {
        bottom: Math.trunc(top + buttonH),
        left,
        right: Math.trunc(left + 100 * coef),
        top
      };
    };

    if (menu === 0) {
      const isInMainMenuButton = index => {
        const bounds = mainMenuButtonBounds(index);
        return isWithin(mouseX, bounds.left, bounds.right) && isWithin(mouseY, bounds.top, bounds.bottom);
      };
      if (isInMainMenuButton(3)) {
        return { click: true, type: "open_settings" };
      }
      if (isInMainMenuButton(4)) {
        return { click: true, type: "open_profile" };
      }
      if (isInMainMenuButton(0)) {
        return { click: true, type: "open_shadow" };
      }
      if (isInMainMenuButton(1)) {
        return { click: true, type: "open_pad" };
      }
      if (isInMainMenuButton(2)) {
        return { click: true, type: "open_fight" };
      }
    }

    if (menu === 5 && !gameStarted && !root.gameState?.profileStatsVisible) {
      const profileEditButtonBounds = root.TfitRender?.getProfileEditButtonBounds
        ? root.TfitRender.getProfileEditButtonBounds()
        : null;
      if (profileEditButtonBounds && isWithin(mouseX, profileEditButtonBounds.left, profileEditButtonBounds.right) && isWithin(mouseY, profileEditButtonBounds.top, profileEditButtonBounds.bottom)) {
        return { click: true, type: "profile_edit" };
      }

      const profileViewButtonBounds = root.TfitRender?.getProfileViewButtonBounds
        ? root.TfitRender.getProfileViewButtonBounds()
        : null;
      if (profileViewButtonBounds && isWithin(mouseX, profileViewButtonBounds.left, profileViewButtonBounds.right) && isWithin(mouseY, profileViewButtonBounds.top, profileViewButtonBounds.bottom)) {
        return { click: true, type: "profile_view" };
      }
    }

    if ([2, 3, 4].includes(menu) && centerXHit && isWithin(mouseY, myWindowHeight - 148 * coef, myWindowHeight - 108 * coef)) {
      return { type: "start_fight" };
    }

    if (menu === 4 && !gameStarted && !gameCalibration) {
      const panelX = 10 * coef;
      const panelY = 14 * coef;
      const panelWidth = Math.min(188 * coef, Math.max(112 * coef, myWindowWidth * 0.3));
      const opponentRowTop = panelY + 22 * coef;
      const opponentRowBottom = panelY + 44 * coef;
      if (isWithin(mouseX, panelX, panelX + panelWidth) && isWithin(mouseY, opponentRowTop, opponentRowBottom)) {
        return { click: true, type: "cycle_opponent" };
      }
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

    const calibrationActionButtonBounds = root.TfitRender?.getCalibrationResetButtonBounds
      ? root.TfitRender.getCalibrationResetButtonBounds()
      : null;
    if (menu === 1 && calibrationActionButtonBounds && isWithin(mouseX, calibrationActionButtonBounds.left, calibrationActionButtonBounds.right) && isWithin(mouseY, calibrationActionButtonBounds.top, calibrationActionButtonBounds.bottom)) {
      return { click: true, type: gameCalibration ? "reset_calibration" : "start_calibration" };
    }

    const settingsButtonBounds = root.TfitRender?.getSettingsButtonBounds
      ? root.TfitRender.getSettingsButtonBounds()
      : null;
    if (menu !== 0 && settingsButtonBounds && isWithin(mouseX, settingsButtonBounds.left, settingsButtonBounds.right) && isWithin(mouseY, settingsButtonBounds.top, settingsButtonBounds.bottom)) {
      if (gameStarted) {
        return { click: true, type: "stop_current" };
      }
      if (gameCalibration) {
        return { click: true, type: "leave_calibration" };
      }
      return { click: true, type: "back_to_menu" };
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
    if (gameCalibration && ['s', 'S'].includes(key) && menu !== 1) {
      return { type: "stop_calibration" };
    }
    if (['b', 'B'].includes(key) && [1, 2, 3, 4, 5].includes(menu) && !gameStarted) {
      return { type: "back_to_menu" };
    }
    if (['s', 'S'].includes(key) && menu === 1) {
      return { type: gameCalibration ? "leave_calibration" : "cycle_series" };
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
    if (['o', 'O'].includes(key) && menu === 4 && !gameStarted) {
      return { type: "cycle_opponent" };
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
    /* v8 ignore next */
    if (['s', 'S'].includes(key) && menu > 1) {
      return { type: "stop_current" };
    }
    if (['t', 'T'].includes(key) && menu === 0) {
      return { type: "open_pad" };
    }
    if (['p', 'P'].includes(key) && menu === 0) {
      return { type: "open_profile" };
    }
    if (['e', 'E'].includes(key) && menu === 5 && !root.gameState?.profileStatsVisible) {
      return { type: "profile_edit" };
    }
    if (['v', 'V'].includes(key) && menu === 5 && !root.gameState?.profileStatsVisible) {
      return { type: "profile_view" };
    }
    if (['f', 'F', 'i', 'I'].includes(key) && menu === 0) {
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

  /* c8 ignore next 3 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
