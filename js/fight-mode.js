(function(root) {
  const {
    detectDodgeGestures,
    detectHandGestures,
    hasPoseConfidence,
    isInsideGuard,
    posePartsFromPoses
  } = root.TfitPoseDetection;

  const {
    moveDisplay
  } = root.TfitGameLogic;

  const {
    renderFightMeters,
    renderMoveShape
  } = root.TfitRender;

  function updateFightPunchAnimation(type, side) {
    punch_animation_type = type;
    punch_animation = 0;
    punch_animation_delay = 0;
    if (curMoves.length > 0 && 'type' in curMoves.at(-1) && curMoves.at(-1).type === type) {
      my_opponent.stamina--;
    }
    if (side === "left") {
      timingState.leftPoses = Date.now() - LEVEL * 10;
    }
    if (side === "right") {
      timingState.rightPoses = Date.now() - LEVEL * 10;
    }
  }

  function renderFightMode() {
    shadow_focus = 0;
    renderFightMeters();
    if (poses.length > 0) {
      ({ pose, leftHand, rightHand, nose } = posePartsFromPoses(poses));
      const now = Date.now();
      const levelWindow = LEVEL * 10;
      if (hasPoseConfidence(nose)) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
        const dodges = detectDodgeGestures({
          coef,
          initUppercutY: init_uppercut_y,
          leftGuardX: left_init_pose_x,
          levelWindow,
          nose,
          objectPoseSize: OBJECT_POSE_SIZE,
          ready: true,
          rightGuardX: right_init_pose_x
        });
        if (dodges.right) {timingState.rightDodge = now;}
        if (dodges.left) {timingState.leftDodge = now;}
      }
      if (hasPoseConfidence(leftHand)) {
        if (isInsideGuard(leftHand, left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.leftPoses = now;
          timingState.leftHook = now - levelWindow;
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        const leftGestures = detectHandGestures({
          coef,
          hand: leftHand,
          initJabY: init_jab_y,
          initUppercutY: init_uppercut_y,
          leftHookX: left_init_hook_x,
          leftPoseTime: timingState.leftPoses,
          levelWindow,
          now,
          rightHookX: right_init_hook_x,
          rightPoseTime: timingState.rightPoses,
          side: "left"
        });
        if (leftGestures.uppercut) {timingState.leftUppercut = now;}
        if (leftGestures.jab) {timingState.leftJab = now;}
        if (leftGestures.hook) {timingState.leftHook = now;}
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.rightPoses = now;
          timingState.rightHook = now - levelWindow;
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        const rightGestures = detectHandGestures({
          coef,
          hand: rightHand,
          initJabY: init_jab_y,
          initUppercutY: init_uppercut_y,
          leftHookX: left_init_hook_x,
          leftPoseTime: timingState.leftPoses,
          levelWindow,
          now,
          rightHookX: right_init_hook_x,
          rightPoseTime: timingState.rightPoses,
          side: "right"
        });
        if (rightGestures.uppercut) {timingState.rightUppercut = now;}
        if (rightGestures.jab) {timingState.rightJab = now;}
        if (rightGestures.hook) {timingState.rightHook = now;}
      }
      if (now - timingState.rightDodge < levelWindow && timingState.rightDodge - timingState.rightPoses < levelWindow && gameStarted && punch_animation === -1) {
        punch_animation_type = 1;
        punch_animation = 0;
        punch_animation_delay = 0;
        timingState.leftPoses = now - levelWindow;
      }
      if (now - timingState.leftDodge < levelWindow && timingState.leftDodge - timingState.leftPoses < levelWindow && gameStarted && punch_animation === -1) {
        punch_animation_type = 2;
        punch_animation = 0;
        punch_animation_delay = 0;
      }
      if (now - timingState.leftUppercut < levelWindow && timingState.leftUppercut - timingState.leftPoses < levelWindow && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(5, "left");
      }
      if (now - timingState.leftJab < levelWindow && timingState.leftJab - timingState.leftPoses < levelWindow && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(1, "left");
      }
      if (now - timingState.leftHook < levelWindow && timingState.leftHook - timingState.leftPoses < levelWindow && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(3, "left");
      }
      if (now - timingState.rightUppercut < levelWindow && timingState.rightUppercut - timingState.rightPoses < levelWindow && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(6, "right");
      }
      if (now - timingState.rightJab < levelWindow && timingState.rightJab - timingState.rightPoses < levelWindow && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(2, "right");
      }
      if (now - timingState.rightHook < levelWindow && timingState.rightHook - timingState.rightPoses < levelWindow && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(4, "right");
      }
      if (gameStarted) {
        if (gameTimerNext < Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))) {
          if (moves.length >= Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2)) && moves[Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))] >= 0) {
            curMoves.push({
              "hit": false,
              "type": curMoves.length < 4 ? 0 : Math.trunc(moves[Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))]),
              "x": 0,
              "y": 0
            })
          }
          gameTimerNext++;
        }
        const c = curMoves.length - 1;
        if (curMoves.length > 0 && 'type' in curMoves[c] && curMoves[c].type !== 0) {
          fill(...moveDisplay(curMoves[c].type, feet_position, 255).color);
          renderMoveShape({
            type: curMoves[c].type,
            x: myWindowWidth / 2,
            y: myWindowHeight / 5
          }, OBJECT_POSE_SIZE);
          textSize(10 * coef);
          fill(255, 255, 255, 255);
          text(MOVE_TYPE[curMoves[c].type], myWindowWidth / 2 - coef * MOVE_TYPE[curMoves[c].type].length * 3, myWindowHeight / 5);
          tint(255, 224);
          if (curMoves[c].hit === false) {
            if (gameStarted && puncho_animation === -1 && curMoves[c].hit === false) {
              if (curMoves[c].type >= 7) {puncho_animation_type = randomInteger(1,2);}
              else {puncho_animation_type = curMoves[c].type;}
              puncho_animation = 0;
              puncho_animation_delay = 0;
            }
            if (puncho_animation >= 0 && curMoves[c].hit === false) {
              image(opponents_images[puncho_animation_type][puncho_animation], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
              if (puncho_animation_delay % 3 === 0) {
                if (puncho_animation >= 6) {
                  puncho_animation = -1;
                  puncho_animation_delay = 0;
                  curMoves[c].hit = true;
                } else {
                  puncho_animation++;
                }
              }
              puncho_animation_delay++;
            }
          } else {
            image(opponent_image[opponent], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
          }
          tint(255, 192);
        } else {
          tint(255, 224);
          image(opponent_image[opponent], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
          tint(255, 192);
        }
        if (punch_animation >= 0) {
          image(me_images[punch_animation_type][punch_animation], myWindowWidth / 3.5, myWindowHeight / 2, myWindowWidth / 2.2, myWindowHeight / 2);
          if (punch_animation_delay % 3 === 0) {
            if (punch_animation >= 6) {
              punch_animation = -1;
              punch_animation_delay = 0;
            } else {punch_animation++;}
          }
          punch_animation_delay++;
        } else {image(me_image, myWindowWidth / 3.5, myWindowHeight / 2, myWindowWidth / 2.2, myWindowHeight / 2);}
        tint(255, 255);
        gameTimer++;
      }
    }
  }

  const api = { renderFightMode };

  root.TfitFightMode = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
