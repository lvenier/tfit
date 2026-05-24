import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  calibrationDragUpdates,
  persistCalibrationUpdates
} = require('../../js/game-calibration');

describe('TfitCalibration exports', () => {
  it('exposes calibration helpers for app.js', () => {
    expect(Object.keys(globalThis.TfitCalibration).sort()).toEqual([
      'calibrationDragUpdates',
      'persistCalibrationUpdates'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-calibration');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitCalibration.calibrationDragUpdates({
      flags: { left_init_pose_dragging: true },
      mouseX: 120,
      mouseY: 140
    })).toEqual({
      left_init_pose_x: 120,
      left_init_pose_y: 140
    });
  });
});

describe('calibrationDragUpdates', () => {
  const clearFlags = {
    init_jab_dragging: false,
    init_uppercut_dragging: false,
    left_init_hook_dragging: false,
    left_init_pose_dragging: false,
    right_init_hook_dragging: false,
    right_init_pose_dragging: false
  };

  it('returns no updates when nothing is being dragged', () => {
    expect(calibrationDragUpdates({
      flags: clearFlags,
      mouseX: 100,
      mouseY: 200
    })).toEqual({});
  });

  it('maps pose target drags to x and y updates', () => {
    expect(calibrationDragUpdates({
      flags: {
        ...clearFlags,
        left_init_pose_dragging: true,
        right_init_pose_dragging: true
      },
      mouseX: 180,
      mouseY: 220
    })).toEqual({
      left_init_pose_x: 180,
      left_init_pose_y: 220,
      right_init_pose_x: 180,
      right_init_pose_y: 220
    });
  });

  it('maps threshold drags to one-axis updates', () => {
    expect(calibrationDragUpdates({
      flags: {
        ...clearFlags,
        init_jab_dragging: true,
        init_uppercut_dragging: true,
        left_init_hook_dragging: true,
        right_init_hook_dragging: true
      },
      mouseX: 260,
      mouseY: 310
    })).toEqual({
      init_jab_y: 310,
      init_uppercut_y: 310,
      left_init_hook_x: 260,
      right_init_hook_x: 260
    });
  });
});

describe('persistCalibrationUpdates', () => {
  it('stores every calibration update by key', () => {
    const stored = [];
    const storage = {
      setItem: (key, value) => stored.push([key, value])
    };

    persistCalibrationUpdates({
      init_jab_y: 90,
      left_init_pose_x: 150
    }, storage);

    expect(stored).toEqual([
      ['init_jab_y', 90],
      ['left_init_pose_x', 150]
    ]);
  });
});
