import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/screen-router');

const STUBBED_GLOBALS = [
  'background',
  'clear',
  'coef',
  'error',
  'fill',
  'FRAME_RATE',
  'gameState',
  'hide_sensor',
  'image',
  'images',
  'innerHeight',
  'innerWidth',
  'myWindowHeight',
  'myWindowWidth',
  'OBJECT_POSE_SIZE',
  'noStroke',
  'OPPONENTS',
  'pop',
  'sounds',
  'speechString',
  'push',
  'textSize',
  'timingState',
  'rect',
  'text',
  'textAlign',
  'textStyle',
  'TfitAppInputActions',
  'TfitCameraRuntime',
  'TfitFightMode',
  'TfitFlow',
  'TfitLayoutState',
  'TfitPadMode',
  'TfitRender',
  'TfitRound',
  'TfitScreenRouter',
  'TfitSettingsScreen',
  'TfitShadowMode'
];

const originalGlobals = new Map();
const calls = {};

function record(name) {
  return (...args) => {
    calls[name].push(args);
  };
}

function defaultGameState(overrides = {}) {
  return {
    arrayScore: [{ score: 4 }],
    curMoves: [{ hit: false }],
    gameCalibration: false,
    gameDuration: 600,
    gameOver: false,
    gameStarted: false,
    gameTimer: 10,
    gameTimerNext: 0,
    menu: 0,
    moves: [{ name: 'jab' }],
    score: 0,
    ...overrides
  };
}

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  for (const name of ['background', 'clear', 'fill', 'image', 'noStroke', 'pop', 'push', 'rect', 'text', 'textAlign', 'textSize', 'textStyle']) {
    calls[name] = [];
    globalThis[name] = record(name);
  }

  Object.assign(globalThis, {
    coef: 1,
    clear: record('clear'),
    error: '',
    FRAME_RATE: 20,
    gameState: defaultGameState(),
    hide_sensor: 64,
    images: {
      goodHit: { name: 'good-hit' },
      keepTrying: { name: 'keep-trying' },
      stopButton: { name: 'stop' },
      yourGuard: { name: 'guard' }
    },
    innerHeight: 720,
    innerWidth: 1280,
    myWindowHeight: 480,
    myWindowWidth: 640,
    OBJECT_POSE_SIZE: 48,
    OPPONENTS: {
      0: { stamina: 6 },
      1: { stamina: 8 }
    },
    sounds: {
      keepTrying: { play: vi.fn() },
      yourGuard: { play: vi.fn() },
      doorClose: {
        play: vi.fn(),
        rate: vi.fn()
      },
      doorOpen: {
        play: vi.fn(),
        rate: vi.fn()
      }
    },
    TfitAppInputActions: {
      applyPendingMenuButtonTransition: vi.fn()
    },
    speechString: null,
    timingState: {
      gameResult: 0,
      guardWarning: 0,
      hitSuccess: 0,
      leftPoses: 0,
      rightPoses: 0
    },
    TfitCameraRuntime: {
      checkStartCondition: vi.fn(() => true),
      startPoseDetection: vi.fn(),
      stopPoseDetection: vi.fn()
    },
    TfitFightMode: {
      renderFightMode: vi.fn()
    },
    TfitFlow: {
      finishRound: vi.fn(),
      gameResultBool: vi.fn(() => false)
    },
    TfitLayoutState: {
      snapshot: () => ({
        coef: globalThis.coef,
        frameRate: globalThis.FRAME_RATE,
        height: globalThis.myWindowHeight,
        levelWindowBase: globalThis.LEVEL,
        objectPoseSize: globalThis.OBJECT_POSE_SIZE,
        width: globalThis.myWindowWidth
      })
    },
    TfitPadMode: {
      renderPadMode: vi.fn()
    },
    TfitRender: {
      drawMessagePanel: vi.fn(),
      renderBackButton: vi.fn(),
      renderFightButton: vi.fn(),
      renderStopButton: vi.fn(),
      renderGuardTargets: vi.fn(),
      renderLoadingScreen: vi.fn(),
      renderMainMenu: vi.fn(),
      renderProfileScreen: vi.fn(),
      renderRoundHud: vi.fn(),
      renderSceneBackground: vi.fn(),
      renderSpeech: vi.fn()
    },
    TfitRound: {
      guardFeedback: vi.fn(() => ({
        guardWarningTime: 123,
        playSound: false,
        show: false
      })),
      initialRoundMoveState: vi.fn(() => ({
        arrayScore: [{ score: 0 }],
        curMoves: [{ name: 'jab', hit: false }],
        gameTimerNext: 7
      })),
      isRoundExpired: vi.fn(() => false),
      keepTryingFeedback: vi.fn(() => ({
        playSound: false,
        show: false
      })),
      remainingRoundSeconds: vi.fn(() => 12),
      scoreTotal: vi.fn(() => 9),
      shouldShowHitFeedback: vi.fn(() => false)
    },
    TfitSettingsScreen: {
      renderSettingsScreen: vi.fn()
    },
    TfitShadowMode: {
      renderShadowMode: vi.fn()
    }
  }, overrides);

  vi.useFakeTimers();
  vi.setSystemTime(10_000);

  delete require.cache[modulePath];
  return require('../../js/screen-router');
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

describe('TfitScreenRouter exports', () => {
  it('exposes screen routing helpers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'renderActiveMode',
      'renderAppFrame',
      'renderBackNavigation',
      'renderForegroundControls',
      'renderGameScreen',
      'renderMenuScreen',
      'renderRoundFeedback',
      'renderRoundScreen'
    ]);
    expect(globalThis.TfitScreenRouter).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      TfitCameraRuntime: { checkStartCondition: () => true, startPoseDetection: () => {}, stopPoseDetection: () => {} },
      TfitFightMode: { renderFightMode: () => {} },
      TfitFlow: { finishRound: () => {}, gameResultBool: () => false },
      TfitLayoutState: {
        snapshot: () => ({
          coef: 1,
          frameRate: 20,
          height: 480,
          levelWindowBase: 50,
          objectPoseSize: 48,
          width: 640
        })
      },
      TfitPadMode: { renderPadMode: () => {} },
      TfitRender: {
        drawMessagePanel: () => {},
        renderBackButton: () => {},
        renderFightButton: () => {},
        renderStopButton: () => {},
        renderGuardTargets: () => {},
        renderLoadingScreen: () => {},
        renderMainMenu: () => {},
        renderProfileScreen: () => {},
        renderRoundHud: () => {},
        renderSceneBackground: () => {},
        renderSpeech: () => {}
      },
      TfitRound: {
        guardFeedback: () => ({ guardWarningTime: 0, playSound: false, show: false }),
        initialRoundMoveState: () => ({}),
        isRoundExpired: () => false,
        keepTryingFeedback: () => ({ playSound: false, show: false }),
        remainingRoundSeconds: () => 0,
        scoreTotal: () => 0,
        shouldShowHitFeedback: () => false
      },
      TfitSettingsScreen: { renderSettingsScreen: () => {} },
      TfitShadowMode: { renderShadowMode: () => {} }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitScreenRouter.renderAppFrame).toBe('function');
  });
});

describe('app frame routing', () => {
  it('does not draw while the viewport is portrait', () => {
    const api = installGlobals({ innerHeight: 800, innerWidth: 400 });

    api.renderAppFrame();

    expect(calls.background).toEqual([]);
    expect(globalThis.TfitRender.renderSceneBackground).not.toHaveBeenCalled();
  });

  it('renders camera errors before the game screen', () => {
    const api = installGlobals({ error: 'permission denied' });

    api.renderAppFrame();

    expect(calls.background).toEqual([[0]]);
    expect(globalThis.TfitRender.drawMessagePanel).toHaveBeenCalledWith('Camera unavailable', 'permission denied');
    expect(globalThis.TfitRender.renderSceneBackground).not.toHaveBeenCalled();
  });

  it('renders loading until the camera start condition is met', () => {
    const api = installGlobals({
      TfitCameraRuntime: {
        checkStartCondition: vi.fn(() => false),
        startPoseDetection: vi.fn(),
        stopPoseDetection: vi.fn()
      }
    });

    api.renderAppFrame();

    expect(globalThis.TfitRender.renderLoadingScreen).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderSceneBackground).not.toHaveBeenCalled();
  });

  it('renders the game screen when the frame is ready', () => {
    const api = installGlobals();

    api.renderAppFrame();

    expect(calls.background).toEqual([]);
    expect(calls.clear).toEqual([[]]);
    expect(globalThis.TfitRender.renderSceneBackground).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderMainMenu).toHaveBeenCalledTimes(1);
  });

  it('clears and draws loading when camera has not started but there is no camera error', () => {
    const checkStartCondition = vi.fn(() => false);
    const api = installGlobals({
      error: '',
      TfitCameraRuntime: {
        checkStartCondition,
        startPoseDetection: vi.fn(),
        stopPoseDetection: vi.fn()
      }
    });

    api.renderAppFrame();

    expect(checkStartCondition).toHaveBeenCalledTimes(1);
    expect(calls.background).toEqual([[0]]);
    expect(globalThis.TfitRender.renderLoadingScreen).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.drawMessagePanel).not.toHaveBeenCalled();
  });

  it('renders normal layout when the camera is ready and no error is set', () => {
    const api = installGlobals({
      error: '',
      TfitCameraRuntime: {
        checkStartCondition: vi.fn(() => true),
        startPoseDetection: vi.fn(),
        stopPoseDetection: vi.fn()
      }
    });

    api.renderAppFrame();

    expect(globalThis.TfitRender.drawMessagePanel).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderLoadingScreen).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderSceneBackground).toHaveBeenCalledTimes(1);
  });

  it('treats an empty-length error object as no camera error', () => {
    const checkStartCondition = vi.fn(() => true);
    const api = installGlobals({
      error: { length: 0 },
      TfitCameraRuntime: {
        checkStartCondition,
        startPoseDetection: vi.fn(),
        stopPoseDetection: vi.fn()
      }
    });

    api.renderAppFrame();

    expect(checkStartCondition).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.drawMessagePanel).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderSceneBackground).toHaveBeenCalledTimes(1);
  });

  it('does not call start condition checks when camera error is present', () => {
    const checkStartCondition = vi.fn(() => {
      throw new Error('start condition should not run');
    });
    const api = installGlobals({
      error: 'camera offline',
      TfitCameraRuntime: {
        checkStartCondition,
        startPoseDetection: vi.fn(),
        stopPoseDetection: vi.fn()
      }
    });

    api.renderAppFrame();

    expect(checkStartCondition).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.drawMessagePanel).toHaveBeenCalledWith('Camera unavailable', 'camera offline');
  });

  it('renders the camera error overlay for non-empty errors', () => {
    const api = installGlobals({
      error: 'permission denied',
      innerWidth: 1024,
      innerHeight: 768
    });

    api.renderAppFrame();

    expect(calls.background).toEqual([[0]]);
    expect(globalThis.TfitRender.drawMessagePanel).toHaveBeenCalledWith('Camera unavailable', 'permission denied');
  });

  it('returns early and skips camera start check when errors are present', () => {
    const api = installGlobals();

    const checkStartCondition = vi.fn(() => { throw new Error('should not be called'); });
    globalThis.TfitCameraRuntime.checkStartCondition = checkStartCondition;
    globalThis.error = 'camera offline';

    api.renderAppFrame();

    expect(checkStartCondition).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.drawMessagePanel).toHaveBeenCalledWith('Camera unavailable', 'camera offline');
  });

  it('falls back to black canvas clearing when transparent clear is unavailable', () => {
    const api = installGlobals({ clear: undefined });

    api.renderAppFrame();

    expect(calls.background).toEqual([[0]]);
    expect(globalThis.TfitRender.renderSceneBackground).toHaveBeenCalledTimes(1);
  });
});

describe('menu routing', () => {
  it('renders the main menu and resets the result timer', () => {
    const api = installGlobals();

    api.renderGameScreen();

    expect(globalThis.TfitRender.renderSceneBackground).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitCameraRuntime.stopPoseDetection).toHaveBeenCalledTimes(1);
    expect(globalThis.timingState.gameResult).toBe(4999);
    expect(globalThis.TfitRender.renderMainMenu).toHaveBeenCalledTimes(1);
  });

  it('renders settings and back navigation for the settings menu', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 1 })
    });

    api.renderGameScreen();

    expect(globalThis.TfitRender.renderBackButton).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitSettingsScreen.renderSettingsScreen).toHaveBeenCalledTimes(1);
  });

  it('animates the menu door and applies the pending transition during the close phase', () => {
    const api = installGlobals({
      TfitAppInputActions: {
        applyPendingMenuButtonTransition: vi.fn(() => {
          globalThis.gameState.menu = 4;
        })
      },
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_fight',
          duration: 20,
          holdFrames: 2,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 4,
            clearCurMoves: true,
            loadSongmoves: true,
            resetOpponent: true
          }
        }
      }
    });

    for (let frame = 0; frame < 23; frame++) {
      api.renderGameScreen();
    }

    expect(globalThis.TfitAppInputActions.applyPendingMenuButtonTransition).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorClose.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorOpen.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorClose.rate).toHaveBeenCalledWith(0.8);
    expect(globalThis.sounds.doorOpen.rate).toHaveBeenCalledWith(0.8);
    expect(globalThis.gameState.menu).toBe(4);
    expect(globalThis.gameState.menuButtonAnimation.active).toBe(false);
  });

  it('plays close and open door sounds while the pending transition stays queued', () => {
    const transition = {
      menu: 4,
      clearCurMoves: true,
      loadSongmoves: true,
      resetOpponent: true
    };
    const api = installGlobals({
      TfitAppInputActions: {
        applyPendingMenuButtonTransition: vi.fn(() => {
          globalThis.gameState.menu = 4;
        })
      },
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_fight',
          duration: 4,
          holdFrames: 0,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: transition
        }
      }
    });

    for (let frame = 0; frame < 5; frame++) {
      api.renderGameScreen();
    }

    expect(globalThis.sounds.doorClose.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorOpen.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorClose.rate).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorOpen.rate).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitAppInputActions.applyPendingMenuButtonTransition).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState.menu).toBe(4);
  });

  it('plays door sounds when rate handlers are absent', () => {
    const transition = {
      menu: 4,
      clearCurMoves: true,
      loadSongmoves: true,
      resetOpponent: true
    };
    const api = installGlobals({
      TfitAppInputActions: {
        applyPendingMenuButtonTransition: vi.fn(() => {
          globalThis.gameState.menu = 4;
        })
      },
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_fight',
          duration: 4,
          holdFrames: 0,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: transition
        }
      },
      sounds: {
        keepTrying: { play: vi.fn() },
        yourGuard: { play: vi.fn() },
        doorClose: { play: vi.fn() },
        doorOpen: { play: vi.fn() }
      }
    });

    for (let frame = 0; frame < 5; frame++) {
      api.renderGameScreen();
    }

    expect(globalThis.sounds.doorClose.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorOpen.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.doorClose.rate).toBeUndefined();
    expect(globalThis.sounds.doorOpen.rate).toBeUndefined();
    expect(globalThis.TfitAppInputActions.applyPendingMenuButtonTransition).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState.menu).toBe(4);
  });

  it('uses the default door animation duration when none is configured', () => {
    const api = installGlobals({
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_shadow',
          holdFrames: 0,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 2,
            clearCurMoves: true,
            loadSongmoves: true
          }
        }
      }
    });

    api.renderGameScreen();

    expect(globalThis.gameState.menuButtonAnimation.frame).toBe(1);
    expect(globalThis.gameState.menuButtonAnimation.progress).toBeCloseTo(1 / 9);
  });

  it('keeps door animation queued when the close phase is not ready to transition', () => {
    const api = installGlobals({
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_shadow',
          duration: 20,
          holdFrames: 2,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 2,
            clearCurMoves: true,
            loadSongmoves: true
          }
        }
      }
    });

    api.renderGameScreen();

    expect(globalThis.TfitAppInputActions.applyPendingMenuButtonTransition).not.toHaveBeenCalled();
    expect(globalThis.gameState.menu).toBe(0);
  });

  it('renders split logo halves when menu logo asset exists', () => {
    const logo = { name: 'app-logo', width: 240, height: 120 };
    const api = installGlobals({
      images: {
        goodHit: { name: 'good-hit' },
        keepTrying: { name: 'keep-trying' },
        stopButton: { name: 'stop' },
        yourGuard: { name: 'guard' },
        logo
      },
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_shadow',
          duration: 20,
          holdFrames: 2,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 2,
            clearCurMoves: true,
            loadSongmoves: true
          }
        }
      }
    });

    api.renderGameScreen();

    expect(calls.image).toHaveLength(2);
    expect(calls.image[0][0]).toBe(logo);
    expect(calls.image[1][0]).toBe(logo);
    expect(calls.image[0][5]).toBe(0);
    expect(calls.image[1][5]).toBe(120);
  });

  it('does not render split logo when no logo asset is available', () => {
    const api = installGlobals({
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_shadow',
          duration: 20,
          holdFrames: 2,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 2,
            clearCurMoves: true,
            loadSongmoves: true
          }
        }
      }
    });

    api.renderGameScreen();

    expect(calls.image).toHaveLength(0);
  });

  it('does not render split logo when logo width is missing', () => {
    const api = installGlobals({
      images: {
        goodHit: { name: 'good-hit' },
        keepTrying: { name: 'keep-trying' },
        stopButton: { name: 'stop' },
        yourGuard: { name: 'guard' },
        logo: { name: 'app-logo', height: 120 }
      },
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_shadow',
          duration: 20,
          holdFrames: 2,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 2,
            clearCurMoves: true,
            loadSongmoves: true
          }
        }
      }
    });

    api.renderGameScreen();

    expect(calls.image).toHaveLength(0);
  });

  it('does not render split logo when logo height is missing', () => {
    const api = installGlobals({
      images: {
        goodHit: { name: 'good-hit' },
        keepTrying: { name: 'keep-trying' },
        stopButton: { name: 'stop' },
        yourGuard: { name: 'guard' },
        logo: { name: 'app-logo', width: 240 }
      },
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_shadow',
          duration: 20,
          holdFrames: 2,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 2,
            clearCurMoves: true,
            loadSongmoves: true
          }
        }
      }
    });

    api.renderGameScreen();

    expect(calls.image).toHaveLength(0);
  });

  it('does not render split logo when logo dimensions produce non-positive computed size', () => {
    const logo = { name: 'app-logo', width: 240, height: -120 };
    const api = installGlobals({
      images: {
        goodHit: { name: 'good-hit' },
        keepTrying: { name: 'keep-trying' },
        stopButton: { name: 'stop' },
        yourGuard: { name: 'guard' },
        logo
      },
      gameState: {
        ...defaultGameState({ menu: 0 }),
        menuButtonAnimation: {
          active: true,
          button: 'open_shadow',
          duration: 20,
          holdFrames: 2,
          frame: 0,
          x: 0,
          y: 0,
          width: 640,
          height: 480,
          progress: 0,
          pendingTransition: {
            menu: 2,
            clearCurMoves: true,
            loadSongmoves: true
          }
        }
      }
    });

    api.renderGameScreen();

    expect(calls.image).toHaveLength(0);
    expect(globalThis.gameState.menu).toBe(0);
  });

  it('does not enter round rendering when menu is not above submenu level', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 1 })
    });

    api.renderGameScreen();

    expect(globalThis.TfitRender.renderGuardTargets).not.toHaveBeenCalled();
    expect(globalThis.TfitPadMode.renderPadMode).not.toHaveBeenCalled();
    expect(globalThis.TfitFightMode.renderFightMode).not.toHaveBeenCalled();
    expect(globalThis.TfitShadowMode.renderShadowMode).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderRoundHud).not.toHaveBeenCalled();
  });

  it('renders round content when menu is a gameplay menu in renderGameScreen', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 4 })
    });

    api.renderGameScreen();

    expect(globalThis.TfitRender.renderGuardTargets).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitFightMode.renderFightMode).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderFightButton).toHaveBeenCalledTimes(2);
    expect(globalThis.TfitRender.renderRoundHud).toHaveBeenCalledWith(0);
  });

  it('shows camera error screen when error text is set', () => {
    const api = installGlobals({
      error: 'permission denied'
    });

    api.renderAppFrame();

    expect(globalThis.TfitRender.drawMessagePanel).toHaveBeenCalledWith('Camera unavailable', 'permission denied');
    expect(globalThis.TfitRender.renderLoadingScreen).not.toHaveBeenCalled();
  });

  it('does not render back navigation while showing game results', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 2 }),
      TfitFlow: {
        finishRound: vi.fn(),
        gameResultBool: vi.fn(() => true)
      }
    });

    api.renderBackNavigation();

    expect(globalThis.TfitRender.renderBackButton).not.toHaveBeenCalled();
  });

  it('routes the active mode renderer', () => {
    const api = installGlobals({ gameState: defaultGameState({ menu: 4 }) });
    api.renderActiveMode();
    expect(globalThis.TfitFightMode.renderFightMode).toHaveBeenCalledTimes(1);

    globalThis.gameState.menu = 3;
    api.renderActiveMode();
    expect(globalThis.TfitPadMode.renderPadMode).toHaveBeenCalledTimes(1);

    globalThis.gameState.menu = 2;
    api.renderActiveMode();
    expect(globalThis.TfitShadowMode.renderShadowMode).toHaveBeenCalledTimes(1);
  });

  it('does not route an active gameplay mode from non-gameplay menus', () => {
    const api = installGlobals({ gameState: defaultGameState({ menu: 1 }) });

    api.renderActiveMode();

    expect(globalThis.TfitFightMode.renderFightMode).not.toHaveBeenCalled();
    expect(globalThis.TfitPadMode.renderPadMode).not.toHaveBeenCalled();
    expect(globalThis.TfitShadowMode.renderShadowMode).not.toHaveBeenCalled();
  });

  it('renders round content and mode from the game screen', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 2 })
    });

    api.renderGameScreen();

    expect(globalThis.TfitRender.renderGuardTargets).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitShadowMode.renderShadowMode).toHaveBeenCalledTimes(1);
  });

  it('invokes renderRoundScreen for gameplay submenus', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 3 })
    });
    const roundHudSpy = vi.spyOn(globalThis.TfitRender, 'renderRoundHud');
    const guardTargetsSpy = vi.spyOn(globalThis.TfitRender, 'renderGuardTargets');
    const fightButtonSpy = vi.spyOn(globalThis.TfitRender, 'renderFightButton');

    api.renderGameScreen();

    expect(guardTargetsSpy).toHaveBeenCalledTimes(1);
    expect(roundHudSpy).toHaveBeenCalledWith(0);
    expect(fightButtonSpy).toHaveBeenCalledTimes(1);
  });

  it('renders the profile screen without round content', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 5 })
    });

    api.renderGameScreen();

    expect(globalThis.TfitRender.renderBackButton).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderProfileScreen).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderGuardTargets).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderRoundHud).not.toHaveBeenCalled();
  });

  it('does not render settings or profile screens from the main menu', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 0 })
    });

    api.renderGameScreen();

    expect(globalThis.TfitSettingsScreen.renderSettingsScreen).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderProfileScreen).not.toHaveBeenCalled();
  });
});

describe('round routing', () => {
  it('renders a ready round before it has started', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 2 })
    });

    api.renderRoundScreen();

    expect(globalThis.TfitRender.renderGuardTargets).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderFightButton).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderRoundHud).toHaveBeenCalledWith(0);
    expect(globalThis.TfitCameraRuntime.stopPoseDetection).toHaveBeenCalledTimes(1);
  });

  it('finishes expired rounds', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameOver: false, menu: 2 }),
      TfitRound: {
        ...globalThis.TfitRound,
        isRoundExpired: vi.fn(() => true)
      }
    });

    api.renderRoundScreen();

    expect(globalThis.gameState.gameOver).toBe(true);
    expect(globalThis.TfitFlow.finishRound).toHaveBeenCalledTimes(1);
  });

  it('keeps camera detection alive during fight timeout round restarts', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        gameOver: false,
        gameStarted: true,
        manualStop: false,
        menu: 4
      }),
      TfitRound: {
        ...globalThis.TfitRound,
        isRoundExpired: vi.fn(() => true)
      },
      TfitFlow: {
        finishRound: vi.fn(() => {
          globalThis.gameState.gameStarted = false;
          globalThis.gameState.fightTransitionActive = true;
        }),
        gameResultBool: vi.fn(() => false)
      }
    });

    api.renderRoundScreen();

    expect(globalThis.gameState.gameOver).toBe(true);
    expect(globalThis.TfitCameraRuntime.stopPoseDetection).not.toHaveBeenCalled();
    expect(globalThis.TfitFlow.finishRound).toHaveBeenCalledTimes(1);
  });

  it('keeps camera detection alive while advancing to the next fight stage', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightEnding: true,
        gameOver: true,
        gameStarted: false,
        menu: 4,
        my_opponent: { stamina: 0 },
        opponent: 0
      })
    });

    api.renderRoundScreen();

    expect(globalThis.TfitCameraRuntime.stopPoseDetection).not.toHaveBeenCalled();
    expect(globalThis.TfitFlow.finishRound).toHaveBeenCalledTimes(1);
  });

  it('keeps camera detection alive before the hard final fight stage', () => {
    const api = installGlobals({
      OPPONENTS: {
        0: { stamina: 6 },
        1: { stamina: 8 },
        2: { stamina: 10 },
        3: { stamina: 12 }
      },
      gameState: defaultGameState({
        fightEnding: true,
        gameOver: true,
        gameStarted: false,
        level: 2,
        menu: 4,
        my_opponent: { stamina: 0 },
        opponent: 2
      })
    });

    api.renderRoundScreen();

    expect(globalThis.TfitCameraRuntime.stopPoseDetection).not.toHaveBeenCalled();
    expect(globalThis.TfitFlow.finishRound).toHaveBeenCalledTimes(1);
  });

  it('does not keep fight continuation alive after the easy final opponent', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightEnding: true,
        gameOver: true,
        gameStarted: false,
        level: 0,
        menu: 4,
        my_opponent: { stamina: 0 },
        opponent: 1
      })
    });

    api.renderRoundScreen();

    expect(globalThis.TfitCameraRuntime.stopPoseDetection).toHaveBeenCalled();
    expect(globalThis.TfitFlow.finishRound).toHaveBeenCalledTimes(1);
  });

  it('starts detection and renders active round feedback', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameStarted: true, gameTimer: 0, menu: 2 }),
      speechString: 'go',
      TfitRound: {
        guardFeedback: vi.fn(() => ({
          guardWarningTime: 456,
          playSound: true,
          show: true
        })),
        initialRoundMoveState: vi.fn(() => ({
          arrayScore: [{ score: 0 }],
          curMoves: [{ name: 'hook', hit: false }],
          gameTimerNext: 8
        })),
        isRoundExpired: vi.fn(() => false),
        keepTryingFeedback: vi.fn(() => ({
          playSound: true,
          show: true
        })),
        remainingRoundSeconds: vi.fn(() => 6),
        scoreTotal: vi.fn(() => 11),
        shouldShowHitFeedback: vi.fn(() => true)
      }
    });

    api.renderRoundScreen();

    expect(globalThis.TfitRender.renderSpeech).toHaveBeenCalledTimes(1);
    expect(globalThis.speechString).toBeNull();
    expect(globalThis.TfitCameraRuntime.startPoseDetection).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderRoundHud).toHaveBeenCalledWith(11);
    expect(globalThis.gameState.gameTimerNext).toBe(8);
    expect(globalThis.timingState.guardWarning).toBe(456);
    expect(globalThis.sounds.keepTrying.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.yourGuard.play).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderStopButton).toHaveBeenCalledTimes(1);
    expect(calls.text).toEqual(expect.arrayContaining([
      ["GOOD HIT", expect.any(Number), expect.any(Number)],
      ["KEEP TRYING", expect.any(Number), expect.any(Number)],
      ["YOUR GUARD", expect.any(Number), expect.any(Number)]
    ]));
  });

  it('uses the custom hit success feedback text when provided', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameStarted: true, gameTimer: 2, menu: 4 }),
      timingState: {
        gameResult: 0,
        guardWarning: 0,
        hitSuccess: 9999,
        hitSuccessText: 'NICE DODGE',
        leftPoses: 0,
        rightPoses: 0
      },
      TfitRound: {
        guardFeedback: vi.fn(() => ({
          guardWarningTime: 123,
          playSound: false,
          show: false
        })),
        initialRoundMoveState: vi.fn(() => ({
          arrayScore: [],
          curMoves: [],
          gameTimerNext: 0
        })),
        isRoundExpired: vi.fn(() => false),
        keepTryingFeedback: vi.fn(() => ({
          playSound: false,
          show: false
        })),
        remainingRoundSeconds: vi.fn(() => 12),
        scoreTotal: vi.fn(() => 0),
        shouldShowHitFeedback: vi.fn(() => true)
      }
    });

    api.renderRoundFeedback();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['NICE DODGE', expect.any(Number), expect.any(Number)]
    ]));
    expect(calls.text.some(([message]) => message === 'GOOD HIT')).toBe(false);
  });

  it('shows the fight round announcement while no fresh hit feedback is active', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameStarted: true, gameTimer: 2, menu: 4 }),
      timingState: {
        gameResult: 0,
        guardWarning: 0,
        hitSuccess: 0,
        hitSuccessText: 'GOOD HIT',
        leftPoses: 0,
        rightPoses: 0,
        roundAnnouncementNextText: 'ROUND 1',
        roundAnnouncementText: 'STAGE 1',
        roundAnnouncementTime: 9000
      },
      TfitRound: {
        guardFeedback: vi.fn(() => ({
          guardWarningTime: 123,
          playSound: false,
          show: false
        })),
        keepTryingFeedback: vi.fn(() => ({
          playSound: false,
          show: false
        })),
        remainingRoundSeconds: vi.fn(() => 12),
        shouldShowHitFeedback: vi.fn(() => false)
      }
    });

    api.renderRoundFeedback();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['STAGE 1', expect.any(Number), expect.any(Number)]
    ]));
    expect(calls.text.some(([message]) => message === 'GOOD HIT')).toBe(false);
  });

  it('shows the fight round announcement second phase after the stage phase', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameStarted: true, gameTimer: 2, menu: 4 }),
      timingState: {
        gameResult: 0,
        guardWarning: 0,
        hitSuccess: 0,
        leftPoses: 0,
        rightPoses: 0,
        roundAnnouncementNextText: 'ROUND 1',
        roundAnnouncementText: 'STAGE 1',
        roundAnnouncementTime: 8000
      },
      TfitRound: {
        guardFeedback: vi.fn(() => ({
          guardWarningTime: 123,
          playSound: false,
          show: false
        })),
        keepTryingFeedback: vi.fn(() => ({
          playSound: false,
          show: false
        })),
        remainingRoundSeconds: vi.fn(() => 12),
        shouldShowHitFeedback: vi.fn(() => false)
      }
    });

    api.renderRoundFeedback();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['ROUND 1', expect.any(Number), expect.any(Number)]
    ]));
    expect(calls.text.some(([message]) => message === 'STAGE 1')).toBe(false);
  });

  it('shows fresh hit feedback immediately over the fight round announcement', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameStarted: true, gameTimer: 2, menu: 4 }),
      timingState: {
        gameResult: 0,
        guardWarning: 0,
        hitSuccess: 9999,
        hitSuccessText: 'GOOD HIT',
        leftPoses: 0,
        rightPoses: 0,
        roundAnnouncementNextText: 'ROUND 1',
        roundAnnouncementText: 'STAGE 1',
        roundAnnouncementTime: 9000
      },
      TfitRound: {
        guardFeedback: vi.fn(() => ({
          guardWarningTime: 123,
          playSound: false,
          show: false
        })),
        keepTryingFeedback: vi.fn(() => ({
          playSound: false,
          show: false
        })),
        remainingRoundSeconds: vi.fn(() => 12),
        shouldShowHitFeedback: vi.fn(() => true)
      }
    });

    api.renderRoundFeedback();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['GOOD HIT', expect.any(Number), expect.any(Number)]
    ]));
    expect(calls.text.some(([message]) => message === 'STAGE 1')).toBe(false);
  });

  it('shows fight result feedback before transient round feedback', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameStarted: true, gameTimer: 2, menu: 4 }),
      timingState: {
        gameResult: 0,
        guardWarning: 0,
        fightResultText: 'YOU WIN',
        hitSuccess: 9999,
        hitSuccessText: 'GOOD HIT',
        leftPoses: 0,
        rightPoses: 0
      },
      TfitRound: {
        guardFeedback: vi.fn(() => ({
          guardWarningTime: 123,
          playSound: false,
          show: false
        })),
        initialRoundMoveState: vi.fn(() => ({
          arrayScore: [],
          curMoves: [],
          gameTimerNext: 0
        })),
        isRoundExpired: vi.fn(() => false),
        keepTryingFeedback: vi.fn(() => ({
          playSound: false,
          show: false
        })),
        remainingRoundSeconds: vi.fn(() => 12),
        scoreTotal: vi.fn(() => 0),
        shouldShowHitFeedback: vi.fn(() => true)
      }
    });

    api.renderRoundFeedback();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['YOU WIN', expect.any(Number), expect.any(Number)]
    ]));
    expect(calls.text.some(([message]) => message === 'GOOD HIT')).toBe(false);
  });

  it('keeps showing a fight win during the first second of opponent transition', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightTransitionActive: true,
        fightTransitionText: 'NEXT: THEO',
        gameStarted: false,
        menu: 4
      }),
      timingState: {
        fightResultText: 'YOU WIN',
        fightTransitionTime: 9500,
        gameResult: 0,
        guardWarning: 0,
        hitSuccess: 0,
        leftPoses: 0,
        rightPoses: 0
      }
    });

    api.renderRoundFeedback();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['YOU WIN', expect.any(Number), expect.any(Number)]
    ]));
    expect(calls.text.some(([message]) => message === 'NEXT: THEO')).toBe(false);
  });

  it('shows the next opponent transition after the win hold', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightTransitionActive: true,
        fightTransitionText: 'NEXT: THEO',
        gameStarted: false,
        menu: 4
      }),
      timingState: {
        fightResultText: 'YOU WIN',
        fightTransitionTime: 8500,
        gameResult: 0,
        guardWarning: 0,
        hitSuccess: 0,
        leftPoses: 0,
        rightPoses: 0
      }
    });

    api.renderRoundFeedback();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['NEXT: THEO', expect.any(Number), expect.any(Number)]
    ]));
    expect(calls.text.some(([message]) => message === 'YOU WIN')).toBe(false);
  });

  it('renders fight transition feedback instead of the idle fight button', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightTransitionActive: true,
        fightTransitionText: 'NEXT: THEO',
        gameStarted: false,
        menu: 4
      }),
      timingState: {
        fightResultText: 'YOU WIN',
        fightTransitionTime: 8500,
        gameResult: 0,
        guardWarning: 0,
        hitSuccess: 0,
        leftPoses: 0,
        rightPoses: 0
      }
    });

    api.renderRoundScreen();

    expect(globalThis.TfitRender.renderFightButton).not.toHaveBeenCalled();
    expect(calls.text).toEqual(expect.arrayContaining([
      ['NEXT: THEO', expect.any(Number), expect.any(Number)]
    ]));
  });

  it('renders a fight victory celebration after the final ladder win', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightVictoryCelebrationActive: true,
        fightVictoryCelebrationTime: 9000,
        gameStarted: false,
        menu: 4
      }),
      TfitFlow: {
        finishRound: vi.fn(),
        gameResultBool: vi.fn(() => true)
      }
    });

    api.renderGameScreen();

    expect(calls.text).toEqual(expect.arrayContaining([
      ['CHAMPION', expect.any(Number), expect.any(Number)]
    ]));
    expect(globalThis.TfitFightMode.renderFightMode).not.toHaveBeenCalled();
    expect(globalThis.TfitRender.renderFightButton).not.toHaveBeenCalled();
  });

  it('renders fight mode again after the victory celebration expires', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightVictoryCelebrationActive: true,
        gameStarted: false,
        menu: 4
      }),
      TfitFlow: {
        finishRound: vi.fn(),
        gameResultBool: vi.fn(() => false)
      }
    });

    api.renderActiveMode();

    expect(globalThis.TfitFightMode.renderFightMode).toHaveBeenCalledTimes(1);
  });

  it('hides foreground fight button during opponent transitions', () => {
    const api = installGlobals({
      gameState: defaultGameState({
        fightTransitionActive: true,
        fightTransitionText: 'NEXT: THEO',
        gameStarted: false,
        menu: 4
      })
    });

    api.renderForegroundControls();

    expect(globalThis.TfitRender.renderFightButton).not.toHaveBeenCalled();
  });

  it('keeps quiet when round feedback helpers do not request UI or sounds', () => {
    const api = installGlobals({
      gameState: defaultGameState({ gameStarted: true, gameTimer: 2, menu: 2 })
    });

    api.renderRoundFeedback();

    expect(globalThis.TfitRound.shouldShowHitFeedback).toHaveBeenCalledWith({
      hitSuccessTime: 0,
      now: 10_000
    });
    expect(globalThis.TfitRound.keepTryingFeedback).toHaveBeenCalledWith(expect.objectContaining({
      remainingSeconds: 12
    }));
    expect(globalThis.timingState.guardWarning).toBe(123);
    expect(globalThis.sounds.keepTrying.play).not.toHaveBeenCalled();
    expect(globalThis.sounds.yourGuard.play).not.toHaveBeenCalled();
    expect(calls.text).toEqual([]);
  });

  it('can show keep-trying feedback without replaying the sound', () => {
    const api = installGlobals({
      TfitRound: {
        guardFeedback: vi.fn(() => ({
          guardWarningTime: 123,
          playSound: false,
          show: false
        })),
        initialRoundMoveState: vi.fn(() => ({
          arrayScore: [{ score: 0 }],
          curMoves: [{ name: 'jab', hit: false }],
          gameTimerNext: 7
        })),
        isRoundExpired: vi.fn(() => false),
        keepTryingFeedback: vi.fn(() => ({
          playSound: false,
          show: true
        })),
        remainingRoundSeconds: vi.fn(() => 12),
        scoreTotal: vi.fn(() => 9),
        shouldShowHitFeedback: vi.fn(() => false)
      }
    });

    api.renderRoundFeedback();

    expect(calls.text.some(([msg]) => msg === "KEEP TRYING")).toBe(true);
    expect(globalThis.sounds.keepTrying.play).not.toHaveBeenCalled();
  });
});
