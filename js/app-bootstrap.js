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
    appDocument.addEventListener("keydown", events.handleKeyboardInput, true);
    registerInstallPrompt({
      document: appDocument,
      root: appRoot
    });

    if ('serviceWorker' in appNavigator) {
      appNavigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      }).catch(error => {
        console.error('Service worker registration failed:', error);
      });

      appNavigator.serviceWorker.addEventListener('controllerchange', () => {
        if (appRoot.__TFIT_DISABLE_SW_RELOAD_FOR_E2E) {
          return;
        }
        appRoot.location.reload();
      });
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

  function registerInstallPrompt({
    document: appDocument = root.document,
    root: appRoot = root
  } = {}) {
    const installButton = appDocument.getElementById?.("pwa-install-button");

    if (!installButton || typeof appRoot.addEventListener !== "function") {
      return;
    }

    let deferredPrompt = null;

    appRoot.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredPrompt = event;
      installButton.hidden = false;
    });

    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) {
        installButton.hidden = true;
        return;
      }

      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      installButton.hidden = true;

      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch {
        installButton.hidden = false;
      }
    });

    appRoot.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      installButton.hidden = true;
    });
  }

  const api = {
    registerInstallPrompt,
    registerAppHandlers
  };

  root.TfitAppBootstrap = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
