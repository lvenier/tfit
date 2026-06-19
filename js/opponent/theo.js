(function(root) {
  const THEO_PALETTE = {
    skinDark: "#b77954",
    skinBase: "#efb285",
    skinLight: "#ffd0a6",
    skinHighlight: [255, 228, 190, 150],
    skinLine: "#ad6d4f",
    mouthLine: "#8a4b37",
    armDark: "#c6845d",
    armBase: "#efb285",
    armHighlight: [255, 228, 190, 130],
    neck: "#d9956d",
    gloveDark: "#6e0710",
    gloveMid: "#9f101c",
    gloveLight: "#d71f2c",
    gloveHighlight: "#ff6b5c",
    gloveShadow: "#3f0208"
  };

  function renderTheo(options = {}) {
    return root.TfitRender.renderRajaOpponentCharacter({
      ...options,
      palette: THEO_PALETTE
    });
  }

  const api = {
    key: "theo",
    render: renderTheo
  };

  root.TfitOpponentRenderers = root.TfitOpponentRenderers || {};
  root.TfitOpponentRenderers.theo = api;

  /* c8 ignore next 3 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
