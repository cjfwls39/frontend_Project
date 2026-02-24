/* --- main.js (Lightweight & Clean) --- */

document.addEventListener("DOMContentLoaded", () => {
    const contentCard = document.querySelector(".content-card");

    // 콘텐츠 카드 로드 시 부드러운 페이드인 효과
    if (contentCard) {
        contentCard.style.opacity = "0";
        contentCard.style.transform = "translateY(20px)";
        contentCard.style.transition = "all 0.8s ease-out";

        setTimeout(() => {
            contentCard.style.opacity = "1";
            contentCard.style.transform = "translateY(0)";
        }, 100);
    }

    // 네비게이션 액티브 효과 등 향후 확장 가능 영역
    console.log("Modern Stone & Charcoal Theme Loaded.");
});