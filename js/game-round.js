(function(root) {
  function remainingRoundSeconds({ frameRate, gameDuration, gameTimer }) {
    return Math.ceil((gameDuration - gameTimer) / frameRate);
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
    guardFeedback,
    keepTryingFeedback,
    remainingRoundSeconds,
    shouldShowHitFeedback
  };

  root.TfitRound = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
