(function(root) {
  const {
    applyCalibrationDragFlags,
    applyKeyInputAction,
    applyPointerInputAction
  } = root.TfitAppInputActions;

  const {
    clearCalibrationDragFlags
  } = root.TfitInput;

  let lastKeyboardEvent = {
    key: null,
    time: 0
  };

  function preventContextMenu(event) {
    event.preventDefault();
  }

  function handlePointerChange() {
    applyPointerInputAction();
  }

  function handlePointerRelease() {
    if (gameState.gameCalibration) {
      applyCalibrationDragFlags(clearCalibrationDragFlags());
    }
  }

  function handleKeyboardInput(event) {
    if (event?.__tfitHandled) {
      return;
    }
    const eventKey = event?.key;
    const now = Date.now();
    if (!event && lastKeyboardEvent.key === root.key && now - lastKeyboardEvent.time < 100) {
      return;
    }
    if (event) {
      event.__tfitHandled = true;
      lastKeyboardEvent = {
        key: eventKey,
        time: now
      };
    }
    applyKeyInputAction(eventKey);
  }

  function handleCanvasContextMenu(event) {
    event.preventDefault();
    if (gameState.gameStarted) {
      return root.dispatchEvent(new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        bubbles: true
      }));
    }
    return root.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'b',
      code: 'KeyB',
      bubbles: true
    }));
  }

  const api = {
    handleCanvasContextMenu,
    handleKeyboardInput,
    handlePointerChange,
    handlePointerRelease,
    preventContextMenu
  };

  root.TfitAppEvents = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
