(function(root) {
  const {
    startPoseDetection,
    stopPoseDetection
  } = root.TfitCameraRuntime;

  const {
    updateCalibrationFromPointer
  } = root.TfitAppInputActions;

  const {
    snapshot: layoutSnapshot
  } = root.TfitLayoutState;

  const POSE_INPUT_WIDTH = 640;
  const POSE_INPUT_HEIGHT = 480;

  function poseX(point, layout) {
    return point.x * (layout.width / POSE_INPUT_WIDTH);
  }

  function poseY(point, layout) {
    return point.y * (layout.height / POSE_INPUT_HEIGHT);
  }

  const {
    renderCalibrationOverlay,
    renderGuardTargets,
    renderCalibrationResetButton,
    renderSettingsControls,
    renderStopButton
  } = root.TfitRender;

  function renderCalibrationPoseMarker() {
    if (poses.length === 0) {
      return;
    }

    pose = poses[0];
    leftHand = pose["left_wrist"];
    rightHand = pose["right_wrist"];
    nose = pose["nose"];
    if (nose && nose.confidence > 0.1 && isDetecting) {
      const layout = layoutSnapshot();
      fill(0, 255, 0, 128);
      circle(poseX(nose, layout), poseY(nose, layout), layout.objectPoseSize / 8);
      fill(255, 255, 255, hide_sensor);
    }
  }

  function renderCalibrationScreen() {
    renderGuardTargets();
    fill(255, 0, 0, hide_sensor);
    timingState.gameResult = Date.now() - 5001;
    startPoseDetection();

    renderCalibrationPoseMarker();

    renderStopButton();
    renderCalibrationResetButton();
    updateCalibrationFromPointer();
    renderCalibrationOverlay();
  }

  function renderSettingsScreen() {
    if (gameState.gameOver) {
      stopPoseDetection();
      gameState.gameCalibration = false;
      gameState.gameOver = false;
    }

    if (gameState.gameCalibration) {
      renderCalibrationScreen();
    } else {
      renderSettingsControls();
    }
  }

  const api = {
    renderCalibrationPoseMarker,
    renderCalibrationScreen,
    renderSettingsScreen
  };

  root.TfitSettingsScreen = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
