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
      const layout = layoutSnapshot();
      fill(0, 255, 0, 128);
      circle(nose.x * layout.coef, nose.y * layout.coef, layout.objectPoseSize / 8);
      fill(255, 255, 255, hide_sensor);
    }
  }

  function renderCalibrationScreen() {
    const layout = layoutSnapshot();

    renderGuardTargets();
    fill(255, 0, 0, hide_sensor);
    timingState.gameResult = Date.now() - 5001;
    startPoseDetection();

    renderCalibrationPoseMarker();

    image(images.stopButton, layout.width - 100 * layout.coef - 10, Math.trunc(layout.height - 60 * layout.coef), 100 * layout.coef, 50 * layout.coef);
    image(images.resetButton, layout.width / 2 - 50 * layout.coef, layout.height - 100 * layout.coef, 120 * layout.coef, 60 * layout.coef);
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
