(function(root) {
  const CALIBRATION_DRAG_FLAGS = {
    init_jab_dragging: false,
    init_uppercut_dragging: false,
    left_init_hook_dragging: false,
    left_init_pose_dragging: false,
    right_init_hook_dragging: false,
    right_init_pose_dragging: false
  };

  function clearCalibrationDragFlags() {
    return { ...CALIBRATION_DRAG_FLAGS };
  }

  function calibrationDragFlagsFromPointer({
    left_init_hook_x,
    left_init_pose_x,
    left_init_pose_y,
    mouseX,
    mouseY,
    objectPoseSize,
    right_init_hook_x,
    right_init_pose_x,
    right_init_pose_y,
    init_jab_y,
    init_uppercut_y
  }) {
    return {
      init_jab_dragging: mouseY < init_jab_y + 8,
      init_uppercut_dragging: mouseY > init_uppercut_y - 8,
      left_init_hook_dragging: mouseX < left_init_hook_x + 8,
      left_init_pose_dragging: mouseX > left_init_pose_x - objectPoseSize / 2 &&
        mouseX < left_init_pose_x + objectPoseSize / 2 &&
        mouseY > left_init_pose_y - 24 &&
        mouseY < left_init_pose_y + 24,
      right_init_hook_dragging: mouseX > right_init_hook_x - 8,
      right_init_pose_dragging: mouseX > right_init_pose_x - objectPoseSize / 2 &&
        mouseX < right_init_pose_x + objectPoseSize / 2 &&
        mouseY > right_init_pose_y - 24 &&
        mouseY < right_init_pose_y + 24
    };
  }

  const api = {
    calibrationDragFlagsFromPointer,
    clearCalibrationDragFlags
  };

  root.TfitInput = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
