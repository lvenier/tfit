(function(root) {
  const {
    hasPoseConfidence,
    isInsideGuard,
    isPadPunchHit,
    nextDownDodgeState,
    posePartsFromPoses
  } = root.TfitPoseDetection;

  function nextPadTarget(useAndCollision = false) {
    const x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
    const y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
    let type = 1;
    const overlapsGuard = useAndCollision
      ? (x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) && (y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) && (x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) && (y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && y > left_init_pose_y - 2 * OBJECT_POSE_SIZE)
      : (x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && y > left_init_pose_y - 2 * OBJECT_POSE_SIZE);
    if (overlapsGuard) {
      type = 2;
    }
    return { type, x, y };
  }

  function applyPadTarget(target) {
    pad_x = target.x;
    pad_y = target.y;
    pad_type = target.type;
  }

  function pushPadMove() {
    curMoves.push({
      "hit": false,
      "type": pad_type,
      "x": pad_x,
      "y": pad_y
    })
  }

  function renderPadMode() {
    if (poses.length > 0) {
      ({ pose, leftHand, rightHand, nose } = posePartsFromPoses(poses));
      if (hasPoseConfidence(nose) && isDetecting) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (hasPoseConfidence(leftHand)) {
        if (isInsideGuard(leftHand, left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.leftPoses = Date.now();
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.rightPoses = Date.now();
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (gameStarted) {
        const now = Date.now();
        const levelWindow = LEVEL * 10;
        textSize(20 * coef);
        textAlign(CENTER,CENTER);
        textStyle(BOLD);
        if (gameTimer === 0) {
          applyPadTarget(nextPadTarget());
          curMoves = [];
          pushPadMove();
        }
        fill(100, 100, 0, 255);
        if (pad_type === 1) {circle(pad_x, pad_y, OBJECT_POSE_SIZE);}
        fill(0, 0, 100, 255);
        if (pad_type === 2) {rect(OBJECT_POSE_SIZE, init_uppercut_y - OBJECT_POSE_SIZE / 2, myWindowWidth - 2 * OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, 20);}
        fill(255, 255, 255, 192);
        if (pad_type === 1) {
          if (pad_x < myWindowWidth / 2) {
            text("L", pad_x, pad_y);
            if (isPadPunchHit({
              coef,
              guardTime: timingState.leftPoses,
              hand: leftHand,
              levelWindow,
              now,
              objectPoseSize: OBJECT_POSE_SIZE,
              padX: pad_x,
              padY: pad_y
            })) {
              applyPadTarget(nextPadTarget());
              timingState.leftPoses = now - levelWindow;
              hitSuccess(curMoves.length - 1);
              pushPadMove();
            }
          } else {
            text("R", pad_x, pad_y);
            if (isPadPunchHit({
              coef,
              guardTime: timingState.rightPoses,
              hand: rightHand,
              levelWindow,
              now,
              objectPoseSize: OBJECT_POSE_SIZE,
              padX: pad_x,
              padY: pad_y
            })) {
              applyPadTarget(nextPadTarget());
              timingState.rightPoses = now - levelWindow;
              hitSuccess(curMoves.length - 1);
              pushPadMove();
            }
          }
        } else if (pad_type === 2) {
          text("D", myWindowWidth / 2, init_uppercut_y);
          const downDodgeState = nextDownDodgeState({
            coef,
            done: timingState.downDodgeDone,
            initUppercutY: init_uppercut_y,
            nose,
            switched: timingState.downDodgeSwitch
          });
          timingState.downDodgeDone = downDodgeState.done;
          timingState.downDodgeSwitch = downDodgeState.switched;
          if (downDodgeState.touchedDown) {
            timingState.downDodge = now;
          }
          if (now - timingState.downDodge < levelWindow && timingState.downDodgeSwitch === true) {
            timingState.downDodge = now - levelWindow;
            timingState.downDodgeSwitch = false;
            timingState.downDodgeDone = false;
            applyPadTarget(nextPadTarget(true));
            hitSuccess(curMoves.length - 1);
            pushPadMove();
          }
        }
        textSize(10 * coef);
        textAlign(LEFT,CENTER);
        textStyle(NORMAL);
        gameTimer++;
      }
    }
  }

  const api = {
    nextPadTarget,
    renderPadMode
  };

  root.TfitPadMode = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
