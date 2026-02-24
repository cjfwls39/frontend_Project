const accountList = document.getElementById("accountList");
const transferForm = document.getElementById("transferForm");
const fromAccountSelect = document.getElementById("fromAccountId");
const toAccountSelect = document.getElementById("toAccountId");
const amountInput = document.getElementById("transferAmount");
const memoInput = document.getElementById("transferMemo");
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

function showFormMessage(text, type = "info") {
  transferFormMessage.textContent = text;
  transferFormMessage.classList.remove("is-error", "is-success", "is-info");
  transferFormMessage.classList.add(`is-${type}`);
}

function createOption(account) {
  const option = document.createElement("option");
  option.value = account.id;
  option.textContent = `${account.name} (${formatWon(account.balance)})`;
  return option;
}

function keepDifferentSelection(changed) {
  if (fromAccountSelect.value !== toAccountSelect.value) return;

  const options = Array.from(fromAccountSelect.options).map((option) => option.value);
  const replacement = options.find((id) => id !== fromAccountSelect.value);
  if (!replacement) return;

  if (changed === "from") {
    toAccountSelect.value = replacement;
    return;
  }
  fromAccountSelect.value = replacement;
}

function renderAccountOptions(accounts) {
  const previousFrom = fromAccountSelect.value;
  const previousTo = toAccountSelect.value;

  fromAccountSelect.innerHTML = "";
  toAccountSelect.innerHTML = "";

  for (let i = 0; i < accounts.length; i += 1) {
    const optionA = createOption(accounts[i]);
    const optionB = createOption(accounts[i]);
    fromAccountSelect.appendChild(optionA);
    toAccountSelect.appendChild(optionB);
  }

  if (accounts.length === 0) return;

  const accountIds = accounts.map((account) => account.id);
  fromAccountSelect.value = accountIds.includes(previousFrom) ? previousFrom : accountIds[0];

  const canUsePrevTo = accountIds.includes(previousTo) && previousTo !== fromAccountSelect.value;
  if (canUsePrevTo) {
    toAccountSelect.value = previousTo;
  } else {
    const fallback = accountIds.find((id) => id !== fromAccountSelect.value) || accountIds[0];
    toAccountSelect.value = fallback;
  }
}

function renderAccounts() {
  const accounts = window.AccountStorage.getAccounts();
  accountList.innerHTML = "";

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
    meta.textContent = account.currency;

    card.appendChild(name);
    card.appendChild(balance);
    card.appendChild(meta);
    accountList.appendChild(card);
  }

  renderAccountOptions(accounts);
  const canTransfer = accounts.length >= 2;

  fromAccountSelect.disabled = !canTransfer;
  toAccountSelect.disabled = !canTransfer;
  amountInput.disabled = !canTransfer;
  memoInput.disabled = !canTransfer;
  transferSubmitBtn.disabled = !canTransfer;
  transferDisabledHint.hidden = canTransfer;
}

function renderTransfers() {
  const transfers = window.AccountStorage.getTransfers().slice(0, 5);
  const accounts = window.AccountStorage.getAccounts();
  const accountMap = new Map(accounts.map((account) => [account.id, account.name]));

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

    const route = document.createElement("p");
    route.className = "transfer-route";
    route.textContent = `${accountMap.get(transfer.fromAccountId) || transfer.fromAccountId} → ${
      accountMap.get(transfer.toAccountId) || transfer.toAccountId
    }`;

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

function renderAll() {
  renderUser();
  renderAccounts();
  renderTransfers();
}

function onSubmitTransfer(event) {
  event.preventDefault();

  try {
    window.AccountStorage.transfer({
      fromAccountId: fromAccountSelect.value,
      toAccountId: toAccountSelect.value,
      amount: amountInput.value,
      memo: memoInput.value,
    });

    amountInput.value = "";
    memoInput.value = "";
    showFormMessage("이체가 완료되었습니다.", "success");
    renderAll();
  } catch (error) {
    showFormMessage(error.message || "이체 처리 중 오류가 발생했습니다.", "error");
  }
}

function bindEvents() {
  fromAccountSelect.addEventListener("change", () => keepDifferentSelection("from"));
  toAccountSelect.addEventListener("change", () => keepDifferentSelection("to"));
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
  showFormMessage("출금 계좌와 입금 계좌를 선택한 뒤 이체를 진행하세요.", "info");
}

init();
