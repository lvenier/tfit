import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../js/shadow-mode');

const STUBBED_GLOBALS = [
  'BOLD',
  'calibrationState',
  'CENTER',
  'circle',
  'fill',
  'gameResultBool',
  'gameState',
  'hide_sensor',
  'hitSuccess',
  'isDetecting',
  'LEFT',
  'leftHand',
  'NORMAL',
  'nose',
  'pose',
  'poses',
  'punchSound',
  'rect',
  'rightHand',
  'switch_feet',
  'text',
  'textAlign',
  'textSize',
  'textStyle',
  'timingState',
  'TfitGameLogic',
  'TfitLayoutState',
  'TfitPoseDetection',
  'TfitRender',
  'TfitShadowMode'
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

  for (const name of ['circle', 'fill', 'rect', 'text', 'textAlign', 'textSize', 'textStyle']) {
    calls[name] = [];
    globalThis[name] = record(name);
  }

  Object.assign(globalThis, {
    BOLD: 'bold',
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
    gameResultBool: vi.fn(() => false),
    gameState: {
      curMoves: [],
      feet_position: 0,
      gameStarted: false,
      gameTimer: 0,
      gameTimerNext: 0,
      moves: [],
      shadow_focus: 0
    },
    hide_sensor: 64,
    hitSuccess: vi.fn(),
    isDetecting: true,
    LEFT: 'left',
    NORMAL: 'normal',
    nose: undefined,
    pose: {},
    poses: [],
    punchSound: vi.fn(),
    switch_feet: vi.fn(),
    timingState: {
      downDodge: 0,
      leftDodge: 0,
      leftHook: 0,
      leftJab: 9950,
      leftPoses: 9950,
      leftUppercut: 0,
      rightDodge: 0,
      rightHook: 0,
      rightJab: 0,
      rightPoses: 0,
      rightUppercut: 0,
      switchGuard: 0
    },
    TfitGameLogic: {
      moveDisplay: vi.fn(() => ({ color: [1, 2, 3], text: 'JAB' }))
    },
    TfitLayoutState: {
      snapshot: vi.fn(() => layout())
    },
    TfitPoseDetection: {
      areBothHandsRecent: vi.fn(() => true),
      detectDodgeGestures: vi.fn(() => ({ down: false, left: false, right: false })),
      detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
      hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
      isInsideGuard: vi.fn(() => false),
      moveMatchesRecentGesture: vi.fn(() => true),
      posePartsFromPoses: vi.fn(poses => poses[0])
    },
    TfitRender: {
      renderFeetIndicator: vi.fn(),
      renderMoveShape: vi.fn(),
      renderShadowResult: vi.fn()
    }
  }, overrides);

  vi.useFakeTimers();
  vi.setSystemTime(10_000);

  delete require.cache[modulePath];
  return require('../../js/shadow-mode');
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

describe('TfitShadowMode exports', () => {
  it('exposes shadow mode helpers', () => {
    const api = installGlobals();

    expect(Object.keys(api).sort()).toEqual([
      'addShadowMoveAtTimer',
      'renderShadowMode'
    ]);
    expect(globalThis.TfitShadowMode).toBe(api);
  });

  it('supports the browser global path without CommonJS globals', () => {
    const source = readFileSync(modulePath, 'utf8');
    const sandbox = {
      globalThis: null,
      TfitGameLogic: { moveDisplay: () => ({ color: [], text: '' }) },
      TfitLayoutState: { snapshot: () => layout() },
      TfitPoseDetection: {
        areBothHandsRecent: () => false,
        detectDodgeGestures: () => ({}),
        detectHandGestures: () => ({}),
        hasPoseConfidence: () => false,
        isInsideGuard: () => false,
        moveMatchesRecentGesture: () => false,
        posePartsFromPoses: () => ({})
      },
      TfitRender: {
        renderFeetIndicator: () => {},
        renderMoveShape: () => {},
        renderShadowResult: () => {}
      }
    };
    sandbox.globalThis = sandbox;

    new Script(source, { filename: modulePath }).runInNewContext(sandbox);

    expect(typeof sandbox.TfitShadowMode.renderShadowMode).toBe('function');
  });
});

describe('shadow mode layout usage', () => {
  it('adds moves using snapshot frame rate and height', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameTimer: 20,
        gameTimerNext: 0,
        moves: [0, 1]
      }
    });

    api.addShadowMoveAtTimer();

    expect(globalThis.gameState.curMoves).toEqual([
      { hit: false, type: 1, x: 200, y: 480 }
    ]);
    expect(globalThis.gameState.gameTimerNext).toBe(1);
  });

  it('advances the shadow move timer without adding unavailable moves', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameTimer: 60,
        gameTimerNext: 0,
        moves: [0]
      }
    });

    api.addShadowMoveAtTimer();

    expect(globalThis.gameState.curMoves).toEqual([]);
    expect(globalThis.gameState.gameTimerNext).toBe(1);

    globalThis.gameState.gameTimer = 20;
    globalThis.gameState.gameTimerNext = 1;
    api.addShadowMoveAtTimer();
    expect(globalThis.gameState.gameTimerNext).toBe(1);
  });

  it('renders falling moves with snapshot object size and timing window', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: false, type: 1, x: 200, y: 170 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: []
      }
    });

    api.renderShadowMode();

    expect(globalThis.TfitRender.renderFeetIndicator).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitPoseDetection.moveMatchesRecentGesture).toHaveBeenCalledWith(expect.objectContaining({
      levelWindow: 500,
      moveType: 1,
      now: 10_000
    }));
    expect(globalThis.hitSuccess).toHaveBeenCalledWith(0);
    expect(globalThis.TfitRender.renderMoveShape).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'JAB', type: 1, y: 158 }),
      96,
      440
    );
    expect(calls.text).toEqual([
      ['JAB', 200, 158]
    ]);
    expect(globalThis.gameState.gameTimer).toBe(2);
  });

  it('renders shadow result instead of moves for recent results', () => {
    const api = installGlobals({
      gameResultBool: vi.fn(() => true),
      gameState: {
        curMoves: [{ hit: true, type: 1 }],
        gameStarted: true
      }
    });

    api.renderShadowMode();

    expect(globalThis.TfitRender.renderShadowResult).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderMoveShape).not.toHaveBeenCalled();
  });

  it('adds zero-hit and switch-guard scheduled moves', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameTimer: 40,
        gameTimerNext: 0,
        moves: [0, 0, 10]
      }
    });

    api.addShadowMoveAtTimer();

    expect(globalThis.gameState.curMoves).toEqual([
      { hit: false, type: 10, x: 200, y: 480 }
    ]);

    globalThis.gameState.gameTimer = 1;
    globalThis.gameState.gameTimerNext = 0;
    globalThis.gameState.curMoves = [];
    globalThis.gameState.moves = [0, 0];
    api.addShadowMoveAtTimer();
    expect(globalThis.gameState.curMoves).toEqual([
      { hit: true, type: 0, x: 440, y: 480 }
    ]);
  });

  it('triggers switch guard and right-side hit matching for falling moves', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [
          { hit: false, type: 10, x: 200, y: 170 },
          { hit: false, type: 2, x: 440, y: 170 }
        ],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: []
      },
      timingState: {
        downDodge: 9950,
        leftDodge: 0,
        leftHook: 0,
        leftJab: 0,
        leftPoses: 0,
        leftUppercut: 0,
        rightDodge: 0,
        rightHook: 0,
        rightJab: 9950,
        rightPoses: 9950,
        rightUppercut: 0,
        switchGuard: -1000
      }
    });

    api.renderShadowMode();

    expect(globalThis.switch_feet).toHaveBeenCalledTimes(1);
    expect(globalThis.timingState.switchGuard).toBe(10_000);
    expect(globalThis.hitSuccess).toHaveBeenCalledWith(1);
    expect(calls.circle).toContainEqual([440, 158, 96]);
    expect(calls.text).toContainEqual(['JAB', 440, 158]);
  });

  it('respects switch-guard cooldown and draws paired down-dodge text', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [
          { hit: false, type: 10, x: 200, y: 170 },
          { hit: false, type: 9, x: 200, y: 170 }
        ],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: []
      },
      timingState: {
        downDodge: 0,
        leftDodge: 0,
        leftHook: 0,
        leftJab: 0,
        leftPoses: 0,
        leftUppercut: 0,
        rightDodge: 0,
        rightHook: 0,
        rightJab: 0,
        rightPoses: 0,
        rightUppercut: 0,
        switchGuard: 500
      },
      TfitPoseDetection: {
        areBothHandsRecent: vi.fn(() => true),
        detectDodgeGestures: vi.fn(() => ({ down: false, left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(poses => poses[0])
      }
    });

    api.renderShadowMode();

    expect(globalThis.switch_feet).not.toHaveBeenCalled();
    expect(globalThis.hitSuccess).not.toHaveBeenCalled();
    expect(calls.text).toContainEqual(['JAB', 440, 158]);
  });

  it('draws completed moves as successful and skips display updates when no display exists', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: true, type: 3, x: 200, y: 500 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: []
      },
      TfitGameLogic: {
        moveDisplay: vi.fn(() => null)
      }
    });

    api.renderShadowMode();

    expect(calls.fill).toContainEqual([0, 255, 0, 127]);
    expect(globalThis.TfitRender.renderMoveShape).toHaveBeenCalledWith(
      expect.objectContaining({ type: 3 }),
      96,
      440
    );
  });

  it('renders zero moves without shape or move text', () => {
    const api = installGlobals({
      gameState: {
        curMoves: [{ hit: true, type: 0, x: 200, y: 500 }],
        feet_position: 0,
        gameStarted: true,
        gameTimer: 1,
        gameTimerNext: 99,
        moves: []
      }
    });

    api.renderShadowMode();

    expect(globalThis.TfitRender.renderMoveShape).not.toHaveBeenCalled();
    expect(calls.text).toEqual([]);
    expect(calls.fill).toContainEqual([0, 255, 0, 127]);
  });

  it('updates shadow pose input gesture timing and punch sounds', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 40, y: 40 },
      nose: { confidence: 0.9, x: 10, y: 170 },
      rightHand: { confidence: 0.9, x: 300, y: 40 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameCalibration: true,
        gameStarted: true,
        gameTimer: 0,
        gameTimerNext: 0,
        moves: []
      },
      poses: [trackedPose],
      timingState: {
        downDodge: 0,
        leftDodge: 0,
        leftHook: 9950,
        leftJab: 0,
        leftPoses: 9950,
        leftUppercut: 9950,
        rightDodge: 0,
        rightHook: 9950,
        rightJab: 0,
        rightPoses: 9950,
        rightUppercut: 9950,
        switchGuard: 0
      },
      TfitPoseDetection: {
        areBothHandsRecent: vi.fn(() => true),
        detectDodgeGestures: vi.fn(() => ({ down: true, left: true, right: true })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: true, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => true),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderShadowMode();

    expect(globalThis.timingState).toMatchObject({
      downDodge: 10_000,
      leftDodge: 10_000,
      leftHook: 10_000,
      leftJab: 10_000,
      leftPoses: 10_000,
      leftUppercut: 9950,
      rightDodge: 10_000,
      rightHook: 10_000,
      rightJab: 10_000,
      rightPoses: 10_000,
      rightUppercut: 9950
    });
    expect(globalThis.punchSound).toHaveBeenCalledTimes(6);
    expect(calls.rect).toContainEqual([0, 0, 120, 480]);
    expect(calls.rect).toContainEqual([0, 0, 640, 100]);
    expect(calls.rect).toContainEqual([520, 0, 520, 480]);
  });

  it('updates uppercut timing and draws uppercut zones for both hands', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 100, y: 200 },
      nose: { confidence: 0.9, x: 10, y: 170 },
      rightHand: { confidence: 0.9, x: 300, y: 200 }
    };
    const api = installGlobals({
      poses: [trackedPose],
      TfitPoseDetection: {
        areBothHandsRecent: vi.fn(() => true),
        detectDodgeGestures: vi.fn(() => ({ down: false, left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: true })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderShadowMode();

    expect(globalThis.timingState.leftUppercut).toBe(10_000);
    expect(globalThis.timingState.rightUppercut).toBe(10_000);
    expect(calls.rect).toContainEqual([0, 300, 640, 180]);
  });

  it('skips pose marker drawing when detection is hidden and avoids punch sound while idle', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 200, y: 40 },
      nose: { confidence: 0.9, x: 10, y: 170 },
      rightHand: { confidence: 0.9, x: 250, y: 40 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameCalibration: false,
        gameStarted: false,
        gameTimer: 0,
        gameTimerNext: 0,
        moves: []
      },
      isDetecting: false,
      poses: [trackedPose],
      timingState: {
        downDodge: 0,
        leftDodge: 0,
        leftHook: 9950,
        leftJab: 0,
        leftPoses: 9950,
        leftUppercut: 9950,
        rightDodge: 0,
        rightHook: 9950,
        rightJab: 0,
        rightPoses: 9950,
        rightUppercut: 9950,
        switchGuard: 0
      },
      TfitPoseDetection: {
        areBothHandsRecent: vi.fn(() => false),
        detectDodgeGestures: vi.fn(() => ({ down: false, left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: true, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => true),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderShadowMode();

    expect(globalThis.punchSound).not.toHaveBeenCalled();
    expect(calls.circle).not.toContainEqual([20, 340, 12]);
    expect(calls.circle).not.toContainEqual([500, 80, 48]);
    expect(globalThis.timingState.leftJab).toBe(10_000);
    expect(globalThis.timingState.rightJab).toBe(10_000);
  });

  it('keeps right guard quiet when recent punch windows have expired', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 200, y: 200 },
      nose: { confidence: 0.9, x: 10, y: 170 },
      rightHand: { confidence: 0.9, x: 250, y: 200 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameCalibration: true,
        gameStarted: false,
        gameTimer: 0,
        gameTimerNext: 0,
        moves: []
      },
      poses: [trackedPose],
      timingState: {
        downDodge: 0,
        leftDodge: 0,
        leftHook: 0,
        leftJab: 0,
        leftPoses: 0,
        leftUppercut: 0,
        rightDodge: 0,
        rightHook: 9000,
        rightJab: 0,
        rightPoses: 0,
        rightUppercut: 9000,
        switchGuard: 0
      },
      TfitPoseDetection: {
        areBothHandsRecent: vi.fn(() => false),
        detectDodgeGestures: vi.fn(() => ({ down: false, left: false, right: false })),
        detectHandGestures: vi.fn(() => ({ hook: false, jab: false, uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn((hand, x) => x === 440),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderShadowMode();

    expect(globalThis.timingState.rightPoses).toBe(10_000);
    expect(globalThis.punchSound).not.toHaveBeenCalled();
    expect(calls.circle).toContainEqual([500, 400, 48]);
  });

  it('plays punch sound for a right jab only while fighting', () => {
    const trackedPose = {
      leftHand: { confidence: 0.9, x: 200, y: 200 },
      nose: { confidence: 0.9, x: 10, y: 170 },
      rightHand: { confidence: 0.9, x: 250, y: 40 }
    };
    const api = installGlobals({
      gameState: {
        curMoves: [],
        gameCalibration: false,
        gameStarted: true,
        gameTimer: 0,
        gameTimerNext: 0,
        moves: []
      },
      poses: [trackedPose],
      TfitPoseDetection: {
        areBothHandsRecent: vi.fn(() => false),
        detectDodgeGestures: vi.fn(() => ({ down: false, left: false, right: false })),
        detectHandGestures: vi.fn(({ side }) => ({ hook: false, jab: side === 'right', uppercut: false })),
        hasPoseConfidence: vi.fn(point => Boolean(point && point.confidence > 0.1)),
        isInsideGuard: vi.fn(() => false),
        moveMatchesRecentGesture: vi.fn(() => false),
        posePartsFromPoses: vi.fn(() => trackedPose)
      }
    });

    api.renderShadowMode();

    expect(globalThis.timingState.rightJab).toBe(10_000);
    expect(globalThis.punchSound).toHaveBeenCalledTimes(1);
  });

  it('renders pose input only when there are poses and keeps recent empty results in normal flow', () => {
    const api = installGlobals({
      gameResultBool: vi.fn(() => true),
      gameState: {
        curMoves: [],
        gameStarted: false
      },
      poses: []
    });

    api.renderShadowMode();

    expect(globalThis.TfitRender.renderFeetIndicator).toHaveBeenCalledTimes(1);
    expect(globalThis.TfitRender.renderShadowResult).not.toHaveBeenCalled();
    expect(globalThis.TfitPoseDetection.posePartsFromPoses).not.toHaveBeenCalled();
  });
});
