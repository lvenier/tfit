(function(root) {
  const {
    areBothHandsRecent,
    detectDodgeGestures,
    detectHandGestures,
    hasPoseConfidence,
    isInsideGuard,
    moveMatchesRecentGesture,
    posePartsFromPoses
  } = root.TfitPoseDetection;

  const {
    moveDisplay
  } = root.TfitGameLogic;

  const {
    renderFeetIndicator,
    renderMoveShape,
    renderShadowResult
  } = root.TfitRender;

  function addShadowMoveAtTimer() {
    const moveIndex = Math.ceil(gameTimer / FRAME_RATE);
    if (gameTimerNext < moveIndex) {
      if (moves.length >= moveIndex && moves[moveIndex] >= 0) {
        let xt = Math.trunc(moves[moveIndex]) % 2 ? left_init_pose_x : right_init_pose_x;
        if (moves[moveIndex] === 10) {xt = left_init_pose_x;}
        curMoves.push({
          "hit": moves[moveIndex] === 0,
          "type": Math.trunc(moves[moveIndex]),
          "x": xt,
          "y": myWindowHeight
        })
      }
      gameTimerNext++;
    }
  }

  function renderShadowMove(c) {
    curMoves[c].y = curMoves[c].y - Math.ceil(240 / FRAME_RATE);
    const now = Date.now();
    const levelWindow = LEVEL * 10;
    let alpha = 128;
    if ([10].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
      alpha = 255;
      if (now - timingState.switchGuard > 10000 && curMoves[c].type === 10) {
        timingState.switchGuard = now;
        switch_feet();
      }
    }
    if ([1, 3, 5, 7].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
      alpha = 255;
      if (moveMatchesRecentGesture({
        leftDodge: timingState.leftDodge,
        leftHook: timingState.leftHook,
        leftJab: timingState.leftJab,
        leftPoses: timingState.leftPoses,
        leftUppercut: timingState.leftUppercut,
        levelWindow,
        moveType: curMoves[c].type,
        now
      })) {
        hitSuccess(c);
      }
    }
    if ([2, 4, 6, 8, 9].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > right_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < right_init_pose_y) {
      alpha = 255;
      if (moveMatchesRecentGesture({
        downDodge: timingState.downDodge,
        levelWindow,
        moveType: curMoves[c].type,
        now,
        rightDodge: timingState.rightDodge,
        rightHook: timingState.rightHook,
        rightJab: timingState.rightJab,
        rightPoses: timingState.rightPoses,
        rightUppercut: timingState.rightUppercut
      })) {
        hitSuccess(c);
      }
    }
    const display = moveDisplay(curMoves[c].type, feet_position, alpha);
    if (display) {
      fill(...display.color);
      curMoves[c].text = display.text;
    }
    if (curMoves[c].hit === true) {fill(0, 255, 0, 127);}
    if (curMoves[c].type > 0) {
      renderMoveShape(curMoves[c], OBJECT_POSE_SIZE, right_init_pose_x);
    }
    if ([10].includes(curMoves[c].type)) {circle(right_init_pose_x, curMoves[c].y, OBJECT_POSE_SIZE);}
    fill(255, 255, 255, 255);
    textSize(20 * coef);
    textStyle(BOLD);
    textAlign(CENTER,CENTER);
    if (curMoves[c].type > 0) {text(curMoves[c].text, curMoves[c].x, curMoves[c].y);}
    if ([9, 10].includes(curMoves[c].type)) {text(curMoves[c].text, right_init_pose_x, curMoves[c].y);}
    textAlign(LEFT,CENTER);
    textStyle(NORMAL);
  }

  function renderShadowPoseInput() {
    if (poses.length > 0) {
      ({ pose, leftHand, rightHand, nose } = posePartsFromPoses(poses));
      const now = Date.now();
      const levelWindow = LEVEL * 10;
      if (hasPoseConfidence(nose) && isDetecting) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (hasPoseConfidence(leftHand)) {
        if (isInsideGuard(leftHand, left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.leftPoses = now;
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted ) {
            if (now - timingState.leftHook < levelWindow) {
              punchSound();
            }
            if (now - timingState.leftUppercut < levelWindow) {
              punchSound();
            }
          }
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
        if (leftHand.x * coef < left_init_hook_x) {
          timingState.leftHook = now;
          rect(0, 0, left_init_hook_x, myWindowHeight);
        }
        if (leftHand.y * coef > init_uppercut_y) {
          timingState.leftUppercut = now;
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (leftHand.y * coef < init_jab_y) {
          fill(255, 255, 255, hide_sensor);
          rect(0, 0, myWindowWidth, init_jab_y);
          if (leftGestures.jab) {
            timingState.leftJab = now;
            if (gameStarted) {punchSound();}
          }
        }
        const dodges = detectDodgeGestures({
          coef,
          initUppercutY: init_uppercut_y,
          leftGuardX: left_init_pose_x,
          nose,
          objectPoseSize: OBJECT_POSE_SIZE,
          ready: areBothHandsRecent(now, timingState.leftPoses, timingState.rightPoses, levelWindow),
          rightGuardX: right_init_pose_x
        });
        if (dodges.left) {timingState.leftDodge = now;}
        if (dodges.right) {timingState.rightDodge = now;}
        if (dodges.down) {
          timingState.downDodge = now;
        }
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.rightPoses = now;
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted || gameCalibration) {
            if (now - timingState.rightHook < levelWindow) {
              punchSound();
            }
            if (now - timingState.rightUppercut < levelWindow) {
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        if (isDetecting) {circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);}
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
        if (rightHand.x * coef > right_init_hook_x) {
          timingState.rightHook = now;
          rect(right_init_hook_x, 0, right_init_hook_x, myWindowHeight);
        }
        if (rightHand.y * coef > init_uppercut_y) {
          timingState.rightUppercut = now;
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (rightHand.y * coef < init_jab_y) {
          rect(0, 0, myWindowWidth, init_jab_y);
          if (rightGestures.jab) {
            timingState.rightJab = now;
            if (gameStarted) {punchSound();}
          }
        }
      }
    }
  }

  function renderShadowMode() {
    renderFeetIndicator();
    if (gameResultBool() && curMoves.length > 0) {
      renderShadowResult();
      return;
    }

    if (gameStarted) {
      addShadowMoveAtTimer();
      for (let c = 0; c < curMoves.length; c++) {
        renderShadowMove(c);
      }
      gameTimer++;
    }

    renderShadowPoseInput();
  }

  const api = {
    addShadowMoveAtTimer,
    renderShadowMode
  };

  root.TfitShadowMode = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
