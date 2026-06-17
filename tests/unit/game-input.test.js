import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  calibrationDragFlagsFromPointer,
  clearCalibrationDragFlags,
  keyAction,
  pointerAction
} = require('../../js/game-input');

describe('TfitInput exports', () => {
  it('exposes input helpers for app.js', () => {
    expect(Object.keys(globalThis.TfitInput).sort()).toEqual([
      'calibrationDragFlagsFromPointer',
      'clearCalibrationDragFlags',
      'keyAction',
      'pointerAction'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-input');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitInput.clearCalibrationDragFlags()).toEqual(clearCalibrationDragFlags());
    expect(sandbox.TfitInput.keyAction({ gameCalibration: false, gameStarted: false, key: 's', menu: 0 })).toEqual({
      type: 'open_shadow'
    });
  });

  it('handles calibration and menu fallback key routes', () => {
    expect(keyAction({
      gameCalibration: true,
      gameStarted: false,
      key: 's',
      menu: 1
    })).toEqual({
      type: 'leave_calibration'
    });

    expect(keyAction({
      gameCalibration: false,
      gameStarted: false,
      key: 's',
      menu: 1
    })).toEqual({
      type: 'cycle_series'
    });

    expect(keyAction({
      gameCalibration: false,
      gameStarted: true,
      key: 's',
      menu: 2
    })).toEqual({
      type: 'stop_current'
    });
  });
});

describe('clearCalibrationDragFlags', () => {
  it('returns every calibration drag flag reset', () => {
    expect(clearCalibrationDragFlags()).toEqual({
      init_jab_dragging: false,
      init_uppercut_dragging: false,
      left_init_hook_dragging: false,
      left_init_pose_dragging: false,
      right_init_hook_dragging: false,
      right_init_pose_dragging: false
    });
  });
});

describe('calibrationDragFlagsFromPointer', () => {
  const baseGeometry = {
    init_jab_y: 100,
    init_uppercut_y: 260,
    left_init_hook_x: 120,
    left_init_pose_x: 200,
    left_init_pose_y: 160,
    objectPoseSize: 48,
    right_init_hook_x: 420,
    right_init_pose_x: 360,
    right_init_pose_y: 160
  };

  it('detects jab, uppercut, and hook threshold drags', () => {
    expect(calibrationDragFlagsFromPointer({
      ...baseGeometry,
      mouseX: 100,
      mouseY: 90
    })).toMatchObject({
      init_jab_dragging: true,
      init_uppercut_dragging: false,
      left_init_hook_dragging: true,
      right_init_hook_dragging: false
    });

    expect(calibrationDragFlagsFromPointer({
      ...baseGeometry,
      mouseX: 430,
      mouseY: 270
    })).toMatchObject({
      init_jab_dragging: false,
      init_uppercut_dragging: true,
      left_init_hook_dragging: false,
      right_init_hook_dragging: true
    });
  });

  it('detects left and right pose target drags', () => {
    expect(calibrationDragFlagsFromPointer({
      ...baseGeometry,
      mouseX: 200,
      mouseY: 160
    })).toMatchObject({
      left_init_pose_dragging: true,
      right_init_pose_dragging: false
    });

    expect(calibrationDragFlagsFromPointer({
      ...baseGeometry,
      mouseX: 360,
      mouseY: 160
    })).toMatchObject({
      left_init_pose_dragging: false,
      right_init_pose_dragging: true
    });
  });

  it('keeps pose drag bounds exclusive like app.js did', () => {
    expect(calibrationDragFlagsFromPointer({
      ...baseGeometry,
      mouseX: 176,
      mouseY: 160
    }).left_init_pose_dragging).toBe(false);

    expect(calibrationDragFlagsFromPointer({
      ...baseGeometry,
      mouseX: 177,
      mouseY: 160
    }).left_init_pose_dragging).toBe(true);
  });
});

describe('pointerAction', () => {
  const originalTfitRender = {
    ...(globalThis.TfitRender || {})
  };

  const calibrationResetButtonBounds = () => ({
    left: 240,
    right: 360,
    top: 500,
    bottom: 542
  });
  const settingsButtonBounds = () => ({
    left: 490,
    right: 590,
    top: 540,
    bottom: 582
  });

  beforeEach(() => {
    globalThis.TfitRender = {
      ...originalTfitRender,
      getCalibrationResetButtonBounds: calibrationResetButtonBounds,
      getSettingsButtonBounds: settingsButtonBounds
    };
  });

  afterEach(() => {
    globalThis.TfitRender = originalTfitRender;
  });

  const basePointer = {
    coef: 1,
    gameCalibration: false,
    gameStarted: false,
    init_jab_y: 100,
    init_uppercut_y: 260,
    left_init_hook_x: 120,
    left_init_pose_x: 200,
    left_init_pose_y: 160,
    menu: 0,
    mouseX: 130,
    mouseY: 110,
    myWindowHeight: 600,
    myWindowWidth: 600,
    objectPoseSize: 48,
    recentResult: false,
    right_init_hook_x: 420,
    right_init_pose_x: 360,
    right_init_pose_y: 160
  };

  it('maps settings and game control actions from shared style buttons', () => {
    expect(pointerAction({
      ...basePointer,
      menu: 1,
      mouseX: 300,
      mouseY: 520
    })).toEqual({ click: true, type: 'start_calibration' });

    expect(pointerAction({
      ...basePointer,
      menu: 3,
      mouseX: 550,
      mouseY: 560
    })).toEqual({ click: true, type: 'back_to_menu' });
  });

  it('maps main menu pointer regions to menu actions with click feedback', () => {
    expect(pointerAction({
      ...basePointer,
      mouseY: 110
    })).toEqual({ click: true, type: 'open_shadow' });

    expect(pointerAction({
      ...basePointer,
      mouseY: 210
    })).toEqual({ click: true, type: 'open_pad' });

    expect(pointerAction({
      ...basePointer,
      mouseY: 310
    })).toEqual({ click: true, type: 'open_fight' });

    expect(pointerAction({
      ...basePointer,
      mouseY: 410
    })).toEqual({ click: true, type: 'open_settings' });

    expect(pointerAction({
      ...basePointer,
      mouseY: 360
    })).toEqual({ type: 'none' });
  });

  it('maps settings controls to cycle actions with click feedback', () => {
    const settingsPointer = {
      ...basePointer,
      menu: 1,
      mouseX: 300
    };

    expect(pointerAction({
      ...settingsPointer,
      mouseY: 470
    })).toEqual({ click: true, type: 'cycle_frame_rate' });

    expect(pointerAction({
      ...settingsPointer,
      mouseY: 420
    })).toEqual({ click: true, type: 'cycle_level' });

    expect(pointerAction({
      ...settingsPointer,
      mouseY: 370
    })).toEqual({ click: true, type: 'cycle_length' });

    expect(pointerAction({
      ...settingsPointer,
      mouseY: 320
    })).toEqual({ click: true, type: 'cycle_series' });
  });

  it('maps fight and calibration buttons', () => {
    expect(pointerAction({
      ...basePointer,
      menu: 2,
      mouseX: 300,
      mouseY: 470
    })).toEqual({ type: 'start_fight' });

    expect(pointerAction({
      ...basePointer,
      menu: 1,
      mouseX: 300,
      mouseY: 520
    })).toEqual({ click: true, type: 'start_calibration' });

    expect(pointerAction({
      ...basePointer,
      gameCalibration: true,
      menu: 1,
      mouseX: 300,
      mouseY: 520
    })).toEqual({ click: true, type: 'reset_calibration' });
  });

  it('maps the lower-right button to back or stop based on active state', () => {
    expect(pointerAction({
      ...basePointer,
      gameStarted: false,
      menu: 3,
      mouseX: 550,
      mouseY: 560
    })).toEqual({ click: true, type: 'back_to_menu' });

    expect(pointerAction({
      ...basePointer,
      gameStarted: true,
      menu: 3,
      mouseX: 550,
      mouseY: 560
    })).toEqual({ click: true, type: 'stop_current' });

    expect(pointerAction({
      ...basePointer,
      gameCalibration: true,
      menu: 1,
      mouseX: 550,
      mouseY: 560
    })).toEqual({ click: true, type: 'leave_calibration' });
  });

  it('ignores pointer input while a recent result is visible', () => {
    expect(pointerAction({
      ...basePointer,
      recentResult: true
    })).toEqual({ type: 'none' });
  });

  it('returns no action for pointer input outside interactive regions', () => {
    expect(pointerAction({
      ...basePointer,
      mouseX: 5,
      mouseY: 5
    })).toEqual({ type: 'none' });
  });

  it('returns calibration drag flags while calibrating outside button regions', () => {
    expect(pointerAction({
      ...basePointer,
      gameCalibration: true,
      menu: 1,
      mouseX: 200,
      mouseY: 160
    })).toEqual({
      flags: {
        init_jab_dragging: false,
        init_uppercut_dragging: false,
        left_init_hook_dragging: false,
        left_init_pose_dragging: true,
        right_init_hook_dragging: false,
        right_init_pose_dragging: false
      },
      type: 'calibration_drag'
    });
  });
});

describe('keyAction', () => {
  it('maps menu shortcuts without click feedback', () => {
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'c', menu: 0 })).toEqual({
      type: 'open_settings'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 's', menu: 0 })).toEqual({
      type: 'open_shadow'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'p', menu: 0 })).toEqual({
      type: 'open_pad'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'i', menu: 0 })).toEqual({
      type: 'open_fight'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'f', menu: 0 })).toEqual({
      type: 'open_fight'
    });
  });

  it('maps settings shortcuts', () => {
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'f', menu: 1 })).toEqual({
      type: 'cycle_frame_rate'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'l', menu: 1 })).toEqual({
      type: 'cycle_level'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'd', menu: 1 })).toEqual({
      type: 'cycle_length'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 's', menu: 1 })).toEqual({
      type: 'cycle_series'
    });
  });

  it('maps calibration shortcuts', () => {
    expect(keyAction({ gameCalibration: true, gameStarted: false, key: 's', menu: 0 })).toEqual({
      type: 'stop_calibration'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'c', menu: 1 })).toEqual({
      type: 'start_calibration'
    });
    expect(keyAction({ gameCalibration: true, gameStarted: false, key: 's', menu: 1 })).toEqual({
      type: 'leave_calibration'
    });
    expect(keyAction({ gameCalibration: true, gameStarted: false, key: 'r', menu: 1 })).toEqual({
      type: 'reset_calibration_defaults'
    });
  });

  it('maps mode shortcuts based on menu and game state', () => {
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'b', menu: 2 })).toEqual({
      type: 'back_to_menu'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: true, key: 'b', menu: 2 })).toEqual({
      type: 'none'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 't', menu: 2 })).toEqual({
      type: 'cycle_shadow_focus'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: true, key: 't', menu: 2 })).toEqual({
      type: 'none'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 's', menu: 3 })).toEqual({
      type: 'stop_current'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'f', menu: 4 })).toEqual({
      type: 'start_fight'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'F', menu: 3 })).toEqual({
      type: 'start_fight'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'f', menu: 2 })).toEqual({
      type: 'start_fight'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'F', menu: 0 })).toEqual({
      type: 'open_fight'
    });
    expect(keyAction({ gameCalibration: false, gameStarted: false, key: 'f', menu: 5 })).toEqual({
      type: 'none'
    });
  });
});
