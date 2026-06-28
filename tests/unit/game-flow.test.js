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
  'localStorage',
  'myWindowHeight',
  'OPPONENTS',
  'randomInteger',
  'SHADOW_SPECIFIC',
  'sounds',
  'speechString',
  'storageNumber',
  'TfitGameLogic',
  'TfitLayoutState',
  'TfitRound',
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
      caloriesBurned: 0,
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
    localStorage: {
      values: new Map([
        ['selected_player', 'player'],
        ['player', JSON.stringify({
          name: 'Laurent',
          caloriesBurned: 1.5,
          gameCounts: { fight: 4, shadow: 10, trainPad: 3 }
        })]
      ]),
      getItem(key) {
        return this.values.has(key) ? this.values.get(key) : null;
      },
      setItem(key, value) {
        this.values.set(key, value);
      }
    },
    myWindowHeight: 480,
    OPPONENTS: {
      0: { name: 'Raja', recovery: 2, stamina: 6 },
      1: { name: 'Theo', recovery: 3, stamina: 8 },
      2: { name: 'Vehbo', recovery: 2, stamina: 10 }
    },
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
    TfitLayoutState: {
      setLevelWindowBase: vi.fn(value => {
        globalThis.LEVEL = value;
        return value;
      }),
      snapshot: vi.fn(() => ({
        frameRate: globalThis.FRAME_RATE,
        height: globalThis.myWindowHeight,
        levelWindowBase: globalThis.LEVEL
      }))
    },
    TfitRound: {
      roundEndState: vi.fn(() => ({
        gameResultNow: true,
        gameSeries: 1,
        shouldStartNextSeries: false
      }))
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
  vi.useRealTimers();
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
      'finishRound',
      'gameResultBool',
      'hitSuccess',
      'letsfight',
      'loadSongmoves',
      'punchSound',
      'storeSelectedPlayerCalories',
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
    expect(globalThis.TfitLayoutState.setLevelWindowBase).toHaveBeenCalledWith(40);
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

  it('loads prebuilt song moves without generating a new sequence', () => {
    installFlowGlobals({
      gameState: {
        arrayScore: [],
        curMoves: [],
        gameDuration: 0,
        gameLength: 30,
        level: 2,
        menu: 2,
        moves: [],
        score_max: 0,
        shadow_focus: 0,
        song: { moveLength: 4, moves: [0, 1, 9, 10] }
      }
    });

    flowApi.loadSongmoves();

    expect(globalThis.gameState.gameDuration).toBe(600);
    expect(globalThis.gameState.moves).toEqual([0, 1, 9, 10]);
    expect(globalThis.gameState.score_max).toBe(2);
    expect(globalThis.TfitGameLogic.createSongMoves).not.toHaveBeenCalled();
    expect(globalThis.storageNumber).not.toHaveBeenCalledWith('shadow_focus', expect.any(Number));
  });

  it('starts a round from idle state', () => {
    installFlowGlobals();

    flowApi.letsfight(7000);

    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.letsFight.play).toHaveBeenCalledTimes(1);
    expect(globalThis.speechString).toBeNull();
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

  it('starts fight mode from stage one when the ladder is inactive', () => {
    installFlowGlobals({
      gameState: {
        fightLadderActive: false,
        fightStage: 3,
        fightVictoryCelebrationActive: true,
        menu: 4,
        opponent: 2,
        pendingFightOpponentStamina: 4
      }
    });

    flowApi.letsfight(7000);

    expect(globalThis.gameState).toMatchObject({
      fightLadderActive: true,
      fightStage: 1,
      fightVictoryCelebrationActive: false,
      gameStarted: true,
      my_opponent: { id: 0, stamina: 6 },
      opponent: 0,
      pendingFightOpponentStamina: null
    });
    expect(globalThis.speechString).toBe('STAGE 1');
    expect(globalThis.timingState.fightResultText).toBeNull();
    expect(globalThis.timingState.roundAnnouncementText).toBe('STAGE 1');
    expect(globalThis.timingState.roundAnnouncementNextText).toBe('ROUND 1');
    expect(globalThis.timingState.roundAnnouncementTime).toBe(7000);
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

  it('resets calories when starting the first series', () => {
    installFlowGlobals({
      gameState: {
        caloriesBurned: 4.2,
        gameCurrentSeries: 1,
        gameLength: 30,
        gameStarted: false,
        menu: 2,
        opponent: 0,
        score: 8,
        song: { moveLength: 0, moves: [] }
      }
    });

    flowApi.letsfight(10_000);

    expect(globalThis.gameState.caloriesBurned).toBe(0);
  });

  it('finishes a round, resets runtime state, and records result timing', () => {
    installFlowGlobals({
      animationState: {
        opponent: { delay: 3, frame: 4, reaction: { duration: 30, frame: 2, type: 3 }, type: 3 },
        player: { delay: 2, frame: 5, type: 5 }
      },
      gameState: {
        curMoves: [{ hit: true }],
        feet_position: 1,
        gameCalibration: true,
        gameCurrentSeries: 1,
        gameOver: true,
        gameSeries: 1,
        gameStarted: true,
        gameTimer: 42,
        my_opponent: { stamina: 1 },
        opponent: 0,
        score: 3
      },
      storageNumber: vi.fn((key, fallback) => key === 'left_init_pose_y' ? 123 : fallback)
    });
    const scheduleNextSeries = vi.fn();

    const roundEnd = flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(roundEnd).toEqual({
      gameResultNow: true,
      gameSeries: 1,
      shouldStartNextSeries: false
    });
    expect(globalThis.TfitRound.roundEndState).toHaveBeenCalledWith({
      currentSeries: 1,
      curMoves: [{ hit: true }],
      gameSeries: 1,
      score: 3
    });
    expect(globalThis.gameState).toMatchObject({
      feet_position: 0,
      gameCalibration: false,
      gameCurrentSeries: 1,
      gameOver: false,
      gameStarted: false,
      gameTimer: -1,
      my_opponent: { id: 0, stamina: 6 }
    });
    expect(globalThis.hide_sensor).toBe(0);
    expect(globalThis.animationState).toEqual({
      opponent: { delay: 0, frame: -1, reaction: null, type: 0 },
      player: { delay: 0, frame: -1, type: 0 }
    });
    expect(globalThis.timingState.gameResult).toBe(9000);
    expect(globalThis.calibrationState.left_init_pose_y).toBe(123);
    expect(globalThis.calibrationState.right_init_pose_y).toBe(480 / 3);
    expect(scheduleNextSeries).not.toHaveBeenCalled();
  });

  it('advances fight stage to the next opponent after a stamina win', () => {
    installFlowGlobals({
      cloneOpponent: vi.fn(id => ({
        id,
        recovery: id === 1 ? 3 : 2,
        stamina: id === 1 ? 8 : 6
      })),
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        fightEnding: true,
        fightLadderActive: true,
        fightStage: 1,
        gameCurrentSeries: 1,
        gameOver: true,
        gameSeries: 1,
        gameStarted: false,
        manualStop: true,
        menu: 4,
        my_opponent: { stamina: 0 },
        my_stamina: 6,
        opponent: 0,
        score: 1
      }
    });
    const scheduleNextSeries = vi.fn();

    flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(globalThis.gameState.opponent).toBe(1);
    expect(globalThis.gameState.fightStage).toBe(2);
    expect(globalThis.gameState.fightLadderActive).toBe(true);
    expect(globalThis.gameState.fightTransitionActive).toBe(true);
    expect(globalThis.gameState.fightTransitionText).toBe('NEXT: STAGE 2');
    expect(globalThis.gameState.my_opponent).toEqual({ id: 1, recovery: 3, stamina: 8 });
    expect(globalThis.gameState.my_stamina).toBe(8);
    expect(globalThis.gameState.pendingFightOpponentStamina).toBeNull();
    expect(globalThis.timingState.fightTransitionTime).toBe(9000);
    expect(scheduleNextSeries).toHaveBeenCalledTimes(1);
    expect(scheduleNextSeries.mock.calls[0][1]).toBe(6100);

    scheduleNextSeries.mock.calls[0][0]();

    expect(globalThis.gameState.gameStarted).toBe(true);
    expect(globalThis.gameState.fightTransitionActive).toBe(false);
    expect(globalThis.gameState.fightTransitionText).toBeNull();
    expect(globalThis.gameState.my_opponent).toEqual({ id: 1, recovery: 3, stamina: 8 });
  });

  it('ends the fight ladder after two opponents on easy level', () => {
    installFlowGlobals({
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        fightEnding: true,
        fightLadderActive: true,
        fightStage: 2,
        gameCurrentSeries: 1,
        gameOver: true,
        gameSeries: 1,
        gameStarted: false,
        level: 0,
        manualStop: true,
        menu: 4,
        my_opponent: { stamina: 0 },
        my_stamina: 6,
        opponent: 1,
        score: 1
      }
    });
    const scheduleNextSeries = vi.fn();

    flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(scheduleNextSeries).not.toHaveBeenCalled();
    expect(globalThis.gameState).toMatchObject({
      fightLadderActive: false,
      fightStage: 1,
      fightTransitionActive: false,
      opponent: 0
    });
  });

  it('uses the full opponent roster on hard level', () => {
    installFlowGlobals({
      cloneOpponent: vi.fn(id => ({
        id,
        name: id === 4 ? 'Lav' : `Opponent ${id}`,
        recovery: 2,
        stamina: 6 + id
      })),
      OPPONENTS: {
        0: { stamina: 6 },
        1: { stamina: 7 },
        2: { stamina: 8 },
        3: { stamina: 9 },
        4: { stamina: 10 }
      },
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        fightEnding: true,
        fightLadderActive: true,
        fightStage: 4,
        gameCurrentSeries: 1,
        gameOver: true,
        gameSeries: 1,
        gameStarted: false,
        level: 2,
        manualStop: true,
        menu: 4,
        my_opponent: { stamina: 0 },
        my_stamina: 6,
        opponent: 3,
        score: 1
      }
    });
    const scheduleNextSeries = vi.fn();

    flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(globalThis.gameState.opponent).toBe(4);
    expect(globalThis.gameState.fightStage).toBe(5);
    expect(globalThis.gameState.fightTransitionActive).toBe(true);
    expect(globalThis.gameState.fightTransitionText).toBe('NEXT: LAV');
    expect(globalThis.gameState.my_opponent).toEqual({ id: 4, name: 'Lav', recovery: 2, stamina: 10 });
    expect(scheduleNextSeries).toHaveBeenCalledTimes(1);
  });

  it('treats a missing opponent roster as a one-opponent fight', () => {
    installFlowGlobals({
      OPPONENTS: undefined,
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        fightEnding: true,
        fightLadderActive: true,
        fightStage: 1,
        gameCurrentSeries: 1,
        gameOver: true,
        gameSeries: 1,
        gameStarted: false,
        level: 2,
        manualStop: true,
        menu: 4,
        my_opponent: { stamina: 0 },
        my_stamina: 6,
        opponent: 0,
        score: 1
      }
    });
    const scheduleNextSeries = vi.fn();

    flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(globalThis.gameState.fightVictoryCelebrationActive).toBe(true);
    expect(globalThis.gameState.opponent).toBe(0);
    expect(scheduleNextSeries).not.toHaveBeenCalled();
  });

  it('recovers the current fight opponent and restarts the stage after timeout', () => {
    installFlowGlobals({
      cloneOpponent: vi.fn(id => ({ id, recovery: 2, stamina: 6 })),
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        fightLadderActive: true,
        fightStage: 1,
        gameCurrentSeries: 1,
        gameOver: true,
        gameSeries: 1,
        gameStarted: true,
        manualStop: false,
        menu: 4,
        my_opponent: { stamina: 3 },
        my_stamina: 4,
        opponent: 0,
        score: 1
      }
    });
    const scheduleNextSeries = vi.fn();

    flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(globalThis.gameState.opponent).toBe(0);
    expect(globalThis.gameState.fightStage).toBe(1);
    expect(globalThis.gameState.gameCurrentSeries).toBe(2);
    expect(globalThis.gameState.pendingFightOpponentStamina).toBe(5);
    expect(globalThis.gameState.fightTransitionActive).toBe(true);
    expect(globalThis.gameState.fightTransitionText).toBe('ROUND 2');
    expect(globalThis.timingState.fightTransitionTime).toBe(9000);
    expect(scheduleNextSeries).toHaveBeenCalledTimes(1);
    expect(scheduleNextSeries.mock.calls[0][1]).toBe(5100);

    scheduleNextSeries.mock.calls[0][0]();

    expect(globalThis.gameState.gameStarted).toBe(true);
    expect(globalThis.gameState.fightTransitionActive).toBe(false);
    expect(globalThis.gameState.my_opponent).toEqual({ id: 0, recovery: 2, stamina: 5 });
    expect(globalThis.gameState.pendingFightOpponentStamina).toBeNull();
    expect(globalThis.sounds.letsFight.play).not.toHaveBeenCalled();
    expect(globalThis.speechString).toBe('ROUND 2');
    expect(globalThis.timingState.roundAnnouncementText).toBe('ROUND 2');
    expect(globalThis.timingState.roundAnnouncementNextText).toBeNull();
  });

  it('schedules the next series when round end state asks for it', () => {
    installFlowGlobals({
      gameState: {
        curMoves: [{ hit: true }],
        caloriesBurned: 0.8,
        gameCurrentSeries: 1,
        gameSeries: 3,
        opponent: 0,
        score: 2
      },
      TfitRound: {
        roundEndState: vi.fn(() => ({
          gameResultNow: false,
          gameSeries: 2,
          shouldStartNextSeries: true
        }))
      }
    });
    const scheduleNextSeries = vi.fn();

    const roundEnd = flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(roundEnd.shouldStartNextSeries).toBe(true);
    expect(globalThis.timingState.gameResult).toBe(1000);
    expect(globalThis.gameState.gameCurrentSeries).toBe(2);
    expect(scheduleNextSeries).toHaveBeenCalledTimes(1);
    expect(JSON.parse(globalThis.localStorage.values.get('player')).caloriesBurned).toBe(1.5);

    scheduleNextSeries.mock.calls[0][0]();

    expect(globalThis.sounds.click.play).toHaveBeenCalledTimes(1);
    expect(globalThis.sounds.letsFight.play).toHaveBeenCalledTimes(1);
    expect(globalThis.gameState.gameStarted).toBe(true);
  });

  it('stores calories without completing the fight count between ladder stages', () => {
    installFlowGlobals({
      gameState: {
        curMoves: [{ hit: true }],
        caloriesBurned: 0.7,
        gameCurrentSeries: 1,
        gameSeries: 3,
        menu: 4,
        opponent: 0,
        score: 2
      },
      TfitRound: {
        roundEndState: vi.fn(() => ({
          gameResultNow: false,
          gameSeries: 2,
          shouldStartNextSeries: true
        }))
      }
    });
    const scheduleNextSeries = vi.fn();

    const roundEnd = flowApi.finishRound({ now: 9000, scheduleNextSeries });

    expect(roundEnd.shouldStartNextSeries).toBe(true);
    expect(globalThis.gameState.gameCurrentSeries).toBe(1);
    expect(globalThis.gameState.gameStarted).toBe(false);
    expect(scheduleNextSeries).not.toHaveBeenCalled();
    expect(JSON.parse(globalThis.localStorage.values.get('player'))).toMatchObject({
      caloriesBurned: 2.2,
      gameCounts: { fight: 4, shadow: 10, trainPad: 3 },
      lastCaloriesBurned: 0.7
    });
  });

  it('does not increment game counts when a game is stopped before completion', () => {
    installFlowGlobals({
      gameState: {
        curMoves: [{ hit: true }],
        caloriesBurned: 0.7,
        gameCurrentSeries: 1,
        gameSeries: 3,
        manualStop: true,
        menu: 4,
        opponent: 0,
        score: 2
      }
    });

    flowApi.finishRound({ now: 9000, scheduleNextSeries: vi.fn() });

    expect(JSON.parse(globalThis.localStorage.values.get('player'))).toMatchObject({
      caloriesBurned: 2.2,
      gameCounts: { fight: 4, shadow: 10, trainPad: 3 },
      lastCaloriesBurned: 0.7
    });
  });

  it('increments fight count when the final fight stage completes by stamina ending', () => {
    installFlowGlobals({
      gameState: {
        curMoves: [{ hit: true }],
        caloriesBurned: 0.9,
        fightEnding: true,
        gameCurrentSeries: 1,
        gameSeries: 3,
        manualStop: true,
        menu: 4,
        my_opponent: { stamina: 0 },
        opponent: 2,
        score: 2
      }
    });

    flowApi.finishRound({ now: 9000, scheduleNextSeries: vi.fn() });

    expect(globalThis.gameState.fightVictoryCelebrationActive).toBe(true);
    expect(globalThis.gameState.fightVictoryCelebrationTime).toBe(9000);
    expect(globalThis.gameState.opponent).toBe(0);
    expect(globalThis.gameState.my_opponent).toEqual({ id: 0, stamina: 6 });
    expect(globalThis.gameState.my_stamina).toBe(6);
    expect(globalThis.timingState.gameResult).toBe(9000);
    expect(JSON.parse(globalThis.localStorage.values.get('player'))).toMatchObject({
      caloriesBurned: 2.4,
      gameCounts: { fight: 5, shadow: 10, trainPad: 3 },
      lastCaloriesBurned: 0.9
    });
  });

  it('stores selected player calories and game counts for a completed game', () => {
    installFlowGlobals({
      gameState: {
        caloriesBurned: 2.4,
        menu: 2
      }
    });

    expect(flowApi.storeSelectedPlayerCalories()).toEqual({
      key: 'player',
      caloriesBurned: 3.9,
      gameCounts: { fight: 4, shadow: 11, trainPad: 3 },
      lastCaloriesBurned: 2.4
    });
    expect(JSON.parse(globalThis.localStorage.values.get('player'))).toMatchObject({
      caloriesBurned: 3.9,
      gameCounts: { fight: 4, shadow: 11, trainPad: 3 },
      lastCaloriesBurned: 2.4
    });
  });

  it('stores a game count even when no calories were burned', () => {
    installFlowGlobals({
      gameState: {
        caloriesBurned: 0,
        menu: 3
      }
    });

    expect(flowApi.storeSelectedPlayerCalories()).toMatchObject({
      key: 'player',
      caloriesBurned: 1.5,
      gameCounts: { fight: 4, shadow: 10, trainPad: 4 },
      lastCaloriesBurned: 0
    });
  });

  it('skips profile stats storage when storage is unavailable', () => {
    installFlowGlobals();

    expect(flowApi.storeSelectedPlayerCalories(null)).toBeNull();
    expect(flowApi.storeSelectedPlayerCalories({ getItem: () => null })).toBeNull();
  });

  it('recovers profile stats storage when stored profile JSON is invalid', () => {
    installFlowGlobals({
      gameState: {
        caloriesBurned: 1.2,
        menu: 4
      }
    });
    globalThis.localStorage.values.set('player', '{bad json');

    expect(flowApi.storeSelectedPlayerCalories()).toEqual({
      key: 'player',
      caloriesBurned: 1.2,
      gameCounts: { fight: 1, shadow: 0, trainPad: 0 },
      lastCaloriesBurned: 1.2
    });
  });

  it('uses the default player key and empty object fallback for profile stat storage', () => {
    installFlowGlobals({
      gameState: {
        caloriesBurned: 0.5,
        menu: 2
      }
    });
    globalThis.localStorage.values.delete('selected_player');
    globalThis.localStorage.values.set('player', 'null');

    expect(flowApi.storeSelectedPlayerCalories()).toEqual({
      key: 'player',
      caloriesBurned: 0.5,
      gameCounts: { fight: 0, shadow: 1, trainPad: 0 },
      lastCaloriesBurned: 0.5
    });
  });

  it('uses a delayed restart when no scheduler override is provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(12_000);
    installFlowGlobals({
      gameState: {
        curMoves: [{ hit: true }],
        gameCurrentSeries: 1,
        gameSeries: 2,
        opponent: 0,
        score: 2
      },
      TfitRound: {
        roundEndState: vi.fn(() => ({
          gameResultNow: false,
          gameSeries: 2,
          shouldStartNextSeries: true
        }))
      }
    });

    flowApi.finishRound({ now: 9000 });

    expect(globalThis.gameState.gameStarted).toBe(false);

    vi.advanceTimersByTime(5100);

    expect(globalThis.gameState.gameStarted).toBe(true);
    expect(globalThis.timingState.guardWarning).toBe(17_100);
  });
});
