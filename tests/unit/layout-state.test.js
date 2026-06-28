import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/layout-state');

const STUBBED_GLOBALS = [
  'coef',
  'FRAME_RATE',
  'LEVEL',
  'myWindowHeight',
  'myWindowWidth',
  'OBJECT_POSE_SIZE',
  'storageNumber',
  'TfitLayoutState',
  'TfitUtils',
  'window'
];

const originalGlobals = new Map();

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  Object.assign(globalThis, {
    TfitUtils: {
      storageNumber: vi.fn((_key, fallback) => fallback)
    },
    window: {
      innerHeight: 768,
      innerWidth: 1024
    }
  }, overrides);

  delete require.cache[modulePath];
  return require('../../js/layout-state');
}

afterEach(() => {
  vi.restoreAllMocks();
  delete require.cache[modulePath];
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

describe('TfitLayoutState CommonJS export', () => {
  it('exports the same layout API assigned to global state', () => {
    const api = installGlobals();

    expect(api).toBe(globalThis.TfitLayoutState);
    expect(api.snapshot()).toMatchObject({
      coef: 1.6,
      frameRate: 60,
      height: 768,
      levelWindowBase: 50,
      objectPoseSize: 76.80000000000001,
      width: 1024
    });
  });
});
