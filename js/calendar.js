//같은 기능을 가진 버튼이 같은 클래스 이름으로 두개 이상이라 all로 가져오기
const prevButtons = document.querySelectorAll(".btn-prev");
const nextButtons = document.querySelectorAll(".btn-next");

const miniDays = document.querySelector("#miniDays");
const fullDays = document.querySelector("#fullDays");



const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth()
    //자바스크립트상 월은 0~11까지
    //0은 1월 / 1은 2월 ...
};
//객체로 변경
//이제 동적으로 날자 적용 가능

function renderCalendar(){
    console.log(calendarState.year);
    console.log(calendarState.month);
    //년/월 잘 가져왔나 확인

    //시작요일, 마지막 날자, 오늘날자 구하기
    let firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
    //시작요일이 월요일이 아닌 달이 있으니 그걸 빈칸 처리하기 위해 시작요일 먼저 구하기
    //자바스크립트상 요일도 0~6까지 => 0이 일요일 ->월화수 순서로

    let lastDate = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
    //달의 마지막 요일이 28 or 29 or 30 or 31 이니 그걸 동적으로 처리 하기위해 이렇게 구함
    //calendarState.month + 1 (ex] 1 + 1 = 3월) 의 0번째 날은 금월의 마지막 날자 즉 2월 기준 28일
    let toDay = new Date();

    //초기화
    miniDays.innerHTML="";
    fullDays.innerHTML="";

    const yearDisplays = document.querySelectorAll(".calendar-Title-Year");
    yearDisplays.forEach(display => {
        display.textContent = `${calendarState.year}년 ${calendarState.month + 1}월`;
    });


    //달이 시작하는 첫번째 요일까지 빈칸 채우기
    for (let x = 0; x < firstDay; x++) {
        miniDays.appendChild(document.createElement('div'));
        fullDays.appendChild(document.createElement('div'));
    }

    //첫번째 날부터 마지막 날까지 숫자 채워 넣고 스타일 적용
    for (let i = 1; i <= lastDate; i++) {
        const miniDaysElement = document.createElement('div');
        const fullDaysElement = document.createElement('div');
        miniDaysElement.textContent = i;
        fullDaysElement.textContent = i;

        const dayIdx = (firstDay + i - 1) % 7;
        if(dayIdx === 0) { //일요일 빨간색
            miniDaysElement.style.color = "red";
            fullDaysElement.style.color = "red";
        } else if(dayIdx === 6) { //토요일 파란색
            miniDaysElement.style.color = "blue";
            fullDaysElement.style.color = "blue";
        }

        //오늘날자 판단
        //년/월/일 이 같은지 비교
        if(toDay.getFullYear() === calendarState.year && toDay.getMonth() === calendarState.month && toDay.getDate() === i){
            const todayStyle = { 
                backgroundColor: "#0972bd", 
                color: "white", 
                fontWeight: "bold", 
                borderRadius: "5px" };
            //오늘 날짜 표시 스타일 한번에 지정

            Object.assign(miniDaysElement.style, todayStyle);
            Object.assign(fullDaysElement.style, todayStyle);
            //=> todayStyle라는 출처가 되는 객체를 miniDaysElement.style 객체에 복사
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
    const now = new Date();
    
    const month = now.getMonth() + 1; // 월 (1-12)
    const date = now.getDate(); // 일
    const dayList = ["일", "월", "화", "수", "목", "금", "토"];
    const day = dayList[now.getDay()]; // 요일

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0"); // 두 자리 유지
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "오후" : "오전";
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0시일 경우 12시로 표시

    const timeString = `${month}월 ${date}일(${day}) ${ampm} ${hours}:${minutes}:${seconds}`;
    
    clockElement.textContent = timeString;
}

// 1초마다 업데이트 실행
setInterval(updateClock, 1000);

updateClock();
renderCalendar();
moveMonth();