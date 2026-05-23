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
      if (now - switch_guard > 10000 && curMoves[c].type === 10) {
        switch_guard = now;
        switch_feet();
      }
    }
    if ([1, 3, 5, 7].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
      alpha = 255;
      if (moveMatchesRecentGesture({
        leftDodge: left_dodge,
        leftHook: left_hook,
        leftJab: left_jab,
        leftPoses: left_poses,
        leftUppercut: left_uppercut,
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
        downDodge: down_dodge,
        levelWindow,
        moveType: curMoves[c].type,
        now,
        rightDodge: right_dodge,
        rightHook: right_hook,
        rightJab: right_jab,
        rightPoses: right_poses,
        rightUppercut: right_uppercut
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
          left_poses = now;
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted ) {
            if (now - left_hook < levelWindow) {
              punchSound();
            }
            if (now - left_uppercut < levelWindow) {
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
          leftPoseTime: left_poses,
          levelWindow,
          now,
          rightHookX: right_init_hook_x,
          rightPoseTime: right_poses,
          side: "left"
        });
        if (leftHand.x * coef < left_init_hook_x) {
          left_hook = now;
          rect(0, 0, left_init_hook_x, myWindowHeight);
        }
        if (leftHand.y * coef > init_uppercut_y) {
          left_uppercut = now;
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (leftHand.y * coef < init_jab_y) {
          fill(255, 255, 255, hide_sensor);
          rect(0, 0, myWindowWidth, init_jab_y);
          if (leftGestures.jab) {
            left_jab = now;
            if (gameStarted) {punchSound();}
          }
        }
        const dodges = detectDodgeGestures({
          coef,
          initUppercutY: init_uppercut_y,
          leftGuardX: left_init_pose_x,
          nose,
          objectPoseSize: OBJECT_POSE_SIZE,
          ready: areBothHandsRecent(now, left_poses, right_poses, levelWindow),
          rightGuardX: right_init_pose_x
        });
        if (dodges.left) {left_dodge = now;}
        if (dodges.right) {right_dodge = now;}
        if (dodges.down) {
          down_dodge = now;
        }
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          right_poses = now;
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted || gameCalibration) {
            if (now - right_hook < levelWindow) {
              punchSound();
            }
            if (now - right_uppercut < levelWindow) {
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
          leftPoseTime: left_poses,
          levelWindow,
          now,
          rightHookX: right_init_hook_x,
          rightPoseTime: right_poses,
          side: "right"
        });
        if (rightHand.x * coef > right_init_hook_x) {
          right_hook = now;
          rect(right_init_hook_x, 0, right_init_hook_x, myWindowHeight);
        }
        if (rightHand.y * coef > init_uppercut_y) {
          right_uppercut = now;
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (rightHand.y * coef < init_jab_y) {
          rect(0, 0, myWindowWidth, init_jab_y);
          if (rightGestures.jab) {
            right_jab = now;
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
