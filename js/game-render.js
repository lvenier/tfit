(function(root) {
  function layoutSnapshot() {
    return root.TfitLayoutState.snapshot();
  }

  const MENU_HOVER_PURPLE = [160, 32, 240];
  const MENU_BORDER_PURPLE = [175, 70, 255];
  const SYSTEM_BUTTON_WIDTH = 100;
  const SYSTEM_BUTTON_HEIGHT = 42;
  const SYSTEM_BUTTON_GUTTER = 10;
  const SETTINGS_BUTTON_WIDTH = 150;
  const SETTINGS_BUTTON_HEIGHT = 42;
  const CALIBRATION_RESET_BUTTON_WIDTH = 120;
  const CALIBRATION_RESET_BUTTON_HEIGHT = 42;
  const SETTINGS_BUTTON_X_OFFSET = 60;
  const LEVEL_LABELS = (root.TfitConfig && root.TfitConfig.GAME_LEVEL) || {
    0: "easy",
    1: "medium",
    2: "hard"
  };
  const SERIES_TOTAL = 5;
  const GAME_LENGTH_LABELS = (root.TfitConfig && root.TfitConfig.GAME_LENGTH) || {
    1: "30",
    2: "60",
    3: "120",
    4: "180",
    5: "300"
  };
  const MENU_BUTTONS = [
    { label: "SHADOW", yIndex: 0, variant: "default" },
    { label: "PUNCH PAD", yIndex: 1, variant: "default" },
    { label: "FIGHT", yIndex: 2, variant: "default" },
    { label: "SETTINGS", yIndex: 3, variant: "settings" }
  ];

  function isPointInRect({ x, y }, rect) {
    return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
  }

  function rectFor({ x, y, w, h }) {
    return {
      left: x,
      right: x + w,
      top: y,
      bottom: y + h
    };
  }

  function drawMenuButton({ x, y, w, h, label, variant = "default", textSizePx = 11 }) {
    const labelToRender = label && /^[A-Z]/.test(label) && !label.startsWith("(")
      ? `(${label[0]})${label.slice(1)}`
      : label;
    const hovered = isPointInRect({ x: mouseX, y: mouseY }, rectFor({ x, y, w, h }));
    const radius = Math.max(12, 16 * layoutSnapshot().coef);
    const isSettingsButton = variant === "settings";
    const baseFill = [0, 0, 0];
    const baseBorder = isSettingsButton ? [255, 80, 90] : MENU_BORDER_PURPLE;
    const hoverBorder = isSettingsButton ? [255, 130, 130] : MENU_HOVER_PURPLE;
    const hoverGlow = isSettingsButton ? [255, 64, 64, 45] : [175, 70, 255, 42];
    const textColor = isSettingsButton ? [255, 160, 160] : [255, 255, 255];

    push();
    rectMode(CORNER);
    fill(baseFill[0], baseFill[1], baseFill[2], hovered ? 225 : 185);
    stroke(...baseBorder, hovered ? 255 : 145);
    strokeWeight(hovered ? 3 : 2);
    rect(x, y, w, h, radius);

    if (hovered) {
      noStroke();
      fill(...hoverGlow);
      rect(x - 2, y - 2, w + 4, h + 4, radius + 2);

      noFill();
      stroke(...hoverBorder, 255);
      strokeWeight(2.4);
      rect(x - 3, y - 3, w + 6, h + 6, radius + 4);
    }

    noStroke();

    fill(...textColor);
    textAlign(CENTER, CENTER);
    textSize(textSizePx * layoutSnapshot().coef);
    textStyle(BOLD);
    text(labelToRender, x + w / 2, y + h / 2 + 1);
    pop();
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

  function drawDetectionProgress() {
    const layout = layoutSnapshot();
    const countdown = root.TfitGameLogic.detectStartCountdown({ errorTimer });
    const panelHeight = 108 * layout.coef;
    const x = width / 2;
    const y = height / 2 + panelHeight / 2 - 8 * layout.coef;
    const progressWidth = 260 * layout.coef;
    const progressHeight = 8 * layout.coef;

    push();
    resetMatrix();
    rectMode(CENTER);
    noStroke();
    fill(255, 255, 255, 42);
    rect(x, y, progressWidth, progressHeight, progressHeight);
    fill(160, 32, 240, 230);
    rect(
      x - progressWidth / 2 + (progressWidth * countdown.progress) / 2,
      y,
      progressWidth * countdown.progress,
      progressHeight,
      progressHeight
    );
    fill(255, 255, 255, 210);
    textAlign(CENTER, CENTER);
    textSize(8 * layout.coef);
    text(`${countdown.remainingSeconds}s left`, x, y + 18 * layout.coef);
    pop();
  }

  function drawArenaDefault() {
    background(7, 9, 20);

    noStroke();
    for (let r = 700; r > 0; r -= 20) {
      fill(30, 45, 100, map(r, 700, 0, 0, 20));
      ellipse(width * 0.35, height * 0.35, r * 1.4, r);
    }

    stroke(255, 255, 255, 22);
    strokeWeight(1);
    const horizon = height * 0.62;
    line(0, horizon, width, horizon);

    for (let i = -8; i <= 8; i++) {
      line(width * 0.35, horizon, width * 0.35 + i * width * 0.16, height);
    }

    for (let y = horizon; y < height; y += (y - horizon) * 0.11 + 18) {
      line(0, y, width, y);
    }

    stroke(255, 80, 90, 120);
    strokeWeight(6);
    line(0, height * 0.55, width, height * 0.55);
    stroke(255, 255, 255, 90);
    strokeWeight(4);
    line(0, height * 0.49, width, height * 0.49);
    if (gameState.menu === 2) {
      noStroke();
      fill(255, 255, 255, 18);
      quad(width * 0.12, 0, width * 0.25, 0, width * 0.48, height, width * 0.18, height);
      fill(255, 70, 120, 14);
      quad(width * 0.74, 0, width * 0.86, 0, width * 0.62, height, width * 0.38, height);
    }
  }

  function drawArenaGame3(t) {
    background(7, 10, 21);

    noStroke();
    for (let i = 0; i < 3; i++) {
      const x = width * (0.25 + i * 0.25) + sin(t + i) * 40;
      fill(80, 160, 255, 18);
      quad(
        x - 45,
        0,
        x + 45,
        0,
        width * 0.45 + i * 80,
        height * 0.82,
        width * 0.32 + i * 75,
        height * 0.82
      );
    }

    stroke(50, 210, 255, 38);
    strokeWeight(1);
    for (let i = 0; i < 14; i++) {
      const y = height * 0.64 + i * 24;
      line(width * 0.16 - i * 28, y, width * 0.86 + i * 28, y);
    }
    for (let i = 0; i < 18; i++) {
      const x = map(i, 0, 17, width * 0.16, width * 0.86);
      line(x, height * 0.64, width * 0.5 + (x - width * 0.5) * 2.2, height);
    }

    for (let j = 0; j < 3; j++) {
      stroke(255, 70, 90, 150 - j * 25);
      strokeWeight(5);
      const y = height * (0.39 + j * 0.08);
      line(width * 0.06, y, width * 0.94, y + sin(t + j) * 3);
    }
  }

  function drawArenaFight() {
    background(5, 6, 11);
    noStroke();
    for (let r = 900; r > 0; r -= 18) {
      fill(20, 35, 75, map(r, 900, 0, 0, 16));
      ellipse(width * 0.36, height * 0.30, r * 1.5, r);
    }

    // top lights
    for (let i = 0; i < 5; i++) {
      const lx = width * (0.13 + i * 0.15);
      fill(255, 245, 210, 20);
      triangle(lx - 40, 0, lx + 40, 0, width * 0.35 + (i - 2) * 30, height * 0.78);
      fill(255, 244, 210, 160);
      ellipse(lx, 22, 38, 13);
    }

    const horizon = height * 0.57;
    // back wall panels
    stroke(255, 255, 255, 16);
    strokeWeight(1);
    for (let i = 0; i < 12; i++) line(i * width / 12, 0, i * width / 12, horizon);

    // ropes behind boxer
    strokeCap(ROUND);
    strokeWeight(8);
    stroke(170, 24, 40, 160);
    line(0, height * 0.46, width, height * 0.46);
    strokeWeight(6);
    stroke(235, 235, 235, 145);
    line(0, height * 0.52, width, height * 0.52);
    strokeWeight(8);
    stroke(170, 24, 40, 120);
    line(0, height * 0.59, width, height * 0.59);
    noStroke();
    fill(40, 42, 52);
    rect(width * 0.05, height * 0.51, 18, height * 0.26, 5);
    rect(width * 0.63, height * 0.51, 18, height * 0.26, 5);

    // floor
    noStroke();
    fill(20, 22, 30);
    rect(width / 2, height * 0.79, width, height * 0.42);
    stroke(255, 255, 255, 24);
    strokeWeight(1);
    for (let i = -10; i <= 10; i++) line(width * 0.35, horizon, width * 0.35 + i * width * 0.16, height);
    for (let y = horizon; y < height; y += max(20, (y - horizon) * 0.12 + 12)) line(0, y, width, y);

    // ring logo on mat
    noStroke();
    fill(255, 255, 255, 15);
    ellipse(width * 0.35, height * 0.82, 310, 80);
    fill(255, 255, 255, 25);
    textSize(34);
    textStyle(BOLD);
    text('BOX4FIT', width * 0.35, height * 0.82);
  }

  function syncPageBackground(menu = gameState.menu) {
    if (!root.document || !root.document.body) {
      return false;
    }

    if (menu === 0) {
      root.document.body.style.setProperty("--app-background-image", "none");
      return true;
    }

    root.document.body.style.setProperty(
      "--app-background-image",
      `url("assets/backgrounds/${menu}.jpg")`
    );
    return true;
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
    const countdown = root.TfitGameLogic.detectStartCountdown({ errorTimer });
    drawMessagePanel("Detecting your guard", `Stand in frame with both hands visible - ${countdown.remainingSeconds}s left`);
    drawDetectionProgress();
  }

  function renderSceneBackground() {
    const layout = layoutSnapshot();

    syncPageBackground();
    if (gameState.menu === 3) {
      drawArenaGame3(frameCount * 0.04);
    } else if (gameState.menu === 4) {
      drawArenaFight();
    } else {
      drawArenaDefault();
    }

    if (gameState.menu !== 0) {
      textSize(10 * layout.coef);
      fill(0, 0, 0);
      strokeWeight(0);
    }
  }

  function renderMainMenu() {
    const layout = layoutSnapshot();
    const menuButtonOffset = 20 * layout.coef;
    const menuButtonX = layout.width / 6 + menuButtonOffset;
    const menuButtonW = 100 * layout.coef;
    const menuButtonH = 42 * layout.coef;

    fill(0, 0, 0);
    image(images.logo, layout.width - 60 * layout.coef, layout.height - 55 * layout.coef, 50 * layout.coef, 50 * layout.coef);

    const panelX = layout.width * 0.60;
    const panelY = layout.height / 9;
    const panelW = Math.min(layout.width * 0.44, 620);
    const panelH = layout.height * 0.24;
    const halfW = panelW / 2;
    const halfH = panelH / 2;
    const cx = panelX;
    const cy = panelY + halfH;

    fill(14, 18, 30, 180);
    stroke(255, 255, 255, 35);
    strokeWeight(1.2);
    rect(cx - halfW, cy - halfH, panelW, panelH, 16);

    noStroke();
    fill(255, 255, 255, 220);
    textAlign(CENTER, typeof TOP === "undefined" ? "top" : TOP);
    textSize(38 * Math.min(layout.coef, 1.4));
    textStyle(BOLD);
    text("BOX4FIT", cx, panelY + 22 * layout.coef);

    textAlign(CENTER, typeof TOP === "undefined" ? "top" : TOP);
    textSize(15 * layout.coef);
    textStyle(NORMAL);
    const description = "A boxing game about rhythm, movement, and endurance.";
    const descX = cx - halfW + 28;
    const descY = panelY + 60 * layout.coef;
    const descW = panelW - 48;
    fill(225, 225, 225, 210);
    text(description, descX, descY, descW, panelH);

    MENU_BUTTONS.forEach((button, index) => {
      drawMenuButton({
        label: button.label,
        variant: button.variant,
        x: menuButtonX,
        y: Math.trunc(layout.height / 6 + index * 100 * layout.coef),
        w: menuButtonW,
        h: menuButtonH
      });
    });
  }

  function renderBackButton() {
    const layout = layoutSnapshot();
    renderSettingsStyleButton({
      label: "BACK",
      layout
    });
  }

  function renderStopButton() {
    const layout = layoutSnapshot();
    renderSettingsStyleButton({
      label: "STOP",
      layout
    });
  }

  function renderCalibrationResetButton() {
    const layout = layoutSnapshot();
    drawMenuButton({
      label: "RESET",
      variant: "settings",
      x: layout.width / 2 - (CALIBRATION_RESET_BUTTON_WIDTH / 2) * layout.coef,
      y: layout.height - 100 * layout.coef,
      w: CALIBRATION_RESET_BUTTON_WIDTH * layout.coef,
      h: CALIBRATION_RESET_BUTTON_HEIGHT * layout.coef,
      textSizePx: 11
    });
  }

  function getCalibrationResetButtonBounds() {
    const layout = layoutSnapshot();
    return {
      left: layout.width / 2 - (CALIBRATION_RESET_BUTTON_WIDTH * layout.coef) / 2,
      right: layout.width / 2 + (CALIBRATION_RESET_BUTTON_WIDTH * layout.coef) / 2,
      top: Math.trunc(layout.height - 100 * layout.coef),
      bottom: Math.trunc(layout.height - 100 * layout.coef + CALIBRATION_RESET_BUTTON_HEIGHT * layout.coef)
    };
  }

  function getSettingsButtonBounds() {
    const layout = layoutSnapshot();
    return {
      left: layout.width - SYSTEM_BUTTON_WIDTH * layout.coef - SYSTEM_BUTTON_GUTTER,
      right: layout.width - SYSTEM_BUTTON_GUTTER,
      top: Math.trunc(layout.height - 60 * layout.coef),
      bottom: Math.trunc(layout.height - 60 * layout.coef + SYSTEM_BUTTON_HEIGHT * layout.coef)
    };
  }

  function renderSettingsStyleButton({
    label,
    layout
  }) {
    const bounds = getSettingsButtonBounds();
    drawMenuButton({
      label,
      variant: "settings",
      x: bounds.left,
      y: bounds.top,
      w: SYSTEM_BUTTON_WIDTH * layout.coef,
      h: SYSTEM_BUTTON_HEIGHT * layout.coef
    });
  }

  function renderSettingsControls() {
    const layout = layoutSnapshot();
    const controlsY = [
      layout.height - 300 * layout.coef,
      layout.height - 250 * layout.coef,
      layout.height - 200 * layout.coef,
      layout.height - 150 * layout.coef,
      layout.height - 100 * layout.coef
    ];
    const settingsButtonX = Math.trunc(layout.width / 2 - (SETTINGS_BUTTON_WIDTH / 2) * layout.coef);
    const controlTextSize = 11;

    drawMenuButton({
      label: `SERIES (${gameState.gameSeries}/${SERIES_TOTAL})`,
      variant: "default",
      x: settingsButtonX,
      y: controlsY[0],
      w: SETTINGS_BUTTON_WIDTH * layout.coef,
      h: SETTINGS_BUTTON_HEIGHT * layout.coef,
      textSizePx: controlTextSize
    });

    drawMenuButton({
      label: `LENGTH (${GAME_LENGTH_LABELS[gameState.gameLengthIndex]}s)`,
      variant: "default",
      x: settingsButtonX,
      y: controlsY[1],
      w: SETTINGS_BUTTON_WIDTH * layout.coef,
      h: SETTINGS_BUTTON_HEIGHT * layout.coef,
      textSizePx: controlTextSize
    });

    drawMenuButton({
      label: `LEVEL (${(LEVEL_LABELS[gameState.level] || "medium").toUpperCase()})`,
      variant: "default",
      x: settingsButtonX,
      y: controlsY[2],
      w: SETTINGS_BUTTON_WIDTH * layout.coef,
      h: SETTINGS_BUTTON_HEIGHT * layout.coef,
      textSizePx: controlTextSize
    });

    drawMenuButton({
      label: `FRAMERATE (${layout.frameRate} FPS)`,
      variant: "default",
      x: settingsButtonX,
      y: controlsY[3],
      w: SETTINGS_BUTTON_WIDTH * layout.coef,
      h: SETTINGS_BUTTON_HEIGHT * layout.coef,
      textSizePx: controlTextSize
    });

    drawMenuButton({
      label: "CALIBRATE",
      variant: "default",
      x: settingsButtonX,
      y: controlsY[4],
      w: SETTINGS_BUTTON_WIDTH * layout.coef,
      h: SETTINGS_BUTTON_HEIGHT * layout.coef,
      textSizePx: controlTextSize
    });
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
    const width = 120 * layout.coef;
    drawMenuButton({
      label: "FIGHT",
      variant: "default",
      x: layout.width / 2 - width / 2,
      y: layout.height - 150 * layout.coef,
      w: width,
      h: 42 * layout.coef
    });
  }

  function renderRoundHud(currentScore) {
    const layout = layoutSnapshot();
    textAlign(LEFT, CENTER);

    const totalSeconds = Math.max(1, Math.ceil(gameState.gameDuration / layout.frameRate));
    const remainingSeconds = Math.max(0, Math.ceil((gameState.gameDuration - gameState.gameTimer - 1) / layout.frameRate));
    const timeProgress = Math.max(0, Math.min(totalSeconds - remainingSeconds, totalSeconds));
    const scoreProgress = Math.max(0, Math.min(currentScore, gameState.score_max || 1));
    const scoreDenominator = Math.max(gameState.score_max, 1);
    const gaugeRadius = Math.max(12, Math.min(28 * layout.coef, layout.objectPoseSize * 0.58));
    const panelY = layout.height - (gaugeRadius + 24 * layout.coef);
    const gaugeYOffset = 8 * layout.coef;
    const leftCenterX = layout.width / 3;
    const rightCenterX = 2 * layout.width / 3;

    function drawRoundGauge({ x, y, title, value, valueSuffix, maxValue, progress, trailColor, fillColor }) {
      const cardWidth = Math.max(50 * layout.coef, Math.min(layout.width * 0.145, 74 * layout.coef));
      const cardHeight = Math.max(46 * layout.coef, gaugeRadius * 2.55);
      const cardX = x - cardWidth / 2;
      const gaugeY = y + gaugeYOffset;
      const cardY = gaugeY - cardHeight / 2;
      const titleY = cardY + 21 * layout.coef;
      const valueY = gaugeY + 3 * layout.coef;
      const ratioY = gaugeY + 17 * layout.coef;

      noStroke();
      fill(0, 0, 0, 112);
      rect(cardX, cardY, cardWidth, cardHeight, 8 * layout.coef);
      fill(255, 255, 255, 26);
      rect(cardX + 4 * layout.coef, cardY + 4 * layout.coef, cardWidth - 8 * layout.coef, cardHeight - 8 * layout.coef, 6 * layout.coef);

      noStroke();
      fill(255, 255, 255, 200);
      textSize(8 * layout.coef);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text(title, x, titleY);

      stroke(255, 255, 255, 38);
      strokeWeight(5 * layout.coef);
      noFill();
      ellipse(x, gaugeY, gaugeRadius * 2, gaugeRadius * 2);
      stroke(trailColor);
      strokeWeight(5 * layout.coef);
      arc(x, gaugeY, gaugeRadius * 2, gaugeRadius * 2, -90, -90 + map(progress, 0, 1, 0, 360));

      noStroke();
      fill(fillColor);
      textSize(16 * layout.coef);
      textStyle(BOLD);
      text(`${value}${valueSuffix}`, x, valueY);
      fill(255, 255, 255, 190);
      textSize(9 * layout.coef);
      textStyle(NORMAL);
      text(`of ${maxValue}`, x, ratioY);
    }

    drawRoundGauge({
      x: leftCenterX,
      y: panelY,
      title: "TIME",
      value: remainingSeconds,
      valueSuffix: "",
      maxValue: totalSeconds,
      progress: timeProgress / totalSeconds,
      trailColor: [0, 176, 176],
      fillColor: [255, 255, 255, 230]
    });

    drawRoundGauge({
      x: rightCenterX,
      y: panelY,
      title: "POINTS",
      value: currentScore,
      valueSuffix: "",
      maxValue: scoreDenominator,
      progress: scoreProgress / scoreDenominator,
      trailColor: [184, 64, 184],
      fillColor: [255, 255, 255, 230]
    });

    textStyle(NORMAL);
    textSize(12 * layout.coef);
    if (gameState.menu === 2) {
      const panelPadding = 10 * layout.coef;
      const panelLineGap = 18 * layout.coef;
      const titleY = 14 * layout.coef;
      const panel = {
        height: 72 * layout.coef,
        width: Math.min(168 * layout.coef, Math.max(92 * layout.coef, layout.width * 0.28)),
        x: 10 * layout.coef,
        y: 14 * layout.coef
      };
      fill(0, 0, 0, 112);
      rect(panel.x, panel.y, panel.width, panel.height, 8 * layout.coef);
      fill(255, 255, 255, 26);
      rect(panel.x + 4 * layout.coef, panel.y + 4 * layout.coef, panel.width - 8 * layout.coef, panel.height - 8 * layout.coef, 6 * layout.coef);
      fill(255, 255, 255, 210);
      textStyle(BOLD);
      textSize(8 * layout.coef);
      textAlign(LEFT, CENTER);
      text("Shadow", panel.x + panelPadding, panel.y + titleY);
      textStyle(NORMAL);
      fill(255, 255, 255, 230);
      textSize(9 * layout.coef);
      text("(T)ype: " + SHADOW_SPECIFIC[gameState.shadow_focus].toLowerCase(), panel.x + panelPadding, panel.y + titleY + panelLineGap);
      text("(S)eries: " + gameState.gameCurrentSeries + " / " + gameState.gameSeries, panel.x + panelPadding, panel.y + titleY + panelLineGap * 2);
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
    const gaugeRadius = Math.max(12, Math.min(28 * layout.coef, layout.objectPoseSize * 0.58));
    const gaugeYOffset = 8 * layout.coef;
    const footPanelHeight = Math.max(46 * layout.coef, gaugeRadius * 2.55);
    const footPanelWidth = Math.max(50 * layout.coef, Math.min(layout.width * 0.145, 74 * layout.coef));
    const footPanelY = layout.height - (gaugeRadius + 24 * layout.coef) - footPanelHeight / 2 + gaugeYOffset;
    const footPanelX = layout.width / 2 - footPanelWidth / 2;
    const iconSize = Math.max(26 * layout.coef, Math.min(34 * layout.coef, footPanelHeight - 24 * layout.coef));

    fill(0, 0, 0, 112);
    rect(footPanelX, footPanelY, footPanelWidth, footPanelHeight, 8 * layout.coef);
    fill(255, 255, 255, 26);
    rect(footPanelX + 4 * layout.coef, footPanelY + 4 * layout.coef, footPanelWidth - 8 * layout.coef, footPanelHeight - 8 * layout.coef, 6 * layout.coef);

    const iconX = footPanelX + footPanelWidth / 2;
    const iconY = footPanelY + footPanelHeight / 2;

    fill(255, 255, 255, 192);
    circle(iconX, iconY, iconSize + 10 * layout.coef);
    if (gameState.feet_position === 0) {image(images.leftFoot, iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);}
    if (gameState.feet_position === 1) {image(images.rightFoot, iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);}
  }

  function buildShadowResult() {
    gameState.score = 0;
    for (const element of gameState.arrayScore) {
      gameState.score += element;
    }

    gameState.song_result = {};
    for (const move of gameState.curMoves) {
      if (move.type === 0) {
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

    return Object.keys(gameState.song_result)
      .filter(key => !["score", "length"].includes(key))
      .map(key => gameState.song_result[key]);
  }

  function moveSideLabel(type) {
    return [1, 3, 5, 7].includes(type) ? "L" : "R";
  }

  /* c8 ignore start */
  function shadowMoveLegendLabel(type) {
    if (type === 9) {return "B";}
    if (type === 10) {return "S";}
    return moveSideLabel(type);
  }
  /* c8 ignore end */

  function shadowMoveName(type) {
    const rawName = MOVE_TYPE[type.toString()] || "MOVE";
    return rawName
      .split("_")
      .map(part => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" ");
  }

  function shadowMoveReportCounts() {
    const counts = {};
    for (let type = 1; type <= 10; type++) {
      counts[type] = { success: 0, total: 0 };
    }

    if (!gameState.gameStarted) {
      return counts;
    }

    const activeMoveTypes = new Set();

    if (Array.isArray(gameState.moves)) {
      for (const move of gameState.moves) {
        const type = Math.trunc(move);
        /* v8 ignore next */
        if (counts[type]) {
          counts[type].total++;
          activeMoveTypes.add(type);
        }
      }
    }

    if (Array.isArray(gameState.curMoves)) {
      for (const move of gameState.curMoves) {
        if (move.hit === true && activeMoveTypes.has(move.type) && counts[move.type]) {
          counts[move.type].success++;
        }
      }
    }

    return counts;
  }

  function renderShadowMoveReportColumn(types, panel, alignRight) {
    const layout = layoutSnapshot();
    const rowHeight = 38 * layout.coef;
    const rowTopOffset = 42 * layout.coef;
    const rowInset = 10 * layout.coef;
    const markerX = alignRight ? panel.x + panel.width - 22 * layout.coef : panel.x + 22 * layout.coef;
    const textX = alignRight ? panel.x + panel.width - 42 * layout.coef : panel.x + 42 * layout.coef;
    const countsX = alignRight ? panel.x + 14 * layout.coef : panel.x + panel.width - 14 * layout.coef;
    const counts = shadowMoveReportCounts();

    for (let index = 0; index < types.length; index++) {
      const type = types[index];
      const y = panel.y + rowTopOffset + index * rowHeight;
      const display = root.TfitGameLogic.moveDisplay(type, gameState.feet_position, 220);

      fill(255, 255, 255, 20);
      rect(panel.x + rowInset, y - 13 * layout.coef, panel.width - rowInset * 2, 26 * layout.coef, 6 * layout.coef);

      if (display) {
        fill(...display.color);
      } else {
        fill(255, 255, 255, 160);
      }
      circle(markerX, y, 16 * layout.coef);
      fill(255);
      textSize(6 * layout.coef);
      textAlign(CENTER, CENTER);
      text(shadowMoveLegendLabel(type) + " " + (display ? display.text : "?"), markerX, y);

      fill(255, 255, 255, 230);
      textSize(8 * layout.coef);
      textAlign(alignRight ? RIGHT : LEFT, CENTER);
      text(shadowMoveName(type), textX, y);

      fill(255, 255, 255, 180);
      textSize(10 * layout.coef);
      textAlign(alignRight ? LEFT : RIGHT, CENTER);
      text(counts[type].success + " / " + counts[type].total, countsX, y + 3 * layout.coef);
    }
  }

  function renderShadowMoveReport() {
    const layout = layoutSnapshot();
    const leftTypes = [1, 3, 5, 7, 9];
    const rightTypes = [2, 4, 6, 8, 10];
    const panel = {
      height: 246 * layout.coef,
      margin: 10 * layout.coef,
      width: Math.min(168 * layout.coef, Math.max(92 * layout.coef, layout.width * 0.28)),
      y: Math.max(76 * layout.coef, layout.objectPoseSize + 38 * layout.coef)
    };
    const panels = [
      { ...panel, x: panel.margin },
      { ...panel, x: layout.width - panel.margin - panel.width }
    ];

    for (const currentPanel of panels) {
      fill(0, 0, 0, 112);
      rect(currentPanel.x, currentPanel.y, currentPanel.width, currentPanel.height, 8 * layout.coef);
      fill(255, 255, 255, 26);
      rect(currentPanel.x + 4 * layout.coef, currentPanel.y + 4 * layout.coef, currentPanel.width - 8 * layout.coef, currentPanel.height - 8 * layout.coef, 6 * layout.coef);
    }

    fill(255, 255, 255, 210);
    textStyle(BOLD);
    textSize(8 * layout.coef);
    textAlign(LEFT, CENTER);
    text("Moves", panels[0].x + 14 * layout.coef, panels[0].y + 16 * layout.coef);
    textAlign(RIGHT, CENTER);
    text("Moves", panels[1].x + panels[1].width - 14 * layout.coef, panels[1].y + 16 * layout.coef);
    textStyle(NORMAL);

    renderShadowMoveReportColumn(leftTypes, panels[0], false);
    renderShadowMoveReportColumn(rightTypes, panels[1], true);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
  }

  function renderShadowResultRow(result, index, layout, panel) {
    const column = index % panel.columns;
    const row = Math.floor(index / panel.columns);
    const columnX = panel.x + 16 * layout.coef + column * panel.columnWidth;
    const rowWidth = panel.columnWidth - 10 * layout.coef;
    const y = panel.rowsTop + row * panel.rowHeight;
    const labelX = columnX + 18 * layout.coef;
    const textX = columnX + 42 * layout.coef;
    const barX = columnX + 98 * layout.coef;
    const barY = y + 9 * layout.coef;
    const barWidth = Math.max(28 * layout.coef, rowWidth - 110 * layout.coef);
    const ratio = result.total > 0 ? result.success / result.total : 0;

    fill(255, 255, 255, 24);
    rect(columnX, y - 11 * layout.coef, rowWidth, 25 * layout.coef, 6 * layout.coef);

    const display = root.TfitGameLogic.moveDisplay(result.type, gameState.feet_position, 255);
    if (display) {
      fill(...display.color);
    } else {
      fill(255, 255, 255, 160);
    }
    circle(labelX, y + 2 * layout.coef, 16 * layout.coef);
    fill(255);
    textSize(6 * layout.coef);
    textAlign(CENTER, CENTER);
    text(moveSideLabel(result.type) + " " + result.text, labelX, y + 2 * layout.coef);

    fill(255, 255, 255, 230);
    textSize(8 * layout.coef);
    textAlign(LEFT, CENTER);
    text(result.success + " / " + result.total, textX, y + 2 * layout.coef);

    fill(255, 255, 255, 42);
    rect(barX, barY, barWidth, 5 * layout.coef, 4 * layout.coef);
    fill(160, 32, 240, 225);
    rect(barX, barY, barWidth * ratio, 5 * layout.coef, 4 * layout.coef);
  }

  function renderShadowResult() {
    const layout = layoutSnapshot();
    const results = buildShadowResult();
    const scoreMax = Math.max(gameState.score_max_prev, 1);
    const scoreRatio = Math.max(0, Math.min(gameState.score / scoreMax, 1));
    const panel = {
      height: Math.min(layout.height - 32 * layout.coef, 320 * layout.coef),
      width: Math.min(layout.width - 44 * layout.coef, 500 * layout.coef)
    };
    panel.x = (layout.width - panel.width) / 2;
    panel.y = (layout.height - panel.height) / 2;
    panel.columns = results.length > 4 ? 2 : 1;
    panel.columnWidth = (panel.width - 32 * layout.coef) / panel.columns;
    panel.rowsTop = panel.y + 150 * layout.coef;
    panel.rowHeight = Math.min(
      30 * layout.coef,
      Math.max(22 * layout.coef, (panel.y + panel.height - 22 * layout.coef - panel.rowsTop) / Math.max(Math.ceil(results.length / panel.columns), 1))
    );

    fill(0, 0, 0, 184);
    rect(panel.x, panel.y, panel.width, panel.height, 12 * layout.coef);
    fill(255, 255, 255, 30);
    rect(panel.x + 10 * layout.coef, panel.y + 10 * layout.coef, panel.width - 20 * layout.coef, panel.height - 20 * layout.coef, 8 * layout.coef);

    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(18 * layout.coef);
    text("Shadow Results", layout.width / 2, panel.y + 30 * layout.coef);

    noFill();
    stroke(255, 255, 255, 54);
    strokeWeight(7 * layout.coef);
    ellipse(layout.width / 2, panel.y + 82 * layout.coef, 60 * layout.coef, 60 * layout.coef);
    stroke(160, 32, 240, 230);
    arc(layout.width / 2, panel.y + 82 * layout.coef, 60 * layout.coef, 60 * layout.coef, -90, -90 + 360 * scoreRatio);
    noStroke();
    fill(255);
    textSize(20 * layout.coef);
    text(gameState.score, layout.width / 2, panel.y + 77 * layout.coef);
    textStyle(NORMAL);
    textSize(8 * layout.coef);
    text("/ " + gameState.score_max_prev, layout.width / 2, panel.y + 96 * layout.coef);

    fill(255, 255, 255, 210);
    textSize(9 * layout.coef);
    text("Move accuracy", layout.width / 2, panel.y + 126 * layout.coef);

    textAlign(LEFT, CENTER);
    for (let index = 0; index < results.length; index++) {
      renderShadowResultRow(results[index], index, layout, panel);
    }

    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    noStroke();
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
        /* c8 ignore start */
        quad(pairedX - objectPoseSize / 2, move.y - objectPoseSize / 2, pairedX + objectPoseSize / 2, move.y - objectPoseSize / 2, pairedX + objectPoseSize / 6, move.y + objectPoseSize / 2, pairedX - objectPoseSize / 6, move.y + objectPoseSize / 2);
        /* c8 ignore end */
      }
    } else {
      circle(move.x, move.y, objectPoseSize);
    }
  }

  const api = {
    drawMessagePanel,
    drawDetectionProgress,
    renderMoveShape,
    renderBackButton,
    renderCalibrationOverlay,
    renderFeetIndicator,
    renderFightButton,
    renderCalibrationResetButton,
    renderFightMeters,
    renderGuardTargets,
    renderLoadingScreen,
    renderMainMenu,
    renderRoundHud,
    renderStopButton,
    getCalibrationResetButtonBounds,
    getSettingsButtonBounds,
    renderSceneBackground,
    renderSettingsControls,
    renderShadowMoveReport,
    renderShadowResult,
    renderSpeech,
    syncPageBackground
  };

  root.TfitRender = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
