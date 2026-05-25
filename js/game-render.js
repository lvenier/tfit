(function(root) {
  function layoutSnapshot() {
    return root.TfitLayoutState.snapshot();
  }

  function drawMessagePanel(title, details) {
    const layout = layoutSnapshot();

    push();
    resetMatrix();
    const cx = width / 2;
    const cy = height / 2;
    const panelW = 340 * layout.coef;
    const panelH = 108 * layout.coef;
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    stroke(255, 255, 255, 48);
    strokeWeight(1);
    fill(0, 0, 0, 184);
    rect(cx, cy, panelW, panelH, 8 * layout.coef);
    noStroke();
    fill(255);
    textStyle(BOLD);
    textSize(16 * layout.coef);
    text(title, cx, cy - 18 * layout.coef);
    textStyle(NORMAL);
    textSize(8 * layout.coef);
    text(details, cx, cy + 18 * layout.coef);
    pop();
  }

  function renderLoadingScreen() {
    const layout = layoutSnapshot();

    fill(255);
    image(images.logo, layout.width / 2 - 50 * layout.coef, 50 * layout.coef, 100 * layout.coef, 100 * layout.coef);
    translate(layout.width / 2, layout.height / 2);
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
    const layout = layoutSnapshot();

    tint(255, 236);
    image(images.backgrounds[gameState.menu], 0, 0, layout.width, layout.height);
    tint(255, 255);
    textSize(10 * layout.coef);
    fill(0, 0, 0);
    strokeWeight(0);
  }

  function renderMainMenu() {
    const layout = layoutSnapshot();

    fill(0, 0, 0);
    image(images.logo, layout.width - 60 * layout.coef, layout.height - 55 * layout.coef, 50 * layout.coef, 50 * layout.coef);
    image(images.menu, layout.width / 2.5, layout.height / 8, layout.width / 2, layout.width / 2);
    image(images.shadowButton, layout.width / 6, Math.trunc(layout.height / 6), 100 * layout.coef, 50 * layout.coef);
    image(images.padButton, layout.width / 6, Math.trunc(layout.height / 6 + 100 * layout.coef), 100 * layout.coef, 50 * layout.coef);
    image(images.fightMenuButton, layout.width / 6, Math.trunc(layout.height / 6 + 200 * layout.coef), 100 * layout.coef, 50 * layout.coef);
    image(images.configMenuButton, layout.width / 6, Math.trunc(layout.height / 6 + 300 * layout.coef), 100 * layout.coef, 50 * layout.coef);
  }

  function renderBackButton() {
    const layout = layoutSnapshot();
    image(images.backButton, layout.width - 100 * layout.coef - 10, Math.trunc(layout.height - 60 * layout.coef), 100 * layout.coef, 50 * layout.coef);
  }

  function renderSettingsControls() {
    const layout = layoutSnapshot();
    image(images.seriesButtons[gameState.gameSeries], layout.width / 2 - 50 * layout.coef, layout.height - 300 * layout.coef, 120 * layout.coef, 60 * layout.coef);
    image(images.durationButtons[gameState.gameLengthIndex], layout.width / 2 - 50 * layout.coef, layout.height - 250 * layout.coef, 120 * layout.coef, 60 * layout.coef);
    image(images.levelButtons[gameState.level], layout.width / 2 - 50 * layout.coef, layout.height - 200 * layout.coef, 120 * layout.coef, 60 * layout.coef);
    image(images.framerateButtons[layout.frameRate / 20], layout.width / 2 - 50 * layout.coef, layout.height - 150 * layout.coef, 120 * layout.coef, 60 * layout.coef);
    image(images.calibrateButton, layout.width / 2 - 50 * layout.coef, layout.height - 100 * layout.coef, 120 * layout.coef, 60 * layout.coef);
  }

  function renderGuardTargets() {
    const layout = layoutSnapshot();

    fill(255, 255, 255, 128);
    circle(calibrationState.left_init_pose_x, calibrationState.left_init_pose_y, layout.objectPoseSize);
    circle(calibrationState.right_init_pose_x, calibrationState.right_init_pose_y, layout.objectPoseSize);
  }

  function renderCalibrationOverlay() {
    const layout = layoutSnapshot();

    stroke(0);
    strokeWeight(hide_sensor / 255);
    fill(255, 255, 255, 32);
    rect(calibrationState.left_init_pose_x - layout.objectPoseSize / 2, 0, layout.objectPoseSize, layout.height);
    rect(calibrationState.right_init_pose_x - layout.objectPoseSize / 2, 0, layout.objectPoseSize, layout.height);
    fill(255, 255, 255, hide_sensor);
    rect(0, 0, layout.width, calibrationState.init_jab_y);
    rect(0, calibrationState.init_uppercut_y, layout.width, layout.height - calibrationState.init_uppercut_y);
    rect(0, 0, calibrationState.left_init_hook_x, layout.height);
    rect(calibrationState.right_init_hook_x, 0, calibrationState.right_init_hook_x, layout.height);
  }

  function renderSpeech() {
    const layout = layoutSnapshot();

    fill(255, 255, 255, 255);
    textSize(15 * layout.coef);
    text(speechString.toUpperCase(), layout.width / 2.1, layout.height - 50);
    fill(255, 0, 0, hide_sensor);
  }

  function renderFightButton() {
    const layout = layoutSnapshot();
    image(images.fightButton, layout.width / 2 - 50 * layout.coef, layout.height - 150 * layout.coef, 120 * layout.coef, 60 * layout.coef);
  }

  function renderRoundHud(currentScore) {
    const layout = layoutSnapshot();

    textStyle(BOLD);
    textSize(12 * layout.coef);
    const myCurrentTime = Math.ceil((gameState.gameDuration - gameState.gameTimer - 1) / layout.frameRate);
    strokeWeight(8 * layout.coef);
    stroke(80);
    noFill();
    ellipse(layout.width / 3, layout.objectPoseSize, layout.objectPoseSize, layout.objectPoseSize);
    stroke(0, 128, 128);
    arc(layout.width / 3, layout.objectPoseSize, layout.objectPoseSize, layout.objectPoseSize, -90, -90 + map(Math.ceil(gameState.gameDuration / layout.frameRate) - myCurrentTime, 0, Math.ceil(gameState.gameDuration / layout.frameRate), 0, 360));
    noStroke();
    fill(255);
    textSize(20 * layout.coef);
    textAlign(CENTER, CENTER);
    text(myCurrentTime, layout.width / 3, layout.objectPoseSize);
    textAlign(LEFT, CENTER);
    textSize(12 * layout.coef);
    strokeWeight(8 * layout.coef);
    stroke(80);
    noFill();
    ellipse(2 * layout.width / 3, layout.objectPoseSize, layout.objectPoseSize, layout.objectPoseSize);
    stroke(128, 0, 128);
    arc(2 * layout.width / 3, layout.objectPoseSize, layout.objectPoseSize, layout.objectPoseSize, -90, -90 + map(currentScore, 0, gameState.score_max, 0, 360));
    noStroke();
    fill(255);
    textSize(20 * layout.coef);
    textAlign(CENTER, CENTER);
    text(currentScore, 2 * layout.width / 3, layout.objectPoseSize);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(12 * layout.coef);
    if (gameState.menu === 2) {
      text("(T)ype: " + SHADOW_SPECIFIC[gameState.shadow_focus].toLowerCase(), 15, 36 * layout.coef);
      text("(S)eries: " + gameState.gameCurrentSeries + " / " + gameState.gameSeries, 15, 56 * layout.coef);
    }
    textSize(10 * layout.coef);
    fill(255, 0, 0, hide_sensor);
  }

  function renderFightMeters() {
    const layout = layoutSnapshot();

    stroke(0);
    strokeWeight(4);
    noFill();
    rect(layout.width / 2 - 75 * layout.coef, 15, 150 * layout.coef, 20);
    rect(layout.width / 2 - 75 * layout.coef, 45, 150 * layout.coef, 20);
    noStroke();
    fill(255, 0, 0);
    rect(layout.width / 2 - 75 * layout.coef + 2, 17, 148 * layout.coef, 16);
    rect(layout.width / 2 - 75 * layout.coef + 2, 45, 148 * layout.coef, 16);
    fill(255);
    if (gameState.my_opponent.stamina > 0) {
      rect(layout.width / 2 - 75 * layout.coef + 2, 17, 148 * layout.coef - (OPPONENTS[gameState.opponent].stamina - gameState.my_opponent.stamina) * layout.coef * 24, 16);
    }
    rect(layout.width / 2 - 75 * layout.coef + 2, 45, 148 * layout.coef, 16);
  }

  function renderFeetIndicator() {
    const layout = layoutSnapshot();

    fill(255, 255, 255, 192);
    circle(layout.width / 2, 50 + layout.objectPoseSize / 2, layout.objectPoseSize + 10);
    if (gameState.feet_position === 0) {image(images.leftFoot, layout.width / 2 - layout.objectPoseSize / 2, 50, layout.objectPoseSize, layout.objectPoseSize);}
    if (gameState.feet_position === 1) {image(images.rightFoot, layout.width / 2 - layout.objectPoseSize / 2, 50, layout.objectPoseSize, layout.objectPoseSize);}
  }

  function renderShadowResult() {
    const layout = layoutSnapshot();

    image(images.backgrounds[0], 0, 0, layout.width, layout.height);
    gameState.score = 0;
    for (const element of gameState.arrayScore) {
      gameState.score += element;
    }
    textSize(20 * layout.coef);
    text('Score: ' + gameState.score + " / " + gameState.score_max_prev, Math.trunc(layout.width / 2.5) + 20 * layout.coef, Math.trunc(layout.height / 5));
    textSize(10 * layout.coef);
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
      textSize(10 * layout.coef);
      text(gameState.song_result[mt.toString()].success + " / " + gameState.song_result[mt.toString()].total, Math.trunc((2 + 2 * (num % 2)) * layout.width / 8) + 100 * layout.coef * (num % 2), Math.trunc(layout.height / 5 + 30 + 30 * Math.ceil((num + 1) / 2) * layout.coef));
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
      circle(Math.trunc((2 + 2 * (num % 2)) * layout.width / 8) + 100 * layout.coef * (num % 2) + 100, Math.trunc(layout.height / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * layout.coef), layout.objectPoseSize / 2);
      fill(255);
      textSize(5 * layout.coef);
      text(h + gameState.song_result[mt.toString()].text, Math.trunc((2 + 2 * (num % 2)) * layout.width / 8) + 100 * layout.coef * (num % 2) + 84, Math.trunc(layout.height / 5 + 25 + 30 * Math.ceil((num + 1) / 2) * layout.coef));
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
