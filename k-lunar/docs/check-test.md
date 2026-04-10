# 테스트 확인 항목

## 목적

이 문서는 `k-lunar`의 그레고리력 변환 변경 이후 무엇을 확인해야 하는지 기록합니다.

현재는 단계적인 TypeScript 패키지 전환 상태도 함께 추적합니다.

## 현재 검증 상태

이 프로젝트는 현재 변환 관련 Jest 테스트만 유지합니다.

검증 명령:

```bash
PATH=/tmp/node-v22.14.0-linux-x64/bin:$PATH npm run build
PATH=/tmp/node-v22.14.0-linux-x64/bin:$PATH npm test
```

검증 시점 결과:

- `npm run build` 통과
- 테스트 스위트 `4`개 통과
- 테스트 `138`개 통과
- `todo` `0`개

패키지 엔트리 확인:

- `require(".")`는 빌드된 `dist/` 엔트리에서 `Solar`, `Lunar`, `SolarUtil`, `LunarUtil`을 반환해야 함
- `Solar.fromYmd(1397, 5, 15).getLunar().toString()`
  - 기대값: `一三九七年四月初十`
- `Solar.fromDate(new Date('2024-01-01T15:00:00.000Z')).toYmdHms()`
  - 기대값: `2024-01-02 00:00:00`

## `korean-lunar-calendar` 참조 검증

`korean-lunar-calendar`는 다음 겹치는 지원 범위에서 참조값으로 사용할 수 있습니다.

- 음력 지원 범위: `1000-01-01 ~ 2050-11-18`
- 양력 지원 범위: `1000-02-13 ~ 2050-12-31`

참조 명령:

```bash
npm run verify:reference
```

현재 상태:

- 참조 패키지: `korean-lunar-calendar@0.3.6`
- 현재 결과: `mismatchCount = 0`
- 설계상 skip: `1582-10-05` ~ `1582-10-14`

skip 이유:

- `korean-lunar-calendar`는 이 10일의 양력 날짜를 받지 않음
- `k-lunar`는 연속된 그레고리력 날짜로 이 구간을 유효하게 유지함

## 기본 테스트 범위

`k-lunar`는 변환 중심 범위로 줄여가는 중입니다.

현재 기본 명령:

```bash
npm test
```

이 명령은 변환 중심 테스트 스위트로 취급합니다.

## 다시 확인해야 할 주요 동작

### 1. 핵심 그레고리력 변환

가장 중요한 회귀 포인트입니다.

- `Solar.fromYmd(1397, 5, 15).getLunar().toString()`
  - 기대값: `一三九七年四月初十`
- `Lunar.fromYmd(1397, 4, 10).getSolar().toYmd()`
  - 기대값: `1397-05-15`

이는 역사 날짜에서 더 이상 예전 Julian식 해석을 사용하지 않는다는 핵심 증거입니다.

### 2. 1582 전환 동작

`k-lunar`는 이제 upstream의 역사적 10일 공백 대신 연속된 그레고리력 날짜 이동을 따릅니다.

중요 확인값:

- `Solar.fromYmd(1582, 10, 4).nextDay(1).toYmd()`
  - 기대값: `1582-10-05`
- `Solar.fromYmd(1582, 10, 15).nextDay(-1).toYmd()`
  - 기대값: `1582-10-14`
- `SolarUtil.getDaysBetween(1582, 10, 4, 1582, 10, 15)`
  - 기대값: `11`

### 3. 1600년 이전 윤년 동작

예전의 Julian/Gregorian 혼합 처리는 제거되었습니다.

중요 확인값:

- `SolarUtil.isLeapYear(1500)`
  - 기대값: `false`
- `SolarUtil.getDaysBetween(1582, 1, 1, 1583, 1, 1)`
  - 기대값: `365`

### 4. 역사 음력/양력 기대값

달력 정책이 바뀌면서 `1600`년 이전의 여러 테스트 기대값도 함께 조정되었습니다.

대표 예시:

- `Lunar.fromYmdHms(1500, 1, 1, 12, 0, 0).getSolar().toString()`
  - 기대값: `1500-02-09`
- `Solar.fromYmdHms(1500, 1, 1, 12, 0, 0).getLunar().toString()`
  - 기대값: `一四九九年冬月廿一`
- `Lunar.fromYmd(1518, 1, 1).getSolar().toString()`
  - 기대값: `1518-02-20`

### 5. 참조 정렬 구간

참조와 겹치는 범위에서 확인할 대표 포인트:

- `Solar.fromYmd(1022, 3, 11).getLunar().toString()`
  - 기대값: `一〇二二年正月三十`
- `Lunar.fromYmd(1022, 1, 30).getSolar().toYmd()`
  - 기대값: `1022-03-11`
- `Solar.fromYmd(2050, 12, 31).getLunar().toString()`
  - 기대값: `二〇五〇年冬月十八`

### 6. KST 고정 `Date` 해석

`Date` 입력은 실행 환경 로컬 시간대가 아니라 KST 기준으로 해석되어야 합니다.

- `Solar.fromDate(new Date('2024-01-01T14:59:59.000Z')).toYmdHms()`
  - 기대값: `2024-01-01 23:59:59`
- `Solar.fromDate(new Date('2024-01-01T15:00:00.000Z')).toYmdHms()`
  - 기대값: `2024-01-02 00:00:00`
- `Solar.fromDate(new Date('2024-01-01T14:59:59.000Z')).next(1).toYmdHms()`
  - 기대값: `2024-01-02 23:59:59`

## 실행 명령

셸 `PATH`에 `node`, `npm`이 없으면 다음처럼 실행합니다.

```bash
PATH=/tmp/node-v22.14.0-linux-x64/bin:$PATH npm run build
PATH=/tmp/node-v22.14.0-linux-x64/bin:$PATH npm test
```

### Smoke 하네스

```bash
npm run harness:smoke
```

### Report 하네스

```bash
npm run harness:report
```

### 참조 비교

```bash
npm run verify:reference
```

### KASI 샘플 비교

```bash
npm run verify:kasi:samples
```

### KASI 연도 샘플링 비교

```bash
npm run verify:kasi:years
```

현재 상태:

- `checkedSolarSamples = 4237`
- `mismatchCount = 0`
- `skippedReverseChecksCount = 5`

현재 남은 제약:

- `696 ~ 700`의 KASI 특수 월명
  - `正`
  - `臘`
- 이 구간은 solar -> lunar 결과는 맞출 수 있지만, 숫자 month만 받는 `Lunar.fromYmd(year, month, day)` API로는 역변환이 모호함
- 따라서 현재 스캔에서는 `ambiguous-special-lunar-month-reverse-check`로 skip 처리

해석:

- `verify:kasi:years`는 이제 `-59 ~ 999` 구간의 장기 검증 스캔으로 사용할 수 있습니다.
- 다만 위의 특수 월명 5건은 현재 API 표현 범위 밖의 모호성이라 skip으로 남겨둡니다.
- 공식 검증 보장 범위(`1000-02-13 ~ 2050-12-31`)는 여전히 `verify:reference` 기준으로 유지합니다.

## 이번 변경에 가장 직접적으로 영향받는 파일

- `src/lunar.ts`
- `__tests__/Lunar.test.ts`
- `__tests__/Solar.test.ts`
- `__tests__/SolarUtil.test.ts`
- `__tests__/k-lunar.regression.test.ts`
- `scripts/verify-korean-reference.ts`
- `scripts/verify-kasi-reference.ts`
- `scripts/verify-kasi-year-scan.ts`
- `scripts/generate-kasi-historical-data.ts`
- `src/kasiHistoricalData.ts`

## 이 문서를 다시 볼 시점

다음 중 하나가 바뀌면 이 문서도 갱신합니다.

- 그레고리력 변환 정책이 더 좁아지거나 더 넓어질 때
- `1582` 처리 방식이 다시 바뀔 때
- KST 기반 `Date` 해석 방식이 바뀔 때
- 새로운 역사 회귀 테스트가 추가될 때
