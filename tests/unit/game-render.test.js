import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const renderApi = require('../../js/game-render');

describe('TfitRender exports', () => {
  it('exposes render helpers for app.js', () => {
    expect(Object.keys(renderApi).sort()).toEqual([
      'drawMessagePanel',
      'renderBackButton',
      'renderCalibrationOverlay',
      'renderFeetIndicator',
      'renderFightButton',
      'renderFightMeters',
      'renderGuardTargets',
      'renderLoadingScreen',
      'renderMainMenu',
      'renderRoundHud',
      'renderSceneBackground',
      'renderSettingsControls',
      'renderShadowResult',
      'renderSpeech'
    ]);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-render');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(Object.keys(sandbox.TfitRender).sort()).toEqual(Object.keys(renderApi).sort());
  });
});
