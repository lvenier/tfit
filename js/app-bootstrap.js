(function(root) {
  function registerAppHandlers({
    document: appDocument = root.document,
    events = root.TfitAppEvents,
    lifecycle = root.TfitAppLifecycle,
    navigator: appNavigator = root.navigator,
    p5: p5Runtime = root.p5,
    root: appRoot = root
  } = {}) {
    p5Runtime.disableFriendlyErrors = true;

    appDocument.addEventListener("contextmenu", events.preventContextMenu);

    if ('serviceWorker' in appNavigator) {
      appNavigator.serviceWorker.register('service-worker.js')
        .catch(() => {});
    }

    Object.assign(appRoot, {
      draw: lifecycle.draw,
      keyPressed: events.handleKeyboardInput,
      mousePressed: events.handlePointerChange,
      mouseReleased: events.handlePointerRelease,
      setup: lifecycle.setup,
      touchEnded: events.handlePointerRelease,
      touchMoved: events.handlePointerChange,
      windowResized: lifecycle.windowResized
    });
  }

  const api = {
    registerAppHandlers
  };

  root.TfitAppBootstrap = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
