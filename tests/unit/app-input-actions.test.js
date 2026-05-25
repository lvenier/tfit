import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/app-input-actions');

const STUBBED_GLOBALS = [
  'calibrationState',
  'cloneOpponent',
  'coef',
  'dispatchEvent',
  'FRAME_RATE',
  'gameState',
  'GAME_LENGTH',
  'GAME_LEVEL',
  'hide_sensor',
  'KeyboardEvent',
  'key',
  'localStorage',
  'mouseX',
  'mouseY',
  'myWindowHeight',
  'myWindowWidth',
  'OBJECT_POSE_SIZE',
  'SHADOW_SPECIFIC',
  'sounds',
  'TfitAppInputActions',
  'TfitCalibration',
  'TfitFlow',
  'TfitGameLogic',
  'TfitInput',
  'TfitLayoutState'
];

const originalGlobals = new Map();

function sound() {
  return { play: vi.fn() };
}

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  Object.assign(globalThis, {
    calibrationState: {
      init_jab_dragging: false,
      init_jab_y: 100,
      init_uppercut_dragging: false,
      init_uppercut_y: 300,
      left_init_hook_dragging: false,
      left_init_hook_x: 120,
      left_init_pose_dragging: false,
      left_init_pose_x: 200,
      left_init_pose_y: 160,
      right_init_hook_dragging: false,
      right_init_hook_x: 520,
      right_init_pose_dragging: false,
      right_init_pose_x: 440,
      right_init_pose_y: 160
    },
    cloneOpponent: vi.fn(id => ({ id, stamina: 6 })),
    coef: 1,
    FRAME_RATE: 20,
    gameState: {
      curMoves: [{ hit: false }],
      gameCalibration: false,
      gameLength: '60',
      gameLengthIndex: 2,
      gameOver: false,
      gameSeries: 1,
      gameStarted: false,
      level: 0,
      menu: 0,
      my_opponent: null,
      opponent: 0,
      shadow_focus: 0
    },
    GAME_LENGTH: { 1: '30', 2: '60', 3: '120' },
    GAME_LEVEL: { 0: 'easy', 1: 'medium', 2: 'hard' },
    hide_sensor: 0,
    KeyboardEvent: class KeyboardEvent {
      constructor(type, options) {
        this.type = type;
        Object.assign(this, options);
      }
    },
    key: 's',
    localStorage: {
      setItem: vi.fn()
    },
    mouseX: 300,
    mouseY: 300,
    myWindowHeight: 480,
    myWindowWidth: 640,
    OBJECT_POSE_SIZE: 48,
    SHADOW_SPECIFIC: { 0: 'ALL', 1: 'JAB' },
    sounds: {
      click: sound()
    },
    TfitCalibration: {
      calibrationDragUpdates: vi.fn(() => ({ init_jab_y: 111, right_init_pose_y: 222 })),
      persistCalibrationUpdates: vi.fn()
    },
    TfitFlow: {
      gameResultBool: vi.fn(() => false),
      letsfight: vi.fn(),
      loadSongmoves: vi.fn()
    },
    TfitGameLogic: {
      calibrationDefaults: vi.fn(() => ({
        init_jab_y: 10,
        init_uppercut_y: 20,
        left_init_hook_x: 30,
        left_init_pose_x: 40,
        left_init_pose_y: 50,
        right_init_hook_x: 60,
        right_init_pose_x: 70,
        right_init_pose_y: 80
      })),
      nextFrameRate: vi.fn(() => 40),
      nextOneBasedIndex: vi.fn(value => value + 1),
      nextZeroBasedIndex: vi.fn(value => value + 1)
    },
    TfitInput: {
      keyAction: vi.fn(() => ({ type: 'open_shadow' })),
      pointerAction: vi.fn(() => ({ click: true, type: 'open_pad' }))
    },
    TfitLayoutState: {
      setFrameRate: vi.fn(value => {
        globalThis.FRAME_RATE = value;
        return value;
      }),
      snapshot: vi.fn(() => ({
        coef: globalThis.coef,
        frameRate: globalThis.FRAME_RATE,
        height: globalThis.myWindowHeight,
        levelWindowBase: globalThis.LEVEL,
        objectPoseSize: globalThis.OBJECT_POSE_SIZE,
        width: globalThis.myWindowWidth
      }))
    }
  }, overrides);

  delete require.cache[modulePath];
  return require('../../js/app-input-actions');
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

describe('TfitAppInputActions exports', () => {
  it('exposes app input action helpers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'applyCalibrationDragFlags',
      'applyCalibrationUpdates',
      'applyInputAction',
      'applyKeyInputAction',
      'applyPointerInputAction',
      'resetCalibrationDefaults',
      'updateCalibrationFromPointer'
    ]);
    expect(globalThis.TfitAppInputActions).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      TfitCalibration: {
        calibrationDragUpdates: () => ({}),
        persistCalibrationUpdates: () => {}
      },
      TfitFlow: {
        gameResultBool: () => false,
        letsfight: () => {},
        loadSongmoves: () => {}
      },
      TfitGameLogic: {
        calibrationDefaults: () => ({}),
        nextFrameRate: value => value,
        nextOneBasedIndex: value => value,
        nextZeroBasedIndex: value => value
      },
      TfitInput: {
        keyAction: () => ({ type: 'none' }),
        pointerAction: () => ({ type: 'none' })
      },
      TfitLayoutState: {
        setFrameRate: value => value,
        snapshot: () => ({
          coef: 1,
          frameRate: 20,
          height: 480,
          objectPoseSize: 48,
          width: 640
        })
      }
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitAppInputActions.applyInputAction).toBe('function');
  });
});

describe('applyInputAction', () => {
  it('opens mode menus, clears moves, and refreshes generated moves', () => {
    const api = installGlobals();

    api.applyInputAction({ click: true, type: 'open_shadow' });
    expect(globalThis.gameState.menu).toBe(2);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitFlow.loadSongmoves).toHaveBeenCalledTimes(1);

    api.applyInputAction({ click: true, type: 'open_fight' });
    expect(globalThis.gameState.menu).toBe(4);
    expect(globalThis.gameState.my_opponent).toEqual({ id: 0, stamina: 6 });
  });

  it('cycles settings and persists the new values', () => {
    const api = installGlobals();

    api.applyInputAction({ click: true, type: 'cycle_frame_rate' });
    api.applyInputAction({ click: true, type: 'cycle_level' });
    api.applyInputAction({ click: true, type: 'cycle_length' });
    api.applyInputAction({ click: true, type: 'cycle_series' });
    api.applyInputAction({ type: 'cycle_shadow_focus' });

    expect(globalThis.FRAME_RATE).toBe(40);
    expect(globalThis.TfitLayoutState.setFrameRate).toHaveBeenCalledWith(40);
    expect(globalThis.gameState.level).toBe(1);
    expect(globalThis.gameState.gameLengthIndex).toBe(3);
    expect(globalThis.gameState.gameLength).toBe('120');
    expect(globalThis.gameState.gameSeries).toBe(2);
    expect(globalThis.gameState.shadow_focus).toBe(1);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('frame_rate', 40);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('shadow_focus', 1);
  });

  it('starts, stops, and resets calibration-related state', () => {
    const dispatched = [];
    const api = installGlobals({
      dispatchEvent: event => dispatched.push(event)
    });

    api.applyInputAction({ click: true, type: 'start_calibration' });
    expect(globalThis.gameState.gameCalibration).toBe(true);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.hide_sensor).toBe(64);

    api.applyInputAction({ type: 'stop_calibration' });
    expect(globalThis.gameState.gameCalibration).toBe(false);
    expect(globalThis.gameState.menu).toBe(1);

    api.applyInputAction({ click: true, type: 'reset_calibration' });
    expect(dispatched[0]).toMatchObject({ key: 'r', code: 'KeyR' });
  });

  it('handles simple navigation and no-op actions', () => {
    const api = installGlobals();

    api.applyInputAction({ type: 'none' });
    expect(globalThis.gameState.menu).toBe(0);

    api.applyInputAction({ click: true, type: 'open_settings' });
    expect(globalThis.gameState.menu).toBe(1);

    api.applyInputAction({ click: true, type: 'back_to_menu' });
    expect(globalThis.gameState.menu).toBe(0);

    api.applyInputAction({ click: true, type: 'stop_current' });
    expect(globalThis.gameState.gameOver).toBe(true);

    api.applyInputAction({ type: 'start_fight' });
    expect(globalThis.TfitFlow.letsfight).toHaveBeenCalledTimes(1);
  });

  it('applies drag actions from the dispatcher', () => {
    const api = installGlobals();

    api.applyInputAction({
      flags: {
        init_jab_dragging: true,
        init_uppercut_dragging: false,
        left_init_hook_dragging: true,
        left_init_pose_dragging: false,
        right_init_hook_dragging: true,
        right_init_pose_dragging: false
      },
      type: 'calibration_drag'
    });

    expect(globalThis.calibrationState).toMatchObject({
      init_jab_dragging: true,
      left_init_hook_dragging: true,
      right_init_hook_dragging: true
    });
  });
});

describe('calibration helpers and input adapters', () => {
  it('applies drag flags and calibration updates', () => {
    const api = installGlobals();

    api.applyCalibrationDragFlags({
      init_jab_dragging: true,
      init_uppercut_dragging: true,
      left_init_hook_dragging: true,
      left_init_pose_dragging: true,
      right_init_hook_dragging: true,
      right_init_pose_dragging: true
    });

    expect(globalThis.calibrationState).toMatchObject({
      init_jab_dragging: true,
      left_init_pose_dragging: true,
      right_init_pose_dragging: true
    });

    api.applyCalibrationUpdates({
      init_jab_y: 123,
      init_uppercut_y: 234,
      left_init_hook_x: 345,
      left_init_pose_x: 456,
      left_init_pose_y: 567,
      right_init_hook_x: 678,
      right_init_pose_x: 789,
      right_init_pose_y: 890
    });
    expect(globalThis.calibrationState.init_jab_y).toBe(123);
    expect(globalThis.calibrationState.init_uppercut_y).toBe(234);
    expect(globalThis.calibrationState.left_init_hook_x).toBe(345);
    expect(globalThis.calibrationState.left_init_pose_x).toBe(456);
    expect(globalThis.calibrationState.left_init_pose_y).toBe(567);
    expect(globalThis.calibrationState.right_init_hook_x).toBe(678);
    expect(globalThis.calibrationState.right_init_pose_x).toBe(789);
    expect(globalThis.calibrationState.right_init_pose_y).toBe(890);
    expect(globalThis.TfitCalibration.persistCalibrationUpdates).toHaveBeenCalledWith(
      {
        init_jab_y: 123,
        init_uppercut_y: 234,
        left_init_hook_x: 345,
        left_init_pose_x: 456,
        left_init_pose_y: 567,
        right_init_hook_x: 678,
        right_init_pose_x: 789,
        right_init_pose_y: 890
      },
      globalThis.localStorage
    );
  });

  it('resets calibration defaults and persists every value', () => {
    const api = installGlobals();

    api.applyInputAction({ type: 'reset_calibration_defaults' });

    expect(globalThis.calibrationState).toMatchObject({
      init_jab_y: 10,
      left_init_pose_x: 40,
      right_init_pose_y: 80
    });
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('right_init_pose_y', 80);
  });

  it('builds pointer and key actions from current global state', () => {
    const api = installGlobals();

    api.applyPointerInputAction();
    expect(globalThis.TfitInput.pointerAction).toHaveBeenCalledWith(expect.objectContaining({
      menu: 0,
      mouseX: 300,
      recentResult: false
    }));
    expect(globalThis.gameState.menu).toBe(3);

    api.applyKeyInputAction();
    expect(globalThis.TfitInput.keyAction).toHaveBeenCalledWith(expect.objectContaining({
      key: 's',
      menu: 3
    }));
  });

  it('skips key actions while recent results are visible and updates calibration from pointer', () => {
    const api = installGlobals({
      TfitFlow: {
        gameResultBool: vi.fn(() => true),
        letsfight: vi.fn(),
        loadSongmoves: vi.fn()
      }
    });

    api.applyKeyInputAction();
    expect(globalThis.TfitInput.keyAction).not.toHaveBeenCalled();

    api.updateCalibrationFromPointer();
    expect(globalThis.TfitCalibration.calibrationDragUpdates).toHaveBeenCalledWith(expect.objectContaining({
      mouseX: 300,
      mouseY: 300
    }));
    expect(globalThis.calibrationState.init_jab_y).toBe(111);
    expect(globalThis.calibrationState.right_init_pose_y).toBe(222);
  });
});
