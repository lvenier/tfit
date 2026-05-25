(function(root) {
  const { GAME_LENGTH, GAME_LEVEL, MENUTYPE } = root.TfitConfig;
  const { loadAssetsIntoState } = root.TfitAssets;
  const {
    positionCanvas: positionAppCanvas,
    resizeCanvasLayout: resizeAppCanvas,
    snapshot: layoutSnapshot
  } = root.TfitLayoutState;
  const { initCameraRuntime } = root.TfitCameraRuntime;
  const { handleCanvasContextMenu: appContextMenu } = root.TfitAppEvents;
  const { renderAppFrame } = root.TfitScreenRouter;
  const { fetchSong } = root.TfitFlow;

  async function loadAssets() {
    await loadAssetsIntoState({
      gameLength: GAME_LENGTH,
      gameLevel: GAME_LEVEL,
      loadImage: root.loadImage,
      loadSound: root.loadSound,
      menuTypes: MENUTYPE
    });
  }

  async function setup() {
    await loadAssets();
    root.frameRate(60);
    root.angleMode(root.DEGREES);

    const layout = layoutSnapshot();
    root.cnv = root.createCanvas(layout.width, layout.height);
    root.cnv.elt.addEventListener("contextmenu", appContextMenu);
    positionAppCanvas(root.cnv);
    fetchSong(1);

    await initCameraRuntime();
  }

  function draw() {
    renderAppFrame();
  }

  function windowResized() {
    resizeAppCanvas({ canvas: root.cnv, resizeCanvasFn: root.resizeCanvas });
  }

  const api = {
    draw,
    loadAssets,
    setup,
    windowResized
  };

  root.TfitAppLifecycle = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
