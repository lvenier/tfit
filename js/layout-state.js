(function(root) {
  const storageNumber = root.storageNumber || root.TfitUtils.storageNumber;

  Object.assign(root, {
    coef: 0.75,
    FRAME_RATE: storageNumber("frame_rate", 20, { allowed: [20, 40, 60, 80, 100, 120] }),
    LEVEL: 50,
    myWindowHeight: 320,
    myWindowWidth: 480,
    OBJECT_POSE_SIZE: 36
  });

  function calculateLayout(width, height) {
    const nextCoef = Math.max(0.5, 0.05 * (Math.floor(Math.min(width / 32, height / 24))));
    return {
      coef: nextCoef,
      height: nextCoef * 480,
      objectPoseSize: 48 * nextCoef,
      width: nextCoef * 640
    };
  }

  function applyLayout(layout) {
    root.coef = layout.coef;
    root.myWindowWidth = layout.width;
    root.myWindowHeight = layout.height;
    root.OBJECT_POSE_SIZE = layout.objectPoseSize;
    return layout;
  }

  function resizeLayoutState(
    width = root.window.innerWidth,
    height = root.window.innerHeight
  ) {
    return applyLayout(calculateLayout(width, height));
  }

  function positionCanvas(canvas = root.cnv, width = root.window.innerWidth) {
    if (!canvas) {
      return false;
    }

    canvas.position(Math.max((width - root.myWindowWidth) / 2, 0), 0);
    return true;
  }

  function resizeCanvasLayout({
    canvas = root.cnv,
    height = root.window.innerHeight,
    resizeCanvasFn = root.resizeCanvas,
    width = root.window.innerWidth
  } = {}) {
    const layout = resizeLayoutState(width, height);
    resizeCanvasFn(root.myWindowWidth, root.myWindowHeight);
    positionCanvas(canvas, width);
    return layout;
  }

  function snapshot() {
    return {
      coef: root.coef,
      frameRate: root.FRAME_RATE,
      height: root.myWindowHeight,
      levelWindowBase: root.LEVEL,
      objectPoseSize: root.OBJECT_POSE_SIZE,
      width: root.myWindowWidth
    };
  }

  resizeLayoutState();

  const api = {
    calculateLayout,
    get coef() { return root.coef; },
    get frameRate() { return root.FRAME_RATE; },
    get height() { return root.myWindowHeight; },
    get levelWindowBase() { return root.LEVEL; },
    get objectPoseSize() { return root.OBJECT_POSE_SIZE; },
    positionCanvas,
    resizeCanvasLayout,
    resizeLayoutState,
    snapshot,
    get width() { return root.myWindowWidth; }
  };

  root.TfitLayoutState = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
