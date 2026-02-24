/* --- calendar.js --- */

const prevButtons = document.querySelectorAll(".btn-prev");
const nextButtons = document.querySelectorAll(".btn-next");
const miniDays = document.querySelector("#miniDays");
const fullDays = document.querySelector("#fullDays");

// 모달 및 폼 요소
const txModal = document.getElementById("txModal");
const modalDateTitle = document.getElementById("modalDateTitle");
const modalTxList = document.getElementById("modalTxList");
const closeBtn = document.querySelector(".close-btn");

const txTypeInput = document.getElementById("txType");
const txCategoryInput = document.getElementById("txCategory");
const txAmountInput = document.getElementById("txAmount");
const btnAddTx = document.getElementById("btnAddTx");

const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: null // 현재 모달이 열린 날짜 (YYYY-MM-DD)
};

function formatCurrency(amount) {
    return amount.toLocaleString() + "원";
}

/**
 * 모달 내부 리스트만 다시 그리기
 */
function refreshModalList() {
    modalTxList.innerHTML = "";
    const transactions = window.TransactionStorage ? window.TransactionStorage.getAll() : [];
    const dayTxs = transactions.filter(tx => tx.date === calendarState.selectedDate);

    if (dayTxs.length === 0) {
        modalTxList.innerHTML = `<li style="text-align:center; color:var(--text-muted); padding:20px; font-size:12px;">내역이 없습니다.</li>`;
        return;
    }

    dayTxs.forEach(tx => {
        const li = document.createElement("li");
        li.className = "detail-item";
        
        const isInc = tx.type === "income";
        const typeLabel = isInc ? "+" : "-";

        li.innerHTML = `
            <div class="detail-info">
                <span class="detail-category">${tx.category}</span>
                <span class="detail-name">${isInc ? '수입' : '지출'}</span>
            </div>
            <div class="detail-right">
                <div class="detail-amount ${tx.type}">
                    ${typeLabel}${formatCurrency(tx.amount)}
                </div>
                <span class="btn-delete" data-id="${tx.id}">&times;</span>
            </div>
        `;

        // 삭제 버튼 이벤트 연결
        li.querySelector(".btn-delete").onclick = (e) => {
            const id = e.target.getAttribute("data-id");
            if (confirm("이 내역을 삭제하시겠습니까?")) {
                window.TransactionStorage.remove(id);
                renderCalendar();    // 달력 업데이트
                refreshModalList();  // 모달 리스트 업데이트
            }
        };

        modalTxList.appendChild(li);
    });
}

/**
 * 상세 관리 모달 열기
 */
function openModal(dateStr) {
    calendarState.selectedDate = dateStr;
    modalDateTitle.textContent = dateStr;
    
    // 입력 필드 초기화
    txCategoryInput.value = "";
    txAmountInput.value = "";
    
    refreshModalList();
    txModal.style.display = "block";
}

/**
 * 내역 추가 핸들러
 */
btnAddTx.onclick = () => {
    const category = txCategoryInput.value.trim();
    const amount = parseInt(txAmountInput.value);
    const type = txTypeInput.value;

    if (!category || isNaN(amount) || amount <= 0) {
        alert("카테고리와 올바른 금액을 입력해주세요.");
        return;
    }

    window.TransactionStorage.add({
        date: calendarState.selectedDate,
        type: type,
        amount: amount,
        category: category
    });

    txCategoryInput.value = "";
    txAmountInput.value = "";
    
    renderCalendar();    // 달력 다시 그리기
    refreshModalList();  // 모달 목록 다시 그리기
};

function renderCalendar(){
    const firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
    const lastDate = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
    const toDay = new Date();

    const transactions = window.TransactionStorage ? window.TransactionStorage.getAll() : [];

    miniDays.innerHTML="";
    fullDays.innerHTML="";

    const yearDisplays = document.querySelectorAll(".calendar-Title-Year");
    yearDisplays.forEach(display => {
        display.textContent = `${calendarState.year}년 ${calendarState.month + 1}월`;
    });

    for (let x = 0; x < firstDay; x++) {
        miniDays.appendChild(document.createElement('div'));
        fullDays.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= lastDate; i++) {
        const miniEl = document.createElement('div');
        const fullEl = document.createElement('div');
        const dateStr = `${calendarState.year}-${String(calendarState.month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        miniEl.textContent = i;
        const dateNum = document.createElement('span');
        dateNum.textContent = i;
        fullEl.appendChild(dateNum);

        fullEl.onclick = () => openModal(dateStr);

        const dayIdx = (firstDay + i - 1) % 7;
        if(dayIdx === 0) { 
            miniEl.classList.add("is-sun");
            fullEl.classList.add("is-sun");
        } else if(dayIdx === 6) { 
            miniEl.classList.add("is-sat");
            fullEl.classList.add("is-sat");
        }

        if(toDay.getFullYear() === calendarState.year && toDay.getMonth() === calendarState.month && toDay.getDate() === i){
            miniEl.classList.add("is-today");
            fullEl.classList.add("is-today");
        }

        const dayTxs = transactions.filter(tx => tx.date === dateStr);
        if (dayTxs.length > 0) {
            const txContainer = document.createElement('div');
            txContainer.className = 'tx-container';
            const incomeTotal = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenseTotal = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

            if (incomeTotal > 0) {
                const incLabel = document.createElement('div');
                incLabel.className = 'tx-label tx-income-label';
                incLabel.textContent = `+${formatCurrency(incomeTotal)}`;
                txContainer.appendChild(incLabel);
            }
            if (expenseTotal > 0) {
                const expLabel = document.createElement('div');
                expLabel.className = 'tx-label tx-expense-label';
                expLabel.textContent = `-${formatCurrency(expenseTotal)}`;
                txContainer.appendChild(expLabel);
            }
            fullEl.appendChild(txContainer);
        }

        miniDays.appendChild(miniEl);
        fullDays.appendChild(fullEl);
    }
}

function moveMonth(){
    prevButtons.forEach(btn => {
        btn.onclick = () => {
            calendarState.month--;
            if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
            renderCalendar();
        };
    });
    nextButtons.forEach(btn => {
        btn.onclick = () => {
            calendarState.month++;
            if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
            renderCalendar();
        };
    });
}

closeBtn.onclick = () => txModal.style.display = "none";
window.onclick = (event) => { if (event.target == txModal) txModal.style.display = "none"; };

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

setInterval(updateClock, 1000);
updateClock();
renderCalendar();
moveMonth();