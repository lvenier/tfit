(function(root) {
  function hasComboBeforeHit(curMoves, index, requiredHits = 2) {
    if (index < 3) {
      return false;
    }

    let hitCount = 0;
    for (let k = 1; k < index - 2; k++) {
      if (hitCount > requiredHits - 1) {
        break;
      }
      const previousMove = curMoves[index - k];
      if (previousMove.type === 0) {
        continue;
      }
      if (previousMove.hit === false) {
        break;
      }
      hitCount++;
    }
    return hitCount > requiredHits - 1;
  }

  function comboFeedbackKey(random = Math.random) {
    const r = Math.floor(random() * 20);
    if (r === 0 || r === 1) {return 'great';}
    if (r === 2 || r === 3) {return 'awesome';}
    if (r === 4 || r === 5) {return 'good';}
    if (r === 6 || r === 7) {return 'perfect';}
    if (r === 8 || r === 9) {return 'continue';}
    if (r === 10 || r === 11) {return 'thats_it';}
    if (r === 12 || r === 13) {return 'well_done';}
    return null;
  }

  function caloriesForMove(type) {
    if (type >= 7 && type <= 10) {
      return 0.2;
    }
    if (type >= 1 && type <= 6) {
      return 0.1;
    }
    return 0;
  }

  function addCaloriesForMove(state, type) {
    if (!state) {
      return 0;
    }
    const calories = caloriesForMove(type);
    state.caloriesBurned = Math.round(((Number(state.caloriesBurned) || 0) + calories) * 10) / 10;
    return calories;
  }

  function markHit({
    arrayScore,
    calorieState = null,
    curMoves,
    index,
    now = Date.now(),
    playComboFeedback = () => {},
    random = Math.random
  }) {
    let hitSuccess = null;

    if (arrayScore[index] === 0) {
      if (hasComboBeforeHit(curMoves, index)) {
        const feedbackKey = comboFeedbackKey(random);
        if (feedbackKey) {
          playComboFeedback(feedbackKey);
        }
      }
      hitSuccess = now;
      addCaloriesForMove(calorieState, curMoves[index].type);
    }

    arrayScore[index] = 1;
    curMoves[index].hit = true;

    return { hitSuccess };
  }

  const api = {
    addCaloriesForMove,
    caloriesForMove,
    comboFeedbackKey,
    hasComboBeforeHit,
    markHit
  };

  root.TfitScore = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
