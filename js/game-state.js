(function(root) {
  const { storageJson, storageNumber } = root.TfitUtils;
  const { GAME_LENGTH, GAME_LEVEL, SHADOW_SPECIFIC, cloneOpponent } = root.TfitConfig;

  const gameState = {
    arrayScore: [],
    curMoves: [],
    feet_position: 0,
    gameCalibration: false,
    gameCurrentSeries: 1,
    gameDuration: 0,
    gameLength: null,
    gameLengthIndex: storageNumber("length", 2, { min: 1, max: Object.keys(GAME_LENGTH).length }),
    gameOver: false,
    gameReady: false,
    gameSeries: storageNumber("series", 1, { min: 1, max: 5 }),
    gameStarted: false,
    gameTimer: -1,
    gameTimerNext: 0,
    level: storageNumber("level", 0, { min: 0, max: Object.keys(GAME_LEVEL).length - 1 }),
    menu: 0,
    moves: [],
    my_opponent: null,
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

  const opponent = 0;
  gameState.my_opponent = cloneOpponent(opponent);

  const padState = {
    type: 1,
    x: undefined,
    y: undefined
  };

  const stateBindings = {
    arrayScore: [gameState, "arrayScore"],
    curMoves: [gameState, "curMoves"],
    feet_position: [gameState, "feet_position"],
    gameCalibration: [gameState, "gameCalibration"],
    gameCurrentSeries: [gameState, "gameCurrentSeries"],
    gameDuration: [gameState, "gameDuration"],
    gameLength: [gameState, "gameLength"],
    gameLengthIndex: [gameState, "gameLengthIndex"],
    gameOver: [gameState, "gameOver"],
    gameReady: [gameState, "gameReady"],
    gameSeries: [gameState, "gameSeries"],
    gameStarted: [gameState, "gameStarted"],
    gameTimer: [gameState, "gameTimer"],
    gameTimerNext: [gameState, "gameTimerNext"],
    level: [gameState, "level"],
    menu: [gameState, "menu"],
    moves: [gameState, "moves"],
    my_opponent: [gameState, "my_opponent"],
    pad_type: [padState, "type"],
    pad_x: [padState, "x"],
    pad_y: [padState, "y"],
    punch_animation: [animationState.player, "frame"],
    punch_animation_delay: [animationState.player, "delay"],
    punch_animation_type: [animationState.player, "type"],
    puncho_animation: [animationState.opponent, "frame"],
    puncho_animation_delay: [animationState.opponent, "delay"],
    puncho_animation_type: [animationState.opponent, "type"],
    score: [gameState, "score"],
    score_max: [gameState, "score_max"],
    score_max_prev: [gameState, "score_max_prev"],
    shadow_focus: [gameState, "shadow_focus"],
    song: [gameState, "song"],
    song_result: [gameState, "song_result"]
  };

  for (const [name, [target, key]] of Object.entries(stateBindings)) {
    Object.defineProperty(root, name, {
      configurable: true,
      get() {
        return target[key];
      },
      set(value) {
        target[key] = value;
      }
    });
  }

  Object.defineProperty(root, "opponent", {
    configurable: true,
    get() {
      return opponent;
    }
  });

  const selectedPlayer = localStorage.getItem("selected_player") || "player";
  storageJson(selectedPlayer, {
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
