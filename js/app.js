p5.disableFriendlyErrors = true;

const {
  calibrationDefaults,
  countScoringMoves,
  createEmptySong,
  createSongMoves,
  detectStartCondition,
  isRecent,
  levelDelay,
  nextFrameRate,
  nextOneBasedIndex,
  nextZeroBasedIndex
} = globalThis.TfitGameLogic;

const {
  drawMessagePanel,
  renderBackButton,
  renderCalibrationOverlay,
  renderFeetIndicator,
  renderFightButton,
  renderFightMeters,
  renderGuardTargets,
  renderLoadingScreen,
  renderMainMenu,
  renderRoundHud,
  renderSceneBackground,
  renderSettingsControls,
  renderShadowResult,
  renderSpeech
} = globalThis.TfitRender;

document.addEventListener("contextmenu", event => event.preventDefault());

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .catch(() => {});
}

function positionCanvas() {
  if (!cnv) {return;}
  cnv.position(Math.max((window.innerWidth - myWindowWidth) / 2, 0), 0);
}

function resetCalibrationDefaults() {
  const defaults = calibrationDefaults(myWindowWidth, myWindowHeight, OBJECT_POSE_SIZE, coef);

  left_init_pose_x = defaults.left_init_pose_x;
  left_init_pose_y = defaults.left_init_pose_y;
  right_init_pose_x = defaults.right_init_pose_x;
  right_init_pose_y = defaults.right_init_pose_y;
  init_jab_y = defaults.init_jab_y;
  init_uppercut_y = defaults.init_uppercut_y;
  left_init_hook_x = defaults.left_init_hook_x;
  right_init_hook_x = defaults.right_init_hook_x;

  for (const [key, value] of Object.entries(defaults)) {
    localStorage.setItem(key, value);
  }
}

function gameResultBool() { 
  return isRecent(gameResult);
}

function loadSongmoves() {
  LEVEL = levelDelay(level);
  if (song) {
    gameDuration = gameLength * FRAME_RATE;
    if (song.moveLength === 0) {
      if (menu === 4) {shadow_focus = storageNumber("shadow_focus", shadow_focus, { min: 0, max: Object.keys(SHADOW_SPECIFIC).length - 1 });}
      song.moves = createSongMoves({ gameLength, level, menu, randomInteger, shadowFocus: shadow_focus });
    }
    moves = song.moves;
    score_max = countScoringMoves(moves);
  }
}

function fetchSong(_id = 1) {
  song = createEmptySong();
}

function punchSound() {
  if (punch_sound_time + 1000 < Date.now()) {
    punch_sound.play();
    punch_sound_time = Date.now();
  }
}

function letsfight() {
  click_sound.play();
  if (gameCalibration) {
    speechString = "Calibrating !";
    return;
  }
  if (gameStarted) {
    speechString = "Already fighting !";
    return;
  }
  feet_position = 0;
  left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
  right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  song_letsfight.play();
  gameStarted = true;
  gameResult = Date.now() - 5001;
  guard_warning = Date.now();
  my_opponent = cloneOpponent(opponent);
  curMoves = [];
  gameCalibration = false;
  hide_sensor = 0;
  gameTimer = 0;
  score = 0;
  arrayScore = [];
  loadSongmoves();
  score_max_prev = score_max;
}

function handleChange() {
  if (gameResultBool()) {return;}
  if (menu === 0) {
    if (mouseX < Math.trunc(myWindowWidth / 6) + 100 * coef && mouseX > Math.trunc(myWindowWidth / 6)) {
      if (mouseY < Math.trunc(myWindowHeight / 6 + 350 * coef) && mouseY > Math.trunc(myWindowHeight / 6 + 300 * coef)) {
          click_sound.play();
          menu = 1;
          return;
      }
      if (mouseY < Math.trunc(myWindowHeight / 6 + 50 * coef) && mouseY > Math.trunc(myWindowHeight / 6)) {
        click_sound.play();
        menu = 2;
        curMoves = [];
        loadSongmoves();
        return;
      }
      if (mouseY < Math.trunc(myWindowHeight / 6 + 150 * coef) && mouseY > Math.trunc(myWindowHeight / 6 + 100 * coef)) {
        click_sound.play();
        menu = 3;
        curMoves = [];
        loadSongmoves();
        return;
      }
      if (mouseY < Math.trunc(myWindowHeight / 6 + 250 * coef) && mouseY > Math.trunc(myWindowHeight / 6 + 200 * coef)) {
        click_sound.play();
        menu = 4;
        curMoves = [];
        loadSongmoves();
        my_opponent = cloneOpponent(opponent);
        return;
      }
    }
  }
  if ([2, 3, 4].includes(menu)) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (mouseY > myWindowHeight - 148 * coef && mouseY < myWindowHeight - 108 * coef) {
        letsfight();
        return;
      }
    }
  }
  if ([1].includes(menu) && !gameCalibration) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (mouseY > myWindowHeight - 148 * coef && mouseY < myWindowHeight - 108 * coef) {
        click_sound.play();
        FRAME_RATE = nextFrameRate(FRAME_RATE);
        localStorage.setItem("frame_rate", FRAME_RATE);
      }
      if (mouseY > myWindowHeight - 198 * coef && mouseY < myWindowHeight - 158 * coef) {
        click_sound.play();
        level = nextZeroBasedIndex(level, Object.keys(GAME_LEVEL).length);
        localStorage.setItem("level", level);
      }
      if (mouseY > myWindowHeight - 248 * coef && mouseY < myWindowHeight - 208 * coef) {
        click_sound.play();
        gameLengthIndex = nextOneBasedIndex(gameLengthIndex, Object.keys(GAME_LENGTH).length);
        localStorage.setItem("length", gameLengthIndex);
        gameLength = GAME_LENGTH[gameLengthIndex.toString()];
      }
      if (mouseY > myWindowHeight - 298 * coef && mouseY < myWindowHeight - 258 * coef) {
        click_sound.play();
        gameSeries = nextOneBasedIndex(gameSeries, 5);
        localStorage.setItem("series", gameSeries);
      }
    }
  }
  if ([1].includes(menu) && mouseY > myWindowHeight - 98 * coef && mouseY < myWindowHeight - 58 * coef) {
    if (mouseX > myWindowWidth / 2 - 40 * coef && mouseX < myWindowWidth / 2 + 60 * coef) {
      if (gameCalibration) {
        click_sound.play();
        globalThis.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'r',
            code: 'KeyR',
            bubbles: true
          }));
      } else {
        click_sound.play();
        gameCalibration = true;
        curMoves = [];
        hide_sensor = 64;
      }
      return;
    }
  }
  if (menu > 0) {
    if (mouseX > myWindowWidth - 100 * coef && mouseX < myWindowWidth && mouseY < Math.trunc(myWindowHeight - 10 * coef) && mouseY > Math.trunc(myWindowHeight - 60 * coef)) {
      click_sound.play();
      if (menu > 0 && !gameStarted && !gameCalibration) {
        menu = 0;
      } else if (menu > 0 && (gameStarted || gameCalibration)) {
        gameOver = true;
      } else {
        menu = 0;
      }
      return;
    }
  }
  if (gameCalibration) {
    if (mouseY < init_jab_y + 8) {
      init_jab_dragging = true;
    }
    if (mouseY > init_uppercut_y - 8) {
      init_uppercut_dragging = true;
    }
    if (mouseX < left_init_hook_x + 8) {
      left_init_hook_dragging = true;
    }
    if (mouseX > right_init_hook_x - 8) {
      right_init_hook_dragging = true;
    }
    if (mouseX > left_init_pose_x - OBJECT_POSE_SIZE / 2 && mouseX < left_init_pose_x + OBJECT_POSE_SIZE / 2 && mouseY > left_init_pose_y - 24 && mouseY < left_init_pose_y + 24) {
      left_init_pose_dragging = true;
    }
    if (mouseX > right_init_pose_x - OBJECT_POSE_SIZE / 2 && mouseX < right_init_pose_x + OBJECT_POSE_SIZE / 2 && mouseY > right_init_pose_y - 24 && mouseY < right_init_pose_y + 24) {
      right_init_pose_dragging = true;
    }
  }
}

function touchMoved() {
  handleChange();
}

function mousePressed() {
  handleChange();
}

function touchEnded() {
  if (gameCalibration) {
    init_uppercut_dragging = false;
    init_jab_dragging = false;
    left_init_hook_dragging = false;
    right_init_hook_dragging = false;
    right_init_pose_dragging = false;
    left_init_pose_dragging = false;
  }
}

function mouseReleased() {
  if (gameCalibration) {
    init_uppercut_dragging = false;
    init_jab_dragging = false;
    left_init_hook_dragging = false;
    right_init_hook_dragging = false;
    right_init_pose_dragging = false;
    left_init_pose_dragging = false;
  }
}

async function loadAssets() {
  for (const m of Object.keys(MENUTYPE)) {
    background_images[m] = await loadImage('assets/backgrounds/' + m + '.jpg');
  }
  logo_image = await loadImage('assets/logos/logo.512.rounded.png');
  menu_image = await loadImage('assets/images/menu_image.png');
  rfeet_image = await loadImage('assets/images/RFoot.png');
  lfeet_image = await loadImage('assets/images/LFoot.png');
  your_guard_image = await loadImage('assets/images/your_guard.png');
  fight_button_image = await loadImage('assets/images/fight.png');
  fight_menu_button_image = await loadImage('assets/images/fightmenu.png');
  config_menu_button_image = await loadImage('assets/images/config.png');
  shadow_button_image = await loadImage('assets/images/shadow.png');
  pad_button_image = await loadImage('assets/images/pad.png');
  calibrate_button_image = await loadImage('assets/images/calibrate.png');
  reset_button_image = await loadImage('assets/images/reset.png');
  back_button_image = await loadImage('assets/images/back.png');
  stop_button_image = await loadImage('assets/images/stop.png');
  keep_trying_image = await loadImage('assets/images/keep_trying.png');
  good_hit_image = await loadImage('assets/images/good_hit.png');
  for (let i = 0; i < 7; i++ ) {framerate_button_image[i] = await loadImage('assets/images/fr' + (i * 20) + '.png');}
  for (let i = 0; i < Object.keys(GAME_LEVEL).length; i++ ) {level_button_image[i] = await loadImage('assets/images/' + GAME_LEVEL[i.toString()] + '.png');}
  for (let i = 1; i <= Object.keys(GAME_LENGTH).length; i++ ) {duration_button_image[i] = await loadImage('assets/images/' + GAME_LENGTH[i.toString()] + '.png');}
  for (let i = 1; i <= 5; i++ ) {series_button_image[i]  = await loadImage('assets/images/s' + i + '.png');}

  me_image = await loadImage('assets/images/boxers/0-me.png');
  me_images[0] = [];
  me_images[1] = [];
  for (let j = 1; j < 7; j++) {
    me_images[j] = [];
    for (let i = 0; i < 7; i++) {
      me_images[j][i] = await loadImage('assets/images/boxers/' + j + '-me-' + i + '.png');
    }
  }

  opponent_image[0] = await loadImage('assets/images/opponents/0/0-1.png');
  opponents_images[0] = [];
  opponents_images[1] = [];
  for (let j = 1; j <= 6; j++) {
    opponents_images[j] = [];
    for (let i = 0; i < 7; i++) {
      opponents_images[j][i] = await loadImage('assets/images/opponents/0/' + j + '-' + i + '.png');
    }
  }

  click_sound = await loadSound('assets/sounds/click.mp3');
  punch_sound = await loadSound('assets/sounds/punch.mp3');
  song_letsfight = await loadSound('assets/sounds/letsfight.mp3');
  song_your_guard = await loadSound('assets/sounds/your_guard.mp3');
  song_keep_trying = await loadSound('assets/sounds/keep_trying.mp3');
  song_well_done = await loadSound('assets/sounds/well_done.mp3');
  song_great = await loadSound('assets/sounds/great.mp3');
  song_awesome = await loadSound('assets/sounds/awesome.mp3');
  song_good = await loadSound('assets/sounds/good.mp3');
  song_perfect = await loadSound('assets/sounds/perfect.mp3');
  song_continue = await loadSound('assets/sounds/continue.mp3');
  song_thats_it = await loadSound('assets/sounds/thats_it.mp3');

}

function keyPressed() {
  if (gameResultBool()) {return;}
  if (['b', 'B'].includes(key) && [1, 2, 3, 4].includes(menu)) {
    if (!gameStarted) {
      menu = 0;
    }
  }
  if (['s', 'S'].includes(key) && [1].includes(menu)) {
    if (gameCalibration) {
      gameCalibration = false;
      menu = 1;
    } else {
      gameSeries = nextOneBasedIndex(gameSeries, 5);
      localStorage.setItem("series", gameSeries);
    }
  }
  if (['t', 'T'].includes(key) && [2].includes(menu)) {
    if (!gameStarted) {
      shadow_focus = nextZeroBasedIndex(shadow_focus, Object.keys(SHADOW_SPECIFIC).length);
      localStorage.setItem("shadow_focus", shadow_focus);
      loadSongmoves();
    }
  }
  if (['l', 'L'].includes(key) && [1].includes(menu)) {
    level = nextZeroBasedIndex(level, Object.keys(GAME_LEVEL).length);
    localStorage.setItem("level", level);
  }
  if (['d', 'D'].includes(key) && [1].includes(menu)) {
    gameLengthIndex = nextOneBasedIndex(gameLengthIndex, Object.keys(GAME_LENGTH).length);
    localStorage.setItem("length", gameLengthIndex);
    gameLength = GAME_LENGTH[gameLengthIndex.toString()];
  }
  if (['c', 'C'].includes(key) && menu === 1) {
      gameCalibration = true;
      hide_sensor = 64;
  }
  if (['c', 'C'].includes(key) && menu === 0) {
    menu = 1;
  }
  if (['s', 'S'].includes(key) && menu === 0) {
    loadSongmoves();
    menu = 2;
  }
  if (['s', 'S'].includes(key) && menu > 1) {
    gameOver = true;
  }
  if (['p', 'P'].includes(key) && menu === 0) {
    loadSongmoves();
    menu = 3;
  }
  if (['i', 'I'].includes(key) && menu === 0) {
    loadSongmoves();
    menu = 4;
  }
  if (['r', 'R'].includes(key) && [1].includes(menu) && gameCalibration) {
    resetCalibrationDefaults();
  }
  if (['f', 'F'].includes(key) && [1].includes(menu)) {
    FRAME_RATE = nextFrameRate(FRAME_RATE);
    localStorage.setItem("frame_rate", FRAME_RATE);
  }
  if (['f', 'F'].includes(key) && [2, 3, 4].includes(menu)) {
    letsfight();
  }
}

function switch_feet() {
  feet_position = 1;
  left_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
  right_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
}

function hitSuccess(c) {
  if (arrayScore[c] === 0) {
    if (c >= 3) {
      let s = 0;
      for (let k = 1; k < c - 2; k++) {
        if (s > 1) {break;}
        if (curMoves[c - k].type === 0) {continue;}
        if (curMoves[c - k].hit === false) {break;}
        s++;
      }
      if (s > 1) {
        const r = Math.floor(Math.random() * 20);
        if (r === 0 || r === 1) {song_great.play();}
        if (r === 2 || r === 3) {song_awesome.play();}
        if (r === 4 || r === 5) {song_good.play();}
        if (r === 6 || r === 7) {song_perfect.play();}
        if (r === 8 || r === 9) {song_continue.play();}
        if (r === 10 || r === 11) {song_thats_it.play();}
        if (r === 12 || r === 13) {song_well_done.play();}
      }
    }
    hit_success = Date.now();
  }
  arrayScore[c] = 1;
  curMoves[c].hit = true;
}

function handleRightClick(e) {
  e.preventDefault();
  if (gameStarted) {
    return globalThis.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      code: 'KeyS',
      bubbles: true
    }));
  }
  return globalThis.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'b',
      code: 'KeyB',
      bubbles: true
  }));
}

async function setup() {
  await loadAssets();
  frameRate(60);
  angleMode(DEGREES);

  cnv = createCanvas(myWindowWidth, myWindowHeight);
  cnv.elt.addEventListener("contextmenu", handleRightClick);
  positionCanvas();
  fetchSong(1);

  try {
    video = createCapture(VIDEO, { flipped: true });
  } catch {
    error = "Camera access is not available in this browser.";
    return;
  }

  video.hide();

  bodyPose = await ml5.bodyPose(MODELS[poseModelIndex], {
    modelUrl: "js/ml5js/model.json",
    flipped: true
  });

  bodyPose.detectStart(video, gotPoses);
  isDetecting = true;
}

function draw() {
  if (innerWidth < innerHeight) {return;}
  background(0);
  if (error.length > 0) {
    drawMessagePanel("Camera unavailable", error);
    return;
  }
  if (!checkStartCondition()) {
    renderLoadingScreen();
    return;
  }
  renderSceneBackground();
  if (menu === 0) {
    if (isDetecting === true) {
      bodyPose.detectStop();
      isDetecting = false;
    }
    gameResult = Date.now() - 5001;
    renderMainMenu();
  } else {
    if ((menu === 2 || menu === 3 || menu === 4 || menu === 1) && !gameStarted && !gameResultBool()) {
      renderBackButton();
    }
  }

  if (menu === 1) {
    if (gameOver) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
      gameCalibration = false;
      gameOver = false;
    }
    if (gameCalibration) {
      renderGuardTargets();
      fill(255, 0, 0, hide_sensor);
      gameResult = Date.now() - 5001;
      if (isDetecting === false) {
        bodyPose.detectStart(video, gotPoses);
        isDetecting = true;
      }

      if (poses.length > 0) {
        pose = poses[0];
        leftHand = pose["left_wrist"];
        rightHand = pose["right_wrist"];
        nose = pose["nose"];
        if (nose && nose.confidence > 0.1 && isDetecting) {
          fill(0, 255, 0, 128);
          circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
          fill(255, 255, 255, hide_sensor);
        }
      }

      image(stop_button_image, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      image(reset_button_image, myWindowWidth / 2 - 50 * coef, myWindowHeight - 100 * coef, 120 * coef, 60 * coef);
      if (right_init_pose_dragging) {
        right_init_pose_x = mouseX;
        right_init_pose_y = mouseY;
        localStorage.setItem("right_init_pose_x", right_init_pose_x);
        localStorage.setItem("right_init_pose_y", right_init_pose_y);
      }
      if (left_init_pose_dragging) {
        left_init_pose_x = mouseX;
        left_init_pose_y = mouseY;
        localStorage.setItem("left_init_pose_x", left_init_pose_x);
        localStorage.setItem("left_init_pose_y", left_init_pose_y);
      }
      if (init_jab_dragging) {
        init_jab_y = mouseY;
        localStorage.setItem("init_jab_y", init_jab_y);
      }
      if (init_uppercut_dragging) {
        init_uppercut_y = mouseY;
        localStorage.setItem("init_uppercut_y", init_uppercut_y);
      }
      if (left_init_hook_dragging) {
        left_init_hook_x = mouseX;
        localStorage.setItem("left_init_hook_x", left_init_hook_x);
      }
      if (right_init_hook_dragging) {
        right_init_hook_x = mouseX;
        localStorage.setItem("right_init_hook_x", right_init_hook_x);
      }
      renderCalibrationOverlay();
    } else {
      renderSettingsControls();
    }
  }

  if (menu > 1) {
    renderGuardTargets();
    fill(255, 255, 255, 192);
    if (gameDuration - gameTimer <= 0) {
      gameOver = true;
    }
    if (gameOver) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
      gameCalibration = false;
      my_opponent = cloneOpponent(opponent);
      gameStarted = false;
      hide_sensor = 0;
      gameTimer = -1;
      gameOver = false;
      if (curMoves.length > 0 && score > 0) {gameResult = Date.now();}
      if (gameCurrentSeries < gameSeries) {
        setTimeout(() => {
          letsfight();
        }, 5100);
        gameCurrentSeries++;
      } else {gameCurrentSeries = 1;}
      feet_position = 0;
      left_init_pose_y = storageNumber("left_init_pose_y", myWindowHeight / 3);
      right_init_pose_y = storageNumber("right_init_pose_y", myWindowHeight / 3);
    }

    if (speechString) {
      renderSpeech();
      speechString = null;
    }

    if (!gameStarted && !gameCalibration && !gameResultBool()) {
      renderFightButton();
    }
    textSize(7 * coef);
    fill(255, 0, 0, hide_sensor);

    textSize(15 * coef);
    fill(255, 255, 255, 255);
    score = 0;
    if (gameStarted) {
      if (isDetecting === false) {
        bodyPose.detectStart(video, gotPoses);
        isDetecting = true;
      } 
      for (const element of arrayScore) {
        score += element;
      }
    }
    renderRoundHud(score);

    if (!gameCalibration && !gameStarted) {
      if (isDetecting === true) {
        bodyPose.detectStop();
        isDetecting = false;
      }
    }

    if (gameTimer === 0) {
      curMoves = [];
      gameTimerNext = 0;
      arrayScore = Array(moves.length).fill(0);
    }

    if (gameStarted) {
      image(stop_button_image, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
      fill(255, 0, 0, hide_sensor);
      if (Date.now() - hit_success < 1000) {
        image(good_hit_image, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
      }
      if (Date.now() - hit_success > 3000 && Date.now() - hit_success < 4000 && guard_warning - Date.now() < 2000 && Math.ceil((gameDuration - gameTimer) / FRAME_RATE) > 5) {
        if (curMoves.length > 3 && curMoves.at(-1).hit === false && curMoves.at(-2).hit === false && curMoves.at(-3).hit === false) {
          image(keep_trying_image, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
          if (Date.now() - hit_success < 3019) {
            song_keep_trying.play();
          }
        }
      }
      if ((Date.now() - left_poses > 2000 || Date.now() - right_poses > 2000) && Math.ceil((gameDuration - gameTimer) / FRAME_RATE) > 5 && gameTimer > 100) {
        guard_warning += 100;
        if (guard_warning - Date.now() > 1000) {
          if (guard_warning - Date.now() < 1089) {
            song_your_guard.play();
          }
          if (guard_warning - Date.now() < 3000) {
            image(your_guard_image, myWindowWidth / 2 - 2.5 * OBJECT_POSE_SIZE, myWindowHeight / 5, 5 * OBJECT_POSE_SIZE);
          }
        }
        if (guard_warning - Date.now() > 10000) {
          guard_warning = Date.now();
        }
      } else {
        guard_warning = Date.now();
      }
    }
  }

  if (menu === 4) {
    shadow_focus = 0;
    renderFightMeters();
    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
        if (nose.x * coef > right_init_pose_x + OBJECT_POSE_SIZE / 2) {
          right_dodge = Date.now();
        }
        if (nose.x * coef < left_init_pose_x - OBJECT_POSE_SIZE / 2) {
          left_dodge = Date.now();
        }
      }
      if (leftHand && leftHand.confidence > 0.1) {
        if (leftHand.x * coef < left_init_pose_x + OBJECT_POSE_SIZE && leftHand.x * coef > left_init_pose_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < left_init_pose_y && leftHand.y * coef + OBJECT_POSE_SIZE > left_init_pose_y) {
          left_poses = Date.now();
          left_hook = Date.now() - LEVEL * 10;
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (leftHand.y * coef > init_uppercut_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            left_uppercut = Date.now();
          }
        }
        if (leftHand.y * coef < init_jab_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            left_jab = Date.now();
          }
        }
        if (leftHand.x * coef < left_init_hook_x) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            left_hook = Date.now();
          }
        }
      }
      if (rightHand && rightHand.confidence > 0.1) {
        if (rightHand.x * coef < right_init_pose_x + OBJECT_POSE_SIZE && rightHand.x * coef > right_init_pose_x - OBJECT_POSE_SIZE && rightHand.y * coef < right_init_pose_y + OBJECT_POSE_SIZE && rightHand.y * coef > right_init_pose_y - OBJECT_POSE_SIZE) {
          right_poses = Date.now();
          right_hook = Date.now() - LEVEL * 10;
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (rightHand.y * coef > init_uppercut_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_uppercut = Date.now();
          }
        }
        if (rightHand.y * coef < init_jab_y) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_jab = Date.now();
          }
        }
        if (rightHand.x * coef > right_init_hook_x) {
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_hook = Date.now();
          }
        }
      }
      if (Date.now() - right_dodge < LEVEL * 10 && right_dodge - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 1;
        punch_animation = 0;
        punch_animation_delay = 0;
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - left_dodge < LEVEL * 10 && left_dodge - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 2;
        punch_animation = 0;
        punch_animation_delay = 0;
      }
      if (Date.now() - left_uppercut < LEVEL * 10 && left_uppercut - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 5;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves.at(-1) && curMoves.at(-1).type === 5) {my_opponent.stamina--;}
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - left_jab < LEVEL * 10 && left_jab - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 1;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves.at(-1) && curMoves.at(-1).type === 1) {my_opponent.stamina--;}
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - left_hook < LEVEL * 10 && left_hook - left_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 3;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves.at(-1) && curMoves.at(-1).type === 3) {my_opponent.stamina--;}
        left_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - right_uppercut < LEVEL * 10 && right_uppercut - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 6;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves.at(-1) && curMoves.at(-1).type === 6) {my_opponent.stamina--;}
        right_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - right_jab < LEVEL * 10 && right_jab - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 2;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves.at(-1) && curMoves.at(-1).type === 2) {my_opponent.stamina--;}
        right_poses = Date.now() - LEVEL * 10;
      }
      if (Date.now() - right_hook < LEVEL * 10 && right_hook - right_poses < LEVEL * 10 && gameStarted && punch_animation === -1) {
        punch_animation_type = 4;
        punch_animation = 0;
        punch_animation_delay = 0;
        if (curMoves.length > 0 && 'type' in curMoves.at(-1) && curMoves.at(-1).type === 4) {my_opponent.stamina--;}
        right_poses = Date.now() - LEVEL * 10;
      }
      if (gameStarted) {
        if (gameTimerNext < Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))) {
          if (moves.length >= Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2)) && moves[Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))] >= 0) {
            curMoves.push({
              "hit": false,
              "type": curMoves.length < 4 ? 0 : Math.trunc(moves[Math.ceil(gameTimer / (FRAME_RATE + LEVEL / 2))]),
              "x": 0,
              "y": 0
            })
          }
          gameTimerNext++;
        }
        const c = curMoves.length - 1;
        if (curMoves.length > 0 && 'type' in curMoves[c] && curMoves[c].type !== 0) {
          if (curMoves[c].type === 1 || curMoves[c].type === 2) {
            fill(100, 100, 0);
          } else if (curMoves[c].type === 3 || curMoves[c].type === 4) {
            fill(100, 0, 100);
          } else if (curMoves[c].type === 5 || curMoves[c].type === 6) {
            fill(0, 100, 100);
          } else if (curMoves[c].type === 7 || curMoves[c].type === 8) {
            fill(0, 0, 100);
          } else if (curMoves[c].type === 9) {
            fill(0, 0, 200);
          }
          if ([1,2].includes(curMoves[c].type)) {circle(myWindowWidth / 2, myWindowHeight / 5, OBJECT_POSE_SIZE);}
          else if (curMoves[c].type === 3) {quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 4) {quad(myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 5) {quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2)}
          else if (curMoves[c].type === 6) {quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 6, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2)}
          else if (curMoves[c].type === 7) {quad(myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 8) {quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 + OBJECT_POSE_SIZE / 6, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 9) {quad(myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 2, myWindowHeight / 5 - OBJECT_POSE_SIZE / 2, myWindowWidth / 2 + OBJECT_POSE_SIZE / 6, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2, myWindowWidth / 2 - OBJECT_POSE_SIZE / 6, myWindowHeight / 5 + OBJECT_POSE_SIZE / 2)}
          textSize(10 * coef);
          fill(255, 255, 255, 255);
          text(MOVE_TYPE[curMoves[c].type], myWindowWidth / 2 - coef * MOVE_TYPE[curMoves[c].type].length * 3, myWindowHeight / 5);
          tint(255, 224);
          if (curMoves[c].hit === false) {
            if (gameStarted && puncho_animation === -1 && curMoves[c].hit === false) {
              if (curMoves[c].type >= 7) {puncho_animation_type = randomInteger(1,2);}
              else {puncho_animation_type = curMoves[c].type;}
              puncho_animation = 0;
              puncho_animation_delay = 0;
            }
            if (puncho_animation >= 0 && curMoves[c].hit === false) {
              image(opponents_images[puncho_animation_type][puncho_animation], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
              if (puncho_animation_delay % 3 === 0) {
                if (puncho_animation >= 6) {
                  puncho_animation = -1;
                  puncho_animation_delay = 0;
                  curMoves[c].hit = true;
                } else {
                  puncho_animation++;
                }
              }
              puncho_animation_delay++;
            }
          } else {
            image(opponent_image[opponent], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
          }
          tint(255, 192);
        } else {
          tint(255, 224);
          image(opponent_image[opponent], myWindowWidth / 3, myWindowHeight / 4, myWindowWidth / 3, myWindowHeight / 2);
          tint(255, 192);
        }
        if (punch_animation >= 0) {
          image(me_images[punch_animation_type][punch_animation], myWindowWidth / 3.5, myWindowHeight / 2, myWindowWidth / 2.2, myWindowHeight / 2);
          if (punch_animation_delay % 3 === 0) {
            if (punch_animation >= 6) {
              punch_animation = -1;
              punch_animation_delay = 0;
            } else {punch_animation++;}
          }
          punch_animation_delay++;
        } else {image(me_image, myWindowWidth / 3.5, myWindowHeight / 2, myWindowWidth / 2.2, myWindowHeight / 2);}
        tint(255, 255);
        gameTimer++;
      }
    }
  }

  if (menu === 3) {
    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1 && isDetecting) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (leftHand && leftHand.confidence > 0.1) {
        if (leftHand.x * coef < left_init_pose_x + OBJECT_POSE_SIZE && leftHand.x * coef > left_init_pose_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < left_init_pose_y && leftHand.y * coef + OBJECT_POSE_SIZE > left_init_pose_y) {
          left_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (rightHand && rightHand.confidence > 0.1) {
        if (rightHand.x * coef < right_init_pose_x + OBJECT_POSE_SIZE && rightHand.x * coef > right_init_pose_x - OBJECT_POSE_SIZE && rightHand.y * coef < right_init_pose_y + OBJECT_POSE_SIZE && rightHand.y * coef > right_init_pose_y - OBJECT_POSE_SIZE) {
          right_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
        }
        fill(255, 0, 0, 128);
        circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
      }
      if (gameStarted) {
        textSize(20 * coef);
        textAlign(CENTER,CENTER);
        textStyle(BOLD);
        if (gameTimer === 0) {
          pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
          pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
          pad_type = 1;
          curMoves = [];
          if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
            {pad_type = 2;}
          curMoves.push({
            "hit": false,
            "type": pad_type,
            "x": pad_x,
            "y": pad_y
          })
        }
        fill(100, 100, 0, 255);
        if (pad_type === 1) {circle(pad_x, pad_y, OBJECT_POSE_SIZE);}
        fill(0, 0, 100, 255);
        if (pad_type === 2) {rect(OBJECT_POSE_SIZE, init_uppercut_y - OBJECT_POSE_SIZE / 2, myWindowWidth - 2 * OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, 20);}
        fill(255, 255, 255, 192);
        if (pad_type === 1) {
          if (pad_x < myWindowWidth / 2) {
            text("L", pad_x, pad_y);
            if (leftHand && leftHand.confidence > 0.1 && leftHand.x * coef < pad_x + OBJECT_POSE_SIZE && leftHand.x * coef > pad_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < pad_y && leftHand.y * coef + OBJECT_POSE_SIZE > pad_y && Date.now() - left_poses < LEVEL * 10) {
              pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
              pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
              pad_type = 1;
              if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
                {pad_type = 2;}
              left_poses = Date.now() - LEVEL * 10;
              hitSuccess(curMoves.length - 1);
              curMoves.push({
                "hit": false,
                "type": pad_type,
                "x": pad_x,
                "y": pad_y
              })
            }
          } else {
            text("R", pad_x, pad_y);
            if (rightHand && rightHand.confidence > 0.1 && rightHand.x * coef < pad_x + OBJECT_POSE_SIZE && rightHand.x * coef > pad_x - OBJECT_POSE_SIZE && rightHand.y * coef - OBJECT_POSE_SIZE < pad_y && rightHand.y * coef + OBJECT_POSE_SIZE > pad_y && Date.now() - right_poses < LEVEL * 10) {
              pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
              pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
              pad_type = 1;
              if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) || (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) || (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
                {pad_type = 2;}
              right_poses = Date.now() - LEVEL * 10;
              hitSuccess(curMoves.length - 1);
              curMoves.push({
                "hit": false,
                "type": pad_type,
                "x": pad_x,
                "y": pad_y
              })
            }
          }
        } else if (pad_type === 2) {
          text("D", myWindowWidth / 2, init_uppercut_y);
          if (nose && nose.confidence > 0.1 && nose.y * coef > init_uppercut_y) {
            down_dodge = Date.now();
            down_dodge_done = true;
            down_dodge_switch = false;
          }
          if (nose && nose.confidence > 0.1 && nose.y * coef < init_uppercut_y) {
            if (down_dodge_done === true) {
              down_dodge_done = false;
              down_dodge_switch = true;
            }
          }
          if (Date.now() - down_dodge < LEVEL * 10 && down_dodge_switch === true) {
            down_dodge = Date.now() - LEVEL * 10;
            down_dodge_switch = false;
            down_dodge_done = false;
            pad_x = randomInteger(2 * OBJECT_POSE_SIZE, myWindowWidth - 2 * OBJECT_POSE_SIZE);
            pad_y = randomInteger(2 * OBJECT_POSE_SIZE, myWindowHeight - 2 * OBJECT_POSE_SIZE);
            pad_type = 1;
            if ((pad_x < right_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > right_init_pose_x - 2 * OBJECT_POSE_SIZE) && (pad_y < right_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > right_init_pose_y - 2 * OBJECT_POSE_SIZE) && (pad_x < left_init_pose_x + 2 * OBJECT_POSE_SIZE && pad_x > left_init_pose_x - 2 * OBJECT_POSE_SIZE) && (pad_y < left_init_pose_y + 2 * OBJECT_POSE_SIZE && pad_y > left_init_pose_y - 2 * OBJECT_POSE_SIZE))
              {pad_type = 2;}
            hitSuccess(curMoves.length - 1);
            curMoves.push({
              "hit": false,
              "type": pad_type,
              "x": pad_x,
              "y": pad_y
            })
          }
        }
        textSize(10 * coef);
        textAlign(LEFT,CENTER);
        textStyle(NORMAL);
        gameTimer++;
      }
    }
  }

  if (menu === 2) {
    renderFeetIndicator();
    if (gameResultBool() && curMoves.length > 0) {
      renderShadowResult();
      return;
    }

    if (gameStarted) {
      if (gameTimerNext < Math.ceil(gameTimer / FRAME_RATE)) {
        if (moves.length >= Math.ceil(gameTimer / FRAME_RATE) && moves[Math.ceil(gameTimer / FRAME_RATE)] >= 0) {
          let xt = Math.trunc(moves[Math.ceil(gameTimer / FRAME_RATE)]) % 2 ? left_init_pose_x : right_init_pose_x;
          if (moves[Math.ceil(gameTimer / FRAME_RATE)] === 10) {xt = left_init_pose_x;}
          curMoves.push({
            "hit": moves[Math.ceil(gameTimer / FRAME_RATE)] === 0,
            "type": Math.trunc(moves[Math.ceil(gameTimer / FRAME_RATE)]),
            "x": xt,
            "y": myWindowHeight
          })
        }
        gameTimerNext++;
      }
      for (let c = 0; c < curMoves.length; c++) {
        curMoves[c].y = curMoves[c].y - Math.ceil(240 / FRAME_RATE);
        let alpha = 128;
        if ([10].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
          alpha = 255;
          if (Date.now() - switch_guard > 10000 && curMoves[c].type === 10) {
            switch_guard = Date.now();
            switch_feet();
          }
        }
        if ([1, 3, 5, 7].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > left_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < left_init_pose_y) {
          alpha = 255;
          if (Date.now() - left_jab < LEVEL * 10 && left_jab - left_poses < LEVEL * 10 && curMoves[c].type === 1) {
            hitSuccess(c);
          }
          if (Date.now() - left_hook < LEVEL * 10 && left_hook - left_poses < LEVEL * 10 && curMoves[c].type === 3) {
            hitSuccess(c);
          }
          if (Date.now() - left_uppercut < LEVEL * 10 && left_uppercut - left_poses < LEVEL * 10 && curMoves[c].type === 5) {
            hitSuccess(c);
          }
          if (Date.now() - left_dodge < LEVEL * 10 && left_dodge - left_poses < LEVEL * 10 && curMoves[c].type === 7) {
            hitSuccess(c);
          }
        }
        if ([2, 4, 6, 8, 9].includes(curMoves[c].type) && curMoves[c].y + OBJECT_POSE_SIZE > right_init_pose_y && curMoves[c].y - OBJECT_POSE_SIZE < right_init_pose_y) {
          alpha = 255;
          if (Date.now() - right_jab < LEVEL * 10 && right_jab - right_poses < LEVEL * 10 && curMoves[c].type === 2) {
            hitSuccess(c);
          }
          if (Date.now() - right_hook < LEVEL * 10 && right_hook - right_poses < LEVEL * 10 && curMoves[c].type === 4) {
            hitSuccess(c);
          }
          if (Date.now() - right_uppercut < LEVEL * 10 && right_uppercut - right_poses < LEVEL * 10 && curMoves[c].type === 6) {
            hitSuccess(c);
          }
          if (Date.now() - right_dodge < LEVEL * 10 && right_dodge - right_poses < LEVEL * 10 && curMoves[c].type === 8) {
            hitSuccess(c);
          }
          if (Date.now() - down_dodge < LEVEL * 10 && curMoves[c].type === 9) {
            hitSuccess(c);
          }
        }
        if (curMoves[c].type === 1 || curMoves[c].type === 2) {
          fill(100, 100, 0, alpha);
          if (feet_position === 1 && curMoves[c].type === 1) {curMoves[c].text = "S";}
          if (feet_position === 1 && curMoves[c].type === 2) {curMoves[c].text = "J";}
          if (feet_position === 0 && curMoves[c].type === 1) {curMoves[c].text = "J";}
          if (feet_position === 0 && curMoves[c].type === 2) {curMoves[c].text = "S";}
        } else if (curMoves[c].type === 3 || curMoves[c].type === 4) {
          fill(100, 0, 100, alpha);
          curMoves[c].text = "H";
        } else if (curMoves[c].type === 5 || curMoves[c].type === 6) {
          fill(0, 100, 100, alpha);
          curMoves[c].text = "U";
        } else if (curMoves[c].type === 7 || curMoves[c].type === 8) {
          fill(0, 0, 100, alpha);
          curMoves[c].text = "D";
        } else if (curMoves[c].type === 9) {
          fill(0, 0, 200, alpha);
          curMoves[c].text = "D";
        } else if (curMoves[c].type === 10) {
          fill(224, 224, 224, alpha);
          curMoves[c].text = "S";
        }
        if (curMoves[c].hit === true) {fill(0, 255, 0, 127);}
        if (curMoves[c].type > 0) {
          if (curMoves[c].type === 3) {quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 4) {quad(curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 5) {quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2)}
          else if (curMoves[c].type === 6) {quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 6, curMoves[c].y - OBJECT_POSE_SIZE / 2)}
          else if (curMoves[c].type === 7) {quad(curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 8) {quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y + OBJECT_POSE_SIZE / 6, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 6)}
          else if (curMoves[c].type === 9) {
            quad(curMoves[c].x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, curMoves[c].x + OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2, curMoves[c].x - OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2)
            quad(right_init_pose_x - OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, right_init_pose_x + OBJECT_POSE_SIZE / 2, curMoves[c].y - OBJECT_POSE_SIZE / 2, right_init_pose_x + OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2, right_init_pose_x - OBJECT_POSE_SIZE / 6, curMoves[c].y + OBJECT_POSE_SIZE / 2)
          } else {circle(curMoves[c].x, curMoves[c].y, OBJECT_POSE_SIZE);}
        }
        if ([10].includes(curMoves[c].type)) {circle(right_init_pose_x, curMoves[c].y, OBJECT_POSE_SIZE);}
        fill(255, 255, 255, 255);
        textSize(20 * coef);
        textStyle(BOLD);
        textAlign(CENTER,CENTER);
        if (curMoves[c].type > 0) {text(curMoves[c].text, curMoves[c].x, curMoves[c].y);}
        if ([9, 10].includes(curMoves[c].type)) {text(curMoves[c].text, right_init_pose_x, curMoves[c].y);}
        textAlign(LEFT,CENTER);
        textStyle(NORMAL);
      }
      gameTimer++;
    }

    if (poses.length > 0) {
      pose = poses[0];
      leftHand = pose["left_wrist"];
      rightHand = pose["right_wrist"];
      nose = pose["nose"];
      if (nose && nose.confidence > 0.1 && isDetecting) {
        fill(0, 255, 0, 128);
        circle(nose.x * coef, nose.y * coef, OBJECT_POSE_SIZE / 8);
        fill(255, 255, 255, hide_sensor);
      }
      if (leftHand && leftHand.confidence > 0.1) {
        if (leftHand.x * coef < left_init_pose_x + OBJECT_POSE_SIZE && leftHand.x * coef > left_init_pose_x - OBJECT_POSE_SIZE && leftHand.y * coef - OBJECT_POSE_SIZE < left_init_pose_y && leftHand.y * coef + OBJECT_POSE_SIZE > left_init_pose_y) {
          left_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(left_init_pose_x, left_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted ) {
            if (Date.now() - left_hook < LEVEL * 10) {
              punchSound();
            }
            if (Date.now() - left_uppercut < LEVEL * 10) {
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        circle(leftHand.x * coef, leftHand.y * coef, OBJECT_POSE_SIZE / 2);
        fill(255, 255, 255, hide_sensor);
        if (leftHand.x * coef < left_init_hook_x) {
          left_hook = Date.now();
          rect(0, 0, left_init_hook_x, myWindowHeight);
        }
        if (leftHand.y * coef > init_uppercut_y) {
          left_uppercut = Date.now();
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (leftHand.y * coef < init_jab_y) {
          fill(255, 255, 255, hide_sensor);
          rect(0, 0, myWindowWidth, init_jab_y);
          if (Date.now() - left_poses < LEVEL * 10 && Date.now() - right_poses < LEVEL * 10) {
            left_jab = Date.now();
            if (gameStarted) {punchSound();}
          }
        }
        if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
          if (nose.x * coef < left_init_pose_x - OBJECT_POSE_SIZE / 2) {
            left_dodge = Date.now();
          }
          if (nose.x * coef > right_init_pose_x + OBJECT_POSE_SIZE / 2) {
            right_dodge = Date.now();
          }
          if (nose.y * coef > init_uppercut_y) {
            down_dodge = Date.now();
          }
        }
      }
      if (rightHand && rightHand.confidence > 0.1) {
        if (rightHand.x * coef < right_init_pose_x + OBJECT_POSE_SIZE && rightHand.x * coef > right_init_pose_x - OBJECT_POSE_SIZE && rightHand.y * coef < right_init_pose_y + OBJECT_POSE_SIZE && rightHand.y * coef > right_init_pose_y - OBJECT_POSE_SIZE) {
          right_poses = Date.now();
          fill(255, 255, 255, 128);
          circle(right_init_pose_x, right_init_pose_y, OBJECT_POSE_SIZE);
          if (gameStarted || gameCalibration) {
            if (Date.now() - right_hook < LEVEL * 10) {
              punchSound();
            }
            if (Date.now() - right_uppercut < LEVEL * 10) {
              punchSound();
            }
          }
        }
        fill(255, 0, 0, 128);
        if (isDetecting) {circle(rightHand.x * coef, rightHand.y * coef, OBJECT_POSE_SIZE / 2);}
        fill(255, 255, 255, hide_sensor);
        if (rightHand.x * coef > right_init_hook_x) {
          right_hook = Date.now();
          rect(right_init_hook_x, 0, right_init_hook_x, myWindowHeight);
        }
        if (rightHand.y * coef > init_uppercut_y) {
          right_uppercut = Date.now();
          rect(0, init_uppercut_y, myWindowWidth, myWindowHeight - init_uppercut_y);
        }
        if (rightHand.y * coef < init_jab_y) {
          rect(0, 0, myWindowWidth, init_jab_y);
          if (Date.now() - right_poses < LEVEL * 10 && Date.now() - left_poses < LEVEL * 10) {
            right_jab = Date.now();
            if (gameStarted) {punchSound();}
          }
        }
      }
    }
  }
}

function windowResized() {
  coef = Math.max(0.5, 0.05 * (Math.floor(Math.min(window.innerWidth / 32, window.innerHeight / 24))));
  myWindowWidth = coef * 640;
  myWindowHeight = coef * 480;
  resizeCanvas(myWindowWidth, myWindowHeight);
  OBJECT_POSE_SIZE = 48 * coef;
  positionCanvas();
}

function checkStartCondition() {
  const result = detectStartCondition({ errorTimer, gameReady, poses });
  errorTimer = result.errorTimer;
  gameReady = result.gameReady;
  if (result.error) {error = result.error;}
  if (result.pose) {pose = result.pose;}
  if (result.leftHand) {leftHand = result.leftHand;}
  if (result.rightHand) {rightHand = result.rightHand;}
  if (result.nose) {nose = result.nose;}
  return gameReady;
}

function gotPoses(results) {
  poses = results;
}

Object.assign(globalThis, {
  draw,
  keyPressed,
  mousePressed,
  mouseReleased,
  setup,
  touchEnded,
  touchMoved,
  windowResized
});
