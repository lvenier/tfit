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
      ? (x < calibrationState.right_init_pose_x + 2 * OBJECT_POSE_SIZE && x > calibrationState.right_init_pose_x - 2 * OBJECT_POSE_SIZE) && (y < calibrationState.right_init_pose_y + 2 * OBJECT_POSE_SIZE && y > calibrationState.right_init_pose_y - 2 * OBJECT_POSE_SIZE) && (x < calibrationState.left_init_pose_x + 2 * OBJECT_POSE_SIZE && x > calibrationState.left_init_pose_x - 2 * OBJECT_POSE_SIZE) && (y < calibrationState.left_init_pose_y + 2 * OBJECT_POSE_SIZE && y > calibrationState.left_init_pose_y - 2 * OBJECT_POSE_SIZE)
      : (x < calibrationState.right_init_pose_x + 2 * OBJECT_POSE_SIZE && x > calibrationState.right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (y < calibrationState.right_init_pose_y + 2 * OBJECT_POSE_SIZE && y > calibrationState.right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (x < calibrationState.left_init_pose_x + 2 * OBJECT_POSE_SIZE && x > calibrationState.left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (y < calibrationState.left_init_pose_y + 2 * OBJECT_POSE_SIZE && y > calibrationState.left_init_pose_y - 2 * OBJECT_POSE_SIZE);
    if (overlapsGuard) {
      type = 2;
    }
    return { type, x, y };
  }

  function applyPadTarget(target) {
    padState.x = target.x;
    padState.y = target.y;
    padState.type = target.type;
  }

  function pushPadMove() {
    gameState.curMoves.push({
      "hit": false,
      "type": padState.type,
      "x": padState.x,
      "y": padState.y
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
        if (isInsideGuard(leftHand, calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.leftPoses = Date.now();
          fill(255, 255, 255, 128);
          circle(calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.rightPoses = Date.now();
          fill(255, 255, 255, 128);
          circle(calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (gameState.gameStarted) {
        const now = Date.now();
        const levelWindow = LEVEL * 10;
        textSize(20 * coef);
        textAlign(CENTER,CENTER);
        textStyle(BOLD);
        if (gameState.gameTimer === 0) {
          applyPadTarget(nextPadTarget());
          gameState.curMoves = [];
          pushPadMove();
        }
        fill(100, 100, 0, 255);
        if (padState.type === 1) {circle(padState.x, padState.y, OBJECT_POSE_SIZE);}
        fill(0, 0, 100, 255);
        if (padState.type === 2) {rect(OBJECT_POSE_SIZE, calibrationState.init_uppercut_y - OBJECT_POSE_SIZE / 2, myWindowWidth - 2 * OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, 20);}
        fill(255, 255, 255, 192);
        if (padState.type === 1) {
          if (padState.x < myWindowWidth / 2) {
            text("L", padState.x, padState.y);
            if (isPadPunchHit({
              coef,
              guardTime: timingState.leftPoses,
              hand: leftHand,
              levelWindow,
              now,
              objectPoseSize: OBJECT_POSE_SIZE,
              padX: padState.x,
              padY: padState.y
            })) {
              applyPadTarget(nextPadTarget());
              timingState.leftPoses = now - levelWindow;
              hitSuccess(gameState.curMoves.length - 1);
              pushPadMove();
            }
          } else {
            text("R", padState.x, padState.y);
            if (isPadPunchHit({
              coef,
              guardTime: timingState.rightPoses,
              hand: rightHand,
              levelWindow,
              now,
              objectPoseSize: OBJECT_POSE_SIZE,
              padX: padState.x,
              padY: padState.y
            })) {
              applyPadTarget(nextPadTarget());
              timingState.rightPoses = now - levelWindow;
              hitSuccess(gameState.curMoves.length - 1);
              pushPadMove();
            }
          }
        } else if (padState.type === 2) {
          text("D", myWindowWidth / 2, calibrationState.init_uppercut_y);
          const downDodgeState = nextDownDodgeState({
            coef,
            done: timingState.downDodgeDone,
            initUppercutY: calibrationState.init_uppercut_y,
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
            hitSuccess(gameState.curMoves.length - 1);
            pushPadMove();
          }
        }
        textSize(10 * coef);
        textAlign(LEFT,CENTER);
        textStyle(NORMAL);
        gameState.gameTimer++;
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
