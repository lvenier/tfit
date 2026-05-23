(function(root) {
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

  function isInsideGuard(point, guardX, guardY, objectPoseSize, coef = 1) {
    return hasPoseConfidence(point) &&
      point.x * coef < guardX + objectPoseSize &&
      point.x * coef > guardX - objectPoseSize &&
      point.y * coef < guardY + objectPoseSize &&
      point.y * coef > guardY - objectPoseSize;
  }

  const api = {
    hasPoseConfidence,
    isInsideGuard,
    posePartsFromPoses
  };

  root.TfitPoseDetection = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
