(() => {
  const NS = "householder";
  const STORAGE_VERSION = "v2";
  const LEGACY_STORAGE_KEY = `${NS}.transactions.v1`;
  const memoryStore = {};

  function canUseLocalStorage() {
    try {
      const testKey = "__tx_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  const storageEnabled = canUseLocalStorage();

  function sanitizeUserId(value) {
    if (window.AuthSession && typeof window.AuthSession.sanitizeUserId === "function") {
      return window.AuthSession.sanitizeUserId(value);
    }

    const text = String(value || "").trim().toLowerCase();
    if (!text) return "demo";
    return (
      text
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || "demo"
    );
  }

  function getSessionUserId() {
    if (window.AuthSession && typeof window.AuthSession.getCurrentUserId === "function") {
      return sanitizeUserId(window.AuthSession.getCurrentUserId());
    }
    return "demo";
  }

  function getStorageKey(userId = getSessionUserId()) {
    return `${NS}.${sanitizeUserId(userId)}.transactions.${STORAGE_VERSION}`;
  }

  function readRaw(key) {
    if (storageEnabled) {
      return window.localStorage.getItem(key);
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  }

  function writeRaw(key, jsonText) {
    if (storageEnabled) {
      window.localStorage.setItem(key, jsonText);
      return;
    }
    memoryStore[key] = jsonText;
  }

  function removeRaw(key) {
    if (storageEnabled) {
      window.localStorage.removeItem(key);
      return;
    }
    delete memoryStore[key];
  }

  function migrateLegacyDataIfNeeded(userId) {
    const targetKey = getStorageKey(userId);
    const currentRaw = readRaw(targetKey);
    if (currentRaw && currentRaw !== "[]") return;

    const legacyRaw = readRaw(LEGACY_STORAGE_KEY);
    if (!legacyRaw || legacyRaw === "[]") return;

    writeRaw(targetKey, legacyRaw);
    removeRaw(LEGACY_STORAGE_KEY);
  }

  function parseDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error("date must be YYYY-MM-DD.");
    }
    return value;
  }

  function parseType(value) {
    if (value !== "income" && value !== "expense") {
      throw new Error("type must be income or expense.");
    }
    return value;
  }

  function parseAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      throw new Error("amount must be greater than 0.");
    }
    return Math.round(num);
  }

  function parseCategory(value) {
    const text = String(value || "").trim();
    if (text.length === 0) {
      return "etc";
    }
    return text.slice(0, 30);
  }

  function normalizeTransaction(input) {
    const now = Date.now();
    return {
      id: String(input.id || `${now}-${Math.random().toString(36).slice(2, 8)}`),
      date: parseDate(input.date),
      type: parseType(input.type),
      amount: parseAmount(input.amount),
      category: parseCategory(input.category),
      createdAt: Number(input.createdAt) || now,
    };
  }

  function sortTransactions(list) {
    list.sort((a, b) => {
      if (a.date === b.date) {
        return a.createdAt - b.createdAt;
      }
      return a.date.localeCompare(b.date);
    });
    return list;
  }

  function readAll(userId = getSessionUserId()) {
    const safeUserId = sanitizeUserId(userId);
    migrateLegacyDataIfNeeded(safeUserId);

    try {
      const raw = readRaw(getStorageKey(safeUserId));
      const parsed = JSON.parse(raw || "[]");
      if (!Array.isArray(parsed)) return [];
      const normalized = [];
      for (let i = 0; i < parsed.length; i += 1) {
        try {
          normalized.push(normalizeTransaction(parsed[i]));
        } catch (error) {
          // Skip invalid rows.
        }
      }
      return sortTransactions(normalized);
    } catch (error) {
      return [];
    }
  }

  function writeAll(list, userId = getSessionUserId()) {
    const safeUserId = sanitizeUserId(userId);
    writeRaw(getStorageKey(safeUserId), JSON.stringify(sortTransactions(list.slice())));
  }

  const TransactionStorage = {
    key: getStorageKey(),
    isPersistent: storageEnabled,
    getKey(userId) {
      return getStorageKey(typeof userId === "undefined" ? getSessionUserId() : userId);
    },
    getAll(userId) {
      const targetUserId = typeof userId === "undefined" ? getSessionUserId() : userId;
      return readAll(targetUserId);
    },
    add(input, userId) {
      const tx = normalizeTransaction(input);
      const targetUserId = typeof userId === "undefined" ? getSessionUserId() : userId;
      const list = readAll(targetUserId);
      list.push(tx);
      writeAll(list, targetUserId);
      return tx;
    },
    remove(id, userId) {
      const targetUserId = typeof userId === "undefined" ? getSessionUserId() : userId;
      const list = readAll(targetUserId);
      const next = list.filter((item) => item.id !== id);
      writeAll(next, targetUserId);
      return next.length !== list.length;
    },
    clear(userId) {
      const targetUserId = typeof userId === "undefined" ? getSessionUserId() : userId;
      removeRaw(getStorageKey(targetUserId));
    },
  };

  window.TransactionStorage = TransactionStorage;
})();
