# 프로젝트 메모

## 안정적인 사실

- 이 저장소에서 실제 작업 대상은 `k-lunar/`입니다.
- `../kasi-lunar/`는 명시적으로 요청되지 않는 한 참고 전용입니다.
- `k-lunar`는 `lunar-javascript`에서 시작했습니다.
- 현재 `k-lunar`는 `lunar-typescript` 구조를 참고한 단계적 TypeScript 전환을 사용합니다.
- `k-lunar`는 음력/양력 변환에 필요한 소스만 남기는 방향을 목표로 합니다.
- `k-lunar` 런타임은 `korean-lunar-calendar`를 직접 호출하지 않고, TypeScript 런타임과 KASI 월 시작 데이터 브리지로 동작합니다.
- 현재 공식 검증 보장 범위는 양력 `1000-02-13 ~ 2050-12-31`, 음력 `1000-01-01 ~ 2050-11-18`입니다.
- `korean-lunar-calendar`는 검증 전용 참조이며, 현재 순수 구현 경로와의 차이 분석 대상도 겸합니다.
- `k-lunar`는 참조 패키지가 지원하지 않더라도 `1582-10-05`부터 `1582-10-14`까지의 연속된 그레고리력 날짜를 유지합니다.
- `Date` 기반 입력은 현재 기본적으로 시스템 시간대가 아니라 KST(`UTC+09:00`) 고정으로 해석합니다.
- 주요 목표 변경 1: 한국 표준시(`UTC+09:00`)를 민간 시각 기준으로 사용
- 주요 목표 변경 2: 지원 범위 전체에서 음력 날짜를 그레고리력 기준 양력으로 변환
- npm 배포가 최종 목표에 포함됩니다.

## Upstream 기준

- upstream 프로젝트: `https://github.com/6tail/lunar-javascript`
- 가져온 날짜: `2026-04-08`
- 가져온 upstream 커밋: `4c45a59f79b856125516f31aefa8295035c16afd`

## 가져온 파일

- `src/index.ts`
- `src/lunar.ts`
- `LICENSE`
- `.npmignore`
- `__tests__/`

## 현재 제약

- 현재 셸 환경에서는 기본 `PATH`에 `node`와 `npm`이 잡혀 있지 않습니다.
- portable Node.js toolchain은 `/tmp/node-v22.14.0-linux-x64/bin`에 있습니다.
- 루트 저장소의 `.github/workflows/k-lunar-ci.yml`는 `k-lunar/**` 변경 시 Node 22 기준 자동 검증을 수행합니다.
- upstream에서 가져온 API는 의도적으로 문서화한 경우가 아니면 가능한 한 호환성을 유지해야 합니다.

## 작업 가정

- 가능하면 upstream 대비 diff가 집중된 상태를 유지합니다.
- 깊은 런타임 리팩터링보다, 먼저 TS 패키지 엔트리를 안정화하는 단계적 전환을 선호합니다.
- 별도 예외를 문서화하지 않는 한, 양력 출력은 proleptic Gregorian으로 취급합니다.
- 기저 런타임은 더 넓은 연도도 계산할 수 있지만, 그 구간은 아직 공식 검증 범위로 간주하지 않습니다.
- Node.js가 가능할 때는 smoke 하네스와 report 하네스를 기본 검증 루프로 사용합니다.
