import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  comboFeedbackKey,
  hasComboBeforeHit,
  markHit
} = require('../../js/game-score');

describe('TfitScore exports', () => {
  it('exposes scoring helpers for app.js', () => {
    expect(Object.keys(globalThis.TfitScore).sort()).toEqual([
      'comboFeedbackKey',
      'hasComboBeforeHit',
      'markHit'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-score');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.TfitScore.comboFeedbackKey(() => 0)).toBe('great');
  });
});

describe('comboFeedbackKey', () => {
  it('maps the same random buckets as the original app feedback sounds', () => {
    expect(comboFeedbackKey(() => 0 / 20)).toBe('great');
    expect(comboFeedbackKey(() => 2 / 20)).toBe('awesome');
    expect(comboFeedbackKey(() => 4 / 20)).toBe('good');
    expect(comboFeedbackKey(() => 6 / 20)).toBe('perfect');
    expect(comboFeedbackKey(() => 8 / 20)).toBe('continue');
    expect(comboFeedbackKey(() => 10 / 20)).toBe('thats_it');
    expect(comboFeedbackKey(() => 12 / 20)).toBe('well_done');
    expect(comboFeedbackKey(() => 14 / 20)).toBeNull();
  });
});

describe('hasComboBeforeHit', () => {
  it('requires two previous scoring hits before the current hit', () => {
    const curMoves = [
      { type: 1, hit: true },
      { type: 2, hit: true },
      { type: 3, hit: true },
      { type: 4, hit: true },
      { type: 5, hit: true },
      { type: 6, hit: false }
    ];

    expect(hasComboBeforeHit(curMoves, 5)).toBe(true);
  });

  it('skips rests and stops counting at a miss', () => {
    expect(hasComboBeforeHit([
      { type: 1, hit: true },
      { type: 0, hit: true },
      { type: 2, hit: true },
      { type: 3, hit: false },
      { type: 4, hit: true },
      { type: 5, hit: false }
    ], 5)).toBe(false);

    expect(hasComboBeforeHit([
      { type: 1, hit: true },
      { type: 0, hit: true },
      { type: 2, hit: true },
      { type: 3, hit: true },
      { type: 4, hit: true },
      { type: 5, hit: false }
    ], 5)).toBe(true);
  });

  it('skips neutral moves while counting previous hits', () => {
    expect(hasComboBeforeHit([
      { type: 1, hit: true },
      { type: 2, hit: true },
      { type: 3, hit: true },
      { type: 4, hit: true },
      { type: 5, hit: true },
      { type: 0, hit: true },
      { type: 6, hit: false }
    ], 6)).toBe(true);
  });

  it('stops scanning once enough previous hits were found', () => {
    expect(hasComboBeforeHit([
      { type: 1, hit: true },
      { type: 2, hit: true },
      { type: 3, hit: true },
      { type: 4, hit: true },
      { type: 5, hit: true },
      { type: 6, hit: true },
      { type: 7, hit: false }
    ], 6)).toBe(true);
  });
});

describe('markHit', () => {
  it('marks score and move hit state, returning the hit timestamp once', () => {
    const arrayScore = [0];
    const curMoves = [{ type: 1, hit: false }];

    expect(markHit({
      arrayScore,
      curMoves,
      index: 0,
      now: 1234
    })).toEqual({ hitSuccess: 1234 });

    expect(arrayScore).toEqual([1]);
    expect(curMoves).toEqual([{ type: 1, hit: true }]);

    expect(markHit({
      arrayScore,
      curMoves,
      index: 0,
      now: 5678
    })).toEqual({ hitSuccess: null });
  });

  it('plays combo feedback only for first-time combo hits', () => {
    const played = [];
    const arrayScore = [1, 1, 1, 1, 1, 0];
    const curMoves = [
      { type: 1, hit: true },
      { type: 2, hit: true },
      { type: 3, hit: true },
      { type: 4, hit: true },
      { type: 5, hit: true },
      { type: 6, hit: false }
    ];

    markHit({
      arrayScore,
      curMoves,
      index: 5,
      playComboFeedback: key => played.push(key),
      random: () => 6 / 20
    });

    expect(played).toEqual(['perfect']);

    markHit({
      arrayScore,
      curMoves,
      index: 5,
      playComboFeedback: key => played.push(key),
      random: () => 0
    });

    expect(played).toEqual(['perfect']);
  });
});
