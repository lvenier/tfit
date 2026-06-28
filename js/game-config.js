(function(root) {
  const MENUTYPE = {
    "0": "main",
    "1": "settings",
    "2": "shadow",
    "3": "pad",
    "4": "fight"
  };

  const MODELS = ["MoveNet", "BlazePose"];

  const MOVE_TYPE = {
    "0": "None",
    "1": "LEFT_JAB",
    "2": "RIGHT_JAB",
    "3": "LEFT_HOOK",
    "4": "RIGHT_HOOK",
    "5": "LEFT_UPPERCUT",
    "6": "RIGHT_UPPERCUT",
    "7": "LEFT_DODGE",
    "8": "RIGHT_DODGE",
    "9": "DOWN_DODGE",
    "10": "SWITCH_GUARD"
  };

  const GAME_LEVEL = {
    "0": "easy",
    "1": "medium",
    "2": "hard"
  };

  const GAME_LENGTH = {
    "1": "30",
    "2": "60",
    "3": "120",
    "4": "180",
    "5": "300"
  };

  const SHADOW_SPECIFIC = {
    "0": "ALL",
    "1": "JAB",
    "2": "HOOK",
    "3": "UCUT",
    "4": "DODGE",
    "5": "PUNCHES"
  };

  const OPPONENTS = {
    "0": {
      "name": "Raja",
      "punchWaitFrames": 120,
      "renderer": "raja",
      "scale": 0.7,
      "xRatio": 0.5,
      "yRatio": 0.56,
      "stamina": 6,
      "recovery": 2,
      "blockChance": 0.16
    },
    "1": {
      "name": "Theo",
      "punchWaitFrames": 120,
      "renderer": "theo",
      "scale": 0.7,
      "xRatio": 0.5,
      "yRatio": 0.56,
      "stamina": 8,
      "recovery": 3,
      "blockChance": 0.24
    },
    "2": {
      "name": "Vehbo",
      "punchWaitFrames": 120,
      "renderer": "vehbo",
      "scale": 0.78,
      "xRatio": 0.5,
      "yRatio": 0.54,
      "stamina": 10,
      "recovery": 2,
      "blockChance": 0.32
    },
    "3": {
      "name": "Cyril",
      "punchWaitFrames": 110,
      "renderer": "cyril",
      "scale": 0.9,
      "xRatio": 0.5,
      "yRatio": 0.52,
      "stamina": 12,
      "recovery": 3,
      "blockChance": 0.4
    },
    "4": {
      "name": "Lav",
      "punchWaitFrames": 100,
      "renderer": "lav",
      "scale": 0.76,
      "xRatio": 0.5,
      "yRatio": 0.55,
      "stamina": 14,
      "recovery": 4,
      "blockChance": 0.48
    }
  };

  function cloneOpponent(id) {
    return root.TfitUtils.cloneFromMap(OPPONENTS, id, "0");
  }

  Object.assign(root, {
    MENUTYPE,
    MODELS,
    MOVE_TYPE,
    GAME_LEVEL,
    GAME_LENGTH,
    SHADOW_SPECIFIC,
    OPPONENTS,
    cloneOpponent
  });

  const api = {
    cloneOpponent,
    GAME_LENGTH,
    GAME_LEVEL,
    MENUTYPE,
    MODELS,
    MOVE_TYPE,
    OPPONENTS,
    SHADOW_SPECIFIC
  };

  root.TfitConfig = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
