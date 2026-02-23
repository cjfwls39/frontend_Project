const targets = document.querySelectorAll(".main-section2");
  
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0,              
      rootMargin: "-50% 0px -50% 0px" 
    });
  
    targets.forEach(t => io.observe(t));

const section3 = document.querySelector(".main-section3");
const leftBox = document.querySelector(".left-box");
const rightBox = document.querySelector(".right-box");

const MAX_MOVE = 400; 

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

let ticking = false;

function update() {
  ticking = false;
  if (!section3 || !leftBox || !rightBox) return;

  // 모션 줄이기 설정이면 고정
  if (prefersReduced) {
    leftBox.style.transform = "translateX(0px)";
    rightBox.style.transform = "translateX(0px)";
    return;
  }

  const rect = section3.getBoundingClientRect();
  const vh = window.innerHeight;

  const start = vh * 0.8;
  const end = vh * 0.2;

  const progress = clamp01((start - rect.top) / (start - end));

  const leftX = -MAX_MOVE * progress;
  const rightX = MAX_MOVE * progress;

  leftBox.style.transform = `translateX(${leftX}px)`;
  rightBox.style.transform = `translateX(${rightX}px)`;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);

update();