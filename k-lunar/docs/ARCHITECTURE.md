# k-lunar 아키텍처

## 개요

`k-lunar`는 현재 `lunar-javascript`를 기반으로 하되, 그 위에 단계적인 TypeScript 패키지 계층을 얹은 집중형 포크입니다.

런타임 레벨에서는 upstream에 비교적 가깝게 유지하고 있어서, 달력 정책 변경을 작고 검토하기 쉬운 diff로 가져갈 수 있습니다.

## 현재 구조

### 런타임

- `src/index.ts`
  - 패키지 엔트리
  - 변환 중심 런타임 표면을 다시 내보냄
- `src/lunar.ts`
  - authored TypeScript로 옮긴 upstream 기반 단일형 런타임
  - 날짜, 음력, Julian day, 달력 정책 로직 대부분을 포함
- `dist/`
  - npm 배포용 빌드 결과물
- `korean-lunar-calendar`
  - 겹치는 지원 범위에서 참조로 사용하는 런타임 의존성

### 테스트

- `__tests__/`
  - 변환 중심으로 줄인 Jest 스위트
- `__tests__/k-lunar.regression.test.ts`
  - `k-lunar` 전용 정책 회귀 테스트

### 에이전트 컨텍스트

- `AGENTS.md`
  - Codex 작업용 루트 진입 문서
- `.ai/MEMORY.md`
  - 안정적인 프로젝트 사실과 upstream 기준
- `.ai/PLAN.md`
  - 현재 구현 방향
- `.ai/RULES.md`
  - 프로젝트 작업 규칙

### 하네스

- `scripts/codex-smoke.ts`
  - 빠른 성공/실패 확인
- `scripts/codex-report.ts`
  - 경계 케이스 진단 출력

## 중요한 코드 영역

현재 구현의 중심은 `src/lunar.ts`이며, 특히 다음 구간이 중요합니다.

- `Solar.fromDate`
  - 현재는 호스트 로컬 `Date` 필드에 의존
- `Solar._fromJulianDay`
  - Julian day -> 달력 변환 정책 포함
- `Solar._fromYmdHms`
  - 날짜 유효성 검사 및 1582 공백 처리 포함
- `Solar.nextYear`, `Solar.nextMonth`, `Solar.nextDay`
  - 1582 동작이 섞여 있는 날짜 이동 로직
- `SolarUtil.isLeapYear`
  - 연도에 따라 규칙을 바꾸는 윤년 계산
- `SolarUtil.getDaysOfMonth`, `getDaysOfYear`, `getDaysInYear`
  - 현재 달력 정책에 묶인 월/일/연 길이 계산

## 설계 방향

주요 목표는 아직 “대규모 재작성”이 아닙니다. 현재 설계는 단계적 전환입니다.

1. `src/lunar.ts`를 기준 변환 런타임으로 유지
2. `src/`와 `dist/`를 통해 TypeScript 패키지 표면 제공
3. 변환 검증이 안정된 뒤에만 런타임 내부를 typed module로 더 나눔

이를 통해 `k-lunar`는 다음 두 영역에서 upstream과 안전하게 분기할 수 있습니다.

- KST 기반 민간 시각 해석
- 지원 범위 전체에서의 그레고리력 양력 변환

또한 현재는 하나의 호환 브리지를 사용합니다.

- `1000-02-13`부터 `2050-12-31`까지의 지원 양력 범위에서는 `korean-lunar-calendar`와 변환 결과 정렬

## 권장 내부 분리 관점

구현이 진행될수록 아래 개념적 계층으로 나눠 보는 것이 유용합니다.

### 1. 날짜 입력 계층

역할:

- `Date` 입력 해석
- 시스템 시간대 대신 KST를 기준으로 삼을지 결정
- 음력 변환 전에 정확 시각 입력 정규화

대표 지점:

- `Solar.fromDate`

### 2. 달력 정책 계층

역할:

- 윤년 규칙
- 월/일/연 길이
- 역사 날짜 유효성
- Julian day 변환 정책

대표 지점:

- `Solar._fromJulianDay`
- `Solar._fromYmdHms`
- `SolarUtil.isLeapYear`
- `SolarUtil.getDaysOfMonth`
- `SolarUtil.getDaysOfYear`
- `SolarUtil.getDaysInYear`

### 3. 상위 도메인 계층

역할:

- 음력 변환
- 절기
- 사주와 정확 시각 기반 파생 기능

대표 지점:

- `Lunar.fromDate`를 통해 도달하는 경로
- `LunarTime`
- `EightChar`

## 현재 위험 구간

- `Date` 기반 동작은 정규화하지 않으면 런타임 로캘 차이의 영향을 받을 수 있습니다.
- Julian/Gregorian 혼합 규칙이 하나의 정책 객체에 모여 있지 않고 여러 함수에 퍼져 있습니다.
- 1582 전환이 여러 군데에 하드코딩돼 있어 부분 수정만 하면 동작 불일치가 생길 수 있습니다.
- 참조 패키지는 `1582-10-05`부터 `1582-10-14`까지의 양력 날짜를 받지 않지만, `k-lunar`는 의도적으로 그 날짜들을 유효하게 유지합니다.

## 권장 발전 방향

단기:

- `src/lunar.ts`를 기준 런타임으로 안정적으로 유지
- API 흔들림 최소화
- `dist/`는 빌드 결과물로만 유지
- 달력 정책 판단을 점차 한곳으로 모으기

중기:

- 달력 정책과 시간 정규화용 내부 헬퍼 추출 검토
- 더 깊은 변경 전에 `k-lunar` 전용 테스트 보강
- `verify:reference`가 안정적으로 유지된 뒤에만 내부 구현을 더 typed module로 분리

## 관련 문서

- `.ai/MEMORY.md`
- `.ai/PLAN.md`
- `.ai/RULES.md`
- `.ai/CODEX_HARNESS.md`
- `docs/CODEX_HARNESS_QUICKSTART.md`
- `docs/TYPESCRIPT_MIGRATION_PLAN.md`
