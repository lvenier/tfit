(function(root) {
  function layoutSnapshot() {
    return root.TfitLayoutState && root.TfitLayoutState.snapshot
      ? root.TfitLayoutState.snapshot()
      : { width: 640, height: 480 };
  }
  const POSE_INPUT_WIDTH = 640;
  const POSE_INPUT_HEIGHT = 480;

  function posePartsFromPoses(poses) {
    const pose = poses.length > 0 ? poses[0] : undefined;

    return {
      leftHand: pose ? pose["left_wrist"] : undefined,
      nose: pose ? pose["nose"] : undefined,
      pose,
      rightHand: pose ? pose["right_wrist"] : undefined
    };
  }

  function hasPoseConfidence(part, threshold = 0.1) {
    return Boolean(part && part.confidence > threshold);
  }

  function poseScaleX() {
    const layout = layoutSnapshot();
    return layout.width / POSE_INPUT_WIDTH;
  }

  function poseScaleY() {
    const layout = layoutSnapshot();
    return layout.height / POSE_INPUT_HEIGHT;
  }

  function poseX(point, scale = poseScaleX()) {
    return point?.x * scale;
  }

  function poseY(point, scale = poseScaleY()) {
    return point?.y * scale;
  }

  function isInsideGuard(point, guardX, guardY, objectPoseSize, coef = 1) {
    return hasPoseConfidence(point) &&
      poseX(point) < guardX + objectPoseSize &&
      poseX(point) > guardX - objectPoseSize &&
      poseY(point) < guardY + objectPoseSize &&
      poseY(point) > guardY - objectPoseSize;
  }

  function isInsideTarget(point, targetX, targetY, objectPoseSize, coef = 1) {
    return hasPoseConfidence(point) &&
      poseX(point) < targetX + objectPoseSize &&
      poseX(point) > targetX - objectPoseSize &&
      poseY(point) - objectPoseSize < targetY &&
      poseY(point) + objectPoseSize > targetY;
  }

  function areBothHandsRecent(now, leftPoseTime, rightPoseTime, levelWindow) {
    return now - rightPoseTime < levelWindow && now - leftPoseTime < levelWindow;
  }

  function isTimedGestureActive(now, gestureTime, guardTime, levelWindow) {
    return now - gestureTime < levelWindow && gestureTime - guardTime < levelWindow;
  }

  function detectHandGestures({
    coef = 1,
    hand,
    initJabY,
    initUppercutY,
    leftHookX,
    leftPoseTime,
    levelWindow,
    now,
    rightHookX,
    rightPoseTime,
    side
  }) {
    const ready = hasPoseConfidence(hand) && areBothHandsRecent(now, leftPoseTime, rightPoseTime, levelWindow);
    return {
      hook: ready && (side === "left" ? poseX(hand) < leftHookX : poseX(hand) > rightHookX),
      jab: ready && poseY(hand) < initJabY,
      uppercut: ready && poseY(hand) > initUppercutY
    };
  }

  function detectDodgeGestures({
    coef = 1,
    initUppercutY,
    leftGuardX,
    nose,
    objectPoseSize,
    ready,
    rightGuardX
  }) {
    return {
      down: hasPoseConfidence(nose) && ready && poseY(nose) > initUppercutY,
      left: hasPoseConfidence(nose) && ready && poseX(nose) < leftGuardX - objectPoseSize / 2,
      right: hasPoseConfidence(nose) && ready && poseX(nose) > rightGuardX + objectPoseSize / 2
    };
  }

  function moveMatchesRecentGesture({
    leftDodge,
    leftHook,
    leftJab,
    leftPoses,
    leftUppercut,
    levelWindow,
    moveType,
    now,
    rightDodge,
    rightHook,
    rightJab,
    rightPoses,
    rightUppercut,
    downDodge
  }) {
    if (moveType === 1) {return isTimedGestureActive(now, leftJab, leftPoses, levelWindow);}
    if (moveType === 2) {return isTimedGestureActive(now, rightJab, rightPoses, levelWindow);}
    if (moveType === 3) {return isTimedGestureActive(now, leftHook, leftPoses, levelWindow);}
    if (moveType === 4) {return isTimedGestureActive(now, rightHook, rightPoses, levelWindow);}
    if (moveType === 5) {return isTimedGestureActive(now, leftUppercut, leftPoses, levelWindow);}
    if (moveType === 6) {return isTimedGestureActive(now, rightUppercut, rightPoses, levelWindow);}
    if (moveType === 7) {return isTimedGestureActive(now, leftDodge, leftPoses, levelWindow);}
    if (moveType === 8) {return isTimedGestureActive(now, rightDodge, rightPoses, levelWindow);}
    if (moveType === 9) {return now - downDodge < levelWindow;}
    return false;
  }

  function isPadPunchHit({
    coef = 1,
    hand,
    guardTime,
    levelWindow,
    now,
    objectPoseSize,
    padX,
    padY
  }) {
    return isInsideTarget(hand, padX, padY, objectPoseSize, coef) &&
      now - guardTime < levelWindow;
  }

  function nextDownDodgeState({
    coef = 1,
    done,
    initUppercutY,
    nose,
    switched
  }) {
    if (hasPoseConfidence(nose) && poseY(nose) > initUppercutY) {
      return {
        done: true,
        switched: false,
        touchedDown: true
      };
    }
    if (hasPoseConfidence(nose) && poseY(nose) < initUppercutY && done === true) {
      return {
        done: false,
        switched: true,
        touchedDown: false
      };
    }
    return {
      done,
      switched,
      touchedDown: false
    };
  }

  const api = {
    areBothHandsRecent,
    detectDodgeGestures,
    detectHandGestures,
    hasPoseConfidence,
    isInsideGuard,
    isInsideTarget,
    isPadPunchHit,
    isTimedGestureActive,
    moveMatchesRecentGesture,
    nextDownDodgeState,
    posePartsFromPoses
  };

  root.TfitPoseDetection = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
