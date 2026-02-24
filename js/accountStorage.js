(() => {
  const NS = "householder";
  const ACCOUNT_VERSION = "v1";
  const TRANSFER_VERSION = "v1";

  function getSessionUserId() {
    if (window.AuthSession && typeof window.AuthSession.getCurrentUserId === "function") {
      return window.AuthSession.getCurrentUserId();
    }
    return "demo";
  }

  function getStorageUtil() {
    if (!window.StorageUtil) {
      throw new Error("StorageUtil이 로드되지 않았습니다.");
    }
    return window.StorageUtil;
  }

  function getAccountsKey(userId = getSessionUserId()) {
    return `${NS}.${userId}.accounts.${ACCOUNT_VERSION}`;
  }

  function getTransfersKey(userId = getSessionUserId()) {
    return `${NS}.${userId}.transfers.${TRANSFER_VERSION}`;
  }

  function toNonNegativeInteger(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.trunc(num);
  }

  function normalizeAccount(account) {
    const id = String(account && account.id ? account.id : "").trim();
    const name = String(account && account.name ? account.name : "").trim();
    const currency = String(account && account.currency ? account.currency : "KRW").trim() || "KRW";
    const balance = toNonNegativeInteger(account && account.balance);

    if (!id || !name) return null;
    return { id, name, balance, currency };
  }

  function normalizeTransfer(transfer) {
    const id = String(transfer && transfer.id ? transfer.id : "").trim();
    const fromAccountId = String(transfer && transfer.fromAccountId ? transfer.fromAccountId : "").trim();
    const toAccountId = String(transfer && transfer.toAccountId ? transfer.toAccountId : "").trim();
    const amount = toNonNegativeInteger(transfer && transfer.amount);
    const memo = String(transfer && transfer.memo ? transfer.memo : "").trim().slice(0, 30);
    const createdAt = String(transfer && transfer.createdAt ? transfer.createdAt : "").trim();

    if (!id || !fromAccountId || !toAccountId || amount <= 0 || !createdAt) {
      return null;
    }

    return { id, fromAccountId, toAccountId, amount, memo, createdAt };
  }

  function readAccounts(userId) {
    const { loadJSON } = getStorageUtil();
    const list = loadJSON(getAccountsKey(userId), []);
    if (!Array.isArray(list)) return [];

    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeAccount(list[i]);
      if (normalized) out.push(normalized);
    }
    return out;
  }

  function writeAccounts(list, userId) {
    const { saveJSON } = getStorageUtil();
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeAccount(list[i]);
      if (normalized) out.push(normalized);
    }
    saveJSON(getAccountsKey(userId), out);
    return out;
  }

  function readTransfers(userId) {
    const { loadJSON } = getStorageUtil();
    const list = loadJSON(getTransfersKey(userId), []);
    if (!Array.isArray(list)) return [];

    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeTransfer(list[i]);
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
    const { saveJSON } = getStorageUtil();
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const normalized = normalizeTransfer(list[i]);
      if (normalized) out.push(normalized);
    }
    out.sort((a, b) => {
      const at = new Date(a.createdAt).getTime() || 0;
      const bt = new Date(b.createdAt).getTime() || 0;
      return bt - at;
    });
    saveJSON(getTransfersKey(userId), out);
    return out;
  }

  function ensureSeedAccounts() {
    const userId = getSessionUserId();
    const list = readAccounts(userId);
    if (list.length > 0) return list;

    const { makeId } = getStorageUtil();
    const seeded = [
      { id: makeId("acc"), name: "토스뱅크 통장", balance: 1250000, currency: "KRW" },
      { id: makeId("acc"), name: "세이브 통장", balance: 300000, currency: "KRW" },
    ];
    return writeAccounts(seeded, userId);
  }

  function parseAmount(amountInput) {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      throw new Error("금액은 1원 이상의 정수로 입력해 주세요.");
    }
    return amount;
  }

  function transfer(input) {
    const userId = getSessionUserId();
    const { makeId } = getStorageUtil();

    const fromAccountId = String(input && input.fromAccountId ? input.fromAccountId : "").trim();
    const toAccountId = String(input && input.toAccountId ? input.toAccountId : "").trim();
    const amount = parseAmount(input && input.amount);
    const memo = String(input && input.memo ? input.memo : "").trim().slice(0, 30);

    if (!fromAccountId || !toAccountId) {
      throw new Error("출금 계좌와 입금 계좌를 선택해 주세요.");
    }
    if (fromAccountId === toAccountId) {
      throw new Error("출금 계좌와 입금 계좌는 서로 달라야 합니다.");
    }

    const accounts = readAccounts(userId);
    const nextAccounts = accounts.map((account) => ({ ...account }));
    const from = nextAccounts.find((account) => account.id === fromAccountId);
    const to = nextAccounts.find((account) => account.id === toAccountId);

    if (!from || !to) {
      throw new Error("계좌 정보를 찾을 수 없습니다. 페이지를 새로고침해 주세요.");
    }
    if (from.balance < amount) {
      throw new Error("출금 계좌의 잔액이 부족합니다.");
    }

    from.balance -= amount;
    to.balance += amount;

    const record = {
      id: makeId("tr"),
      fromAccountId,
      toAccountId,
      amount,
      memo,
      createdAt: new Date().toISOString(),
    };

    const nextTransfers = readTransfers(userId);
    nextTransfers.unshift(record);

    writeAccounts(nextAccounts, userId);
    writeTransfers(nextTransfers, userId);

    return record;
  }

  function getAccounts() {
    return readAccounts(getSessionUserId());
  }

  function saveAccounts(list) {
    return writeAccounts(list, getSessionUserId());
  }

  function getTransfers() {
    return readTransfers(getSessionUserId());
  }

  function saveTransfers(list) {
    return writeTransfers(list, getSessionUserId());
  }

  window.AccountStorage = {
    getSessionUserId,
    getAccountsKey,
    getTransfersKey,
    getAccounts,
    saveAccounts,
    getTransfers,
    saveTransfers,
    ensureSeedAccounts,
    transfer,
  };
})();
