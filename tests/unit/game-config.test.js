import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('TfitConfig browser export', () => {
  function runConfigInSandbox(overrides = {}) {
    const modulePath = require.resolve('../../js/game-config');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      TfitUtils: {
        cloneFromMap: (map, id, fallback) => ({ ...(map[id] || map[fallback]) })
      },
      ...overrides
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);
    return sandbox;
  }

  it('exposes app constants and opponent cloning on the global object', () => {
    const sandbox = runConfigInSandbox({ module: { exports: {} } });

    expect(sandbox.MENUTYPE["4"]).toBe('fight');
    expect(sandbox.GAME_LENGTH["3"]).toBe('120');
    expect(sandbox.MOVE_TYPE["10"]).toBe('SWITCH_GUARD');
    expect(sandbox.TfitConfig.cloneOpponent("0")).toEqual({ name: 'Raja', stamina: 6 });
    expect(sandbox.module.exports).toBe(sandbox.TfitConfig);
  });

  it('supports browser globals without a CommonJS module object', () => {
    const sandbox = runConfigInSandbox();

    expect(sandbox.TfitConfig.GAME_LEVEL["2"]).toBe('hard');
    expect(sandbox.TfitConfig.MOVE_TYPE["9"]).toBe('DOWN_DODGE');
    expect(sandbox.module).toBeUndefined();
  });

  it('leaves CommonJS exports untouched when exports is unavailable', () => {
    const sandbox = runConfigInSandbox({ module: {} });

    expect(sandbox.TfitConfig.GAME_LENGTH["1"]).toBe('30');
    expect(sandbox.module.exports).toBeUndefined();
  });
});
