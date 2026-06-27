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
    { label: "TRAIN PAD", yIndex: 1, variant: "default" },
    { label: "FIGHT", yIndex: 2, variant: "default" },
    { label: "CONFIGURE", yIndex: 3, variant: "default" },
    { label: "PROFILE", yIndex: 4, variant: "default" }
  ];
  const BOX4FIT_SMOKE = [
    { x: 0.14, y: 0.78, r: 0.18, phase: 0.2, alpha: 15 },
    { x: 0.34, y: 0.72, r: 0.22, phase: 1.8, alpha: 12 },
    { x: 0.58, y: 0.80, r: 0.20, phase: 3.1, alpha: 14 },
    { x: 0.81, y: 0.73, r: 0.17, phase: 4.5, alpha: 13 }
  ];

  function mainMenuButtonMetrics(layout = layoutSnapshot()) {
    const buttonH = 42 * layout.coef;
    const maxGap = 24 * layout.coef;
    const minGap = 12 * layout.coef;
    const availableGap = (layout.height - buttonH * MENU_BUTTONS.length - 28 * layout.coef) / Math.max(1, MENU_BUTTONS.length - 1);
    return {
      buttonH,
      buttonGap: Math.max(minGap, Math.min(maxGap, availableGap)),
      buttonW: 100 * layout.coef,
      x: layout.width / 6 + 20 * layout.coef,
      y: Math.max(14 * layout.coef, layout.height / 6)
    };
  }

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

  function drawBox4FitBackground(t, energy = 0) {
    drawBox4FitGradientSky();
    drawBox4FitBackScreens(t);
    drawBox4FitCrowd(t);
    drawBox4FitMovingLights(t, energy);
    drawBox4FitFightFlashes(t, energy);
    drawBox4FitSmoke(t);
    drawBox4FitRingFloor(t, energy);
    drawBox4FitRingRopes(t);
    drawBox4FitCornerPosts();
    drawBox4FitForegroundVignette();
  }

  function drawBox4FitGradientSky() {
    noStroke();
    for (let y = 0; y < height; y += 4) {
      const k = y / Math.max(1, height);
      fill(5 + 11 * k, 7 + 11 * k, 18 + 20 * k);
      rect(0, y, width, 4);
    }
  }

  function drawBox4FitBackScreens(t) {
    const screenW = width * 0.22;
    const screenH = height * 0.13;
    drawBox4FitScreen(width * 0.18, height * 0.18, screenW, screenH, "BOX4FIT", t);
    drawBox4FitScreen(width * 0.70, height * 0.17, screenW, screenH, "FIGHT NIGHT", t + 2);

    noStroke();
    for (let i = 0; i < 10; i++) {
      fill(0, 210, 255, 12 - i);
      ellipse(width * 0.52, height * 0.28, width * (0.22 + i * 0.06), height * (0.08 + i * 0.03));
    }
  }

  function drawBox4FitScreen(x, y, w, h, label, t) {
    push();
    translate(x, y);
    noStroke();
    fill(0, 0, 0, 150);
    rect(0, 0, w, h, 14);

    stroke(0, 240, 255, 100 + sin(t) * 60);
    strokeWeight(3);
    noFill();
    rect(0, 0, w, h, 14);

    noStroke();
    fill(0, 230, 255, 28);
    rect(8, 8, w - 16, h - 16, 10);

    fill(255, 255, 255, 210);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(Math.min(w, h) * 0.24);
    text(label, w / 2, h / 2);
    pop();
  }

  function drawBox4FitCrowd(t) {
    noStroke();
    fill(8, 10, 18, 245);
    quad(0, height * 0.40, width, height * 0.36, width, 0, 0, 0);

    for (let row = 0; row < 4; row++) {
      const y = height * (0.32 + row * 0.045);
      for (let x = -20; x < width + 20; x += 18) {
        const flicker = 0.5 + 0.5 * sin(t * 1.6 + x * 0.04 + row * 1.7);
        fill(18 + flicker * 25, 20 + flicker * 20, 32 + flicker * 35, 180);
        ellipse(x + sin(t + row + x) * 2, y + sin(x * 0.12 + row) * 5, 10, 16);
      }
    }
  }

  function drawBox4FitMovingLights(t, energy) {
    drawBox4FitSpotlight(width * 0.18 + sin(t * 1.8) * width * 0.10, 0, width * 0.34, height * 0.82, 18 + energy * 10);
    drawBox4FitSpotlight(width * 0.82 + cos(t * 1.4) * width * 0.10, 0, width * 0.66, height * 0.82, 18 + energy * 10);
    drawBox4FitSpotlight(width * 0.45 + sin(t * 0.9) * width * 0.08, 0, width * 0.52, height * 0.78, 12);
    drawBox4FitSpotlight(width * 0.60 + cos(t * 1.1) * width * 0.08, 0, width * 0.48, height * 0.78, 12);

    for (let i = 0; i < 7; i++) {
      const x = map(i, 0, 6, width * 0.18, width * 0.82);
      noStroke();
      fill(255, 255, 255, 100);
      circle(x, height * 0.045, 12);
      fill(0, 220, 255, 40 + energy * 40);
      circle(x, height * 0.045, 42);
    }
  }

  function drawBox4FitFightFlashes(t, energy) {
    if (energy < 0.2) {
      return;
    }

    function flashJitter(seed) {
      const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return value - Math.floor(value);
    }

    const flashClock = typeof frameCount === "number" ? frameCount : t * 30;
    const seriesLength = 150;
    const activeLength = 24;
    const seriesAge = flashClock % seriesLength;
    if (seriesAge >= activeLength) {
      return;
    }

    const series = Math.floor(flashClock / seriesLength);
    const order = [0, 1, 2, 3].sort((a, b) => (
      flashJitter(series * 31 + a * 7) - flashJitter(series * 31 + b * 7)
    ));
    noStroke();
    for (let orderIndex = 0; orderIndex < order.length; orderIndex++) {
      const i = order[orderIndex];
      const flashAge = seriesAge - orderIndex * 5;
      if (flashAge >= 0 && flashAge < 7) {
        const strength = 1 - flashAge / 7;
        const jitterX = flashJitter(series * 17 + i * 29);
        const jitterY = flashJitter(series * 23 + i * 37);
        const x = width * (0.14 + i * 0.18 + jitterX * 0.14);
        const y = height * (0.08 + (i % 2) * 0.14 + jitterY * 0.10);
        fill(255, 255, 255, 70 + strength * 150);
        circle(x, y, 16 + strength * 6);
        fill(0, 210, 255, 22 + strength * 48);
        circle(x, y, 34 + strength * 18);
      }
    }
  }

  function drawBox4FitSpotlight(xTop, yTop, xBottom, yBottom, alpha) {
    noStroke();
    fill(255, 255, 255, alpha);
    quad(xTop - 24, yTop, xTop + 24, yTop, xBottom + 190, yBottom, xBottom - 190, yBottom);
  }

  function drawBox4FitSmoke(t) {
    noStroke();
    for (const smoke of BOX4FIT_SMOKE) {
      const driftX = sin(t * 0.35 + smoke.phase) * width * 0.04;
      const driftY = sin(t * 0.50 + smoke.phase) * height * 0.03;
      fill(255, 255, 255, smoke.alpha);
      ellipse(width * smoke.x + driftX, height * smoke.y + driftY, width * smoke.r, width * smoke.r * 0.48);
    }
  }

  function drawBox4FitRingFloor(t, energy) {
    noStroke();
    fill(23, 28, 47);
    quad(width * 0.18, height * 0.64, width * 0.82, height * 0.64, width * 1.08, height, width * -0.08, height);

    for (let i = 0; i < 8; i++) {
      fill(0, 200, 255, 16 - i);
      ellipse(width * 0.52, height * 0.78, width * (0.22 + i * 0.08), height * (0.04 + i * 0.018));
    }

    stroke(0, 230, 255, 35 + energy * 80);
    strokeWeight(1.5);
    for (let i = 0; i < 20; i++) {
      const y = height * 0.64 + i * height * 0.024;
      line(width * 0.18 - i * width * 0.025, y, width * 0.82 + i * width * 0.025, y);
    }

    stroke(255, 255, 255, 30);
    for (let i = 0; i < 19; i++) {
      const x = map(i, 0, 18, width * 0.18, width * 0.82);
      line(x, height * 0.64, width * 0.5 + (x - width * 0.5) * 2.2, height);
    }

    push();
    translate(width * 0.52, height * 0.80);
    rotate(-0.03);
    noStroke();
    fill(255, 255, 255, 28);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(Math.min(width, height) * 0.055);
    text("BOX4FIT", 0, 0);
    pop();
  }

  function drawBox4FitRingRopes(t) {
    const ropes = [
      { color: [255, 50, 88], y: 0.42 },
      { color: [255, 255, 255], y: 0.50 },
      { color: [255, 50, 88], y: 0.58 }
    ];

    for (let r = 0; r < ropes.length; r++) {
      stroke(0, 0, 0, 90);
      strokeWeight(9);
      const y = height * ropes[r].y;
      line(width * 0.05, y + 5, width * 0.95, y - 8);

      stroke(ropes[r].color[0], ropes[r].color[1], ropes[r].color[2], 210);
      strokeWeight(5);
      line(width * 0.05, y, width * 0.95, y - 10 + sin(t + r) * 2);
    }
  }

  function drawBox4FitCornerPosts() {
    stroke(18, 20, 28);
    strokeWeight(16);
    line(width * 0.055, height * 0.35, width * 0.055, height * 0.72);
    line(width * 0.945, height * 0.33, width * 0.945, height * 0.72);

    stroke(210, 210, 220);
    strokeWeight(8);
    line(width * 0.055, height * 0.35, width * 0.055, height * 0.72);
    line(width * 0.945, height * 0.33, width * 0.945, height * 0.72);

    noStroke();
    fill(255, 55, 90);
    rect(width * 0.033, height * 0.39, width * 0.045, height * 0.09, 8);
    rect(width * 0.922, height * 0.38, width * 0.045, height * 0.09, 8);
  }

  function drawBox4FitForegroundVignette() {
    noFill();
    for (let i = 0; i < 20; i++) {
      stroke(0, 0, 0, 8);
      strokeWeight(22);
      rect(-i * 8, -i * 8, width + i * 16, height + i * 16, 32);
    }
  }

  function syncPageBackground(menu = gameState.menu) {
    if (!root.document || !root.document.body) {
      return false;
    }

    root.document.body.style.setProperty("--app-background-image", "none");
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
      drawBox4FitBackground(frameCount * 0.035, 0.22);
    } else if (gameState.menu === 1 || gameState.menu === 5) {
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
    const menu = mainMenuButtonMetrics(layout);

    fill(0, 0, 0);
    image(images.logo, layout.width - 60 * layout.coef, layout.height - 55 * layout.coef, 50 * layout.coef, 50 * layout.coef);

    const panelX = layout.width * 0.60;
    const panelY = layout.height / 12;
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
        x: menu.x,
        y: Math.trunc(menu.y + index * (menu.buttonH + menu.buttonGap)),
        w: menu.buttonW,
        h: menu.buttonH
      });
    });

    const anim = frameCount * 0.045;
    drawUpperWireBoxer(
      panelX,
      panelY + panelH + 360,
      1.35,
      anim,
      false,
      false
    );
  }

  function getMainMenuButtonBounds(index) {
    const layout = layoutSnapshot();
    const menu = mainMenuButtonMetrics(layout);
    const y = Math.trunc(menu.y + index * (menu.buttonH + menu.buttonGap));
    return {
      left: Math.trunc(menu.x),
      right: Math.trunc(menu.x + menu.buttonW),
      top: y,
      bottom: Math.trunc(y + menu.buttonH)
    };
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

  function drawUpperSkeleton(sway, breathe, bob, punch, guard, glow, target, blinkHand = null) {
    noFill();
    if (typeof strokeCap === "function") {
      strokeCap(typeof ROUND === "undefined" ? "round" : ROUND);
    }
    if (typeof strokeJoin === "function") {
      strokeJoin(typeof ROUND === "undefined" ? "round" : ROUND);
    }

    const headX = sway * 0.35;
    const headY = -230 + bob;

    const neckX = sway * 0.3;
    const neckY = -160 + bob;

    const chestX = sway * 0.2;
    const chestY = -80 + breathe + bob;

    const waistX = sway * 0.08;
    const waistY = 55 + bob;

    const lShoulderX = -66 + sway * 0.35;
    const lShoulderY = -122 + breathe + bob;

    const rShoulderX = 66 + sway * 0.35;
    const rShoulderY = -122 + breathe + bob;

    const hasTarget = target && Number.isFinite(target.x) && Number.isFinite(target.y);
    const targetSide = hasTarget
      ? (target.side || (target.x < 0 ? "left" : "right"))
      : null;
    const targetReach = Math.max(0, Math.min(1, target && target.reach != null ? target.reach : 1));
    const targetX = hasTarget ? target.x : 0;
    const targetY = hasTarget ? target.y : 0;
    const leftPunch = hasTarget && targetSide === "left" ? targetReach : 0;
    const rightPunch = hasTarget && targetSide === "right" ? targetReach : 0;
    const resolvedBlinkHand = blinkHand || (hasTarget
      ? (targetSide === "left" ? "right" : "left")
      : "right");
    const leftBlink = resolvedBlinkHand === "left" ? punch : 0;
    const rightBlink = resolvedBlinkHand === "right" ? punch : 0;

    // guard brings both gloves closer to face
    let lElbowX = lerpLocal(-118 + sway * 0.2, -80, guard);
    let lElbowY = lerpLocal(-62 + bob, -125 + bob, guard);

    let lGloveX = lerpLocal(-150 + sway * 0.15, -58 + sway * 0.2, guard);
    let lGloveY = lerpLocal(-8 + bob, -178 + bob, guard);

    let rElbowBaseX = lerpLocal(116 + sway * 0.2, 82, guard);
    let rElbowBaseY = lerpLocal(-70 + bob, -126 + bob, guard);

    let rElbowX = rElbowBaseX + rightPunch * 95;
    let rElbowY = rElbowBaseY - rightPunch * 20;

    let rGloveBaseX = lerpLocal(145 + sway * 0.15, 60 + sway * 0.2, guard);
    let rGloveBaseY = lerpLocal(-16 + bob, -174 + bob, guard);

    let rGloveX = rGloveBaseX + rightPunch * 205;
    let rGloveY = rGloveBaseY - rightPunch * 20;

    if (leftPunch > 0) {
      lElbowX = lElbowX + (targetX - lElbowX) * 1;
      lElbowY = lElbowY + (targetY - lElbowY) * 1;
      lGloveX = targetX;
      lGloveY = targetY;
    }

    if (rightPunch > 0) {
      rElbowX = rElbowBaseX + (targetX - rElbowBaseX) * 1;
      rElbowY = rElbowBaseY + (targetY - rElbowBaseY) * 1;
      rGloveX = targetX;
      rGloveY = targetY;
    }

    // head wire sphere
    ellipse(headX, headY, 78, 92);
    arc(headX, headY, 78, 92, -Math.PI / 2, Math.PI / 2);
    arc(headX, headY, 78, 92, Math.PI / 2, (3 * Math.PI) / 2);
    line(headX - 36, headY, headX + 36, headY);

    // neck + torso
    line(headX, headY + 46, neckX, neckY);
    line(neckX, neckY, chestX, chestY);
    line(chestX, chestY, waistX, waistY);

    // torso cage
    ellipse(chestX, chestY - 4, 140, 128 + breathe);
    line(lShoulderX, lShoulderY, rShoulderX, rShoulderY);
    line(lShoulderX, lShoulderY, -52, waistY);
    line(rShoulderX, rShoulderY, 52, waistY);
    line(-52, waistY, 52, waistY);

    // shoulder/pec mesh
    /* c8 ignore next */
    if (!glow) {
      line(chestX - 68, chestY - 24, chestX + 68, chestY - 24);
      line(chestX - 54, chestY + 22, chestX + 54, chestY + 22);
      line(chestX, chestY - 68, chestX, chestY + 70);
      arc(chestX - 38, chestY + 18, 42, 36, 0, Math.PI);
      arc(chestX + 38, chestY + 18, 42, 36, 0, Math.PI);
    }

    // arms
    line(lShoulderX, lShoulderY, lElbowX, lElbowY);
    line(lElbowX, lElbowY, lGloveX, lGloveY);

    line(rShoulderX, rShoulderY, rElbowX, rElbowY);
    line(rElbowX, rElbowY, rGloveX, rGloveY);

    // gloves
    ellipse(lGloveX, lGloveY, 82 + guard * 10 + leftBlink * 14, 76 + guard * 8 + leftBlink * 8);
    line(lGloveX - 34, lGloveY, lGloveX + 34, lGloveY);

    ellipse(rGloveX, rGloveY, 82 + rightBlink * 34 + guard * 10, 76 + rightBlink * 24 + guard * 8);
    line(rGloveX - 34, rGloveY, rGloveX + 34, rGloveY);
  }

  function drawUpperJoints(sway, breathe, bob, punch, guard, target) {
    const pts = getJointPoints(sway, breathe, bob, punch, guard, target);
    noStroke();
    for (const p of pts) {
      fill(0, 255, 255, 70);
      ellipse(p[0], p[1], p[2] * 3.1);
      fill(255);
      ellipse(p[0], p[1], p[2]);
    }
  }

  function drawPunchFX(punch) {
    stroke(255, 255, 255, 170 * punch);
    strokeWeight(2);
    for (let i = 0; i < 10; i++) {
      const y = -205 + i * 14;
      line(220 - i * 8, y, 420 + punch * 80, y - 26 + i * 5);
    }

    noStroke();
    fill(255, 255, 255, 235 * punch);
    textSize(36 + punch * 10);
    textStyle(BOLD);
    text("JAB!", 190, -230);
  }

  function drawUpperWireBoxer(cx, cy, s, t, attack, guard, target, suppressFx = false, blinkHand = null) {
    push();
    translate(cx, cy);
    if (typeof scale === "function") {
      scale(s);
    }

    const breathe = Math.sin(t * 1.7) * 6;
    const sway = Math.sin(t) * 12;
    const bob = Math.abs(Math.sin(t * 1.35)) * 7;
    const punch = attack ? Math.pow(Math.max(0, Math.sin(frameCount * 0.30)), 0.34) : 0;
    const g = guard ? 1 : 0;

    // chest shadow only, no legs
    noStroke();
    fill(0, 255, 255, 15);
    ellipse(0, 165, 260 + punch * 30, 32);

    // glow
    stroke(0, 220, 255, 35);
    strokeWeight(18);
    drawUpperSkeleton(sway, breathe, bob, punch, g, true, target, blinkHand);

    stroke(35, 255, 220, 90);
    strokeWeight(7);
    drawUpperSkeleton(sway, breathe, bob, punch, g, true, target, blinkHand);

    // crisp lines
    stroke(215, 255, 255, 245);
    strokeWeight(3.2);
    drawUpperSkeleton(sway, breathe, bob, punch, g, false, target, blinkHand);

    drawUpperJoints(sway, breathe, bob, punch, g, target);

    /* c8 ignore next */
    if (attack && !suppressFx) {
      drawPunchFX(punch);
    }

    pop();
  }

  function getJointPoints(sway, breathe, bob, punch, guard, target) {
    const hasTarget = target && Number.isFinite(target.x) && Number.isFinite(target.y);
    const targetSide = hasTarget
      ? (target.side || (target.x < 0 ? "left" : "right"))
      : null;
    const targetReach = Math.max(0, Math.min(1, target && target.reach != null ? target.reach : 1));
    const targetX = hasTarget ? target.x : 0;
    const targetY = hasTarget ? target.y : 0;
    const lPunch = hasTarget && targetSide === "left" ? targetReach : 0;
    const rPunch = hasTarget && targetSide === "right" ? targetReach : 0;

    const lElbowX = lerpLocal(-118 + sway * 0.2, -80, guard);
    const lElbowY = lerpLocal(-62 + bob, -125 + bob, guard);
    const lGloveX = lerpLocal(-150 + sway * 0.15, -58 + sway * 0.2, guard);
    const lGloveY = lerpLocal(-8 + bob, -178 + bob, guard);

    const rElbowBaseX = lerpLocal(116 + sway * 0.2, 82, guard);
    const rElbowBaseY = lerpLocal(-70 + bob, -126 + bob, guard);
    const rGloveBaseX = lerpLocal(145 + sway * 0.15, 60 + sway * 0.2, guard);
    const rGloveBaseY = lerpLocal(-16 + bob, -174 + bob, guard);

    const lElbow = [
      lElbowX + (lPunch * (targetX - lElbowX) * 1),
      lElbowY + (lPunch * (targetY - lElbowY) * 1)
    ];
    const lGlove = [targetX, targetY];
    const rElbow = [
      rElbowBaseX + (rPunch * (targetX - rElbowBaseX) * 1),
      rElbowBaseY + (rPunch * (targetY - rElbowBaseY) * 1)
    ];
    const rGlove = [targetX, targetY];

    return [
      [sway * 0.35, -230 + bob, 11],
      [sway * 0.3, -160 + bob, 8],
      [sway * 0.2, -80 + breathe + bob, 9],
      [sway * 0.08, 55 + bob, 9],
      [-66 + sway * 0.35, -122 + breathe + bob, 8],
      [66 + sway * 0.35, -122 + breathe + bob, 8],
      [lElbow[0], lElbow[1], 7],
      [lGlove[0], lGlove[1], 11],
      [rElbow[0], rElbow[1], 7],
      [rGlove[0], rGlove[1], 12],
      [-52, 55 + bob, 7],
      [52, 55 + bob, 7]
    ];
  }

  function lerpLocal(a, b, t) {
    return a + (b - a) * t;
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

  function getProfileEditButtonBounds() {
    const layout = layoutSnapshot();
    const buttonWidth = 150 * layout.coef;
    const buttonHeight = 42 * layout.coef;
    return {
      left: layout.width / 2 - buttonWidth / 2,
      right: layout.width / 2 + buttonWidth / 2,
      top: Math.trunc(layout.height / 2 - 30 * layout.coef),
      bottom: Math.trunc(layout.height / 2 - 30 * layout.coef + buttonHeight)
    };
  }

  function getProfileViewButtonBounds() {
    const layout = layoutSnapshot();
    const buttonWidth = 150 * layout.coef;
    const buttonHeight = 42 * layout.coef;
    return {
      left: layout.width / 2 - buttonWidth / 2,
      right: layout.width / 2 + buttonWidth / 2,
      top: Math.trunc(layout.height / 2 + 24 * layout.coef),
      bottom: Math.trunc(layout.height / 2 + 24 * layout.coef + buttonHeight)
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

  function renderProfileScreen() {
    const layout = layoutSnapshot();
    const editBounds = getProfileEditButtonBounds();
    const viewBounds = getProfileViewButtonBounds();
    const editing = Boolean(gameState.profileNameEditing);
    const viewingStats = Boolean(gameState.profileStatsVisible) && !editing;
    const name = editing
      ? (gameState.profileNameDraft || "_")
      : root.TfitFaceRecognition?.selectedProfile?.().name || "Unknown player";
    const profileStats = root.TfitFaceRecognition?.selectedProfileStats?.() || {};

    if (viewingStats) {
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(16 * layout.coef);
      fill(255, 255, 255, 218);
      text("Calories burned", layout.width / 2, layout.height / 2 - 22 * layout.coef);
      textStyle(NORMAL);
      textSize(30 * layout.coef);
      fill(255, 255, 255, 238);
      text(`${(Number(profileStats.caloriesBurned) || 0).toFixed(1)} kcal`, layout.width / 2, layout.height / 2 + 12 * layout.coef);
      textSize(11 * layout.coef);
      fill(255, 255, 255, 210);
      text("Games played", layout.width / 2, layout.height / 2 + 52 * layout.coef);
      textStyle(BOLD);
      textSize(12 * layout.coef);
      fill(255, 255, 255, 232);
      text(`Shadow: ${Number(profileStats.gameCounts?.shadow) || 0}`, layout.width / 2, layout.height / 2 + 74 * layout.coef);
      text(`Train pad: ${Number(profileStats.gameCounts?.trainPad) || 0}`, layout.width / 2, layout.height / 2 + 94 * layout.coef);
      text(`Fight: ${Number(profileStats.gameCounts?.fight) || 0}`, layout.width / 2, layout.height / 2 + 114 * layout.coef);
      return;
    }

    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(24 * layout.coef);
    fill(255, 255, 255, 230);
    text("PROFILE", layout.width / 2, layout.height / 2 - 92 * layout.coef);

    textStyle(NORMAL);
    textSize(14 * layout.coef);
    fill(225, 225, 225, 210);
    text(editing ? `Name: ${name}` : name, layout.width / 2, layout.height / 2 - 62 * layout.coef);

    /* v8 ignore next */
    if (editing) {
      textSize(10 * layout.coef);
      fill(210, 210, 210, 185);
      text("Spell with keyboard - Enter saves - Esc cancels", layout.width / 2, layout.height / 2 - 38 * layout.coef);
    }

    drawMenuButton({
      label: "EDIT",
      variant: "default",
      x: editBounds.left,
      y: editBounds.top,
      w: editBounds.right - editBounds.left,
      h: editBounds.bottom - editBounds.top
    });

    drawMenuButton({
      label: "VIEW",
      variant: "default",
      x: viewBounds.left,
      y: viewBounds.top,
      w: viewBounds.right - viewBounds.left,
      h: viewBounds.bottom - viewBounds.top
    });
  }

  function renderGuardTargets() {
    const layout = layoutSnapshot();

    fill(255, 255, 255, 56);
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

    function drawCalorieCounter() {
      const panelWidth = Math.max(106 * layout.coef, Math.min(144 * layout.coef, layout.width * 0.28));
      const panelHeight = 50 * layout.coef;
      const panelX = layout.width - panelWidth - 14 * layout.coef;
      const panelY = 40 * layout.coef;
      const calories = Number(gameState.caloriesBurned) || 0;

      noStroke();
      fill(0, 0, 0, 126);
      rect(panelX, panelY, panelWidth, panelHeight, 8 * layout.coef);
      fill(255, 255, 255, 28);
      rect(panelX + 4 * layout.coef, panelY + 4 * layout.coef, panelWidth - 8 * layout.coef, panelHeight - 8 * layout.coef, 6 * layout.coef);

      textAlign(LEFT, CENTER);
      textStyle(BOLD);
      fill(255, 255, 255, 198);
      textSize(8 * layout.coef);
      text("CALORIES", panelX + 12 * layout.coef, panelY + 16 * layout.coef);

      fill(255, 255, 255, 238);
      textSize(16 * layout.coef);
      text(`${calories.toFixed(1)} kcal`, panelX + 12 * layout.coef, panelY + 34 * layout.coef);
    }

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

    drawCalorieCounter();

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
    if (gameState.menu === 4) {
      const panelPadding = 10 * layout.coef;
      const panelLineGap = 18 * layout.coef;
      const titleY = 14 * layout.coef;
      const panel = {
        height: 72 * layout.coef,
        width: Math.min(188 * layout.coef, Math.max(112 * layout.coef, layout.width * 0.3)),
        x: 10 * layout.coef,
        y: 14 * layout.coef
      };
      const opponentConfig = OPPONENTS[gameState.opponent] || OPPONENTS["0"] || {};
      fill(0, 0, 0, 112);
      rect(panel.x, panel.y, panel.width, panel.height, 8 * layout.coef);
      fill(255, 255, 255, 26);
      rect(panel.x + 4 * layout.coef, panel.y + 4 * layout.coef, panel.width - 8 * layout.coef, panel.height - 8 * layout.coef, 6 * layout.coef);
      fill(255, 255, 255, 210);
      textStyle(BOLD);
      textSize(8 * layout.coef);
      textAlign(LEFT, CENTER);
      text("Fight", panel.x + panelPadding, panel.y + titleY);
      textStyle(NORMAL);
      fill(255, 255, 255, 230);
      textSize(9 * layout.coef);
      text("(O)pponent: " + (opponentConfig.name || "Raja").toLowerCase(), panel.x + panelPadding, panel.y + titleY + panelLineGap);
      text("Series: " + gameState.gameCurrentSeries + " / " + gameState.gameSeries, panel.x + panelPadding, panel.y + titleY + panelLineGap * 2);
    }
    textSize(10 * layout.coef);
    fill(255, 0, 0, hide_sensor);
  }

  function renderFightMeters() {
    const layout = layoutSnapshot();
    const barWidth = 150 * layout.coef;
    const barHeight = 20;
    const gaugeRadius = Math.max(12, Math.min(28 * layout.coef, layout.objectPoseSize * 0.58));
    const opponentX = layout.width / 2 - barWidth / 2;
    const opponentY = 18 * layout.coef;
    const playerX = layout.width / 2 - barWidth / 2;
    const playerY = layout.height - 38 * layout.coef;
    const opponentMaxStamina = Math.max(OPPONENTS[gameState.opponent].stamina, 1);
    const opponentProgress = Math.max(0, Math.min(gameState.my_opponent.stamina, opponentMaxStamina)) / opponentMaxStamina;
    const playerStamina = gameState.gameStarted && Number.isFinite(gameState.my_stamina) ? gameState.my_stamina : opponentMaxStamina;
    const playerProgress = Math.max(0, Math.min(playerStamina, opponentMaxStamina)) / opponentMaxStamina;
    const opponentName = OPPONENTS[gameState.opponent].name || "OPPONENT";

    function drawFightBar({ x, y, progress, label }) {
      stroke(255, 255, 255, 42);
      strokeWeight(3);
      noFill();
      rect(x, y, barWidth, barHeight);
      noStroke();
      fill(94, 22, 34, 185);
      rect(x + 2, y + 2, barWidth - 2 * layout.coef, 16);
      fill(245, 238, 214, 224);
      rect(x + 2, y + 2, (barWidth - 2 * layout.coef) * progress, 16);
      fill(245, 238, 214, 218);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(8 * layout.coef);
      text(label, x + barWidth / 2, y - 9 * layout.coef);
    }

    drawFightBar({
      x: opponentX,
      y: opponentY,
      progress: opponentProgress,
      label: opponentName.toUpperCase()
    });
    drawFightBar({
      x: playerX,
      y: playerY,
      progress: playerProgress,
      label: "YOU"
    });
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
      /* c8 ignore next */
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
      /* c8 ignore next */
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

  function fightOpponentActionFromType(type) {
    const actions = {
      1: "ljab",
      2: "rjab",
      3: "lhook",
      4: "rhook",
      5: "luppercut",
      6: "ruppercut"
    };
    return actions[type] || "";
  }

  function fightOpponentMoveParams(action, phase) {
    const hand = action[0] === "l" ? "left" : action[0] === "r" ? "right" : "";
    const punch = hand ? action.substring(1) : "";
    const side = hand === "left" ? -1 : hand === "right" ? 1 : 0;
    const clampedPhase = Math.max(0, Math.min(1, phase));
    const load = clampedPhase < 0.38 ? easeOutSineLocal(map(clampedPhase, 0, 0.38, 0, 1, true)) : 0;
    const strike = clampedPhase >= 0.30 && clampedPhase < 0.72 ? easeOutBackLocal(map(clampedPhase, 0.30, 0.72, 0, 1, true)) : 0;
    const impact = clampedPhase > 0.56 && clampedPhase < 0.72 ? Math.sin(map(clampedPhase, 0.56, 0.72, 0, Math.PI, true)) : 0;

    if (punch === "hook") {
      return {
        action,
        hand,
        punch,
        side,
        load,
        strike,
        impact,
        bodyX: side * load * 70 - side * strike * 34,
        bodyY: load * 8,
        bodyRot: -side * load * 0.20 + side * strike * 0.22,
        headRot: -side * load * 0.10 + side * strike * 0.08
      };
    }

    if (punch === "uppercut") {
      return {
        action,
        hand,
        punch,
        side,
        load,
        strike,
        impact,
        bodyX: -side * load * 10 + side * strike * 8,
        bodyY: load * 92 - strike * 52,
        bodyRot: side * load * 0.08 - side * strike * 0.10,
        headRot: side * load * 0.07 - side * strike * 0.04
      };
    }

    if (punch === "jab") {
      return {
        action,
        hand,
        punch,
        side,
        load: load * 0.45,
        strike,
        impact,
        bodyX: -side * load * 6 + side * strike * 6,
        bodyY: 0,
        bodyRot: -side * load * 0.05 + side * strike * 0.04,
        headRot: 0
      };
    }

    return {
      action: "",
      hand: "",
      punch: "",
      side: 0,
      load: 0,
      strike: 0,
      impact: 0,
      bodyX: 0,
      bodyY: 0,
      bodyRot: 0,
      headRot: 0
    };
  }

  function applyFightOpponentPunchPositions(move, sway, out) {
    if (!move.hand) {return;}
    const sign = move.hand === "left" ? -1 : 1;
    const baseX = sign === -1 ? -97 + sway : 88 + sway * 0.2;
    const baseY = sign === -1 ? -18 : -25;
    const baseScale = sign === -1 ? 1 : 1.04;
    let x = baseX;
    let y = baseY;
    let scaleValue = baseScale;

    if (move.punch === "jab") {
      x = lerpLocal(sign * 76 - sign * move.load * 18, -sign * 6, move.strike);
      y = lerpLocal(-84 - move.load * 8, -112, move.strike);
      scaleValue = 1.08 + move.strike * 2.7;
    }

    if (move.punch === "hook") {
      x = sign * (88 + move.load * 165 - move.strike * 230);
      y = -35 + move.load * 12 - move.strike * 60;
      scaleValue = 1.05 + move.strike * 1.75;
    }

    if (move.punch === "uppercut") {
      x = sign * (84 - move.load * 45 - move.strike * 80);
      y = -25 + move.load * 175 - move.strike * 190;
      scaleValue = 1.05 + move.strike * 2;
    }

    if (sign === -1) {
      out.setLeft(x, y, scaleValue);
    } else {
      out.setRight(x, y, scaleValue);
    }
  }

  function fightOpponentArmOffset(move, armSide, part) {
    if (move.side !== armSide) {return 0;}
    const load = move.load;
    const strike = move.strike;

    if (move.punch === "hook") {
      const values = {
        shoulderX: armSide * load * 45,
        shoulderY: 0,
        forearmX: armSide * (load * 70 - strike * 40),
        forearmY: load * 12 - strike * 18,
        shineX: armSide * load * 80,
        shineY: load * 5
      };
      return values[part] || 0;
    }

    if (move.punch === "uppercut") {
      const values = {
        shoulderX: -armSide * load * 12,
        shoulderY: load * 42,
        forearmX: -armSide * load * 28,
        forearmY: load * 85 - strike * 55,
        shineX: -armSide * load * 20,
        shineY: load * 70
      };
      return values[part] || 0;
    }

    if (move.punch === "jab") {
      const values = {
        shoulderX: armSide * strike * 18,
        shoulderY: -strike * 10,
        forearmX: armSide * strike * 25,
        forearmY: -strike * 16,
        shineX: armSide * strike * 25,
        shineY: -strike * 16
      };
      return values[part] || 0;
    }

    return 0;
  }

  function drawFightOpponentTrails(move) {
    return;
  }

  const RAJA_OPPONENT_PALETTE = {
    skinDark: "#5a241d",
    skinBase: "#bf6a53",
    skinLight: "#d47d65",
    skinHighlight: [255, 185, 135, 150],
    skinLine: "#7b392d",
    mouthLine: "#5b241f",
    armDark: "#9a4f40",
    armBase: "#c46b55",
    armHighlight: [255, 185, 135, 130],
    neck: "#b85f4b",
    gloveDark: "#164b28",
    gloveMid: "#245e31",
    gloveLight: "#3f7c43",
    gloveHighlight: "#78b176",
    gloveShadow: "#0e351d"
  };

  function opponentPalette(overrides = {}) {
    return {
      ...RAJA_OPPONENT_PALETTE,
      ...overrides
    };
  }

  function drawFightOpponentGlove(x, y, scaleValue, front, palette = RAJA_OPPONENT_PALETTE) {
    push();
    translate(x, y);
    if (typeof scale === "function") {
      scale(scaleValue);
    }
    noStroke();
    fill(palette.gloveDark);
    ellipse(2, 42, 88, 88);
    rect(-33, 55, 72, 38, 8);
    fill(palette.gloveMid);
    ellipse(0, 12, 105, 120);
    fill(palette.gloveLight);
    ellipse(5, 0, 92, 108);
    fill(palette.gloveHighlight);
    arc(-6, -32, 70, 34, Math.PI, Math.PI * 2);
    fill(palette.gloveDark);
    arc(-22, 15, 50, 74, -1, 1.55);
    rect(-30, 58, 74, 34, 7);
    if (front) {
      fill(palette.gloveShadow);
      arc(0, 45, 92, 77, 0.2, 2.8);
    }
    pop();
  }

  function drawFightOpponentLabel(move, leftGlove, rightGlove) {
    return;
  }

  function fightOpponentHitReactionParams(reaction) {
    if (!reaction || !Number.isFinite(reaction.frame) || !Number.isFinite(reaction.duration) || reaction.duration <= 0) {
      return {
        bodyRot: 0,
        bodyX: 0,
        bodyY: 0,
        flash: 0,
        headRot: 0,
        headX: 0,
        headY: 0
      };
    }

    const type = Number(reaction.type) || 0;
    const power = Math.max(0, 1 - reaction.frame / reaction.duration);
    const pulse = Math.sin(power * Math.PI * 0.5);
    const side = [3, 5, 1].includes(type) ? 1 : -1;
    if (type === 3 || type === 4) {
      return {
        bodyRot: side * 0.20 * pulse,
        bodyX: side * 70 * pulse,
        bodyY: 0,
        flash: pulse,
        headRot: side * 0.30 * pulse,
        headX: side * 24 * pulse,
        headY: -3 * pulse
      };
    }

    return {
      bodyRot: side * 0.08 * pulse,
      bodyX: side * 18 * pulse,
      bodyY: -20 * pulse,
      flash: pulse,
      headRot: side * 0.20 * pulse,
      headX: side * 8 * pulse,
      headY: -8 * pulse
    };
  }

  function easeOutBackLocal(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  function easeOutSineLocal(x) {
    return Math.sin((x * Math.PI) / 2);
  }

  function renderRajaOpponentCharacter({
    frame = -1,
    layout = layoutSnapshot(),
    opponent = {},
    palette: paletteOverrides = {},
    reaction = root.animationState && root.animationState.opponent ? root.animationState.opponent.reaction : null,
    type = 0
  } = {}) {
    const action = fightOpponentActionFromType(type);
    const phase = frame >= 0 ? Math.min(frame, 6) / 6 : 0;
    const move = fightOpponentMoveParams(action, phase);
    const hitReaction = fightOpponentHitReactionParams(reaction);
    const scaleValue = (Math.min(layout.width, layout.height) / 780) * (opponent.scale || 0.7);
    const cx = layout.width * (opponent.xRatio || 0.5);
    const cy = layout.height * (opponent.yRatio || 0.56);
    const t = frameCount || 0;
    const sway = Math.sin(t * 0.035) * 5;
    const palette = opponentPalette(paletteOverrides);

    push();
    translate(cx + move.bodyX + hitReaction.bodyX, cy + move.bodyY + hitReaction.bodyY + Math.sin(t * 0.055) * 7 * scaleValue);
    if (typeof scale === "function") {
      scale(scaleValue);
    }
    if (typeof rotate === "function") {
      rotate(Math.sin(t * 0.025) * 0.012 + move.bodyRot + hitReaction.bodyRot);
    }

    noStroke();
    fill(0, 0, 0, 80);
    ellipse(0, 295, 250, 40);

    fill("#6a0710");
    rect(-85, 145, 170, 145, 24);
    fill("#a43652");
    rect(-74, 145, 148, 140, 22);
    fill("#d15f90");
    rect(42, 182, 23, 86, 16);
    fill("#d15f90");
    rect(-62, 230, 21, 55, 14);
    fill("#5b0710");
    rect(-91, 143, 182, 24, 8);
    stroke("#2b1425");
    strokeWeight(6);
    for (let i = -62; i < 72; i += 25) {
      line(i, 148, i, 168);
    }

    noStroke();
    fill(palette.skinDark);
    ellipse(-48, 85, 65, 155);
    ellipse(52, 83, 70, 158);
    fill(palette.skinBase);
    ellipse(0, 35, 150, 235);
    fill(palette.skinLight);
    ellipse(0, 5, 118, 176);
    fill(...palette.skinHighlight);
    ellipse(-34, 44, 55, 22);
    ellipse(63, 2, 16, 48);
    ellipse(-72, 42, 13, 50);
    stroke(palette.skinLine);
    strokeWeight(5);
    noFill();
    arc(-12, 80, 38, 85, 0.15, 1.35);
    arc(25, 78, 40, 82, 1.85, 3);
    line(0, 89, 0, 128);
    line(-22, 105, -34, 131);
    line(21, 105, 34, 132);

    const leftGlove = { x: -97 + sway, y: -18, scale: 1 };
    const rightGlove = { x: 88 + sway * 0.2, y: -25, scale: 1.04 };
    applyFightOpponentPunchPositions(move, sway, {
      setLeft: (x, y, gloveScale) => {
        leftGlove.x = x;
        leftGlove.y = y;
        leftGlove.scale = gloveScale;
      },
      setRight: (x, y, gloveScale) => {
        rightGlove.x = x;
        rightGlove.y = y;
        rightGlove.scale = gloveScale;
      }
    });

    noStroke();
    fill(palette.armDark);
    ellipse(-93 + fightOpponentArmOffset(move, -1, "shoulderX"), 55 + fightOpponentArmOffset(move, -1, "shoulderY"), 50, 145);
    ellipse(96 + fightOpponentArmOffset(move, 1, "shoulderX"), 58 + fightOpponentArmOffset(move, 1, "shoulderY"), 54, 150);
    fill(palette.armBase);
    ellipse(-104 + fightOpponentArmOffset(move, -1, "forearmX"), 95 + fightOpponentArmOffset(move, -1, "forearmY"), 62, 126);
    ellipse(110 + fightOpponentArmOffset(move, 1, "forearmX"), 91 + fightOpponentArmOffset(move, 1, "forearmY"), 62, 130);
    fill(...palette.armHighlight);
    ellipse(-128 + fightOpponentArmOffset(move, -1, "shineX"), 75 + fightOpponentArmOffset(move, -1, "shineY"), 14, 41);
    ellipse(128 + fightOpponentArmOffset(move, 1, "shineX"), 58 + fightOpponentArmOffset(move, 1, "shineY"), 14, 45);
    ellipse(97, 16, 12, 37);

    push();
    translate(hitReaction.headX, 7 + hitReaction.headY);
    if (typeof rotate === "function") {
      rotate(move.headRot + hitReaction.headRot);
    }
    if (hitReaction.flash > 0) {
      noStroke();
      fill(255, 255, 255, 110 * hitReaction.flash);
      ellipse(0, -170, 180 + hitReaction.flash * 120, 140 + hitReaction.flash * 72);
      fill(255, 70, 90, 95 * hitReaction.flash);
      ellipse(-34 * hitReaction.flash, -205, 76 + hitReaction.flash * 58, 42 + hitReaction.flash * 36);
    }
    fill(palette.neck);
    rect(-25, -129, 50, 52, 20);
    fill(palette.armBase);
    ellipse(-60, -166, 18, 45);
    ellipse(0, -170, 112, 139);
    fill(palette.skinLight);
    ellipse(5, -177, 93, 122);
    fill(palette.skinLight);
    ellipse(60, -166, 18, 45);
    fill("#101010");
    ellipse(-18, -174, 14, 24);
    ellipse(25, -174, 14, 24);
    fill(255);
    ellipse(-22, -181, 4, 5);
    ellipse(21, -181, 4, 5);
    stroke(palette.skinLine);
    strokeWeight(5);
    noFill();
    arc(4, -154, 20, 25, 1.8, 4.7);
    line(2, -151, 12, -145);
    stroke(palette.mouthLine);
    strokeWeight(4);
    arc(5, -124, 42, 14, 0.1, 2.8);
    line(-10, -131, 21, -131);
    pop();

    drawFightOpponentTrails(move);
    drawFightOpponentGlove(leftGlove.x, leftGlove.y, leftGlove.scale, move.hand === "left", palette);
    drawFightOpponentGlove(rightGlove.x, rightGlove.y, rightGlove.scale, move.hand === "right", palette);
    drawFightOpponentLabel(move, leftGlove, rightGlove);

    pop();
  }

  function renderFightOpponentCharacter(options = {}) {
    const opponent = (root.OPPONENTS && root.OPPONENTS[gameState.opponent]) || (root.OPPONENTS && root.OPPONENTS["0"]) || {};
    const renderer = opponent.renderer && root.TfitOpponentRenderers
      ? root.TfitOpponentRenderers[opponent.renderer]
      : null;
    if (renderer && typeof renderer.render === "function") {
      return renderer.render({
        ...options,
        opponent
      });
    }
    return renderRajaOpponentCharacter({
      ...options,
      opponent
    });
  }

  const api = {
    drawMessagePanel,
    drawDetectionProgress,
    renderFightOpponentCharacter,
    renderRajaOpponentCharacter,
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
    renderProfileScreen,
    renderRoundHud,
    renderStopButton,
    getCalibrationResetButtonBounds,
    getMainMenuButtonBounds,
    getProfileEditButtonBounds,
    getProfileViewButtonBounds,
    getSettingsButtonBounds,
    renderSceneBackground,
    renderSettingsControls,
    renderShadowMoveReport,
    renderShadowResult,
    renderSpeech,
    syncPageBackground
  };

  Object.defineProperty(api, "__drawUpperWireBoxerForTest", {
    value: drawUpperWireBoxer,
    writable: true,
    configurable: true,
    enumerable: false
  });
  Object.defineProperty(api, "__drawUpperSkeletonForTest", {
    value: drawUpperSkeleton,
    writable: true,
    configurable: true,
    enumerable: false
  });
  Object.defineProperty(api, "__getJointPointsForTest", {
    value: getJointPoints,
    writable: true,
    configurable: true,
    enumerable: false
  });
  Object.defineProperty(api, "__buildShadowResultForTest", {
    value: buildShadowResult,
    writable: true,
    configurable: true,
    enumerable: false
  });

  root.TfitRender = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
