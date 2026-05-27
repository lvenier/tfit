import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/camera-runtime');

const STUBBED_GLOBALS = [
  'bodyPose',
  'error',
  'errorTimer',
  'gameState',
  'isDetecting',
  'leftHand',
  'ml5',
  'MODELS',
  'nose',
  'pose',
  'poseModelIndex',
  'poses',
  'rightHand',
  'TfitCameraRuntime',
  'TfitGameLogic',
  'video',
  'VIDEO'
];

const originalGlobals = new Map();

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  Object.assign(globalThis, {
    bodyPose: {
      detectStart: vi.fn(),
      detectStop: vi.fn()
    },
    error: '',
    errorTimer: 0,
    gameState: {
      gameReady: false
    },
    isDetecting: false,
    leftHand: null,
    ml5: {
      bodyPose: vi.fn()
    },
    MODELS: ['MoveNet'],
    nose: null,
    pose: {},
    poseModelIndex: 0,
    poses: [],
    rightHand: null,
    TfitGameLogic: {
      detectStartCondition: vi.fn(() => ({
        error: '',
        errorTimer: 1,
        gameReady: false
      }))
    },
    video: {
      hide: vi.fn()
    },
    VIDEO: 'video'
  }, overrides);

  delete require.cache[modulePath];
  return require('../../js/camera-runtime');
}

afterEach(() => {
  vi.restoreAllMocks();
  delete require.cache[modulePath];
  for (const name of STUBBED_GLOBALS) {
    const original = originalGlobals.get(name);
    if (original === undefined) {
      delete globalThis[name];
    } else {
      globalThis[name] = original;
    }
  }
  originalGlobals.clear();
});

describe('TfitCameraRuntime exports', () => {
  it('exposes camera runtime helpers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'cameraAccessErrorMessage',
      'checkStartCondition',
      'gotPoses',
      'initCameraRuntime',
      'isSecureCameraOrigin',
      'startPoseDetection',
      'stopPoseDetection'
    ]);
    expect(globalThis.TfitCameraRuntime).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      TfitGameLogic: {
        detectStartCondition: () => ({ errorTimer: 0, gameReady: false })
      }
    };

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitCameraRuntime.initCameraRuntime).toBe('function');
    expect(typeof sandbox.gotPoses).toBe('function');
  });
});

describe('pose detection lifecycle', () => {
  it('starts and stops pose detection only when needed', () => {
    const api = installGlobals();

    expect(api.startPoseDetection()).toBe(true);
    expect(globalThis.bodyPose.detectStart).toHaveBeenCalledWith(globalThis.video, api.gotPoses);
    expect(globalThis.isDetecting).toBe(true);

    expect(api.startPoseDetection()).toBe(false);
    expect(globalThis.bodyPose.detectStart).toHaveBeenCalledTimes(1);

    expect(api.stopPoseDetection()).toBe(true);
    expect(globalThis.bodyPose.detectStop).toHaveBeenCalledTimes(1);
    expect(globalThis.isDetecting).toBe(false);

    expect(api.stopPoseDetection()).toBe(false);
    expect(globalThis.bodyPose.detectStop).toHaveBeenCalledTimes(1);
  });

  it('does not start or stop when bodyPose is unavailable', () => {
    const api = installGlobals({ bodyPose: null });

    expect(api.startPoseDetection()).toBe(false);
    expect(api.stopPoseDetection()).toBe(false);
  });

  it('initializes camera capture, model, and detection', async () => {
    const createdVideo = { hide: vi.fn() };
    const createdBodyPose = {
      detectStart: vi.fn(),
      detectStop: vi.fn()
    };
    const captureFactory = vi.fn(() => createdVideo);
    const modelFactory = vi.fn(async () => createdBodyPose);
    const api = installGlobals({ bodyPose: null, video: null });

    await expect(api.initCameraRuntime({ captureFactory, modelFactory, videoMode: 'camera' })).resolves.toBe(true);

    expect(captureFactory).toHaveBeenCalledWith('camera', { flipped: true });
    expect(createdVideo.hide).toHaveBeenCalledTimes(1);
    expect(modelFactory).toHaveBeenCalledWith('MoveNet', {
      flipped: true,
      modelUrl: 'js/ml5js/model.json'
    });
    expect(globalThis.video).toBe(createdVideo);
    expect(globalThis.bodyPose).toBe(createdBodyPose);
    expect(globalThis.isDetecting).toBe(true);
    expect(createdBodyPose.detectStart).toHaveBeenCalledWith(createdVideo, api.gotPoses);
  });

  it('records a readable error when camera capture fails', async () => {
    const api = installGlobals();

    await expect(api.initCameraRuntime({
      captureFactory: () => {
        throw new Error('blocked');
      },
      modelFactory: vi.fn()
    })).resolves.toBe(false);

    expect(globalThis.error).toBe('Camera access is not available in this browser.');
  });

  it('records specific camera permission and origin errors', async () => {
    const api = installGlobals();

    await expect(api.initCameraRuntime({
      captureFactory: () => {
        throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
      },
      location: {
        hostname: 'example.com',
        protocol: 'https:'
      },
      modelFactory: vi.fn()
    })).resolves.toBe(false);

    expect(globalThis.error).toBe(
      'Camera permission was blocked. Allow camera access in your browser settings, then reload Box4Fit.'
    );
  });

  it('prefers the HTTPS camera guidance on insecure origins', async () => {
    const api = installGlobals();

    await expect(api.initCameraRuntime({
      captureFactory: () => {
        throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
      },
      location: {
        hostname: 'example.com',
        protocol: 'http:'
      },
      modelFactory: vi.fn()
    })).resolves.toBe(false);

    expect(globalThis.error).toBe(
      'Camera access requires HTTPS unless you are running on localhost.'
    );
  });

  it('describes missing and busy camera errors', () => {
    const api = installGlobals();
    const secureOrigin = {
      hostname: 'localhost',
      protocol: 'http:'
    };

    expect(api.cameraAccessErrorMessage({ name: 'NotFoundError' }, secureOrigin)).toBe(
      'No camera was found. Connect a webcam, then reload Box4Fit.'
    );
    expect(api.cameraAccessErrorMessage({ name: 'NotReadableError' }, secureOrigin)).toBe(
      'The camera is already in use by another app. Close the other app, then reload Box4Fit.'
    );
  });

  it('records a readable error when the pose model fails to load', async () => {
    const createdVideo = { hide: vi.fn() };
    const api = installGlobals({ bodyPose: null, video: null });

    await expect(api.initCameraRuntime({
      captureFactory: vi.fn(() => createdVideo),
      modelFactory: vi.fn(() => Promise.reject(new Error('missing model')))
    })).resolves.toBe(false);

    expect(createdVideo.hide).toHaveBeenCalledTimes(1);
    expect(globalThis.error).toBe('Pose detection could not load. Check your connection or refresh Box4Fit.');
    expect(globalThis.isDetecting).toBe(false);
  });
});

describe('pose readiness', () => {
  it('stores pose detection results from ml5 callbacks', () => {
    const api = installGlobals();
    const results = [{ id: 1 }];

    api.gotPoses(results);

    expect(globalThis.poses).toBe(results);
  });

  it('applies start-condition updates to global pose state', () => {
    const readyPose = {
      left_wrist: { x: 1 },
      nose: { x: 2 },
      right_wrist: { x: 3 }
    };
    const api = installGlobals({
      TfitGameLogic: {
        detectStartCondition: vi.fn(() => ({
          error: '',
          errorTimer: 0,
          gameReady: true,
          leftHand: readyPose.left_wrist,
          nose: readyPose.nose,
          pose: readyPose,
          rightHand: readyPose.right_wrist
        }))
      }
    });

    expect(api.checkStartCondition()).toBe(true);

    expect(globalThis.TfitGameLogic.detectStartCondition).toHaveBeenCalledWith({
      errorTimer: 0,
      gameReady: false,
      poses: []
    });
    expect(globalThis.gameState.gameReady).toBe(true);
    expect(globalThis.errorTimer).toBe(0);
    expect(globalThis.pose).toBe(readyPose);
    expect(globalThis.leftHand).toBe(readyPose.left_wrist);
    expect(globalThis.rightHand).toBe(readyPose.right_wrist);
    expect(globalThis.nose).toBe(readyPose.nose);
  });

  it('keeps latest pose references when start condition only reports an error', () => {
    const existingPose = { id: 1 };
    const api = installGlobals({
      pose: existingPose,
      TfitGameLogic: {
        detectStartCondition: vi.fn(() => ({
          error: 'No hands',
          errorTimer: 7,
          gameReady: false
        }))
      }
    });

    expect(api.checkStartCondition()).toBe(false);

    expect(globalThis.error).toBe('No hands');
    expect(globalThis.errorTimer).toBe(7);
    expect(globalThis.pose).toBe(existingPose);
  });
});
