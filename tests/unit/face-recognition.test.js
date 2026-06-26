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
    expect(api.DEFAULT_CONFIG.mainMenuTimeoutMs).toBe(15000);
    expect(api.DEFAULT_CONFIG.recognitionTimeoutMs).toBe(5000);
    expect(api.DEFAULT_CONFIG.recognitionRetryDelayMs).toBe(250);
  });

  it('only treats the idle main menu as ready for recognition startup', () => {
    const api = loadModule();

    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameStarted: false,
      menu: 0,
      menuButtonAnimation: { active: false }
    })).toBe(true);
    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameStarted: false,
      menu: 1,
      menuButtonAnimation: { active: false }
    })).toBe(false);
    expect(api.isMainMenuReady({
      gameCalibration: false,
      gameStarted: true,
      menu: 0,
      menuButtonAnimation: { active: false }
    })).toBe(false);
    expect(api.isMainMenuReady({
      gameCalibration: false,
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
});
