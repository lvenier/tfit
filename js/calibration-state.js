(function(root) {
  const { height, width } = root.TfitLayoutState.snapshot();

  const calibrationState = {
    init_jab_dragging: false,
    init_jab_y: storageNumber("init_jab_y", height / 4),
    init_uppercut_dragging: false,
    init_uppercut_y: storageNumber("init_uppercut_y", height * 3 / 4),
    left_init_hook_dragging: false,
    left_init_hook_x: storageNumber("left_init_hook_x", 120),
    left_init_pose_dragging: false,
    left_init_pose_x: storageNumber("left_init_pose_x", width / 3),
    left_init_pose_y: storageNumber("left_init_pose_y", height / 3),
    right_init_hook_dragging: false,
    right_init_hook_x: storageNumber("right_init_hook_x", width - 120),
    right_init_pose_dragging: false,
    right_init_pose_x: storageNumber("right_init_pose_x", 2 * width / 3),
    right_init_pose_y: storageNumber("right_init_pose_y", height / 3)
  };

  root.calibrationState = calibrationState;
  root.TfitCalibrationState = calibrationState;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = calibrationState;
  }
})(globalThis);
