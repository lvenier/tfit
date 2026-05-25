import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  calibrationDefaults,
  countScoringMoves,
  createEmptySong,
  createSongMoves,
  detectStartCondition,
  isRecent,
  levelDelay,
  moveDisplay,
  moveRangeForFocus,
  nextFrameRate,
  nextOneBasedIndex,
  nextZeroBasedIndex,
  shouldRestAtIndex
} = require('../../js/game-logic');

describe('TfitGameLogic browser export', () => {
  it('exposes the logic API on globalThis for app.js', () => {
    expect(globalThis.TfitGameLogic).toMatchObject({
      calibrationDefaults,
      createSongMoves,
      detectStartCondition,
      moveDisplay,
      nextFrameRate
    });
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-logic');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitGameLogic.nextFrameRate(120)).toBe(20);
    expect(sandbox.TfitGameLogic.createEmptySong()).toMatchObject({ moves: [], moveLength: 0 });
  });
});

describe('song move generation', () => {
  it('creates the default empty song shape', () => {
    expect(createEmptySong()).toEqual({
      name: "",
      url: "",
      author: "",
      moves: [],
      length: 120,
      moveLength: 0
    });
  });

  it('maps shadow focus values to move ranges', () => {
    expect(moveRangeForFocus(0)).toEqual([1, 9]);
    expect(moveRangeForFocus(1)).toEqual([1, 2]);
    expect(moveRangeForFocus(2)).toEqual([3, 4]);
    expect(moveRangeForFocus(3)).toEqual([5, 6]);
    expect(moveRangeForFocus(4)).toEqual([7, 9]);
    expect(moveRangeForFocus(5)).toEqual([1, 6]);
    expect(moveRangeForFocus(99)).toEqual([1, 9]);
  });

  it('adds rest beats based on level', () => {
    expect(shouldRestAtIndex(4, 0)).toBe(true);
    expect(shouldRestAtIndex(5, 0)).toBe(false);
    expect(shouldRestAtIndex(10, 1)).toBe(true);
    expect(shouldRestAtIndex(11, 1)).toBe(false);
    expect(shouldRestAtIndex(10, 2)).toBe(false);
  });

  it('generates moves with leading and trailing rest beats', () => {
    const moves = createSongMoves({
      gameLength: 10,
      level: 2,
      menu: 3,
      randomInteger: (min, max) => max,
      shadowFocus: 1
    });

    expect(moves).toEqual([0, 0, 2, 2, 2, 0, 0, 0, 0, 0]);
  });

  it('uses easy level rests and adds switch guard in shadow mode', () => {
    const moves = createSongMoves({
      gameLength: 12,
      level: 0,
      menu: 2,
      randomInteger: (min) => min,
      shadowFocus: 5
    });

    expect(moves).toEqual([0, 0, 0, 1, 0, 1, 10, 0, 0, 0, 0, 0]);
  });

  it('counts only scoring moves', () => {
    expect(countScoringMoves([0, 1, 2, 10, 0, 9])).toBe(3);
  });
});

describe('option and timing helpers', () => {
  it('computes level delay', () => {
    expect(levelDelay(0)).toBe(50);
    expect(levelDelay(1)).toBe(40);
    expect(levelDelay(2)).toBe(30);
  });

  it('checks recent timestamps', () => {
    expect(isRecent(1000, 5999)).toBe(true);
    expect(isRecent(1000, 6000)).toBe(false);
  });

  it('cycles frame rate values', () => {
    expect(nextFrameRate(20)).toBe(40);
    expect(nextFrameRate(100)).toBe(120);
    expect(nextFrameRate(120)).toBe(20);
  });

  it('cycles one-based and zero-based option indexes', () => {
    expect(nextOneBasedIndex(1, 5)).toBe(2);
    expect(nextOneBasedIndex(5, 5)).toBe(1);
    expect(nextZeroBasedIndex(0, 3)).toBe(1);
    expect(nextZeroBasedIndex(2, 3)).toBe(0);
  });
});

describe('moveDisplay', () => {
  it('maps punch and dodge move types to display colors and labels', () => {
    expect(moveDisplay(1, 0, 192)).toEqual({ color: [100, 100, 0, 192], text: "J" });
    expect(moveDisplay(2, 0, 192)).toEqual({ color: [100, 100, 0, 192], text: "S" });
    expect(moveDisplay(3, 0, 192)).toEqual({ color: [100, 0, 100, 192], text: "H" });
    expect(moveDisplay(4, 0, 192)).toEqual({ color: [100, 0, 100, 192], text: "H" });
    expect(moveDisplay(5, 0, 192)).toEqual({ color: [0, 100, 100, 192], text: "U" });
    expect(moveDisplay(6, 0, 192)).toEqual({ color: [0, 100, 100, 192], text: "U" });
    expect(moveDisplay(7, 0, 192)).toEqual({ color: [0, 0, 100, 192], text: "D" });
    expect(moveDisplay(8, 0, 192)).toEqual({ color: [0, 0, 100, 192], text: "D" });
    expect(moveDisplay(9, 0, 192)).toEqual({ color: [0, 0, 200, 192], text: "D" });
    expect(moveDisplay(10, 0, 192)).toEqual({ color: [224, 224, 224, 192], text: "S" });
  });

  it('swaps jab and straight labels when feet are switched', () => {
    expect(moveDisplay(1, 1, 128).text).toBe("S");
    expect(moveDisplay(2, 1, 128).text).toBe("J");
  });

  it('handles late move type branches with default display alpha', () => {
    expect(moveDisplay(9)).toEqual({ color: [0, 0, 200, 128], text: "D" });
    expect(moveDisplay(10)).toEqual({ color: [224, 224, 224, 128], text: "S" });
    expect(moveDisplay(11)).toBeNull();
  });

  it('returns null for rest or unknown move types', () => {
    expect(moveDisplay(0)).toBeNull();
    expect(moveDisplay(99)).toBeNull();
  });
});

describe('calibration defaults', () => {
  it('matches the app calibration formulas', () => {
    expect(calibrationDefaults(640, 480, 48, 1)).toEqual({
      left_init_pose_x: 640 / 3,
      left_init_pose_y: 160,
      right_init_pose_x: 1280 / 3,
      right_init_pose_y: 160,
      init_jab_y: 112,
      init_uppercut_y: 208,
      left_init_hook_x: 640 / 3 - 48,
      right_init_hook_x: 1280 / 3 + 48
    });
  });
});

describe('detectStartCondition', () => {
  const readyPose = {
    left_wrist: { confidence: 0.2, x: 1, y: 2 },
    right_wrist: { confidence: 0.3, x: 3, y: 4 },
    nose: { confidence: 0.4, x: 5, y: 6 }
  };

  it('marks the game ready when both hands and nose are detected', () => {
    const result = detectStartCondition({
      errorTimer: 5,
      gameReady: false,
      poses: [readyPose]
    });

    expect(result).toMatchObject({
      error: "",
      errorTimer: 6,
      gameReady: true,
      leftHand: readyPose.left_wrist,
      nose: readyPose.nose,
      pose: readyPose,
      rightHand: readyPose.right_wrist
    });
  });

  it('keeps waiting until all required parts pass confidence threshold', () => {
    const result = detectStartCondition({
      errorTimer: 499,
      gameReady: false,
      poses: [{ ...readyPose, nose: { confidence: 0.1 } }]
    });

    expect(result.gameReady).toBe(false);
    expect(result.errorTimer).toBe(500);
    expect(result.error).toBe("");
  });

  it('returns an error after too many attempts', () => {
    const result = detectStartCondition({
      errorTimer: 500,
      gameReady: false,
      poses: []
    });

    expect(result.gameReady).toBe(false);
    expect(result.errorTimer).toBe(501);
    expect(result.error).toBe("We failed to detect hands or others.");
  });

  it('resets the timer when already ready', () => {
    expect(detectStartCondition({
      errorTimer: 10,
      gameReady: true,
      poses: []
    })).toMatchObject({
      errorTimer: 0,
      gameReady: true
    });
  });
});
