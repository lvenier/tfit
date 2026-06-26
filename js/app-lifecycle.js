(function(root) {
  const { GAME_LENGTH, GAME_LEVEL, MENUTYPE } = root.TfitConfig;
  const { loadAssetsIntoState } = root.TfitAssets;
  const { updateLoadingProgress } = root.TfitLoadingProgress;
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
      menuTypes: MENUTYPE,
      onProgress: updateLoadingProgress
    });
  }

  function hideInitialLoader(document = root.document) {
    const loader = document && document.getElementById("p5_loading");
    if (!loader) {
      return false;
    }

    loader.hidden = true;
    loader.style.display = "none";
    return true;
  }

  async function setup() {
    updateLoadingProgress({ label: "Loading assets", loaded: 0, total: 1 });
    await loadAssets();
    updateLoadingProgress({ label: "Preparing ring", loaded: 1, total: 1 });
    root.frameRate(60);
    root.angleMode(root.DEGREES);

    const layout = layoutSnapshot();
    root.cnv = root.createCanvas(layout.width, layout.height);
    root.cnv.elt.addEventListener("contextmenu", appContextMenu);
    positionAppCanvas(root.cnv);
    fetchSong(1);

    updateLoadingProgress({ label: "Starting camera", loaded: 1, total: 1 });
    await initCameraRuntime();
    if (root.TfitFaceRecognition) {
      root.TfitFaceRecognition.initFaceRecognitionPoc({ videoElement: root.video?.elt || root.video });
    }
    updateLoadingProgress({ label: "Ready", loaded: 1, total: 1 });
    hideInitialLoader();
  }

  function draw() {
    renderAppFrame();
  }

  function windowResized() {
    resizeAppCanvas({ canvas: root.cnv, resizeCanvasFn: root.resizeCanvas });
  }

  const api = {
    draw,
    hideInitialLoader,
    loadAssets,
    setup,
    windowResized
  };

  root.TfitAppLifecycle = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
