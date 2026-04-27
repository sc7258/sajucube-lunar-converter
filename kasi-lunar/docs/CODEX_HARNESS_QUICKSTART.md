# Codex 하네스 퀵스타트

## 목적

이 문서는 `kasi-lunar` 같은 프로젝트를 위한 최소한의 Codex 하네스 설정을 설명합니다.

목표는 Codex에게 다음을 제공하는 것입니다:

- 고정된 작업 범위
- 몇 가지 안정적인 컨텍스트 문서
- 반복 가능한 검증 루프

## 최소 설정

소규모 프로젝트에서는 다음으로 시작합니다:

- `AGENTS.md`
- `.ai/MEMORY.md`
- `.ai/PLAN.md`
- `.ai/RULES.md`
- 하네스 명령어를 위한 `package.json` 스크립트

이후 선택적 추가:

- `docs/ARCHITECTURE.md`
- `.ai/CODEX_HARNESS.md`
- `.ai/TASKS.md`

## 각 파일의 역할

### `AGENTS.md`

Codex의 루트 진입점으로 사용합니다.

일반적인 내용:

- 실제 작업 대상 디렉터리
- 중요한 파일 목록
- Codex가 따라야 할 순서

### `.ai/MEMORY.md`

안정적으로 유지되어야 할 사실을 기록합니다.

일반적인 내용:

- 프로젝트 목적
- 상위 패키지 기준선
- 작업 범위
- 환경 제약 사항

### `.ai/PLAN.md`

현재 구현 방향을 기록합니다.

일반적인 내용:

- 현재 목표
- 위험한 코드 위치
- 다음 단계

### `.ai/RULES.md`

프로젝트 규칙을 기록합니다.

일반적인 내용:

- 허용된 수정 범위
- 호환성 기대치
- 검증 순서
- 문서 업데이트 규칙

## 하네스 명령어 추가

가능하면 `package.json`에 최소한의 검증 루프를 정의합니다.

예시:

```json
{
  "scripts": {
    "harness:smoke": "node scripts/codex-smoke.cjs",
    "harness:report": "node scripts/codex-report.cjs",
    "test": "jest --runInBand"
  }
}
```

## 간단한 스모크 스크립트 추가

스모크 하네스는 빠르고 단순하게 유지해야 합니다.

일반적인 검사:

- 최소한의 임포트 동작 여부
- 핵심 함수 1~3개가 여전히 실행되는지
- 실패 시 코드 `1`로 종료

## 권장 Codex 작업 루프

1. `AGENTS.md` 읽기
2. `.ai/MEMORY.md` 읽기
3. `.ai/RULES.md` 읽기
4. `.ai/PLAN.md` 읽기
5. 집중적인 코드 변경 수행
6. `bun run harness:smoke` 실행
7. `bun run harness:report` 실행
8. 필요 시 전체 테스트 스위트 실행

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
│  ├─ codex-smoke.cjs
│  └─ codex-report.cjs
└─ package.json
```

## 문서를 더 추가하는 시점

수많은 파일로 시작하지 마세요.

필요할 때만 추가하세요:

- `docs/ARCHITECTURE.md`
  - 구조와 모듈 경계가 중요해졌을 때
- `.ai/TASKS.md`
  - 여러 세션에 걸쳐 작업을 재개해야 할 때
- `.ai/CODEX_HARNESS.md`
  - 검증 루프에 별도 설명이 필요할 때
- `docs/ADR-*.md`
  - 주요 설계 결정을 기록해야 할 때

## 실용적 요약

Codex 하네스는 무거운 프레임워크가 아닙니다.

소규모 프로젝트의 경우, 보통 다음만으로 충분합니다:

- 3~4개의 컨텍스트 문서
- 2~3개의 검증 명령어
- 하나의 안정적인 작업 루프
