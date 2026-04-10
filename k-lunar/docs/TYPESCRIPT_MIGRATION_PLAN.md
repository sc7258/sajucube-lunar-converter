# TypeScript 전환 계획

## 목표

`k-lunar`를 전체 달력 런타임을 한 번에 재작성하지 않고도, authored source 기준으로는 TypeScript-only 구조로 옮깁니다.

## 이 계획을 쓰는 이유

- `src/lunar.ts`는 이미 그레고리력 정책 변경을 담고 있는 기준 변환 런타임입니다.
- `lunar-typescript`는 구조 참고용으로는 유용하지만, 프로젝트 전체를 그대로 들여오면 범위 밖 기능이 다시 들어옵니다.
- `k-lunar`는 `Solar`, `Lunar`, `SolarUtil`, `LunarUtil` 중심의 변환 표면만 필요합니다.

## 1단계

TypeScript authored 패키지 레이아웃을 만듭니다.

- `src/lunar.ts`
- `src/index.ts`
- `scripts/*.ts`
- `__tests__/*.ts`

이 단계에서는 `dist/`에서 빌드 결과를 배포하고, 패키지 소비자를 위해 `.d.ts`를 생성합니다.

## 2단계

아래 검증이 모두 안정적으로 유지될 때만 `src/lunar.ts` 안의 변환 핵심 헬퍼를 더 typed module로 분리합니다.

- `npm run build`
- `npm run harness:smoke`
- `npm run harness:report`
- `npm test`
- `npm run verify:reference`

## 3단계

한국 음력 참조 검증이 충분히 안정된 뒤, `src/lunar.ts`를 계속 단일형으로 유지할지, 아니면 더 작은 TS 모듈 구조로 나눌지를 결정합니다.

## 현재 결정

`lunar-typescript`는 구조 참고용으로만 사용합니다. `Foto`, `Fu`, `EightChar`, `Holiday`, `NineStar`처럼 변환 범위 밖 모듈은 다시 가져오지 않습니다.
