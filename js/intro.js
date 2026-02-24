/* --- intro.js --- */
document.addEventListener("DOMContentLoaded", () => {
    const introOverlay = document.getElementById("intro-overlay");

    // 페이지 로딩 후 2초 뒤에 인트로 숨김
    setTimeout(() => {
        if (introOverlay) {
            introOverlay.classList.add("hide");
            
            // 애니메이션이 완전히 끝난 후 요소 제거 (메모리 관리)
            setTimeout(() => {
                introOverlay.style.display = "none";
            }, 800);
        }
    }, 2000); 
});