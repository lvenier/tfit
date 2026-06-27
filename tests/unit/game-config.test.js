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
    expect(sandbox.TfitConfig.cloneOpponent("0")).toEqual({
      name: 'Raja',
      punchWaitFrames: 120,
      recovery: 2,
      renderer: 'raja',
      scale: 0.7,
      stamina: 6,
      xRatio: 0.5,
      yRatio: 0.56
    });
    expect(sandbox.TfitConfig.cloneOpponent("1")).toEqual({
      name: 'Theo',
      punchWaitFrames: 120,
      recovery: 3,
      renderer: 'theo',
      scale: 0.7,
      stamina: 8,
      xRatio: 0.5,
      yRatio: 0.56
    });
    expect(sandbox.TfitConfig.cloneOpponent("2")).toEqual({
      name: 'Vehbo',
      punchWaitFrames: 120,
      recovery: 2,
      renderer: 'vehbo',
      scale: 0.78,
      stamina: 10,
      xRatio: 0.5,
      yRatio: 0.54
    });
    expect(sandbox.TfitConfig.cloneOpponent("3")).toEqual({
      name: 'Cyril',
      punchWaitFrames: 110,
      recovery: 3,
      renderer: 'cyril',
      scale: 0.9,
      stamina: 12,
      xRatio: 0.5,
      yRatio: 0.52
    });
    expect(sandbox.TfitConfig.cloneOpponent("4")).toEqual({
      name: 'Lav',
      punchWaitFrames: 100,
      recovery: 4,
      renderer: 'lav',
      scale: 0.76,
      stamina: 14,
      xRatio: 0.5,
      yRatio: 0.55
    });
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
