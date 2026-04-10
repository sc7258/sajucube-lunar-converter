# 프로젝트 계획

## 목표

`k-lunar`를 `lunar-javascript` 기반의 npm 배포용 포크로 준비하며, 다음 두 가지 핵심 동작 변경을 포함합니다.

1. 민간 시각 계산은 한국 표준시(`UTC+09:00`)에 맞춰야 합니다.
2. 음력 -> 양력 변환 결과는 지원 범위 전체에서 그레고리력 규칙을 사용해야 합니다.

또한 패키지 범위는 변환 관련 소스와 테스트 중심으로 줄여야 합니다.

## 현재 전환 방향

`lunar-typescript`의 파일 구조 아이디어를 참고하되, 변환 관련 모듈에만 한정합니다.

1. 전환 중에는 `src/lunar.ts`를 기준 런타임으로 유지합니다.
2. `src/index.ts`를 타입이 있는 패키지 엔트리로 유지하고, `dist/`에서 `.d.ts`와 함께 배포합니다.
3. `Date` 입력은 기본적으로 KST(`UTC+09:00`) 고정 해석을 유지합니다.
4. `korean-lunar-calendar`는 검증 전용으로만 사용하고, 런타임은 `src/lunar.ts`와 KASI 월 시작 데이터 브리지로 유지합니다.
5. 참조 검증과 회귀 테스트가 안정적으로 유지된 뒤에만 `src/lunar.ts` 내부 로직을 더 깊게 분리합니다.

## 최근 완료한 작업

- `Solar.fromDate(date)`를 실행 환경 로컬 시간대가 아니라 KST(`UTC+09:00`) 고정으로 해석하도록 변경했습니다.
- 런타임에서 `korean-lunar-calendar` 직접 호출을 제거하고, KASI 월 시작 데이터 브리지 기반 순수 구현 경로로 전환했습니다.
- `__tests__/k-lunar.regression.test.ts`에 다음 정책 회귀 테스트를 실제 코드로 옮겼습니다.
- `__tests__/k-lunar.regression.test.ts`의 `todo` 항목을 모두 실제 정책 회귀 테스트로 치환했습니다.
  - `1397-05-15 -> 음력 1397-04-10`
  - `1976-10-28 07:00:00 -> 음력 1976-09-06`
  - `음력 1976-10-28 07:00:00 -> 양력 1976-12-19 07:00:00`
  - `1582-10`의 연속된 그레고리력 날짜 이동
  - UTC 입력을 KST 고정으로 해석하는 `Date` 경계 동작
- `__tests__/k-lunar.regression.test.ts`로 회귀 테스트 스위트 이름을 정리하고, 관련 문서/스크립트 참조를 모두 갱신했습니다.
- 현재 기준 검증 상태:
  - `npm test`: `138/138` 통과
  - `npm run verify:reference`: 현재 `1597-10` 등 일부 겹치는 구간에 차이가 남아 후속 정렬 필요
  - `npm run verify:kasi:samples`: 대표 샘플 기반 KASI 비교 초안 추가
  - `npm run verify:kasi:years`: `-59 ~ 999` 연도 샘플링 검증 초안 추가
    - 현재 확인된 상태:
      - `checkedSolarSamples = 4237`
      - `mismatchCount = 0`
      - `skippedReverseChecksCount = 5`
    - 처리 내용:
      - `-59 ~ 999` 구간에 KASI 월 시작 메타데이터 브리지를 추가
      - `0000-01-01 -> 음력 -1년 윤11월 08일` 같은 역검증 미지원을 해소
      - `23`, `237 ~ 241`, `-26`에서 보이던 월 시작/윤달 불일치를 KASI 기준 데이터로 정렬
    - 남은 제약:
      - `696 ~ 700`의 `正`, `臘` 같은 KASI 특수 월명은 숫자 month API만으로는 역변환이 모호함
      - 현재는 이 5건을 `ambiguous-special-lunar-month-reverse-check` skip으로 분류
- `SolarUtil`의 그레고리력 정책 계산(`윤년`, `월 길이`, `연 길이`, `연내 일수`, `일수 차이`)을 상단 내부 헬퍼로 끌어올렸습니다.
- `Solar`의 날짜 이동(`nextYear`, `nextMonth`, `nextDay`)과 Julian day 왕복 변환(`fromJulianDay`, `getJulianDay`)을 공통 헬퍼로 정리했습니다.
- 루트 저장소에 `k-lunar` 전용 GitHub Actions 워크플로(`.github/workflows/k-lunar-ci.yml`)를 추가해 테스트, 하네스, 참조 검증, `npm pack --dry-run`을 자동화했습니다.

## 현재 진행 중인 정리 작업

- `src/lunar.ts` 상단의 내부 정책 코드를 읽기 쉬운 단위로 정리하고 있습니다.
- 우선순위는 다음과 같습니다.
  1. KST `Date` 해석 헬퍼
  2. KASI 월 시작 데이터 브리지
  3. 양력/음력 입력 정규화와 범위 검증
  4. 그레고리력 정책 계산 헬퍼
- 이 단계에서는 동작을 바꾸지 않고, 이후 분리를 쉽게 만드는 내부 경계 정리에 집중합니다.
- 현재 리팩터링 초점:
  - `SolarUtil.isLeapYear`
  - `SolarUtil.getDaysOfMonth`
  - `SolarUtil.getDaysOfYear`
  - `SolarUtil.getDaysInYear`
  - `SolarUtil.getDaysBetween`
  를 상단 내부 정책 헬퍼에 위임하도록 정리
  - `Solar._fromJulianDay`
  - `Solar.getJulianDay`
  - `Solar.nextYear`
  - `Solar.nextMonth`
  - `Solar.nextDay`
  를 날짜 이동 헬퍼 중심으로 읽기 쉽게 정리
  - 상단 내부 정책 코드를 섹션 단위로 구분하고, 문서에 검증 보장 범위를 명확히 기록
  - KASI 엔드포인트(`/life/solc`, `/life/lunc`, `/life/lunc/getMaxDate`)를 사용하는 샘플 검증 하네스 초안 추가
  - 대표 샘플 범위를 `-59`, `1`, `918`, `999`, `1000`, `1397`, `1582`, `1976`, `2050`까지 확대
  - `-59 ~ 999` 구간에 대해 연 4개 앵커(`01-01`, `04-01`, `07-01`, `10-01`)와 경계일을 사용하는 KASI 연도 샘플링 스캔 초안 추가
  - 연도 샘플링 스캔에서 드러난 초기 불일치 구간(`-26`, `23`, `237 ~ 241`)은 KASI 월 시작 메타데이터 브리지로 정렬 완료
  - `696 ~ 700`의 특수 월명(`正`, `臘`)은 숫자 month API의 표현 한계로 인해 역검증 skip 대상으로 유지
  - 배포 전 자동 검증 흐름을 CI로 고정

## 백로그

- KASI 음양력변환계산 기준의 장기 검증 범위를 추가 검토합니다.
  - 참고 기준: `https://astro.kasi.re.kr/life/pageView/8`
  - KASI 페이지의 양력 입력 범위: `-59년 02월 13일 ~ 2050년 12월 31일`
  - 목표:
    - `korean-lunar-calendar`로 검증하는 현재 범위와 별도로
    - `-59-02-13 ~ 2050-12-31` 구간에서 KASI 기준 검증 전략을 마련
  - 메모:
    - 현재 `korean-lunar-calendar` 기반 참조 검증은 `1000-02-13 ~ 2050-12-31`까지만 커버
    - `-59 ~ 999` 구간은 KASI 결과를 수집하거나 비교용 하네스를 별도로 준비해야 함
    - `1582-10-05 ~ 1582-10-14`는 KASI가 율리우스력/그레고리력 정보를 함께 제공하므로, `k-lunar`의 연속 그레고리력 정책과 어떻게 대조할지 별도 설계가 필요
  - 세부 백로그:
    1. KASI 비교 전략 문서화
       - 어떤 입력을 자동 비교할지 정의
       - 양력 -> 음력, 음력 -> 양력, 윤달 표기, 시간 포함 여부를 확정
    2. KASI 수집 방식 결정
       - 공개 API가 있는지 확인
       - API가 없으면 브라우저 자동화 또는 수동 샘플 수집 방식 설계
       - 사이트 이용 제약과 요청 빈도 제한 여부 확인
    3. KASI 비교용 데이터 포맷 설계
       - 예: `solarYmd`, `lunarYear`, `lunarMonth`, `lunarDay`, `isLeapMonth`, `calendarType`, `source`
       - `1582` 전환 구간에서는 `julian`, `gregorian`, `k-lunar-policy`를 구분할 수 있게 설계
    4. 비교 하네스 초안 작성
       - `scripts/verify-kasi-reference.ts` 같은 별도 스크립트 후보
       - 현재 `verify-korean-reference.ts`와 분리 유지
    5. 단계별 검증 범위 확대
       - 1단계: 대표 샘플 연도 검증
         - `-59`, `1`, `918`, `999`, `1000`, `1397`, `1582`, `1976`, `2050`
        - 2단계: `-59 ~ 999` 전수 또는 고밀도 샘플링 검증
         - KASI 월 시작 메타데이터 브리지 추가로 현재 `mismatchCount = 0`
         - 다만 `696 ~ 700`의 `正`, `臘` 특수 월명은 숫자 month API만으로는 역변환이 모호하여 skip으로 분류
        - 3단계: `1000 ~ 2050` 구간에서 KASI와 `korean-lunar-calendar` 차이까지 함께 비교
    6. 1582 정책 대조 규칙 정리
       - KASI의 율리우스력/그레고리력 병행 정보와
       - `k-lunar`의 연속 그레고리력 정책 사이에 어떤 값을 정답으로 채택할지 문서화
    7. 완료 조건
       - KASI 기준 장기 검증 스크립트가 별도 명령으로 재현 가능
       - `-59-02-13 ~ 2050-12-31` 범위에 대해
         - 전수 검증 또는 합의된 샘플링 검증 기준이 문서화됨
       - 불일치 케이스는 정책 차이인지 버그인지 분류할 수 있어야 함

## Upstream 유래 런타임의 현재 특징

- `Solar.fromDate(date)`는 현재 KST(`UTC+09:00`) 고정 기준으로 `Date` 인스턴스를 해석합니다.
- `Solar._fromJulianDay()`는 Julian day `2299161`을 기준으로 달력 계산을 전환합니다.
- `Solar._fromYmdHms()`는 `1582-10-05`부터 `1582-10-14`까지의 역사적 공백을 거부합니다.
- `Solar.nextYear()`, `Solar.nextMonth()`, `Solar.nextDay()`에도 1582 공백 처리 로직이 들어 있습니다.
- `SolarUtil.isLeapYear()`는 연도에 따라 Julian/Gregorian 규칙을 섞어 사용합니다.
- `SolarUtil.getDaysOfMonth()`, `getDaysOfYear()`, `getDaysInYear()`도 1582 전환 규칙을 인코딩하고 있습니다.

## 코드 핵심 지점

- `src/lunar.ts`: `Solar._fromDate`
- `src/lunar.ts`: `Solar._fromJulianDay`
- `src/lunar.ts`: `Solar._fromYmdHms`
- `src/lunar.ts`: `Solar.nextYear`
- `src/lunar.ts`: `Solar.nextMonth`
- `src/lunar.ts`: `Solar.nextDay`
- `src/lunar.ts`: `SolarUtil.isLeapYear`
- `src/lunar.ts`: `SolarUtil.getDaysOfMonth`
- `src/lunar.ts`: `SolarUtil.getDaysOfYear`
- `src/lunar.ts`: `SolarUtil.getDaysInYear`
- `src/lunar.ts`: `Lunar.fromDate`, `LunarTime`, `EightChar`를 통해 도달하는 정확 시각 관련 로직

## 다음 단계 제안

1. 공개 API와 기본 테스트를 변환 관련 기능 중심으로 유지합니다.
2. TypeScript authored 소스 구조를 유지하면서 `dist/`를 계속 배포 가능 상태로 둡니다.
3. `korean-lunar-calendar`는 검증 전용으로만 사용합니다.
4. 윤년 규칙, 월 길이, 연 길이를 하나의 내부 달력 정책 헬퍼로 조금씩 모읍니다.
5. Julian/Gregorian 혼합 동작을 proleptic Gregorian 정책으로 치환하고, 필요한 경우 1582 특수 케이스를 명시적으로 처리합니다.
6. 변환에 불필요한 upstream 기능은 의존 관계가 명확해진 뒤 제거합니다.
7. 이후 필요해지면 시간대 옵션(`system`, 임의 오프셋, 명시적 zone) 확장 API를 설계합니다.
8. 회귀 테스트 스위트는 `__tests__/k-lunar.regression.test.ts`를 기준으로 유지합니다.

## 준비 단계의 가정

지금의 준비 단계는 upstream API와 파일 레이아웃의 큰 틀을 유지한 채로 동작 변경을 집중된 diff 형태로 만들 수 있다는 가정 위에 진행됩니다.
