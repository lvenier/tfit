import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('TfitConfig browser export', () => {
  it('exposes app constants and opponent cloning on the global object', () => {
    const modulePath = require.resolve('../../js/game-config');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      module: { exports: {} },
      TfitUtils: {
        cloneFromMap: (map, id, fallback) => ({ ...(map[id] || map[fallback]) })
      }
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.MENUTYPE["4"]).toBe('fight');
    expect(sandbox.GAME_LENGTH["3"]).toBe('120');
    expect(sandbox.MOVE_TYPE["10"]).toBe('SWITCH_GUARD');
    expect(sandbox.TfitConfig.cloneOpponent("0")).toEqual({ name: 'Raja', stamina: 6 });
    expect(sandbox.module.exports).toBe(sandbox.TfitConfig);
  });
});
