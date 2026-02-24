/* --- calendar.js (100% Variable & Class Based) --- */

const prevButtons = document.querySelectorAll(".btn-prev");
const nextButtons = document.querySelectorAll(".btn-next");
const miniDays = document.querySelector("#miniDays");
const fullDays = document.querySelector("#fullDays");

const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth()
};

function renderCalendar(){
    const firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
    const lastDate = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
    const toDay = new Date();

    miniDays.innerHTML="";
    fullDays.innerHTML="";

    // 년월 표시 업데이트
    const yearDisplays = document.querySelectorAll(".calendar-Title-Year");
    yearDisplays.forEach(display => {
        display.textContent = `${calendarState.year}년 ${calendarState.month + 1}월`;
    });

    // 시작 요일 빈칸 채우기
    for (let x = 0; x < firstDay; x++) {
        miniDays.appendChild(document.createElement('div'));
        fullDays.appendChild(document.createElement('div'));
    }

    // 날짜 생성 로직
    for (let i = 1; i <= lastDate; i++) {
        const miniEl = document.createElement('div');
        const fullEl = document.createElement('div');
        
        miniEl.textContent = i;
        fullEl.textContent = i;

        const dayIdx = (firstDay + i - 1) % 7;

        // 1. 요일별 클래스 부여 (CSS 변수 활용)
        if(dayIdx === 0) { 
            miniEl.classList.add("is-sun");
            fullEl.classList.add("is-sun");
        } else if(dayIdx === 6) { 
            miniEl.classList.add("is-sat");
            fullEl.classList.add("is-sat");
        }

        // 2. 오늘 날짜 판단 및 클래스 부여
        if(toDay.getFullYear() === calendarState.year && 
           toDay.getMonth() === calendarState.month && 
           toDay.getDate() === i){
            
            miniEl.classList.add("is-today");
            fullEl.classList.add("is-today");
        }

        miniDays.appendChild(miniEl);
        fullDays.appendChild(fullEl);
    }
}

function moveMonth(){
    prevButtons.forEach(btn => {
        btn.onclick = () => {
            calendarState.month--;
            if (calendarState.month < 0) {
                calendarState.month = 11;
                calendarState.year--;
            }
            renderCalendar();
        };
    });

    nextButtons.forEach(btn => {
        btn.onclick = () => {
            calendarState.month++;
            if (calendarState.month > 11) {
                calendarState.month = 0;
                calendarState.year++;
            }
            renderCalendar();
        };
    });
}

function updateClock() {
    const clockElement = document.getElementById("liveClock");
    if(!clockElement) return;

    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayList = ["일", "월", "화", "수", "목", "금", "토"];
    const day = dayList[now.getDay()];

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "오후" : "오전";
    
    hours = hours % 12 || 12;

    clockElement.textContent = `${month}월 ${date}일(${day}) ${ampm} ${hours}:${minutes}:${seconds}`;
}

// 초기화 실행
setInterval(updateClock, 1000);
updateClock();
renderCalendar();
moveMonth();