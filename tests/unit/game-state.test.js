import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('TfitState browser export', () => {
  it('groups runtime state without legacy global state aliases', () => {
    const modulePath = require.resolve('../../js/game-state');
    const source = readFileSync(modulePath, 'utf8');
    const storageJson = vi.fn();
    const sandbox = {
      localStorage: {
        getItem: () => null
      },
      module: { exports: {} },
      TfitConfig: {
        cloneOpponent: id => ({ id, stamina: 6 }),
        GAME_LENGTH: { "1": "30", "2": "60", "3": "120" },
        GAME_LEVEL: { "0": "easy", "1": "medium" },
        SHADOW_SPECIFIC: { "0": "ALL", "1": "JAB" }
      },
      TfitUtils: {
        storageJson,
        storageNumber: (_key, fallback) => fallback
      }
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(sandbox.gameState.gameLength).toBe('60');
    expect(sandbox.gameState.opponent).toBe(0);
    expect(sandbox.gameState.my_opponent).toEqual({ id: 0, stamina: 6 });
    sandbox.animationState.player.frame = 4;
    sandbox.padState.x = 120;

    expect(sandbox.menu).toBeUndefined();
    expect(sandbox.opponent).toBeUndefined();
    expect(sandbox.animationState.player.frame).toBe(4);
    expect(sandbox.padState.x).toBe(120);
    expect(sandbox.module.exports).toBe(sandbox.TfitState);
    expect(storageJson).toHaveBeenCalledWith('player', expect.objectContaining({ score: 0 }));
  });
});
