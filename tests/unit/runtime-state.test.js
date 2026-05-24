import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';

const require = createRequire(import.meta.url);

function runStateScripts(overrides = {}) {
  const storageNumber = vi.fn((_key, fallback) => fallback);
  const randomInteger = vi.fn(() => 2);
  const context = createContext({
    Date: class FixedDate extends Date {
      static now() {
        return 10_000;
      }
    },
    Math,
    TfitUtils: {
      randomInteger,
      storageNumber
    },
    window: {
      innerHeight: 768,
      innerWidth: 1024
    },
    ...overrides
  });

  for (const file of [
    '../../js/runtime-utils',
    '../../js/layout-state',
    '../../js/ui-state',
    '../../js/pose-state',
    '../../js/calibration-state',
    '../../js/timing-state'
  ]) {
    const modulePath = require.resolve(file);
    const source = readFileSync(modulePath, 'utf8');
    new Script(source, { filename: modulePath }).runInContext(context);
  }

  return { context, randomInteger, storageNumber };
}

describe('runtime state script split', () => {
  it('initializes the legacy runtime globals', () => {
    const { context, randomInteger, storageNumber } = runStateScripts();

    expect(context.TfitRuntimeUtils).toEqual({ randomInteger, storageNumber });
    expect(context.coef).toBe(1.6);
    expect(context.myWindowWidth).toBe(1024);
    expect(context.myWindowHeight).toBe(768);
    expect(context.OBJECT_POSE_SIZE).toBeCloseTo(76.8);
    expect(context.FRAME_RATE).toBe(20);
    expect(context.LEVEL).toBe(50);

    expect(context.error).toBe('');
    expect(context.errorTimer).toBe(0);
    expect(context.loading_k).toBe(0);
    expect(context.loading_m).toBe(0);
    expect(context.hide_sensor).toBe(0);
    expect(context.speechString).toBeNull();

    expect(context.poseModelIndex).toBe(0);
    expect(context.isDetecting).toBe(false);
    expect(context.pose).toEqual({});
    expect(context.poses).toEqual([]);

    expect(context.calibrationState).toMatchObject({
      init_jab_dragging: false,
      init_jab_y: 768 / 4,
      left_init_pose_x: 1024 / 3,
      right_init_pose_y: 768 / 3
    });

    expect(context.timingState).toMatchObject({
      downDodgeDone: false,
      downDodgeSwitch: false,
      gameResult: 5000,
      leftDodge: 9000,
      switchGuard: 0
    });
  });

  it('exposes grouped state handles for newer modules', () => {
    const { context } = runStateScripts();

    expect(context.TfitLayoutState.width).toBe(1024);
    expect(context.TfitLayoutState.height).toBe(768);
    expect(context.TfitLayoutState.coef).toBe(1.6);
    expect(context.TfitLayoutState.frameRate).toBe(20);
    expect(context.TfitLayoutState.levelWindowBase).toBe(50);
    expect(context.TfitLayoutState.objectPoseSize).toBeCloseTo(76.8);

    const resized = context.TfitLayoutState.resizeLayoutState(390, 844);
    expect(resized.coef).toBeCloseTo(0.6);
    expect(resized.width).toBeCloseTo(384);
    expect(resized.height).toBeCloseTo(288);
    expect(resized.objectPoseSize).toBeCloseTo(28.8);
    expect(context.TfitLayoutState.width).toBeCloseTo(384);
    expect(context.TfitLayoutState.height).toBeCloseTo(288);
    expect(context.TfitLayoutState.objectPoseSize).toBeCloseTo(28.8);

    const canvas = { position: vi.fn() };
    expect(context.TfitLayoutState.positionCanvas(canvas, 500)).toBe(true);
    expect(canvas.position.mock.calls[0][0]).toBeCloseTo(58);
    expect(canvas.position.mock.calls[0][1]).toBe(0);
    expect(context.TfitLayoutState.positionCanvas(null, 500)).toBe(false);

    const resizeCanvasFn = vi.fn();
    const resizedCanvas = { position: vi.fn() };
    const canvasLayout = context.TfitLayoutState.resizeCanvasLayout({
      canvas: resizedCanvas,
      height: 768,
      resizeCanvasFn,
      width: 1024
    });
    expect(canvasLayout.coef).toBeCloseTo(1.6);
    expect(resizeCanvasFn).toHaveBeenCalledWith(1024, 768);
    expect(resizedCanvas.position).toHaveBeenCalledWith(0, 0);

    expect(context.TfitUiState.error).toBe('');
    expect(context.TfitUiState.errorTimer).toBe(0);
    expect(context.TfitUiState.hideSensor).toBe(0);
    expect(context.TfitUiState.loadingK).toBe(0);
    expect(context.TfitUiState.loadingM).toBe(0);
    expect(context.TfitUiState.speechString).toBeNull();
    expect(context.TfitPoseState.bodyPose).toBeUndefined();
    expect(context.TfitPoseState.canvas).toBeUndefined();
    expect(context.TfitPoseState.isDetecting).toBe(false);
    expect(context.TfitPoseState.leftHand).toBeUndefined();
    expect(context.TfitPoseState.modelIndex).toBe(0);
    expect(context.TfitPoseState.nose).toBeUndefined();
    expect(context.TfitPoseState.pose).toEqual({});
    expect(context.TfitPoseState.poses).toEqual([]);
    expect(context.TfitPoseState.rightHand).toBeUndefined();
    expect(context.TfitPoseState.video).toBeUndefined();
    expect(context.TfitCalibrationState).toBe(context.calibrationState);
    expect(context.TfitTimingState).toBe(context.timingState);
  });

  it('uses storage-backed values for calibration and frame rate', () => {
    const storageNumber = vi.fn((key, fallback) => {
      const values = {
        frame_rate: 60,
        init_jab_y: 111,
        right_init_pose_x: 555
      };
      return values[key] ?? fallback;
    });

    const { context } = runStateScripts({
      TfitUtils: {
        randomInteger: vi.fn(() => 2),
        storageNumber
      }
    });

    expect(context.FRAME_RATE).toBe(60);
    expect(context.calibrationState.init_jab_y).toBe(111);
    expect(context.calibrationState.right_init_pose_x).toBe(555);
    expect(storageNumber).toHaveBeenCalledWith('frame_rate', 20, { allowed: [20, 40, 60, 80, 100, 120] });
  });
});
