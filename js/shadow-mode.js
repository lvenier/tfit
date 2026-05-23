(function(root) {
  const {
    hasPoseConfidence,
    isInsideGuard,
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
    let alpha = 128;
    if ([10].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
      alpha = 255;
      if (Date.now() - switch_guard > 10000 && curMoves[c].type === 10) {
        switch_guard = Date.now();
        switch_feet();
      }
    }
    if ([1, 3, 5, 7].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
      alpha = 255;
      if (Date.now() - left_jab < LEVEL * 10 && left_jab - left_poses < LEVEL * 10 && curMoves[c].type === 1) {
        hitSuccess(c);
      }
      if (Date.now() - left_hook < LEVEL * 10 && left_hook - left_poses < LEVEL * 10 && curMoves[c].type === 3) {
        hitSuccess(c);
      }
      if (Date.now() - left_uppercut < LEVEL * 10 && left_uppercut - left_poses < LEVEL * 10 && curMoves[c].type === 5) {
        hitSuccess(c);
      }
      if (Date.now() - left_dodge < LEVEL * 10 && left_dodge - left_poses < LEVEL * 10 && curMoves[c].type === 7) {
        hitSuccess(c);
      }
    }
    if ([2, 4, 6, 8, 9].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > right_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < right_init_pose_y) {
      alpha = 255;
      if (Date.now() - right_jab < LEVEL * 10 && right_jab - right_poses < LEVEL * 10 && curMoves[c].type === 2) {
        hitSuccess(c);
      }
      if (Date.now() - right_hook < LEVEL * 10 && right_hook - right_poses < LEVEL * 10 && curMoves[c].type === 4) {
        hitSuccess(c);
      }
      if (Date.now() - right_uppercut < LEVEL * 10 && right_uppercut - right_poses < LEVEL * 10 && curMoves[c].type === 6) {
        hitSuccess(c);
      }
      if (Date.now() - right_dodge < LEVEL * 10 && right_dodge - right_poses < LEVEL * 10 && curMoves[c].type === 8) {
        hitSuccess(c);
      }
      if (Date.now() - down_dodge < LEVEL * 10 && curMoves[c].type === 9) {
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
          if (gameStarted ) {
            if (Date.now() - left_hook < LEVEL * 10) {
              punchSound();
            }
            if (Date.now() - left_uppercut < LEVEL * 10) {
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (leftHand.x * coef < left_init_hook_x) {
          left_hook = Date.now();
          rect(0, 0, left_init_hook_x, myWindowHeight);
        }
        if (leftHand.y * coef > init_uppercut_y) {
          left_uppercut = Date.now();
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (leftHand.y * coef < init_jab_y) {
          fill(255, 255, 255, hide_sensor);
          rect(0, 0, myWindowWidth, init_jab_y);
          if (Date.now() - left_poses < LEVEL * 10 && Date.now() - right_poses < LEVEL * 10) {
            left_jab = Date.now();
            if (gameStarted) {punchSound();}
          }
        }
        if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          if (nose.x * coef < left_init_pose_x - OBJECT_POSE_SIZE / 2) {
            left_dodge = Date.now();
          }
          if (nose.x * coef > right_init_pose_x + OBJECT_POSE_SIZE / 2) {
            right_dodge = Date.now();
          }
          if (nose.y * coef > init_uppercut_y) {
            down_dodge = Date.now();
          }
        }
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          right_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted || gameCalibration) {
            if (Date.now() - right_hook < LEVEL * 10) {
              punchSound();
            }
            if (Date.now() - right_uppercut < LEVEL * 10) {
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        if (isDetecting) {circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);}
        fill(255, 255, 255, hide_sensor);
        if (rightHand.x * coef > right_init_hook_x) {
          right_hook = Date.now();
          rect(right_init_hook_x, 0, right_init_hook_x, myWindowHeight);
        }
        if (rightHand.y * coef > init_uppercut_y) {
          right_uppercut = Date.now();
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (rightHand.y * coef < init_jab_y) {
          rect(0, 0, myWindowWidth, init_jab_y);
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_jab = Date.now();
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
