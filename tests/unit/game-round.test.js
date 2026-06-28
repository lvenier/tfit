import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  advanceGameTimer,
  GAME_TIMER_UNITS_PER_SECOND,
  guardFeedback,
  initialRoundMoveState,
  isRoundExpired,
  keepTryingFeedback,
  remainingRoundSeconds,
  roundDurationUnits,
  roundEndState,
  scoreTotal,
  shouldShowHitFeedback
} = require('../../js/game-round');

describe('TfitRound exports', () => {
  it('exposes round helpers for app.js', () => {
    expect(Object.keys(globalThis.TfitRound).sort()).toEqual([
      'GAME_TIMER_UNITS_PER_SECOND',
      'advanceGameTimer',
      'guardFeedback',
      'initialRoundMoveState',
      'isRoundExpired',
      'keepTryingFeedback',
      'remainingRoundSeconds',
      'roundDurationUnits',
      'roundEndState',
      'scoreTotal',
      'shouldShowHitFeedback'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-round');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitRound.remainingRoundSeconds({
      frameRate: 20,
      gameDuration: 400,
      gameTimer: 181
    })).toBe(3);
  });
});

describe('remainingRoundSeconds', () => {
  it('rounds remaining timer units up to the next second', () => {
    expect(remainingRoundSeconds({
      frameRate: 20,
      gameDuration: 400,
      gameTimer: 181
    })).toBe(3);
  });

  it('does not change speed when the configured frame rate changes', () => {
    const gameDuration = roundDurationUnits(30);
    const gameTimer = roundDurationUnits(12);

    expect(remainingRoundSeconds({ frameRate: 20, gameDuration, gameTimer })).toBe(18);
    expect(remainingRoundSeconds({ frameRate: 120, gameDuration, gameTimer })).toBe(18);
  });

  it('advances the timer by elapsed real time', () => {
    const state = {
      gameTimer: 0,
      gameTimerUpdatedAt: 1000
    };

    expect(advanceGameTimer(state, 1750)).toBe(75);
    expect(state.gameTimer).toBe(75);
    expect(state.gameTimerUpdatedAt).toBe(1750);
    expect(GAME_TIMER_UNITS_PER_SECOND).toBe(100);
  });

  it('advances by one timer unit when no prior update timestamp exists', () => {
    const state = { gameTimer: 4 };

    expect(advanceGameTimer(state, 2000)).toBe(1);
    expect(state.gameTimer).toBe(5);
    expect(state.gameTimerUpdatedAt).toBe(2000);
  });
});

describe('round bookkeeping', () => {
  it('detects round expiry from duration and timer', () => {
    expect(isRoundExpired({ gameDuration: 100, gameTimer: 99 })).toBe(false);
    expect(isRoundExpired({ gameDuration: 100, gameTimer: 100 })).toBe(true);
    expect(isRoundExpired({ gameDuration: 100, gameTimer: 101 })).toBe(true);
  });

  it('sums the score array', () => {
    expect(scoreTotal([1, 0, 1, 1])).toBe(3);
    expect(scoreTotal([])).toBe(0);
  });

  it('creates a fresh round move state from the moves list length', () => {
    expect(initialRoundMoveState([1, 2, 3])).toEqual({
      arrayScore: [0, 0, 0],
      curMoves: [],
      gameTimerNext: 0
    });
  });

  it('advances series when more rounds remain and records scored results', () => {
    expect(roundEndState({
      currentSeries: 1,
      curMoves: [{ hit: true }],
      gameSeries: 3,
      score: 1
    })).toEqual({
      gameResultNow: true,
      gameSeries: 2,
      shouldStartNextSeries: true
    });
  });

  it('resets series after the final round and skips empty results', () => {
    expect(roundEndState({
      currentSeries: 3,
      curMoves: [],
      gameSeries: 3,
      score: 0
    })).toEqual({
      gameResultNow: false,
      gameSeries: 1,
      shouldStartNextSeries: false
    });
  });
});

describe('shouldShowHitFeedback', () => {
  it('keeps the hit feedback visible for the first second after a hit', () => {
    expect(shouldShowHitFeedback({ hitSuccessTime: 5000, now: 5999 })).toBe(true);
    expect(shouldShowHitFeedback({ hitSuccessTime: 5000, now: 6000 })).toBe(false);
  });
});

describe('keepTryingFeedback', () => {
  const missedMoves = [
    { hit: true },
    { hit: false },
    { hit: false },
    { hit: false }
  ];

  it('shows feedback after three recent misses in the timing window', () => {
    expect(keepTryingFeedback({
      curMoves: missedMoves,
      guardWarningTime: 5500,
      hitSuccessTime: 2000,
      now: 5005,
      remainingSeconds: 10
    })).toEqual({
      playSound: true,
      show: true
    });
  });

  it('does not show feedback when the sound and visual window has passed', () => {
    expect(keepTryingFeedback({
      curMoves: missedMoves,
      guardWarningTime: 5500,
      hitSuccessTime: 1000,
      now: 5000,
      remainingSeconds: 10
    })).toEqual({
      playSound: false,
      show: false
    });
  });

  it('does not show feedback without three recent misses or enough time remaining', () => {
    expect(keepTryingFeedback({
      curMoves: [{ hit: false }, { hit: true }, { hit: false }, { hit: false }],
      guardWarningTime: 5500,
      hitSuccessTime: 2000,
      now: 5005,
      remainingSeconds: 10
    }).show).toBe(false);

    expect(keepTryingFeedback({
      curMoves: missedMoves,
      guardWarningTime: 5500,
      hitSuccessTime: 2000,
      now: 5005,
      remainingSeconds: 5
    }).show).toBe(false);
  });
});

describe('guardFeedback', () => {
  it('advances guard warning and shows the prompt inside the warning window', () => {
    expect(guardFeedback({
      gameTimer: 120,
      guardWarningTime: 5980,
      leftPoseTime: 2500,
      now: 5000,
      remainingSeconds: 10,
      rightPoseTime: 4900
    })).toEqual({
      guardWarningTime: 6080,
      playSound: true,
      show: true
    });
  });

  it('advances guard warning without showing the prompt before the warning delay', () => {
    expect(guardFeedback({
      gameTimer: 120,
      guardWarningTime: 5800,
      leftPoseTime: 2500,
      now: 5000,
      remainingSeconds: 10,
      rightPoseTime: 4900
    })).toEqual({
      guardWarningTime: 5900,
      playSound: false,
      show: false
    });
  });

  it('resets guard warning while guard is recent or the round is nearly over', () => {
    expect(guardFeedback({
      gameTimer: 120,
      guardWarningTime: 6000,
      leftPoseTime: 4900,
      now: 5000,
      remainingSeconds: 10,
      rightPoseTime: 4900
    })).toEqual({
      guardWarningTime: 5000,
      playSound: false,
      show: false
    });

    expect(guardFeedback({
      gameTimer: 120,
      guardWarningTime: 6000,
      leftPoseTime: 2500,
      now: 5000,
      remainingSeconds: 5,
      rightPoseTime: 2500
    }).guardWarningTime).toBe(5000);
  });

  it('caps runaway guard warning delay back to now', () => {
    expect(guardFeedback({
      gameTimer: 120,
      guardWarningTime: 20000,
      leftPoseTime: 2500,
      now: 5000,
      remainingSeconds: 10,
      rightPoseTime: 2500
    })).toEqual({
      guardWarningTime: 5000,
      playSound: false,
      show: false
    });
  });
});
