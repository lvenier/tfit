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
  'OPPONENTS',
  'SHADOW_SPECIFIC',
  'sounds',
  'TfitAppInputActions',
  'TfitCalibration',
  'TfitFaceRecognition',
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
    OPPONENTS: { 0: { stamina: 6 }, 1: { stamina: 8 }, 2: { stamina: 10 } },
    SHADOW_SPECIFIC: { 0: 'ALL', 1: 'JAB' },
    sounds: {
      click: sound()
    },
    TfitCalibration: {
      calibrationDragUpdates: vi.fn(() => ({ init_jab_y: 111, right_init_pose_y: 222 })),
      persistCalibrationUpdates: vi.fn()
    },
    TfitFaceRecognition: {
      selectedProfile: vi.fn(() => ({ key: 'player', name: 'Laurent' })),
      updatePanel: vi.fn(),
      updateSelectedPlayerName: vi.fn(() => ({ key: 'player', name: 'Lolo' }))
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
      'applyMenuButtonTransition',
      'applyPendingMenuButtonTransition',
      'applyPointerInputAction',
      'canApplyDuringRecentResult',
      'cancelProfileNameSpelling',
      'clearCalibrationUiState',
      'clearMenuDoorTransition',
      'editSelectedProfileName',
      'handleMenuOpenAction',
      'queueMenuDoorAnimation',
      'queueMenuRestore',
      'resetCalibrationDefaults',
      'saveProfileNameSpelling',
      'spellProfileName',
      'updateCalibrationFromPointer',
      'viewSelectedProfileName'
    ]);
    expect(globalThis.TfitAppInputActions).toBe(api);
  });

  it('clears active menu door transitions when requested', () => {
    const api = installGlobals();
    vi.spyOn(globalThis, 'clearTimeout');

    globalThis.gameState.menuButtonAnimation = {
      transitionTimeout: 123,
      pendingTransition: { menu: 1 }
    };

    api.clearMenuDoorTransition();

    expect(clearTimeout).toHaveBeenCalledWith(123);
    expect(globalThis.gameState.menuButtonAnimation.transitionTimeout).toBeNull();
    expect(globalThis.gameState.menuButtonAnimation.pendingTransition).toBeNull();
  });

  it('clears previous transition timeout when queueing a new door animation', () => {
    const api = installGlobals();
    vi.spyOn(globalThis, 'clearTimeout');

    globalThis.gameState.menuButtonAnimation = {
      transitionTimeout: 321,
      pendingTransition: { menu: 1 }
    };

    api.queueMenuDoorAnimation('open_pad');

    expect(clearTimeout).toHaveBeenCalledWith(321);
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
    expect(globalThis.gameState.menu).toBe(0);
    expect(globalThis.TfitFlow.loadSongmoves).not.toHaveBeenCalled();
    expect(globalThis.gameState.menuButtonAnimation).toMatchObject({
      active: true,
      button: 'open_shadow',
      pendingTransition: { menu: 2, clearCurMoves: true, loadSongmoves: true }
    });
    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(1);
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.menu).toBe(2);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.TfitFlow.loadSongmoves).toHaveBeenCalledTimes(1);

    api.applyInputAction({ click: true, type: 'open_fight' });
    expect(globalThis.gameState.menu).toBe(2);
    expect(globalThis.gameState.menuButtonAnimation).toMatchObject({
      active: true,
      button: 'open_fight',
      pendingTransition: { menu: 4, clearCurMoves: true, loadSongmoves: true, resetOpponent: true }
    });
    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(2);
    expect(globalThis.gameState.my_opponent).toBeNull();
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.menu).toBe(4);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.TfitFlow.loadSongmoves).toHaveBeenCalledTimes(2);
    expect(globalThis.gameState.my_opponent).toEqual({ id: 0, stamina: 6 });
  });

  it('opens profile menu and applies profile edit/view actions', () => {
    const api = installGlobals();

    api.applyInputAction({ click: true, type: 'open_profile' });
    expect(globalThis.gameState.menuButtonAnimation).toMatchObject({
      active: true,
      button: 'open_profile',
      pendingTransition: { menu: 5 }
    });
    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitFaceRecognition.updatePanel).toHaveBeenCalledWith({ matched: 'Laurent' });
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.menu).toBe(5);

    api.applyInputAction({ click: true, type: 'profile_edit' });
    expect(globalThis.gameState.profileNameEditing).toBe(true);
    expect(globalThis.gameState.profileNameDraft).toBe('Laurent');
    expect(globalThis.gameState.profileStatsVisible).toBe(false);

    api.applyInputAction({ click: true, type: 'profile_view' });
    expect(globalThis.TfitFaceRecognition.updatePanel).toHaveBeenCalledWith({ matched: 'Laurent' });
    expect(globalThis.gameState.profileStatsVisible).toBe(true);

    api.applyInputAction({ click: true, type: 'back_to_menu' });
    expect(globalThis.gameState.menu).toBe(5);
    expect(globalThis.gameState.profileStatsVisible).toBe(false);
    expect(globalThis.gameState.menuButtonAnimation.button).toBe('open_profile');
  });

  it('spells profile names with keyboard input', () => {
    const api = installGlobals({
      gameState: {
        ...globalThis.gameState,
        menu: 5,
        profileNameDraft: '',
        profileNameEditing: true
      }
    });

    expect(api.spellProfileName('L')).toBe(true);
    expect(api.spellProfileName('o')).toBe(true);
    expect(api.spellProfileName('Backspace')).toBe(true);
    expect(api.spellProfileName('l')).toBe(true);
    expect(api.spellProfileName('o')).toBe(true);
    expect(globalThis.gameState.profileNameDraft).toBe('Llo');

    api.applyKeyInputAction('Enter');

    expect(globalThis.gameState.profileNameEditing).toBe(false);
    expect(globalThis.TfitFaceRecognition.updateSelectedPlayerName).toHaveBeenCalledWith('Llo');
    expect(globalThis.TfitFaceRecognition.updatePanel).toHaveBeenCalledWith({ matched: 'Lolo' });
  });

  it('handles profile spelling fallback paths', () => {
    const api = installGlobals({
      gameState: {
        ...globalThis.gameState,
        profileNameDraft: 'Draft',
        profileNameEditing: false
      }
    });

    expect(api.spellProfileName('L')).toBe(false);

    globalThis.gameState.profileNameEditing = true;
    expect(api.spellProfileName('ArrowLeft')).toBe(true);
    expect(globalThis.gameState.profileNameDraft).toBe('Draft');

    globalThis.gameState.profileNameDraft = '   ';
    expect(api.spellProfileName('Enter')).toBe(true);

    expect(globalThis.gameState.profileNameEditing).toBe(false);
    expect(globalThis.TfitFaceRecognition.updateSelectedPlayerName).not.toHaveBeenCalled();
    expect(globalThis.TfitFaceRecognition.updatePanel).toHaveBeenCalledWith({ matched: 'Laurent' });
  });

  it('keeps the current name when saving cannot update a profile', () => {
    const api = installGlobals({
      gameState: {
        ...globalThis.gameState,
        profileNameDraft: 'Lolo',
        profileNameEditing: true
      },
      TfitFaceRecognition: {
        selectedProfile: vi.fn(() => ({ key: 'player', name: 'Laurent' })),
        updatePanel: vi.fn()
      }
    });

    expect(api.spellProfileName('Enter')).toBe(true);
    expect(globalThis.TfitFaceRecognition.updatePanel).toHaveBeenCalledWith({ matched: 'Laurent' });
  });

  it('does not refresh the panel when no profile name is available to view', () => {
    const api = installGlobals({
      TfitFaceRecognition: {
        selectedProfile: vi.fn(() => ({ key: 'player', name: '' })),
        updatePanel: vi.fn(),
        updateSelectedPlayerName: vi.fn(() => null)
      }
    });

    api.applyInputAction({ type: 'profile_view' });
    expect(globalThis.TfitFaceRecognition.updatePanel).not.toHaveBeenCalled();

    globalThis.gameState.profileNameDraft = 'Lolo';
    globalThis.gameState.profileNameEditing = true;
    expect(api.spellProfileName('Enter')).toBe(true);
    expect(globalThis.TfitFaceRecognition.updateSelectedPlayerName).toHaveBeenCalledWith('Lolo');
    expect(globalThis.TfitFaceRecognition.updatePanel).not.toHaveBeenCalled();
  });

  it('ignores profile editing when face recognition helpers are unavailable', () => {
    const api = installGlobals({
      TfitFaceRecognition: null
    });

    api.applyInputAction({ click: true, type: 'profile_edit' });
    api.applyInputAction({ click: true, type: 'profile_view' });

    expect(globalThis.gameState.profileNameEditing).toBeUndefined();
  });

  it('can cancel profile name spelling', () => {
    const api = installGlobals({
      gameState: {
        ...globalThis.gameState,
        profileNameDraft: 'Draft',
        profileNameEditing: true
      }
    });

    expect(api.spellProfileName('Escape')).toBe(true);

    expect(globalThis.gameState.profileNameEditing).toBe(false);
    expect(globalThis.gameState.profileNameDraft).toBe('');
    expect(globalThis.TfitFaceRecognition.updateSelectedPlayerName).not.toHaveBeenCalled();
  });

  it('covers menu transition fallback and no-op states', () => {
    const api = installGlobals();

    expect(api.applyPendingMenuButtonTransition()).toBe(false);
    api.applyMenuButtonTransition(null);
    expect(globalThis.gameState.menu).toBe(0);

    api.queueMenuDoorAnimation('invalid_button');
    expect(globalThis.gameState.menuButtonAnimation).toBeUndefined();

    api.handleMenuOpenAction('open_shadow', false);
    expect(globalThis.gameState.menu).toBe(2);
    expect(globalThis.gameState.menuButtonAnimation).toBeUndefined();
  });

  it('handles non-integer menu transition values without changing current menu', () => {
    const api = installGlobals();
    api.applyMenuButtonTransition({ button: 'legacy', menu: '2', clearCurMoves: true });

    expect(globalThis.gameState.menu).toBe(0);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.TfitFlow.loadSongmoves).not.toHaveBeenCalled();
  });

  it('cycles settings and persists the new values', () => {
    const api = installGlobals();

    api.applyInputAction({ click: true, type: 'cycle_frame_rate' });
    api.applyInputAction({ click: true, type: 'cycle_level' });
    api.applyInputAction({ click: true, type: 'cycle_length' });
    api.applyInputAction({ click: true, type: 'cycle_series' });
    api.applyInputAction({ click: true, type: 'cycle_opponent' });
    api.applyInputAction({ type: 'cycle_shadow_focus' });

    expect(globalThis.FRAME_RATE).toBe(40);
    expect(globalThis.TfitLayoutState.setFrameRate).toHaveBeenCalledWith(40);
    expect(globalThis.gameState.level).toBe(1);
    expect(globalThis.gameState.gameLengthIndex).toBe(3);
    expect(globalThis.gameState.gameLength).toBe('120');
    expect(globalThis.gameState.gameSeries).toBe(2);
    expect(globalThis.gameState.opponent).toBe(1);
    expect(globalThis.gameState.my_opponent).toEqual({ id: 1, stamina: 6 });
    expect(globalThis.gameState.my_stamina).toBe(6);
    expect(globalThis.gameState.shadow_focus).toBe(1);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('frame_rate', 40);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('opponent', 1);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('shadow_focus', 1);
  });

  it('starts, stops, and resets calibration-related state', () => {
    const dispatched = [];
    const api = installGlobals({
      dispatchEvent: event => dispatched.push(event)
    });

    api.applyInputAction({ click: true, type: 'start_calibration' });
    expect(globalThis.gameState.gameCalibration).toBe(false);
    expect(globalThis.gameState.menuButtonAnimation.active).toBe(true);
    expect(globalThis.gameState.menuButtonAnimation.button).toBe('start_calibration');
    expect(globalThis.gameState.menuButtonAnimation.pendingTransition).toMatchObject({
      menu: 1
    });
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.gameCalibration).toBe(true);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.hide_sensor).toBe(64);

    api.applyInputAction({ type: 'stop_calibration' });
    expect(globalThis.gameState.gameCalibration).toBe(false);
    expect(globalThis.gameState.menu).toBe(1);

    api.applyInputAction({ click: true, type: 'leave_calibration' });
    expect(globalThis.gameState.menuButtonAnimation.pendingTransition).toMatchObject({
      menu: 1
    });
    expect(globalThis.gameState.gameCalibration).toBe(false);
    expect(globalThis.hide_sensor).toBe(0);
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.gameOver).toBe(true);

    api.applyInputAction({ click: true, type: 'reset_calibration' });
    expect(dispatched[0]).toMatchObject({ key: 'r', code: 'KeyR' });
  });

  it('leaves menu restore callback with active game states untouched', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false }],
        gameCalibration: false,
        gameLength: '60',
        gameLengthIndex: 2,
        gameOver: false,
        gameSeries: 1,
        gameStarted: true,
        level: 0,
        menu: 0,
        my_opponent: null,
        opponent: 0,
        shadow_focus: 0
      }
    });

    vi.useFakeTimers();
    try {
      api.queueMenuRestore();
      expect(globalThis.gameState.menu).toBe(0);

      vi.advanceTimersByTime(20);

      expect(globalThis.gameState.menu).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('gracefully handles missing restore timeout on existing animation state', () => {
    const api = installGlobals();
    vi.spyOn(globalThis, 'clearTimeout');

    api.queueMenuRestore();
    expect(clearTimeout).not.toHaveBeenCalled();
  });

  it('applies menu restore timeout flow and clears existing restore timers', () => {
    const api = installGlobals();
    const restoreId = 99;

    vi.useFakeTimers();
    try {
      vi.spyOn(globalThis, 'clearTimeout');

      api.applyInputAction({ click: true, type: 'open_shadow' });
      vi.runAllTimers();
      expect(globalThis.gameState.menu).toBe(2);
      expect(globalThis.gameState.menuButtonAnimation.pendingTransition).toBeNull();

      globalThis.gameState.menu = 0;
      globalThis.gameState.menuButtonAnimation = {
        active: false,
        restoreTimeout: restoreId,
        pendingTransition: null
      };
      api.queueMenuRestore();
      expect(clearTimeout).toHaveBeenCalledWith(restoreId);
      vi.advanceTimersByTime(20);
      expect(globalThis.gameState.menu).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('no-ops menu restore when no app state is resolved', () => {
    const api = installGlobals();
    const originalGameState = globalThis.gameState;
    const originalTfitState = globalThis.TfitState;

    vi.useFakeTimers();
    try {
      delete globalThis.gameState;
      delete globalThis.TfitState;
      api.queueMenuRestore();
      vi.advanceTimersByTime(20);
    } finally {
      globalThis.TfitState = originalTfitState;
      globalThis.gameState = originalGameState;
      vi.useRealTimers();
    }
  });

  it('handles simple navigation and no-op actions', () => {
    const api = installGlobals();

    api.applyInputAction({ type: 'none' });
    expect(globalThis.gameState.menu).toBe(0);

    api.applyInputAction({ click: true, type: 'open_settings' });
    expect(globalThis.gameState.menu).toBe(0);
    expect(globalThis.gameState.menuButtonAnimation).toMatchObject({
      active: true,
      button: 'open_settings',
      pendingTransition: { menu: 1 }
    });
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.menu).toBe(1);

    api.applyInputAction({ click: true, type: 'back_to_menu' });
    expect(globalThis.gameState.menu).toBe(1);
    expect(globalThis.gameState.menuButtonAnimation).toMatchObject({
      active: true,
      button: 'back_to_menu',
      pendingTransition: { menu: 0 }
    });
    expect(globalThis.TfitFaceRecognition.updatePanel).toHaveBeenCalledWith({ matched: 'Laurent' });
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.menu).toBe(0);

    api.applyInputAction({ type: 'back_to_menu' });
    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(2);

    api.applyInputAction({ click: true, type: 'stop_current' });
    expect(globalThis.gameState.gameOver).toBe(true);

    api.applyInputAction({ type: 'stop_current' });
    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(3);

    api.applyInputAction({ type: 'start_fight' });
    expect(globalThis.TfitFlow.letsfight).toHaveBeenCalledTimes(1);
  });

  it('does not apply a pending menu transition when the timer resolves without one', () => {
    const api = installGlobals({
      TfitInput: {
        keyAction: vi.fn(() => ({ type: 'none' })),
        pointerAction: vi.fn(() => ({ type: 'none' }))
      }
    });

    vi.useFakeTimers();
    vi.spyOn(api, 'applyPendingMenuButtonTransition');

    try {
      api.queueMenuDoorAnimation('open_pad');
      globalThis.gameState.menuButtonAnimation.pendingTransition = null;
      vi.advanceTimersByTime(600);

      expect(api.applyPendingMenuButtonTransition).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies the pending menu transition when the queue timer resolves', () => {
    const api = installGlobals();
    let queuedTransitionCallback;

    vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback, _delay) => {
      queuedTransitionCallback = callback;
      return 99;
    });

    api.queueMenuDoorAnimation('open_pad');
    expect(typeof queuedTransitionCallback).toBe('function');

    queuedTransitionCallback();

    expect(globalThis.gameState.menu).toBe(3);
    expect(globalThis.TfitFlow.loadSongmoves).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.gameState.menuButtonAnimation.pendingTransition).toBeNull();
  });

  it('skips restore-timeout menu-button cleanup if animation state is removed before callback', () => {
    const api = installGlobals();

    vi.useFakeTimers();
    try {
      api.queueMenuRestore();
      globalThis.gameState.menu = 2;
      globalThis.gameState.gameCalibration = true;
      globalThis.gameState.menuButtonAnimation = undefined;

      vi.advanceTimersByTime(20);
      expect(globalThis.gameState.menu).toBe(2);
    } finally {
      vi.useRealTimers();
    }

  });

  it('does not execute unknown action branch for non-calibration drag events', () => {
    const api = installGlobals();
    api.applyInputAction({ type: 'bogus' });
    expect(globalThis.gameState.menu).toBe(0);
    expect(globalThis.gameState.curMoves).toEqual([{ hit: false }]);
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
    expect(globalThis.gameState.menu).toBe(0);
    expect(globalThis.gameState.menuButtonAnimation).toMatchObject({
      button: 'open_pad',
      pendingTransition: { menu: 3, clearCurMoves: true, loadSongmoves: true }
    });

    api.applyKeyInputAction();
    expect(globalThis.TfitInput.keyAction).toHaveBeenCalledWith(expect.objectContaining({
      key: 's',
      menu: 0
    }));
    expect(globalThis.gameState.menu).toBe(0);
    expect(globalThis.gameState.menuButtonAnimation).toMatchObject({
      active: true,
      button: 'open_shadow',
      pendingTransition: { menu: 2, clearCurMoves: true, loadSongmoves: true }
    });
    expect(api.applyPendingMenuButtonTransition()).toBe(true);
    expect(globalThis.gameState.menu).toBe(2);
  });

  it('uses explicit key values from DOM keyboard events', () => {
    const api = installGlobals({
      TfitInput: {
        keyAction: vi.fn(() => ({ type: 'none' })),
        pointerAction: vi.fn(() => ({ type: 'none' }))
      }
    });

    api.applyKeyInputAction('c');

    expect(globalThis.TfitInput.keyAction).toHaveBeenCalledWith(expect.objectContaining({
      key: 'c'
    }));
  });

  it('uses pending menu transition when menu button animation is active', () => {
    const api = installGlobals({
      TfitInput: {
        keyAction: vi.fn(() => ({ type: 'none' })),
        pointerAction: vi.fn(() => ({ type: 'none' }))
      }
    });
    globalThis.gameState.menu = 4;
    globalThis.gameState.menuButtonAnimation = {
      active: true,
      pendingTransition: { menu: 1 }
    };

    api.applyKeyInputAction();

    expect(globalThis.TfitInput.keyAction).toHaveBeenCalledWith(expect.objectContaining({
      menu: 1
    }));
  });

  it('ignores pending transition override when override state is inactive', () => {
    const api = installGlobals({
      TfitInput: {
        keyAction: vi.fn(() => ({ type: 'none' })),
        pointerAction: vi.fn(() => ({ type: 'none' }))
      }
    });
    globalThis.gameState.menu = 4;
    globalThis.gameState.menuButtonAnimation = {
      active: false,
      pendingTransition: { menu: 1 }
    };

    api.applyKeyInputAction();

    expect(globalThis.TfitInput.keyAction).toHaveBeenCalledWith(expect.objectContaining({
      menu: 4
    }));
  });

  it('skips key actions while recent results are visible and updates calibration from pointer', () => {
    const api = installGlobals();

    globalThis.TfitFlow.gameResultBool.mockReturnValue(true);
    api.applyKeyInputAction();
    expect(globalThis.TfitInput.keyAction).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState.menuButtonAnimation).toBeUndefined();

    api.updateCalibrationFromPointer();
    expect(globalThis.TfitCalibration.calibrationDragUpdates).toHaveBeenCalledWith(expect.objectContaining({
      mouseX: 300,
      mouseY: 300
    }));
    expect(globalThis.calibrationState.init_jab_y).toBe(111);
    expect(globalThis.calibrationState.right_init_pose_y).toBe(222);
  });

  it('allows calibration controls while recent results are visible', () => {
    const api = installGlobals({
      gameState: {
        ...globalThis.gameState,
        gameCalibration: true,
        menu: 1
      },
      TfitInput: {
        keyAction: vi.fn(() => ({ type: 'stop_calibration' })),
        pointerAction: vi.fn(() => ({ type: 'none' }))
      }
    });

    globalThis.TfitFlow.gameResultBool.mockReturnValue(true);
    api.applyKeyInputAction('s');

    expect(globalThis.gameState.gameCalibration).toBe(false);
    expect(globalThis.gameState.menu).toBe(1);
    expect(api.canApplyDuringRecentResult({ type: 'stop_calibration' })).toBe(true);
    expect(api.canApplyDuringRecentResult({ type: 'open_shadow' })).toBe(false);
  });

  it('does not apply non-calibration key actions when game result is already visible', () => {
    const keyAction = vi.fn(() => ({ type: 'open_shadow' }));
    const api = installGlobals({
      TfitInput: {
        keyAction,
        pointerAction: vi.fn(() => ({ type: 'none' }))
      },
      TfitFlow: {
        gameResultBool: vi.fn(() => true),
        letsfight: vi.fn(),
        loadSongmoves: vi.fn()
      }
    });

    api.applyKeyInputAction();

    expect(keyAction).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState.menuButtonAnimation).toBeUndefined();
  });
}); 
