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

  const {
    snapshot: layoutSnapshot
  } = root.TfitLayoutState;

  const POSE_INPUT_WIDTH = 640;
  const POSE_INPUT_HEIGHT = 480;

  function poseX(point, layout) {
    return point.x * (layout.width / POSE_INPUT_WIDTH);
  }

  function poseY(point, layout) {
    return point.y * (layout.height / POSE_INPUT_HEIGHT);
  }

  function updateFightPunchAnimation(type, side) {
    const layout = layoutSnapshot();

    animationState.player.type = type;
    animationState.player.frame = 0;
    animationState.player.delay = 0;
    if (gameState.curMoves.length > 0 && 'type' in gameState.curMoves.at(-1) && gameState.curMoves.at(-1).type === type) {
      gameState.my_opponent.stamina--;
    }
    if (side === "left") {
      timingState.leftPoses = Date.now() - layout.levelWindowBase * 10;
    }
    if (side === "right") {
      timingState.rightPoses = Date.now() - layout.levelWindowBase * 10;
    }
  }

  function renderFightMode() {
    const layout = layoutSnapshot();

    gameState.shadow_focus = 0;
    renderFightMeters();
    if (poses.length > 0) {
      ({ pose, leftHand, rightHand, nose } = posePartsFromPoses(poses));
      const now = Date.now();
      const levelWindow = layout.levelWindowBase * 10;
      if (hasPoseConfidence(nose)) {
        fill(0, 255, 0, 128);
        circle(poseX(nose, layout), poseY(nose, layout), layout.objectPoseSize / 8);
        fill(255, 255, 255, hide_sensor);
        const dodges = detectDodgeGestures({
          coef: layout.coef,
          initUppercutY: calibrationState.init_uppercut_y,
          leftGuardX: calibrationState.left_init_pose_x,
          levelWindow,
          nose,
          objectPoseSize: layout.objectPoseSize,
          ready: true,
          rightGuardX: calibrationState.right_init_pose_x
        });
        if (dodges.right) {timingState.rightDodge = now;}
        if (dodges.left) {timingState.leftDodge = now;}
      }
      if (hasPoseConfidence(leftHand)) {
        if (isInsideGuard(leftHand, calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize, layout.coef)) {
          timingState.leftPoses = now;
          timingState.leftHook = now - levelWindow;
          fill(255, 255, 255, 128);
          circle(calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize);
        }
        fill(255, 0, 0, 128);
        circle(poseX(leftHand, layout), poseY(leftHand, layout), layout.objectPoseSize / 2);
        fill(255, 255, 255, hide_sensor);
        const leftGestures = detectHandGestures({
          coef: layout.coef,
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
        if (leftGestures.uppercut) {timingState.leftUppercut = now;}
        if (leftGestures.jab) {timingState.leftJab = now;}
        if (leftGestures.hook) {timingState.leftHook = now;}
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize, layout.coef)) {
          timingState.rightPoses = now;
          timingState.rightHook = now - levelWindow;
          fill(255, 255, 255, 128);
          circle(calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize);
        }
        fill(255, 0, 0, 128);
        circle(poseX(rightHand, layout), poseY(rightHand, layout), layout.objectPoseSize / 2);
        fill(255, 255, 255, hide_sensor);
        const rightGestures = detectHandGestures({
          coef: layout.coef,
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
        if (rightGestures.uppercut) {timingState.rightUppercut = now;}
        if (rightGestures.jab) {timingState.rightJab = now;}
        if (rightGestures.hook) {timingState.rightHook = now;}
      }
      if (now - timingState.rightDodge < levelWindow && timingState.rightDodge - timingState.rightPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        animationState.player.type = 1;
        animationState.player.frame = 0;
        animationState.player.delay = 0;
        timingState.leftPoses = now - levelWindow;
      }
      if (now - timingState.leftDodge < levelWindow && timingState.leftDodge - timingState.leftPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        animationState.player.type = 2;
        animationState.player.frame = 0;
        animationState.player.delay = 0;
      }
      if (now - timingState.leftUppercut < levelWindow && timingState.leftUppercut - timingState.leftPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        updateFightPunchAnimation(5, "left");
      }
      if (now - timingState.leftJab < levelWindow && timingState.leftJab - timingState.leftPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        updateFightPunchAnimation(1, "left");
      }
      if (now - timingState.leftHook < levelWindow && timingState.leftHook - timingState.leftPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        updateFightPunchAnimation(3, "left");
      }
      if (now - timingState.rightUppercut < levelWindow && timingState.rightUppercut - timingState.rightPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        updateFightPunchAnimation(6, "right");
      }
      if (now - timingState.rightJab < levelWindow && timingState.rightJab - timingState.rightPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        updateFightPunchAnimation(2, "right");
      }
      if (now - timingState.rightHook < levelWindow && timingState.rightHook - timingState.rightPoses < levelWindow && gameState.gameStarted && animationState.player.frame === -1) {
        updateFightPunchAnimation(4, "right");
      }
      if (gameState.gameStarted) {
        const moveIndex = Math.ceil(gameState.gameTimer / (layout.frameRate + layout.levelWindowBase / 2));
        if (gameState.gameTimerNext < moveIndex) {
          if (gameState.moves.length >= moveIndex && gameState.moves[moveIndex] >= 0) {
            gameState.curMoves.push({
              "hit": false,
              "type": gameState.curMoves.length < 4 ? 0 : Math.trunc(gameState.moves[moveIndex]),
              "x": 0,
              "y": 0
            })
          }
          gameState.gameTimerNext++;
        }
        const c = gameState.curMoves.length - 1;
        if (gameState.curMoves.length > 0 && 'type' in gameState.curMoves[c] && gameState.curMoves[c].type !== 0) {
          fill(...moveDisplay(gameState.curMoves[c].type, gameState.feet_position, 255).color);
          renderMoveShape({
            type: gameState.curMoves[c].type,
            x: layout.width / 2,
            y: layout.height / 5
          }, layout.objectPoseSize);
          textSize(10 * layout.coef);
          fill(255, 255, 255, 255);
          text(MOVE_TYPE[gameState.curMoves[c].type], layout.width / 2 - layout.coef * MOVE_TYPE[gameState.curMoves[c].type].length * 3, layout.height / 5);
          tint(255, 224);
          if (gameState.curMoves[c].hit === false) {
            if (gameState.gameStarted && animationState.opponent.frame === -1 && gameState.curMoves[c].hit === false) {
              if (gameState.curMoves[c].type >= 7) {animationState.opponent.type = randomInteger(1,2);}
              else {animationState.opponent.type = gameState.curMoves[c].type;}
              animationState.opponent.frame = 0;
              animationState.opponent.delay = 0;
            }
            if (animationState.opponent.frame >= 0 && gameState.curMoves[c].hit === false) {
              image(images.opponentAnimations[animationState.opponent.type][animationState.opponent.frame], layout.width / 3, layout.height / 4, layout.width / 3, layout.height / 2);
              if (animationState.opponent.delay % 3 === 0) {
                if (animationState.opponent.frame >= 6) {
                  animationState.opponent.frame = -1;
                  animationState.opponent.delay = 0;
                  gameState.curMoves[c].hit = true;
                } else {
                  animationState.opponent.frame++;
                }
              }
              animationState.opponent.delay++;
            }
          } else {
            image(images.opponents[gameState.opponent], layout.width / 3, layout.height / 4, layout.width / 3, layout.height / 2);
          }
          tint(255, 192);
        } else {
          tint(255, 224);
          image(images.opponents[gameState.opponent], layout.width / 3, layout.height / 4, layout.width / 3, layout.height / 2);
          tint(255, 192);
        }
        if (animationState.player.frame >= 0) {
          image(images.meAnimations[animationState.player.type][animationState.player.frame], layout.width / 3.5, layout.height / 2, layout.width / 2.2, layout.height / 2);
          if (animationState.player.delay % 3 === 0) {
            if (animationState.player.frame >= 6) {
              animationState.player.frame = -1;
              animationState.player.delay = 0;
            } else {animationState.player.frame++;}
          }
          animationState.player.delay++;
        } else {image(images.me, layout.width / 3.5, layout.height / 2, layout.width / 2.2, layout.height / 2);}
        tint(255, 255);
        gameState.gameTimer++;
      }
    }
  }

  const api = { renderFightMode };

  root.TfitFightMode = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
