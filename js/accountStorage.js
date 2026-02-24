(() => {
  const NS = "householder";
  const ACCOUNT_VERSION = "v1";
  const TRANSFER_VERSION = "v1";
  const ACCOUNT_REGISTRY_KEY = `${NS}.accounts.registry.v1`;
  const MAX_ACCOUNTS_PER_USER = 5;

  function sanitizeUserId(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return "";
    return text
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function normalizeUserId(value, fallback = "demo") {
    const safe = sanitizeUserId(value);
    if (safe) return safe;

    const fallbackSafe = sanitizeUserId(fallback);
    return fallbackSafe || "demo";
  }

  function getSessionUserId() {
    if (window.AuthSession && typeof window.AuthSession.getCurrentUserId === "function") {
      return normalizeUserId(window.AuthSession.getCurrentUserId(), "demo");
    }
    return "demo";
  }

  function getStorageUtil() {
    if (!window.StorageUtil) {
      throw new Error("StorageUtil is not loaded.");
    }
    return window.StorageUtil;
  }

  function getAccountsKey(userId = getSessionUserId()) {
    return `${NS}.${normalizeUserId(userId)}.accounts.${ACCOUNT_VERSION}`;
  }

  function getTransfersKey(userId = getSessionUserId()) {
    return `${NS}.${normalizeUserId(userId)}.transfers.${TRANSFER_VERSION}`;
  }

  function toNonNegativeInteger(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.trunc(num);
  }

  function toBoolean(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function normalizeAccount(account) {
    const id = String(account && account.id ? account.id : "").trim();
    const name = String(account && account.name ? account.name : "").trim().slice(0, 30);
    const currency = String(account && account.currency ? account.currency : "KRW").trim() || "KRW";
    const balance = toNonNegativeInteger(account && account.balance);

    if (!id || !name) return null;
    return { id, name, balance, currency };
  }

  function normalizeTransfer(transfer, fallbackUserId) {
    const ownerId = normalizeUserId(fallbackUserId, getSessionUserId());

    const id = String(transfer && transfer.id ? transfer.id : "").trim();
    const fromUserId = normalizeUserId(transfer && transfer.fromUserId ? transfer.fromUserId : ownerId, ownerId);
    const toUserId = normalizeUserId(transfer && transfer.toUserId ? transfer.toUserId : ownerId, ownerId);
    const fromAccountId = String(transfer && transfer.fromAccountId ? transfer.fromAccountId : "").trim();
    const toAccountId = String(transfer && transfer.toAccountId ? transfer.toAccountId : "").trim();
    const amount = toNonNegativeInteger(transfer && transfer.amount);
    const memo = String(transfer && transfer.memo ? transfer.memo : "").trim().slice(0, 30);
    const createdAt = String(transfer && transfer.createdAt ? transfer.createdAt : "").trim();

    if (!id || !fromAccountId || !toAccountId || amount <= 0 || !createdAt) {
      return null;
    }

    const normalized = {
      id,
      fromUserId,
      toUserId,
      fromAccountId,
      toAccountId,
      amount,
      memo,
      createdAt,
      isExternal: fromUserId !== toUserId,
      recordAsExpense: toBoolean(transfer && transfer.recordAsExpense),
      expenseRecorded: toBoolean(transfer && transfer.expenseRecorded),
      expenseTxId: String(transfer && transfer.expenseTxId ? transfer.expenseTxId : "").trim(),
      expenseError: String(transfer && transfer.expenseError ? transfer.expenseError : "").trim().slice(0, 100),
    };
    return normalized;
  }

  function normalizeRegistryEntry(entry) {
    const id = String(entry && entry.id ? entry.id : "").trim();
    const name = String(entry && entry.name ? entry.name : "").trim().slice(0, 30);
    const currency = String(entry && entry.currency ? entry.currency : "KRW").trim() || "KRW";
    const userId = sanitizeUserId(entry && entry.userId ? entry.userId : "");
    const updatedAt = String(entry && entry.updatedAt ? entry.updatedAt : "").trim();

    if (!id || !name || !userId) return null;

    return {
      id,
      name,
      currency,
      userId,
      updatedAt: updatedAt || new Date().toISOString(),
    };
  }

  function readRegistry() {
    const { loadJSON } = getStorageUtil();
    const list = loadJSON(ACCOUNT_REGISTRY_KEY, []);
    if (!Array.isArray(list)) return [];

    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeRegistryEntry(list[i]);
      if (normalized) out.push(normalized);
    }
    return out;
  }

  function writeRegistry(list) {
    const { saveJSON } = getStorageUtil();
    const out = [];
    const seen = new Set();

    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeRegistryEntry(list[i]);
      if (!normalized) continue;
      const key = `${normalized.userId}:${normalized.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(normalized);
    }

    out.sort((a, b) => {
      if (a.userId !== b.userId) return a.userId.localeCompare(b.userId);
      return a.name.localeCompare(b.name);
    });

    saveJSON(ACCOUNT_REGISTRY_KEY, out);
    return out;
  }

  function syncRegistryForUser(userId, accounts) {
    const safeUserId = normalizeUserId(userId, getSessionUserId());
    const previous = readRegistry().filter((entry) => entry.userId !== safeUserId);
    const nowIso = new Date().toISOString();
    const next = previous.slice();

    for (let i = 0; i < accounts.length; i += 1) {
      next.push({
        id: accounts[i].id,
        name: accounts[i].name,
        currency: accounts[i].currency,
        userId: safeUserId,
        updatedAt: nowIso,
      });
    }
    writeRegistry(next);
  }

  function readAccounts(userId) {
    const safeUserId = normalizeUserId(userId, getSessionUserId());
    const { loadJSON } = getStorageUtil();
    const list = loadJSON(getAccountsKey(safeUserId), []);
    if (!Array.isArray(list)) return [];

    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeAccount(list[i]);
      if (normalized) out.push(normalized);
    }
    return out;
  }

  function writeAccounts(list, userId) {
    const safeUserId = normalizeUserId(userId, getSessionUserId());
    const { saveJSON } = getStorageUtil();
    const out = [];

    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeAccount(list[i]);
      if (normalized) out.push(normalized);
    }

    saveJSON(getAccountsKey(safeUserId), out);
    syncRegistryForUser(safeUserId, out);
    return out;
  }

  function readTransfers(userId) {
    const safeUserId = normalizeUserId(userId, getSessionUserId());
    const { loadJSON } = getStorageUtil();
    const list = loadJSON(getTransfersKey(safeUserId), []);
    if (!Array.isArray(list)) return [];

    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeTransfer(list[i], safeUserId);
      if (normalized) out.push(normalized);
    }

    out.sort((a, b) => {
      const at = new Date(a.createdAt).getTime() || 0;
      const bt = new Date(b.createdAt).getTime() || 0;
      return bt - at;
    });

    return out;
  }

  function writeTransfers(list, userId) {
    const safeUserId = normalizeUserId(userId, getSessionUserId());
    const { saveJSON } = getStorageUtil();
    const out = [];

    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeTransfer(list[i], safeUserId);
      if (normalized) out.push(normalized);
    }

    out.sort((a, b) => {
      const at = new Date(a.createdAt).getTime() || 0;
      const bt = new Date(b.createdAt).getTime() || 0;
      return bt - at;
    });
    saveJSON(getTransfersKey(safeUserId), out);
    return out;
  }

  function ensureSeedAccounts() {
    const userId = getSessionUserId();
    const list = readAccounts(userId);
    if (list.length > 0) return list;

    const { makeId } = getStorageUtil();
    const seeded = [
      { id: makeId("acc"), name: "Main Account", balance: 1250000, currency: "KRW" },
      { id: makeId("acc"), name: "Spare Account", balance: 300000, currency: "KRW" },
    ];
    return writeAccounts(seeded, userId);
  }

  function parseAmount(amountInput) {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be an integer greater than 0.");
    }
    return amount;
  }

  function parseInitialBalance(balanceInput) {
    if (balanceInput === "" || balanceInput === null || typeof balanceInput === "undefined") return 0;
    const amount = Number(balanceInput);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
      throw new Error("Initial balance must be 0 or a positive integer.");
    }
    return amount;
  }

  function addAccount(input) {
    const userId = getSessionUserId();
    const { makeId } = getStorageUtil();

    const name = String(input && input.name ? input.name : "").trim().slice(0, 30);
    const balance = parseInitialBalance(input && input.balance);
    const currency = String(input && input.currency ? input.currency : "KRW").trim() || "KRW";

    if (!name) {
      throw new Error("Account name is required.");
    }

    const accounts = readAccounts(userId);
    if (accounts.length >= MAX_ACCOUNTS_PER_USER) {
      throw new Error(`You can register up to ${MAX_ACCOUNTS_PER_USER} accounts per user.`);
    }

    const created = {
      id: makeId("acc"),
      name,
      balance,
      currency,
    };

    const nextAccounts = accounts.slice();
    nextAccounts.push(created);
    writeAccounts(nextAccounts, userId);
    return created;
  }

  function formatDateToYmd(dateValue) {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) {
      const fallback = new Date();
      return [
        fallback.getFullYear(),
        String(fallback.getMonth() + 1).padStart(2, "0"),
        String(fallback.getDate()).padStart(2, "0"),
      ].join("-");
    }

    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join(
      "-"
    );
  }

  function tryRecordExpenseFromTransfer(transfer, category) {
    if (!window.TransactionStorage || typeof window.TransactionStorage.add !== "function") {
      return {
        expenseRecorded: false,
        expenseTxId: "",
        expenseError: "TransactionStorage is unavailable.",
      };
    }

    try {
      const tx = window.TransactionStorage.add({
        date: formatDateToYmd(transfer.createdAt),
        type: "expense",
        amount: transfer.amount,
        category:
          String(category || "account-transfer")
            .trim()
            .slice(0, 30) || "account-transfer",
      });
      return {
        expenseRecorded: true,
        expenseTxId: String(tx && tx.id ? tx.id : ""),
        expenseError: "",
      };
    } catch (error) {
      return {
        expenseRecorded: false,
        expenseTxId: "",
        expenseError: String(error && error.message ? error.message : "Failed to record expense.").slice(0, 100),
      };
    }
  }

  function transfer(input) {
    const fromUserId = getSessionUserId();
    const toUserId = normalizeUserId(input && input.toUserId ? input.toUserId : fromUserId, fromUserId);
    const { makeId } = getStorageUtil();

    const fromAccountId = String(input && input.fromAccountId ? input.fromAccountId : "").trim();
    const toAccountId = String(input && input.toAccountId ? input.toAccountId : "").trim();
    const amount = parseAmount(input && input.amount);
    const memo = String(input && input.memo ? input.memo : "").trim().slice(0, 30);
    const recordAsExpense = toBoolean(input && input.recordAsExpense);
    const expenseCategory = String(input && input.expenseCategory ? input.expenseCategory : "")
      .trim()
      .slice(0, 30);

    if (!fromAccountId || !toAccountId) {
      throw new Error("Select both source and destination accounts.");
    }
    if (fromUserId === toUserId && fromAccountId === toAccountId) {
      throw new Error("Source and destination accounts must be different.");
    }

    const senderAccounts = readAccounts(fromUserId).map((account) => ({ ...account }));
    const from = senderAccounts.find((account) => account.id === fromAccountId);
    if (!from) {
      throw new Error("Source account could not be found.");
    }
    if (from.balance < amount) {
      throw new Error("Insufficient balance in source account.");
    }

    if (fromUserId === toUserId) {
      const to = senderAccounts.find((account) => account.id === toAccountId);
      if (!to) {
        throw new Error("Destination account could not be found.");
      }

      from.balance -= amount;
      to.balance += amount;
      writeAccounts(senderAccounts, fromUserId);
    } else {
      const receiverAccounts = readAccounts(toUserId).map((account) => ({ ...account }));
      const to = receiverAccounts.find((account) => account.id === toAccountId);
      if (!to) {
        throw new Error("Destination user/account could not be found.");
      }

      from.balance -= amount;
      to.balance += amount;
      writeAccounts(senderAccounts, fromUserId);
      writeAccounts(receiverAccounts, toUserId);
    }

    const record = {
      id: makeId("tr"),
      fromUserId,
      toUserId,
      fromAccountId,
      toAccountId,
      amount,
      memo,
      createdAt: new Date().toISOString(),
      isExternal: fromUserId !== toUserId,
      recordAsExpense,
      expenseRecorded: false,
      expenseTxId: "",
      expenseError: "",
    };

    if (recordAsExpense) {
      const expenseResult = tryRecordExpenseFromTransfer(record, expenseCategory);
      record.expenseRecorded = expenseResult.expenseRecorded;
      record.expenseTxId = expenseResult.expenseTxId;
      record.expenseError = expenseResult.expenseError;
    }

    const nextTransfers = readTransfers(fromUserId);
    nextTransfers.unshift(record);
    writeTransfers(nextTransfers, fromUserId);

    return record;
  }

  function getAccounts(userId) {
    return readAccounts(typeof userId === "undefined" ? getSessionUserId() : userId);
  }

  function getAccountsByUser(userId) {
    const safe = sanitizeUserId(userId);
    if (!safe) return [];
    return readAccounts(safe);
  }

  function getKnownUsers() {
    const currentUserId = getSessionUserId();
    const ids = new Set([currentUserId]);
    const registry = readRegistry();

    for (let i = 0; i < registry.length; i += 1) {
      ids.add(registry[i].userId);
    }

    return Array.from(ids).sort((a, b) => a.localeCompare(b));
  }

  function saveAccounts(list) {
    return writeAccounts(list, getSessionUserId());
  }

  function getTransfers(userId) {
    return readTransfers(typeof userId === "undefined" ? getSessionUserId() : userId);
  }

  function saveTransfers(list) {
    return writeTransfers(list, getSessionUserId());
  }

  window.AccountStorage = {
    maxAccountsPerUser: MAX_ACCOUNTS_PER_USER,
    sanitizeUserId,
    normalizeUserId,
    getSessionUserId,
    getAccountsKey,
    getTransfersKey,
    getAccounts,
    getAccountsByUser,
    getKnownUsers,
    addAccount,
    saveAccounts,
    getTransfers,
    saveTransfers,
    ensureSeedAccounts,
    transfer,
  };
})();
