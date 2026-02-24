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

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const submitButton = document.getElementById("login-btn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!loginForm || !submitButton) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        const originalText = submitButton.textContent;
        submitButton.textContent = "로그인 중...";
        submitButton.disabled = true;
        submitButton.style.opacity = "0.7";
        submitButton.style.cursor = "not-allowed";

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log("Login attempt:", { email, password });

            setSessionUserId(email);
            alert("로그인 되었습니다!");
            window.location.href = "accounts.html";
        } catch (error) {
            console.error("Login failed:", error);
            alert("로그인에 실패했습니다. 다시 시도해주세요.");
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.style.opacity = "1";
            submitButton.style.cursor = "pointer";
        }
    });
});
