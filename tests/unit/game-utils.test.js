import { beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  cloneFromMap,
  randomInteger,
  storageJson,
  storageNumber
} = require('../../js/game-utils');

function fakeStorage(values = {}) {
  const store = { ...values };

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    removeItem(key) {
      delete store[key];
    },
    snapshot() {
      return { ...store };
    }
  };
}

describe('TfitUtils browser export', () => {
  it('exposes the utility API on globalThis for app.js', () => {
    expect(globalThis.TfitUtils).toMatchObject({
      cloneFromMap,
      randomInteger,
      storageJson,
      storageNumber
    });
  });

  it('supports the CommonJS export path', () => {
    const modulePath = require.resolve('../../js/game-utils');
    delete require.cache[modulePath];

    const api = require('../../js/game-utils');

    expect(Object.keys(api).sort()).toEqual([
      'cloneFromMap',
      'randomInteger',
      'storageJson',
      'storageNumber'
    ]);
    expect(api.storageNumber('frame_rate', 20, {}, fakeStorage({ frame_rate: '40' }))).toBe(40);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-utils');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(Object.keys(sandbox.TfitUtils).sort()).toEqual([
      'cloneFromMap',
      'randomInteger',
      'storageJson',
      'storageNumber'
    ]);
    expect(sandbox.TfitUtils.randomInteger(1, 3, () => 0)).toBe(1);
  });
});

describe('storageNumber', () => {
  let storage;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it('returns the fallback when the key is missing or storage is unavailable', () => {
    expect(storageNumber('missing', 2, {}, storage)).toBe(2);
    expect(storageNumber('missing', 7, {}, null)).toBe(7);
    expect(storageNumber('missing', 9, {}, {})).toBe(9);
  });

  it('returns a stored finite number', () => {
    storage = fakeStorage({ frame_rate: '60', coef: '0.75', negative: '-3' });

    expect(storageNumber('frame_rate', 20, {}, storage)).toBe(60);
    expect(storageNumber('coef', 1, {}, storage)).toBe(0.75);
    expect(storageNumber('negative', 0, {}, storage)).toBe(-3);
  });

  it('keeps values on inclusive min and max boundaries', () => {
    expect(storageNumber('level', 99, { min: 0, max: 2 }, fakeStorage({ level: '0' }))).toBe(0);
    expect(storageNumber('level', 99, { min: 0, max: 2 }, fakeStorage({ level: '2' }))).toBe(2);
  });

  it('falls back for non-finite or out-of-range values', () => {
    expect(storageNumber('level', 0, { min: 0, max: 2 }, fakeStorage({ level: '9' }))).toBe(0);
    expect(storageNumber('level', 1, { min: 0, max: 2 }, fakeStorage({ level: '-1' }))).toBe(1);
    expect(storageNumber('value', 3, {}, fakeStorage({ value: 'not-a-number' }))).toBe(3);
    expect(storageNumber('value', 4, {}, fakeStorage({ value: 'Infinity' }))).toBe(4);
  });

  it('accepts only values present in the allowed list', () => {
    expect(storageNumber('frame_rate', 20, { allowed: [20, 40, 60] }, fakeStorage({ frame_rate: '60' }))).toBe(60);
    expect(storageNumber('frame_rate', 20, { allowed: [20, 40] }, fakeStorage({ frame_rate: '30' }))).toBe(20);
  });
});

describe('storageJson', () => {
  it('parses objects and arrays', () => {
    expect(storageJson('player', {}, fakeStorage({ player: '{"name":"Ada","score":12}' }))).toEqual({
      name: 'Ada',
      score: 12
    });
    expect(storageJson('scores', [], fakeStorage({ scores: '[1,2,3]' }))).toEqual([1, 2, 3]);
  });

  it('returns the fallback for missing or null-like values', () => {
    expect(storageJson('missing', { name: 'fallback' }, fakeStorage())).toEqual({ name: 'fallback' });
    expect(storageJson('nothing', { ok: true }, fakeStorage({ nothing: 'null' }))).toEqual({ ok: true });
    expect(storageJson('flag', { ok: true }, fakeStorage({ flag: 'false' }))).toEqual({ ok: true });
  });

  it('clears invalid JSON and returns the fallback', () => {
    const storage = fakeStorage({ player: '{bad json' });

    expect(storageJson('player', { name: 'fallback' }, storage)).toEqual({ name: 'fallback' });
    expect(storage.snapshot()).toEqual({});
  });

  it('does not require removeItem support when JSON is invalid', () => {
    const storage = {
      getItem() {
        return '{bad json';
      }
    };

    expect(storageJson('player', { name: 'fallback' }, storage)).toEqual({ name: 'fallback' });
  });
});

describe('cloneFromMap', () => {
  const opponents = {
    "0": { name: 'Raja', stats: { stamina: 6 } },
    "1": { name: 'Theo', stats: { stamina: 8 } }
  };

  it('returns a deep copy for the requested id', () => {
    const clone = cloneFromMap(opponents, "1", "0");

    clone.stats.stamina = 1;

    expect(clone).toEqual({ name: 'Theo', stats: { stamina: 1 } });
    expect(opponents["1"].stats.stamina).toBe(8);
  });

  it('deep-copies the fallback item when the id is missing', () => {
    const clone = cloneFromMap(opponents, "missing", "0");

    clone.stats.stamina = 2;

    expect(clone).toEqual({ name: 'Raja', stats: { stamina: 2 } });
    expect(opponents["0"].stats.stamina).toBe(6);
  });
});

describe('randomInteger', () => {
  it('is inclusive at both ends', () => {
    expect(randomInteger(2, 5, () => 0)).toBe(2);
    expect(randomInteger(2, 5, () => 0.999)).toBe(5);
  });

  it('uses the supplied random source for deterministic middle values', () => {
    expect(randomInteger(10, 20, () => 0.5)).toBe(15);
  });

  it('supports negative ranges', () => {
    expect(randomInteger(-5, -2, () => 0)).toBe(-5);
    expect(randomInteger(-5, -2, () => 0.999)).toBe(-2);
  });
});
