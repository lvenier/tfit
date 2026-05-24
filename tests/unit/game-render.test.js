import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const renderApi = require('../../js/game-render');

const STUBBED_GLOBALS = [
  'arc',
  'arrayScore',
  'images',
  'BOLD',
  'calibrationState',
  'CENTER',
  'circle',
  'coef',
  'cos',
  'curMoves',
  'ellipse',
  'feet_position',
  'fill',
  'FRAME_RATE',
  'gameCurrentSeries',
  'gameDuration',
  'gameLengthIndex',
  'gameSeries',
  'gameTimer',
  'hide_sensor',
  'image',
  'LEFT',
  'level',
  'loading_k',
  'loading_m',
  'map',
  'menu',
  'my_opponent',
  'myWindowHeight',
  'myWindowWidth',
  'noFill',
  'NORMAL',
  'noStroke',
  'OBJECT_POSE_SIZE',
  'OPPONENTS',
  'opponent',
  'PI',
  'pop',
  'push',
  'quad',
  'radians',
  'rect',
  'rectMode',
  'resetMatrix',
  'score',
  'score_max',
  'score_max_prev',
  'shadow_focus',
  'SHADOW_SPECIFIC',
  'sin',
  'song_result',
  'speechString',
  'stroke',
  'strokeWeight',
  'text',
  'textAlign',
  'textSize',
  'textStyle',
  'tint',
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

  Object.assign(globalThis, {
    arrayScore: [],
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
    curMoves: [],
    feet_position: 0,
    FRAME_RATE: 20,
    gameCurrentSeries: 1,
    gameDuration: 600,
    gameLengthIndex: 2,
    gameSeries: 3,
    gameTimer: 19,
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
    level: 1,
    loading_k: 0,
    loading_m: 0,
    map: (value, start1, stop1, start2, stop2) => start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2),
    menu: 2,
    my_opponent: { stamina: 4 },
    myWindowHeight: 480,
    myWindowWidth: 640,
    NORMAL: 'normal',
    OBJECT_POSE_SIZE: 48,
    OPPONENTS: { 0: { stamina: 6 } },
    opponent: 0,
    PI: Math.PI,
    radians: degrees => degrees * Math.PI / 180,
    score: 0,
    score_max: 10,
    score_max_prev: 8,
    shadow_focus: 1,
    SHADOW_SPECIFIC: { 1: 'JAB' },
    sin: Math.sin,
    song_result: {},
    speechString: 'keep guard',
    width: 640
  }, overrides);
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
      'renderShadowResult',
      'renderSpeech'
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

    expect(calls.tint[0]).toEqual([255, 236]);
    expect(calls.image).toContainEqual([asset('bg2'), 0, 0, 640, 480]);
    expect(calls.image).toContainEqual([asset('shadow'), 640 / 6, 80, 100, 50]);
    expect(calls.image).toContainEqual([asset('config'), 640 / 6, 380, 100, 50]);
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
    expect(calls.text).toContainEqual(['(T)ype: jab', 15, 36]);
    expect(calls.text).toContainEqual(['(S)eries: 1 / 3', 15, 56]);
    expect(calls.arc[1][5]).toBeCloseTo(54);
  });

  it('renders fight meters with reduced opponent stamina', () => {
    renderApi.renderFightMeters();

    expect(calls.rect).toContainEqual([245, 15, 150, 20]);
    expect(calls.rect).toContainEqual([247, 17, 100, 16]);
    expect(calls.rect).toContainEqual([247, 45, 148, 16]);
  });

  it('skips the opponent stamina refill when stamina is depleted', () => {
    installRenderGlobals({ my_opponent: { stamina: 0 } });

    renderApi.renderFightMeters();

    expect(calls.rect).not.toContainEqual([247, 17, 4, 16]);
    expect(calls.rect.filter(args => args[1] === 17)).toHaveLength(1);
  });

  it('renders the active feet indicator image', () => {
    renderApi.renderFeetIndicator();
    expect(calls.image).toContainEqual([asset('left-foot'), 296, 50, 48, 48]);

    installRenderGlobals({ feet_position: 1 });
    renderApi.renderFeetIndicator();
    expect(calls.image).toContainEqual([asset('right-foot'), 296, 50, 48, 48]);
  });
});

describe('renderShadowResult', () => {
  it('summarizes scoring moves by type and draws result markers', () => {
    installRenderGlobals({
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
    });

    renderApi.renderShadowResult();

    expect(globalThis.score).toBe(5);
    expect(globalThis.song_result.score).toBe(5);
    expect(globalThis.song_result.length).toBe(8);
    expect(globalThis.song_result['1']).toMatchObject({ success: 1, total: 1, text: 'J' });
    expect(globalThis.song_result['2']).toMatchObject({ success: 0, total: 1, text: 'S' });
    expect(globalThis.song_result['9']).toMatchObject({ success: 1, total: 1, text: 'D' });
    expect(calls.text).toContainEqual(['Score: 5 / 8', 276, 96]);
    expect(calls.text).toContainEqual(['L_J', 244, 151]);
    expect(calls.text).toContainEqual(['R_S', 504, 151]);
    expect(calls.circle).toHaveLength(6);
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
