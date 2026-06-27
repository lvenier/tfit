import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const backgroundApi = require('../../js/game-background');

const STUBBED_GLOBALS = [
  'background',
  'BOLD',
  'CENTER',
  'circle',
  'cos',
  'document',
  'ellipse',
  'fill',
  'frameCount',
  'gameState',
  'height',
  'line',
  'map',
  'max',
  'noFill',
  'noStroke',
  'pop',
  'push',
  'quad',
  'rect',
  'rotate',
  'ROUND',
  'sin',
  'stroke',
  'strokeCap',
  'strokeWeight',
  'text',
  'textAlign',
  'textSize',
  'textStyle',
  'translate',
  'triangle',
  'width'
];

const originalGlobals = new Map();
const calls = {};

function record(name) {
  return (...args) => {
    calls[name].push(args);
  };
}

function installBackgroundGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  for (const name of [
    'background',
    'circle',
    'ellipse',
    'fill',
    'line',
    'noFill',
    'noStroke',
    'pop',
    'push',
    'quad',
    'rect',
    'rotate',
    'stroke',
    'strokeCap',
    'strokeWeight',
    'text',
    'textAlign',
    'textSize',
    'textStyle',
    'translate',
    'triangle'
  ]) {
    calls[name] = [];
    globalThis[name] = record(name);
  }

  Object.assign(globalThis, {
    BOLD: 'bold',
    CENTER: 'center',
    cos: Math.cos,
    document: {
      body: {
        style: {
          setProperty: vi.fn()
        }
      }
    },
    frameCount: 0,
    gameState: { menu: 0 },
    height: 480,
    map: (value, start1, stop1, start2, stop2) => start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2),
    max: Math.max,
    ROUND: 'round',
    sin: Math.sin,
    width: 640
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

describe('TfitBackground exports', () => {
  it('exposes background registry helpers', () => {
    expect(Object.keys(backgroundApi).sort()).toEqual([
      'backgroundForMenu',
      'renderBackgroundPreset',
      'renderSceneBackground',
      'syncPageBackground'
    ]);
    expect(globalThis.TfitBackground).toBe(backgroundApi);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-background');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(Object.keys(sandbox.TfitBackground).sort()).toEqual(Object.keys(backgroundApi).sort());
  });
});

describe('background routing', () => {
  it('falls back to the default arena for unknown menus and preset names', () => {
    installBackgroundGlobals();

    expect(backgroundApi.backgroundForMenu(99)).toEqual({ preset: 'default-arena' });
    backgroundApi.renderBackgroundPreset('missing-preset', { menu: 2, t: 0 });

    expect(calls.background).toContainEqual([7, 9, 20]);
    expect(calls.quad.length).toBeGreaterThan(0);
  });

  it('can render the Box4Fit arena with optional effects disabled', () => {
    installBackgroundGlobals();

    backgroundApi.renderBackgroundPreset('box4fit-arena', {
      energy: 0,
      features: { flashes: false, lights: false, smoke: false },
      t: 0
    });

    expect(calls.text.some(([label]) => label === 'BOX4FIT')).toBe(true);
    expect(calls.circle).toEqual([]);
  });

  it('uses frame fallback timing when frameCount is unavailable', () => {
    installBackgroundGlobals({ frameCount: undefined, gameState: { menu: 4 } });

    backgroundApi.renderSceneBackground();

    expect(globalThis.document.body.style.setProperty).toHaveBeenCalledWith(
      '--app-background-image',
      'none'
    );
    expect(calls.text.some(([label]) => label === 'FIGHT NIGHT')).toBe(true);
  });
});
