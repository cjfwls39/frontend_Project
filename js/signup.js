document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const submitButton = document.getElementById('signup-btn');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('password-confirm');
    const agreeAllCheckbox = document.getElementById('agree-all');

    if (!signupForm || !submitButton) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get values
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirm = confirmInput.value.trim();
        const isAgreed = agreeAllCheckbox.checked;

        // Validation
        if (!name || !email || !password || !confirm) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (password.length < 8) {
            alert('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        if (password !== confirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!isAgreed) {
            alert('서비스 이용약관에 동의해주세요.');
            return;
        }

        // Loading state
        const originalText = submitButton.textContent;
        submitButton.textContent = '가입 중...';
        submitButton.disabled = true;
        submitButton.style.opacity = '0.7';
        submitButton.style.cursor = 'not-allowed';

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Signup attempt:', { name, email, password });

            alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Signup failed:', error);
            alert('회원가입 중 오류가 발생했습니다.');
        } finally {
            // Reset state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }
    });
});
