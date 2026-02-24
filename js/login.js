function setSessionUserId(userId) {
  if (window.AuthSession && typeof window.AuthSession.setCurrentUserId === "function") {
    window.AuthSession.setCurrentUserId(userId);
    return;
  }

  try {
    window.localStorage.setItem("householder.currentUser.v1", String(userId || "demo").trim());
  } catch (error) {
    // noop
  }
}

function fallbackSanitizeUserId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findRegisteredUser(loginIdInput) {
  if (!window.UserStorage || typeof window.UserStorage.getUsers !== "function") {
    throw new Error("회원 데이터 모듈을 불러오지 못했습니다.");
  }

  const raw = String(loginIdInput || "").trim();
  const normalizedEmail = raw.toLowerCase();
  const sanitize =
    typeof window.UserStorage.sanitizeUserId === "function"
      ? window.UserStorage.sanitizeUserId
      : fallbackSanitizeUserId;
  const normalizedUserId = sanitize(raw);

  const users = window.UserStorage.getUsers();
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const userEmail = String(user.email || "").trim().toLowerCase();
    const userId = String(user.userId || "").trim();

    if (userEmail && userEmail === normalizedEmail) {
      return user;
    }
    if (normalizedUserId && userId && userId === normalizedUserId) {
      return user;
    }
  }

  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const submitButton = document.getElementById("login-btn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!loginForm || !submitButton) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!loginId || !password) {
      alert("이메일(또는 아이디)과 비밀번호를 입력해주세요.");
      return;
    }

    const originalText = submitButton.textContent;
    submitButton.textContent = "로그인 중...";
    submitButton.disabled = true;
    submitButton.style.opacity = "0.7";
    submitButton.style.cursor = "not-allowed";

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const matchedUser = findRegisteredUser(loginId);
      if (!matchedUser) {
        throw new Error("회원가입된 계정만 로그인할 수 있습니다. 먼저 회원가입을 진행해주세요.");
      }

      setSessionUserId(matchedUser.userId);
      alert("로그인되었습니다.");
      window.location.href = "accounts.html";
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.message || "로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      submitButton.style.opacity = "1";
      submitButton.style.cursor = "pointer";
    }
  });
});
