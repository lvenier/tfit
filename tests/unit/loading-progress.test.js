import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/loading-progress');

const originalDocument = globalThis.document;
const originalApi = globalThis.TfitLoadingProgress;

function element() {
  return {
    attributes: {},
    max: 0,
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    textContent: '',
    value: 0
  };
}

afterEach(() => {
  delete require.cache[modulePath];
  globalThis.document = originalDocument;
  if (originalApi === undefined) {
    delete globalThis.TfitLoadingProgress;
  } else {
    globalThis.TfitLoadingProgress = originalApi;
  }
});

describe('TfitLoadingProgress', () => {
  it('updates loading status, progress, and percentage', () => {
    const status = element();
    const progress = element();
    const count = element();
    globalThis.document = {
      getElementById(id) {
        return {
          'loading-count': count,
          'loading-progress': progress,
          'loading-status': status
        }[id];
      }
    };

    const api = require('../../js/loading-progress');
    const result = api.updateLoadingProgress({
      label: 'Loading assets',
      loaded: 3,
      total: 6
    });

    expect(result).toEqual({ label: 'Loading assets', loaded: 3, total: 6 });
    expect(status.textContent).toBe('Loading assets');
    expect(progress.max).toBe(6);
    expect(progress.value).toBe(3);
    expect(progress.attributes['aria-label']).toBe('Loading assets');
    expect(count.textContent).toBe('50%');
  });

  it('clamps progress values to a safe range', () => {
    const api = require('../../js/loading-progress');

    expect(api.updateLoadingProgress({
      loaded: 10,
      total: 0
    })).toEqual({
      label: 'Loading Box4Fit',
      loaded: 1,
      total: 1
    });
  });

  it('works when document is unavailable', () => {
    globalThis.document = undefined;

    const api = require('../../js/loading-progress');

    expect(api.updateLoadingProgress({
      label: 'No DOM',
      loaded: 3,
      total: 4
    })).toEqual({
      label: 'No DOM',
      loaded: 3,
      total: 4
    });
  });

  it('supports environments without CommonJS module object', () => {
    const sandbox = {};
    sandbox.globalThis = sandbox;
    sandbox.globalThis.globalThis = sandbox.globalThis;

    const code = readFileSync(modulePath, 'utf8');
    runInNewContext(code, sandbox);

    const api = sandbox.TfitLoadingProgress;
    const result = api.updateLoadingProgress({
      label: 'Sandbox',
      loaded: 1,
      total: 2
    });

    expect(result).toEqual({ label: 'Sandbox', loaded: 1, total: 2 });
    expect(api).toBeDefined();
    expect(sandbox).not.toHaveProperty('module');
  });
});
