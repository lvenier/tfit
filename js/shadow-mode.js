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
    const moveIndex = Math.ceil(gameState.gameTimer / FRAME_RATE);
    if (gameState.gameTimerNext < moveIndex) {
      if (gameState.moves.length >= moveIndex && gameState.moves[moveIndex] >= 0) {
        let xt = Math.trunc(gameState.moves[moveIndex]) % 2 ? calibrationState.left_init_pose_x : calibrationState.right_init_pose_x;
        if (gameState.moves[moveIndex] === 10) {xt = calibrationState.left_init_pose_x;}
        gameState.curMoves.push({
          "hit": gameState.moves[moveIndex] === 0,
          "type": Math.trunc(gameState.moves[moveIndex]),
          "x": xt,
          "y": myWindowHeight
        })
      }
      gameState.gameTimerNext++;
    }
  }

  function renderShadowMove(c) {
    gameState.curMoves[c].y = gameState.curMoves[c].y - Math.ceil(240 / FRAME_RATE);
    const now = Date.now();
    const levelWindow = LEVEL * 10;
    let alpha = 128;
    if ([10].includes(gameState.curMoves[c].type) && gameState.curMoves[c].y + OBJECT_POSE_SIZE > calibrationState.left_init_pose_y && gameState.curMoves[c].y - OBJECT_POSE_SIZE < calibrationState.left_init_pose_y) {
      alpha = 255;
      if (now - timingState.switchGuard > 10000 && gameState.curMoves[c].type === 10) {
        timingState.switchGuard = now;
        switch_feet();
      }
    }
    if ([1, 3, 5, 7].includes(gameState.curMoves[c].type) && gameState.curMoves[c].y + OBJECT_POSE_SIZE > calibrationState.left_init_pose_y && gameState.curMoves[c].y - OBJECT_POSE_SIZE < calibrationState.left_init_pose_y) {
      alpha = 255;
      if (moveMatchesRecentGesture({
        leftDodge: timingState.leftDodge,
        leftHook: timingState.leftHook,
        leftJab: timingState.leftJab,
        leftPoses: timingState.leftPoses,
        leftUppercut: timingState.leftUppercut,
        levelWindow,
        moveType: gameState.curMoves[c].type,
        now
      })) {
        hitSuccess(c);
      }
    }
    if ([2, 4, 6, 8, 9].includes(gameState.curMoves[c].type) && gameState.curMoves[c].y + OBJECT_POSE_SIZE > calibrationState.right_init_pose_y && gameState.curMoves[c].y - OBJECT_POSE_SIZE < calibrationState.right_init_pose_y) {
      alpha = 255;
      if (moveMatchesRecentGesture({
        downDodge: timingState.downDodge,
        levelWindow,
        moveType: gameState.curMoves[c].type,
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
    const display = moveDisplay(gameState.curMoves[c].type, gameState.feet_position, alpha);
    if (display) {
      fill(...display.color);
      gameState.curMoves[c].text = display.text;
    }
    if (gameState.curMoves[c].hit === true) {fill(0, 255, 0, 127);}
    if (gameState.curMoves[c].type > 0) {
      renderMoveShape(gameState.curMoves[c], OBJECT_POSE_SIZE, calibrationState.right_init_pose_x);
    }
    if ([10].includes(gameState.curMoves[c].type)) {circle(calibrationState.right_init_pose_x, gameState.curMoves[c].y, OBJECT_POSE_SIZE);}
    fill(255, 255, 255, 255);
    textSize(20 * coef);
    textStyle(BOLD);
    textAlign(CENTER,CENTER);
    if (gameState.curMoves[c].type > 0) {text(gameState.curMoves[c].text, gameState.curMoves[c].x, gameState.curMoves[c].y);}
    if ([9, 10].includes(gameState.curMoves[c].type)) {text(gameState.curMoves[c].text, calibrationState.right_init_pose_x, gameState.curMoves[c].y);}
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
        if (isInsideGuard(leftHand, calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.leftPoses = now;
          fill(255, 255, 255, 128);
          circle(calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, OBJECT_POSE_SIZE);
          if (gameState.gameStarted) {
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
          initJabY: calibrationState.init_jab_y,
          initUppercutY: calibrationState.init_uppercut_y,
          leftHookX: calibrationState.left_init_hook_x,
          leftPoseTime: timingState.leftPoses,
          levelWindow,
          now,
          rightHookX: calibrationState.right_init_hook_x,
          rightPoseTime: timingState.rightPoses,
          side: "left"
        });
        if (leftHand.x * coef < calibrationState.left_init_hook_x) {
          timingState.leftHook = now;
          rect(0, 0, calibrationState.left_init_hook_x, myWindowHeight);
        }
        if (leftHand.y * coef > calibrationState.init_uppercut_y) {
          timingState.leftUppercut = now;
          rect(0, calibrationState.init_uppercut_y, myWindowWidth, myWindowHeight - calibrationState.init_uppercut_y);
        }
        if (leftHand.y * coef < calibrationState.init_jab_y) {
          fill(255, 255, 255, hide_sensor);
          rect(0, 0, myWindowWidth, calibrationState.init_jab_y);
          if (leftGestures.jab) {
            timingState.leftJab = now;
            if (gameState.gameStarted) {punchSound();}
          }
        }
        const dodges = detectDodgeGestures({
          coef,
          initUppercutY: calibrationState.init_uppercut_y,
          leftGuardX: calibrationState.left_init_pose_x,
          nose,
          objectPoseSize: OBJECT_POSE_SIZE,
          ready: areBothHandsRecent(now, timingState.leftPoses, timingState.rightPoses, levelWindow),
          rightGuardX: calibrationState.right_init_pose_x
        });
        if (dodges.left) {timingState.leftDodge = now;}
        if (dodges.right) {timingState.rightDodge = now;}
        if (dodges.down) {
          timingState.downDodge = now;
        }
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          timingState.rightPoses = now;
          fill(255, 255, 255, 128);
          circle(calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, OBJECT_POSE_SIZE);
          if (gameState.gameStarted || gameState.gameCalibration) {
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
          initJabY: calibrationState.init_jab_y,
          initUppercutY: calibrationState.init_uppercut_y,
          leftHookX: calibrationState.left_init_hook_x,
          leftPoseTime: timingState.leftPoses,
          levelWindow,
          now,
          rightHookX: calibrationState.right_init_hook_x,
          rightPoseTime: timingState.rightPoses,
          side: "right"
        });
        if (rightHand.x * coef > calibrationState.right_init_hook_x) {
          timingState.rightHook = now;
          rect(calibrationState.right_init_hook_x, 0, calibrationState.right_init_hook_x, myWindowHeight);
        }
        if (rightHand.y * coef > calibrationState.init_uppercut_y) {
          timingState.rightUppercut = now;
          rect(0, calibrationState.init_uppercut_y, myWindowWidth, myWindowHeight - calibrationState.init_uppercut_y);
        }
        if (rightHand.y * coef < calibrationState.init_jab_y) {
          rect(0, 0, myWindowWidth, calibrationState.init_jab_y);
          if (rightGestures.jab) {
            timingState.rightJab = now;
            if (gameState.gameStarted) {punchSound();}
          }
        }
      }
    }
  }

  function renderShadowMode() {
    renderFeetIndicator();
    if (gameResultBool() && gameState.curMoves.length > 0) {
      renderShadowResult();
      return;
    }

    if (gameState.gameStarted) {
      addShadowMoveAtTimer();
      for (let c = 0; c < gameState.curMoves.length; c++) {
        renderShadowMove(c);
      }
      gameState.gameTimer++;
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
})(globalThis);
