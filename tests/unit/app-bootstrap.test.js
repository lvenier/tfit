import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/app-bootstrap');

const STUBBED_GLOBALS = [
  'TfitAppBootstrap'
];

const originalGlobals = new Map();

function installGlobals() {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  delete require.cache[modulePath];
  return require('../../js/app-bootstrap');
}

function createDependencies(overrides = {}) {
  const events = {
    handleKeyboardInput: vi.fn(),
    handlePointerChange: vi.fn(),
    handlePointerRelease: vi.fn(),
    preventContextMenu: vi.fn()
  };
  const lifecycle = {
    draw: vi.fn(),
    setup: vi.fn(),
    windowResized: vi.fn()
  };

  return {
    document: {
      addEventListener: vi.fn()
    },
    events,
    lifecycle,
    navigator: {
      serviceWorker: {
        register: vi.fn(() => Promise.resolve())
      }
    },
    p5: {},
    root: {},
    ...overrides
  };
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

describe('TfitAppBootstrap exports', () => {
  it('exposes app bootstrap helpers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'registerAppHandlers',
      'registerInstallPrompt'
    ]);
    expect(globalThis.TfitAppBootstrap).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitAppBootstrap.registerAppHandlers).toBe('function');
  });
});

describe('registerAppHandlers', () => {
  it('registers document, p5, service worker, and p5 global handlers', () => {
    const api = installGlobals();
    const dependencies = createDependencies();

    api.registerAppHandlers(dependencies);

    expect(dependencies.p5.disableFriendlyErrors).toBe(true);
    expect(dependencies.document.addEventListener).toHaveBeenCalledWith(
      'contextmenu',
      dependencies.events.preventContextMenu
    );
    expect(dependencies.navigator.serviceWorker.register).toHaveBeenCalledWith('./service-worker.js');
    expect(dependencies.root).toMatchObject({
      draw: dependencies.lifecycle.draw,
      keyPressed: dependencies.events.handleKeyboardInput,
      mousePressed: dependencies.events.handlePointerChange,
      mouseReleased: dependencies.events.handlePointerRelease,
      setup: dependencies.lifecycle.setup,
      touchEnded: dependencies.events.handlePointerRelease,
      touchMoved: dependencies.events.handlePointerChange,
      windowResized: dependencies.lifecycle.windowResized
    });
  });

  it('skips service worker registration when unavailable', () => {
    const api = installGlobals();
    const dependencies = createDependencies({
      navigator: {}
    });

    api.registerAppHandlers(dependencies);

    expect(dependencies.root.setup).toBe(dependencies.lifecycle.setup);
  });

  it('absorbs service worker registration failures', async () => {
    const api = installGlobals();
    const dependencies = createDependencies({
      navigator: {
        serviceWorker: {
          register: vi.fn(() => Promise.reject(new Error('offline')))
        }
      }
    });

    api.registerAppHandlers(dependencies);
    await Promise.resolve();
    await Promise.resolve();

    expect(dependencies.navigator.serviceWorker.register).toHaveBeenCalledWith('./service-worker.js');
  });

  it('shows and uses the install button when the browser offers PWA installation', async () => {
    const api = installGlobals();
    const handlers = {};
    const installButton = {
      addEventListener: vi.fn((type, handler) => {
        handlers[`button:${type}`] = handler;
      }),
      hidden: true
    };
    const promptEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    const dependencies = {
      document: {
        getElementById: vi.fn(() => installButton)
      },
      root: {
        addEventListener: vi.fn((type, handler) => {
          handlers[type] = handler;
        })
      }
    };

    api.registerInstallPrompt(dependencies);
    handlers.beforeinstallprompt(promptEvent);

    expect(promptEvent.preventDefault).toHaveBeenCalled();
    expect(installButton.hidden).toBe(false);

    await handlers['button:click']();

    expect(promptEvent.prompt).toHaveBeenCalled();
    expect(installButton.hidden).toBe(true);
  });

  it('hides the install button when clicked before any install prompt is available', async () => {
    const api = installGlobals();
    const handlers = {};
    const installButton = {
      addEventListener: vi.fn((type, handler) => {
        handlers[`button:${type}`] = handler;
      }),
      hidden: false
    };

    api.registerInstallPrompt({
      document: {
        getElementById: vi.fn(() => installButton)
      },
      root: {
        addEventListener: vi.fn()
      }
    });

    await handlers['button:click']();

    expect(installButton.hidden).toBe(true);
  });

  it('shows the install button again when install prompt throws', async () => {
    const api = installGlobals();
    const handlers = {};
    const installButton = {
      addEventListener: vi.fn((type, handler) => {
        handlers[`button:${type}`] = handler;
      }),
      hidden: true
    };
    const promptEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(() => Promise.reject(new Error('no prompt')))
    };

    api.registerInstallPrompt({
      document: {
        getElementById: vi.fn(() => installButton)
      },
      root: {
        addEventListener: vi.fn((type, handler) => {
          handlers[type] = handler;
        })
      }
    });

    handlers.beforeinstallprompt(promptEvent);
    await handlers['button:click']();

    expect(installButton.hidden).toBe(false);
  });

  it('hides the install button after installation completes', () => {
    const api = installGlobals();
    const handlers = {};
    const installButton = {
      addEventListener: vi.fn(),
      hidden: false
    };

    api.registerInstallPrompt({
      document: {
        getElementById: vi.fn(() => installButton)
      },
      root: {
        addEventListener: vi.fn((type, handler) => {
          handlers[type] = handler;
        })
      }
    });
    handlers.appinstalled();

    expect(installButton.hidden).toBe(true);
  });
});
