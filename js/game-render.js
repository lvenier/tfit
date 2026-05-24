(function(root) {
  function drawMessagePanel(title, details) {
    push();
    resetMatrix();
    const cx = width / 2;
    const cy = height / 2;
    const panelW = 340 * coef;
    const panelH = 108 * coef;
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    stroke(255, 255, 255, 48);
    strokeWeight(1);
    fill(0, 0, 0, 184);
    rect(cx, cy, panelW, panelH, 8 * coef);
    noStroke();
    fill(255);
    textStyle(BOLD);
    textSize(16 * coef);
    text(title, cx, cy - 18 * coef);
    textStyle(NORMAL);
    textSize(8 * coef);
    text(details, cx, cy + 18 * coef);
    pop();
  }

  function renderLoadingScreen() {
    fill(255);
    image(images.logo, myWindowWidth / 2 - 50 * coef, 50 * coef, 100 * coef, 100 * coef);
    translate(myWindowWidth / 2, myWindowHeight / 2);
    ellipse(100 * sin(radians(loading_k)), 0, 20 * cos(radians(loading_m)), 20 * cos(radians(loading_m)));
    ellipse(100 * sin(radians(loading_k) + PI / 3), 0, 20 * cos(radians(loading_m) + PI / 3), 20 * cos(radians(loading_m) + PI / 3));
    ellipse(100 * sin(radians(loading_k) + PI / 6), 0, 20 * cos(radians(loading_m) + PI / 6), 20 * cos(radians(loading_m) + PI / 6));
    if (loading_k < 360) {
      loading_k += 4;
      if (90 < loading_k) {
        if (loading_m < 360) {loading_m += 8;}
        else {loading_m = 0;}
      }
    } else {
      loading_k = 0;
      loading_m = 0;
    }
    drawMessagePanel("Detecting your guard", "Stand in frame with both hands visible");
  }

  function renderSceneBackground() {
    tint(255, 236);
    image(images.backgrounds[gameState.menu], 0, 0, myWindowWidth, myWindowHeight);
    tint(255, 255);
    textSize(10 * coef);
    fill(0, 0, 0);
    strokeWeight(0);
  }

  function renderMainMenu() {
    fill(0, 0, 0);
    image(images.logo, myWindowWidth - 60 * coef, myWindowHeight - 55 * coef, 50 * coef, 50 * coef);
    image(images.menu, myWindowWidth / 2.5, myWindowHeight / 8, myWindowWidth / 2, myWindowWidth / 2);
    image(images.shadowButton, myWindowWidth / 6, Math.trunc(myWindowHeight / 6), 100 * coef, 50 * coef);
    image(images.padButton, myWindowWidth / 6, Math.trunc(myWindowHeight / 6 + 100 * coef), 100 * coef, 50 * coef);
    image(images.fightMenuButton, myWindowWidth / 6, Math.trunc(myWindowHeight / 6 + 200 * coef), 100 * coef, 50 * coef);
    image(images.configMenuButton, myWindowWidth / 6, Math.trunc(myWindowHeight / 6 + 300 * coef), 100 * coef, 50 * coef);
  }

  function renderBackButton() {
    image(images.backButton, myWindowWidth - 100 * coef - 10, Math.trunc(myWindowHeight - 60 * coef), 100 * coef, 50 * coef);
  }

  function renderSettingsControls() {
    image(images.seriesButtons[gameState.gameSeries], myWindowWidth / 2 - 50 * coef, myWindowHeight - 300 * coef, 120 * coef, 60 * coef);
    image(images.durationButtons[gameState.gameLengthIndex], myWindowWidth / 2 - 50 * coef, myWindowHeight - 250 * coef, 120 * coef, 60 * coef);
    image(images.levelButtons[gameState.level], myWindowWidth / 2 - 50 * coef, myWindowHeight - 200 * coef, 120 * coef, 60 * coef);
    image(images.framerateButtons[FRAME_RATE / 20], myWindowWidth / 2 - 50 * coef, myWindowHeight - 150 * coef, 120 * coef, 60 * coef);
    image(images.calibrateButton, myWindowWidth / 2 - 50 * coef, myWindowHeight - 100 * coef, 120 * coef, 60 * coef);
  }

  function renderGuardTargets() {
    fill(255, 255, 255, 128);
    circle(calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, OBJECT_POSE_SIZE);
    circle(calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, OBJECT_POSE_SIZE);
  }

  function renderCalibrationOverlay() {
    stroke(0);
    strokeWeight(hide_sensor / 255);
    fill(255, 255, 255, 32);
    rect(calibrationState.left_init_pose_x - OBJECT_POSE_SIZE / 2, 0, OBJECT_POSE_SIZE, myWindowHeight);
    rect(calibrationState.right_init_pose_x - OBJECT_POSE_SIZE / 2, 0, OBJECT_POSE_SIZE, myWindowHeight);
    fill(255, 255, 255, hide_sensor);
    rect(0, 0, myWindowWidth, calibrationState.init_jab_y);
    rect(0, calibrationState.init_uppercut_y, myWindowWidth, myWindowHeight - calibrationState.init_uppercut_y);
    rect(0, 0, calibrationState.left_init_hook_x, myWindowHeight);
    rect(calibrationState.right_init_hook_x, 0, calibrationState.right_init_hook_x, myWindowHeight);
  }

  function renderSpeech() {
    fill(255, 255, 255, 255);
    textSize(15 * coef);
    text(speechString.toUpperCase(), myWindowWidth / 2.1, myWindowHeight - 50);
    fill(255, 0, 0, hide_sensor);
  }

  function renderFightButton() {
    image(images.fightButton, myWindowWidth / 2 - 50 * coef, myWindowHeight - 150 * coef, 120 * coef, 60 * coef);
  }

  function renderRoundHud(currentScore) {
    textStyle(BOLD);
    textSize(12 * coef);
    const myCurrentTime = Math.ceil((gameState.gameDuration - gameState.gameTimer - 1) / FRAME_RATE);
    strokeWeight(8 * coef);
    stroke(80);
    noFill();
    ellipse(myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);
    stroke(0, 128, 128);
    arc(myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, -90, -90 + map(Math.ceil(gameState.gameDuration / FRAME_RATE) - myCurrentTime, 0, Math.ceil(gameState.gameDuration / FRAME_RATE), 0, 360));
    noStroke();
    fill(255);
    textSize(20 * coef);
    textAlign(CENTER, CENTER);
    text(myCurrentTime, myWindowWidth / 3, OBJECT_POSE_SIZE);
    textAlign(LEFT, CENTER);
    textSize(12 * coef);
    strokeWeight(8 * coef);
    stroke(80);
    noFill();
    ellipse(2 * myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);
    stroke(128, 0, 128);
    arc(2 * myWindowWidth / 3, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE, -90, -90 + map(currentScore, 0, gameState.score_max, 0, 360));
    noStroke();
    fill(255);
    textSize(20 * coef);
    textAlign(CENTER, CENTER);
    text(currentScore, 2 * myWindowWidth / 3, OBJECT_POSE_SIZE);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(12 * coef);
    if (gameState.menu === 2) {
      text("(T)ype: " + SHADOW_SPECIFIC[gameState.shadow_focus].toLowerCase(), 15, 36 * coef);
      text("(S)eries: " + gameState.gameCurrentSeries + " / " + gameState.gameSeries, 15, 56 * coef);
    }
    textSize(10 * coef);
    fill(255, 0, 0, hide_sensor);
  }

  function renderFightMeters() {
    stroke(0);
    strokeWeight(4);
    noFill();
    rect(myWindowWidth / 2 - 75 * coef, 15, 150 * coef, 20);
    rect(myWindowWidth / 2 - 75 * coef, 45, 150 * coef, 20);
    noStroke();
    fill(255, 0, 0);
    rect(myWindowWidth / 2 - 75 * coef + 2, 17, 148 * coef, 16);
    rect(myWindowWidth / 2 - 75 * coef + 2, 45, 148 * coef, 16);
    fill(255);
    if (gameState.my_opponent.stamina > 0) {
      rect(myWindowWidth / 2 - 75 * coef + 2, 17, 148 * coef - (OPPONENTS[opponent].stamina - gameState.my_opponent.stamina) * coef * 24, 16);
    }
    rect(myWindowWidth / 2 - 75 * coef + 2, 45, 148 * coef, 16);
  }

  function renderFeetIndicator() {
    fill(255, 255, 255, 192);
    circle(myWindowWidth / 2, 50 + OBJECT_POSE_SIZE / 2, OBJECT_POSE_SIZE + 10);
    if (gameState.feet_position === 0) {image(images.leftFoot, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, 50, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);}
    if (gameState.feet_position === 1) {image(images.rightFoot, myWindowWidth / 2 - OBJECT_POSE_SIZE / 2, 50, OBJECT_POSE_SIZE, OBJECT_POSE_SIZE);}
  }

  function renderShadowResult() {
    image(images.backgrounds[0], 0, 0, myWindowWidth, myWindowHeight);
    gameState.score = 0;
    for (const element of gameState.arrayScore) {
      gameState.score += element;
    }
    textSize(20 * coef);
    text('Score: ' + gameState.score + " / " + gameState.score_max_prev, Math.trunc(myWindowWidth / 2.5) + 20 * coef, Math.trunc(myWindowHeight / 5));
    textSize(10 * coef);
    gameState.song_result = {};
    for (const move of gameState.curMoves) {
      if (move.type === 0 || move.type === 10) {
        continue;
      }
      if (!(move.type.toString() in gameState.song_result)) {
        gameState.song_result[move.type.toString()] = {
          "type": Math.trunc(move.type),
          "text": move.text,
          "success": 0,
          "total": 0
        };
      }
      gameState.song_result[move.type.toString()]["total"]++;
      if (move.hit === true) {
        gameState.song_result[move.type.toString()]["success"]++;
      }
    }
    gameState.song_result.score = gameState.score;
    gameState.song_result.length = gameState.curMoves.length;
    let num = 0;
    for (const mt of Object.keys(gameState.song_result)) {
      if (["score", "length"].includes(mt)) {continue;}
      fill(255);
      textSize(10 * coef);
      text(gameState.song_result[mt.toString()].success + " / " + gameState.song_result[mt.toString()].total, Math.trunc((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2), Math.trunc(myWindowHeight / 5 + 30 + 30 * Math.ceil((num + 1) / 2) * coef));
      let h = "R_";
      if ([1, 3, 5, 7].includes(gameState.song_result[mt.toString()].type)) {h = "L_";}
      if (gameState.song_result[mt.toString()].type === 1 || gameState.song_result[mt.toString()].type === 2) {
        fill(100, 100, 0, 255);
      } else if (gameState.song_result[mt.toString()].type === 3 || gameState.song_result[mt.toString()].type === 4) {
        fill(100, 0, 100, 255);
      } else if (gameState.song_result[mt.toString()].type === 5 || gameState.song_result[mt.toString()].type === 6) {
        fill(0, 100, 100, 255);
      } else if (gameState.song_result[mt.toString()].type === 7 || gameState.song_result[mt.toString()].type === 8) {
        fill(0, 0, 100, 255);
      } else if (gameState.song_result[mt.toString()].type === 9) {
        fill(0, 0, 200, 255);
      }
      circle(Math.trunc((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2) + 100, Math.trunc(myWindowHeight / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * coef), OBJECT_POSE_SIZE / 2);
      fill(255);
      textSize(5 * coef);
      text(h + gameState.song_result[mt.toString()].text, Math.trunc((2 + 2 * (num % 2)) * myWindowWidth / 8) + 100 * coef * (num % 2) + 84, Math.trunc(myWindowHeight / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * coef));
      num++;
    }
  }

  function renderMoveShape(move, objectPoseSize, pairedX) {
    if (move.type === 3) {
      quad(move.x - objectPoseSize / 2, move.y - objectPoseSize / 2, move.x - objectPoseSize / 2, move.y + objectPoseSize / 2, move.x + objectPoseSize / 2, move.y + objectPoseSize / 6, move.x + objectPoseSize / 2, move.y - objectPoseSize / 6);
    } else if (move.type === 4) {
      quad(move.x + objectPoseSize / 2, move.y - objectPoseSize / 2, move.x + objectPoseSize / 2, move.y + objectPoseSize / 2, move.x - objectPoseSize / 2, move.y + objectPoseSize / 6, move.x - objectPoseSize / 2, move.y - objectPoseSize / 6);
    } else if (move.type === 5 || move.type === 6) {
      quad(move.x - objectPoseSize / 2, move.y + objectPoseSize / 2, move.x + objectPoseSize / 2, move.y + objectPoseSize / 2, move.x + objectPoseSize / 6, move.y - objectPoseSize / 2, move.x - objectPoseSize / 6, move.y - objectPoseSize / 2);
    } else if (move.type === 7) {
      quad(move.x + objectPoseSize / 2, move.y - objectPoseSize / 2, move.x + objectPoseSize / 2, move.y + objectPoseSize / 2, move.x - objectPoseSize / 2, move.y + objectPoseSize / 6, move.x - objectPoseSize / 2, move.y - objectPoseSize / 6);
    } else if (move.type === 8) {
      quad(move.x - objectPoseSize / 2, move.y - objectPoseSize / 2, move.x - objectPoseSize / 2, move.y + objectPoseSize / 2, move.x + objectPoseSize / 2, move.y + objectPoseSize / 6, move.x + objectPoseSize / 2, move.y - objectPoseSize / 6);
    } else if (move.type === 9) {
      quad(move.x - objectPoseSize / 2, move.y - objectPoseSize / 2, move.x + objectPoseSize / 2, move.y - objectPoseSize / 2, move.x + objectPoseSize / 6, move.y + objectPoseSize / 2, move.x - objectPoseSize / 6, move.y + objectPoseSize / 2);
      if (Number.isFinite(pairedX)) {
        quad(pairedX - objectPoseSize / 2, move.y - objectPoseSize / 2, pairedX + objectPoseSize / 2, move.y - objectPoseSize / 2, pairedX + objectPoseSize / 6, move.y + objectPoseSize / 2, pairedX - objectPoseSize / 6, move.y + objectPoseSize / 2);
      }
    } else {
      circle(move.x, move.y, objectPoseSize);
    }
  }

  const api = {
    drawMessagePanel,
    renderMoveShape,
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
  };

  root.TfitRender = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
