(function(root) {
  const { height, width } = root.TfitLayoutState.snapshot();
  const layoutSnapshot = () => root.TfitLayoutState.snapshot();
  const normalizeToRatio = (value, dimension) => {
    if (!Number.isFinite(value) || value === 0) {
      return 0;
    }
    if (value <= 1) {
      return value;
    }
    return value / dimension;
  };
  const pixelFromRatio = (ratio, dimension) => ratio * dimension;

  const calibrationState = {
    init_jab_dragging: false,
    init_jab_y: storageNumber("init_jab_y", height / 4),
    init_uppercut_dragging: false,
    init_uppercut_y: storageNumber("init_uppercut_y", height * 3 / 4),
    left_init_hook_dragging: false,
    left_init_pose_dragging: false,
    right_init_hook_dragging: false,
    right_init_pose_dragging: false,
    _coords: {
      left_init_hook_x: normalizeToRatio(storageNumber("left_init_hook_x", 120), width),
      left_init_pose_x: normalizeToRatio(storageNumber("left_init_pose_x", width / 3), width),
      left_init_pose_y: normalizeToRatio(storageNumber("left_init_pose_y", height / 3), height),
      right_init_hook_x: normalizeToRatio(storageNumber("right_init_hook_x", width - 120), width),
      right_init_pose_x: normalizeToRatio(storageNumber("right_init_pose_x", 2 * width / 3), width),
      right_init_pose_y: normalizeToRatio(storageNumber("right_init_pose_y", height / 3), height)
    }
  };

  Object.defineProperties(calibrationState, {
    left_init_hook_x: {
      get() {
        const layout = layoutSnapshot();
        return pixelFromRatio(this._coords.left_init_hook_x, layout.width);
      },
      set(value) {
        const layout = layoutSnapshot();
        this._coords.left_init_hook_x = normalizeToRatio(value, layout.width);
      },
      enumerable: true
    },
    left_init_pose_x: {
      get() {
        const layout = layoutSnapshot();
        return pixelFromRatio(this._coords.left_init_pose_x, layout.width);
      },
      set(value) {
        const layout = layoutSnapshot();
        this._coords.left_init_pose_x = normalizeToRatio(value, layout.width);
      },
      enumerable: true
    },
    left_init_pose_y: {
      get() {
        const layout = layoutSnapshot();
        return pixelFromRatio(this._coords.left_init_pose_y, layout.height);
      },
      set(value) {
        const layout = layoutSnapshot();
        this._coords.left_init_pose_y = normalizeToRatio(value, layout.height);
      },
      enumerable: true
    },
    right_init_hook_x: {
      get() {
        const layout = layoutSnapshot();
        return pixelFromRatio(this._coords.right_init_hook_x, layout.width);
      },
      set(value) {
        const layout = layoutSnapshot();
        this._coords.right_init_hook_x = normalizeToRatio(value, layout.width);
      },
      enumerable: true
    },
    right_init_pose_x: {
      get() {
        const layout = layoutSnapshot();
        return pixelFromRatio(this._coords.right_init_pose_x, layout.width);
      },
      set(value) {
        const layout = layoutSnapshot();
        this._coords.right_init_pose_x = normalizeToRatio(value, layout.width);
      },
      enumerable: true
    },
    right_init_pose_y: {
      get() {
        const layout = layoutSnapshot();
        return pixelFromRatio(this._coords.right_init_pose_y, layout.height);
      },
      set(value) {
        const layout = layoutSnapshot();
        this._coords.right_init_pose_y = normalizeToRatio(value, layout.height);
      },
      enumerable: true
    }
  });

  root.calibrationState = calibrationState;
  root.TfitCalibrationState = calibrationState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = calibrationState;
  }
})(globalThis);
