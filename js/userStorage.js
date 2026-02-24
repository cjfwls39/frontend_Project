(() => {
  const STORAGE_KEY = "householder.users.v1";
  const memoryStore = {};

  function canUseLocalStorage() {
    try {
      const testKey = "__user_storage_test__";
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
    if (!text) return "";

    return text
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function readRaw() {
    if (storageEnabled) {
      return window.localStorage.getItem(STORAGE_KEY);
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, STORAGE_KEY) ? memoryStore[STORAGE_KEY] : null;
  }

  function writeRaw(value) {
    if (storageEnabled) {
      window.localStorage.setItem(STORAGE_KEY, value);
      return;
    }
    memoryStore[STORAGE_KEY] = value;
  }

  function normalizeUser(input) {
    const rawName = String(input && input.name ? input.name : "").trim();
    const email = String(input && input.email ? input.email : "")
      .trim()
      .toLowerCase();

    const sourceId = input && input.userId ? input.userId : email;
    const userId = sanitizeUserId(sourceId);

    if (!userId) return null;

    const createdAt = Number(input && input.createdAt) || Date.now();
    const updatedAt = Number(input && input.updatedAt) || createdAt;

    return {
      userId,
      name: rawName || userId,
      email,
      createdAt,
      updatedAt,
    };
  }

  function readUsers() {
    try {
      const raw = readRaw();
      const parsed = JSON.parse(raw || "[]");
      if (!Array.isArray(parsed)) return [];

      const out = [];
      for (let i = 0; i < parsed.length; i += 1) {
        const normalized = normalizeUser(parsed[i]);
        if (normalized) out.push(normalized);
      }

      out.sort((a, b) => b.createdAt - a.createdAt);
      return out;
    } catch (error) {
      return [];
    }
  }

  function writeUsers(list) {
    const out = [];
    const seen = new Set();

    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeUser(list[i]);
      if (!normalized) continue;

      const key = normalized.email || normalized.userId;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(normalized);
    }

    out.sort((a, b) => b.createdAt - a.createdAt);
    writeRaw(JSON.stringify(out));
    return out;
  }

  function registerUser(input) {
    const name = String(input && input.name ? input.name : "").trim();
    const email = String(input && input.email ? input.email : "")
      .trim()
      .toLowerCase();

    if (!name) {
      throw new Error("이름을 입력해주세요.");
    }
    if (!email) {
      throw new Error("이메일을 입력해주세요.");
    }

    const userId = sanitizeUserId(email);
    if (!userId) {
      throw new Error("사용할 수 없는 이메일입니다.");
    }

    const users = readUsers();
    const now = Date.now();

    const idx = users.findIndex((user) => user.userId === userId || (user.email && user.email === email));
    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        name,
        email,
        updatedAt: now,
      };
      writeUsers(users);
      return users[idx];
    }

    const created = {
      userId,
      name,
      email,
      createdAt: now,
      updatedAt: now,
    };

    users.push(created);
    writeUsers(users);
    return created;
  }

  function getUsers() {
    return readUsers();
  }

  function getUserById(userId) {
    const safeId = sanitizeUserId(userId);
    if (!safeId) return null;

    const users = readUsers();
    for (let i = 0; i < users.length; i += 1) {
      if (users[i].userId === safeId) return users[i];
    }
    return null;
  }

  window.UserStorage = {
    key: STORAGE_KEY,
    isPersistent: storageEnabled,
    sanitizeUserId,
    getUsers,
    getUserById,
    registerUser,
  };
})();
