const accountList = document.getElementById("accountList");
const accountCountText = document.getElementById("accountCountText");
const addAccountForm = document.getElementById("addAccountForm");
const newAccountNameInput = document.getElementById("newAccountName");
const newAccountBalanceInput = document.getElementById("newAccountBalance");
const addAccountSubmitBtn = document.getElementById("addAccountSubmitBtn");
const addAccountFormMessage = document.getElementById("addAccountFormMessage");

const transferForm = document.getElementById("transferForm");
const fromAccountSelect = document.getElementById("fromAccountId");
const transferTargetTypeSelect = document.getElementById("transferTargetType");
const toUserField = document.getElementById("toUserField");
const toUserIdInput = document.getElementById("toUserId");
const knownUserList = document.getElementById("knownUserList");
const toAccountSelect = document.getElementById("toAccountId");
const amountInput = document.getElementById("transferAmount");
const memoInput = document.getElementById("transferMemo");
const recordAsExpenseInput = document.getElementById("recordAsExpense");
const transferSubmitBtn = document.getElementById("transferSubmitBtn");
const transferFormMessage = document.getElementById("transferFormMessage");
const transferDisabledHint = document.getElementById("transferDisabledHint");
const recentTransferList = document.getElementById("recentTransferList");
const currentUserLabel = document.getElementById("currentUserLabel");
const logoutBtn = document.getElementById("logoutBtn");

const wonFormatter = new Intl.NumberFormat("ko-KR");

function formatWon(amount) {
  return `${wonFormatter.format(amount)}원`;
}

function formatDateTime(isoText) {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showMessage(node, text, type = "info") {
  if (!node) return;
  node.textContent = text;
  node.classList.remove("is-error", "is-success", "is-info");
  node.classList.add(`is-${type}`);
}

function getCurrentUserId() {
  if (window.AccountStorage && typeof window.AccountStorage.getSessionUserId === "function") {
    return window.AccountStorage.getSessionUserId();
  }
  return "demo";
}

function sanitizeUserId(value) {
  if (window.AccountStorage && typeof window.AccountStorage.sanitizeUserId === "function") {
    return window.AccountStorage.sanitizeUserId(value);
  }
  return String(value || "").trim().toLowerCase();
}

function createOption(account, includeBalance = true, userLabel = "") {
  const option = document.createElement("option");
  option.value = account.id;
  option.textContent = includeBalance
    ? `${account.name} (${formatWon(account.balance)})`
    : `${account.name} (${userLabel || account.id})`;
  return option;
}

function renderKnownUsers() {
  if (!knownUserList || !window.AccountStorage || typeof window.AccountStorage.getKnownUsers !== "function") return;

  const currentUserId = getCurrentUserId();
  const users = window.AccountStorage.getKnownUsers();
  knownUserList.innerHTML = "";

  for (let i = 0; i < users.length; i += 1) {
    if (users[i] === currentUserId) continue;
    const option = document.createElement("option");
    option.value = users[i];
    knownUserList.appendChild(option);
  }
}

function renderAccountCards(accounts) {
  accountList.innerHTML = "";

  if (accounts.length === 0) {
    const empty = document.createElement("li");
    empty.className = "transfer-empty";
    empty.textContent = "등록된 계좌가 없습니다.";
    accountList.appendChild(empty);
    return;
  }

  for (let i = 0; i < accounts.length; i += 1) {
    const account = accounts[i];
    const card = document.createElement("li");
    card.className = "account-card";

    const name = document.createElement("p");
    name.className = "account-name";
    name.textContent = account.name;

    const balance = document.createElement("p");
    balance.className = "account-balance";
    balance.textContent = formatWon(account.balance);

    const meta = document.createElement("p");
    meta.className = "account-meta";
    meta.textContent = `${account.currency} | ${account.id}`;

    card.appendChild(name);
    card.appendChild(balance);
    card.appendChild(meta);
    accountList.appendChild(card);
  }
}

function renderFromOptions(accounts) {
  const previousFrom = fromAccountSelect.value;
  fromAccountSelect.innerHTML = "";

  for (let i = 0; i < accounts.length; i += 1) {
    fromAccountSelect.appendChild(createOption(accounts[i], true));
  }

  if (accounts.length === 0) return;

  const accountIds = accounts.map((account) => account.id);
  fromAccountSelect.value = accountIds.includes(previousFrom) ? previousFrom : accountIds[0];
}

function keepDifferentSelection() {
  if (transferTargetTypeSelect.value !== "self") return;
  if (fromAccountSelect.value !== toAccountSelect.value) return;

  const options = Array.from(toAccountSelect.options).map((option) => option.value);
  const replacement = options.find((id) => id !== fromAccountSelect.value);
  if (!replacement) return;
  toAccountSelect.value = replacement;
}

function getTargetContext(accounts) {
  const mode = transferTargetTypeSelect.value;
  const currentUserId = getCurrentUserId();

  if (mode === "self") {
    const list = accounts.filter((account) => account.id !== fromAccountSelect.value);
    return {
      mode,
      targetUserId: currentUserId,
      accounts: list,
      invalidUserId: false,
    };
  }

  const rawUserId = String(toUserIdInput.value || "").trim();
  const targetUserId = sanitizeUserId(rawUserId);
  if (!targetUserId) {
    return {
      mode,
      targetUserId: "",
      accounts: [],
      invalidUserId: rawUserId.length > 0,
    };
  }

  if (!window.AccountStorage || typeof window.AccountStorage.getAccountsByUser !== "function") {
    return {
      mode,
      targetUserId,
      accounts: [],
      invalidUserId: false,
    };
  }

  return {
    mode,
    targetUserId,
    accounts: window.AccountStorage.getAccountsByUser(targetUserId),
    invalidUserId: false,
  };
}

function renderToOptions(accounts) {
  const previousTo = toAccountSelect.value;
  const context = getTargetContext(accounts);

  toAccountSelect.innerHTML = "";
  for (let i = 0; i < context.accounts.length; i += 1) {
    const showBalance = context.mode === "self";
    const userLabel = context.mode === "other" ? context.targetUserId : "";
    toAccountSelect.appendChild(createOption(context.accounts[i], showBalance, userLabel));
  }

  if (context.accounts.length > 0) {
    const accountIds = context.accounts.map((account) => account.id);
    toAccountSelect.value = accountIds.includes(previousTo) ? previousTo : accountIds[0];
  }

  return context;
}

function applyTransferState(accounts, context) {
  const maxAccounts = Number(window.AccountStorage && window.AccountStorage.maxAccountsPerUser) || 5;
  const canAdd = accounts.length < maxAccounts;

  if (accountCountText) {
    accountCountText.textContent = `${accounts.length} / ${maxAccounts}`;
  }
  newAccountNameInput.disabled = !canAdd;
  newAccountBalanceInput.disabled = !canAdd;
  addAccountSubmitBtn.disabled = !canAdd;

  let canTransfer = true;
  let hint = "";

  if (accounts.length === 0) {
    canTransfer = false;
    hint = "출금할 계좌가 없습니다. 먼저 계좌를 추가하세요.";
  } else if (context.mode === "self") {
    if (accounts.length < 2) {
      canTransfer = false;
      hint = "내 계좌 간 이체는 최소 2개 계좌가 필요합니다.";
    }
  } else {
    if (!context.targetUserId) {
      canTransfer = false;
      hint = context.invalidUserId
        ? "수취 사용자 ID는 영문, 숫자, _, - 만 사용할 수 있습니다."
        : "수취 사용자 ID를 입력하세요.";
    } else if (context.targetUserId === getCurrentUserId()) {
      canTransfer = false;
      hint = "타인 이체는 현재 사용자와 다른 ID를 입력하세요.";
    } else if (context.accounts.length === 0) {
      canTransfer = false;
      hint = "수취 사용자에게 등록된 계좌가 없습니다.";
    }
  }

  if (context.accounts.length === 0) {
    toAccountSelect.disabled = true;
  } else {
    toAccountSelect.disabled = false;
  }

  fromAccountSelect.disabled = accounts.length === 0;
  amountInput.disabled = !canTransfer;
  memoInput.disabled = !canTransfer;
  recordAsExpenseInput.disabled = !canTransfer;
  transferSubmitBtn.disabled = !canTransfer;

  transferDisabledHint.hidden = canTransfer;
  transferDisabledHint.textContent = hint;

  if (!canAdd && addAccountFormMessage && !addAccountFormMessage.textContent) {
    showMessage(addAccountFormMessage, `계좌는 최대 ${maxAccounts}개까지 추가할 수 있습니다.`, "info");
  }
}

function renderTransferModeUI() {
  const isOtherMode = transferTargetTypeSelect.value === "other";
  toUserField.hidden = !isOtherMode;
  toUserIdInput.disabled = !isOtherMode;

  if (isOtherMode) {
    if (!recordAsExpenseInput.checked) {
      recordAsExpenseInput.checked = true;
    }
    return;
  }

  toUserIdInput.value = "";
}

function getAccountName(userId, accountId, accountNameCache) {
  if (!accountNameCache.has(userId)) {
    const userAccounts =
      window.AccountStorage && typeof window.AccountStorage.getAccountsByUser === "function"
        ? window.AccountStorage.getAccountsByUser(userId)
        : [];
    accountNameCache.set(
      userId,
      new Map(userAccounts.map((account) => [account.id, account.name]))
    );
  }

  const table = accountNameCache.get(userId);
  return (table && table.get(accountId)) || accountId;
}

function renderTransfers() {
  const transfers = window.AccountStorage.getTransfers().slice(0, 5);
  const currentUserId = getCurrentUserId();

  const ownAccountMap = new Map(window.AccountStorage.getAccounts().map((account) => [account.id, account.name]));
  const accountNameCache = new Map([[currentUserId, ownAccountMap]]);

  recentTransferList.innerHTML = "";

  if (transfers.length === 0) {
    const empty = document.createElement("li");
    empty.className = "transfer-empty";
    empty.textContent = "최근 이체 내역이 없습니다.";
    recentTransferList.appendChild(empty);
    return;
  }

  for (let i = 0; i < transfers.length; i += 1) {
    const transfer = transfers[i];
    const item = document.createElement("li");
    item.className = "transfer-item";

    const fromUserId = transfer.fromUserId || currentUserId;
    const toUserId = transfer.toUserId || currentUserId;

    const fromName = getAccountName(fromUserId, transfer.fromAccountId, accountNameCache);
    const toName = getAccountName(toUserId, transfer.toAccountId, accountNameCache);

    const route = document.createElement("p");
    route.className = "transfer-route";
    route.textContent =
      fromUserId === toUserId
        ? `${fromName} -> ${toName}`
        : `${fromName}(${fromUserId}) -> ${toName}(${toUserId})`;

    const amount = document.createElement("p");
    amount.className = "transfer-amount";
    amount.textContent = formatWon(transfer.amount);

    const date = document.createElement("p");
    date.className = "transfer-date";
    date.textContent = formatDateTime(transfer.createdAt);

    item.appendChild(route);
    item.appendChild(amount);
    item.appendChild(date);

    if (transfer.memo) {
      const memo = document.createElement("p");
      memo.className = "transfer-memo";
      memo.textContent = `메모: ${transfer.memo}`;
      item.appendChild(memo);
    }

    if (transfer.recordAsExpense) {
      const expense = document.createElement("p");
      expense.className = `transfer-memo ${transfer.expenseRecorded ? "is-expense-ok" : "is-expense-fail"}`;
      expense.textContent = transfer.expenseRecorded
        ? "가계부 소비 기록 완료"
        : `가계부 소비 기록 실패${transfer.expenseError ? `: ${transfer.expenseError}` : ""}`;
      item.appendChild(expense);
    }

    recentTransferList.appendChild(item);
  }
}

function renderUser() {
  if (!window.AuthSession) {
    currentUserLabel.textContent = "demo";
    if (logoutBtn) logoutBtn.hidden = true;
    return;
  }

  const userId = window.AuthSession.getCurrentUserId();
  const isLoggedIn =
    typeof window.AuthSession.hasCurrentUserId === "function" && window.AuthSession.hasCurrentUserId();
  currentUserLabel.textContent = userId;
  if (logoutBtn) logoutBtn.hidden = !isLoggedIn;
}

function renderAccountsAndTransfer() {
  const accounts = window.AccountStorage.getAccounts();
  renderAccountCards(accounts);
  renderKnownUsers();
  renderFromOptions(accounts);
  const context = renderToOptions(accounts);
  keepDifferentSelection();
  applyTransferState(accounts, context);
}

function renderAll() {
  renderUser();
  renderTransferModeUI();
  renderAccountsAndTransfer();
  renderTransfers();
}

function onSubmitAddAccount(event) {
  event.preventDefault();

  try {
    window.AccountStorage.addAccount({
      name: newAccountNameInput.value,
      balance: newAccountBalanceInput.value,
      currency: "KRW",
    });

    newAccountNameInput.value = "";
    newAccountBalanceInput.value = "";
    showMessage(addAccountFormMessage, "계좌가 추가되었습니다.", "success");
    renderAll();
  } catch (error) {
    showMessage(addAccountFormMessage, error.message || "계좌 추가 중 오류가 발생했습니다.", "error");
  }
}

function onSubmitTransfer(event) {
  event.preventDefault();

  const isOtherMode = transferTargetTypeSelect.value === "other";
  const rawToUserId = String(toUserIdInput.value || "").trim();
  const toUserId = isOtherMode ? sanitizeUserId(toUserIdInput.value) : getCurrentUserId();

  try {
    if (isOtherMode && !toUserId) {
      throw new Error(
        rawToUserId.length > 0
          ? "수취 사용자 ID는 영문, 숫자, _, - 만 사용할 수 있습니다."
          : "수취 사용자 ID를 입력하세요."
      );
    }
    if (isOtherMode && toUserId === getCurrentUserId()) {
      throw new Error("타인 이체는 현재 사용자와 다른 ID를 입력하세요.");
    }

    const record = window.AccountStorage.transfer({
      fromAccountId: fromAccountSelect.value,
      toUserId,
      toAccountId: toAccountSelect.value,
      amount: amountInput.value,
      memo: memoInput.value,
      recordAsExpense: recordAsExpenseInput.checked,
      expenseCategory: "account-transfer",
    });

    amountInput.value = "";
    memoInput.value = "";

    if (record.recordAsExpense && !record.expenseRecorded) {
      showMessage(
        transferFormMessage,
        `이체는 완료됐지만 소비 기록에 실패했습니다.${record.expenseError ? ` (${record.expenseError})` : ""}`,
        "error"
      );
    } else if (record.recordAsExpense && record.expenseRecorded) {
      showMessage(transferFormMessage, "이체 및 소비 기록이 완료되었습니다.", "success");
    } else {
      showMessage(transferFormMessage, "이체가 완료되었습니다.", "success");
    }

    renderAll();
  } catch (error) {
    showMessage(transferFormMessage, error.message || "이체 처리 중 오류가 발생했습니다.", "error");
  }
}

function bindEvents() {
  if (addAccountForm) {
    addAccountForm.addEventListener("submit", onSubmitAddAccount);
  }

  fromAccountSelect.addEventListener("change", () => {
    renderAccountsAndTransfer();
  });

  toAccountSelect.addEventListener("change", () => {
    keepDifferentSelection();
  });

  transferTargetTypeSelect.addEventListener("change", () => {
    renderAll();
  });

  toUserIdInput.addEventListener("input", () => {
    renderAccountsAndTransfer();
  });

  transferForm.addEventListener("submit", onSubmitTransfer);

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (window.AuthSession && typeof window.AuthSession.clearCurrentUserId === "function") {
        window.AuthSession.clearCurrentUserId();
      }
      window.location.href = "login.html";
    });
  }
}

function init() {
  window.AccountStorage.ensureSeedAccounts();
  bindEvents();
  renderAll();
  showMessage(transferFormMessage, "출금 계좌와 수취 계좌를 선택해 이체를 진행하세요.", "info");
}

init();
