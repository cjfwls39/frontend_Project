(() => {
  /*
    TransactionStorage (공용 모듈)
    - 전역 객체: window.TransactionStorage
    - 저장 키: householder.transactions.v1
    - 주요 메서드: getAll(), add(tx), remove(id), clear()

    빠른 사용 예시:
      const list = window.TransactionStorage.getAll();
      window.TransactionStorage.add({
        date: "2026-02-24",
        type: "expense", // 또는 "income"
        amount: 12000,
        category: "food"
      });

    협업 규칙:
    - 거래 저장/조회는 이 모듈을 단일 진실 원천으로 사용합니다.
    - 스키마 변경 시 STORAGE_KEY 버전을 올리고 마이그레이션을 검토합니다.
    - 상세 문서: docs/TRANSACTION_STORAGE.md
  */
  const STORAGE_KEY = "householder.transactions.v1";
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

  function readRaw() {
    if (storageEnabled) {
      return window.localStorage.getItem(STORAGE_KEY);
    }
    return memoryStore[STORAGE_KEY] || "[]";
  }

  function writeRaw(jsonText) {
    if (storageEnabled) {
      window.localStorage.setItem(STORAGE_KEY, jsonText);
      return;
    }
    memoryStore[STORAGE_KEY] = jsonText;
  }

  function parseDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error("date는 YYYY-MM-DD 형식이어야 합니다.");
    }
    return value;
  }

  function parseType(value) {
    if (value !== "income" && value !== "expense") {
      throw new Error("type은 income 또는 expense여야 합니다.");
    }
    return value;
  }

  function parseAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      throw new Error("amount는 0보다 커야 합니다.");
    }
    return Math.round(num);
  }

  function parseCategory(value) {
    const text = String(value || "").trim();
    if (text.length === 0) {
      return "etc";
    }
    return text;
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

  function readAll() {
    try {
      const raw = readRaw();
      const parsed = JSON.parse(raw || "[]");
      if (!Array.isArray(parsed)) return [];
      const normalized = [];
      for (let i = 0; i < parsed.length; i += 1) {
        try {
          normalized.push(normalizeTransaction(parsed[i]));
        } catch (error) {
          // 저장소의 유효하지 않은 항목은 건너뜁니다.
        }
      }
      return sortTransactions(normalized);
    } catch (error) {
      return [];
    }
  }

  function writeAll(list) {
    writeRaw(JSON.stringify(sortTransactions(list.slice())));
  }

  const TransactionStorage = {
    key: STORAGE_KEY,
    isPersistent: storageEnabled,
    getAll() {
      return readAll();
    },
    add(input) {
      const tx = normalizeTransaction(input);
      const list = readAll();
      list.push(tx);
      writeAll(list);
      return tx;
    },
    remove(id) {
      const list = readAll();
      const next = list.filter((item) => item.id !== id);
      writeAll(next);
      return next.length !== list.length;
    },
    clear() {
      if (storageEnabled) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        delete memoryStore[STORAGE_KEY];
      }
    },
  };

  window.TransactionStorage = TransactionStorage;
})();
