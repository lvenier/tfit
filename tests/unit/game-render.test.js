import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const renderApi = require('../../js/game-render');
const { moveDisplay } = require('../../js/game-logic');

const STUBBED_GLOBALS = [
  'arc',
  'images',
  'BOLD',
  'calibrationState',
  'CENTER',
  'circle',
  'coef',
  'cos',
  'document',
  'ellipse',
  'errorTimer',
  'fill',
  'FRAME_RATE',
  'gameState',
  'hide_sensor',
  'image',
  'LEFT',
  'loading_k',
  'loading_m',
  'map',
  'myWindowHeight',
  'myWindowWidth',
  'MOVE_TYPE',
  'noFill',
  'NORMAL',
  'noStroke',
  'OBJECT_POSE_SIZE',
  'OPPONENTS',
  'PI',
  'pop',
  'push',
  'quad',
  'radians',
  'rect',
  'rectMode',
  'resetMatrix',
  'RIGHT',
  'SHADOW_SPECIFIC',
  'sin',
  'speechString',
  'stroke',
  'strokeWeight',
  'text',
  'textAlign',
  'textSize',
  'textStyle',
  'tint',
  'TfitGameLogic',
  'TfitLayoutState',
  'translate',
  'width',
  'height'
];

const originalGlobals = new Map();
const calls = {};

function asset(name) {
  return { name };
}

function record(name) {
  return (...args) => {
    calls[name].push(args);
  };
}

function defaultGameState() {
  return {
    arrayScore: [],
    curMoves: [],
    feet_position: 0,
    gameCurrentSeries: 1,
    gameDuration: 600,
    gameLengthIndex: 2,
    gameSeries: 3,
    gameTimer: 19,
    level: 1,
    menu: 2,
    my_opponent: { stamina: 4 },
    opponent: 0,
    score: 0,
    score_max: 10,
    score_max_prev: 8,
    shadow_focus: 1,
    song_result: {}
  };
}

function installRenderGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  for (const name of [
    'arc',
    'circle',
    'ellipse',
    'fill',
    'image',
    'noFill',
    'noStroke',
    'pop',
    'push',
    'quad',
    'rect',
    'rectMode',
    'resetMatrix',
    'stroke',
    'strokeWeight',
    'text',
    'textAlign',
    'textSize',
    'textStyle',
    'tint',
    'translate'
  ]) {
    calls[name] = [];
    globalThis[name] = record(name);
  }

  const {
    gameState: gameStateOverrides = {},
    ...globalOverrides
  } = overrides;

  Object.assign(globalThis, {
    BOLD: 'bold',
    calibrationState: {
      init_jab_y: 100,
      init_uppercut_y: 300,
      left_init_hook_x: 120,
      left_init_pose_x: 200,
      left_init_pose_y: 160,
      right_init_hook_x: 520,
      right_init_pose_x: 440,
      right_init_pose_y: 160
    },
    CENTER: 'center',
    coef: 1,
    cos: Math.cos,
    document: {
      body: {
        style: {
          setProperty: vi.fn()
        }
      }
    },
    errorTimer: 0,
    FRAME_RATE: 20,
    gameState: {
      ...defaultGameState(),
      ...gameStateOverrides
    },
    height: 480,
    hide_sensor: 128,
    images: {
      backButton: asset('back'),
      backgrounds: [asset('bg0'), asset('bg1'), asset('bg2')],
      calibrateButton: asset('calibrate'),
      configMenuButton: asset('config'),
      durationButtons: { 2: asset('duration60') },
      fightButton: asset('fight'),
      fightMenuButton: asset('fight-menu'),
      framerateButtons: { 1: asset('fr20') },
      leftFoot: asset('left-foot'),
      levelButtons: { 1: asset('medium') },
      logo: asset('logo'),
      menu: asset('menu'),
      padButton: asset('pad'),
      rightFoot: asset('right-foot'),
      seriesButtons: { 3: asset('series3') },
      shadowButton: asset('shadow')
    },
    LEFT: 'left',
    loading_k: 0,
    loading_m: 0,
    map: (value, start1, stop1, start2, stop2) => start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2),
    myWindowHeight: 480,
    myWindowWidth: 640,
    NORMAL: 'normal',
    OBJECT_POSE_SIZE: 48,
    OPPONENTS: { 0: { stamina: 6 } },
    PI: Math.PI,
    radians: degrees => degrees * Math.PI / 180,
    RIGHT: 'right',
    SHADOW_SPECIFIC: { 1: 'JAB' },
    MOVE_TYPE: {
      1: 'LEFT_JAB',
      2: 'RIGHT_JAB',
      3: 'LEFT_HOOK',
      4: 'RIGHT_HOOK',
      5: 'LEFT_UPPERCUT',
      6: 'RIGHT_UPPERCUT',
      7: 'LEFT_DODGE',
      8: 'RIGHT_DODGE',
      9: 'DOWN_DODGE',
      10: 'SWITCH_GUARD'
    },
    sin: Math.sin,
    speechString: 'keep guard',
    TfitGameLogic: {
      detectStartCountdown: vi.fn(globalThis.TfitGameLogic.detectStartCountdown),
      moveDisplay: vi.fn(moveDisplay)
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
    width: 640
  }, globalOverrides);
}

beforeEach(() => {
  installRenderGlobals();
});

afterEach(() => {
  vi.restoreAllMocks();
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

describe('TfitRender exports', () => {
  it('exposes render helpers for app.js', () => {
    expect(Object.keys(renderApi).sort()).toEqual([
      'drawDetectionProgress',
      'drawMessagePanel',
      'renderBackButton',
      'renderCalibrationOverlay',
      'renderFeetIndicator',
      'renderFightButton',
      'renderFightMeters',
      'renderGuardTargets',
      'renderLoadingScreen',
      'renderMainMenu',
      'renderMoveShape',
      'renderRoundHud',
      'renderSceneBackground',
      'renderSettingsControls',
      'renderShadowMoveReport',
      'renderShadowResult',
      'renderSpeech',
      'syncPageBackground'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(Object.keys(sandbox.TfitRender).sort()).toEqual(Object.keys(renderApi).sort());
  });
});

describe('basic render helpers', () => {
  it('draws a centered message panel', () => {
    renderApi.drawMessagePanel('Camera unavailable', 'No camera');

    expect(calls.push).toHaveLength(1);
    expect(calls.rect).toContainEqual([320, 240, 340, 108, 8]);
    expect(calls.text).toContainEqual(['Camera unavailable', 320, 222]);
    expect(calls.text).toContainEqual(['No camera', 320, 258]);
    expect(calls.pop).toHaveLength(1);
  });

  it('renders and advances the loading animation', () => {
    renderApi.renderLoadingScreen();

    expect(calls.image[0]).toEqual([asset('logo'), 270, 50, 100, 100]);
    expect(calls.translate).toEqual([[320, 240]]);
    expect(calls.ellipse).toHaveLength(3);
    expect(globalThis.loading_k).toBe(4);
    expect(globalThis.loading_m).toBe(0);
    expect(calls.text).toContainEqual(['Detecting your guard', 320, 222]);
    expect(calls.text).toContainEqual(['Stand in frame with both hands visible - 8s left', 320, 258]);
    expect(calls.text).toContainEqual(['8s left', 320, 304]);
    expect(calls.rect).toContainEqual([320, 286, 260, 8, 8]);
  });

  it('renders the hand detection countdown with elapsed progress', () => {
    installRenderGlobals({ errorTimer: 250 });

    renderApi.renderLoadingScreen();

    expect(calls.text).toContainEqual(['Stand in frame with both hands visible - 4s left', 320, 258]);
    expect(calls.text).toContainEqual(['4s left', 320, 304]);
    expect(calls.rect).toContainEqual([255, 286, 130, 8, 8]);
  });

  it('wraps the loading animation counters when they exceed their bounds', () => {
    installRenderGlobals({ loading_k: 360, loading_m: 360 });

    renderApi.renderLoadingScreen();

    expect(globalThis.loading_k).toBe(0);
    expect(globalThis.loading_m).toBe(0);
  });

  it('advances and wraps the secondary loading animation counter', () => {
    installRenderGlobals({ loading_k: 92, loading_m: 352 });

    renderApi.renderLoadingScreen();

    expect(globalThis.loading_k).toBe(96);
    expect(globalThis.loading_m).toBe(360);

    installRenderGlobals({ loading_k: 92, loading_m: 360 });

    renderApi.renderLoadingScreen();

    expect(globalThis.loading_k).toBe(96);
    expect(globalThis.loading_m).toBe(0);
  });

  it('renders the scene background and main menu assets', () => {
    renderApi.renderSceneBackground();
    renderApi.renderMainMenu();

    expect(calls.tint).toEqual([]);
    expect(calls.image).not.toContainEqual([asset('bg2'), 0, 0, 640, 480]);
    expect(globalThis.document.body.style.setProperty).toHaveBeenCalledWith(
      '--app-background-image',
      'url("assets/backgrounds/2.jpg")'
    );
    expect(calls.image).toContainEqual([asset('shadow'), 640 / 6 + 20, 80, 100, 50]);
    expect(calls.image).toContainEqual([asset('config'), 640 / 6 + 20, 380, 100, 50]);
  });

  it('skips page background sync outside a document context', () => {
    installRenderGlobals({ document: undefined });

    expect(renderApi.syncPageBackground()).toBe(false);
  });

  it('renders menu and settings buttons at their app coordinates', () => {
    renderApi.renderBackButton();
    renderApi.renderFightButton();
    renderApi.renderSettingsControls();

    expect(calls.image).toContainEqual([asset('back'), 530, 420, 100, 50]);
    expect(calls.image).toContainEqual([asset('fight'), 270, 330, 120, 60]);
    expect(calls.image).toContainEqual([asset('series3'), 270, 180, 120, 60]);
    expect(calls.image).toContainEqual([asset('duration60'), 270, 230, 120, 60]);
    expect(calls.image).toContainEqual([asset('medium'), 270, 280, 120, 60]);
    expect(calls.image).toContainEqual([asset('fr20'), 270, 330, 120, 60]);
    expect(calls.image).toContainEqual([asset('calibrate'), 270, 380, 120, 60]);
  });

  it('renders guard targets, calibration overlay, and speech', () => {
    renderApi.renderGuardTargets();
    renderApi.renderCalibrationOverlay();
    renderApi.renderSpeech();

    expect(calls.circle).toContainEqual([200, 160, 48]);
    expect(calls.circle).toContainEqual([440, 160, 48]);
    expect(calls.rect).toContainEqual([176, 0, 48, 480]);
    expect(calls.rect).toContainEqual([416, 0, 48, 480]);
    expect(calls.rect).toContainEqual([0, 0, 640, 100]);
    expect(calls.rect).toContainEqual([0, 300, 640, 180]);
    expect(calls.text).toContainEqual(['KEEP GUARD', 640 / 2.1, 430]);
  });
});

describe('hud and meter rendering', () => {
  it('renders round HUD timers, score arcs, and shadow labels', () => {
    renderApi.renderRoundHud(4);

    expect(calls.ellipse).toContainEqual([640 / 3, 48, 48, 48]);
    expect(calls.ellipse).toContainEqual([2 * 640 / 3, 48, 48, 48]);
    expect(calls.text).toContainEqual([29, 640 / 3, 48]);
    expect(calls.text).toContainEqual([4, 2 * 640 / 3, 48]);
    expect(calls.rect).toContainEqual([10, 14, 168, 58, 8]);
    expect(calls.rect).toContainEqual([14, 18, 160, 50, 6]);
    expect(calls.text).toContainEqual(['Shadow', 20, 28]);
    expect(calls.text).toContainEqual(['(T)ype: jab', 20, 47]);
    expect(calls.text).toContainEqual(['(S)eries: 1 / 3', 20, 63]);
    expect(calls.arc[1][5]).toBeCloseTo(54);
  });

  it('omits shadow labels outside shadow mode', () => {
    installRenderGlobals({ gameState: { menu: 3 } });

    renderApi.renderRoundHud(4);

    expect(calls.text).not.toContainEqual(['Shadow', 20, 28]);
    expect(calls.text).not.toContainEqual(['(T)ype: jab', 20, 47]);
    expect(calls.text).not.toContainEqual(['(S)eries: 1 / 3', 20, 63]);
  });

  it('renders fight meters with reduced opponent stamina', () => {
    renderApi.renderFightMeters();

    expect(calls.rect).toContainEqual([245, 15, 150, 20]);
    expect(calls.rect).toContainEqual([247, 17, 100, 16]);
    expect(calls.rect).toContainEqual([247, 45, 148, 16]);
  });

  it('skips the opponent stamina refill when stamina is depleted', () => {
    installRenderGlobals({ gameState: { my_opponent: { stamina: 0 } } });

    renderApi.renderFightMeters();

    expect(calls.rect).not.toContainEqual([247, 17, 4, 16]);
    expect(calls.rect.filter(args => args[1] === 17)).toHaveLength(1);
  });

  it('renders the active feet indicator image', () => {
    renderApi.renderFeetIndicator();
    expect(calls.image).toContainEqual([asset('left-foot'), 296, 50, 48, 48]);

    installRenderGlobals({ gameState: { feet_position: 1 } });
    renderApi.renderFeetIndicator();
    expect(calls.image).toContainEqual([asset('right-foot'), 296, 50, 48, 48]);
  });
});

describe('renderShadowResult', () => {
  it('renders all shadow move types split across left and right panels', () => {
    renderApi.renderShadowMoveReport();

    expect(calls.text).toContainEqual(['Moves', 20, 100]);
    expect(calls.text).toContainEqual(['Moves', 620, 100]);
    expect(calls.text).toContainEqual(['L J', 28, 116]);
    expect(calls.text).toContainEqual(['Left Jab', 44, 116]);
    expect(calls.text).toContainEqual(['0 / 0', 168, 119]);
    expect(calls.text).toContainEqual(['L U', 28, 188]);
    expect(calls.text).toContainEqual(['Left Uppercut', 44, 188]);
    expect(calls.text).toContainEqual(['B D', 28, 260]);
    expect(calls.text).toContainEqual(['Down Dodge', 44, 260]);
    expect(calls.text).toContainEqual(['R S', 612, 116]);
    expect(calls.text).toContainEqual(['Right Jab', 596, 116]);
    expect(calls.text).toContainEqual(['R U', 612, 188]);
    expect(calls.text).toContainEqual(['Right Uppercut', 596, 188]);
    expect(calls.text).toContainEqual(['S S', 612, 260]);
    expect(calls.text).toContainEqual(['Switch Guard', 596, 260]);
    expect(globalThis.TfitGameLogic.moveDisplay).toHaveBeenCalledTimes(10);
    expect(calls.circle).toHaveLength(10);
    expect(calls.rect).toContainEqual([10, 86, 168, 218, 8]);
    expect(calls.rect).toContainEqual([462, 86, 168, 218, 8]);
  });

  it('shows live shadow move success against generated round totals', () => {
    installRenderGlobals({
      gameState: {
        curMoves: [
          { type: 5, hit: true },
          { type: 5, hit: false },
          { type: 2, hit: true }
        ],
        gameStarted: true,
        moves: [0, 5, 5, 5, 2, 2, 10]
      }
    });

    renderApi.renderShadowMoveReport();

    expect(calls.text).toContainEqual(['1 / 3', 168, 191]);
    expect(calls.text).toContainEqual(['1 / 2', 472, 119]);
    expect(calls.text).toContainEqual(['0 / 1', 472, 263]);
  });

  it('renders the live shadow report fallback marker when a display is missing', () => {
    installRenderGlobals({
      TfitGameLogic: {
        detectStartCountdown: vi.fn(globalThis.TfitGameLogic.detectStartCountdown),
        moveDisplay: vi.fn(() => null)
      }
    });

    renderApi.renderShadowMoveReport();

    expect(calls.fill).toContainEqual([255, 255, 255, 160]);
    expect(calls.text).toContainEqual(['L ?', 28, 116]);
  });

  it('renders live shadow report counts before curMoves has been initialized', () => {
    installRenderGlobals({
      gameState: {
        curMoves: undefined,
        gameStarted: true,
        moves: [1, 1, 3]
      }
    });

    renderApi.renderShadowMoveReport();

    expect(calls.text).toContainEqual(['0 / 2', 168, 119]);
    expect(calls.text).toContainEqual(['0 / 1', 168, 155]);
  });

  it('builds shadow report totals from the active generated move list when game has started', () => {
    installRenderGlobals({
      gameState: {
        gameStarted: true,
        curMoves: [
          { type: 1, hit: true },
          { type: 3, hit: true },
          { type: 1, hit: false }
        ],
        moves: [0, 1, 1, 3, 4]
      }
    });

    renderApi.renderShadowMoveReport();

    expect(calls.text).toContainEqual(['1 / 2', 168, 119]);
    expect(calls.text).toContainEqual(['1 / 1', 168, 155]);
    expect(calls.text).toContainEqual(['0 / 0', 168, 191]);
  });

  it('uses zeroed move totals while the game is started but moves are unavailable', () => {
    installRenderGlobals({
      gameState: {
        gameStarted: true,
        moves: null,
        curMoves: [
          { type: 1, hit: true },
          { type: 2, hit: false }
        ]
      }
    });

    renderApi.renderShadowMoveReport();

    expect(calls.text).toContainEqual(['0 / 0', 168, 119]);
    expect(calls.text).toContainEqual(['0 / 0', 168, 155]);
    expect(calls.text).toContainEqual(['0 / 0', 168, 191]);
  });

  it('summarizes scoring moves by type and draws result markers', () => {
    installRenderGlobals({
      gameState: {
        arrayScore: [1, 0, 1, 1, 0, 1, 1],
        curMoves: [
          { type: 0, text: '', hit: true },
          { type: 1, text: 'J', hit: true },
          { type: 2, text: 'S', hit: false },
          { type: 3, text: 'H', hit: true },
          { type: 5, text: 'U', hit: true },
          { type: 7, text: 'D', hit: false },
          { type: 9, text: 'D', hit: true },
          { type: 10, text: 'S', hit: true }
        ]
      }
    });

    renderApi.renderShadowResult();

    expect(globalThis.gameState.score).toBe(5);
    expect(globalThis.gameState.song_result.score).toBe(5);
    expect(globalThis.gameState.song_result.length).toBe(8);
    expect(globalThis.gameState.song_result['1']).toMatchObject({ success: 1, total: 1, text: 'J' });
    expect(globalThis.gameState.song_result['2']).toMatchObject({ success: 0, total: 1, text: 'S' });
    expect(globalThis.gameState.song_result['9']).toMatchObject({ success: 1, total: 1, text: 'D' });
    expect(calls.text).toContainEqual(['Shadow Results', 320, 110]);
    expect(calls.text).toContainEqual([5, 320, 157]);
    expect(calls.text).toContainEqual(['/ 8', 320, 176]);
    expect(calls.text).toContainEqual(['Move accuracy', 320, 206]);
    expect(calls.text).toContainEqual(['L J', 104, 232]);
    expect(calls.text).toContainEqual(['R S', 338, 232]);
    expect(calls.text).toContainEqual(['1 / 1', 128, 232]);
    expect(calls.circle).toHaveLength(6);
    expect(calls.rect).toContainEqual([70, 80, 500, 320, 12]);
    expect(calls.rect).toContainEqual([86, 219, 224, 25, 6]);
    expect(calls.rect).toContainEqual([320, 219, 224, 25, 6]);
  });

  it('aggregates repeated scoring move types into one result bucket', () => {
    installRenderGlobals({
      gameState: {
        arrayScore: [1, 0, 1],
        curMoves: [
          { type: 1, text: 'J', hit: true },
          { type: 1, text: 'J', hit: false },
          { type: 1, text: 'J', hit: true }
        ]
      }
    });

    renderApi.renderShadowResult();

    expect(globalThis.gameState.song_result['1']).toMatchObject({
      success: 2,
      total: 3,
      text: 'J'
    });
    expect(globalThis.gameState.score).toBe(2);
  });

  it('renders alternate hook, uppercut, and dodge result colors', () => {
    installRenderGlobals({
      gameState: {
        arrayScore: [0, 0, 0],
        curMoves: [
          { type: 4, text: 'H', hit: false },
          { type: 6, text: 'U', hit: false },
          { type: 8, text: 'D', hit: false }
        ]
      }
    });

    renderApi.renderShadowResult();

    expect(globalThis.gameState.song_result['4']).toMatchObject({ success: 0, total: 1, text: 'H' });
    expect(globalThis.gameState.song_result['6']).toMatchObject({ success: 0, total: 1, text: 'U' });
    expect(globalThis.gameState.song_result['8']).toMatchObject({ success: 0, total: 1, text: 'D' });
    expect(globalThis.TfitGameLogic.moveDisplay).toHaveBeenCalledWith(4, 0, 255);
    expect(globalThis.TfitGameLogic.moveDisplay).toHaveBeenCalledWith(6, 0, 255);
    expect(globalThis.TfitGameLogic.moveDisplay).toHaveBeenCalledWith(8, 0, 255);
    expect(calls.fill).toContainEqual([100, 0, 100, 255]);
    expect(calls.fill).toContainEqual([0, 100, 100, 255]);
    expect(calls.fill).toContainEqual([0, 0, 100, 255]);
  });

  it('renders unknown result move types without a type-specific fill color', () => {
    installRenderGlobals({
      gameState: {
        arrayScore: [0],
        curMoves: [
          { type: 11, text: '?', hit: false }
        ]
      }
    });

    renderApi.renderShadowResult();

    expect(globalThis.gameState.song_result['11']).toMatchObject({ success: 0, total: 1, text: '?' });
    expect(calls.circle).toHaveLength(1);
    expect(calls.fill).not.toContainEqual([0, 0, 200, 255]);
  });
});

describe('renderMoveShape', () => {
  it('draws circles for round move targets', () => {
    renderApi.renderMoveShape({ type: 1, x: 10, y: 20 }, 30);

    expect(calls.circle).toContainEqual([10, 20, 30]);
  });

  it('draws each directional move shape', () => {
    for (const type of [3, 4, 5, 6, 7, 8]) {
      renderApi.renderMoveShape({ type, x: 100, y: 50 }, 30);
    }

    expect(calls.quad).toHaveLength(6);
    expect(calls.quad).toContainEqual([85, 35, 85, 65, 115, 55, 115, 45]);
    expect(calls.quad).toContainEqual([115, 35, 115, 65, 85, 55, 85, 45]);
    expect(calls.quad).toContainEqual([85, 65, 115, 65, 105, 35, 95, 35]);
  });

  it('draws paired down-dodge shapes when a paired x position is supplied', () => {
    renderApi.renderMoveShape({ type: 9, x: 100, y: 50 }, 30, 200);

    expect(calls.quad).toHaveLength(2);
    expect(calls.quad[0]).toEqual([85, 35, 115, 35, 105, 65, 95, 65]);
    expect(calls.quad[1]).toEqual([185, 35, 215, 35, 205, 65, 195, 65]);
  });

  it('draws a single down-dodge shape without a paired x position', () => {
    renderApi.renderMoveShape({ type: 9, x: 100, y: 50 }, 30);

    expect(calls.quad).toHaveLength(1);
  });
});
