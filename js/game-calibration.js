(function(root) {
  const CALIBRATION_ASSIGNMENTS = {
    init_jab_dragging: [
      ["init_jab_y", "mouseY"]
    ],
    init_uppercut_dragging: [
      ["init_uppercut_y", "mouseY"]
    ],
    left_init_hook_dragging: [
      ["left_init_hook_x", "mouseX"]
    ],
    left_init_pose_dragging: [
      ["left_init_pose_x", "mouseX"],
      ["left_init_pose_y", "mouseY"]
    ],
    right_init_hook_dragging: [
      ["right_init_hook_x", "mouseX"]
    ],
    right_init_pose_dragging: [
      ["right_init_pose_x", "mouseX"],
      ["right_init_pose_y", "mouseY"]
    ]
  };

  function calibrationDragUpdates({ flags, mouseX, mouseY }) {
    const pointer = { mouseX, mouseY };

    return Object.entries(CALIBRATION_ASSIGNMENTS).reduce((updates, [flag, assignments]) => {
      if (!flags[flag]) {
        return updates;
      }

      for (const [key, pointerKey] of assignments) {
        updates[key] = pointer[pointerKey];
      }
      return updates;
    }, {});
  }

  function persistCalibrationUpdates(updates, storage) {
    for (const [key, value] of Object.entries(updates)) {
      storage.setItem(key, value);
    }
  }

  const api = {
    calibrationDragUpdates,
    persistCalibrationUpdates
  };

  root.TfitCalibration = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
