# Codex 하네스 빠른 시작

## 목적

이 문서는 `k-lunar` 같은 프로젝트에서 최소한으로 유용한 Codex 하네스 구성을 설명합니다.

목표는 Codex에 다음을 제공하는 것입니다.

- 고정된 작업 범위
- 몇 개의 안정적인 컨텍스트 문서
- 반복 가능한 검증 루프

## 최소 구성

작은 프로젝트라면 다음 구성부터 시작하면 충분합니다.

- `AGENTS.md`
- `.ai/MEMORY.md`
- `.ai/PLAN.md`
- `.ai/RULES.md`
- 하네스 명령이 들어간 `package.json`

필요하면 나중에 추가:

- `docs/ARCHITECTURE.md`
- `.ai/CODEX_HARNESS.md`
- `.ai/TASKS.md`

이 프로젝트에서는 특히 다음 두 민감 구간을 보호하기 위해 하네스를 사용합니다.

- KST 기반 시간 해석
- 지원 범위 전체에서의 그레고리력 양력 변환 동작

## 각 구성요소의 역할

### `AGENTS.md`

Codex가 가장 먼저 읽는 루트 진입 문서로 사용합니다.

보통 이런 내용을 담습니다.

- 실제 작업 대상 디렉터리
- 가장 중요한 파일
- Codex가 따라야 할 작업 순서

### `.ai/MEMORY.md`

오랫동안 유지되어야 하는 사실을 기록하는 데 사용합니다.

보통 이런 내용을 담습니다.

- 프로젝트 목적
- upstream 기준
- 작업 범위
- 환경 제약

### `.ai/PLAN.md`

현재 구현 방향을 적는 문서로 사용합니다.

보통 이런 내용을 담습니다.

- 현재 목표
- 위험한 코드 위치
- 다음 작업 단계

### `.ai/RULES.md`

프로젝트 작업 규칙을 적는 문서로 사용합니다.

보통 이런 내용을 담습니다.

- 수정 허용 범위
- 호환성 기대사항
- 검증 순서
- 문서 갱신 규칙

## 하네스 명령 추가

가능하다면 `package.json`에 아주 작은 검증 루프를 정의해 두는 것이 좋습니다.

예시:

```json
{
  "scripts": {
    "harness:smoke": "npm run build && node dist/scripts/codex-smoke.js",
    "harness:report": "npm run build && node dist/scripts/codex-report.js",
    "test": "jest --runInBand"
  }
}
```

## 간단한 스모크 스크립트 추가

smoke 하네스는 빠르고 단순해야 합니다.

대표적인 확인 항목:

- 최소 import가 되는지
- 핵심 함수 1~3개가 여전히 동작하는지
- 실패 시 exit code `1`로 끝나는지

## 권장 Codex 작업 루프

1. `AGENTS.md` 읽기
2. `.ai/MEMORY.md` 읽기
3. `.ai/RULES.md` 읽기
4. `.ai/PLAN.md` 읽기
5. 집중된 코드 변경 만들기
6. `harness:smoke` 실행
7. `harness:report` 실행
8. 필요하면 전체 테스트 실행

## 권장 레이아웃

```text
project/
├─ AGENTS.md
├─ .ai/
│  ├─ MEMORY.md
│  ├─ PLAN.md
│  └─ RULES.md
├─ docs/
│  └─ ARCHITECTURE.md
├─ scripts/
│  ├─ codex-smoke.ts
│  └─ codex-report.ts
└─ package.json
```

## 문서를 더 늘려야 하는 시점

처음부터 파일을 너무 많이 만들 필요는 없습니다.

필요할 때만 추가하세요.

- `docs/ARCHITECTURE.md`
  - 구조와 모듈 경계가 중요해질 때
- `.ai/TASKS.md`
  - 여러 세션에 걸쳐 작업을 이어가야 할 때
- `.ai/CODEX_HARNESS.md`
  - 검증 루프를 따로 설명할 필요가 생길 때
- `docs/ADR-*.md`
  - 큰 설계 결정을 기록해야 할 때

## 실전 요약

Codex 하네스는 무거운 프레임워크가 아닙니다.

작은 프로젝트에서는 보통 다음 정도면 충분합니다.

- 3~4개의 컨텍스트 문서
- 2~3개의 검증 명령
- 1개의 안정적인 작업 루프
