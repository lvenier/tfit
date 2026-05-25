import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/screen-router');

const STUBBED_GLOBALS = [
  'background',
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
  'sounds',
  'speechString',
  'textSize',
  'timingState',
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

  for (const name of ['background', 'fill', 'image', 'textSize']) {
    calls[name] = [];
    globalThis[name] = record(name);
  }

  Object.assign(globalThis, {
    coef: 1,
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
    sounds: {
      keepTrying: { play: vi.fn() },
      yourGuard: { play: vi.fn() }
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
      renderGuardTargets: vi.fn(),
      renderLoadingScreen: vi.fn(),
      renderMainMenu: vi.fn(),
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
        renderGuardTargets: () => {},
        renderLoadingScreen: () => {},
        renderMainMenu: () => {},
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

    expect(calls.background).toEqual([[0]]);
    expect(globalThis.TfitRender.renderSceneBackground).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderMainMenu).toHaveBeenCalledTimes(1);
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

  it('renders round content and mode from the game screen', () => {
    const api = installGlobals({
      gameState: defaultGameState({ menu: 2 })
    });

    api.renderGameScreen();

    expect(globalThis.TfitRender.renderGuardTargets).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitShadowMode.renderShadowMode).toHaveBeenCalledTimes(1);
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
    expect(calls.image).toEqual([
      [globalThis.images.stopButton, 530, 420, 100, 50],
      [globalThis.images.goodHit, 200, 96, 240],
      [globalThis.images.keepTrying, 200, 96, 240],
      [globalThis.images.yourGuard, 200, 96, 240]
    ]);
  });
});
