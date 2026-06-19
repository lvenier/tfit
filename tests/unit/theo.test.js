import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('Theo opponent renderer module', () => {
  it('registers the Theo renderer and delegates to TfitRender', () => {
    const modulePath = require.resolve('../../js/opponent/theo');
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
    sandbox.TfitOpponentRenderers.theo.render({ type: 1 });

    expect(sandbox.TfitOpponentRenderers.theo.key).toBe('theo');
    expect(renderRajaOpponentCharacter).toHaveBeenCalledWith({
      type: 1,
      palette: expect.objectContaining({
        gloveLight: '#d71f2c',
        skinLight: '#ffd0a6'
      })
    });
    expect(sandbox.module.exports).toBe(sandbox.TfitOpponentRenderers.theo);
  });
});
