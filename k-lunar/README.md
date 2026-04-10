# k-lunar

`k-lunar`는 한국식 달력 활용을 목표로 하는 `lunar-javascript` 작업용 포크입니다.

## 상태

이 패키지는 음력/양력 변환 중심의 TypeScript 패키지로 npm 배포를 준비하고 있습니다.

현재 워크스페이스에는 이미 다음이 포함되어 있습니다.

- `6tail/lunar-javascript`에서 가져온 upstream 런타임 기반
- `lunar-typescript`의 구조를 참고한 TypeScript `src/` 진입 계층
- 음력/양력 변환 중심으로 줄인 Jest 테스트 스위트
- npm 배포 가능한 패키지 메타데이터
- 예정된 동작 변경에 대한 구현 메모

## 예정된 변경

- 한국 표준시(`UTC+09:00`)를 기본 민간 시각 기준으로 사용
- 지원 범위 전체에서 음력 날짜를 그레고리력 기준 양력으로 변환
- 패키지 범위를 변환 관련 소스와 테스트 중심으로 축소

## 현재 변환 전략

- 단일형 달력 런타임은 `src/lunar.ts`의 authored TypeScript로 유지합니다.
- `src/`, `scripts/`, `__tests__/`를 authored TypeScript 소스 트리로 사용하고, `dist/`는 빌드 결과물로만 사용합니다.
- 런타임 변환은 `src/lunar.ts`와 KASI 월 시작 데이터 브리지로 처리합니다.
- `Date` 입력은 실행 환경의 로컬 시간대와 무관하게 기본적으로 `UTC+09:00` 기준으로 해석합니다.
- `1582-10-05`부터 `1582-10-14`까지도 `k-lunar`에서는 연속된 그레고리력 날짜로 유지합니다.

## 지원 범위

- 공식 검증 보장 범위
  - 양력: `1000-02-13 ~ 2050-12-31`
  - 음력: `1000-01-01 ~ 2050-11-18`
- 검증 기준
  - `korean-lunar-calendar@0.3.6`는 검증 전용 참조로 사용
  - `1582-10-05 ~ 1582-10-14`는 참조 패키지가 지원하지 않지만, `k-lunar`에서는 연속된 그레고리력 날짜로 유지
- 참고
  - 기저 런타임은 더 넓은 연도도 계산할 수 있지만, 현재 문서와 테스트로 보장하는 공식 범위는 위 구간입니다.
  - 현재 순수 구현 경로는 `1597-10` 등 일부 겹치는 범위에서 `korean-lunar-calendar`와 차이가 남아 있으며, 이는 후속 정렬 작업 대상입니다.

## 로컬 개발

이 저장소의 authored 런타임, 테스트, 하네스 코드는 모두 TypeScript로 유지됩니다.

패키지 엔트리 포인트는 빌드된 `dist/` 출력에서 제공됩니다.

```js
const { Solar, Lunar } = require(".");
```

로컬에서 패키지 엔트리를 사용하기 전에는 먼저 빌드하세요.

```bash
npm run build
```

## 문서

- `.ai/MEMORY.md`: upstream 기준 정보와 제약을 포함한 프로젝트 메모
- `.ai/PLAN.md`: 목표 변경사항과 코드 핵심 지점
- `.ai/CODEX_HARNESS.md`: Codex 하네스 작업 흐름
- `docs/ARCHITECTURE.md`: 현재 코드 구조와 설계 방향
- `docs/CODEX_HARNESS_QUICKSTART.md`: Codex 하네스 간단 적용 가이드
- `docs/SCOPE_REDUCTION_PLAN.md`: 패키지 범위를 변환 중심으로 줄이기 위한 계획
- `docs/TYPESCRIPT_MIGRATION_PLAN.md`: 단계별 TypeScript 전환 계획
- `docs/check-test.md`: 최신 빌드, 테스트, 참조 검증 확인 항목

## CI

- 루트 저장소의 `.github/workflows/k-lunar-ci.yml`는 `k-lunar/**` 변경 시 다음을 자동 실행합니다.
  - `npm test`
  - `npm run harness:smoke`
  - `npm run harness:report`
  - `npm run verify:reference`
  - `npm pack --dry-run`

## 추가 검증

- `npm run verify:reference`
  - `korean-lunar-calendar`와 겹치는 범위 전수 비교
- `npm run verify:kasi:samples`
  - KASI 음양력변환계산 엔드포인트를 이용한 대표 샘플 비교
  - 현재는 `-59`, `1`, `918`, `999`, `1000`, `1397`, `1582`, `1976`, `2050` 대표 케이스를 점검
- `npm run verify:kasi:years`
  - KASI 음양력변환계산 엔드포인트를 이용한 `-59 ~ 999` 연도 샘플링 비교
  - 현재는 각 연도별 `01-01`, `04-01`, `07-01`, `10-01`과 경계일을 점검
  - 현재 스캔 결과:
    - `checkedSolarSamples = 4237`
    - `mismatchCount = 0`
    - `skippedReverseChecksCount = 5`
  - 남은 제약:
    - `696 ~ 700`의 KASI 특수 월명 `正`, `臘`는 숫자 month만 받는 현재 API로는 역변환이 모호함
    - 따라서 이 5건은 `ambiguous-special-lunar-month-reverse-check`로 skip 처리
  - 재생성 명령:
    - `npm run generate:kasi:historical`
    - KASI `lunc` 월 시작 데이터를 다시 내려받아 `src/kasiHistoricalData.ts`를 생성

## 배포

환경에 Node.js toolchain이 준비되면 다음 순서로 실행할 수 있습니다.

```bash
npm install
npm run build
npm test
npm publish
```
