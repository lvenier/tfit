(function(root) {
  const ROUND_RESTART_DELAY_MS = 5100;
  const FIGHT_STAGE_TRANSITION_DELAY_MS = 6100;

  function fightOpponentCount() {
    let opponentMap = root.OPPONENTS;
    if (!opponentMap) {
      opponentMap = {};
    } else {
      void opponentMap;
    }
    const rosterCount = Math.max(1, Object.keys(opponentMap).length);
    const level = Number.isFinite(Number(gameState.level)) ? Math.trunc(Number(gameState.level)) : 1;
    const levelLimit = level <= 0 ? 2 : level >= 2 ? rosterCount : 3;
    return Math.max(1, Math.min(rosterCount, levelLimit));
  }

  function fightStage() {
    return Math.min(fightOpponentCount(), Math.max(1, Number(gameState.opponent) + 1));
  }

  function resetFightLadder() {
    gameState.opponent = 0;
    gameState.fightStage = 1;
    gameState.fightLadderActive = false;
    gameState.pendingFightOpponentStamina = null;
    gameState.fightTransitionActive = false;
    gameState.fightTransitionText = null;
    gameState.my_opponent = cloneOpponent(gameState.opponent);
    gameState.my_stamina = cloneOpponent(gameState.opponent).stamina;
    timingState.fightTransitionTime = 0;
  }

  function opponentWithPendingRecovery() {
    const opponent = cloneOpponent(gameState.opponent);
    if (Number.isFinite(gameState.pendingFightOpponentStamina)) {
      opponent.stamina = gameState.pendingFightOpponentStamina;
      gameState.pendingFightOpponentStamina = null;
    }
    return opponent;
  }

  function fightRoundAnnouncement({ stage = true } = {}) {
    const round = Math.max(1, Number(gameState.gameCurrentSeries) || 1);
    if (!stage) {
      return {
        nextText: null,
        speechText: "ROUND " + round,
        text: "ROUND " + round
      };
    }
    return {
      nextText: "ROUND " + round,
      speechText: "STAGE " + fightStage(),
      text: "STAGE " + fightStage()
    };
  }

  function showFightRoundAnnouncement(announcement, now) {
    timingState.roundAnnouncementNextText = announcement.nextText || null;
    timingState.roundAnnouncementText = announcement.text;
    timingState.roundAnnouncementTime = now;
  }

  function gameResultBool(now = Date.now()) {
    return root.TfitGameLogic.isRecent(timingState.gameResult, now);
  }

  function loadSongmoves() {
    root.TfitLayoutState.setLevelWindowBase(root.TfitGameLogic.levelDelay(gameState.level));
    if (gameState.song) {
      const roundDurationUnits = root.TfitRound?.roundDurationUnits || (seconds => Number(seconds) * 100);
      gameState.gameDuration = roundDurationUnits(gameState.gameLength);
      if (gameState.song.moveLength === 0) {
        if (gameState.menu === 4) {
          gameState.shadow_focus = storageNumber("shadow_focus", gameState.shadow_focus, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 });
        }
        gameState.song.moves = root.TfitGameLogic.createSongMoves({
          gameLength: gameState.gameLength,
          level: gameState.level,
          menu: gameState.menu,
          randomInteger,
          shadowFocus: gameState.shadow_focus
        });
      }
      gameState.moves = gameState.song.moves;
      gameState.score_max = root.TfitGameLogic.countScoringMoves(gameState.moves);
    }
  }

  function fetchSong(_id = 1) {
    gameState.song = root.TfitGameLogic.createEmptySong();
  }

  function punchSound(now = Date.now()) {
    if (timingState.punchSoundTime + 1000 < now) {
      sounds.punch.play();
      timingState.punchSoundTime = now;
    }
  }

  function letsfight(now = Date.now(), options = {}) {
    sounds.click.play();
    if (gameState.gameCalibration) {
      speechString = "Calibrating !";
      return;
    }
    if (gameState.gameStarted) {
      speechString = "Already fighting !";
      return;
    }
    gameState.feet_position = 0;
    if (gameState.menu === 4) {
      if (!gameState.fightLadderActive) {
        resetFightLadder();
      }
      gameState.fightLadderActive = true;
      gameState.fightStage = fightStage();
    }
    calibrationState.left_init_pose_y = storageNumber("left_init_pose_y", root.TfitLayoutState.snapshot().height / 3);
    calibrationState.right_init_pose_y = storageNumber("right_init_pose_y", root.TfitLayoutState.snapshot().height / 3);
    if (options.playLetsFightSound !== false) {
      sounds.letsFight.play();
    }
    gameState.gameStarted = true;
    gameState.fightEnding = false;
    gameState.fightTransitionActive = false;
    gameState.fightTransitionText = null;
    gameState.fightVictoryCelebrationActive = false;
    timingState.fightResultText = null;
    timingState.fightTransitionTime = 0;
    timingState.gameResult = now - 5001;
    timingState.guardWarning = now;
    if (gameState.menu === 4) {
      const announcement = options.announcement || fightRoundAnnouncement();
      speechString = options.speechString || announcement.speechText;
      showFightRoundAnnouncement(announcement, now);
    }
    gameState.my_opponent = gameState.menu === 4 ? opponentWithPendingRecovery() : cloneOpponent(gameState.opponent);
    gameState.my_stamina = cloneOpponent(gameState.opponent).stamina;
    gameState.curMoves = [];
    gameState.gameCalibration = false;
    hide_sensor = 0;
    gameState.gameTimer = 0;
    gameState.gameTimerUpdatedAt = now;
    gameState.score = 0;
    if (gameState.gameCurrentSeries === 1) {
      gameState.caloriesBurned = 0;
    }
    gameState.arrayScore = [];
    loadSongmoves();
    gameState.score_max_prev = gameState.score_max;
  }

  function switch_feet() {
    gameState.feet_position = 1;
    calibrationState.left_init_pose_y = storageNumber("right_init_pose_y", root.TfitLayoutState.snapshot().height / 3);
    calibrationState.right_init_pose_y = storageNumber("left_init_pose_y", root.TfitLayoutState.snapshot().height / 3);
  }

  function hitSuccess(c) {
    const result = root.TfitScore.markHit({
      arrayScore: gameState.arrayScore,
      calorieState: gameState,
      curMoves: gameState.curMoves,
      index: c,
      playComboFeedback: key => {
        const comboSounds = {
          awesome: sounds.awesome,
          continue: sounds.continue,
          good: sounds.good,
          great: sounds.great,
          perfect: sounds.perfect,
          thats_it: sounds.thatsIt,
          well_done: sounds.wellDone
        };
        comboSounds[key].play();
      }
    });
    if (result.hitSuccess !== null) {
      timingState.hitSuccess = result.hitSuccess;
    }
  }

  function storeSelectedPlayerCalories(storage = root.localStorage, { completed = true } = {}) {
    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
      return null;
    }

    const profileKey = storage.getItem("selected_player") || "player";
    const calories = Math.max(0, Number(gameState.caloriesBurned) || 0);
    const gameCountKey = {
      2: "shadow",
      3: "trainPad",
      4: "fight"
    }[gameState.menu];
    if (calories <= 0 && (!completed || !gameCountKey)) {
      return null;
    }

    let profile = {};
    try {
      profile = JSON.parse(storage.getItem(profileKey) || "{}") || {};
    } catch {
      profile = {};
    }

    const total = Math.round(((Number(profile.caloriesBurned) || 0) + calories) * 10) / 10;
    profile.caloriesBurned = total;
    profile.lastCaloriesBurned = Math.round(calories * 10) / 10;
    profile.gameCounts = {
      fight: Number(profile.gameCounts?.fight) || 0,
      shadow: Number(profile.gameCounts?.shadow) || 0,
      trainPad: Number(profile.gameCounts?.trainPad) || 0
    };
    if (completed && gameCountKey) {
      profile.gameCounts[gameCountKey] += 1;
    } else {
      void completed;
    }
    storage.setItem(profileKey, JSON.stringify(profile));

    return {
      key: profileKey,
      caloriesBurned: profile.caloriesBurned,
      gameCounts: profile.gameCounts,
      lastCaloriesBurned: profile.lastCaloriesBurned
    };
  }

  function finishRound({
    now = Date.now(),
    scheduleNextSeries = (callback, delay = ROUND_RESTART_DELAY_MS) => setTimeout(callback, delay)
  } = {}) {
    const fightEndedByStamina = gameState.menu === 4 && Boolean(gameState.fightEnding);
    const fightWonByStamina = fightEndedByStamina && gameState.my_opponent && gameState.my_opponent.stamina <= 0;
    const fightLostByStamina = fightEndedByStamina && gameState.my_stamina <= 0;
    const fightTimedOut = gameState.menu === 4 && gameState.gameOver && !fightEndedByStamina && !gameState.manualStop;
    const currentOpponentStamina = Number(gameState.my_opponent?.stamina);
    const currentOpponentConfig = cloneOpponent(gameState.opponent);
    gameState.gameCalibration = false;
    gameState.my_opponent = cloneOpponent(gameState.opponent);
    gameState.my_stamina = cloneOpponent(gameState.opponent).stamina;
    gameState.gameStarted = false;
    gameState.fightEnding = false;
    animationState.opponent.delay = 0;
    animationState.opponent.frame = -1;
    animationState.opponent.type = 0;
    animationState.opponent.reaction = null;
    animationState.player.delay = 0;
    animationState.player.frame = -1;
    animationState.player.type = 0;
    hide_sensor = 0;
    gameState.gameTimer = -1;
    gameState.gameOver = false;
    const manualStop = gameState.manualStop;
    gameState.manualStop = false;

    const roundEnd = root.TfitRound.roundEndState({
      currentSeries: gameState.gameCurrentSeries,
      curMoves: gameState.curMoves,
      gameSeries: gameState.gameSeries,
      score: gameState.score
    });

    if (roundEnd.gameResultNow) {
      timingState.gameResult = now;
    }

    const hasNextFightOpponent = gameState.opponent < fightOpponentCount() - 1;
    const shouldAdvanceFight = fightWonByStamina && hasNextFightOpponent;
    const shouldRestartFightStage = fightTimedOut;
    const shouldCelebrateFightVictory = fightWonByStamina && !hasNextFightOpponent;

    if (shouldAdvanceFight) {
      gameState.opponent += 1;
      gameState.gameCurrentSeries = 1;
      gameState.fightStage = fightStage();
      gameState.fightLadderActive = true;
      gameState.fightTransitionActive = true;
      gameState.pendingFightOpponentStamina = null;
      gameState.my_opponent = cloneOpponent(gameState.opponent);
      gameState.my_stamina = cloneOpponent(gameState.opponent).stamina;
      gameState.fightTransitionText = "NEXT: " + (cloneOpponent(gameState.opponent).name || ("STAGE " + gameState.fightStage)).toUpperCase();
      timingState.fightTransitionTime = now;
      scheduleNextSeries(() => {
        letsfight();
      }, FIGHT_STAGE_TRANSITION_DELAY_MS);
    } else if (shouldRestartFightStage) {
      const recoveredStamina = Math.min(
        Number(currentOpponentConfig.stamina) || 1,
        Math.max(0, currentOpponentStamina || 0) + (Number(currentOpponentConfig.recovery) || 0)
      );
      gameState.pendingFightOpponentStamina = recoveredStamina;
      gameState.gameCurrentSeries = Math.max(1, Number(gameState.gameCurrentSeries) || 1) + 1;
      gameState.fightStage = fightStage();
      gameState.fightLadderActive = true;
      gameState.fightTransitionActive = true;
      gameState.fightTransitionText = "ROUND " + gameState.gameCurrentSeries;
      timingState.fightTransitionTime = now;
      scheduleNextSeries(() => {
        const announcement = fightRoundAnnouncement({ stage: false });
        letsfight(undefined, {
          announcement,
          playLetsFightSound: false,
          speechString: announcement.speechText
        });
      }, ROUND_RESTART_DELAY_MS);
    } else if (!manualStop && gameState.menu !== 4 && roundEnd.shouldStartNextSeries) {
      scheduleNextSeries(() => {
        letsfight();
      }, ROUND_RESTART_DELAY_MS);
    }

    if (shouldCelebrateFightVictory) {
      gameState.fightVictoryCelebrationActive = true;
      gameState.fightVictoryCelebrationTime = now;
      timingState.gameResult = now;
    }

    if (manualStop || gameState.menu === 4 || !roundEnd.shouldStartNextSeries) {
      const completedGame = (fightEndedByStamina && !shouldAdvanceFight) || (!manualStop && gameState.menu !== 4 && !roundEnd.shouldStartNextSeries);
      storeSelectedPlayerCalories(root.localStorage, { completed: completedGame });
    } else {
      void roundEnd.shouldStartNextSeries;
    }

    if ((fightLostByStamina || (fightWonByStamina && !hasNextFightOpponent) || (manualStop && gameState.menu === 4 && !shouldAdvanceFight)) && !shouldRestartFightStage) {
      resetFightLadder();
    }

    if (gameState.menu !== 4) {
      gameState.gameCurrentSeries = manualStop ? 1 : roundEnd.gameSeries;
    } else if (!shouldRestartFightStage && !shouldAdvanceFight) {
      gameState.gameCurrentSeries = 1;
    }
    gameState.feet_position = 0;
    calibrationState.left_init_pose_y = storageNumber("left_init_pose_y", root.TfitLayoutState.snapshot().height / 3);
    calibrationState.right_init_pose_y = storageNumber("right_init_pose_y", root.TfitLayoutState.snapshot().height / 3);

    return roundEnd;
  }

  const api = {
    fetchSong,
    finishRound,
    gameResultBool,
    hitSuccess,
    letsfight,
    loadSongmoves,
    punchSound,
    storeSelectedPlayerCalories,
    switch_feet
  };

  Object.assign(root, api);
  root.TfitFlow = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
