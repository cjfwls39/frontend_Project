/* --- calendar.js --- */

const prevButtons = document.querySelectorAll(".btn-prev");
const nextButtons = document.querySelectorAll(".btn-next");
const miniDays = document.querySelector("#miniDays");
const fullDays = document.querySelector("#fullDays");

// 모달 요소
const txModal = document.getElementById("txModal");
const modalDateTitle = document.getElementById("modalDateTitle");
const modalTxList = document.getElementById("modalTxList");
const closeBtn = document.querySelector(".close-btn");

// 폼 요소
const txTypeInput = document.getElementById("txType");
const txCategoryInput = document.getElementById("txCategory");
const txAmountInput = document.getElementById("txAmount");
const btnAddTx = document.getElementById("btnAddTx");
const currentUserLabel = document.getElementById("currentUserLabel");
const logoutBtn = document.getElementById("logoutBtn");

const calendarState = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: null 
};

function formatCurrency(amount) {
    return amount.toLocaleString() + "원";
}

/**
 * 모달 리스트 새로고침
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
        li.innerHTML = `
            <div class="detail-info">
                <span class="detail-category">${tx.category}</span>
                <span class="detail-name">${isInc ? '수입' : '지출'}</span>
            </div>
            <div class="detail-right">
                <div class="detail-amount ${tx.type}">${isInc ? '+' : '-'}${formatCurrency(tx.amount)}</div>
                <span class="btn-delete" data-id="${tx.id}">&times;</span>
            </div>
        `;
        li.querySelector(".btn-delete").onclick = (e) => {
            const id = e.target.getAttribute("data-id");
            if (confirm("삭제하시겠습니까?")) {
                window.TransactionStorage.remove(id);
                renderCalendar();
                refreshModalList();
            }
        };
        modalTxList.appendChild(li);
    });
}

function openModal(dateStr) {
    calendarState.selectedDate = dateStr;
    modalDateTitle.textContent = dateStr;
    txCategoryInput.value = "";
    txAmountInput.value = "";
    refreshModalList();
    txModal.style.display = "block";
}

btnAddTx.onclick = () => {
    const category = txCategoryInput.value.trim();
    const amount = parseInt(txAmountInput.value);
    const type = txTypeInput.value;
    if (!category || isNaN(amount) || amount <= 0) {
        alert("내용과 금액을 확인해주세요.");
        return;
    }
    window.TransactionStorage.add({
        date: calendarState.selectedDate,
        type: type,
        amount: amount,
        category: category
    });
    renderCalendar();
    refreshModalList();
};

/**
 * 달력 렌더링
 */
function renderCalendar(){
    const firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
    const lastDate = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
    const toDay = new Date();
    const transactions = window.TransactionStorage ? window.TransactionStorage.getAll() : [];

    miniDays.innerHTML="";
    fullDays.innerHTML="";

    document.querySelectorAll(".calendar-Title-Year").forEach(el => {
        el.textContent = `${calendarState.year}년 ${calendarState.month + 1}월`;
    });

    // --- 주차(Rows) 동적 계산 ---
    const totalCells = firstDay + lastDate;
    const rows = Math.ceil(totalCells / 7);
    fullDays.style.gridTemplateRows = `repeat(${rows}, 1fr)`; 

    for (let x = 0; x < firstDay; x++) {
        miniDays.appendChild(document.createElement('div'));
        fullDays.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${calendarState.year}-${String(calendarState.month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const miniEl = document.createElement('div');
        miniEl.textContent = i;
        
        const fullEl = document.createElement('div');
        const dateNum = document.createElement('span');
        dateNum.textContent = i;
        fullEl.appendChild(dateNum);
        fullEl.onclick = () => openModal(dateStr);

        // 요일 클래스
        const dayIdx = (firstDay + i - 1) % 7;
        if(dayIdx === 0) { miniEl.classList.add("is-sun"); fullEl.classList.add("is-sun"); }
        else if(dayIdx === 6) { miniEl.classList.add("is-sat"); fullEl.classList.add("is-sat"); }

        // 오늘 날짜
        if(toDay.getFullYear() === calendarState.year && toDay.getMonth() === calendarState.month && toDay.getDate() === i){
            miniEl.classList.add("is-today"); 
            fullEl.classList.add("is-today");
        }

        // 요약 내역 표시
        const dayTxs = transactions.filter(tx => tx.date === dateStr);
        if (dayTxs.length > 0) {
            const txContainer = document.createElement('div');
            txContainer.className = 'tx-container';
            const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

            if (inc > 0) {
                const label = document.createElement('div');
                label.className = 'tx-label tx-income-label';
                label.textContent = `+${formatCurrency(inc)}`;
                txContainer.appendChild(label);
            }
            if (exp > 0) {
                const label = document.createElement('div');
                label.className = 'tx-label tx-expense-label';
                label.textContent = `-${formatCurrency(exp)}`;
                txContainer.appendChild(label);
            }
            fullEl.appendChild(txContainer);
        }

        miniDays.appendChild(miniEl);
        fullDays.appendChild(fullEl);
    }
}

function moveMonth(){
    prevButtons.forEach(btn => btn.onclick = () => {
        calendarState.month--;
        if (calendarState.month < 0) { calendarState.month = 11; calendarState.year--; }
        renderCalendar();
    });
    nextButtons.forEach(btn => btn.onclick = () => {
        calendarState.month++;
        if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++; }
        renderCalendar();
    });
}

function renderAuthState() {
    if (!currentUserLabel) return;

    if (!window.AuthSession || typeof window.AuthSession.getCurrentUserId !== "function") {
        currentUserLabel.textContent = "demo";
        if (logoutBtn) logoutBtn.hidden = true;
        return;
    }

    const userId = window.AuthSession.getCurrentUserId();
    const isLoggedIn =
        typeof window.AuthSession.hasCurrentUserId === "function" && window.AuthSession.hasCurrentUserId();

    currentUserLabel.textContent = userId;
    if (logoutBtn) logoutBtn.hidden = !isLoggedIn;
}

function bindAuthActions() {
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", () => {
        if (window.AuthSession && typeof window.AuthSession.clearCurrentUserId === "function") {
            window.AuthSession.clearCurrentUserId();
        }
        window.location.href = "login.html";
    });
}

closeBtn.onclick = () => txModal.style.display = "none";
window.onclick = (e) => { if (e.target == txModal) txModal.style.display = "none"; };

// 화면 크기 변경 시 달력 동기화
window.addEventListener('resize', renderCalendar);

// 초기화
bindAuthActions();
renderAuthState();
renderCalendar();
moveMonth();

function updateClock() {
    const clockElement = document.getElementById("liveClock");
    if(!clockElement) return;
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const ampm = h >= 12 ? "오후" : "오전";
    h = h % 12 || 12;
    clockElement.textContent = `${month}월 ${date}일(${day}) ${ampm} ${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();
