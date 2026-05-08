# kasi-lunar

`kasi-lunar`는 한국천문연구원(KASI) 지원 범위 전체를 커버하는 한국 음력/양력 변환 TypeScript npm 라이브러리입니다.

## 배경

기존 라이브러리들이 지원하지 않던 고대 연도를 포함해 KASI가 제공하는 **기원전 59년부터 서기 2050년까지**의 전체 달력 범위를 완벽하게 지원하기 위해 만들어졌습니다.
외부 패키지 의존성(Zero Dependency) 없이 단독으로 동작하며, KASI 웹사이트에서 전수 수집 및 검증한 내부 데이터(`src/early-data.ts`)를 바탕으로 빠르고 정확하게 변환합니다. (참고: `korean-lunar-calendar`는 검증 및 테스트를 위한 개발 의존성으로만 사용됩니다.)

## 지원 범위

| 구분 | 시작 | 끝 |
|------|------|----|
| 양력 | 기원전 59년 2월 13일 (`-59-02-13`) | 서기 2050년 12월 31일 (`2050-12-31`) |
| 음력 | 기원전 59년 1월 1일 (`-59-01-01`) | 서기 2050년 11월 18일 (`2050-11-18`) |

## 설치

```bash
npm install kasi-lunar
```

```bash
bun add kasi-lunar
```

```bash
pnpm add kasi-lunar
```

## 요구 사항

- Node.js `18+`
- 외부 런타임 의존성 없음 (Zero Dependency)

## 사용법

```ts
import KasiLunarCalendar from "kasi-lunar";

const calendar = new KasiLunarCalendar();

calendar.setSolarDate(2023, 3, 22);
console.log(calendar.getLunarCalendar());
// { year: 2023, month: 2, day: 1, intercalation: true }
```

`setSolarDate()` 또는 `setLunarDate()`로 기준 날짜를 설정한 뒤, `getSolarCalendar()`와 `getLunarCalendar()`로 변환 결과를 읽는 방식입니다.

서기 1000년 이전의 특정 고대 연도(특히 서기 696~700년 등)의 경우 KASI 데이터에 같은 숫자 월명이 중복으로 존재할 수 있습니다.
이 경우 `monthLabel` 인자를 사용하여 `正`과 `01` 등을 명확하게 구별해야 합니다.

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
- `npm run build`: `dist`에 ESM, CJS, 타입 선언 빌드
- `npm run harness:report`: 현재 하네스 연결 상태 리포트

### 테스트

프로젝트의 무결성 검증을 위해 아래 스크립트들을 제공합니다. 모든 검증 과정을 한 번에 순차적으로 실행하려면 **`npm run test:all`** 명령어를 사용하세요.

- `npm run check`: 소스 타입 정적 검사
- `npm run harness:smoke`: 빠른 빌드 확인 및 스모크 테스트
- `npm test`: 고대 연도 중의성 등 핵심 엣지 케이스 점검
- `npm run test:sample-full`: 전체 지원 기간에 대한 샘플 날짜 및 월말 라운드트립 최종 검증
- `npm run test:all`: 위의 4가지 검증 과정을 한 번에 모두 실행

## 프로젝트 링크

- Repository: `https://github.com/sc7258/sajucube-lunar-converter/tree/main/kasi-lunar`
- Issues: `https://github.com/sc7258/sajucube-lunar-converter/issues`

## 배포

```bash
bun publish
```
