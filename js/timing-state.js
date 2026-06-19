var timingState = {
  downDodge: Date.now() - 1000,
  downDodgeDone: false,
  downDodgeSwitch: false,
  gameResult: Date.now() - 5000,
  guardWarning: Date.now(),
  hitSuccess: Date.now() - 1000,
  leftDodge: Date.now() - 1000,
  leftHook: Date.now() - 1000,
  leftGuardInGuard: false,
  leftJab: Date.now() - 1000,
  leftPoses: Date.now() - 1000,
  leftPosesReturn: Date.now() - 1000,
  leftUppercut: Date.now() - 1000,
  punchSoundTime: Date.now() - 1000,
  rightDodge: Date.now() - 1000,
  rightHook: Date.now() - 1000,
  rightGuardInGuard: false,
  rightJab: Date.now() - 1000,
  rightPoses: Date.now() - 1000,
  rightPosesReturn: Date.now() - 1000,
  rightUppercut: Date.now() - 1000,
  switchGuard: Date.now() - 10000
};

globalThis.TfitTimingState = timingState;
