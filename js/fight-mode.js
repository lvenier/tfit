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
    nextDownDodgeState = () => ({ done: false, switched: false, touchedDown: false }),
    posePartsFromPoses
  } = root.TfitPoseDetection;

  const {
    moveDisplay
  } = root.TfitGameLogic;

  const addCaloriesForMove = root.TfitScore?.addCaloriesForMove || (() => 0);

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
  const OPPONENT_BLOCK_REACTION_FRAMES = 32;
  const FIGHT_MOVE_INTERVAL_MULTIPLIERS = {
    0: 1.75,
    1: 1.5,
    2: 1.25
  };
  const SHADOW_SUCCESS_FILL = [0, 255, 0, 127];

  /* c8 ignore next 3 */
  function currentOpponentConfig() {
    return OPPONENTS[gameState.opponent] || OPPONENTS["0"] || {};
  }

  /* c8 ignore next 3 */
  function opponentPunchWaitFrames() {
    return currentOpponentConfig().punchWaitFrames || OPPONENT_REACTION_FRAMES;
  }

  function opponentBlockChance() {
    const chance = Number(currentOpponentConfig().blockChance) || 0;
    return Math.max(0, Math.min(1, chance));
  }

  function fightMoveIntervalMultiplier() {
    const level = Number.isFinite(Number(gameState.level)) ? Math.trunc(Number(gameState.level)) : 1;
    if (FIGHT_MOVE_INTERVAL_MULTIPLIERS[level]) {
      return FIGHT_MOVE_INTERVAL_MULTIPLIERS[level];
    } else {
      return FIGHT_MOVE_INTERVAL_MULTIPLIERS[1];
    }
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

  function triggerOpponentBlockReaction(type) {
    animationState.opponent.block = {
      duration: OPPONENT_BLOCK_REACTION_FRAMES,
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

  function advanceOpponentBlockReaction() {
    const block = animationState.opponent.block;
    if (!block) {return;}
    block.frame++;
    if (block.frame >= block.duration) {
      animationState.opponent.block = null;
    }
  }

  function shouldOpponentBlock(currentMove) {
    return currentMove.type >= 1 &&
      currentMove.type <= 6 &&
      !currentMove.staminaApplied &&
      Math.random() < opponentBlockChance();
  }

  function markFightPromptSuccess(currentMove, now) {
    const wasUnhit = currentMove.hit === false;
    const blocked = shouldOpponentBlock(currentMove);
    if (currentMove.type >= 1 && currentMove.type <= 6 && !currentMove.staminaApplied) {
      if (!blocked) {
        gameState.my_opponent.stamina = Math.max(0, gameState.my_opponent.stamina - 1);
      }
      currentMove.staminaApplied = true;
    }
    /* c8 ignore next */
    if (wasUnhit && !blocked) {
      addCaloriesForMove(gameState, currentMove.type);
    }
    currentMove.blocked = blocked;
    currentMove.hit = true;
    currentMove.success = true;
    timingState.hitSuccess = now;
    timingState.hitSuccessText = blocked
      ? "BLOCKED"
      : currentMove.type >= 7 && currentMove.type <= 9
        ? "NICE DODGE"
        : "GOOD HIT";
    if (currentMove.type >= 1 && currentMove.type <= 6) {
      if (blocked) {
        triggerOpponentBlockReaction(currentMove.type);
      } else {
        triggerOpponentHitReaction(currentMove.type);
      }
      animationState.opponent.frame = -1;
      animationState.opponent.delay = 0;
    } else if (currentMove.type >= 7 && currentMove.type <= 9 && animationState.opponent.frame < 0) {
      animationState.opponent.type = randomInteger(1, 2);
      animationState.opponent.frame = 0;
      animationState.opponent.delay = 0;
    }
    if (currentMove.type === 9) {
      timingState.downDodge = 0;
      timingState.downDodgeDone = false;
      timingState.downDodgeSwitch = false;
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
      !reaction &&
      !animationState.opponent.block
    ) {
      gameState.gameOver = true;
      gameState.gameStarted = false;
      animationState.opponent.frame = -1;
      animationState.opponent.delay = 0;
      animationState.opponent.type = 0;
      animationState.opponent.reaction = null;
      animationState.opponent.block = null;
      animationState.player.frame = -1;
      animationState.player.delay = 0;
      animationState.player.type = 0;
      return true;
    }
    return false;
  }

  function fightPromptGestureTime(moveType) {
    if (moveType === 1) {return timingState.leftJab;}
    if (moveType === 2) {return timingState.rightJab;}
    if (moveType === 3) {return timingState.leftHook;}
    if (moveType === 4) {return timingState.rightHook;}
    if (moveType === 5) {return timingState.leftUppercut;}
    if (moveType === 6) {return timingState.rightUppercut;}
    if (moveType === 7) {return timingState.leftDodge;}
    if (moveType === 8) {return timingState.rightDodge;}
    if (moveType === 9) {
      return timingState.downDodge;
    } else {
      void moveType;
    }
    return null;
  }

  function isFightPromptGestureFresh(currentMove) {
    const moveType = currentMove.type;
    const promptStartedAt = Number.isFinite(currentMove.promptStartedAt) ? currentMove.promptStartedAt : -Infinity;
    const gestureTime = fightPromptGestureTime(moveType);
    return !Number.isFinite(gestureTime) || gestureTime > promptStartedAt;
  }

  function isFightPromptAnswered(currentMove, now, levelWindow) {
    const moveType = currentMove.type;
    if (!isFightPromptGestureFresh(currentMove)) {return false;}
    if (moveType === 7) {return now - timingState.leftDodge < levelWindow;} else {void moveType;}
    if (moveType === 8) {return now - timingState.rightDodge < levelWindow;} else {void moveType;}
    if (moveType === 9) {return now - timingState.downDodge < levelWindow && timingState.downDodgeSwitch === true;} else {void moveType;}
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

  function updateFightPunchAnimation(type, side, now) {
    const layout = layoutSnapshot();

    animationState.player.type = type;
    animationState.player.frame = 0;
    animationState.player.delay = 0;
    if (gameState.curMoves.length > 0 && 'type' in gameState.curMoves.at(-1) && gameState.curMoves.at(-1).type === type) {
      const currentMove = gameState.curMoves.at(-1);
      if (currentMove.hit === false && isFightPromptGestureFresh(currentMove)) {
        markFightPromptSuccess(currentMove, now);
      }
    }
    if (side === "left") {
      timingState.leftPoses = now - layout.levelWindowBase * 10;
    } else {
      void side;
    }
    if (side === "right") {
      timingState.rightPoses = now - layout.levelWindowBase * 10;
    } else {
      void side;
    }
  }

  function renderFightMode() {
    const layout = layoutSnapshot();

    gameState.shadow_focus = 0;
    renderFightMeters();
    if (!gameState.gameStarted) {
      renderFightOpponentCharacter({ layout });
    } else {
      void gameState.gameStarted;
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
        if (dodges.right) {timingState.rightDodge = now;} else {void dodges.right;}
        if (dodges.left) {timingState.leftDodge = now;} else {void dodges.left;}
        const downDodgeState = nextDownDodgeState({
          coef: layout.coef,
          done: timingState.downDodgeDone,
          initUppercutY: calibrationState.init_uppercut_y,
          nose,
          switched: timingState.downDodgeSwitch
        });
        timingState.downDodgeDone = downDodgeState.done;
        timingState.downDodgeSwitch = downDodgeState.switched;
        if (downDodgeState.touchedDown) {timingState.downDodge = now;} else {void downDodgeState.touchedDown;}
      } else {
        void nose;
      }
      if (hasPoseConfidence(leftHand)) {
        const leftInGuard = isInsideGuard(leftHand, calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize, layout.coef);
        if (leftInGuard) {
          timingState.leftPoses = now;
          if (!timingState.leftGuardInGuard) {
            timingState.leftPosesReturn = now;
          }
          timingState.leftGuardInGuard = true;
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
        if (leftGestures.uppercut) {timingState.leftUppercut = now;} else {void leftGestures.uppercut;}
        if (leftGestures.jab) {timingState.leftJab = now;} else {void leftGestures.jab;}
        if (leftGestures.hook) {timingState.leftHook = now;} else {void leftGestures.hook;}
      } else {
        timingState.leftGuardInGuard = false;
      }
      if (hasPoseConfidence(rightHand)) {
        const rightInGuard = isInsideGuard(rightHand, calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize, layout.coef);
        if (rightInGuard) {
          timingState.rightPoses = now;
          if (!timingState.rightGuardInGuard) {
            timingState.rightPosesReturn = now;
          } else {
            void timingState.rightGuardInGuard;
          }
          timingState.rightGuardInGuard = true;
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
        if (rightGestures.uppercut) {timingState.rightUppercut = now;} else {void rightGestures.uppercut;}
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
        updateFightPunchAnimation(5, "left", now);
      }
      if (now - timingState.leftJab < levelWindow && timingState.leftJab - timingState.leftPoses < levelWindow && timingState.leftPosesReturn - timingState.leftJab > 0 && now - timingState.leftPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(1, "left", now);
      }
      if (now - timingState.leftHook < levelWindow && timingState.leftHook - timingState.leftPoses < levelWindow && timingState.leftPosesReturn - timingState.leftHook > 0 && now - timingState.leftPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(3, "left", now);
      }
      if (now - timingState.rightUppercut < levelWindow && timingState.rightUppercut - timingState.rightPoses < levelWindow && timingState.rightPosesReturn - timingState.rightUppercut > 0 && now - timingState.rightPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(6, "right", now);
      }
      if (now - timingState.rightJab < levelWindow && timingState.rightJab - timingState.rightPoses < levelWindow && timingState.rightPosesReturn - timingState.rightJab > 0 && now - timingState.rightPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(2, "right", now);
      }
      if (now - timingState.rightHook < levelWindow && timingState.rightHook - timingState.rightPoses < levelWindow && timingState.rightPosesReturn - timingState.rightHook > 0 && now - timingState.rightPosesReturn < levelWindow && gameState.gameStarted && !gameState.fightEnding && animationState.player.frame === -1) {
        updateFightPunchAnimation(4, "right", now);
      }
      /* c8 ignore next */
      if (gameState.gameStarted) {
        beginFightEndingIfStaminaEmpty();
        if (finishFightEndingIfReady()) {
          return;
        }
        if (!gameState.fightEnding) {
          const moveIntervalFrames = (layout.frameRate + layout.levelWindowBase / 2) * fightMoveIntervalMultiplier();
          const moveIndex = Math.max(1, Math.ceil((gameState.gameTimer + 1) / moveIntervalFrames));
          if (gameState.gameTimerNext < moveIndex) {
            if (gameState.moves.length >= moveIndex && gameState.moves[moveIndex] >= 0) {
              gameState.curMoves.push({
                "hit": false,
                "promptStartedAt": now,
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
          if (currentMove.hit === false && isFightPromptAnswered(currentMove, now, levelWindow)) {
            markFightPromptSuccess(currentMove, now);
          }
          if (currentMove.hit === true && currentMove.success !== false) {
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
                  currentMove.success = false;
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
        advanceOpponentBlockReaction();
        beginFightEndingIfStaminaEmpty();
        /* c8 ignore next */
        if (finishFightEndingIfReady()) {
          return;
        }
        tint(255, 255);
        gameState.gameTimer++;
      }
    } else {
      void poses;
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
