import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/settings-screen');

const STUBBED_GLOBALS = [
  'circle',
  'coef',
  'fill',
  'gameState',
  'hide_sensor',
  'image',
  'images',
  'isDetecting',
  'leftHand',
  'myWindowHeight',
  'myWindowWidth',
  'nose',
  'OBJECT_POSE_SIZE',
  'pose',
  'poses',
  'rightHand',
  'timingState',
  'TfitAppInputActions',
  'TfitCameraRuntime',
  'TfitRender',
  'TfitSettingsScreen'
];

const originalGlobals = new Map();
const calls = {};

function record(name) {
  return (...args) => {
    calls[name].push(args);
  };
}

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  calls.circle = [];
  calls.fill = [];
  calls.image = [];

  Object.assign(globalThis, {
    circle: record('circle'),
    coef: 1,
    fill: record('fill'),
    gameState: {
      gameCalibration: false,
      gameOver: false
    },
    hide_sensor: 64,
    image: record('image'),
    images: {
      resetButton: { name: 'reset' },
      stopButton: { name: 'stop' }
    },
    isDetecting: true,
    leftHand: undefined,
    myWindowHeight: 480,
    myWindowWidth: 640,
    nose: undefined,
    OBJECT_POSE_SIZE: 48,
    pose: {},
    poses: [],
    rightHand: undefined,
    timingState: {
      gameResult: 0
    },
    TfitAppInputActions: {
      updateCalibrationFromPointer: vi.fn()
    },
    TfitCameraRuntime: {
      startPoseDetection: vi.fn(),
      stopPoseDetection: vi.fn()
    },
    TfitRender: {
      renderCalibrationOverlay: vi.fn(),
      renderGuardTargets: vi.fn(),
      renderSettingsControls: vi.fn()
    }
  }, overrides);

  vi.useFakeTimers();
  vi.setSystemTime(10_000);

  delete require.cache[modulePath];
  return require('../../js/settings-screen');
}

afterEach(() => {
  vi.useRealTimers();
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

describe('TfitSettingsScreen exports', () => {
  it('exposes settings screen helpers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'renderCalibrationPoseMarker',
      'renderCalibrationScreen',
      'renderSettingsScreen'
    ]);
    expect(globalThis.TfitSettingsScreen).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      TfitAppInputActions: {
        updateCalibrationFromPointer: () => {}
      },
      TfitCameraRuntime: {
        startPoseDetection: () => {},
        stopPoseDetection: () => {}
      },
      TfitRender: {
        renderCalibrationOverlay: () => {},
        renderGuardTargets: () => {},
        renderSettingsControls: () => {}
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitSettingsScreen.renderSettingsScreen).toBe('function');
  });
});

describe('settings screen rendering', () => {
  it('renders settings controls when calibration is inactive', () => {
    const api = installGlobals();

    api.renderSettingsScreen();

    expect(globalThis.TfitRender.renderSettingsControls).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitCameraRuntime.startPoseDetection).not.toHaveBeenCalled();
  });

  it('stops detection and resets flags when game over reaches settings', () => {
    const api = installGlobals({
      gameState: {
        gameCalibration: true,
        gameOver: true
      }
    });

    api.renderSettingsScreen();

    expect(globalThis.TfitCameraRuntime.stopPoseDetection).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState.gameCalibration).toBe(false);
    expect(globalThis.gameState.gameOver).toBe(false);
    expect(globalThis.TfitRender.renderSettingsControls).toHaveBeenCalledTimes(1);
  });

  it('renders the calibration screen controls and overlay', () => {
    const api = installGlobals();

    api.renderCalibrationScreen();

    expect(globalThis.TfitRender.renderGuardTargets).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitCameraRuntime.startPoseDetection).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitAppInputActions.updateCalibrationFromPointer).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderCalibrationOverlay).toHaveBeenCalledTimes(1);
    expect(globalThis.timingState.gameResult).toBe(4999);
    expect(calls.image).toEqual([
      [globalThis.images.stopButton, 530, 420, 100, 50],
      [globalThis.images.resetButton, 270, 380, 120, 60]
    ]);
  });

  it('renders calibration through the settings screen when calibration is active', () => {
    const api = installGlobals({
      gameState: {
        gameCalibration: true,
        gameOver: false
      }
    });

    api.renderSettingsScreen();

    expect(globalThis.TfitRender.renderSettingsControls).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderGuardTargets).toHaveBeenCalledTimes(1);
  });

  it('updates pose globals and draws the nose marker when detection is active', () => {
    const trackedPose = {
      left_wrist: { x: 1 },
      nose: { confidence: 0.9, x: 12, y: 34 },
      right_wrist: { x: 2 }
    };
    const api = installGlobals({
      coef: 2,
      OBJECT_POSE_SIZE: 96,
      poses: [trackedPose]
    });

    api.renderCalibrationPoseMarker();

    expect(globalThis.pose).toBe(trackedPose);
    expect(globalThis.leftHand).toBe(trackedPose.left_wrist);
    expect(globalThis.rightHand).toBe(trackedPose.right_wrist);
    expect(globalThis.nose).toBe(trackedPose.nose);
    expect(calls.circle).toEqual([[24, 68, 12]]);
    expect(calls.fill).toEqual([
      [0, 255, 0, 128],
      [255, 255, 255, 64]
    ]);
  });

  it('skips the nose marker when there is no confident active detection', () => {
    const api = installGlobals({
      isDetecting: false,
      poses: [{
        nose: { confidence: 0.9, x: 12, y: 34 }
      }]
    });

    api.renderCalibrationPoseMarker();

    expect(calls.circle).toEqual([]);
    expect(calls.fill).toEqual([]);
  });
});
