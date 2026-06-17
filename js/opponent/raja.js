(function(root) {
  function renderRaja(options = {}) {
    return root.TfitRender.renderRajaOpponentCharacter(options);
  }

  const api = {
    key: "raja",
    render: renderRaja
  };

  root.TfitOpponentRenderers = root.TfitOpponentRenderers || {};
  root.TfitOpponentRenderers.raja = api;

  /* c8 ignore next 3 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
