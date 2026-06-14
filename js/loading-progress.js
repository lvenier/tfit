(function(root) {
  function updateLoadingProgress({
    label = "Loading Box4Fit",
    loaded = 0,
    total = 1
  } = {}) {
    const status = root.document && root.document.getElementById("loading-status");
    const bar = root.document && root.document.getElementById("loading-progress");
    const count = root.document && root.document.getElementById("loading-count");

    const safeTotal = Math.max(total, 1);
    const safeLoaded = Math.max(0, Math.min(loaded, safeTotal));

    if (status) {
      status.textContent = label;
    }
    if (bar) {
      bar.max = safeTotal;
      bar.value = safeLoaded;
      bar.setAttribute("aria-label", label);
    }
    if (count) {
      count.textContent = `${Math.round((safeLoaded / safeTotal) * 100)}%`;
    }

    return {
      label,
      loaded: safeLoaded,
      total: safeTotal
    };
  }

  const api = {
    updateLoadingProgress
  };

  root.TfitLoadingProgress = api;

  try {
    module.exports = api;
  } catch (_) {}
})(globalThis);
