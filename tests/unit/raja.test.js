import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('Raja opponent renderer module', () => {
  it('registers the Raja renderer and delegates to TfitRender', () => {
    const modulePath = require.resolve('../../js/opponent/raja');
    const source = readFileSync(modulePath, 'utf8');
    const renderRajaOpponentCharacter = vi.fn();
    const sandbox = {
      globalThis: null,
      module: { exports: {} },
      TfitRender: {
        renderRajaOpponentCharacter
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);
    sandbox.TfitOpponentRenderers.raja.render({ type: 1 });

    expect(sandbox.TfitOpponentRenderers.raja.key).toBe('raja');
    expect(renderRajaOpponentCharacter).toHaveBeenCalledWith({ type: 1 });
    expect(sandbox.module.exports).toBe(sandbox.TfitOpponentRenderers.raja);
  });
});
