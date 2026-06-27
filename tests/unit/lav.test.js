import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('Lav opponent renderer module', () => {
  it('registers the Lav renderer and delegates to TfitRender', () => {
    const modulePath = require.resolve('../../js/opponent/lav');
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
    sandbox.TfitOpponentRenderers.lav.render({ type: 1 });

    expect(sandbox.TfitOpponentRenderers.lav.key).toBe('lav');
    expect(renderRajaOpponentCharacter).toHaveBeenCalledWith({
      type: 1,
      palette: expect.objectContaining({
        gloveLight: '#7e28d8',
        skinLight: '#ffd0a6'
      })
    });
    expect(sandbox.module.exports).toBe(sandbox.TfitOpponentRenderers.lav);
  });
});
