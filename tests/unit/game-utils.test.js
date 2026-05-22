const assert = require('node:assert/strict');
const test = require('node:test');

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

test('storageNumber returns a stored number when it is allowed', () => {
  const storage = fakeStorage({ frame_rate: '60' });

  assert.equal(
    storageNumber('frame_rate', 20, { allowed: [20, 40, 60] }, storage),
    60
  );
});

test('storageNumber falls back for invalid, out-of-range, or disallowed values', () => {
  assert.equal(storageNumber('missing', 2, {}, fakeStorage()), 2);
  assert.equal(storageNumber('level', 0, { min: 0, max: 2 }, fakeStorage({ level: '9' })), 0);
  assert.equal(storageNumber('frame_rate', 20, { allowed: [20, 40] }, fakeStorage({ frame_rate: '30' })), 20);
});

test('storageJson parses valid JSON and clears invalid JSON', () => {
  const validStorage = fakeStorage({ player: '{"name":"Ada","score":12}' });
  assert.deepEqual(storageJson('player', {}, validStorage), { name: 'Ada', score: 12 });

  const invalidStorage = fakeStorage({ player: '{bad json' });
  assert.deepEqual(storageJson('player', { name: 'fallback' }, invalidStorage), { name: 'fallback' });
  assert.deepEqual(invalidStorage.snapshot(), {});
});

test('cloneFromMap returns a deep copy with fallback support', () => {
  const opponents = {
    "0": { name: 'Raja', stamina: 6 },
    "1": { name: 'Theo', stamina: 8 }
  };

  const clone = cloneFromMap(opponents, "1", "0");
  clone.stamina = 1;

  assert.equal(opponents["1"].stamina, 8);
  assert.deepEqual(cloneFromMap(opponents, "missing", "0"), opponents["0"]);
});

test('randomInteger is inclusive and accepts an injectable random source', () => {
  assert.equal(randomInteger(2, 5, () => 0), 2);
  assert.equal(randomInteger(2, 5, () => 0.999), 5);
});
