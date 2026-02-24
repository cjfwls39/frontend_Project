(() => {
  const CURRENT_USER_KEY = "householder.currentUser.v1";

  function sanitizeUserId(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return "demo";

    const safe = text
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

    return safe || "demo";
  }

  function setCurrentUserId(userId) {
    const safeId = sanitizeUserId(userId);
    try {
      window.localStorage.setItem(CURRENT_USER_KEY, safeId);
    } catch (error) {
      // 저장소 접근이 막혀도 세션 조회는 fallback("demo")로 동작합니다.
    }
    return safeId;
  }

  function getCurrentUserId() {
    try {
      const saved = window.localStorage.getItem(CURRENT_USER_KEY);
      return sanitizeUserId(saved);
    } catch (error) {
      return "demo";
    }
  }

  function hasCurrentUserId() {
    try {
      const saved = window.localStorage.getItem(CURRENT_USER_KEY);
      return typeof saved === "string" && saved.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  function clearCurrentUserId() {
    try {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      // noop
    }
  }

  window.AuthSession = {
    key: CURRENT_USER_KEY,
    sanitizeUserId,
    setCurrentUserId,
    getCurrentUserId,
    hasCurrentUserId,
    clearCurrentUserId,
  };
})();
