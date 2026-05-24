(function(root) {
  const {
    startPoseDetection,
    stopPoseDetection
  } = root.TfitCameraRuntime;

  const {
    updateCalibrationFromPointer
  } = root.TfitAppInputActions;

  const {
    renderCalibrationOverlay,
    renderGuardTargets,
    renderSettingsControls
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
      fill(0, 255, 0, 128);
      circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
      fill(255, 255, 255, hide_sensor);
    }
  }

  function renderCalibrationScreen() {
    renderGuardTargets();
    fill(255, 0, 0, hide_sensor);
    timingState.gameResult = Date.now() - 5001;
    startPoseDetection();

    renderCalibrationPoseMarker();

    image(images.stopButton, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
    image(images.resetButton, myWindowWidth / 2 - 50 * coef, myWindowHeight - 100 * coef, 120 * coef, 60 * coef);
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
