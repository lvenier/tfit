(function(root) {
  const {
    hasPoseConfidence,
    isInsideGuard,
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
          left_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          right_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (gameStarted) {
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
            if (hasPoseConfidence(leftHand) && leftHand.x * coef < pad_x + OBJECT_POSE_SIZE && leftHand.x * coef > pad_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < pad_y && leftHand.y * coef + OBJECT_POSE_SIZE > pad_y && Date.now() - left_poses < LEVEL * 10) {
              applyPadTarget(nextPadTarget());
              left_poses = Date.now() - LEVEL * 10;
              hitSuccess(curMoves.length - 1);
              pushPadMove();
            }
          } else {
            text("R", pad_x, pad_y);
            if (hasPoseConfidence(rightHand) && rightHand.x * coef < pad_x + OBJECT_POSE_SIZE && rightHand.x * coef > pad_x - OBJECT_POSE_SIZE && rightHand.y * coef - OBJECT_POSE_SIZE < pad_y && rightHand.y * coef + OBJECT_POSE_SIZE > pad_y && Date.now() - right_poses < LEVEL * 10) {
              applyPadTarget(nextPadTarget());
              right_poses = Date.now() - LEVEL * 10;
              hitSuccess(curMoves.length - 1);
              pushPadMove();
            }
          }
        } else if (pad_type === 2) {
          text("D", myWindowWidth / 2, init_uppercut_y);
          if (hasPoseConfidence(nose) && nose.y * coef > init_uppercut_y) {
            down_dodge = Date.now();
            down_dodge_done = true;
            down_dodge_switch = false;
          }
          if (hasPoseConfidence(nose) && nose.y * coef < init_uppercut_y) {
            if (down_dodge_done === true) {
              down_dodge_done = false;
              down_dodge_switch = true;
            }
          }
          if (Date.now() - down_dodge < LEVEL * 10 && down_dodge_switch === true) {
            down_dodge = Date.now() - LEVEL * 10;
            down_dodge_switch = false;
            down_dodge_done = false;
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
})(typeof globalThis !== 'undefined' ? globalThis : window);
