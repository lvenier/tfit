import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);

const {
  loadGameAssets
} = require('../../js/game-assets');

describe('TfitAssets exports', () => {
  it('exposes asset helpers for app.js', () => {
    expect(Object.keys(globalThis.TfitAssets)).toEqual(['loadGameAssets']);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const modulePath = require.resolve('../../js/game-assets');
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {};

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(Object.keys(sandbox.TfitAssets)).toEqual(['loadGameAssets']);
  });
});

describe('loadGameAssets', () => {
  it('loads menu, settings, boxer, opponent, and sound assets into the app shape', async () => {
    const imagePaths = [];
    const soundPaths = [];

    const assets = await loadGameAssets({
      gameLength: {
        "1": "30",
        "2": "60"
      },
      gameLevel: {
        "0": "easy",
        "1": "hard"
      },
      loadImage: async path => {
        imagePaths.push(path);
        return { image: path };
      },
      loadSound: async path => {
        soundPaths.push(path);
        return { sound: path };
      },
      menuTypes: {
        "0": "main",
        "1": "settings"
      }
    });

    expect(assets.background_images[0]).toEqual({ image: 'assets/backgrounds/0.jpg' });
    expect(assets.background_images[1]).toEqual({ image: 'assets/backgrounds/1.jpg' });
    expect(assets.framerate_button_image[6]).toEqual({ image: 'assets/images/fr120.png' });
    expect(assets.level_button_image[1]).toEqual({ image: 'assets/images/hard.png' });
    expect(assets.duration_button_image[2]).toEqual({ image: 'assets/images/60.png' });
    expect(assets.series_button_image[5]).toEqual({ image: 'assets/images/s5.png' });
    expect(assets.me_images[6][6]).toEqual({ image: 'assets/images/boxers/6-me-6.png' });
    expect(assets.opponents_images[6][6]).toEqual({ image: 'assets/images/opponents/0/6-6.png' });
    expect(assets.song_thats_it).toEqual({ sound: 'assets/sounds/thats_it.mp3' });

    expect(imagePaths).toContain('assets/images/fight.png');
    expect(imagePaths).toContain('assets/logos/logo.512.rounded.png');
    expect(soundPaths).toEqual([
      'assets/sounds/click.mp3',
      'assets/sounds/punch.mp3',
      'assets/sounds/awesome.mp3',
      'assets/sounds/continue.mp3',
      'assets/sounds/good.mp3',
      'assets/sounds/great.mp3',
      'assets/sounds/keep_trying.mp3',
      'assets/sounds/letsfight.mp3',
      'assets/sounds/perfect.mp3',
      'assets/sounds/thats_it.mp3',
      'assets/sounds/well_done.mp3',
      'assets/sounds/your_guard.mp3'
    ]);
  });
});
