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

  async function initCameraRuntime({
    captureFactory = root.createCapture,
    modelFactory = root.ml5.bodyPose,
    modelUrl = "js/ml5js/model.json",
    videoMode = root.VIDEO
  } = {}) {
    try {
      video = captureFactory(videoMode, { flipped: true });
    } catch {
      error = "Camera access is not available in this browser.";
      return false;
    }

    video.hide();

    bodyPose = await modelFactory(MODELS[poseModelIndex], {
      modelUrl,
      flipped: true
    });

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
    checkStartCondition,
    gotPoses,
    initCameraRuntime,
    startPoseDetection,
    stopPoseDetection
  };

  Object.assign(root, api);
  root.TfitCameraRuntime = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
