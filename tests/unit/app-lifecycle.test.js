import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/app-lifecycle');

const STUBBED_GLOBALS = [
  'angleMode',
  'cnv',
  'createCanvas',
  'DEGREES',
  'frameRate',
  'loadImage',
  'loadSound',
  'myWindowHeight',
  'myWindowWidth',
  'resizeCanvas',
  'TfitAppEvents',
  'TfitAppLifecycle',
  'TfitAssets',
  'TfitCameraRuntime',
  'TfitConfig',
  'TfitFlow',
  'TfitLayoutState',
  'TfitLoadingProgress',
  'TfitScreenRouter'
];

const originalGlobals = new Map();

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  const canvas = {
    elt: {
      addEventListener: vi.fn()
    }
  };

  Object.assign(globalThis, {
    angleMode: vi.fn(),
    cnv: null,
    createCanvas: vi.fn(() => canvas),
    DEGREES: 'degrees',
    frameRate: vi.fn(),
    loadImage: vi.fn(),
    loadSound: vi.fn(),
    myWindowHeight: 480,
    myWindowWidth: 640,
    resizeCanvas: vi.fn(),
    TfitAppEvents: {
      handleCanvasContextMenu: vi.fn()
    },
    TfitAssets: {
      loadAssetsIntoState: vi.fn(() => Promise.resolve())
    },
    TfitCameraRuntime: {
      initCameraRuntime: vi.fn(() => Promise.resolve())
    },
    TfitConfig: {
      GAME_LENGTH: { "1": "30" },
      GAME_LEVEL: { "0": "easy" },
      MENUTYPE: { "0": "main" }
    },
    TfitFlow: {
      fetchSong: vi.fn()
    },
    TfitLayoutState: {
      positionCanvas: vi.fn(),
      resizeCanvasLayout: vi.fn(),
      snapshot: vi.fn(() => ({
        height: globalThis.myWindowHeight,
        width: globalThis.myWindowWidth
      }))
    },
    TfitLoadingProgress: {
      updateLoadingProgress: vi.fn()
    },
    TfitScreenRouter: {
      renderAppFrame: vi.fn()
    }
  }, overrides);

  delete require.cache[modulePath];
  return require('../../js/app-lifecycle');
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

describe('TfitAppLifecycle exports', () => {
  it('exposes app lifecycle handlers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'draw',
      'loadAssets',
      'setup',
      'windowResized'
    ]);
    expect(globalThis.TfitAppLifecycle).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      TfitAppEvents: { handleCanvasContextMenu: () => {} },
      TfitAssets: { loadAssetsIntoState: () => Promise.resolve() },
      TfitCameraRuntime: { initCameraRuntime: () => Promise.resolve() },
      TfitConfig: {
        GAME_LENGTH: {},
        GAME_LEVEL: {},
        MENUTYPE: {}
      },
      TfitFlow: { fetchSong: () => {} },
      TfitLayoutState: {
        positionCanvas: () => {},
        resizeCanvasLayout: () => {},
        snapshot: () => ({ height: 480, width: 640 })
      },
      TfitLoadingProgress: { updateLoadingProgress: () => {} },
      TfitScreenRouter: { renderAppFrame: () => {} }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitAppLifecycle.setup).toBe('function');
  });
});

describe('app lifecycle handlers', () => {
  it('loads configured images and sounds into asset state', async () => {
    const api = installGlobals();

    await api.loadAssets();

    expect(globalThis.TfitAssets.loadAssetsIntoState).toHaveBeenCalledWith({
      gameLength: globalThis.TfitConfig.GAME_LENGTH,
      gameLevel: globalThis.TfitConfig.GAME_LEVEL,
      loadImage: globalThis.loadImage,
      loadSound: globalThis.loadSound,
      menuTypes: globalThis.TfitConfig.MENUTYPE,
      onProgress: globalThis.TfitLoadingProgress.updateLoadingProgress
    });
  });

  it('sets up rendering, canvas, song, and camera runtime', async () => {
    const api = installGlobals();

    await api.setup();

    expect(globalThis.TfitAssets.loadAssetsIntoState).toHaveBeenCalledTimes(1);
    expect(globalThis.frameRate).toHaveBeenCalledWith(60);
    expect(globalThis.angleMode).toHaveBeenCalledWith('degrees');
    expect(globalThis.TfitLayoutState.snapshot).toHaveBeenCalledTimes(1);
    expect(globalThis.createCanvas).toHaveBeenCalledWith(640, 480);
    expect(globalThis.cnv.elt.addEventListener).toHaveBeenCalledWith(
      'contextmenu',
      globalThis.TfitAppEvents.handleCanvasContextMenu
    );
    expect(globalThis.TfitLayoutState.positionCanvas).toHaveBeenCalledWith(globalThis.cnv);
    expect(globalThis.TfitFlow.fetchSong).toHaveBeenCalledWith(1);
    expect(globalThis.TfitCameraRuntime.initCameraRuntime).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitLoadingProgress.updateLoadingProgress).toHaveBeenCalledWith({
      label: 'Starting camera',
      loaded: 1,
      total: 1
    });
    expect(globalThis.TfitLoadingProgress.updateLoadingProgress).toHaveBeenLastCalledWith({
      label: 'Ready',
      loaded: 1,
      total: 1
    });
  });

  it('delegates draw to the screen router', () => {
    const api = installGlobals();

    api.draw();

    expect(globalThis.TfitScreenRouter.renderAppFrame).toHaveBeenCalledTimes(1);
  });

  it('delegates resize to layout state', () => {
    const api = installGlobals({
      cnv: { id: 'canvas' }
    });

    api.windowResized();

    expect(globalThis.TfitLayoutState.resizeCanvasLayout).toHaveBeenCalledWith({
      canvas: globalThis.cnv,
      resizeCanvasFn: globalThis.resizeCanvas
    });
  });
});
