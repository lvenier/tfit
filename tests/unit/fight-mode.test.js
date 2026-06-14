import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/fight-mode');

const STUBBED_GLOBALS = [
  'animationState',
  'calibrationState',
  'circle',
  'fill',
  'gameState',
  'hide_sensor',
  'image',
  'images',
  'isDetecting',
  'leftHand',
  'MOVE_TYPE',
  'nose',
  'pose',
  'poses',
  'randomInteger',
  'rightHand',
  'text',
  'textSize',
  'timingState',
  'tint',
  'TfitFightMode',
  'TfitGameLogic',
  'TfitLayoutState',
  'TfitPoseDetection',
  'TfitRender'
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
    coef: 2,
    frameRate: 20,
    height: 480,
    levelWindowBase: 50,
    objectPoseSize: 96,
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

  for (const name of ['circle', 'fill', 'image', 'text', 'textSize', 'tint']) {
    calls[name] = [];
    globalThis[name] = record(name);
  }

  Object.assign(globalThis, {
    animationState: {
      opponent: { delay: 0, frame: -1, type: 0 },
      player: { delay: 0, frame: -1, type: 0 }
    },
    calibrationState: {
      init_jab_y: 100,
      init_uppercut_y: 300,
      left_init_hook_x: 120,
      left_init_pose_x: 200,
      left_init_pose_y: 160,
      right_init_hook_x: 520,
      right_init_pose_x: 440,
      right_init_pose_y: 160
    },
    gameState: {
      curMoves: [],
      feet_position: 0,
      gameStarted: false,
      gameTimer: 0,
      gameTimerNext: 0,
      moves: [],
      my_opponent: { stamina: 6 },
      opponent: 0,
      shadow_focus: 1
    },
    hide_sensor: 64,
    images: {
      me: { name: 'me' },
      meAnimations: Array.from({ length: 9 }, (_unused, type) => Array.from({ length: 7 }, (_frameUnused, frame) => ({ name: `me-${type}-${frame}` }))),
      opponentAnimations: Array.from({ length: 9 }, (_unused, type) => Array.from({ length: 7 }, (_frameUnused, frame) => ({ name: `opponent-${type}-${frame}` }))),
      opponents: [{ name: 'opponent' }]
    },
    isDetecting: true,
    MOVE_TYPE: {
      1: 'LEFT_JAB',
      2: 'RIGHT_JAB',
      3: 'LEFT_HOOK',
      4: 'RIGHT_HOOK',
      5: 'LEFT_UPPERCUT',
      6: 'RIGHT_UPPERCUT',
      7: 'LEFT_DODGE',
      8: 'RIGHT_DODGE',
      9: 'DOWN_DODGE'
    },
    nose: undefined,
    pose: {},
    poses: [],
    randomInteger: vi.fn(() => 1),
    timingState: {
      leftDodge: 0,
      leftHook: 0,
      leftJab: 0,
      leftPoses: 0,
      leftUppercut: 0,
      rightDodge: 0,
      rightHook: 0,
      rightJab: 0,
      rightPoses: 0,
      rightUppercut: 0
    },
    TfitGameLogic: {
      moveDisplay: vi.fn(() => ({ color: [1, 2, 3] }))
    },
    TfitLayoutState: {
      snapshot: vi.fn(() => layout())
    },
    TfitPoseDetection: {
      detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
      detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
      hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
      isInsideGuard: vi.fn(() => false),
      posePartsFromPoses: vi.fn(poses => poses[0])
    },
    TfitRender: {
      renderFightMeters: vi.fn(),
      renderMoveShape: vi.fn()
    }
  }, overrides);

  vi.useFakeTimers();
  vi.setSystemTime(10_000);

  delete require.cache[modulePath];
  return require('../../js/fight-mode');
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

describe('TfitFightMode exports', () => {
  it('exposes fight mode renderer', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual(['renderFightMode']);
    expect(globalThis.TfitFightMode).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      TfitGameLogic: { moveDisplay: () => ({ color: [] }) },
      TfitLayoutState: { snapshot: () => layout() },
      TfitPoseDetection: {
        detectDodgeGestures: () => ({}),
        detectHandGestures: () => ({}),
        hasPoseConfidence: () => false,
        isInsideGuard: () => false,
        posePartsFromPoses: () => ({})
      },
      TfitRender: {
        renderFightMeters: () => {},
        renderMoveShape: () => {}
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitFightMode.renderFightMode).toBe('function');
  });
});

describe('fight mode rendering', () => {
  it('renders meters and exits cleanly without poses', () => {
    const api = installGlobals();

    api.renderFightMode();

    expect(globalThis.gameState.shadow_focus).toBe(0);
    expect(globalThis.TfitRender.renderFightMeters).toHaveBeenCalledTimes(1);
    expect(calls.circle).toEqual([]);
  });

  it('uses layout snapshot values for pose drawing and gesture detection', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: true, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(calls.circle).toEqual([
      [20, 30, 12],
      [40, 60, 48],
      [80, 100, 48]
    ]);
    expect(globalThis.TfitPoseDetection.detectDodgeGestures).toHaveBeenCalledWith(expect.objectContaining({
      coef: 2,
      levelWindow: 500,
      objectPoseSize: 96
    }));
    expect(globalThis.TfitPoseDetection.detectHandGestures).toHaveBeenCalledWith(expect.objectContaining({
      coef: 2,
      levelWindow: 500,
      side: 'left'
    }));
  });

  it('renders active fight prompts from snapshot layout', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 60,
        gameTimerNext: 2,
        moves: [0, 1, 2],
        my_opponent: { stamina: 6 },
        opponent: 0,
        shadow_focus: 1
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.TfitRender.renderMoveShape).toHaveBeenCalledWith({
      type: 1,
      x: 320,
      y: 96
    }, 96);
    expect(calls.text).toEqual([
      ['LEFT_JAB', 272, 96]
    ]);
    expect(calls.image).toContainEqual([
      globalThis.images.opponents[0],
      640 / 3,
      480 / 4,
      640 / 3,
      480 / 2
    ]);
    expect(globalThis.gameState.gameTimer).toBe(61);
  });

  it('updates guard, gesture, and dodge timing from detected poses', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: true, right: true })),
        detectHandGestures: vi.fn(() => ({ hook: true, jab: true, uppercut: true })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => true),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.timingState).toMatchObject({
      leftDodge: 10_000,
      leftHook: 10_000,
      leftJab: 10_000,
      leftPoses: 10_000,
      leftUppercut: 10_000,
      rightDodge: 10_000,
      rightHook: 10_000,
      rightJab: 10_000,
      rightPoses: 10_000,
      rightUppercut: 10_000
    });
    expect(calls.circle).toContainEqual([200, 160, 96]);
    expect(calls.circle).toContainEqual([440, 160, 96]);
  });

  it('starts left and right dodge player animations', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        leftDodge: 0,
        leftHook: 0,
        leftJab: 0,
        leftPoses: 9800,
        leftUppercut: 0,
        rightDodge: 9950,
        rightHook: 0,
        rightJab: 0,
        rightPoses: 9800,
        rightUppercut: 0
      },
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();
    expect(globalThis.animationState.player).toMatchObject({ type: 1, frame: 1, delay: 1 });

    globalThis.animationState.player = { delay: 0, frame: -1, type: 0 };
    globalThis.timingState.rightDodge = 0;
    globalThis.timingState.leftDodge = 9950;
    api.renderFightMode();
    expect(globalThis.animationState.player.type).toBe(2);
  });

  it('starts punch animations and reduces opponent stamina for matching prompts', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 5 }],
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        leftDodge: 0,
        leftHook: 0,
        leftJab: 0,
        leftPoses: 9800,
        leftUppercut: 9950,
        rightDodge: 0,
        rightHook: 0,
        rightJab: 0,
        rightPoses: 9800,
        rightUppercut: 0
      },
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.animationState.player.type).toBe(5);
    expect(globalThis.timingState.leftPoses).toBe(9500);
    expect(globalThis.gameState.my_opponent.stamina).toBe(5);
  });

  it('starts each remaining punch animation from recent punch timing', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 1 }],
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 10 },
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    for (const { poseTime, side, timeKey, type } of [
      { poseTime: 'leftPoses', side: 'left', timeKey: 'leftJab', type: 1 },
      { poseTime: 'leftPoses', side: 'left', timeKey: 'leftHook', type: 3 },
      { poseTime: 'rightPoses', side: 'right', timeKey: 'rightUppercut', type: 6 },
      { poseTime: 'rightPoses', side: 'right', timeKey: 'rightJab', type: 2 },
      { poseTime: 'rightPoses', side: 'right', timeKey: 'rightHook', type: 4 }
    ]) {
      globalThis.animationState.player = { delay: 0, frame: -1, type: 0 };
      Object.assign(globalThis.timingState, {
        leftDodge: 0,
        leftHook: 0,
        leftJab: 0,
        leftPoses: 0,
        leftUppercut: 0,
        rightDodge: 0,
        rightHook: 0,
        rightJab: 0,
        rightPoses: 0,
        rightUppercut: 0
      });
      globalThis.timingState[poseTime] = 9800;
      globalThis.timingState[timeKey] = 9950;
      globalThis.gameState.curMoves = [{ hit: false, type }];

      api.renderFightMode();

      expect(globalThis.animationState.player.type).toBe(type);
      expect(globalThis.timingState[side === 'left' ? 'leftPoses' : 'rightPoses']).toBe(9500);
    }
  });

  it('queues scheduled moves and advances opponent animations', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [
          { hit: true, type: 1 },
          { hit: true, type: 1 },
          { hit: true, type: 1 },
          { hit: true, type: 1 }
        ],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 60,
        gameTimerNext: 0,
        moves: [0, 1, 2],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves.at(-1)).toMatchObject({ hit: false, type: 2 });
    expect(globalThis.gameState.gameTimerNext).toBe(1);
    expect(globalThis.animationState.opponent).toMatchObject({ type: 2, frame: 1, delay: 1 });
  });

  it('uses random opponent animation type for dodge prompts', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 9 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      randomInteger: vi.fn(() => 2),
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.randomInteger).toHaveBeenCalledWith(1, 2);
    expect(globalThis.animationState.opponent.type).toBe(2);
  });

  it('leaves animation frames unchanged on non-advance delays', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 1, frame: 2, type: 1 },
        player: { delay: 1, frame: 2, type: 1 }
      },
      gameState: {
        curMoves: [{ hit: false, type: 1 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.animationState.opponent).toMatchObject({ delay: 2, frame: 2 });
    expect(globalThis.animationState.player).toMatchObject({ delay: 2, frame: 2 });
  });

  it('does not reduce stamina when the same punch animation is not repeated consecutively', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 2 }],
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        leftDodge: 0,
        leftHook: 0,
        leftJab: 9850,
        leftPoses: 9800,
        leftUppercut: 0,
        rightDodge: 0,
        rightHook: 0,
        rightJab: 0,
        rightPoses: 0,
        rightUppercut: 0
      },
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: true, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.my_opponent.stamina).toBe(6);
    expect(globalThis.animationState.player.type).toBe(1);
    expect(globalThis.timingState.leftPoses).toBe(9500);
  });

  it('covers no-confidence branches for nose and hands', () => {
    const trackedPose = {
      leftHand: { confidence: 0.05, x: 20, y: 30 },
      nose: { confidence: 0.05, x: 10, y: 15 },
      rightHand: { confidence: 0.05, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameStarted: true,
        gameTimer: 60,
        gameTimerNext: 0,
        moves: [1],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: true, right: true })),
        detectHandGestures: vi.fn(() => ({ hook: true, jab: true, uppercut: true })),
        hasPoseConfidence: vi.fn(() => false),
        isInsideGuard: vi.fn(() => true),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.gameTimerNext).toBe(1);
    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.TfitPoseDetection.detectDodgeGestures).not.toHaveBeenCalled();
    expect(globalThis.TfitPoseDetection.detectHandGestures).not.toHaveBeenCalled();
    expect(calls.circle).toEqual([]);
  });

  it('covers opponent animation branch when opponent frame is below zero', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 0, frame: -2, type: 0 },
        player: { delay: 0, frame: -1, type: 0 }
      },
      gameState: {
        curMoves: [{ hit: false, type: 1 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(calls.image).toContainEqual([
      globalThis.images.me,
      640 / 3.5,
      480 / 2,
      640 / 2.2,
      480 / 2
    ]);
  });

  it('marks opponent animation complete and resets player animation complete', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 0, frame: 6, type: 1 },
        player: { delay: 0, frame: 6, type: 1 }
      },
      gameState: {
        curMoves: [{ hit: false, type: 1 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves[0].hit).toBe(true);
    expect(globalThis.animationState.opponent).toMatchObject({ delay: 1, frame: -1 });
    expect(globalThis.animationState.player).toMatchObject({ delay: 1, frame: -1 });
  });
});
