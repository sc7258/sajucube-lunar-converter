# k-lunar 에이전트 가이드

## 작업 범위

- 이 워크스페이스에서 실제 작업 대상은 `k-lunar/`만입니다.
- `../kasi-lunar/`는 참고 전용입니다. 일반 작업에서는 수정하지 않습니다.

## 프로젝트 목표

`k-lunar`는 `lunar-javascript`를 기반으로 다음 목적에 맞게 조정 중인 포크입니다.

- 한국 표준시(`UTC+09:00`)를 민간 시각 기준으로 사용
- 지원 범위 전체에서 그레고리력 기준 양력 변환 제공
- 변환 중심의 소스와 테스트만 유지
- npm 배포

## 중요한 파일

- `src/lunar.ts`: 단일형 런타임이며 주 구현 대상
- `src/index.ts`: 패키지 엔트리
- `__tests__/Solar.test.ts`: 양력 -> 음력 및 변환 동작 검증
- `__tests__/Lunar.test.ts`: 음력 -> 양력 및 역사 날짜 변환 검증
- `__tests__/SolarUtil.test.ts`: 변환 관련 양력 유틸리티 검증
- `__tests__/k-lunar.regression.test.ts`: 핵심 정책 회귀 테스트
- `.ai/MEMORY.md`: 장기적으로 유지할 사실과 제약
- `.ai/RULES.md`: 프로젝트별 작업 규칙과 검증 규칙
- `.ai/PLAN.md`: 의도된 동작 변경과 핵심 수정 지점
- `.ai/CODEX_HARNESS.md`: Codex 하네스 규칙
- `docs/ARCHITECTURE.md`: 사람과 에이전트가 함께 보는 구조 문서
- `docs/SCOPE_REDUCTION_PLAN.md`: 변환 중심 패키지로 줄이기 위한 단계별 계획
- `docs/TYPESCRIPT_MIGRATION_PLAN.md`: `lunar-typescript` 참고 기반 TS 전환 계획
- `scripts/codex-smoke.ts`: 빠른 성공/실패 확인용 하네스
- `scripts/codex-report.ts`: 달력 경계 케이스 진단 출력

## 권장 작업 루프

1. `.ai/MEMORY.md`와 `.ai/RULES.md`를 읽는다.
2. `.ai/PLAN.md`를 읽는다.
3. 패키지 구조나 API 레이아웃에 영향이 있으면 `docs/TYPESCRIPT_MIGRATION_PLAN.md`도 읽는다.
4. 보통 `src/lunar.ts` 또는 `src/index.ts`에서 작은 범위의 변경을 만든다.
5. `npm run build`를 실행한다.
6. `npm run harness:smoke`를 실행한다.
7. `npm run harness:report`를 실행한다.
8. `npm test`를 실행한다.

## 달력 변경 관련 메모

- 현재 authored 런타임은 `src/lunar.ts`에 있지만, 구조 자체는 여전히 upstream의 단일 파일 형태를 많이 유지합니다.
- upstream은 1582년의 역사적 공백을 하드코딩했고, 날짜에 따라 Julian/Gregorian 규칙을 섞어 사용했습니다.
- 시간 민감 동작은 `Solar.fromDate`, `Lunar.fromDate`, `LunarTime`, `EightChar`에서 도달할 수 있습니다.

## 성공 기준

- 의도적으로 문서화한 경우가 아니라면 upstream API 호환성을 유지합니다.
- 달력 정책 변경은 명시적인 테스트 또는 하네스 출력으로 검증합니다.
- 하네스 명령은 반복 실행해도 결정적이고 에이전트가 다시 쓰기 쉬워야 합니다.
