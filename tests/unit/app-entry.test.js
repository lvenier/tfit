import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

describe('app.js entrypoint', () => {
  it('delegates handler registration to the bootstrap module', () => {
    const registerAppHandlers = vi.fn();
    const sandbox = {
      TfitAppBootstrap: {
        registerAppHandlers
      }
    };

    new Script(readFileSync(resolve('js/app.js'), 'utf8'), { filename: 'js/app.js' }).runInNewContext(sandbox);

    expect(registerAppHandlers).toHaveBeenCalledTimes(1);
  });
});
