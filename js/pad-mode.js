(function(root) {
  const {
    hasPoseConfidence,
    isInsideGuard,
    isPadPunchHit,
    nextDownDodgeState,
    posePartsFromPoses
  } = root.TfitPoseDetection;

  const {
    snapshot: layoutSnapshot
  } = root.TfitLayoutState;

  const advanceGameTimer = root.TfitRound?.advanceGameTimer || function(state) {
    state.gameTimer = (Number(state.gameTimer) || 0) + 1;
    return 1;
  };

  const POSE_INPUT_WIDTH = 640;
  const POSE_INPUT_HEIGHT = 480;

  function poseX(point, layout) {
    return point.x * (layout.width / POSE_INPUT_WIDTH);
  }

  function poseY(point, layout) {
    return point.y * (layout.height / POSE_INPUT_HEIGHT);
  }

  function nextPadTarget(useAndCollision = false) {
    const layout = layoutSnapshot();
    const x = randomInteger(2 * layout.objectPoseSize, layout.width - 2 * layout.objectPoseSize);
    const y = randomInteger(2 * layout.objectPoseSize, layout.height - 2 * layout.objectPoseSize);
    let type = 1;
    const overlapsGuard = useAndCollision
      ? (x < calibrationState.right_init_pose_x + 2 * layout.objectPoseSize && x > calibrationState.right_init_pose_x - 2 * layout.objectPoseSize) && (y < calibrationState.right_init_pose_y + 2 * layout.objectPoseSize && y > calibrationState.right_init_pose_y - 2 * layout.objectPoseSize) && (x < calibrationState.left_init_pose_x + 2 * layout.objectPoseSize && x > calibrationState.left_init_pose_x - 2 * layout.objectPoseSize) && (y < calibrationState.left_init_pose_y + 2 * layout.objectPoseSize && y > calibrationState.left_init_pose_y - 2 * layout.objectPoseSize)
      : (x < calibrationState.right_init_pose_x + 2 * layout.objectPoseSize && x > calibrationState.right_init_pose_x - 2 * layout.objectPoseSize) || (y < calibrationState.right_init_pose_y + 2 * layout.objectPoseSize && y > calibrationState.right_init_pose_y - 2 * layout.objectPoseSize) || (x < calibrationState.left_init_pose_x + 2 * layout.objectPoseSize && x > calibrationState.left_init_pose_x - 2 * layout.objectPoseSize) || (y < calibrationState.left_init_pose_y + 2 * layout.objectPoseSize && y > calibrationState.left_init_pose_y - 2 * layout.objectPoseSize);
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

  function renderPadCharacter(layout) {
    const drawUpperWireBoxer = root.TfitRender && root.TfitRender.__drawUpperWireBoxerForTest;
    if (typeof drawUpperWireBoxer !== "function") {
      return;
    }
    if (typeof root.push !== "function" || typeof root.scale !== "function" || typeof frameCount !== "number") {
      return;
    }

    const isPunchTarget = padState.type === 1;
    const isDodgeTarget = padState.type === 2;
    const boxerScale = 0.9;
    const shouldAnimatePunch = isPunchTarget && gameState.gameStarted;
    const target = shouldAnimatePunch
      ? {
          x: (padState.x - layout.width * 0.5) / boxerScale,
          y: (padState.y - layout.height * 0.5) / boxerScale,
          side: padState.x < layout.width / 2 ? "left" : "right",
          blinkSide: padState.x < layout.width / 2 ? "right" : "left",
          reach: 1
        }
      : null;

    const anim = frameCount * 0.045;
    drawUpperWireBoxer(
      layout.width * 0.5,
      layout.height * 0.5,
      boxerScale,
      anim,
      shouldAnimatePunch,
      isDodgeTarget,
      target,
      shouldAnimatePunch,
      target ? target.blinkSide : null
    );
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
    const layout = layoutSnapshot();
    renderPadCharacter(layout);

    if (poses.length > 0) {
      ({ pose, leftHand, rightHand, nose } = posePartsFromPoses(poses));
      if (hasPoseConfidence(nose) && isDetecting) {
        fill(0, 255, 0, 128);
        circle(poseX(nose, layout), poseY(nose, layout), layout.objectPoseSize / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (hasPoseConfidence(leftHand)) {
        if (isInsideGuard(leftHand, calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize, layout.coef)) {
          timingState.leftPoses = Date.now();
          fill(255, 255, 255, 128);
          circle(calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize);
        }
        fill(255, 0, 0, 128);
        circle(poseX(leftHand, layout), poseY(leftHand, layout), layout.objectPoseSize / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize, layout.coef)) {
          timingState.rightPoses = Date.now();
          fill(255, 255, 255, 128);
          circle(calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize);
        }
        fill(255, 0, 0, 128);
        circle(poseX(rightHand, layout), poseY(rightHand, layout), layout.objectPoseSize / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (gameState.gameStarted) {
        const now = Date.now();
        const levelWindow = layout.levelWindowBase * 10;
        textSize(20 * layout.coef);
        textAlign(CENTER,CENTER);
        textStyle(BOLD);
        if (gameState.gameTimer === 0) {
          applyPadTarget(nextPadTarget());
          gameState.curMoves = [];
          pushPadMove();
        }
        fill(100, 100, 0, 255);
        if (padState.type === 1) {
          circle(padState.x, padState.y, layout.objectPoseSize);
        }
        fill(0, 0, 100, 255);
        if (padState.type === 2) {
          const dodgeRectWidth = Math.min(layout.width * 0.45, 300);
          const dodgeRectHeight = layout.objectPoseSize;
          const dodgeRectOffset = dodgeRectHeight;
          const dodgeRectY = calibrationState.init_uppercut_y - dodgeRectHeight / 2 + dodgeRectOffset;
          rect(
            layout.width / 2 - dodgeRectWidth / 2,
            dodgeRectY,
            dodgeRectWidth,
            dodgeRectHeight,
            20
          );
        }
        fill(255, 255, 255, 192);
        if (padState.type === 1) {
          if (padState.x < layout.width / 2) {
            text("L", padState.x, padState.y);
            if (isPadPunchHit({
              coef: layout.coef,
              guardTime: timingState.leftPoses,
              hand: leftHand,
              levelWindow,
              now,
              objectPoseSize: layout.objectPoseSize,
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
              coef: layout.coef,
              guardTime: timingState.rightPoses,
              hand: rightHand,
              levelWindow,
              now,
              objectPoseSize: layout.objectPoseSize,
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
          const dodgeRectHeight = layout.objectPoseSize;
          const dodgeRectOffset = dodgeRectHeight;
          const dodgeRectY = calibrationState.init_uppercut_y - dodgeRectHeight / 2 + dodgeRectOffset;
          text("D", layout.width / 2, dodgeRectY + dodgeRectHeight / 2);
          const downDodgeState = nextDownDodgeState({
            coef: layout.coef,
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
        textSize(10 * layout.coef);
        textAlign(LEFT,CENTER);
        textStyle(NORMAL);
        advanceGameTimer(gameState, now);
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
