import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  calibrationDragFlagsFromPointer,
  clearCalibrationDragFlags
} = require('../../js/game-input');

describe('TfitInput exports', () => {
  it('exposes input helpers for app.js', () => {
    expect(Object.keys(globalThis.TfitInput).sort()).toEqual([
      'calibrationDragFlagsFromPointer',
      'clearCalibrationDragFlags'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-input');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitInput.clearCalibrationDragFlags()).toEqual(clearCalibrationDragFlags());
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
