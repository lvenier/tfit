import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

describe('TfitState browser export', () => {
  function runStateInSandbox(overrides = {}) {
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
        OPPONENTS: { "0": { stamina: 6 }, "1": { stamina: 8 } },
        SHADOW_SPECIFIC: { "0": "ALL", "1": "JAB" }
      },
      TfitUtils: {
        storageJson,
        storageNumber: (_key, fallback) => fallback
      },
      ...overrides
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    return { sandbox, storageJson };
  }

  it('groups runtime state without legacy global state aliases', () => {
    const { sandbox, storageJson } = runStateInSandbox();

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
    expect(storageJson).toHaveBeenCalledWith('player', expect.objectContaining({
      caloriesBurned: 0,
      gameCounts: {
        fight: 0,
        shadow: 0,
        trainPad: 0
      },
      lastCaloriesBurned: 0,
      score: 0
    }));
  });

  it('supports browser globals without CommonJS exports and selected player storage', () => {
    const storageJson = vi.fn();
    const { sandbox } = runStateInSandbox({
      localStorage: {
        getItem: () => 'southpaw'
      },
      module: undefined,
      TfitUtils: {
        storageJson,
        storageNumber: (key, fallback) => key === 'length' ? 1 : fallback
      }
    });

    expect(sandbox.gameState.gameLength).toBe('30');
    expect(sandbox.module).toBeUndefined();
    expect(storageJson).toHaveBeenCalledWith('southpaw', expect.objectContaining({ score: 0 }));
  });

  it('does not assign module exports when the exports object is missing', () => {
    const { sandbox } = runStateInSandbox({ module: {} });

    expect(sandbox.TfitState.gameState.menu).toBe(0);
    expect(sandbox.module.exports).toBeUndefined();
  });
});
