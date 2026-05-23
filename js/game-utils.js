(function(root) {
  function readStorage(storage, key) {
    if (!storage || typeof storage.getItem !== 'function') {
      return null;
    }
    return storage.getItem(key);
  }

  function storageNumber(key, fallback, options = {}, storage = root.localStorage) {
    const rawValue = readStorage(storage, key);
    if (rawValue === null) {
      return fallback;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return fallback;
    }
    if (Number.isFinite(options.min) && value < options.min) {
      return fallback;
    }
    if (Number.isFinite(options.max) && value > options.max) {
      return fallback;
    }
    if (options.allowed && !options.allowed.includes(value)) {
      return fallback;
    }
    return value;
  }

  function storageJson(key, fallback, storage = root.localStorage) {
    try {
      return JSON.parse(readStorage(storage, key)) || fallback;
    } catch {
      if (storage && typeof storage.removeItem === 'function') {
        storage.removeItem(key);
      }
      return fallback;
    }
  }

  function cloneFromMap(map, id, fallbackId) {
    return JSON.parse(JSON.stringify(map[id] || map[fallbackId]));
  }

  function randomInteger(min, max, random = Math.random) {
    return Math.floor(random() * (max - min + 1)) + min;
  }

  const api = {
    cloneFromMap,
    randomInteger,
    storageJson,
    storageNumber
  };

  root.TfitUtils = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
