import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  areBothHandsRecent,
  detectDodgeGestures,
  detectHandGestures,
  hasPoseConfidence,
  isInsideGuard,
  isInsideTarget,
  isPadPunchHit,
  isTimedGestureActive,
  moveMatchesRecentGesture,
  nextDownDodgeState,
  posePartsFromPoses
} = require('../../js/pose-detection');

describe('TfitPoseDetection exports', () => {
  it('exposes pose helpers for mode modules', () => {
    expect(Object.keys(globalThis.TfitPoseDetection).sort()).toEqual([
      'areBothHandsRecent',
      'detectDodgeGestures',
      'detectHandGestures',
      'hasPoseConfidence',
      'isInsideGuard',
      'isInsideTarget',
      'isPadPunchHit',
      'isTimedGestureActive',
      'moveMatchesRecentGesture',
      'nextDownDodgeState',
      'posePartsFromPoses'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/pose-detection');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitPoseDetection.hasPoseConfidence({ confidence: 0.2 })).toBe(true);
  });

  it('uses the fallback layout when no layout module is available', () => {
    const modulePath = require.resolve('../../js/pose-detection');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitPoseDetection.isInsideGuard(
      { confidence: 0.9, x: 320, y: 240 },
      320,
      240,
      24
    )).toBe(true);
  });

  it('uses the fallback layout when the layout module has no snapshot helper', () => {
    const modulePath = require.resolve('../../js/pose-detection');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      TfitLayoutState: {}
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitPoseDetection.isInsideGuard(
      { confidence: 0.9, x: 320, y: 240 },
      320,
      240,
      24
    )).toBe(true);
  });

  it('uses the configured layout snapshot when available in a browser context', () => {
    const modulePath = require.resolve('../../js/pose-detection');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      TfitLayoutState: {
        snapshot: () => ({
          width: 1280,
          height: 960
        })
      }
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitPoseDetection.isInsideGuard(
      { confidence: 0.9, x: 160, y: 120 },
      320,
      240,
      24
    )).toBe(true);
  });
});

describe('posePartsFromPoses', () => {
  it('extracts the pose parts used by the gameplay modes', () => {
    const pose = {
      left_wrist: { x: 1, y: 2, confidence: 0.3 },
      nose: { x: 3, y: 4, confidence: 0.4 },
      right_wrist: { x: 5, y: 6, confidence: 0.5 }
    };

    expect(posePartsFromPoses([pose])).toEqual({
      leftHand: pose.left_wrist,
      nose: pose.nose,
      pose,
      rightHand: pose.right_wrist
    });
  });

  it('returns empty parts when no pose is available', () => {
    expect(posePartsFromPoses([])).toEqual({
      leftHand: undefined,
      nose: undefined,
      pose: undefined,
      rightHand: undefined
    });
  });
});

describe('hasPoseConfidence', () => {
  it('requires confidence strictly above the threshold', () => {
    expect(hasPoseConfidence({ confidence: 0.11 })).toBe(true);
    expect(hasPoseConfidence({ confidence: 0.1 })).toBe(false);
    expect(hasPoseConfidence({ confidence: 0.5 }, 0.6)).toBe(false);
    expect(hasPoseConfidence(null)).toBe(false);
  });
});

describe('isInsideGuard', () => {
  it('checks confidence and scaled guard bounds', () => {
    expect(isInsideGuard({ x: 10, y: 20, confidence: 0.2 }, 20, 40, 24, 2)).toBe(true);
    expect(isInsideGuard({ x: -10, y: 20, confidence: 0.2 }, 20, 40, 24, 2)).toBe(false);
    expect(isInsideGuard({ x: 10, y: 20, confidence: 0.1 }, 20, 40, 24, 2)).toBe(false);
  });

  it('keeps guard bounds exclusive like the original comparisons', () => {
    expect(isInsideGuard({ x: 16, y: 20, confidence: 0.2 }, 20, 40, 4, 2)).toBe(false);
    expect(isInsideGuard({ x: 16.1, y: 40, confidence: 0.2 }, 20, 40, 4, 2)).toBe(true);
  });
});

describe('target and timing helpers', () => {
  it('checks target hit bounds with the original vertical overlap formula', () => {
    expect(isInsideTarget({ x: 10, y: 20, confidence: 0.2 }, 20, 40, 24, 2)).toBe(true);
    expect(isInsideTarget({ x: -10, y: 20, confidence: 0.2 }, 20, 40, 24, 2)).toBe(false);
    expect(isInsideTarget({ x: 10, y: 20, confidence: 0.1 }, 20, 40, 24, 2)).toBe(false);
  });

  it('checks recent hand guard and gesture windows', () => {
    expect(areBothHandsRecent(1000, 960, 970, 50)).toBe(true);
    expect(areBothHandsRecent(1000, 949, 970, 50)).toBe(false);
    expect(isTimedGestureActive(1000, 980, 960, 50)).toBe(true);
    expect(isTimedGestureActive(1000, 940, 960, 50)).toBe(false);
    expect(isTimedGestureActive(1000, 980, 940, 30)).toBe(false);
  });
});

describe('detectHandGestures', () => {
  const baseOptions = {
    coef: 1,
    initJabY: 100,
    initUppercutY: 250,
    leftHookX: 120,
    leftPoseTime: 980,
    levelWindow: 50,
    now: 1000,
    rightHookX: 420,
    rightPoseTime: 990
  };

  it('detects left hand jab, hook, and uppercut while both hands are recent', () => {
    expect(detectHandGestures({
      ...baseOptions,
      hand: { x: 100, y: 90, confidence: 0.2 },
      side: 'left'
    })).toEqual({
      hook: true,
      jab: true,
      uppercut: false
    });

    expect(detectHandGestures({
      ...baseOptions,
      hand: { x: 130, y: 260, confidence: 0.2 },
      side: 'left'
    })).toEqual({
      hook: false,
      jab: false,
      uppercut: true
    });
  });

  it('detects right hook and ignores stale guards or low confidence', () => {
    expect(detectHandGestures({
      ...baseOptions,
      hand: { x: 430, y: 200, confidence: 0.2 },
      side: 'right'
    }).hook).toBe(true);

    expect(detectHandGestures({
      ...baseOptions,
      hand: { x: 430, y: 90, confidence: 0.2 },
      leftPoseTime: 900,
      side: 'right'
    })).toEqual({
      hook: false,
      jab: false,
      uppercut: false
    });
  });
});

describe('detectDodgeGestures', () => {
  it('detects left, right, and down dodges when ready', () => {
    expect(detectDodgeGestures({
      initUppercutY: 250,
      leftGuardX: 200,
      nose: { x: 160, y: 260, confidence: 0.2 },
      objectPoseSize: 48,
      ready: true,
      rightGuardX: 440
    })).toEqual({
      down: true,
      left: true,
      right: false
    });

    expect(detectDodgeGestures({
      initUppercutY: 250,
      leftGuardX: 200,
      nose: { x: 470, y: 200, confidence: 0.2 },
      objectPoseSize: 48,
      ready: true,
      rightGuardX: 440
    })).toMatchObject({ right: true });
  });

  it('requires readiness and confidence', () => {
    expect(detectDodgeGestures({
      initUppercutY: 250,
      leftGuardX: 200,
      nose: { x: 160, y: 260, confidence: 0.2 },
      objectPoseSize: 48,
      ready: false,
      rightGuardX: 440
    })).toEqual({
      down: false,
      left: false,
      right: false
    });
  });
});

describe('moveMatchesRecentGesture', () => {
  const timings = {
    downDodge: 980,
    leftDodge: 980,
    leftHook: 970,
    leftJab: 980,
    leftPoses: 960,
    leftUppercut: 980,
    levelWindow: 50,
    now: 1000,
    rightDodge: 980,
    rightHook: 980,
    rightJab: 980,
    rightPoses: 970,
    rightUppercut: 980
  };

  it('matches all scoring move types to their recent gesture timing', () => {
    for (const moveType of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(moveMatchesRecentGesture({ ...timings, moveType })).toBe(true);
    }
  });

  it('rejects stale or unknown move types', () => {
    expect(moveMatchesRecentGesture({ ...timings, leftJab: 900, moveType: 1 })).toBe(false);
    expect(moveMatchesRecentGesture({ ...timings, moveType: 10 })).toBe(false);
  });
});

describe('pad detection helpers', () => {
  it('checks pad punch hits against target overlap and guard timing', () => {
    expect(isPadPunchHit({
      guardTime: 970,
      hand: { x: 100, y: 100, confidence: 0.2 },
      levelWindow: 50,
      now: 1000,
      objectPoseSize: 24,
      padX: 100,
      padY: 100
    })).toBe(true);

    expect(isPadPunchHit({
      guardTime: 900,
      hand: { x: 100, y: 100, confidence: 0.2 },
      levelWindow: 50,
      now: 1000,
      objectPoseSize: 24,
      padX: 100,
      padY: 100
    })).toBe(false);
  });

  it('advances down-dodge state after moving below then back above the line', () => {
    expect(nextDownDodgeState({
      done: false,
      initUppercutY: 200,
      nose: { x: 0, y: 220, confidence: 0.2 },
      switched: false
    })).toEqual({
      done: true,
      switched: false,
      touchedDown: true
    });

    expect(nextDownDodgeState({
      done: true,
      initUppercutY: 200,
      nose: { x: 0, y: 180, confidence: 0.2 },
      switched: false
    })).toEqual({
      done: false,
      switched: true,
      touchedDown: false
    });

    expect(nextDownDodgeState({
      done: false,
      initUppercutY: 200,
      nose: { x: 0, y: 180, confidence: 0.2 },
      switched: false
    })).toEqual({
      done: false,
      switched: false,
      touchedDown: false
    });
  });
});
