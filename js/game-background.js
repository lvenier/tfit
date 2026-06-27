(function(root) {
  const BOX4FIT_SMOKE = [
    { x: 0.14, y: 0.78, r: 0.18, phase: 0.2, alpha: 15 },
    { x: 0.34, y: 0.72, r: 0.22, phase: 1.8, alpha: 12 },
    { x: 0.58, y: 0.80, r: 0.20, phase: 3.1, alpha: 14 },
    { x: 0.81, y: 0.73, r: 0.17, phase: 4.5, alpha: 13 }
  ];
  const BOX4FIT_DEFAULT_FEATURES = {
    flashes: false,
    lights: true,
    smoke: true
  };
  const BACKGROUND_BY_MENU = {
    1: { preset: "fight-arena" },
    3: { preset: "train-pad" },
    4: { preset: "box4fit-arena", features: { flashes: true, lights: true, smoke: true }, energy: 0.22 },
    5: { preset: "fight-arena" }
  };

  function frameTime(multiplier) {
    return (typeof frameCount === "number" ? frameCount : 0) * multiplier;
  }

  function backgroundForMenu(menu = gameState.menu) {
    return BACKGROUND_BY_MENU[menu] || { preset: "default-arena" };
  }

  function syncPageBackground() {
    if (!root.document || !root.document.body) {
      return false;
    }

    root.document.body.style.setProperty("--app-background-image", "none");
    return true;
  }

  function renderSceneBackground(menu = gameState.menu) {
    syncPageBackground();
    const background = backgroundForMenu(menu);
    renderBackgroundPreset(background.preset, {
      energy: background.energy || 0,
      features: {
        ...BOX4FIT_DEFAULT_FEATURES,
        ...(background.features || {})
      },
      menu,
      t: frameTime(background.preset === "train-pad" ? 0.04 : 0.035)
    });
  }

  function renderBackgroundPreset(presetName, options = {}) {
    const preset = BACKGROUND_PRESETS[presetName] || BACKGROUND_PRESETS["default-arena"];
    preset(options);
  }

  function drawArenaDefault({ menu } = {}) {
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
    if (menu === 2) {
      noStroke();
      fill(255, 255, 255, 18);
      quad(width * 0.12, 0, width * 0.25, 0, width * 0.48, height, width * 0.18, height);
      fill(255, 70, 120, 14);
      quad(width * 0.74, 0, width * 0.86, 0, width * 0.62, height, width * 0.38, height);
    }
  }

  function drawArenaGame3({ t }) {
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

    for (let i = 0; i < 5; i++) {
      const lx = width * (0.13 + i * 0.15);
      fill(255, 245, 210, 20);
      triangle(lx - 40, 0, lx + 40, 0, width * 0.35 + (i - 2) * 30, height * 0.78);
      fill(255, 244, 210, 160);
      ellipse(lx, 22, 38, 13);
    }

    const horizon = height * 0.57;
    stroke(255, 255, 255, 16);
    strokeWeight(1);
    for (let i = 0; i < 12; i++) line(i * width / 12, 0, i * width / 12, horizon);

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

    noStroke();
    fill(20, 22, 30);
    rect(width / 2, height * 0.79, width, height * 0.42);
    stroke(255, 255, 255, 24);
    strokeWeight(1);
    for (let i = -10; i <= 10; i++) line(width * 0.35, horizon, width * 0.35 + i * width * 0.16, height);
    for (let y = horizon; y < height; y += max(20, (y - horizon) * 0.12 + 12)) line(0, y, width, y);

    noStroke();
    fill(255, 255, 255, 15);
    ellipse(width * 0.35, height * 0.82, 310, 80);
    fill(255, 255, 255, 25);
    textSize(34);
    textStyle(BOLD);
    text("BOX4FIT", width * 0.35, height * 0.82);
  }

  function drawBox4FitBackground({ t, energy = 0, features = BOX4FIT_DEFAULT_FEATURES }) {
    drawBox4FitGradientSky();
    drawBox4FitBackScreens(t);
    drawBox4FitCrowd(t);
    if (features.lights) {
      drawBox4FitMovingLights(t, energy);
    }
    if (features.flashes) {
      drawBox4FitFightFlashes(t);
    }
    if (features.smoke) {
      drawBox4FitSmoke(t);
    }
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

  function drawBox4FitFightFlashes() {
    function flashJitter(seed) {
      const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return value - Math.floor(value);
    }

    const flashClock = typeof frameCount === "number" ? frameCount : 0;
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

  const BACKGROUND_PRESETS = {
    "box4fit-arena": drawBox4FitBackground,
    "default-arena": drawArenaDefault,
    "fight-arena": drawArenaFight,
    "train-pad": drawArenaGame3
  };

  const api = {
    backgroundForMenu,
    renderBackgroundPreset,
    renderSceneBackground,
    syncPageBackground
  };

  root.TfitBackground = api;

  /* c8 ignore next */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(globalThis);
