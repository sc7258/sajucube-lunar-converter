# kasi-lunar

`kasi-lunar`는 한국천문연구원(KASI) 지원 범위 전체를 커버하는 한국 음력/양력 변환 TypeScript npm 라이브러리입니다.

## 배경

기존 라이브러리인 [korean-lunar-calendar](https://github.com/usingsky/korean_lunar_calendar_js)는 KASI 데이터를 기반으로 하지만 **서기 1000년 이후**만 지원합니다.
`kasi-lunar`는 이 한계를 해소하여 KASI가 제공하는 **기원전 59년부터 서기 2050년까지** 전체 범위를 지원하기 위해 만들어졌습니다.

- `1000..2050`: `korean-lunar-calendar`에 위임
- `-59..999`: KASI 월별 달력 페이지에서 직접 수집한 생성 데이터 사용

## 지원 범위

| 구분 | 시작 | 끝 |
|------|------|----|
| 양력 | 기원전 59년 2월 13일 (`-59-02-13`) | 서기 2050년 12월 31일 (`2050-12-31`) |
| 음력 | 기원전 59년 1월 1일 (`-59-01-01`) | 서기 2050년 11월 18일 (`2050-11-18`) |

## 설치

```bash
npm install kasi-lunar
```

## 사용법

```ts
import KasiLunarCalendar from "kasi-lunar";

const calendar = new KasiLunarCalendar();

calendar.setSolarDate(2023, 3, 22);
console.log(calendar.getLunarCalendar());
// { year: 2023, month: 2, day: 1, intercalation: true }
```

고대 연도의 경우 KASI 데이터에 같은 숫자 월명이 중복으로 존재할 수 있습니다.
이 경우 `monthLabel`로 `正`과 `01` 등을 구별합니다.

```ts
const calendar = new KasiLunarCalendar();

calendar.setSolarDate(696, 12, 3);
console.log(calendar.getLunarCalendar());
// { year: 697, month: 1, day: 1, intercalation: false, monthLabel: "正" }

calendar.setLunarDate(697, 1, 1, false, "正");
console.log(calendar.getSolarCalendar());
// { year: 696, month: 12, day: 3 }
```

## 스크립트

- `npm run generate:data`: KASI 월별 달력 페이지에서 초기 데이터 재생성
- `npm run check`: 소스 타입 검사
- `npm run build`: `dist`에 ESM, CJS, 타입 선언 빌드
- `npm test`: 빌드 후 검증 스크립트 실행
- `npm run harness:smoke`: 빠른 Codex 스모크 체크
- `npm run harness:report`: 현재 하네스 연결 상태 리포트

## 배포

```bash
npm publish
```
