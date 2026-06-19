(function(root) {
  const MOVE_DISPLAY_BY_TYPE = {
    3: { color: [100, 0, 100], text: "H" },
    4: { color: [100, 0, 100], text: "H" },
    5: { color: [0, 100, 100], text: "U" },
    6: { color: [0, 100, 100], text: "U" },
    7: { color: [0, 0, 100], text: "D" },
    8: { color: [0, 0, 100], text: "D" },
    9: { color: [0, 0, 200], text: "D" },
    10: { color: [0, 190, 255], text: "S" }
  };

  function createEmptySong() {
    return {
      name: "",
      url: "",
      author: "",
      moves: [],
      length: 120,
      moveLength: 0
    };
  }

  function moveRangeForFocus(shadowFocus) {
    if (shadowFocus === 1) {return [1, 2];}
    if (shadowFocus === 2) {return [3, 4];}
    if (shadowFocus === 3) {return [5, 6];}
    if (shadowFocus === 4) {return [7, 9];}
    if (shadowFocus === 5) {return [1, 6];}
    return [1, 9];
  }

  function shouldRestAtIndex(index, level) {
    if (level === 1) {return index % 5 === 0;}
    if (level === 0) {return index % 2 === 0;}
    return false;
  }

  function createSongMoves({
    gameLength,
    level,
    menu,
    randomInteger,
    shadowFocus
  }) {
    const moves = [0, 0];
    const [minMove, maxMove] = moveRangeForFocus(shadowFocus);

    for (let i = 2; i < gameLength - 5; i++) {
      moves.push(shouldRestAtIndex(i, level) ? 0 : randomInteger(minMove, maxMove));
    }
    for (let s = gameLength - 5; s < gameLength; s++) {
      moves[s] = 0;
    }
    if (menu === 2) {
      moves[Math.floor(gameLength / 2)] = 10;
    }
    return moves;
  }

  function countScoringMoves(moves) {
    return moves.filter(move => move !== 0 && move !== 10).length;
  }

  function levelDelay(level) {
    return 50 - level * 10;
  }

  function isRecent(timestamp, now = Date.now(), duration = 5000) {
    return now - timestamp < duration;
  }

  function nextFrameRate(frameRate) {
    return frameRate === 120 ? 20 : frameRate + 20;
  }

  function nextOneBasedIndex(current, max) {
    return current < max ? current + 1 : 1;
  }

  function nextZeroBasedIndex(current, count) {
    return current < count - 1 ? current + 1 : 0;
  }

  function calibrationDefaults(windowWidth, windowHeight, objectPoseSize, coef) {
    return {
      left_init_pose_x: 3 * windowWidth / 7,
      left_init_pose_y: windowHeight / 3,
      right_init_pose_x: 4 * windowWidth / 7,
      right_init_pose_y: windowHeight / 3,
      init_jab_y: windowHeight / 3 - objectPoseSize * coef / 1.4,
      init_uppercut_y: windowHeight / 3 + objectPoseSize * coef / 1.4,
      left_init_hook_x: windowWidth / 7 * 3 - objectPoseSize * coef,
      right_init_hook_x: windowWidth / 7 * 4 + objectPoseSize * coef
    };
  }

  function detectStartCondition({
    errorTimer,
    gameReady,
    poses,
    confidenceThreshold = 0.1,
    errorThreshold = 500
  }) {
    if (gameReady) {
      return {
        error: "",
        errorTimer: 0,
        gameReady,
        leftHand: undefined,
        nose: undefined,
        pose: undefined,
        rightHand: undefined
      };
    }

    const pose = poses.length > 0 ? poses[0] : undefined;
    const leftHand = pose ? pose["left_wrist"] : undefined;
    const rightHand = pose ? pose["right_wrist"] : undefined;
    const nose = pose ? pose["nose"] : undefined;
    let nextGameReady = false;

    if (
      nose && leftHand &&
      rightHand &&
      leftHand.confidence > confidenceThreshold &&
      rightHand.confidence > confidenceThreshold &&
      nose.confidence > confidenceThreshold
    ) {
      nextGameReady = true;
    }

    const nextErrorTimer = errorTimer + 1;

    return {
      error: nextErrorTimer > errorThreshold ? "We failed to detect hands or others." : "",
      errorTimer: nextErrorTimer,
      gameReady: nextGameReady,
      leftHand,
      nose,
      pose,
      rightHand
    };
  }

  function detectStartCountdown({
    errorThreshold = 500,
    errorTimer,
    framesPerSecond = 60
  }) {
    const totalFrames = Math.max(errorThreshold, 1);
    const elapsedFrames = Math.max(0, Math.min(errorTimer, totalFrames));
    const remainingFrames = Math.max(totalFrames - elapsedFrames, 0);

    return {
      elapsedFrames,
      progress: elapsedFrames / totalFrames,
      remainingFrames,
      remainingSeconds: Math.max(0, Math.round(remainingFrames / framesPerSecond)),
      totalFrames
    };
  }

  function moveDisplay(type, feetPosition = 0, alpha = 128) {
    if (type === 1 || type === 2) {
      let text = type === 1 ? "J" : "S";
      if (feetPosition === 1) {
        text = type === 1 ? "S" : "J";
      }
      return { color: [100, 100, 0, alpha], text };
    }
    const display = MOVE_DISPLAY_BY_TYPE[type];
    return display ? { color: [...display.color, alpha], text: display.text } : null;
  }

  const api = {
    calibrationDefaults,
    countScoringMoves,
    createEmptySong,
    createSongMoves,
    detectStartCountdown,
    detectStartCondition,
    isRecent,
    levelDelay,
    moveDisplay,
    moveRangeForFocus,
    nextFrameRate,
    nextOneBasedIndex,
    nextZeroBasedIndex,
    shouldRestAtIndex
  };

  root.TfitGameLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
