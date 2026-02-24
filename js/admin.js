const currentUserLabel = document.getElementById("currentUserLabel");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const summaryText = document.getElementById("summaryText");
const tableBody = document.getElementById("userTableBody");
const emptyText = document.getElementById("emptyText");

function formatDateTime(timestamp) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderAuthState() {
  if (!window.AuthSession || typeof window.AuthSession.getCurrentUserId !== "function") {
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

function renderUsers() {
  const users =
    window.UserStorage && typeof window.UserStorage.getUsers === "function" ? window.UserStorage.getUsers() : [];

  summaryText.textContent = `총 ${users.length}명`;
  tableBody.innerHTML = "";

  if (users.length === 0) {
    emptyText.hidden = false;
    return;
  }

  emptyText.hidden = true;

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const tr = document.createElement("tr");

    const noTd = document.createElement("td");
    noTd.textContent = String(i + 1);

    const idTd = document.createElement("td");
    idTd.textContent = user.userId;

    const nameTd = document.createElement("td");
    nameTd.textContent = user.name || "-";

    const emailTd = document.createElement("td");
    emailTd.textContent = user.email || "-";

    const createdTd = document.createElement("td");
    createdTd.textContent = formatDateTime(user.createdAt);

    tr.appendChild(noTd);
    tr.appendChild(idTd);
    tr.appendChild(nameTd);
    tr.appendChild(emailTd);
    tr.appendChild(createdTd);

    tableBody.appendChild(tr);
  }
}

function bindEvents() {
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (window.AuthSession && typeof window.AuthSession.clearCurrentUserId === "function") {
        window.AuthSession.clearCurrentUserId();
      }
      window.location.href = "login.html";
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      renderUsers();
    });
  }
}

function init() {
  renderAuthState();
  renderUsers();
  bindEvents();
}

init();
