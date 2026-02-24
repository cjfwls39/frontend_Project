const now = new Date();
let year = now.getFullYear();
let month = now.getMonth(); // 0~11

const monthLabel = document.getElementById("monthLabel");
const calendarTitle = document.getElementById("calendarTitle");
const expenseLabel = document.getElementById("expenseTotalLabel");
const incomeLabel = document.getElementById("incomeTotalLabel");
const deltaLabel = document.getElementById("monthDeltaLabel");
const topCategoryLabel = document.getElementById("topCategoryLabel");
const calendarDays = document.getElementById("calendarDays");

const prevBtn = document.getElementById("prevMonthBtn");
const nextBtn = document.getElementById("nextMonthBtn");

const popup = document.getElementById("dayPopup");
const popupBackdrop = document.getElementById("dayPopupBackdrop");
const popupTitle = document.getElementById("dayPopupTitle");
const popupIncome = document.getElementById("dayPopupIncome");
const popupExpense = document.getElementById("dayPopupExpense");
const popupList = document.getElementById("dayTransactionList");
const popupCloseBtn = document.getElementById("closeDayPopupBtn");

const txForm = document.getElementById("txForm");
const txDateInput = document.getElementById("txDateInput");
const txTypeInput = document.getElementById("txTypeInput");
const txCategoryInput = document.getElementById("txCategoryInput");
const txAmountInput = document.getElementById("txAmountInput");
const txFormMessage = document.getElementById("txFormMessage");

const CATEGORY_MAP = {
  expense: ["식비", "카페", "교통", "쇼핑", "주거/통신", "의료/건강", "여가", "기타"],
  income: ["급여", "부수입", "용돈", "환급", "금융수익", "기타"],
};

function splitDate(text) {
  const p = text.split("-");
  return { year: Number(p[0]), month: Number(p[1]), day: Number(p[2]) };
}

function won(n) {
  return `${Math.abs(n).toLocaleString("ko-KR")}원`;
}

function getAllTransactions() {
  if (!window.TransactionStorage) return [];
  return window.TransactionStorage.getAll();
}

function getMonthList(targetYear, targetMonth) {
  const all = getAllTransactions();
  const list = [];
  for (let i = 0; i < all.length; i += 1) {
    const d = splitDate(all[i].date);
    if (d.year === targetYear && d.month === targetMonth + 1) list.push(all[i]);
  }
  return list;
}

function getTotals(list) {
  let income = 0;
  let expense = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].type === "income") income += list[i].amount;
    if (list[i].type === "expense") expense += list[i].amount;
  }
  return { income, expense };
}

function getTopCategory(list) {
  const sums = {};
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].type !== "expense") continue;
    const c = list[i].category;
    if (!sums[c]) sums[c] = 0;
    sums[c] += list[i].amount;
  }

  let maxName = "";
  let maxValue = 0;
  const keys = Object.keys(sums);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (sums[key] > maxValue) {
      maxValue = sums[key];
      maxName = key;
    }
  }
  if (!maxName) return null;
  return { name: maxName, amount: maxValue };
}

function getDaySummary(list) {
  const out = {};
  for (let i = 0; i < list.length; i += 1) {
    const tx = list[i];
    const day = splitDate(tx.date).day;
    if (!out[day]) out[day] = { income: 0, expense: 0 };
    if (tx.type === "income") out[day].income += tx.amount;
    if (tx.type === "expense") out[day].expense += tx.amount;
  }
  return out;
}

function renderHeader(list) {
  const totals = getTotals(list);
  const prevDate = new Date(year, month - 1, 1);
  const prevTotals = getTotals(getMonthList(prevDate.getFullYear(), prevDate.getMonth()));
  const diff = totals.expense - prevTotals.expense;
  const top = getTopCategory(list);

  monthLabel.textContent = `${year}년 ${month + 1}월`;
  calendarTitle.textContent = `${year}년 ${month + 1}월 지출/수입 캘린더`;
  expenseLabel.textContent = won(totals.expense);
  incomeLabel.textContent = won(totals.income);

  if (diff > 0) {
    deltaLabel.innerHTML = `지난달보다 <span class="delta-up">${won(diff)}</span> 더 지출`;
  } else if (diff < 0) {
    deltaLabel.innerHTML = `지난달보다 <span class="delta-down">${won(diff)}</span> 덜 지출`;
  } else {
    deltaLabel.textContent = "지난달과 같은 지출";
  }

  if (top) {
    topCategoryLabel.textContent = `가장 많이 쓴 항목: ${top.name} (${won(top.amount)})`;
  } else {
    topCategoryLabel.textContent = "이번 달 소비 데이터가 없습니다.";
  }
}

function makeCellValue(type, text) {
  const el = document.createElement("div");
  el.className = `cell-value ${type}`;
  el.textContent = text;
  return el;
}

function renderCalendar(list) {
  calendarDays.innerHTML = "";

  const first = new Date(year, month, 1).getDay();
  const last = new Date(year, month + 1, 0).getDate();
  const summary = getDaySummary(list);

  for (let i = 0; i < first; i += 1) {
    const empty = document.createElement("div");
    empty.className = "day-cell is-empty";
    calendarDays.appendChild(empty);
  }

  for (let day = 1; day <= last; day += 1) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.dataset.day = String(day);

    if (year === now.getFullYear() && month === now.getMonth() && day === now.getDate()) {
      cell.classList.add("is-today");
    }

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = String(day);

    const w = (first + day - 1) % 7;
    if (w === 0) number.classList.add("is-sunday");
    if (w === 6) number.classList.add("is-saturday");
    cell.appendChild(number);

    const info = summary[day];
    if (info) {
      if (info.income > 0) cell.appendChild(makeCellValue("income", `+ ${info.income.toLocaleString("ko-KR")}`));
      if (info.expense > 0) cell.appendChild(makeCellValue("expense", `- ${info.expense.toLocaleString("ko-KR")}`));
    }

    calendarDays.appendChild(cell);
  }
}

function openPopup(day, list) {
  const dayList = [];
  for (let i = 0; i < list.length; i += 1) {
    if (splitDate(list[i].date).day === day) dayList.push(list[i]);
  }

  const totals = getTotals(dayList);
  popupTitle.textContent = `${year}년 ${month + 1}월 ${day}일`;
  popupIncome.textContent = `수입 ${won(totals.income)}`;
  popupExpense.textContent = `지출 ${won(totals.expense)}`;

  popupList.innerHTML = "";
  if (dayList.length === 0) {
    const li = document.createElement("li");
    li.className = "tx-empty";
    li.textContent = "등록된 거래가 없습니다.";
    popupList.appendChild(li);
  } else {
    for (let i = 0; i < dayList.length; i += 1) {
      const tx = dayList[i];
      const li = document.createElement("li");
      li.className = "tx-item";

      const cat = document.createElement("p");
      cat.className = "tx-category";
      cat.textContent = tx.category;

      const amount = document.createElement("p");
      amount.className = `tx-amount ${tx.type}`;
      amount.textContent = `${tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("ko-KR")}원`;

      li.appendChild(cat);
      li.appendChild(amount);
      popupList.appendChild(li);
    }
  }

  popup.classList.add("is-open");
  popupBackdrop.classList.add("is-open");
}

function closePopup() {
  popup.classList.remove("is-open");
  popupBackdrop.classList.remove("is-open");
}

function render() {
  const list = getMonthList(year, month);
  renderHeader(list);
  renderCalendar(list);
}

function showFormMessage(text, isError) {
  txFormMessage.textContent = text;
  txFormMessage.classList.toggle("is-error", Boolean(isError));
  txFormMessage.classList.toggle("is-success", !isError && text.length > 0);
}

function setDefaultFormDate() {
  const todayText = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  txDateInput.value = todayText;
}

function updateCategoryOptions(type) {
  if (!txCategoryInput) return;
  const list = CATEGORY_MAP[type] || CATEGORY_MAP.expense;

  txCategoryInput.innerHTML = "";
  for (let i = 0; i < list.length; i += 1) {
    const option = document.createElement("option");
    option.value = list[i];
    option.textContent = list[i];
    txCategoryInput.appendChild(option);
  }
}

function bindTransactionForm() {
  if (!txForm) return;

  setDefaultFormDate();
  txTypeInput.value = "expense";
  updateCategoryOptions(txTypeInput.value);

  txTypeInput.addEventListener("change", () => {
    updateCategoryOptions(txTypeInput.value);
  });

  txForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const amount = Number(txAmountInput.value);
    const date = txDateInput.value;
    const type = txTypeInput.value;
    const category = txCategoryInput.value.trim();

    if (!date) {
      showFormMessage("날짜를 선택해 주세요.", true);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showFormMessage("금액은 1원 이상 입력해 주세요.", true);
      return;
    }
    if (type !== "income" && type !== "expense") {
      showFormMessage("유형이 올바르지 않습니다.", true);
      return;
    }
    if (!category) {
      showFormMessage("카테고리를 선택해 주세요.", true);
      return;
    }

    try {
      window.TransactionStorage.add({
        date,
        type,
        amount,
        category,
      });
      showFormMessage("거래가 저장되었습니다.", false);
      txAmountInput.value = "";
      updateCategoryOptions(txTypeInput.value);
      closePopup();
      render();
    } catch (error) {
      showFormMessage("저장에 실패했습니다. 입력값을 확인해 주세요.", true);
    }
  });
}

prevBtn.addEventListener("click", () => {
  month -= 1;
  if (month < 0) {
    month = 11;
    year -= 1;
  }
  closePopup();
  render();
});

nextBtn.addEventListener("click", () => {
  month += 1;
  if (month > 11) {
    month = 0;
    year += 1;
  }
  closePopup();
  render();
});

calendarDays.addEventListener("click", (e) => {
  const cell = e.target.closest(".day-cell");
  if (!cell || cell.classList.contains("is-empty")) return;
  const day = Number(cell.dataset.day);
  if (!Number.isFinite(day)) return;
  openPopup(day, getMonthList(year, month));
});

popupCloseBtn.addEventListener("click", closePopup);
popupBackdrop.addEventListener("click", closePopup);

bindTransactionForm();
render();
