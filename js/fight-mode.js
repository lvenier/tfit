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
      left_poses = Date.now() - LEVEL * 10;
    }
    if (side === "right") {
      right_poses = Date.now() - LEVEL * 10;
    }
  }

  function renderFightMode() {
    shadow_focus = 0;
    renderFightMeters();
    if (poses.length > 0) {
      ({ pose, leftHand, rightHand, nose } = posePartsFromPoses(poses));
      if (hasPoseConfidence(nose)) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
        if (nose.x * coef > right_init_pose_x + OBJECT_POSE_SIZE / 2) {
          right_dodge = Date.now();
        }
        if (nose.x * coef < left_init_pose_x - OBJECT_POSE_SIZE / 2) {
          left_dodge = Date.now();
        }
      }
      if (hasPoseConfidence(leftHand)) {
        if (isInsideGuard(leftHand, left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          left_poses = Date.now();
          left_hook = Date.now() - LEVEL * 10;
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (leftHand.y * coef > init_uppercut_y && Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          left_uppercut = Date.now();
        }
        if (leftHand.y * coef < init_jab_y && Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          left_jab = Date.now();
        }
        if (leftHand.x * coef < left_init_hook_x && Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          left_hook = Date.now();
        }
      }
      if (hasPoseConfidence(rightHand)) {
        if (isInsideGuard(rightHand, right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE, coef)) {
          right_poses = Date.now();
          right_hook = Date.now() - LEVEL * 10;
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (rightHand.y * coef > init_uppercut_y && Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          right_uppercut = Date.now();
        }
        if (rightHand.y * coef < init_jab_y && Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          right_jab = Date.now();
        }
        if (rightHand.x * coef > right_init_hook_x && Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          right_hook = Date.now();
        }
      }
      if (Date.now() - right_dodge < LEVEL * 10 && right_dodge - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 1;
        punch_animation = 0;
        punch_animation_delay = 0;
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - left_dodge < LEVEL * 10 && left_dodge - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 2;
        punch_animation = 0;
        punch_animation_delay = 0;
      }
      if (Date.now() - left_uppercut < LEVEL * 10 && left_uppercut - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(5, "left");
      }
      if (Date.now() - left_jab < LEVEL * 10 && left_jab - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(1, "left");
      }
      if (Date.now() - left_hook < LEVEL * 10 && left_hook - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(3, "left");
      }
      if (Date.now() - right_uppercut < LEVEL * 10 && right_uppercut - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(6, "right");
      }
      if (Date.now() - right_jab < LEVEL * 10 && right_jab - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        updateFightPunchAnimation(2, "right");
      }
      if (Date.now() - right_hook < LEVEL * 10 && right_hook - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
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
