// 같은 기능을 가진 버튼이 같은 클래스 이름으로 두개 이상이라 all로 가져오기
const prevButtons = document.querySelectorAll(".btn-prev");
const nextButtons = document.querySelectorAll(".btn-next");

const miniDays = document.querySelector("#miniDays");
const fullDays = document.querySelector("#fullDays");

const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth()
};

function renderCalendar(){
    let firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
    let lastDate = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
    let toDay = new Date();

    // 초기화
    miniDays.innerHTML="";
    fullDays.innerHTML="";

    const yearDisplays = document.querySelectorAll(".calendar-Title-Year");
    yearDisplays.forEach(display => {
        display.textContent = `${calendarState.year}년 ${calendarState.month + 1}월`;
    });

    // 시작 요일까지 빈칸 채우기
    for (let x = 0; x < firstDay; x++) {
        miniDays.appendChild(document.createElement('div'));
        fullDays.appendChild(document.createElement('div'));
    }

    // 날짜 숫자 채워 넣기
    for (let i = 1; i <= lastDate; i++) {
        const miniDaysElement = document.createElement('div');
        const fullDaysElement = document.createElement('div');
        miniDaysElement.textContent = i;
        fullDaysElement.textContent = i;

        const dayIdx = (firstDay + i - 1) % 7;
        
        // 요일별 글자색 설정 (CSS 변수 활용)
        if(dayIdx === 0) { // 일요일
            miniDaysElement.style.color = "var(--color-danger)";
            fullDaysElement.style.color = "var(--color-danger)";
        } else if(dayIdx === 6) { // 토요일
            miniDaysElement.style.color = "var(--color-primary)";
            fullDaysElement.style.color = "var(--color-primary)";
        } else { // 평일
            miniDaysElement.style.color = "var(--text-main)";
            fullDaysElement.style.color = "var(--text-main)";
        }

        // 오늘 날짜 스타일 적용 (인디고 테마)
        if(toDay.getFullYear() === calendarState.year && 
           toDay.getMonth() === calendarState.month && 
           toDay.getDate() === i){
            
            const todayStyle = { 
                backgroundColor: "var(--color-primary-soft)", // 연한 인디고 배경
                color: "var(--color-primary)",                // 인디고 포인트 컬러
                fontWeight: "800", 
                borderRadius: "8px",
                border: "1px solid var(--color-primary)"      // 테두리 추가로 강조
            };

            Object.assign(miniDaysElement.style, todayStyle);
            Object.assign(fullDaysElement.style, todayStyle);
        }

        miniDays.appendChild(miniDaysElement);
        fullDays.appendChild(fullDaysElement);
    }
}

function moveMonth(){
    prevButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            calendarState.month--;
            if (calendarState.month < 0) {
                calendarState.month = 11;
                calendarState.year--;
            }
            renderCalendar();
        });
    });

    nextButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            calendarState.month++;
            if (calendarState.month > 11) {
                calendarState.month = 0;
                calendarState.year++;
            }
            renderCalendar();
        });
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
    
    hours = hours % 12;
    hours = hours ? hours : 12;

    const timeString = `${month}월 ${date}일(${day}) ${ampm} ${hours}:${minutes}:${seconds}`;
    clockElement.textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();
renderCalendar();
moveMonth();