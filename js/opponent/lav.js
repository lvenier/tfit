(function(root) {
  const LAV_PALETTE = {
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
    gloveDark: "#150728",
    gloveMid: "#3f146c",
    gloveLight: "#7e28d8",
    gloveHighlight: "#c78cff",
    gloveShadow: "#090212"
  };

  function renderLav(options = {}) {
    return root.TfitRender.renderRajaOpponentCharacter({
      ...options,
      palette: LAV_PALETTE
    });
  }

  const api = {
    key: "lav",
    render: renderLav
  };

  root.TfitOpponentRenderers = root.TfitOpponentRenderers || {};
  root.TfitOpponentRenderers.lav = api;

  /* c8 ignore next 3 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
