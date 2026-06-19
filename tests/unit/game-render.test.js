import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const renderApi = require('../../js/game-render');
const { moveDisplay } = require('../../js/game-logic');

const STUBBED_GLOBALS = [
  'arc',
  'background',
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
  'line',
  'myWindowHeight',
  'myWindowWidth',
  'MOVE_TYPE',
  'mouseX',
  'mouseY',
  'max',
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
  'rotate',
  'ROUND',
  'scale',
  'SHADOW_SPECIFIC',
  'strokeCap',
  'strokeJoin',
  'sin',
  'speechString',
  'stroke',
  'strokeWeight',
  'textAlign',
  'textSize',
  'textStyle',
  'text',
  'frameCount',
  'triangle',
  'tint',
  'TfitGameLogic',
  'TfitLayoutState',
  'TfitOpponentRenderers',
  'translate',
  'TOP',
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
    'background',
    'ellipse',
    'fill',
    'image',
    'triangle',
    'noFill',
    'noStroke',
    'pop',
    'push',
    'line',
    'quad',
    'rect',
    'rectMode',
    'resetMatrix',
    'rotate',
    'scale',
    'strokeCap',
    'strokeJoin',
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
    max: Math.max,
    myWindowHeight: 480,
    myWindowWidth: 640,
    NORMAL: 'normal',
    OBJECT_POSE_SIZE: 48,
    OPPONENTS: { 0: { name: 'Raja', stamina: 6 } },
    PI: Math.PI,
    frameCount: 123,
    radians: degrees => degrees * Math.PI / 180,
    RIGHT: 'right',
    ROUND: 'round',
    TOP: 'top',
    CORNER: 'CORNER',
    mouseX: 0,
    mouseY: 0,
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
      'getCalibrationResetButtonBounds',
      'getSettingsButtonBounds',
      'renderBackButton',
      'renderCalibrationOverlay',
      'renderCalibrationResetButton',
      'renderFeetIndicator',
      'renderFightButton',
      'renderFightMeters',
      'renderFightOpponentCharacter',
      'renderGuardTargets',
      'renderLoadingScreen',
      'renderMainMenu',
      'renderMoveShape',
      'renderRajaOpponentCharacter',
      'renderRoundHud',
      'renderSceneBackground',
      'renderSettingsControls',
      'renderShadowMoveReport',
      'renderShadowResult',
      'renderSpeech',
      'renderStopButton',
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

  it('reads configured game labels when loaded in a browser context', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8');
    const drawCalls = [];
    const sandbox = {
      BOLD: 'bold',
      CENTER: 'center',
      CORNER: 'corner',
      GAME_LENGTH: { 1: '30' },
      gameState: {
        gameLengthIndex: 1,
        gameSeries: 1,
        level: 0
      },
      mouseX: 0,
      mouseY: 0,
      noFill: () => {},
      noStroke: () => {},
      pop: () => {},
      push: () => {},
      rect: () => {},
      rectMode: () => {},
      stroke: () => {},
      strokeWeight: () => {},
      TfitConfig: {
        GAME_LENGTH: { 1: '45' },
        GAME_LEVEL: { 0: 'custom' }
      },
      TfitLayoutState: {
        snapshot: () => ({
          coef: 1,
          frameRate: 20,
          height: 480,
          width: 640
        })
      },
      fill: () => {},
      text: (...args) => drawCalls.push(args),
      textAlign: () => {},
      textSize: () => {},
      textStyle: () => {}
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);
    sandbox.TfitRender.renderSettingsControls();

    expect(drawCalls).toContainEqual(['(L)ENGTH (45s)', 320, 252]);
    expect(drawCalls).toContainEqual(['(L)EVEL (CUSTOM)', 320, 302]);
  });

  it('keeps preformatted button labels unchanged in a sandboxed render module', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8').replace(
      'root.TfitRender = api;',
      'api.__drawMenuButtonForTest = drawMenuButton; root.TfitRender = api;'
    );
    const drawCalls = [];
    const sandbox = {
      BOLD: 'bold',
      CENTER: 'center',
      CORNER: 'corner',
      mouseX: 10,
      mouseY: 10,
      module: {
        exports: {}
      },
      noFill: () => {},
      noStroke: () => {},
      pop: () => {},
      push: () => {},
      rect: () => {},
      rectMode: () => {},
      stroke: () => {},
      strokeWeight: () => {},
      TfitLayoutState: {
        snapshot: () => ({
          coef: 1,
          height: 480,
          width: 640
        })
      },
      fill: () => {},
      text: (...args) => drawCalls.push(args),
      textAlign: () => {},
      textSize: () => {},
      textStyle: () => {}
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);
    sandbox.TfitRender.__drawMenuButtonForTest({
      label: '(A)LREADY',
      x: 0,
      y: 0,
      w: 100,
      h: 42
    });

    expect(drawCalls).toContainEqual(['(A)LREADY', 50, 22]);
    expect(sandbox.module.exports).toBe(sandbox.TfitRender);
  });

  it('renders the upper wire boxer punch effect in a sandboxed render module', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8').replace(
      'root.TfitRender = api;',
      'api.__drawUpperWireBoxerForTest = drawUpperWireBoxer; root.TfitRender = api;'
    );
    const drawCalls = [];
    const sandbox = {
      BOLD: 'bold',
      frameCount: 20,
      ROUND: 'round',
      arc: () => {},
      ellipse: () => {},
      fill: () => {},
      line: () => {},
      noFill: () => {},
      noStroke: () => {},
      pop: () => {},
      push: () => {},
      scale: () => {},
      stroke: () => {},
      strokeCap: () => {},
      strokeJoin: () => {},
      strokeWeight: () => {},
      text: (...args) => drawCalls.push(args),
      textSize: () => {},
      textStyle: () => {},
      translate: () => {}
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);
    sandbox.TfitRender.__drawUpperWireBoxerForTest(100, 200, 1.35, 1, true, true);

    expect(drawCalls).toContainEqual(['JAB!', 190, -230]);
    expect(drawCalls).not.toContainEqual(['GUARD', 0, -285]);
  });

  it('renders upper wire boxer effects in the shared render module for coverage', () => {
    const drawCalls = [];
    vi.spyOn(globalThis, 'text').mockImplementation((...args) => {
      drawCalls.push(args);
    });

    renderApi.__drawUpperWireBoxerForTest(100, 200, 1.35, 1, true, true);

    expect(drawCalls).toContainEqual(['JAB!', 190, -230]);
    expect(drawCalls).not.toContainEqual(['GUARD', 0, -285]);
  });

  it('supports upper wire boxer rendering without optional p5 helpers', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8').replace(
      'root.TfitRender = api;',
      'api.__drawUpperWireBoxerForTest = drawUpperWireBoxer; root.TfitRender = api;'
    );
    const drawCalls = [];
    const sandbox = {
      BOLD: 'bold',
      frameCount: 20,
      ROUND: 'round',
      arc: () => {},
      ellipse: () => {},
      fill: () => {},
      line: () => {},
      noFill: () => {},
      noStroke: () => {},
      pop: () => {},
      push: () => {},
      stroke: () => {},
      strokeWeight: () => {},
      text: (...args) => drawCalls.push(args),
      textSize: () => {},
      textStyle: () => {},
      translate: () => {}
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);
    sandbox.TfitRender.__drawUpperWireBoxerForTest(120, 220, 1.35, 1, true, true);

    expect(drawCalls).toContainEqual(['JAB!', 190, -230]);
    expect(drawCalls).not.toContainEqual(['GUARD', 0, -285]);
  });

  it('builds shadow results while skipping silent placeholder moves', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8').replace(
      'root.TfitRender = api;',
      'api.__buildShadowResultForTest = buildShadowResult; root.TfitRender = api;'
    );
    const sandbox = {
      gameState: {
        arrayScore: [],
        curMoves: [
          { type: 0, text: 'X', hit: true },
          { type: 5, text: 'U', hit: false },
          { type: 5, text: 'U', hit: true }
        ],
        score_max_prev: 4
      }
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    const results = sandbox.TfitRender.__buildShadowResultForTest();
    expect(sandbox.gameState.score).toBe(0);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 5, text: 'U', success: 1, total: 2 })
      ])
    );
    expect(sandbox.gameState.song_result['0']).toBeUndefined();
  });

  it('builds shadow results in the shared render module', () => {
    globalThis.gameState.arrayScore = [3, 2, 0];
    globalThis.gameState.curMoves = [
      { type: 0, text: 'X', hit: true },
      { type: 5, text: 'U', hit: false },
      { type: 5, text: 'U', hit: true },
      { type: 6, text: 'O', hit: true }
    ];

    const results = renderApi.__buildShadowResultForTest();

    expect(globalThis.gameState.score).toBe(5);
    expect(globalThis.gameState.song_result.score).toBe(5);
    expect(globalThis.gameState.song_result.length).toBe(4);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 5, text: 'U', success: 1, total: 2 }),
        expect.objectContaining({ type: 6, text: 'O', success: 1, total: 1 })
      ])
    );
    expect(globalThis.gameState.song_result['0']).toBeUndefined();
  });

  it('builds shadow results in the shared render module for miss and non-placeholder branches', () => {
    globalThis.gameState.arrayScore = [1];
    globalThis.gameState.curMoves = [
      { type: 5, text: 'U', hit: false },
      { type: 6, text: 'O', hit: false }
    ];

    const results = renderApi.__buildShadowResultForTest();

    expect(globalThis.gameState.score).toBe(1);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 5, text: 'U', success: 0, total: 1 }),
        expect.objectContaining({ type: 6, text: 'O', success: 0, total: 1 })
      ])
    );
    expect(globalThis.gameState.song_result['0']).toBeUndefined();
  });

  it('renders upper wire boxer idle state in shared module for attack/guard false branches', () => {
    const drawCalls = [];
    vi.spyOn(globalThis, 'text').mockImplementation((...args) => {
      drawCalls.push(args);
    });

    renderApi.__drawUpperWireBoxerForTest(100, 200, 1.35, 1, false, false);

    expect(drawCalls).toHaveLength(0);
  });

  it('resolves joint target defaults when no target is provided', () => {
    const points = renderApi.__getJointPointsForTest(0, 0, 0, 0, 0, null);

    expect(points).toHaveLength(12);
    expect(points[6]).toEqual([-118, -62, 7]);
    expect(points[7]).toEqual([0, 0, 11]);
    expect(points[8]).toEqual([116, -70, 7]);
    expect(points[9]).toEqual([0, 0, 12]);
  });

  it('resolves joint target defaults when target coordinates are not finite', () => {
    const points = renderApi.__getJointPointsForTest(0, 0, 0, 0, 0, { x: Number.NaN, y: Infinity, side: 'left', reach: 0.5 });

    expect(points[6]).toEqual([-118, -62, 7]);
    expect(points[7]).toEqual([0, 0, 11]);
    expect(points[8]).toEqual([116, -70, 7]);
    expect(points[9]).toEqual([0, 0, 12]);
  });

  it('resolves left-target joints with positive target reach', () => {
    const points = renderApi.__getJointPointsForTest(0, 0, 0, 0, 0, { x: 40, y: 22, side: 'left', reach: 0.75 });

    expect(points[6]).toEqual([0.5, 1, 7]);
    expect(points[7]).toEqual([40, 22, 11]);
    expect(points[8]).toEqual([116, -70, 7]);
    expect(points[9]).toEqual([40, 22, 12]);
  });

  it('resolves right-target joints with clamped target reach', () => {
    const points = renderApi.__getJointPointsForTest(0, 0, 0, 0, 0, { x: 190, y: -30, side: 'right', reach: 1.8 });

    expect(points[6]).toEqual([-118, -62, 7]);
    expect(points[7]).toEqual([190, -30, 11]);
    expect(points[8]).toEqual([190, -30, 7]);
    expect(points[9]).toEqual([190, -30, 12]);
  });

  it('resolves left-target joints via x-based fallback side when side is absent', () => {
    const points = renderApi.__getJointPointsForTest(0, 0, 0, 0, 0, { x: -160, y: 30, reach: 1 });

    expect(points[6]).toEqual([-160, 30, 7]);
    expect(points[7]).toEqual([-160, 30, 11]);
    expect(points[8]).toEqual([116, -70, 7]);
    expect(points[9]).toEqual([-160, 30, 12]);
  });

  it('resolves right-target joints via x-based fallback side when side is absent', () => {
    const points = renderApi.__getJointPointsForTest(0, 0, 0, 0, 0, { x: 160, y: 28, reach: 1 });

    expect(points[6]).toEqual([-118, -62, 7]);
    expect(points[7]).toEqual([160, 28, 11]);
    expect(points[8]).toEqual([160, 28, 7]);
    expect(points[9]).toEqual([160, 28, 12]);
  });

  it('reaches left target in skeleton motion calculations', () => {
    const calls = [];
    vi.spyOn(globalThis, 'line').mockImplementation((...args) => {
      calls.push(args);
    });

    renderApi.__drawUpperSkeletonForTest(0, 0, 0, 0.4, 0, true, { x: 40, y: 22, side: 'left', reach: 1 });

    expect(calls).toContainEqual([40, 22, 40, 22]);
  });

  it('reaches fallback-left target in skeleton motion calculations', () => {
    const calls = [];
    vi.spyOn(globalThis, 'line').mockImplementation((...args) => {
      calls.push(args);
    });

    renderApi.__drawUpperSkeletonForTest(0, 0, 0, 0.4, 0, true, { x: -170, y: 10, reach: 1 });

    expect(calls).toContainEqual([-170, 10, -170, 10]);
  });

  it('reaches fallback-right target in skeleton motion calculations', () => {
    const calls = [];
    vi.spyOn(globalThis, 'line').mockImplementation((...args) => {
      calls.push(args);
    });

    renderApi.__drawUpperSkeletonForTest(0, 0, 0, 0.4, 0, true, { x: 190, y: 32, reach: 1 });

    expect(calls).toContainEqual([190, 32, 190, 32]);
  });

  it('reaches right target in skeleton motion calculations', () => {
    const calls = [];
    vi.spyOn(globalThis, 'line').mockImplementation((...args) => {
      calls.push(args);
    });

    renderApi.__drawUpperSkeletonForTest(0, 0, 0, 0.4, 0, true, { x: 190, y: -30, side: 'right', reach: 1 });

    expect(calls).toContainEqual([190, -30, 190, -30]);
  });

  it('calls upper wire skeleton helper with both glow states for complete branch coverage', () => {
    renderApi.__drawUpperSkeletonForTest(0, 0, 0, 0, 1, true);
    renderApi.__drawUpperSkeletonForTest(0, 0, 0, 0, 1, false);
  });

  it('renders the procedural fight opponent across idle and punch actions', () => {
    renderApi.renderFightOpponentCharacter();
    for (const type of [1, 2, 3, 4, 5, 6]) {
      renderApi.renderFightOpponentCharacter({
        frame: 1,
        layout: { height: 480, width: 640 },
        type
      });
      renderApi.renderFightOpponentCharacter({
        frame: 4,
        layout: { height: 480, width: 640 },
        type
      });
    }

    expect(calls.translate).toContainEqual([640 * 0.5, expect.any(Number)]);
    expect(calls.scale).toContainEqual([(480 / 780) * 0.7]);
    expect(calls.rotate.length).toBeGreaterThan(0);
    expect(calls.text).not.toEqual(expect.arrayContaining([
      ['LEFT JAB!', expect.any(Number), expect.any(Number)],
      ['RIGHT UPPERCUT!', expect.any(Number), expect.any(Number)]
    ]));
  });

  it('dispatches fight opponent rendering through the configured opponent renderer', () => {
    const render = vi.fn();
    installRenderGlobals({
      gameState: { opponent: 0 },
      OPPONENTS: {
        0: {
          renderer: 'raja',
          scale: 0.5,
          xRatio: 0.42,
          yRatio: 0.61
        }
      },
      TfitOpponentRenderers: {
        raja: { render }
      }
    });

    renderApi.renderFightOpponentCharacter({
      frame: 2,
      layout: { height: 480, width: 640 },
      type: 1
    });

    expect(render).toHaveBeenCalledWith({
      frame: 2,
      layout: { height: 480, width: 640 },
      opponent: {
        renderer: 'raja',
        scale: 0.5,
        xRatio: 0.42,
        yRatio: 0.61
      },
      type: 1
    });
  });

  it('uses Raja opponent size and position config in the fallback renderer', () => {
    renderApi.renderRajaOpponentCharacter({
      layout: { height: 480, width: 640 },
      opponent: {
        scale: 0.5,
        xRatio: 0.42,
        yRatio: 0.61
      }
    });

    expect(calls.translate).toContainEqual([640 * 0.42, expect.any(Number)]);
    expect(calls.scale).toContainEqual([(480 / 780) * 0.5]);
  });

  it('renders procedural fight opponent hit reactions', () => {
    renderApi.renderFightOpponentCharacter({
      layout: { height: 480, width: 640 },
      reaction: { duration: 30, frame: 0, type: 2 }
    });
    renderApi.renderFightOpponentCharacter({
      layout: { height: 480, width: 640 },
      reaction: { duration: 30, frame: 0, type: 3 }
    });
    renderApi.renderFightOpponentCharacter({
      layout: { height: 480, width: 640 },
      reaction: { duration: 0, frame: 0, type: 1 }
    });
    renderApi.renderFightOpponentCharacter({
      layout: { height: 480, width: 640 },
      reaction: { duration: 30, frame: Number.NaN, type: 1 }
    });
    renderApi.renderFightOpponentCharacter({
      layout: { height: 480, width: 640 },
      reaction: { duration: Number.NaN, frame: 0, type: 1 }
    });

    expect(calls.ellipse).toEqual(expect.arrayContaining([
      [0, -170, 300, 212],
      [-34, -205, 134, 78]
    ]));
    expect(calls.translate).toEqual(expect.arrayContaining([
      [320 - 18, expect.any(Number)],
      [320 + 70, expect.any(Number)]
    ]));
  });

  it('ignores unknown generated move types in sandboxed shadow report counts', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8').replace(
      'root.TfitRender = api;',
      'api.__shadowMoveReportCountsForTest = shadowMoveReportCounts; root.TfitRender = api;'
    );
    const sandbox = {
      gameState: {
        gameStarted: true,
        moves: [11],
        curMoves: []
      }
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitRender.__shadowMoveReportCountsForTest()[1]).toEqual({
      success: 0,
      total: 0
    });
  });

  it('maps down-dodge and switch-guard to dedicated move-legend labels', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8').replace(
      'root.TfitRender = api;',
      'api.__shadowMoveLegendLabelForTest = shadowMoveLegendLabel; root.TfitRender = api;'
    );
    const sandbox = {
      BOLD: 'bold',
      CENTER: 'center',
      CORNER: 'corner',
      MOVE_TYPE: { 9: 'DOWN_DODGE', 10: 'SWITCH_GUARD' },
      FRAME_RATE: 20,
      loading_k: 0,
      loading_m: 0,
      errorTimer: 0,
      hide_sensor: 128,
      myWindowWidth: 640,
      myWindowHeight: 480,
      document: { body: { style: { setProperty: () => {} } } },
      TfitConfig: { GAME_LENGTH: {}, GAME_LEVEL: {} },
      images: {},
      OPPONENTS: { 0: { stamina: 6 } },
      gameState: { menu: 2, opponent: 0, gameStarted: true, moves: [], curMoves: [] },
      TfitLayoutState: {
        snapshot: () => ({
          coef: 1,
          frameRate: 20,
          height: 480,
          width: 640,
          objectPoseSize: 48,
          levelWindowBase: 0
        })
      },
      TfitGameLogic: {
        detectStartCountdown: vi.fn(),
        moveDisplay: () => ({ color: [0, 0, 0, 200], text: 'X' })
      },
      SHADOW_SPECIFIC: { 1: 'JAB' },
      moveDisplay: () => ({ color: [0, 0, 0, 200], text: 'X' }),
      RIGHT: 'right',
      LEFT: 'left',
      PI: Math.PI,
      TOP: 'top',
      BETA: 0,
      strokeCap: () => {},
      background: () => {},
      noStroke: () => {},
      fill: () => {},
      noFill: () => {},
      rect: () => {},
      rectMode: () => {},
      stroke: () => {},
      strokeWeight: () => {},
      line: () => {},
      quad: () => {},
      circle: () => {},
      image: () => {},
      text: () => {},
      textAlign: () => {},
      textSize: () => {},
      textStyle: () => {},
      map: (value, start1, stop1, start2, stop2) => start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2),
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      min: Math.min,
      max: Math.max,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      sqrt: Math.sqrt,
      TWO_PI: Math.PI * 2,
      NO_FILL: 'noFill',
      NORMAL: 'normal',
      CORNERS: 'corners',
      ROUND: 'round',
      module: { exports: {} },
      width: 640,
      height: 480
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitRender.__shadowMoveLegendLabelForTest(9)).toBe('B');
    expect(sandbox.TfitRender.__shadowMoveLegendLabelForTest(10)).toBe('S');
    expect(sandbox.TfitRender.__shadowMoveLegendLabelForTest(1)).toBe('L');
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
    installRenderGlobals({ frameCount: 20 });

    renderApi.renderSceneBackground();
    renderApi.renderMainMenu();

    expect(calls.tint).toEqual([]);
    expect(calls.image).not.toContainEqual([asset('bg2'), 0, 0, 640, 480]);
    expect(globalThis.document.body.style.setProperty).toHaveBeenCalledWith(
      '--app-background-image',
      'url("assets/backgrounds/2.jpg")'
    );
    expect(calls.image).not.toContainEqual([asset('menu'), 204, 70, 312, 312]);
    expect(calls.image).toContainEqual([asset('logo'), 580, 425, 50, 50]);
    const layout = { width: 640, height: 480, coef: 1 };
    const panelX = layout.width * 0.6;
    const panelY = layout.height / 12;
    const panelW = Math.min(layout.width * 0.44, 620);
    const panelH = layout.height * 0.24;
    const titleY = panelY + 22 * layout.coef;
    const descX = panelX - panelW / 2 + 28;
    const descY = panelY + 60 * layout.coef;
    const description =
      'A boxing game about rhythm, movement, and endurance.';
    const hasPanel = calls.rect.some((entry) => {
      const [x, y, w, h] = entry;
      return (
        Math.abs(x - (panelX - panelW / 2)) < 0.001 &&
        Math.abs(y - (panelY + panelH / 2 - panelH / 2)) < 0.001 &&
        Math.abs(w - panelW) < 0.001 &&
        Math.abs(h - panelH) < 0.001
      );
    });
    expect(hasPanel).toBe(true);
    const hasTitle = calls.text.some((entry) => (
      entry[0] === 'BOX4FIT' &&
      Math.abs(entry[1] - panelX) < 0.001 &&
      Math.abs(entry[2] - titleY) < 0.001
    ));
    const hasDescription = calls.text.some((entry) => (
      entry[0] === description &&
      Math.abs(entry[1] - descX) < 0.001 &&
      Math.abs(entry[2] - descY) < 0.001
    ));
    expect(hasTitle).toBe(true);
    expect(hasDescription).toBe(true);
    expect(calls.scale).toContainEqual([1.35]);
    expect(calls.text).not.toContainEqual(['JAB!', 190, -230]);
    expect(calls.text).not.toContainEqual(['GUARD', 0, -285]);
  });

  it('renders the arena for game 3 in scene background', () => {
    installRenderGlobals({ gameState: { menu: 3 } });
    renderApi.renderSceneBackground();

    expect(calls.quad).toHaveLength(3);
    expect(calls.line).toHaveLength(35);
    const hasGame3PerspectiveLine = calls.line.some(([x1, y1, x2, y2]) => (
      Math.abs(y1 - (480 * 0.64)) < 0.001 &&
      Math.abs(x2 - (640 * 0.86 + 0 * 28)) < 0.001 &&
      Math.abs(x1 - (640 * 0.16)) < 0.001
    ));
    expect(hasGame3PerspectiveLine).toBe(true);
  });

  it('renders the fight arena for game 4 in scene background', () => {
    installRenderGlobals({ gameState: { menu: 4 } });
    renderApi.renderSceneBackground();

    expect(calls.triangle).toHaveLength(5);
    expect(calls.ellipse.length).toBeGreaterThan(50);
    const hasFightBanner = calls.ellipse.some((entry) => (
      Math.abs(entry[0] - (640 * 0.13)) < 0.001 &&
      Math.abs(entry[1] - 22) < 0.001 &&
      entry[2] === 38 &&
      entry[3] === 13
    ));
    expect(hasFightBanner).toBe(true);
    const hasFightPostFloor = calls.rect.some((entry) => (
      entry[0] === 320 &&
      Math.abs(entry[1] - 379.2) < 0.01 &&
      entry[2] === 640 &&
      Math.abs(entry[3] - 201.6) < 0.01
    ));
    expect(hasFightPostFloor).toBe(true);
  });

  it('renders the arena background without menu overlay styling on the main menu', () => {
    installRenderGlobals({ gameState: { menu: 0 } });

    renderApi.renderSceneBackground();

    expect(calls.textSize).toEqual([]);
  });

  it('skips page background sync outside a document context', () => {
    installRenderGlobals({ document: undefined });

    expect(renderApi.syncPageBackground()).toBe(false);
  });

  it('clears the page background image on the main menu', () => {
    expect(renderApi.syncPageBackground(0)).toBe(true);
    expect(globalThis.document.body.style.setProperty).toHaveBeenCalledWith(
      '--app-background-image',
      'none'
    );
  });

  it('renders menu and settings buttons at their app coordinates', () => {
    renderApi.renderBackButton();
    renderApi.renderFightButton();
    renderApi.renderSettingsControls();

    expect(calls.rect).toEqual(expect.arrayContaining([
      [530, 420, 100, 42, 16],
      [260, 330, 120, 42, 16],
      [245, 180, 150, 42, 16],
      [245, 230, 150, 42, 16],
      [245, 280, 150, 42, 16],
      [245, 330, 150, 42, 16],
      [245, 380, 150, 42, 16]
    ]));

    expect(calls.text).toEqual(expect.arrayContaining([
      ['(B)ACK', 580, 442],
      ['(F)IGHT', 320, 352],
      ['(S)ERIES (3/5)', 320, 202],
      ['(L)ENGTH (60s)', 320, 252],
      ['(L)EVEL (MEDIUM)', 320, 302],
      ['(F)RAMERATE (20 FPS)', 320, 352],
      ['(C)ALIBRATE', 320, 402]
    ]));
  });

  it('uses the default level label when the configured index is missing', () => {
    installRenderGlobals({ gameState: { level: 99 } });

    renderApi.renderSettingsControls();

    expect(calls.text).toContainEqual(['(L)EVEL (MEDIUM)', 320, 302]);
  });

  it('draws hovered menu button glow and system-style buttons', () => {
    installRenderGlobals({ mouseX: 580, mouseY: 442 });

    renderApi.renderBackButton();
    renderApi.renderStopButton();
    renderApi.renderCalibrationResetButton();

    expect(calls.noFill.length).toBeGreaterThan(0);
    expect(calls.noStroke.length).toBeGreaterThan(0);
    expect(calls.text).toContainEqual(['(B)ACK', 580, 442]);
    expect(calls.text).toContainEqual(['(S)TOP', 580, 442]);
    expect(calls.text).toContainEqual(['(R)ESET', 320, 402]);
  });

  it('returns calibration reset button bounds from the current layout', () => {
    expect(renderApi.getCalibrationResetButtonBounds()).toEqual({
      left: 260,
      right: 380,
      top: 380,
      bottom: 422
    });
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

    expect(calls.ellipse).toContainEqual([640 / 3, 436.16, 55.67999999999999, 55.67999999999999]);
    expect(calls.ellipse).toContainEqual([2 * 640 / 3, 436.16, 55.67999999999999, 55.67999999999999]);
    expect(calls.rect).toEqual(expect.arrayContaining([
      [
        expect.closeTo(176.33333333333334),
        expect.closeTo(400.664),
        74,
        70.99199999999999,
        8
      ],
      [
        expect.closeTo(180.33333333333334),
        expect.closeTo(404.664),
        66,
        62.99199999999999,
        6
      ]
    ]));
    expect(calls.text).toContainEqual(['TIME', 640 / 3, 421.66400000000004]);
    expect(calls.text).toContainEqual(['29', 640 / 3, 439.16]);
    expect(calls.text).toContainEqual(['POINTS', 2 * 640 / 3, 421.66400000000004]);
    expect(calls.text).toContainEqual(['4', 2 * 640 / 3, 439.16]);
    expect(calls.rect).toContainEqual([10, 14, 168, 72, 8]);
    expect(calls.rect).toContainEqual([14, 18, 160, 64, 6]);
    expect(calls.text).toContainEqual(['Shadow', 20, 28]);
    expect(calls.text).toContainEqual(['(T)ype: jab', 20, 46]);
    expect(calls.text).toContainEqual(['(S)eries: 1 / 3', 20, 64]);
    expect(calls.arc[1][5]).toBeCloseTo(54);
  });

  it('omits shadow labels outside shadow mode', () => {
    installRenderGlobals({ gameState: { menu: 3 } });

    renderApi.renderRoundHud(4);

    expect(calls.text).not.toContainEqual(['Shadow', 20, 28]);
    expect(calls.text).not.toContainEqual(['(T)ype: jab', 20, 47]);
    expect(calls.text).not.toContainEqual(['(S)eries: 1 / 3', 20, 63]);
  });

  it('renders fight opponent selection panel on fight mode', () => {
    installRenderGlobals({
      gameState: { menu: 4, opponent: 1 },
      OPPONENTS: {
        0: { name: 'Raja', stamina: 6 },
        1: { name: 'Theo', stamina: 8 }
      }
    });

    renderApi.renderRoundHud(4);

    expect(calls.rect).toContainEqual([10, 14, 188, 72, 8]);
    expect(calls.text).toContainEqual(['Fight', 20, 28]);
    expect(calls.text).toContainEqual(['(O)pponent: theo', 20, 46]);
    expect(calls.text).toContainEqual(['Series: 1 / 3', 20, 64]);
  });

  it('uses the default fight opponent label when opponent config has no name', () => {
    installRenderGlobals({
      gameState: { menu: 4, opponent: 1 },
      OPPONENTS: {
        0: { name: 'Raja', stamina: 6 },
        1: { stamina: 8 }
      }
    });

    renderApi.renderRoundHud(4);

    expect(calls.text).toContainEqual(['(O)pponent: raja', 20, 46]);
  });

  it('renders fight meters with reduced opponent stamina', () => {
    renderApi.renderFightMeters();

    const opponentY = 18;
    const playerY = 480 - 38;

    expect(calls.rect).toContainEqual([245, opponentY, 150, 20]);
    expect(calls.rect).toContainEqual([247, opponentY + 2, 98.66666666666666, 16]);
    expect(calls.rect).toContainEqual([247, playerY + 2, 148, 16]);
    expect(calls.fill).toEqual(expect.arrayContaining([
      [94, 22, 34, 185],
      [245, 238, 214, 224]
    ]));
    expect(calls.text).toContainEqual(['RAJA', 320, opponentY - 9]);
    expect(calls.text).toContainEqual(['YOU', 320, playerY - 9]);
  });

  it('renders the points gauge when the score max is unset', () => {
    installRenderGlobals({ gameState: { score_max: 0 } });

    renderApi.renderRoundHud(7);

    expect(calls.text).toContainEqual(['7', 2 * 640 / 3, 439.16]);
  });

  it('renders an empty opponent stamina bar when stamina is depleted', () => {
    installRenderGlobals({ gameState: { my_opponent: { stamina: 0 } } });

    renderApi.renderFightMeters();

    const opponentY = 18;
    expect(calls.rect).toContainEqual([247, opponentY + 2, 0, 16]);
  });

  it('renders reduced player stamina in fight meters', () => {
    installRenderGlobals({ gameState: { gameStarted: true, my_stamina: 3 } });

    renderApi.renderFightMeters();

    const playerY = 480 - 38;
    expect(calls.rect).toContainEqual([247, playerY + 2, 74, 16]);
  });

  it('renders full player stamina before the fight round starts', () => {
    installRenderGlobals({ gameState: { gameStarted: false, my_stamina: 0 } });

    renderApi.renderFightMeters();

    const playerY = 480 - 38;
    expect(calls.rect).toContainEqual([247, playerY + 2, 148, 16]);
  });

  it('renders the active feet indicator image', () => {
    renderApi.renderFeetIndicator();
    expect(calls.image).toContainEqual([asset('left-foot'), 303, 419.16, 34, 34]);

    installRenderGlobals({ gameState: { feet_position: 1 } });
    renderApi.renderFeetIndicator();
    expect(calls.image).toContainEqual([asset('right-foot'), 303, 419.16, 34, 34]);
  });
});

describe('renderShadowResult', () => {
  it('renders all shadow move types split across left and right panels', () => {
    renderApi.renderShadowMoveReport();

    expect(calls.text).toContainEqual(['Moves', 24, 102]);
    expect(calls.text).toContainEqual(['Moves', 616, 102]);
    expect(calls.text).toContainEqual(['L J', 32, 128]);
    expect(calls.text).toContainEqual(['Left Jab', 52, 128]);
    expect(calls.text).toContainEqual(['0 / 0', 164, 131]);
    expect(calls.text).toContainEqual(['L U', 32, 204]);
    expect(calls.text).toContainEqual(['Left Uppercut', 52, 204]);
    expect(calls.text).toContainEqual(['B D', 32, 280]);
    expect(calls.text).toContainEqual(['Down Dodge', 52, 280]);
    expect(calls.text).toContainEqual(['R S', 608, 128]);
    expect(calls.text).toContainEqual(['Right Jab', 588, 128]);
    expect(calls.text).toContainEqual(['R U', 608, 204]);
    expect(calls.text).toContainEqual(['Right Uppercut', 588, 204]);
    expect(calls.text).toContainEqual(['S S', 608, 280]);
    expect(calls.text).toContainEqual(['Switch Guard', 588, 280]);
    expect(globalThis.TfitGameLogic.moveDisplay).toHaveBeenCalledTimes(10);
    expect(calls.fill).toContainEqual([0, 190, 255, 220]);
    expect(calls.circle).toHaveLength(10);
    expect(calls.rect).toContainEqual([10, 86, 168, 246, 8]);
    expect(calls.rect).toContainEqual([462, 86, 168, 246, 8]);
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

    expect(calls.text).toContainEqual(['1 / 3', 164, 207]);
    expect(calls.text).toContainEqual(['1 / 2', 476, 131]);
    expect(calls.text).toContainEqual(['0 / 1', 476, 283]);
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
    expect(calls.text).toContainEqual(['L ?', 32, 128]);
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

    expect(calls.text).toContainEqual(['0 / 2', 164, 131]);
    expect(calls.text).toContainEqual(['0 / 1', 164, 169]);
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

    expect(calls.text).toContainEqual(['1 / 2', 164, 131]);
    expect(calls.text).toContainEqual(['1 / 1', 164, 169]);
    expect(calls.text).toContainEqual(['0 / 0', 164, 207]);
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

    expect(calls.text).toContainEqual(['0 / 0', 164, 131]);
    expect(calls.text).toContainEqual(['0 / 0', 164, 169]);
    expect(calls.text).toContainEqual(['0 / 0', 164, 207]);
  });

  it('ignores generated shadow moves outside the tracked scoring types', () => {
    installRenderGlobals({
      gameState: {
        gameStarted: true,
        moves: [1, 11, Number.NaN],
        curMoves: []
      }
    });

    renderApi.renderShadowMoveReport();

    expect(calls.text).toContainEqual(['0 / 1', 164, 131]);
    expect(calls.text).toContainEqual(['0 / 0', 476, 283]);
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
    expect(globalThis.gameState.song_result['10']).toMatchObject({ success: 1, total: 1, text: 'S' });
    expect(globalThis.TfitGameLogic.moveDisplay).toHaveBeenCalledWith(10, 0, 255);
    expect(calls.fill).toContainEqual([0, 190, 255, 255]);
    expect(calls.text).toContainEqual(['Shadow Results', 320, 110]);
    expect(calls.text).toContainEqual([5, 320, 157]);
    expect(calls.text).toContainEqual(['/ 8', 320, 176]);
    expect(calls.text).toContainEqual(['Move accuracy', 320, 206]);
    expect(calls.text).toContainEqual(['L J', 104, 232]);
    expect(calls.text).toContainEqual(['R S', 338, 232]);
    expect(calls.text).toContainEqual(['1 / 1', 128, 232]);
    expect(calls.circle).toHaveLength(7);
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
