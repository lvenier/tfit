import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const flowApi = require('../../js/game-flow');

const STUBBED_GLOBALS = [
  'calibrationState',
  'cloneOpponent',
  'FRAME_RATE',
  'gameState',
  'hide_sensor',
  'LEVEL',
  'myWindowHeight',
  'randomInteger',
  'SHADOW_SPECIFIC',
  'sounds',
  'speechString',
  'storageNumber',
  'TfitGameLogic',
  'TfitScore',
  'timingState'
];

const originalGlobals = new Map();

function sound() {
  return { play: vi.fn() };
}

function installFlowGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  Object.assign(globalThis, {
    calibrationState: {
      left_init_pose_y: 10,
      right_init_pose_y: 20
    },
    cloneOpponent: vi.fn(id => ({ id, stamina: 6 })),
    FRAME_RATE: 20,
    gameState: {
      arrayScore: [],
      curMoves: [],
      feet_position: 1,
      gameCalibration: false,
      gameDuration: 0,
      gameLength: 30,
      gameStarted: false,
      gameTimer: -1,
      level: 1,
      menu: 2,
      moves: [],
      my_opponent: null,
      opponent: 0,
      score: 9,
      score_max: 0,
      score_max_prev: 0,
      shadow_focus: 0,
      song: { moveLength: 0, moves: [] }
    },
    hide_sensor: 64,
    LEVEL: 0,
    myWindowHeight: 480,
    randomInteger: vi.fn(() => 2),
    SHADOW_SPECIFIC: { 0: 'ALL', 1: 'JAB' },
    sounds: {
      awesome: sound(),
      click: sound(),
      continue: sound(),
      good: sound(),
      great: sound(),
      letsFight: sound(),
      perfect: sound(),
      punch: sound(),
      thatsIt: sound(),
      wellDone: sound()
    },
    speechString: null,
    storageNumber: vi.fn((_key, fallback) => fallback),
    TfitGameLogic: {
      countScoringMoves: vi.fn(moves => moves.filter(move => move > 0 && move !== 10).length),
      createEmptySong: vi.fn(() => ({ moveLength: 0, moves: [] })),
      createSongMoves: vi.fn(() => [0, 1, 2, 10]),
      isRecent: vi.fn((time, now) => now - time < 5000),
      levelDelay: vi.fn(() => 40)
    },
    TfitScore: {
      markHit: vi.fn(() => ({ hitSuccess: 1234 }))
    },
    timingState: {
      gameResult: 1000,
      guardWarning: 0,
      hitSuccess: 0,
      punchSoundTime: 1000
    }
  }, overrides);
}

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

describe('TfitFlow exports', () => {
  it('exposes flow helpers for app and mode files', () => {
    expect(Object.keys(flowApi).sort()).toEqual([
      'fetchSong',
      'gameResultBool',
      'hitSuccess',
      'letsfight',
      'loadSongmoves',
      'punchSound',
      'switch_feet'
    ]);
    expect(globalThis.TfitFlow).toBe(flowApi);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-flow');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(Object.keys(sandbox.TfitFlow).sort()).toEqual(Object.keys(flowApi).sort());
    expect(typeof sandbox.hitSuccess).toBe('function');
  });
});

describe('round flow helpers', () => {
  it('loads generated song moves and score maximum into state', () => {
    installFlowGlobals();

    flowApi.loadSongmoves();

    expect(globalThis.LEVEL).toBe(40);
    expect(globalThis.gameState.gameDuration).toBe(600);
    expect(globalThis.gameState.moves).toEqual([0, 1, 2, 10]);
    expect(globalThis.gameState.score_max).toBe(2);
    expect(globalThis.TfitGameLogic.createSongMoves).toHaveBeenCalledWith(expect.objectContaining({
      gameLength: 30,
      level: 1,
      menu: 2,
      shadowFocus: 0
    }));
  });

  it('reloads shadow focus from storage for fight mode move generation', () => {
    installFlowGlobals({
      gameState: {
        gameLength: 30,
        level: 1,
        menu: 4,
        shadow_focus: 0,
        song: { moveLength: 0, moves: [] }
      },
      storageNumber: vi.fn(() => 1)
    });

    flowApi.loadSongmoves();

    expect(globalThis.gameState.shadow_focus).toBe(1);
    expect(globalThis.TfitGameLogic.createSongMoves).toHaveBeenCalledWith(expect.objectContaining({
      menu: 4,
      shadowFocus: 1
    }));
  });

  it('starts a round from idle state', () => {
    installFlowGlobals();

    flowApi.letsfight(7000);

    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.letsFight.play).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState).toMatchObject({
      arrayScore: [],
      curMoves: [],
      feet_position: 0,
      gameCalibration: false,
      gameStarted: true,
      gameTimer: 0,
      my_opponent: { id: 0, stamina: 6 },
      score: 0,
      score_max_prev: 2
    });
    expect(globalThis.timingState.gameResult).toBe(1999);
    expect(globalThis.timingState.guardWarning).toBe(7000);
    expect(globalThis.hide_sensor).toBe(0);
  });

  it('reports blocked start attempts without resetting the round', () => {
    installFlowGlobals({ gameState: { gameCalibration: true } });
    flowApi.letsfight(7000);
    expect(globalThis.speechString).toBe('Calibrating !');

    installFlowGlobals({ gameState: { gameStarted: true } });
    flowApi.letsfight(7000);
    expect(globalThis.speechString).toBe('Already fighting !');
  });

  it('updates scoring state and feedback time through TfitScore', () => {
    installFlowGlobals({
      gameState: {
        arrayScore: [0],
        curMoves: [{ type: 1, hit: false }]
      },
      TfitScore: {
        markHit: vi.fn(({ playComboFeedback }) => {
          playComboFeedback('great');
          return { hitSuccess: 1234 };
        })
      }
    });

    flowApi.hitSuccess(0);

    expect(globalThis.TfitScore.markHit).toHaveBeenCalledWith(expect.objectContaining({
      arrayScore: [0],
      curMoves: [{ type: 1, hit: false }],
      index: 0
    }));
    expect(globalThis.timingState.hitSuccess).toBe(1234);
    expect(globalThis.sounds.great.play).toHaveBeenCalledTimes(1);
  });

  it('leaves feedback time unchanged when a hit was already scored', () => {
    installFlowGlobals({
      TfitScore: {
        markHit: vi.fn(() => ({ hitSuccess: null }))
      }
    });

    flowApi.hitSuccess(0);

    expect(globalThis.timingState.hitSuccess).toBe(0);
  });

  it('rate-limits punch sounds and checks recent game results', () => {
    installFlowGlobals();

    flowApi.punchSound(1500);
    expect(globalThis.sounds.punch.play).not.toHaveBeenCalled();

    flowApi.punchSound(2101);
    expect(globalThis.sounds.punch.play).toHaveBeenCalledTimes(1);
    expect(globalThis.timingState.punchSoundTime).toBe(2101);

    expect(flowApi.gameResultBool(5999)).toBe(true);
    expect(flowApi.gameResultBool(6000)).toBe(false);
  });

  it('switches feet and resets pose target heights from storage', () => {
    installFlowGlobals({
      storageNumber: vi.fn((key, fallback) => key === 'right_init_pose_y' ? 77 : fallback)
    });

    flowApi.switch_feet();

    expect(globalThis.gameState.feet_position).toBe(1);
    expect(globalThis.calibrationState.left_init_pose_y).toBe(77);
    expect(globalThis.calibrationState.right_init_pose_y).toBe(480 / 3);
  });

  it('fetches the placeholder song shape', () => {
    installFlowGlobals();

    flowApi.fetchSong();

    expect(globalThis.gameState.song).toEqual({ moveLength: 0, moves: [] });
  });
});
