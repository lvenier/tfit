(function(root) {
  const CYRIL_PALETTE = {
    skinDark: "#24130e",
    skinBase: "#5b3024",
    skinLight: "#8a5140",
    skinHighlight: [170, 104, 76, 140],
    skinLine: "#1b0c09",
    mouthLine: "#120706",
    armDark: "#3d1f17",
    armBase: "#6a3829",
    armHighlight: [160, 96, 70, 120],
    neck: "#4f2a20",
    gloveDark: "#07143d",
    gloveMid: "#102b7a",
    gloveLight: "#2859d8",
    gloveHighlight: "#76a8ff",
    gloveShadow: "#02071d"
  };

  function renderCyril(options = {}) {
    return root.TfitRender.renderRajaOpponentCharacter({
      ...options,
      palette: CYRIL_PALETTE
    });
  }

  const api = {
    key: "cyril",
    render: renderCyril
  };

  root.TfitOpponentRenderers = root.TfitOpponentRenderers || {};
  root.TfitOpponentRenderers.cyril = api;

  /* c8 ignore next 3 */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
