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
    expect(sandbox.calibrationState.left_init_pose_x).toBe(640 / 3);
  });
});
