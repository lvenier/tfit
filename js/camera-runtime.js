(function(root) {
  const {
    detectStartCondition
  } = root.TfitGameLogic;

  function gotPoses(results) {
    poses = results;
  }

  function startPoseDetection() {
    if (!bodyPose || isDetecting) {
      return false;
    }
    bodyPose.detectStart(video, gotPoses);
    isDetecting = true;
    return true;
  }

  function stopPoseDetection() {
    if (!bodyPose || !isDetecting) {
      return false;
    }
    bodyPose.detectStop();
    isDetecting = false;
    return true;
  }

  function isSecureCameraOrigin(location = root.location) {
    if (!location) {
      return true;
    }
    return location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";
  }

  function cameraAccessErrorMessage(reason, location = root.location) {
    if (!isSecureCameraOrigin(location)) {
      return "Camera access requires HTTPS unless you are running on localhost.";
    }

    if (reason && reason.name === "NotAllowedError") {
      return "Camera permission was blocked. Allow camera access in your browser settings, then reload Box4Fit.";
    }

    if (reason && reason.name === "NotFoundError") {
      return "No camera was found. Connect a webcam, then reload Box4Fit.";
    }

    if (reason && reason.name === "NotReadableError") {
      return "The camera is already in use by another app. Close the other app, then reload Box4Fit.";
    }

    return "Camera access is not available in this browser.";
  }

  async function initCameraRuntime({
    captureFactory = root.createCapture,
    location = root.location,
    modelFactory = root.ml5.bodyPose,
    modelUrl = "js/ml5js/model.json",
    videoMode = root.VIDEO
  } = {}) {
    try {
      video = captureFactory(videoMode, { flipped: true });
    } catch (reason) {
      error = cameraAccessErrorMessage(reason, location);
      return false;
    }

    video.hide();

    try {
      bodyPose = await modelFactory(MODELS[poseModelIndex], {
        modelUrl,
        flipped: true
      });
    } catch {
      error = "Pose detection could not load. Check your connection or refresh Box4Fit.";
      return false;
    }

    return startPoseDetection();
  }

  function checkStartCondition() {
    const result = detectStartCondition({ errorTimer, gameReady: gameState.gameReady, poses });
    errorTimer = result.errorTimer;
    gameState.gameReady = result.gameReady;
    if (result.error) {error = result.error;}
    if (result.pose) {pose = result.pose;}
    if (result.leftHand) {leftHand = result.leftHand;}
    if (result.rightHand) {rightHand = result.rightHand;}
    if (result.nose) {nose = result.nose;}
    return gameState.gameReady;
  }

  const api = {
    cameraAccessErrorMessage,
    checkStartCondition,
    gotPoses,
    initCameraRuntime,
    isSecureCameraOrigin,
    startPoseDetection,
    stopPoseDetection
  };

  Object.assign(root, api);
  root.TfitCameraRuntime = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
