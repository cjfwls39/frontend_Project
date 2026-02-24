# TransactionStorage 사용 가이드

이 문서는 `js/transactionStorage.js`를 팀원이 공통으로 사용하는 방법을 설명합니다.  
거래 데이터 저장/조회는 반드시 이 모듈을 통해 처리합니다.

## 1. 이 모듈이 하는 일

- 브라우저 `localStorage`에 거래 데이터를 저장
- 저장 전에 입력값 검증
- 전역 API `window.TransactionStorage` 제공
- `localStorage`를 쓸 수 없으면 메모리 저장소로 자동 대체

## 2. 스크립트 로드 순서 (중요)

`transactionStorage.js`를 사용하는 페이지 스크립트보다 먼저 불러와야 합니다.

```html
<script src="js/transactionStorage.js" defer></script>
<script src="js/household.js" defer></script>
```

## 3. 데이터 구조

저장되는 거래 데이터의 형태는 아래와 같습니다.

```js
{
  id: "1739952000000-ab12cd",
  date: "2026-02-24",      // YYYY-MM-DD
  type: "income",          // "income" | "expense"
  amount: 12000,           // 정수, 0보다 커야 함
  category: "food",        // 문자열 (비어 있으면 "etc")
  createdAt: 1739952000000 // 숫자 timestamp
}
```

## 4. 공개 API

### `TransactionStorage.getAll()`

- 유효한 거래 목록 전체 반환
- 정렬 기준: `date` 오름차순, 같으면 `createdAt` 오름차순
- 저장소에 잘못된 데이터가 있으면 자동으로 건너뜀

```js
const list = window.TransactionStorage.getAll();
```

### `TransactionStorage.add(input)`

- 거래 1건 검증 후 저장
- 저장된 최종 객체 반환 (`id`, `createdAt` 자동 생성)
- 검증 실패 시 오류 발생

```js
window.TransactionStorage.add({
  date: "2026-02-24",
  type: "expense",
  amount: 8900,
  category: "cafe",
});
```

### `TransactionStorage.remove(id)`

- `id`로 거래 1건 삭제
- 삭제 성공 시 `true`, 대상 없으면 `false`

```js
window.TransactionStorage.remove("1739952000000-ab12cd");
```

### `TransactionStorage.clear()`

- 현재 모듈 키의 거래 데이터 전체 삭제

```js
window.TransactionStorage.clear();
```

## 5. 협업 규칙

- 기능 파일에서 `localStorage`를 직접 다루지 않습니다.
- 거래 데이터 저장/조회는 항상 `TransactionStorage`를 거칩니다.
- 검증 로직은 페이지마다 복제하지 말고 이 모듈에 유지합니다.
- 스키마 변경 시 저장 키 버전을 올립니다.
  - 예: `householder.transactions.v1` -> `householder.transactions.v2`
- 버전 변경 시 마이그레이션 또는 데이터 초기화 안내를 반드시 남깁니다.

## 6. 화면 연동 패턴

```js
function refreshScreen() {
  const list = window.TransactionStorage.getAll();
  // 1) 월 필터링
  // 2) 합계 계산
  // 3) 캘린더/차트 렌더링
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  window.TransactionStorage.add({
    date: dateInput.value,
    type: typeInput.value,
    amount: Number(amountInput.value),
    category: categoryInput.value,
  });
  refreshScreen();
});
```

## 7. 문제 해결

- `window.TransactionStorage`가 `undefined`인 경우:
  - HTML에서 스크립트 로드 순서를 확인합니다.
- 데이터가 유지되지 않는 경우:
  - 브라우저 프라이빗 모드/정책으로 저장소가 차단되었을 수 있습니다.
  - 이 경우 메모리 저장소로 동작하므로 새로고침 시 데이터가 사라질 수 있습니다.
- `add(...)`에서 오류가 나는 경우:
  - 날짜 형식(`YYYY-MM-DD`), 타입값, 금액(양수)을 확인합니다.

