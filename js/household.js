// -----------------------------
// 1) 기본 날짜 / 화면 상태
// -----------------------------
const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); // 0~11
let selectedDay = null;

// -----------------------------
// 2) 더미 거래 데이터
// -----------------------------
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

const prevDate = new Date(currentYear, today.getMonth() - 1, 1);
const prevYear = prevDate.getFullYear();
const prevMonth = prevDate.getMonth() + 1;

const transactions = [
  { id: 1, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`, type: "expense", amount: 369800, category: "생활" },
  { id: 2, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-03`, type: "expense", amount: 66900, category: "식비" },
  { id: 3, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-04`, type: "expense", amount: 24490, category: "교통" },
  { id: 4, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-05`, type: "expense", amount: 25260, category: "생활" },
  { id: 5, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-07`, type: "income", amount: 1456000, category: "급여" },
  { id: 6, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-08`, type: "income", amount: 100000, category: "용돈" },
  { id: 7, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-08`, type: "expense", amount: 16200, category: "카페" },
  { id: 8, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-09`, type: "income", amount: 4500, category: "기타수입" },
  { id: 9, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-10`, type: "expense", amount: 990000, category: "의료/건강" },
  { id: 10, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-12`, type: "expense", amount: 44600, category: "생활" },
  { id: 11, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-13`, type: "expense", amount: 151400, category: "의료/건강" },
  { id: 12, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-14`, type: "income", amount: 85800, category: "환급" },
  { id: 13, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-16`, type: "expense", amount: 65000, category: "쇼핑" },
  { id: 14, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-19`, type: "expense", amount: 88000, category: "식비" },
  { id: 15, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-23`, type: "income", amount: 250000, category: "부수입" },
  { id: 16, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-27`, type: "expense", amount: 132000, category: "교통" },
  { id: 17, date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-30`, type: "expense", amount: 72000, category: "생활" },

  { id: 18, date: `${prevYear}-${String(prevMonth).padStart(2, "0")}-02`, type: "expense", amount: 1900000, category: "의료/건강" },
  { id: 19, date: `${prevYear}-${String(prevMonth).padStart(2, "0")}-11`, type: "income", amount: 1350000, category: "급여" },
  { id: 20, date: `${prevYear}-${String(prevMonth).padStart(2, "0")}-14`, type: "expense", amount: 420000, category: "생활" },
  { id: 21, date: `${prevYear}-${String(prevMonth).padStart(2, "0")}-21`, type: "expense", amount: 1550000, category: "여가" },
];

// -----------------------------
// 3) 자주 쓰는 DOM
// -----------------------------
const monthLabelEl = document.getElementById("monthLabel");
const calendarTitleEl = document.getElementById("calendarTitle");
const expenseTotalLabelEl = document.getElementById("expenseTotalLabel");
const incomeTotalLabelEl = document.getElementById("incomeTotalLabel");
const monthDeltaLabelEl = document.getElementById("monthDeltaLabel");
const topCategoryLabelEl = document.getElementById("topCategoryLabel");
const calendarDaysEl = document.getElementById("calendarDays");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

const dayPopupEl = document.getElementById("dayPopup");
const dayPopupBackdropEl = document.getElementById("dayPopupBackdrop");
const dayPopupTitleEl = document.getElementById("dayPopupTitle");
const dayPopupIncomeEl = document.getElementById("dayPopupIncome");
const dayPopupExpenseEl = document.getElementById("dayPopupExpense");
const dayTransactionListEl = document.getElementById("dayTransactionList");
const closeDayPopupBtn = document.getElementById("closeDayPopupBtn");

// -----------------------------
// 4) 작은 유틸 함수
// -----------------------------
function splitDate(text) {
  const parts = text.split("-");
  return {
    year: Number(parts[0]),
    month: Number(parts[1]),
    day: Number(parts[2]),
  };
}

function won(amount) {
  return `${Math.abs(amount).toLocaleString("ko-KR")}원`;
}

function monthTransactions(year, monthZeroBased) {
  const list = [];
  for (let i = 0; i < transactions.length; i += 1) {
    const tx = transactions[i];
    const d = splitDate(tx.date);
    if (d.year === year && d.month === monthZeroBased + 1) {
      list.push(tx);
    }
  }
  return list;
}

function totalsOf(list) {
  let income = 0;
  let expense = 0;

  for (let i = 0; i < list.length; i += 1) {
    if (list[i].type === "income") income += list[i].amount;
    if (list[i].type === "expense") expense += list[i].amount;
  }

  return { income, expense };
}

function topExpenseCategoryOf(list) {
  const categorySum = {};

  for (let i = 0; i < list.length; i += 1) {
    const tx = list[i];
    if (tx.type !== "expense") continue;

    if (!categorySum[tx.category]) categorySum[tx.category] = 0;
    categorySum[tx.category] += tx.amount;
  }

  let maxCategory = null;
  let maxAmount = 0;
  const keys = Object.keys(categorySum);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (categorySum[key] > maxAmount) {
      maxAmount = categorySum[key];
      maxCategory = key;
    }
  }

  if (!maxCategory) return null;
  return { category: maxCategory, amount: maxAmount };
}

function dailySummaryOf(list) {
  // 예: summary[8] = { income: 100000, expense: 16200, net: 83800 }
  const summary = {};

  for (let i = 0; i < list.length; i += 1) {
    const tx = list[i];
    const day = splitDate(tx.date).day;

    if (!summary[day]) {
      summary[day] = { income: 0, expense: 0, net: 0 };
    }

    if (tx.type === "income") summary[day].income += tx.amount;
    if (tx.type === "expense") summary[day].expense += tx.amount;

    summary[day].net = summary[day].income - summary[day].expense;
  }

  return summary;
}

// -----------------------------
// 5) 상단 요약 영역 그리기
// -----------------------------
function renderSummary(list) {
  const totals = totalsOf(list);

  monthLabelEl.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  calendarTitleEl.textContent = `${viewYear}년 ${viewMonth + 1}월 지출/수입 캘린더`;
  expenseTotalLabelEl.textContent = won(totals.expense);
  incomeTotalLabelEl.textContent = won(totals.income);

  // 지난달 지출과 비교
  const prev = new Date(viewYear, viewMonth - 1, 1);
  const prevList = monthTransactions(prev.getFullYear(), prev.getMonth());
  const prevExpense = totalsOf(prevList).expense;
  const diff = totals.expense - prevExpense;

  if (diff > 0) {
    monthDeltaLabelEl.innerHTML = `지난달보다 <span class="delta-up">${won(diff)}</span> 더 지출했어요.`;
  } else if (diff < 0) {
    monthDeltaLabelEl.innerHTML = `지난달보다 <span class="delta-down">${won(diff)}</span> 덜 지출했어요.`;
  } else {
    monthDeltaLabelEl.textContent = "지난달과 같은 수준으로 지출했어요.";
  }

  const top = topExpenseCategoryOf(list);
  if (top) {
    topCategoryLabelEl.textContent = `가장 많이 쓴 항목은 "${top.category}" (${won(top.amount)}) 입니다.`;
  } else {
    topCategoryLabelEl.textContent = "이번 달 소비 데이터가 없습니다.";
  }
}

// -----------------------------
// 6) 달력 그리기
// -----------------------------
function makeCellValue(className, label, amount) {
  const el = document.createElement("div");
  el.className = `cell-value ${className}`;
  el.textContent = `${label} ${amount.toLocaleString("ko-KR")}`;
  return el;
}

function makeEmptyCell() {
  const cell = document.createElement("div");
  cell.className = "day-cell is-empty";
  return cell;
}

function makeDayCell(day, firstDayOfWeek, dayInfo) {
  const cell = document.createElement("div");
  cell.className = "day-cell";
  cell.dataset.day = String(day);

  // 선택된 날짜 강조
  if (selectedDay === day) {
    cell.classList.add("is-selected");
  }

  // 오늘 날짜 강조
  if (
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate()
  ) {
    cell.classList.add("is-today");
  }

  // 날짜 숫자
  const dayNumber = document.createElement("div");
  dayNumber.className = "day-number";
  dayNumber.textContent = String(day);

  const weekIndex = (firstDayOfWeek + day - 1) % 7;
  if (weekIndex === 0) dayNumber.classList.add("is-sunday");
  if (weekIndex === 6) dayNumber.classList.add("is-saturday");

  cell.appendChild(dayNumber);

  // 금액 표시
  if (dayInfo) {
    if (dayInfo.income > 0) {
      cell.appendChild(makeCellValue("income", "+", dayInfo.income));
    }
    if (dayInfo.expense > 0) {
      cell.appendChild(makeCellValue("expense", "-", dayInfo.expense));
    }
    if (dayInfo.income > 0 || dayInfo.expense > 0) {
      cell.appendChild(makeCellValue("net", "순", dayInfo.net));
    }
  }

  return cell;
}

function renderCalendar(list) {
  calendarDaysEl.innerHTML = "";

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const summary = dailySummaryOf(list);

  // 앞쪽 빈 칸
  for (let i = 0; i < firstDayOfWeek; i += 1) {
    calendarDaysEl.appendChild(makeEmptyCell());
  }

  // 날짜 칸
  for (let day = 1; day <= lastDate; day += 1) {
    const dayInfo = summary[day] || null;
    calendarDaysEl.appendChild(makeDayCell(day, firstDayOfWeek, dayInfo));
  }
}

// -----------------------------
// 7) 날짜 팝업
// -----------------------------
function dayTransactions(list, day) {
  const result = [];
  for (let i = 0; i < list.length; i += 1) {
    if (splitDate(list[i].date).day === day) {
      result.push(list[i]);
    }
  }
  return result;
}

function openPopup(day, list) {
  const listOfDay = dayTransactions(list, day);
  const totals = totalsOf(listOfDay);

  dayPopupTitleEl.textContent = `${viewYear}년 ${viewMonth + 1}월 ${day}일`;
  dayPopupIncomeEl.textContent = `수입 ${won(totals.income)}`;
  dayPopupExpenseEl.textContent = `지출 ${won(totals.expense)}`;

  dayTransactionListEl.innerHTML = "";

  if (listOfDay.length === 0) {
    const empty = document.createElement("li");
    empty.className = "tx-empty";
    empty.textContent = "등록된 거래가 없습니다.";
    dayTransactionListEl.appendChild(empty);
  } else {
    for (let i = 0; i < listOfDay.length; i += 1) {
      const tx = listOfDay[i];

      const item = document.createElement("li");
      item.className = "tx-item";

      const left = document.createElement("div");
      left.className = "tx-item-left";

      const type = document.createElement("span");
      type.className = `tx-type ${tx.type}`;
      type.textContent = tx.type === "income" ? "수입" : "지출";

      const category = document.createElement("p");
      category.className = "tx-category";
      category.textContent = tx.category;

      left.appendChild(type);
      left.appendChild(category);

      const amount = document.createElement("p");
      amount.className = `tx-amount ${tx.type}`;
      amount.textContent = `${tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("ko-KR")}원`;

      item.appendChild(left);
      item.appendChild(amount);
      dayTransactionListEl.appendChild(item);
    }
  }

  dayPopupEl.classList.add("is-open");
  dayPopupBackdropEl.classList.add("is-open");
  dayPopupEl.setAttribute("aria-hidden", "false");
  dayPopupBackdropEl.setAttribute("aria-hidden", "false");
}

function closePopup() {
  dayPopupEl.classList.remove("is-open");
  dayPopupBackdropEl.classList.remove("is-open");
  dayPopupEl.setAttribute("aria-hidden", "true");
  dayPopupBackdropEl.setAttribute("aria-hidden", "true");
}

// -----------------------------
// 8) 전체 렌더
// -----------------------------
function renderAll() {
  const list = monthTransactions(viewYear, viewMonth);
  renderSummary(list);
  renderCalendar(list);

  // 선택 날짜가 있으면 팝업 내용도 다시 맞춰줌
  if (selectedDay !== null) {
    openPopup(selectedDay, list);
  }
}

// -----------------------------
// 9) 이벤트
// -----------------------------
prevMonthBtn.addEventListener("click", () => {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }

  selectedDay = null;
  closePopup();
  renderAll();
});

nextMonthBtn.addEventListener("click", () => {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }

  selectedDay = null;
  closePopup();
  renderAll();
});

calendarDaysEl.addEventListener("click", (event) => {
  const cell = event.target.closest(".day-cell");
  if (!cell) return;
  if (cell.classList.contains("is-empty")) return;

  selectedDay = Number(cell.dataset.day);
  if (!Number.isFinite(selectedDay)) return;

  const list = monthTransactions(viewYear, viewMonth);
  renderCalendar(list);
  openPopup(selectedDay, list);
});

closeDayPopupBtn.addEventListener("click", () => {
  selectedDay = null;
  closePopup();
  renderCalendar(monthTransactions(viewYear, viewMonth));
});

dayPopupBackdropEl.addEventListener("click", () => {
  selectedDay = null;
  closePopup();
  renderCalendar(monthTransactions(viewYear, viewMonth));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    selectedDay = null;
    closePopup();
    renderCalendar(monthTransactions(viewYear, viewMonth));
  }
});

// 첫 렌더
renderAll();
