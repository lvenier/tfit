import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/pad-mode');

const STUBBED_GLOBALS = [
  'BOLD',
  'calibrationState',
  'CENTER',
  'circle',
  'fill',
  'gameState',
  'hide_sensor',
  'hitSuccess',
  'isDetecting',
  'LEFT',
  'NORMAL',
  'nose',
  'padState',
  'pose',
  'poses',
  'randomInteger',
  'rect',
  'text',
  'textAlign',
  'textSize',
  'textStyle',
  'timingState',
  'TfitLayoutState',
  'TfitPadMode',
  'TfitPoseDetection'
];

const originalGlobals = new Map();
const calls = {};

function record(name) {
  return (...args) => {
    calls[name].push(args);
  };
}

function layout(overrides = {}) {
  return {
    coef: 1,
    height: 480,
    levelWindowBase: 50,
    objectPoseSize: 48,
    width: 640,
    ...overrides
  };
}

function installGlobals(overrides = {}) {
  for (const name of STUBBED_GLOBALS) {
    if (!originalGlobals.has(name)) {
      originalGlobals.set(name, Object.prototype.hasOwnProperty.call(globalThis, name) ? globalThis[name] : undefined);
    }
  }

  for (const name of ['circle', 'fill', 'rect', 'text', 'textAlign', 'textSize', 'textStyle']) {
    calls[name] = [];
    globalThis[name] = record(name);
  }

  Object.assign(globalThis, {
    BOLD: 'bold',
    calibrationState: {
      init_uppercut_y: 300,
      left_init_pose_x: 200,
      left_init_pose_y: 200,
      right_init_pose_x: 440,
      right_init_pose_y: 200
    },
    CENTER: 'center',
    gameState: {
      curMoves: [],
      gameStarted: false,
      gameTimer: 0
    },
    hide_sensor: 64,
    hitSuccess: vi.fn(),
    isDetecting: true,
    LEFT: 'left',
    NORMAL: 'normal',
    nose: undefined,
    padState: {
      type: 1,
      x: 100,
      y: 120
    },
    pose: {},
    poses: [],
    randomInteger: vi.fn(() => 100),
    timingState: {
      downDodge: 0,
      downDodgeDone: false,
      downDodgeSwitch: false,
      leftPoses: 0,
      rightPoses: 0
    },
    TfitLayoutState: {
      snapshot: vi.fn(() => layout())
    },
    TfitPoseDetection: {
      hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
      isInsideGuard: vi.fn(() => false),
      isPadPunchHit: vi.fn(() => false),
      nextDownDodgeState: vi.fn(() => ({
        done: false,
        switched: false,
        touchedDown: false
      })),
      posePartsFromPoses: vi.fn(poses => poses[0])
    }
  }, overrides);

  vi.useFakeTimers();
  vi.setSystemTime(10_000);

  delete require.cache[modulePath];
  return require('../../js/pad-mode');
}

afterEach(() => {
  vi.useRealTimers();
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

describe('TfitPadMode exports', () => {
  it('exposes pad mode helpers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'nextPadTarget',
      'renderPadMode'
    ]);
    expect(globalThis.TfitPadMode).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      TfitLayoutState: { snapshot: () => layout() },
      TfitPoseDetection: {
        hasPoseConfidence: () => false,
        isInsideGuard: () => false,
        isPadPunchHit: () => false,
        nextDownDodgeState: () => ({ done: false, switched: false, touchedDown: false }),
        posePartsFromPoses: () => ({})
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitPadMode.renderPadMode).toBe('function');
  });
});

describe('pad target generation', () => {
  it('uses layout dimensions to pick the next pad target', () => {
    const api = installGlobals({
      randomInteger: vi.fn()
        .mockReturnValueOnce(120)
        .mockReturnValueOnce(160)
    });

    expect(api.nextPadTarget()).toEqual({
      type: 2,
      x: 120,
      y: 160
    });

    expect(globalThis.randomInteger).toHaveBeenCalledWith(96, 544);
    expect(globalThis.randomInteger).toHaveBeenCalledWith(96, 384);
  });

  it('keeps the target as a punch when it avoids guard bands', () => {
    const api = installGlobals({
      randomInteger: vi.fn()
        .mockReturnValueOnce(320)
        .mockReturnValueOnce(360)
    });

    expect(api.nextPadTarget()).toEqual({
      type: 1,
      x: 320,
      y: 360
    });
  });

  it('uses strict guard overlap checks for dodge target generation', () => {
    const api = installGlobals({
      calibrationState: {
        init_uppercut_y: 300,
        left_init_pose_x: 220,
        left_init_pose_y: 200,
        right_init_pose_x: 200,
        right_init_pose_y: 200
      },
      randomInteger: vi.fn()
        .mockReturnValueOnce(210)
        .mockReturnValueOnce(200)
    });

    expect(api.nextPadTarget(true)).toEqual({
      type: 2,
      x: 210,
      y: 200
    });

    globalThis.randomInteger = vi.fn()
      .mockReturnValueOnce(360)
      .mockReturnValueOnce(360);

    expect(api.nextPadTarget(true)).toEqual({
      type: 1,
      x: 360,
      y: 360
    });
  });

  it('covers both branch outcomes for right-side OR guard overlap terms', () => {
    const api = installGlobals({
      calibrationState: {
        init_uppercut_y: 300,
        left_init_pose_x: 200,
        left_init_pose_y: 200,
        right_init_pose_x: 440,
        right_init_pose_y: 0
      },
      randomInteger: vi.fn()
        .mockReturnValueOnce(320)
        .mockReturnValueOnce(150)
        .mockReturnValueOnce(600)
        .mockReturnValueOnce(100)
    });

    expect(api.nextPadTarget()).toEqual({
      type: 2,
      x: 320,
      y: 150
    });
    expect(api.nextPadTarget()).toEqual({
      type: 1,
      x: 600,
      y: 100
    });

    expect(globalThis.randomInteger).toHaveBeenNthCalledWith(1, 96, 544);
    expect(globalThis.randomInteger).toHaveBeenNthCalledWith(2, 96, 384);
    expect(globalThis.randomInteger).toHaveBeenNthCalledWith(3, 96, 544);
    expect(globalThis.randomInteger).toHaveBeenNthCalledWith(4, 96, 384);
  });
});

describe('pad mode rendering', () => {
  it('does nothing when no pose is available', () => {
    const api = installGlobals();

    api.renderPadMode();

    expect(globalThis.TfitPoseDetection.posePartsFromPoses).not.toHaveBeenCalled();
    expect(calls.circle).toEqual([]);
    expect(globalThis.gameState.gameTimer).toBe(0);
  });

  it('skips marker and hand drawing for hidden or low-confidence pose parts', () => {
    const trackedPose = {
      leftHand: { confidence: 0.05, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.05, x: 40, y: 50 }
    };
    const api = installGlobals({
      isDetecting: false,
      poses: [trackedPose],
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({ done: false, switched: false, touchedDown: false })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(calls.circle).toEqual([]);
    expect(globalThis.TfitPoseDetection.isInsideGuard).not.toHaveBeenCalled();
  });

  it('draws tracked pose markers with snapshot layout values', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      poses: [trackedPose],
      TfitLayoutState: {
        snapshot: vi.fn(() => layout({ coef: 2, objectPoseSize: 96 }))
      },
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({ done: false, switched: false, touchedDown: false })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(calls.circle).toEqual([
      [20, 30, 12],
      [40, 60, 48],
      [80, 100, 48]
    ]);
  });

  it('handles a left pad punch hit and queues the next move', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameStarted: true,
        gameTimer: 0
      },
      poses: [trackedPose],
      randomInteger: vi.fn()
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(360)
        .mockReturnValueOnce(320)
        .mockReturnValueOnce(360),
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => true),
        nextDownDodgeState: vi.fn(() => ({ done: false, switched: false, touchedDown: false })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(globalThis.TfitPoseDetection.isPadPunchHit).toHaveBeenCalledWith(expect.objectContaining({
      coef: 1,
      levelWindow: 500,
      objectPoseSize: 48,
      padX: 100,
      padY: 360
    }));
    expect(globalThis.hitSuccess).toHaveBeenCalledWith(0);
    expect(globalThis.gameState.curMoves).toEqual([
      { hit: false, type: 1, x: 100, y: 360 },
      { hit: false, type: 1, x: 320, y: 360 }
    ]);
    expect(globalThis.gameState.gameTimer).toBe(1);
  });

  it('keeps the current punch target after a left miss', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 1, x: 100, y: 360 }],
        gameStarted: true,
        gameTimer: 1
      },
      padState: {
        type: 1,
        x: 100,
        y: 360
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({ done: false, switched: false, touchedDown: false })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(calls.text).toContainEqual(['L', 100, 360]);
    expect(globalThis.hitSuccess).not.toHaveBeenCalled();
    expect(globalThis.gameState.curMoves).toEqual([{ hit: false, type: 1, x: 100, y: 360 }]);
  });

  it('handles a right pad punch hit and resets right guard timing', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 1, x: 400, y: 360 }],
        gameStarted: true,
        gameTimer: 1
      },
      padState: {
        type: 1,
        x: 400,
        y: 360
      },
      poses: [trackedPose],
      randomInteger: vi.fn()
        .mockReturnValueOnce(320)
        .mockReturnValueOnce(360),
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => true),
        nextDownDodgeState: vi.fn(() => ({ done: false, switched: false, touchedDown: false })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(calls.text).toContainEqual(['R', 400, 360]);
    expect(globalThis.TfitPoseDetection.isPadPunchHit).toHaveBeenCalledWith(expect.objectContaining({
      guardTime: 0,
      hand: trackedPose.rightHand,
      padX: 400
    }));
    expect(globalThis.timingState.rightPoses).toBe(9500);
    expect(globalThis.hitSuccess).toHaveBeenCalledWith(0);
  });

  it('keeps the current punch target after a right miss', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 1, x: 400, y: 360 }],
        gameStarted: true,
        gameTimer: 1
      },
      padState: {
        type: 1,
        x: 400,
        y: 360
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({ done: false, switched: false, touchedDown: false })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(calls.text).toContainEqual(['R', 400, 360]);
    expect(globalThis.hitSuccess).not.toHaveBeenCalled();
    expect(globalThis.gameState.curMoves).toEqual([{ hit: false, type: 1, x: 400, y: 360 }]);
  });

  it('updates guard timing when hands are inside guard targets', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      poses: [trackedPose],
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => true),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({ done: false, switched: false, touchedDown: false })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(globalThis.timingState.leftPoses).toBe(10_000);
    expect(globalThis.timingState.rightPoses).toBe(10_000);
    expect(calls.circle).toContainEqual([200, 200, 48]);
    expect(calls.circle).toContainEqual([440, 200, 48]);
  });

  it('handles a completed down dodge pad target', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 200 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 2, x: 96, y: 276 }],
        gameStarted: true,
        gameTimer: 1
      },
      padState: {
        type: 2,
        x: 96,
        y: 276
      },
      poses: [trackedPose],
      randomInteger: vi.fn()
        .mockReturnValueOnce(320)
        .mockReturnValueOnce(360),
      timingState: {
        downDodge: 9900,
        downDodgeDone: true,
        downDodgeSwitch: true,
        leftPoses: 0,
        rightPoses: 0
      },
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({
          done: true,
          switched: true,
          touchedDown: true
        })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(calls.rect).toContainEqual([48, 276, 544, 48, 20]);
    expect(calls.text).toContainEqual(['D', 320, 300]);
    expect(globalThis.timingState.downDodge).toBe(9500);
    expect(globalThis.timingState.downDodgeDone).toBe(false);
    expect(globalThis.timingState.downDodgeSwitch).toBe(false);
    expect(globalThis.hitSuccess).toHaveBeenCalledWith(0);
    expect(globalThis.gameState.curMoves.at(-1)).toEqual({ hit: false, type: 1, x: 320, y: 360 });
  });

  it('updates down dodge state without completing the pad target', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 200 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 2, x: 96, y: 276 }],
        gameStarted: true,
        gameTimer: 1
      },
      padState: {
        type: 2,
        x: 96,
        y: 276
      },
      poses: [trackedPose],
      timingState: {
        downDodge: 0,
        downDodgeDone: false,
        downDodgeSwitch: false,
        leftPoses: 0,
        rightPoses: 0
      },
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({
          done: true,
          switched: false,
          touchedDown: true
        })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(globalThis.timingState.downDodge).toBe(10_000);
    expect(globalThis.timingState.downDodgeDone).toBe(true);
    expect(globalThis.timingState.downDodgeSwitch).toBe(false);
    expect(globalThis.hitSuccess).not.toHaveBeenCalled();
    expect(globalThis.gameState.curMoves).toEqual([{ hit: false, type: 2, x: 96, y: 276 }]);
  });

  it('keeps stale down dodge targets incomplete without touching down', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 200 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 2, x: 96, y: 276 }],
        gameStarted: true,
        gameTimer: 1
      },
      padState: {
        type: 2,
        x: 96,
        y: 276
      },
      poses: [trackedPose],
      timingState: {
        downDodge: 9000,
        downDodgeDone: true,
        downDodgeSwitch: true,
        leftPoses: 0,
        rightPoses: 0
      },
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({
          done: true,
          switched: true,
          touchedDown: false
        })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(globalThis.timingState.downDodge).toBe(9000);
    expect(globalThis.timingState.downDodgeDone).toBe(true);
    expect(globalThis.timingState.downDodgeSwitch).toBe(true);
    expect(globalThis.hitSuccess).not.toHaveBeenCalled();
  });

  it('ignores unknown pad target types and only advances the game timer', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 1, x: 100, y: 200 }],
        gameStarted: true,
        gameTimer: 7
      },
      padState: {
        type: 99,
        x: 100,
        y: 200
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        isPadPunchHit: vi.fn(() => false),
        nextDownDodgeState: vi.fn(() => ({
          done: false,
          switched: false,
          touchedDown: false
        })),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderPadMode();

    expect(calls.text).toEqual([]);
    expect(globalThis.gameState.curMoves).toEqual([{ hit: false, type: 1, x: 100, y: 200 }]);
    expect(globalThis.gameState.gameTimer).toBe(8);
  });
});
