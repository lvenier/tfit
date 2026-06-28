(function(root) {
  const { storageJson, storageNumber } = root.TfitUtils;
  const { GAME_LENGTH, GAME_LEVEL, OPPONENTS, SHADOW_SPECIFIC, cloneOpponent } = root.TfitConfig;
  const opponentCount = Object.keys(OPPONENTS).length;

  const gameState = {
    arrayScore: [],
    curMoves: [],
    feet_position: 0,
    menuButtonAnimation: {
      active: false,
      button: null,
      duration: 18,
      frame: 0,
      height: 0,
      progress: 0,
      width: 0,
      x: 0,
      y: 0
    },
    gameCalibration: false,
    gameCurrentSeries: 1,
    gameDuration: 0,
    gameLength: null,
    gameLengthIndex: storageNumber("length", 2, { min: 1, max: Object.keys(GAME_LENGTH).length }),
    gameOver: false,
    gameReady: false,
    gameSeries: storageNumber("series", 1, { min: 1, max: 5 }),
    gameStarted: false,
    fightLadderActive: false,
    fightStage: 1,
    fightTransitionActive: false,
    fightTransitionText: null,
    fightVictoryCelebrationActive: false,
    fightVictoryCelebrationTime: 0,
    manualStop: false,
    gameTimer: -1,
    gameTimerNext: 0,
    gameTimerUpdatedAt: null,
    caloriesBurned: 0,
    level: storageNumber("level", 0, { min: 0, max: Object.keys(GAME_LEVEL).length - 1 }),
    menu: 0,
    moves: [],
    my_opponent: null,
    my_stamina: 0,
    opponent: storageNumber("opponent", 0, { min: 0, max: opponentCount - 1 }),
    pendingFightOpponentStamina: null,
    profileNameDraft: "",
    profileNameEditing: false,
    score: 0,
    score_max: 0,
    score_max_prev: 0,
    shadow_focus: storageNumber("shadow_focus", 0, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 }),
    song: {},
    song_result: {}
  };

  gameState.gameLength = GAME_LENGTH[gameState.gameLengthIndex.toString()];
  gameState.gameDuration = gameState.gameLength * 100;

  const animationState = {
    player: {
      delay: 0,
      frame: -1,
      type: 0
    },
    opponent: {
      delay: 0,
      frame: -1,
      type: 0
    }
  };

  gameState.my_opponent = cloneOpponent(gameState.opponent);

  const padState = {
    type: 1,
    x: undefined,
    y: undefined
  };

  const selectedPlayer = localStorage.getItem("selected_player") || "player";
  storageJson(selectedPlayer, {
    "caloriesBurned": 0,
    "gameCounts": {
      "fight": 0,
      "shadow": 0,
      "trainPad": 0
    },
    "lastCaloriesBurned": 0,
    "name": (Math.random() + 1).toString(36).substring(2),
    "score": 0,
    "scores": {}
  });

  const api = {
    animationState,
    gameState,
    padState
  };

  Object.assign(root, api);

  root.TfitState = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
