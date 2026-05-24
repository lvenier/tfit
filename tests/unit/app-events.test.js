import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/app-events');

const STUBBED_GLOBALS = [
  'dispatchEvent',
  'gameState',
  'KeyboardEvent',
  'TfitAppEvents',
  'TfitAppInputActions',
  'TfitInput'
];

const originalGlobals = new Map();

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  Object.assign(globalThis, {
    dispatchEvent: vi.fn(() => true),
    gameState: {
      gameCalibration: false,
      gameStarted: false
    },
    KeyboardEvent: class KeyboardEvent {
      constructor(type, options) {
        this.type = type;
        Object.assign(this, options);
      }
    },
    TfitAppInputActions: {
      applyCalibrationDragFlags: vi.fn(),
      applyKeyInputAction: vi.fn(),
      applyPointerInputAction: vi.fn()
    },
    TfitInput: {
      clearCalibrationDragFlags: vi.fn(() => ({ left_init_pose_dragging: false }))
    }
  }, overrides);

  delete require.cache[modulePath];
  return require('../../js/app-events');
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

describe('TfitAppEvents exports', () => {
  it('exposes app event handlers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'handleCanvasContextMenu',
      'handleKeyboardInput',
      'handlePointerChange',
      'handlePointerRelease',
      'preventContextMenu'
    ]);
    expect(globalThis.TfitAppEvents).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      TfitAppInputActions: {
        applyCalibrationDragFlags: () => {},
        applyKeyInputAction: () => {},
        applyPointerInputAction: () => {}
      },
      TfitInput: {
        clearCalibrationDragFlags: () => ({})
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitAppEvents.handlePointerChange).toBe('function');
  });
});

describe('app event handlers', () => {
  it('prevents the document context menu', () => {
    const api = installGlobals();
    const event = { preventDefault: vi.fn() };

    api.preventContextMenu(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('routes pointer and keyboard input to app input actions', () => {
    const api = installGlobals();

    api.handlePointerChange();
    api.handleKeyboardInput();

    expect(globalThis.TfitAppInputActions.applyPointerInputAction).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitAppInputActions.applyKeyInputAction).toHaveBeenCalledTimes(1);
  });

  it('clears calibration dragging only while calibration is active', () => {
    const api = installGlobals();

    api.handlePointerRelease();
    expect(globalThis.TfitInput.clearCalibrationDragFlags).not.toHaveBeenCalled();
    expect(globalThis.TfitAppInputActions.applyCalibrationDragFlags).not.toHaveBeenCalled();

    globalThis.gameState.gameCalibration = true;
    api.handlePointerRelease();

    expect(globalThis.TfitInput.clearCalibrationDragFlags).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitAppInputActions.applyCalibrationDragFlags).toHaveBeenCalledWith({
      left_init_pose_dragging: false
    });
  });

  it('maps right click to back when the game has not started', () => {
    const api = installGlobals();
    const event = { preventDefault: vi.fn() };

    expect(api.handleCanvasContextMenu(event)).toBe(true);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(globalThis.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
      bubbles: true,
      code: 'KeyB',
      key: 'b',
      type: 'keydown'
    }));
  });

  it('maps right click to stop when the game has started', () => {
    const api = installGlobals({
      gameState: {
        gameCalibration: false,
        gameStarted: true
      }
    });

    api.handleCanvasContextMenu({ preventDefault: vi.fn() });

    expect(globalThis.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
      bubbles: true,
      code: 'KeyS',
      key: 's',
      type: 'keydown'
    }));
  });
});
