(() => {
  const memoryStore = {};

  function canUseLocalStorage() {
    try {
      const testKey = "__storage_util_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  const storageEnabled = canUseLocalStorage();

  function cloneFallback(fallback) {
    if (typeof fallback === "undefined") return null;
    if (typeof window.structuredClone === "function") {
      return window.structuredClone(fallback);
    }
    try {
      return JSON.parse(JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  }

  function readRaw(key) {
    if (storageEnabled) {
      return window.localStorage.getItem(key);
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  }

  function writeRaw(key, value) {
    if (storageEnabled) {
      window.localStorage.setItem(key, value);
      return;
    }
    memoryStore[key] = value;
  }

  function loadJSON(key, fallback) {
    const raw = readRaw(key);
    if (raw === null || raw === "") {
      return cloneFallback(fallback);
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return cloneFallback(fallback);
    }
  }

  function saveJSON(key, value) {
    writeRaw(key, JSON.stringify(value));
    return value;
  }

  function makeId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}_${window.crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  window.StorageUtil = {
    isPersistent: storageEnabled,
    loadJSON,
    saveJSON,
    makeId,
  };
})();
