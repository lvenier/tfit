(function(root) {
  const GAME_TIMER_UNITS_PER_SECOND = 100;
  const GAME_TIMER_UNIT_MS = 1000 / GAME_TIMER_UNITS_PER_SECOND;

  function roundDurationUnits(seconds) {
    return Number(seconds) * GAME_TIMER_UNITS_PER_SECOND;
  }

  function advanceGameTimer(state, now = Date.now()) {
    const lastUpdate = state.gameTimerUpdatedAt;
    const elapsedMs = Number.isFinite(lastUpdate)
      ? Math.max(0, now - lastUpdate)
      : GAME_TIMER_UNIT_MS;
    const elapsedUnits = elapsedMs / GAME_TIMER_UNIT_MS;

    state.gameTimer = (Number(state.gameTimer) || 0) + elapsedUnits;
    state.gameTimerUpdatedAt = now;
    return elapsedUnits;
  }

  function remainingRoundSeconds({ frameRate, gameDuration, gameTimer }) {
    void frameRate;
    return Math.ceil((gameDuration - gameTimer) / GAME_TIMER_UNITS_PER_SECOND);
  }

  function isRoundExpired({ gameDuration, gameTimer }) {
    return gameDuration - gameTimer <= 0;
  }

  function scoreTotal(arrayScore) {
    return arrayScore.reduce((total, value) => total + value, 0);
  }

  function initialRoundMoveState(moves) {
    return {
      arrayScore: Array(moves.length).fill(0),
      curMoves: [],
      gameTimerNext: 0
    };
  }

  function roundEndState({ currentSeries, curMoves, gameSeries, score }) {
    const shouldStartNextSeries = currentSeries < gameSeries;

    return {
      gameResultNow: curMoves.length > 0 && score > 0,
      gameSeries: shouldStartNextSeries ? currentSeries + 1 : 1,
      shouldStartNextSeries
    };
  }

  function shouldShowHitFeedback({ hitSuccessTime, now }) {
    return now - hitSuccessTime < 1000;
  }

  function hasThreeRecentMisses(curMoves) {
    return curMoves.length > 3 &&
      curMoves.at(-1).hit === false &&
      curMoves.at(-2).hit === false &&
      curMoves.at(-3).hit === false;
  }

  function keepTryingFeedback({
    curMoves,
    guardWarningTime,
    hitSuccessTime,
    now,
    remainingSeconds
  }) {
    const hitAge = now - hitSuccessTime;
    const show = hitAge > 3000 &&
      hitAge < 4000 &&
      guardWarningTime - now < 2000 &&
      remainingSeconds > 5 &&
      hasThreeRecentMisses(curMoves);

    return {
      playSound: show && hitAge < 3019,
      show
    };
  }

  function guardFeedback({
    gameTimer,
    guardWarningTime,
    leftPoseTime,
    now,
    remainingSeconds,
    rightPoseTime
  }) {
    let nextGuardWarningTime = guardWarningTime;
    let playSound = false;
    let show = false;

    if ((now - leftPoseTime > 2000 || now - rightPoseTime > 2000) && remainingSeconds > 5 && gameTimer > 100) {
      nextGuardWarningTime += 100;
      const warningDelay = nextGuardWarningTime - now;

      if (warningDelay > 1000) {
        playSound = warningDelay < 1089;
        show = warningDelay < 3000;
      }

      if (nextGuardWarningTime - now > 10000) {
        nextGuardWarningTime = now;
      }
    } else {
      nextGuardWarningTime = now;
    }

    return {
      guardWarningTime: nextGuardWarningTime,
      playSound,
      show
    };
  }

  const api = {
    advanceGameTimer,
    GAME_TIMER_UNITS_PER_SECOND,
    guardFeedback,
    initialRoundMoveState,
    isRoundExpired,
    keepTryingFeedback,
    remainingRoundSeconds,
    roundDurationUnits,
    roundEndState,
    scoreTotal,
    shouldShowHitFeedback
  };

  root.TfitRound = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
