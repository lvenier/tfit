import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/face-recognition');

const originalApi = globalThis.TfitFaceRecognition;

function loadModule() {
  delete require.cache[modulePath];
  return require('../../js/face-recognition');
}

afterEach(() => {
  delete require.cache[modulePath];
  if (originalApi === undefined) {
    delete globalThis.TfitFaceRecognition;
  } else {
    globalThis.TfitFaceRecognition = originalApi;
  }
});

function fakeStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
    values
  };
}

describe('TfitFaceRecognition', () => {
  it('auto-registers the selected player when no face profile exists by default', () => {
    const api = loadModule();

    expect(api.DEFAULT_CONFIG.autoRegisterWhenEmpty).toBe(true);
    expect(api.DEFAULT_CONFIG.autoRegisterUnknown).toBe(false);
    expect(api.DEFAULT_CONFIG.mainMenuPollMs).toBe(250);
    expect(api.DEFAULT_CONFIG.recognitionSampleCount).toBe(3);
    expect(api.DEFAULT_CONFIG.recognitionSampleDelayMs).toBe(120);
    expect(api.DEFAULT_CONFIG.recognitionTimeoutMs).toBe(5000);
    expect(api.DEFAULT_CONFIG.recognitionRetryDelayMs).toBe(250);
  });

  it('only treats the idle main menu as ready for recognition startup', () => {
    const api = loadModule();

    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameReady: true,
      gameStarted: false,
      menu: 0,
      menuButtonAnimation: { active: false }
    })).toBe(true);
    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameReady: false,
      gameStarted: false,
      menu: 0,
      menuButtonAnimation: { active: false }
    })).toBe(false);
    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameReady: true,
      gameStarted: false,
      menu: 1,
      menuButtonAnimation: { active: false }
    })).toBe(false);
    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameReady: true,
      gameStarted: true,
      menu: 0,
      menuButtonAnimation: { active: false }
    })).toBe(false);
    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameReady: true,
      gameStarted: false,
      menu: 0,
      menuButtonAnimation: { active: true }
    })).toBe(false);
  });

  it('normalizes averaged face embeddings', () => {
    const api = loadModule();

    const embedding = api.averageEmbeddings([
      [1, 0, 0],
      [0, 1, 0]
    ]);

    expect(embedding[0]).toBeCloseTo(Math.SQRT1_2);
    expect(embedding[1]).toBeCloseTo(Math.SQRT1_2);
    expect(embedding[2]).toBe(0);
  });

  it('finds the best cosine similarity match', () => {
    const api = loadModule();

    const match = api.matchEmbedding([1, 0], [
      { name: 'Ada', embedding: [0, 1] },
      { name: 'Laurent', embedding: [0.9, 0.1] }
    ]);

    expect(match.profile.name).toBe('Laurent');
    expect(match.score).toBeCloseTo(0.9);
  });

  it('reads square NCHW input sizes from ONNX metadata', () => {
    const api = loadModule();

    expect(api.sessionInputSize({
      inputNames: ['input.1'],
      inputMetadata: {
        'input.1': {
          dimensions: [1, 3, 640, 640]
        }
      }
    }, 320)).toBe(640);

    expect(api.sessionInputSize({
      inputNames: ['input.1'],
      inputMetadata: {
        'input.1': {
          dimensions: [1, 3, 'height', 'width']
        }
      }
    }, 112)).toBe(112);
  });

  it('stores face profiles without image data', () => {
    const api = loadModule();
    const storage = fakeStorage();
    const profiles = [{
      name: 'Laurent',
      profileKey: 'player',
      embedding: [0.023, -0.145]
    }];

    expect(api.writeProfiles(profiles, storage)).toBe(true);
    expect(api.readProfiles(storage)).toEqual(profiles);
    expect(storage.values.get(api.DEFAULT_CONFIG.storageKey)).not.toContain('image');
  });

  it('resolves ONNX Runtime assets relative to the app document', () => {
    const originalDocument = globalThis.document;
    globalThis.document = { baseURI: 'http://localhost:8000/index.html' };

    try {
      const api = loadModule();

      expect(api.resolveAppAssetUrl('assets/vendor/onnxruntime-web/ort-wasm-simd-threaded.wasm'))
        .toBe('http://localhost:8000/assets/vendor/onnxruntime-web/ort-wasm-simd-threaded.wasm');
    } finally {
      globalThis.document = originalDocument;
    }
  });

  it('resolves ONNX Runtime assets under the Electron app directory', () => {
    const originalDocument = globalThis.document;
    globalThis.document = { baseURI: 'file:///opt/Box4Fit/resources/app.asar/index.html' };

    try {
      const api = loadModule();

      expect(api.resolveAppAssetUrl('assets/vendor/onnxruntime-web/ort-wasm-simd-threaded.wasm'))
        .toBe('file:///opt/Box4Fit/resources/app.asar.unpacked/assets/vendor/onnxruntime-web/ort-wasm-simd-threaded.wasm');
    } finally {
      globalThis.document = originalDocument;
    }
  });

  it('suppresses overlapping SCRFD detections by score', () => {
    const api = loadModule();
    const detections = api.nonMaxSuppression([
      { score: 0.91, boundingBox: { x: 10, y: 10, width: 100, height: 100 } },
      { score: 0.88, boundingBox: { x: 14, y: 14, width: 100, height: 100 } },
      { score: 0.7, boundingBox: { x: 240, y: 240, width: 80, height: 80 } }
    ]);

    expect(detections).toHaveLength(2);
    expect(detections[0].score).toBe(0.91);
    expect(detections[1].score).toBe(0.7);
  });

  it('reads the selected player name from the existing profile storage', () => {
    const api = loadModule();
    const storage = fakeStorage({
      selected_player: 'player-laurent',
      'player-laurent': JSON.stringify({ name: 'Laurent', score: 10 })
    });

    expect(api.selectedProfile(storage)).toEqual({
      key: 'player-laurent',
      name: 'Laurent'
    });
  });

  it('updates the selected player profile and matching face profile name', () => {
    const api = loadModule();
    const storage = fakeStorage({
      selected_player: 'player-laurent',
      'player-laurent': JSON.stringify({ name: 'Laurent', score: 10 }),
      [api.DEFAULT_CONFIG.storageKey]: JSON.stringify([
        { name: 'Laurent', profileKey: 'player-laurent', embedding: [1, 0] },
        { name: 'Ada', profileKey: 'player-ada', embedding: [0, 1] }
      ])
    });

    expect(api.updateSelectedPlayerName(' Lolo ', storage)).toEqual({
      key: 'player-laurent',
      name: 'Lolo'
    });
    expect(JSON.parse(storage.values.get('player-laurent')).name).toBe('Lolo');
    expect(api.readProfiles(storage)).toEqual([
      { name: 'Lolo', profileKey: 'player-laurent', embedding: [1, 0] },
      { name: 'Ada', profileKey: 'player-ada', embedding: [0, 1] }
    ]);
  });

  it('creates a fresh selected player profile for unknown faces', () => {
    const api = loadModule();
    const storage = fakeStorage({
      [api.DEFAULT_CONFIG.storageKey]: JSON.stringify([
        { name: 'Laurent', profileKey: 'player-laurent', embedding: [1, 0] }
      ]),
      selected_player: 'player-laurent'
    });

    const player = api.createAutoPlayerProfile(storage, api.readProfiles(storage));

    expect(player.name).toBe('Player 2');
    expect(player.key).toMatch(/^player-/);
    expect(storage.values.get('selected_player')).toBe(player.key);
    expect(JSON.parse(storage.values.get(player.key))).toEqual({
      name: 'Player 2',
      score: 0,
      scores: {}
    });
  });

  it('handles failed first-run auto-registration inside recognition', async () => {
    const originalSetInterval = globalThis.setInterval;
    const matched = { textContent: '' };
    globalThis.document = {
      getElementById(id) {
        return id === 'face-recognition-match' ? matched : null;
      }
    };
    globalThis.gameState = { gameReady: false };
    globalThis.setInterval = () => 1;

    const api = loadModule();
    try {
      await api.initFaceRecognitionPoc({ minSamples: 1, sampleCount: 0 });

      const result = await api.recognizeCurrentFace({
        storage: fakeStorage(),
        videoElement: {
          readyState: 2,
          videoHeight: 480,
          videoWidth: 640
        }
      });

      expect(result).toBeNull();
      expect(matched.textContent).toBe('Only captured 0 face samples.');
    } finally {
      globalThis.setInterval = originalSetInterval;
    }
  });
});
