import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/fight-mode');

const STUBBED_GLOBALS = [
  'animationState',
  'calibrationState',
  'CENTER',
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
  'textAlign',
  'TfitConfig',
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

  for (const name of ['circle', 'fill', 'image', 'text', 'textAlign', 'textSize', 'tint']) {
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
    CENTER: 'center',
    gameState: {
      curMoves: [],
      feet_position: 0,
      gameStarted: false,
      gameTimer: 0,
      gameTimerNext: 0,
      moves: [],
      my_opponent: { stamina: 6 },
      my_stamina: 6,
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
    TfitConfig: {
      cloneOpponent: vi.fn(() => ({ stamina: 6 }))
    },
    TfitLayoutState: {
      snapshot: vi.fn(() => layout())
    },
    TfitPoseDetection: {
      detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
      detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
      hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
      isInsideGuard: vi.fn(() => false),
      moveMatchesRecentGesture: vi.fn(() => false),
      posePartsFromPoses: vi.fn(poses => poses[0])
    },
    TfitRender: {
      renderFightMeters: vi.fn(),
      renderFightOpponentCharacter: vi.fn(),
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
      TfitConfig: { cloneOpponent: () => ({ stamina: 6 }) },
      TfitGameLogic: { moveDisplay: () => ({ color: [] }) },
      TfitLayoutState: { snapshot: () => layout() },
      TfitPoseDetection: {
        detectDodgeGestures: () => ({}),
        detectHandGestures: () => ({}),
        hasPoseConfidence: () => false,
        isInsideGuard: () => false,
        moveMatchesRecentGesture: () => false,
        posePartsFromPoses: () => ({})
      },
      TfitRender: {
        renderFightMeters: () => {},
        renderFightOpponentCharacter: () => {},
        renderMoveShape: () => {}
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitFightMode.renderFightMode).toBe('function');
  });

  it('supports a browser-like path when module exists without exports', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      module: {},
      TfitConfig: { cloneOpponent: () => ({ stamina: 6 }) },
      TfitGameLogic: { moveDisplay: () => ({ color: [] }) },
      TfitLayoutState: { snapshot: () => layout() },
      TfitPoseDetection: {
        detectDodgeGestures: () => ({}),
        detectHandGestures: () => ({}),
        hasPoseConfidence: () => false,
        isInsideGuard: () => false,
        moveMatchesRecentGesture: () => false,
        posePartsFromPoses: () => ({})
      },
      TfitRender: {
        renderFightMeters: () => {},
        renderFightOpponentCharacter: () => {},
        renderMoveShape: () => {}
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitFightMode.renderFightMode).toBe('function');
  });
});

describe('fight mode rendering', () => {
  it('positions fight prompts on the calibrated guard circles', () => {
    const api = installGlobals();

    expect(api.__fightPromptPositionForTest(1)).toEqual({
      pairedX: undefined,
      x: 200,
      y: 160
    });
    expect(api.__fightPromptPositionForTest(2)).toEqual({
      pairedX: undefined,
      x: 440,
      y: 160
    });
    expect(api.__fightPromptPositionForTest(9)).toEqual({
      pairedX: 200,
      x: 440,
      y: 160
    });
    expect(api.__fightPromptPositionForTest(10)).toEqual({
      pairedX: 440,
      x: 200,
      y: 160
    });
    expect(api.__fightPromptPositionForTest(99)).toEqual({
      pairedX: undefined,
      x: 320,
      y: 96
    });
  });

  it('renders compact fight prompt labels', () => {
    const api = installGlobals();

    expect(api.__fightPromptLabelForTest(1)).toBe('JAB');
    expect(api.__fightPromptLabelForTest(2)).toBe('JAB');
    expect(api.__fightPromptLabelForTest(99)).toBe('');
  });

  it('renders meters and exits cleanly without poses', () => {
    const api = installGlobals();

    api.renderFightMode();

    expect(globalThis.gameState.shadow_focus).toBe(0);
    expect(globalThis.TfitRender.renderFightMeters).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderFightOpponentCharacter).toHaveBeenCalledWith({
      layout: expect.objectContaining({ height: 480, width: 640 })
    });
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
      [10, 15, 12],
      [20, 30, 48],
      [40, 50, 48]
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
      x: 200,
      y: 160
    }, 96, undefined);
    expect(calls.text).toEqual([
      ['JAB', 200, 160]
    ]);
    expect(globalThis.TfitRender.renderFightOpponentCharacter).toHaveBeenCalledWith({
      layout: expect.objectContaining({ height: 480, width: 640 })
    });
    expect(calls.image).toEqual([]);
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
        detectDodgeGestures: vi.fn(() => ({ down: true, left: true, right: true })),
        detectHandGestures: vi.fn(() => ({ hook: true, jab: true, uppercut: true })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => true),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.timingState).toMatchObject({
      downDodge: 10_000,
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
        my_stamina: 6,
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
    expect(globalThis.gameState.curMoves[0].hit).toBe(true);
    expect(globalThis.gameState.my_opponent.stamina).toBe(5);
    expect(globalThis.animationState.opponent.reaction).toEqual({
      duration: 30,
      frame: 1,
      type: 5
    });
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

  it('skips the nose indicator when nose confidence is low but still renders guarded hand movement', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30, tag: 'left' },
      nose: { confidence: 0.05, x: 10, y: 15, tag: 'nose' },
      rightHand: { confidence: 0.9, x: 40, y: 50, tag: 'right' }
    };
    const api = installGlobals({
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
        hasPoseConfidence: vi.fn(point => point && point.confidence > 0.1 && point.tag !== 'nose'),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(calls.circle).toContainEqual([20, 30, 48]);
    expect(calls.circle).toContainEqual([40, 50, 48]);
    expect(globalThis.gameState.curMoves[0].type).toBe(1);
    expect(globalThis.TfitRender.renderFightOpponentCharacter).toHaveBeenCalledWith({
      layout: expect.objectContaining({ height: 480, width: 640 })
    });
    expect(globalThis.animationState.opponent.frame).toBe(-1);
    expect(globalThis.gameState.curMoves[0].reactionFrames).toBe(1);
  });

  it('does not enqueue a scheduled move when the next move slot is negative', () => {
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
        gameTimer: 45,
        gameTimerNext: 0,
        moves: [0, -1],
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

    expect(globalThis.gameState.curMoves).toHaveLength(1);
    expect(globalThis.gameState.gameTimerNext).toBe(1);
    expect(globalThis.gameState.curMoves[0]).toEqual({ hit: true, type: 1 });
  });

  it('does not reduce opponent stamina when the punch prompt does not match', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 2 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 7 },
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        leftDodge: 0,
        leftHook: 0,
        leftJab: 9950,
        leftPoses: 9800,
        leftUppercut: 0,
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

    expect(globalThis.animationState.player.type).toBe(1);
    expect(globalThis.gameState.my_opponent.stamina).toBe(7);
  });

  it('renders fallback when opponent frame is negative and prompt is active', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 0, frame: -2, type: 1 },
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

    expect(globalThis.animationState.opponent.frame).toBe(-2);
    expect(globalThis.TfitRender.renderFightOpponentCharacter).not.toHaveBeenCalledWith({
      frame: 0,
      layout: expect.objectContaining({ height: 480, width: 640 }),
      type: 1
    });
  });

  it('skips left and right hand pose processing when confidence is too low', () => {
    const trackedPose = {
      leftHand: { confidence: 0.05, x: 20, y: 30 },
      nose: { confidence: 0.95, x: 10, y: 15 },
      rightHand: { confidence: 0.05, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameStarted: true,
        gameTimer: 0,
        gameTimerNext: 0,
        moves: [],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => point && point.confidence > 0.1 && point.confidence < 0.9 ? false : Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => true),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.timingState.leftPoses).toBe(0);
    expect(globalThis.timingState.rightPoses).toBe(0);
    expect(globalThis.timingState.leftHook).toBe(0);
    expect(globalThis.timingState.rightHook).toBe(0);
  });

  it('queues the first fight move without silent placeholders', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 0,
        moves: [0, 1, 2],
        my_opponent: { stamina: 6 },
        opponent: 0
      },
      pose: {},
      poses: [{
        leftHand: { confidence: 0.9, x: 20, y: 30 },
        nose: { confidence: 0.9, x: 10, y: 15 },
        rightHand: { confidence: 0.9, x: 40, y: 50 }
      }],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(() => true),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(poses => poses[0])
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves.at(-1)).toMatchObject({
      hit: false,
      type: 1,
      x: 0,
      y: 0
    });
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
        gameTimer: 100,
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
    expect(globalThis.animationState.opponent).toMatchObject({ frame: -1, delay: 0 });
    expect(globalThis.gameState.curMoves.at(-1).reactionFrames).toBe(1);
  });

  it('marks the current prompt complete when answered before the opponent attacks', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, reactionFrames: 4, type: 1 }],
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
        moveMatchesRecentGesture: vi.fn(() => true),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves[0].hit).toBe(true);
    expect(globalThis.animationState.opponent).toMatchObject({ delay: 0, frame: -1 });
  });

  it('starts a punch opponent attack after the reaction window expires', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, reactionFrames: 120, type: 1 }],
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
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.animationState.opponent).toMatchObject({ delay: 1, frame: 1, type: 1 });
  });

  it('uses random opponent animation type for dodge prompts', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, reactionFrames: 120, type: 9 }],
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
    expect(globalThis.gameState.my_stamina).toBe(5);
    expect(globalThis.animationState.opponent).toMatchObject({ delay: 1, frame: -1 });
    expect(globalThis.animationState.player).toMatchObject({ delay: 1, frame: -1 });
  });

  it('initializes player stamina when an opponent hit lands before stamina exists', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 0, frame: 6, reaction: { duration: 30, frame: 1, type: 1 }, type: 1 },
        player: { delay: 0, frame: -1, type: 4 }
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

    expect(globalThis.gameState.my_stamina).toBe(5);
  });

  it('marks a dodge prompt successful without reducing stamina', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, reactionFrames: 4, type: 9 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        my_stamina: 6,
        opponent: 0
      },
      randomInteger: vi.fn(() => 2),
      poses: [trackedPose],
      timingState: {
        downDodge: 9950,
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
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => true),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves[0]).toMatchObject({
      hit: true,
    });
    expect(globalThis.gameState.my_opponent.stamina).toBe(6);
    expect(globalThis.timingState.hitSuccess).toBe(10_000);
    expect(globalThis.timingState.hitSuccessText).toBe('NICE DODGE');
    expect(globalThis.randomInteger).toHaveBeenCalledWith(1, 2);
    expect(globalThis.animationState.opponent).toMatchObject({
      frame: 1,
      type: 2
    });
  });

  it('marks side dodge prompts successful without reducing stamina or requiring guard timing', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, reactionFrames: 4, type: 7 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        my_stamina: 6,
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        downDodge: 0,
        leftDodge: 9950,
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
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves[0]).toMatchObject({
      hit: true,
    });
    expect(globalThis.gameState.my_opponent.stamina).toBe(6);
    expect(globalThis.timingState.hitSuccessText).toBe('NICE DODGE');
    expect(globalThis.TfitPoseDetection.moveMatchesRecentGesture).not.toHaveBeenCalled();
  });

  it('marks right dodge prompts successful from dodge timing alone', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, reactionFrames: 4, type: 8 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        my_stamina: 6,
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        downDodge: 0,
        leftDodge: 0,
        leftHook: 0,
        leftJab: 0,
        leftPoses: 0,
        leftUppercut: 0,
        rightDodge: 9950,
        rightHook: 0,
        rightJab: 0,
        rightPoses: 0,
        rightUppercut: 0
      },
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves[0].hit).toBe(true);
    expect(globalThis.gameState.my_opponent.stamina).toBe(6);
    expect(globalThis.TfitPoseDetection.moveMatchesRecentGesture).not.toHaveBeenCalled();
  });

  it('keeps an active opponent punch animating after a successful dodge', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 1, frame: 2, type: 1 },
        player: { delay: 0, frame: -1, type: 0 }
      },
      gameState: {
        curMoves: [{ hit: false, reactionFrames: 120, type: 7 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        my_stamina: 6,
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        downDodge: 0,
        leftDodge: 9950,
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
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.curMoves[0].hit).toBe(true);
    expect(globalThis.animationState.opponent).toMatchObject({
      delay: 2,
      frame: 2,
      type: 1
    });
    expect(globalThis.gameState.my_stamina).toBe(6);
  });

  it('resets a completed opponent punch after a successful dodge and expires hit reactions', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: {
          delay: 0,
          frame: 6,
          reaction: { duration: 2, frame: 1, type: 1 },
          type: 1
        },
        player: { delay: 0, frame: -1, type: 0 }
      },
      gameState: {
        curMoves: [{ hit: true, reactionFrames: 120, type: 7 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        my_stamina: 6,
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.animationState.opponent).toMatchObject({
      delay: 1,
      frame: -1,
      reaction: null
    });
  });

  it('waits for player animation to finish before completing fight ending', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 0, frame: -1, reaction: null, type: 0 },
        player: { delay: 0, frame: 6, type: 1 }
      },
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        feet_position: 0,
        fightEnding: true,
        gameOver: false,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 0 },
        my_stamina: 6,
        opponent: 0
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        detectDodgeGestures: vi.fn(() => ({ left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.animationState.player).toMatchObject({
      delay: 0,
      frame: -1
    });
    expect(globalThis.gameState.gameOver).toBe(true);
    expect(globalThis.gameState.gameStarted).toBe(false);
  });

  it('ends the fight when the opponent stamina reaches zero', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 1 }],
        feet_position: 0,
        gameOver: false,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 1 },
        my_stamina: 6,
        opponent: 0
      },
      poses: [trackedPose],
      timingState: {
        leftDodge: 0,
        leftHook: 0,
        leftJab: 9950,
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
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderFightMode();

    expect(globalThis.gameState.my_opponent.stamina).toBe(0);
    expect(globalThis.gameState.fightEnding).toBe(true);
    expect(globalThis.gameState.gameOver).toBe(false);
    expect(globalThis.gameState.gameStarted).toBe(true);
    expect(globalThis.gameState.manualStop).toBe(true);

    globalThis.animationState.player.frame = -1;
    globalThis.animationState.opponent.reaction = null;
    api.renderFightMode();

    expect(globalThis.gameState.fightEnding).toBe(true);
    expect(globalThis.gameState.gameOver).toBe(true);
    expect(globalThis.gameState.gameStarted).toBe(false);
    expect(globalThis.gameState.manualStop).toBe(true);
    expect(globalThis.animationState.opponent.frame).toBe(-1);
  });

  it('ends the fight when player stamina reaches zero', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 20, y: 30 },
      nose: { confidence: 0.9, x: 10, y: 15 },
      rightHand: { confidence: 0.9, x: 40, y: 50 }
    };
    const api = installGlobals({
      animationState: {
        opponent: { delay: 0, frame: 6, type: 1 },
        player: { delay: 0, frame: -1, type: 0 }
      },
      gameState: {
        curMoves: [{ hit: false, type: 1 }],
        feet_position: 0,
        gameOver: false,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: [],
        my_opponent: { stamina: 6 },
        my_stamina: 1,
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

    expect(globalThis.gameState.my_stamina).toBe(0);
    expect(globalThis.gameState.fightEnding).toBe(true);
    expect(globalThis.gameState.gameOver).toBe(true);
    expect(globalThis.gameState.gameStarted).toBe(false);
    expect(globalThis.gameState.manualStop).toBe(true);
    expect(globalThis.animationState.opponent).toMatchObject({
      delay: 0,
      frame: -1,
      reaction: null,
      type: 0
    });
    expect(globalThis.animationState.player).toMatchObject({
      delay: 0,
      frame: -1,
      type: 0
    });
  });
});
