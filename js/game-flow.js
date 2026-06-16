(function(root) {
  function gameResultBool(now = Date.now()) {
    return root.TfitGameLogic.isRecent(timingState.gameResult, now);
  }

  function loadSongmoves() {
    root.TfitLayoutState.setLevelWindowBase(root.TfitGameLogic.levelDelay(gameState.level));
    if (gameState.song) {
      gameState.gameDuration = gameState.gameLength * root.TfitLayoutState.snapshot().frameRate;
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

  function letsfight(now = Date.now()) {
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
    calibrationState.left_init_pose_y = storageNumber("left_init_pose_y", root.TfitLayoutState.snapshot().height / 3);
    calibrationState.right_init_pose_y = storageNumber("right_init_pose_y", root.TfitLayoutState.snapshot().height / 3);
    sounds.letsFight.play();
    gameState.gameStarted = true;
    timingState.gameResult = now - 5001;
    timingState.guardWarning = now;
    gameState.my_opponent = cloneOpponent(gameState.opponent);
    gameState.curMoves = [];
    gameState.gameCalibration = false;
    hide_sensor = 0;
    gameState.gameTimer = 0;
    gameState.score = 0;
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

  function finishRound({
    now = Date.now(),
    scheduleNextSeries = callback => setTimeout(callback, 5100)
  } = {}) {
    gameState.gameCalibration = false;
    gameState.my_opponent = cloneOpponent(gameState.opponent);
    gameState.gameStarted = false;
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

    if (!manualStop && roundEnd.shouldStartNextSeries) {
      scheduleNextSeries(() => {
        letsfight();
      });
    }

    gameState.gameCurrentSeries = manualStop ? 1 : roundEnd.gameSeries;
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
    switch_feet
  };

  Object.assign(root, api);
  root.TfitFlow = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
