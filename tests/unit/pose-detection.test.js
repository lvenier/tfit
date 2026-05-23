import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  hasPoseConfidence,
  isInsideGuard,
  posePartsFromPoses
} = require('../../js/pose-detection');

describe('TfitPoseDetection exports', () => {
  it('exposes pose helpers for mode modules', () => {
    expect(Object.keys(globalThis.TfitPoseDetection).sort()).toEqual([
      'hasPoseConfidence',
      'isInsideGuard',
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
    expect(isInsideGuard({ x: 8, y: 20, confidence: 0.2 }, 20, 40, 4, 2)).toBe(false);
    expect(isInsideGuard({ x: 8.1, y: 20, confidence: 0.2 }, 20, 40, 4, 2)).toBe(true);
  });
});
