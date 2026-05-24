var calibrationState = {
  init_jab_dragging: false,
  init_jab_y: storageNumber("init_jab_y", myWindowHeight / 4),
  init_uppercut_dragging: false,
  init_uppercut_y: storageNumber("init_uppercut_y", myWindowHeight * 3 / 4),
  left_init_hook_dragging: false,
  left_init_hook_x: storageNumber("left_init_hook_x", 120),
  left_init_pose_dragging: false,
  left_init_pose_x: storageNumber("left_init_pose_x", myWindowWidth / 3),
  left_init_pose_y: storageNumber("left_init_pose_y", myWindowHeight / 3),
  right_init_hook_dragging: false,
  right_init_hook_x: storageNumber("right_init_hook_x", myWindowWidth - 120),
  right_init_pose_dragging: false,
  right_init_pose_x: storageNumber("right_init_pose_x", 2 * myWindowWidth / 3),
  right_init_pose_y: storageNumber("right_init_pose_y", myWindowHeight / 3)
};

globalThis.TfitCalibrationState = calibrationState;
