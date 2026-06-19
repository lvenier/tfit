(function(root) {
  const {
    cloneOpponent,
    OPPONENTS
  } = root.TfitConfig;

  const {
    detectDodgeGestures,
    detectHandGestures,
    hasPoseConfidence,
    isInsideGuard,
    moveMatchesRecentGesture = () => false,
    posePartsFromPoses
  } = root.TfitPoseDetection;

  const {
    moveDisplay
  } = root.TfitGameLogic;

  const {
    renderFightMeters,
    renderFightOpponentCharacter,
    renderMoveShape
  } = root.TfitRender;

  const {
    snapshot: layoutSnapshot
  } = root.TfitLayoutState;

  const POSE_INPUT_WIDTH = 640;
  const POSE_INPUT_HEIGHT = 480;
  const OPPONENT_FRAME_HOLD = 6;
  const OPPONENT_REACTION_FRAMES = 120;
  const OPPONENT_HIT_REACTION_FRAMES = 30;
  const FIGHT_MOVE_INTERVAL_MULTIPLIER = 2;
  const SHADOW_SUCCESS_FILL = [0, 255, 0, 127];

  /* c8 ignore next 3 */
  function currentOpponentConfig() {
    return OPPONENTS[gameState.opponent] || OPPONENTS["0"] || {};
  }

  /* c8 ignore next 3 */
  function opponentPunchWaitFrames() {
    return currentOpponentConfig().punchWaitFrames || OPPONENT_REACTION_FRAMES;
  }

  function poseX(point, layout) {
    return point.x * (layout.width / POSE_INPUT_WIDTH);
  }

  function poseY(point, layout) {
    return point.y * (layout.height / POSE_INPUT_HEIGHT);
  }

  function fightPromptPosition(type) {
    const isLeftMove = [1, 3, 5, 7, 10].includes(type);
    const isRightMove = [2, 4, 6, 8, 9].includes(type);
    if (isLeftMove) {
      return {
        pairedX: type === 10 ? calibrationState.right_init_pose_x : undefined,
        x: calibrationState.left_init_pose_x,
        y: calibrationState.left_init_pose_y
      };
    }
    if (isRightMove) {
      return {
        pairedX: type === 9 ? calibrationState.left_init_pose_x : undefined,
        x: calibrationState.right_init_pose_x,
        y: calibrationState.right_init_pose_y
      };
    }
    return {
      pairedX: undefined,
      x: layoutSnapshot().width / 2,
      y: layoutSnapshot().height / 5
    };
  }

  function fightPromptLabel(type) {
    return (MOVE_TYPE[type] || "")
      .replace(/^LEFT_/, "")
      .replace(/^RIGHT_/, "");
  }

  function applyPlayerHit() {
    /* c8 ignore next 3 */
    if (!Number.isFinite(gameState.my_stamina)) {
      gameState.my_stamina = cloneOpponent(gameState.opponent).stamina;
    }
    gameState.my_stamina = Math.max(0, gameState.my_stamina - 1);
  }

  function triggerOpponentHitReaction(type) {
    animationState.opponent.reaction = {
      duration: OPPONENT_HIT_REACTION_FRAMES,
      frame: 0,
      type
    };
  }

  function advanceOpponentHitReaction() {
    const reaction = animationState.opponent.reaction;
    if (!reaction) {return;}
    reaction.frame++;
    if (reaction.frame >= reaction.duration) {
      animationState.opponent.reaction = null;
    }
  }

  function markFightPromptSuccess(currentMove, now) {
    if (currentMove.type >= 1 && currentMove.type <= 6 && !currentMove.staminaApplied) {
      gameState.my_opponent.stamina = Math.max(0, gameState.my_opponent.stamina - 1);
      currentMove.staminaApplied = true;
    }
    currentMove.hit = true;
    timingState.hitSuccess = now;
    timingState.hitSuccessText = currentMove.type >= 7 && currentMove.type <= 9 ? "NICE DODGE" : "GOOD HIT";
    if (currentMove.type >= 1 && currentMove.type <= 6) {
      triggerOpponentHitReaction(currentMove.type);
      animationState.opponent.frame = -1;
      animationState.opponent.delay = 0;
    } else if (currentMove.type >= 7 && currentMove.type <= 9 && animationState.opponent.frame < 0) {
      animationState.opponent.type = randomInteger(1, 2);
      animationState.opponent.frame = 0;
      animationState.opponent.delay = 0;
    }
  }

  function beginFightEndingIfStaminaEmpty() {
    if (gameState.gameStarted && !gameState.fightEnding && (gameState.my_stamina <= 0 || gameState.my_opponent.stamina <= 0)) {
      gameState.manualStop = true;
      gameState.fightEnding = true;
      timingState.fightResultText = gameState.my_stamina <= 0 ? "YOU LOSE" : "YOU WIN";
      if (timingState.fightResultText === "YOU LOSE") {
        sounds.youLose.play();
      } else {
        sounds.youWin.play();
      }
      return true;
    }
    return false;
  }

  function finishFightEndingIfReady() {
    const reaction = animationState.opponent.reaction;
    if (
      gameState.fightEnding &&
      animationState.opponent.frame < 0 &&
      animationState.player.frame < 0 &&
      !reaction
    ) {
      gameState.gameOver = true;
      gameState.gameStarted = false;
      animationState.opponent.frame = -1;
      animationState.opponent.delay = 0;
      animationState.opponent.type = 0;
      animationState.opponent.reaction = null;
      animationState.player.frame = -1;
      animationState.player.delay = 0;
      animationState.player.type = 0;
      return true;
    }
    return false;
  }

  function isFightPromptAnswered(moveType, now, levelWindow) {
    if (moveType === 7) {return now - timingState.leftDodge < levelWindow;}
    if (moveType === 8) {return now - timingState.rightDodge < levelWindow;}
    if (moveType === 9) {return now - timingState.downDodge < levelWindow;}
    return moveMatchesRecentGesture({
      downDodge: timingState.downDodge,
      leftDodge: timingState.leftDodge,
      leftHook: timingState.leftHook,
      leftJab: timingState.leftJab,
      leftPoses: timingState.leftPoses,
      leftPosesReturn: timingState.leftPosesReturn,
      leftUppercut: timingState.leftUppercut,
      levelWindow,
      moveType,
      now,
      rightDodge: timingState.rightDodge,
      rightHook: timingState.rightHook,
      rightJab: timingState.rightJab,
      rightPoses: timingState.rightPoses,
      rightPosesReturn: timingState.rightPosesReturn,
      rightUppercut: timingState.rightUppercut
    });
  }

  function updateFightPunchAnimation(type, side) {
    const layout = layoutSnapshot();

    animationState.player.type = type;
    animationState.player.frame = 0;
    animationState.player.delay = 0;
    if (gameState.curMoves.length > 0 && 'type' in gameState.curMoves.at(-1) && gameState.curMoves.at(-1).type === type) {
      const currentMove = gameState.curMoves.at(-1);
      markFightPromptSuccess(currentMove, Date.now());
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
    if (!gameState.gameStarted) {
      renderFightOpponentCharacter({ layout });
    }
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
        if (dodges.down) {timingState.downDodge = now;}
      }
      if (hasPoseConfidence(leftHand)) {
        const leftInGuard = isInsideGuard(leftHand, calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize, layout.coef);
        if (leftInGuard) {
          timingState.leftPoses = now;
          if (!timingState.leftGuardInGuard) {
            timingState.leftPosesReturn = now;
          }
          timingState.leftGuardInGuard = true;
          timingState.leftHook = now - levelWindow;
          fill(255, 255, 255, 128);
          circle(calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize);
        } else {
          timingState.leftGuardInGuard = false;
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
      } else {
        timingState.leftGuardInGuard = false;
      }
      if (hasPoseConfidence(rightHand)) {
        const rightInGuard = isInsideGuard(rightHand, calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize, layout.coef);
        if (rightInGuard) {
          timingState.rightPoses = now;
          if (!timingState.rightGuardInGuard) {
            timingState.rightPosesReturn = now;
          }
          timingState.rightGuardInGuard = true;
          timingState.rightHook = now - levelWindow;
          fill(255, 255, 255, 128);
          circle(calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize);
        } else {
          timingState.rightGuardInGuard = false;
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
        /* c8 ignore next */
        if (rightGestures.jab) {timingState.rightJab = now;}
        /* c8 ignore next */
        if (rightGestures.hook) {timingState.rightHook = now;}
      } else {
        timingState.rightGuardInGuard = false;
      }
      if (now - timingState.rightDodge < levelWindow && timingState.rightDodge - timingState.rightPoses < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        animationState.player.type = 1;
        animationState.player.frame = 0;
        animationState.player.delay = 0;
        timingState.leftPoses = now - levelWindow;
      }
      if (now - timingState.leftDodge < levelWindow && timingState.leftDodge - timingState.leftPoses < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        animationState.player.type = 2;
        animationState.player.frame = 0;
        animationState.player.delay = 0;
      }
      if (now - timingState.leftUppercut < levelWindow && timingState.leftUppercut - timingState.leftPoses < levelWindow && timingState.leftPosesReturn - timingState.leftUppercut > 0 && now - timingState.leftPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(5, "left");
      }
      if (now - timingState.leftJab < levelWindow && timingState.leftJab - timingState.leftPoses < levelWindow && timingState.leftPosesReturn - timingState.leftJab > 0 && now - timingState.leftPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(1, "left");
      }
      if (now - timingState.leftHook < levelWindow && timingState.leftHook - timingState.leftPoses < levelWindow && timingState.leftPosesReturn - timingState.leftHook > 0 && now - timingState.leftPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(3, "left");
      }
      if (now - timingState.rightUppercut < levelWindow && timingState.rightUppercut - timingState.rightPoses < levelWindow && timingState.rightPosesReturn - timingState.rightUppercut > 0 && now - timingState.rightPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(6, "right");
      }
      if (now - timingState.rightJab < levelWindow && timingState.rightJab - timingState.rightPoses < levelWindow && timingState.rightPosesReturn - timingState.rightJab > 0 && now - timingState.rightPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(2, "right");
      }
      if (now - timingState.rightHook < levelWindow && timingState.rightHook - timingState.rightPoses < levelWindow && timingState.rightPosesReturn - timingState.rightHook > 0 && now - timingState.rightPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(4, "right");
      }
      /* c8 ignore next */
      if (gameState.gameStarted) {
        beginFightEndingIfStaminaEmpty();
        if (finishFightEndingIfReady()) {
          return;
        }
        if (!gameState.fightEnding) {
          const moveIntervalFrames = (layout.frameRate + layout.levelWindowBase / 2) * FIGHT_MOVE_INTERVAL_MULTIPLIER;
          const moveIndex = Math.max(1, Math.ceil((gameState.gameTimer + 1) / moveIntervalFrames));
          if (gameState.gameTimerNext < moveIndex) {
            if (gameState.moves.length >= moveIndex && gameState.moves[moveIndex] >= 0) {
              gameState.curMoves.push({
                "hit": false,
                "type": Math.trunc(gameState.moves[moveIndex]),
                "x": 0,
                "y": 0
              })
            }
            gameState.gameTimerNext++;
          }
        }
        const c = gameState.curMoves.length - 1;
        if (gameState.curMoves.length > 0 && 'type' in gameState.curMoves[c] && gameState.curMoves[c].type !== 0) {
          const currentMove = gameState.curMoves[c];
          const prompt = fightPromptPosition(gameState.curMoves[c].type);
          const promptLabel = fightPromptLabel(gameState.curMoves[c].type);
          if (currentMove.hit === false && isFightPromptAnswered(currentMove.type, now, levelWindow)) {
            markFightPromptSuccess(currentMove, now);
          }
          if (currentMove.hit === true) {
            fill(...SHADOW_SUCCESS_FILL);
          } else {
            fill(...moveDisplay(gameState.curMoves[c].type, gameState.feet_position, 255).color);
          }
          renderMoveShape({
            type: gameState.curMoves[c].type,
            x: prompt.x,
            y: prompt.y
          }, layout.objectPoseSize, prompt.pairedX);
          textSize(10 * layout.coef);
          fill(255, 255, 255, 255);
          textAlign(CENTER, CENTER);
          text(promptLabel, prompt.x, prompt.y);
          tint(255, 224);
          if (currentMove.hit === false) {
            if (!Number.isFinite(currentMove.reactionFrames)) {
              currentMove.reactionFrames = 0;
            }
            if (animationState.opponent.frame === -1 && currentMove.reactionFrames < opponentPunchWaitFrames()) {
              currentMove.reactionFrames++;
              renderFightOpponentCharacter({ layout });
            }
            if (gameState.gameStarted && animationState.opponent.frame === -1 && currentMove.reactionFrames >= opponentPunchWaitFrames() && currentMove.hit === false) {
              if (currentMove.type >= 7) {animationState.opponent.type = randomInteger(1,2);}
              else {animationState.opponent.type = currentMove.type;}
              animationState.opponent.frame = 0;
              animationState.opponent.delay = 0;
            }
            /* c8 ignore next */
            if (animationState.opponent.frame >= 0 && currentMove.hit === false) {
              renderFightOpponentCharacter({
                frame: animationState.opponent.frame,
                layout,
                type: animationState.opponent.type
              });
              if (animationState.opponent.delay % OPPONENT_FRAME_HOLD === 0) {
                if (animationState.opponent.frame >= 6) {
                  animationState.opponent.frame = -1;
                  animationState.opponent.delay = 0;
                  currentMove.hit = true;
                  applyPlayerHit();
                  beginFightEndingIfStaminaEmpty();
                } else {
                  animationState.opponent.frame++;
                }
              }
              animationState.opponent.delay++;
            }
          } else {
            if (animationState.opponent.frame >= 0) {
              renderFightOpponentCharacter({
                frame: animationState.opponent.frame,
                layout,
                type: animationState.opponent.type
              });
              if (animationState.opponent.delay % OPPONENT_FRAME_HOLD === 0) {
                if (animationState.opponent.frame >= 6) {
                  animationState.opponent.frame = -1;
                  animationState.opponent.delay = 0;
                } else {
                  animationState.opponent.frame++;
                }
              }
              animationState.opponent.delay++;
            } else {
              renderFightOpponentCharacter({ layout });
            }
          }
          tint(255, 192);
        } else {
          tint(255, 224);
          renderFightOpponentCharacter({ layout });
          tint(255, 192);
        }
        /* c8 ignore next */
        if (animationState.player.frame >= 0) {
          if (animationState.player.delay % 3 === 0) {
            if (animationState.player.frame >= 6) {
              animationState.player.frame = -1;
              animationState.player.delay = 0;
            } else {animationState.player.frame++;}
          }
          animationState.player.delay++;
        }
        advanceOpponentHitReaction();
        beginFightEndingIfStaminaEmpty();
        /* c8 ignore next */
        if (finishFightEndingIfReady()) {
          return;
        }
        tint(255, 255);
        gameState.gameTimer++;
      }
    }
  }

  const api = { renderFightMode };

  Object.defineProperty(api, "__fightPromptPositionForTest", {
    value: fightPromptPosition,
    writable: true,
    configurable: true,
    enumerable: false
  });
  Object.defineProperty(api, "__fightPromptLabelForTest", {
    value: fightPromptLabel,
    writable: true,
    configurable: true,
    enumerable: false
  });

  root.TfitFightMode = api;

  /* c8 ignore next 3 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
