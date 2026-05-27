import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Script } from 'node:vm';

function loadMainProcess({ platform = 'linux', windows = [] } = {}) {
  const appHandlers = {};
  const createdWindows = [];
  const app = {
    commandLine: {
      appendSwitch: vi.fn()
    },
    on: vi.fn((eventName, handler) => {
      appHandlers[eventName] = handler;
    }),
    quit: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve())
  };

  class BrowserWindow {
    constructor(options) {
      this.loadFile = vi.fn();
      this.options = options;
      createdWindows.push(this);
      windows.push(this);
    }

    static getAllWindows() {
      return windows;
    }
  }

  const sandbox = {
    __dirname: process.cwd(),
    console,
    process: {
      platform
    },
    require: id => {
      if (id === 'electron') {
        return { app, BrowserWindow };
      }
      if (id === 'node:path') {
        return path;
      }
      throw new Error(`Unexpected require: ${id}`);
    }
  };

  new Script(readFileSync(path.resolve('main.js'), 'utf8'), {
    filename: 'main.js'
  }).runInNewContext(sandbox);

  return {
    app,
    appHandlers,
    createdWindows,
    windows
  };
}

describe('Electron main process smoke test', () => {
  it('creates the app window with secure browser defaults', async () => {
    const electron = loadMainProcess();

    await electron.app.whenReady.mock.results[0].value;
    await Promise.resolve();

    expect(electron.app.commandLine.appendSwitch).toHaveBeenCalledWith('gtk-version', '3');
    expect(electron.createdWindows).toHaveLength(1);
    expect(electron.createdWindows[0].options).toEqual({
      autoHideMenuBar: true,
      fullscreen: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });
    expect(electron.createdWindows[0].loadFile).toHaveBeenCalledWith(
      path.join(process.cwd(), 'index.html')
    );
  });

  it('recreates the window on activate only when none are open', async () => {
    const electron = loadMainProcess();

    await electron.app.whenReady.mock.results[0].value;
    await Promise.resolve();
    expect(electron.createdWindows).toHaveLength(1);

    electron.appHandlers.activate();
    expect(electron.createdWindows).toHaveLength(1);

    electron.windows.length = 0;
    electron.appHandlers.activate();
    expect(electron.createdWindows).toHaveLength(2);
  });

  it('quits on window-all-closed outside macOS', () => {
    const electron = loadMainProcess({ platform: 'linux' });

    electron.appHandlers['window-all-closed']();

    expect(electron.app.quit).toHaveBeenCalledTimes(1);
  });

  it('keeps the app alive on macOS window-all-closed', () => {
    const electron = loadMainProcess({ platform: 'darwin' });

    electron.appHandlers['window-all-closed']();

    expect(electron.app.quit).not.toHaveBeenCalled();
  });
});
