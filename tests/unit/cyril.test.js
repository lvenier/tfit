import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('Cyril opponent renderer module', () => {
  it('registers the Cyril renderer and delegates to TfitRender', () => {
    const modulePath = require.resolve('../../js/opponent/cyril');
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
    sandbox.TfitOpponentRenderers.cyril.render({ type: 1 });

    expect(sandbox.TfitOpponentRenderers.cyril.key).toBe('cyril');
    expect(renderRajaOpponentCharacter).toHaveBeenCalledWith({
      type: 1,
      palette: expect.objectContaining({
        gloveLight: '#2859d8',
        skinBase: '#5b3024'
      })
    });
    expect(sandbox.module.exports).toBe(sandbox.TfitOpponentRenderers.cyril);
  });
});
