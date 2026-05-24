var poseModelIndex = 0;
var leftHand;
var rightHand;
var nose;
var video;
var bodyPose;
var isDetecting = false;
var cnv;
var pose = {};
var poses = [];

globalThis.TfitPoseState = {
  get bodyPose() { return bodyPose; },
  get canvas() { return cnv; },
  get isDetecting() { return isDetecting; },
  get leftHand() { return leftHand; },
  get modelIndex() { return poseModelIndex; },
  get nose() { return nose; },
  get pose() { return pose; },
  get poses() { return poses; },
  get rightHand() { return rightHand; },
  get video() { return video; }
};
