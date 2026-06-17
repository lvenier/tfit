import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/calibration-state');

const STUBBED_GLOBALS = [
  'calibrationState',
  'storageNumber',
  'TfitCalibrationState',
  'TfitLayoutState'
];

const originalGlobals = new Map();

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  Object.assign(globalThis, {
    storageNumber: vi.fn((_key, fallback) => fallback),
    TfitLayoutState: {
      snapshot: vi.fn(() => ({ height: 480, width: 640 }))
    }
  }, overrides);

  delete require.cache[modulePath];
  return require('../../js/calibration-state');
}

afterEach(() => {
  vi.restoreAllMocks();
  delete require.cache[modulePath];
  for (const name of STUBBED_GLOBALS) {
    const original = originalGlobals.get(name);
    if (original === undefined) {
      delete globalThis[name];
    } else {
      globalThis[name] = original;
    }
  }
  originalGlobals.clear();
});

describe('TfitCalibrationState exports', () => {
  it('builds calibration defaults from layout state', () => {
    const state = installGlobals({
      TfitLayoutState: {
        snapshot: vi.fn(() => ({ height: 600, width: 900 }))
      }
    });

    expect(state).toBe(globalThis.calibrationState);
    expect(globalThis.TfitCalibrationState).toBe(state);
    expect(state).toMatchObject({
      init_jab_y: 150,
      init_uppercut_y: 450,
      left_init_pose_x: 300,
      left_init_pose_y: 200,
      right_init_hook_x: 780,
      right_init_pose_x: 600,
      right_init_pose_y: 200
    });
  });

  it('supports storage-backed calibration values', () => {
    const storageNumber = vi.fn((key, fallback) => ({
      init_jab_y: 111,
      right_init_pose_x: 555
    })[key] ?? fallback);

    const state = installGlobals({ storageNumber });

    expect(state.init_jab_y).toBe(111);
    expect(state.right_init_pose_x).toBe(555);
    expect(storageNumber).toHaveBeenCalledWith('right_init_hook_x', 520);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      storageNumber: (_key, fallback) => fallback,
      TfitLayoutState: {
        snapshot: () => ({ height: 480, width: 640 })
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitCalibrationState).toBe(sandbox.calibrationState);
    expect(sandbox.calibrationState.left_init_pose_x).toBeCloseTo(640 / 3, 12);
  });

  it('normalizes values, including zero and ratio inputs, then rescales on set/get', () => {
    const storageNumber = vi.fn((key, fallback) => {
      const values = {
        left_init_hook_x: 0,
        left_init_pose_x: 0.5,
        left_init_pose_y: NaN,
        right_init_hook_x: Infinity,
        right_init_pose_x: 0.25,
        right_init_pose_y: 40
      };
      return key in values ? values[key] : fallback;
    });

    const layout = { height: 400, width: 800 };
    const state = installGlobals({
      storageNumber,
      TfitLayoutState: {
        snapshot: vi.fn(() => ({ ...layout }))
      }
    });

    // Initialization normalizes various legacy and ratio-style values
    expect(state.left_init_hook_x).toBe(0);
    expect(state.left_init_pose_x).toBe(400);
    expect(state.left_init_pose_y).toBe(0);
    expect(state.right_init_hook_x).toBe(0);
    expect(state.right_init_pose_x).toBe(200);
    expect(state.right_init_pose_y).toBe(40);

    // Set all responsive coordinates through ratio and pixel paths.
    state.left_init_hook_x = 0;
    state.left_init_pose_x = 200;
    state.left_init_pose_y = 0.5;
    state.right_init_hook_x = 200;
    state.right_init_pose_x = 0.25;
    state.right_init_pose_y = 1;

    // Confirm all getters work (this also covers all responsive property access paths).
    expect(state.left_init_hook_x).toBe(0);
    expect(state.left_init_pose_x).toBe(200);
    expect(state.left_init_pose_y).toBe(200);
    expect(state.right_init_hook_x).toBe(200);
    expect(state.right_init_pose_x).toBe(200);
    expect(state.right_init_pose_y).toBe(400);

    // Resize and confirm ratio-based positions are rescaled.
    layout.width = 1600;
    layout.height = 600;
    expect(state.left_init_hook_x).toBeCloseTo(0, 12);
    expect(state.left_init_pose_x).toBeCloseTo(400, 12);
    expect(state.left_init_pose_y).toBeCloseTo(300, 12);
    expect(state.right_init_hook_x).toBeCloseTo(400, 12);
    expect(state.right_init_pose_x).toBeCloseTo(400, 12);
    expect(state.right_init_pose_y).toBeCloseTo(600, 12);
  });
});
