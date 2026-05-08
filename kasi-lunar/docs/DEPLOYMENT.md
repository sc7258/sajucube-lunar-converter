# 배포 가이드

`kasi-lunar`를 npm 레지스트리에 안전하게 배포하기 위한 실무 체크리스트입니다.

## 1. 사전 준비

- 작업 디렉터리가 `kasi-lunar` 최상위 폴더인지 확인합니다.
- 가능하면 Git 워킹 트리를 정리한 뒤 배포합니다.
- npm 레지스트리 로그인 상태를 먼저 확인합니다.

```bash
npm login
npm whoami
```

- `npm whoami`가 사용자명을 정상 출력해야 합니다.
- 2FA가 켜져 있으면 배포 중 OTP 입력이 필요할 수 있습니다.

## 2. 버전과 메타데이터 점검

npm은 이미 배포된 버전을 다시 덮어쓸 수 없습니다. 코드, README, `repository`, `homepage`, `bugs` 같은 메타데이터를 바꿨더라도 새 버전으로 배포해야 합니다.

```bash
# 예: 1.0.4 -> 1.0.5
npm version patch
```

기능 추가가 포함되면 `minor`, 호환성 깨짐이 있으면 `major`를 사용합니다.

배포 전 아래 항목도 함께 확인합니다.

- `package.json`의 `version`
- `package.json`의 `repository`, `homepage`, `bugs`
- npm 페이지에 노출될 `README.md`

현재 npm 레지스트리에 올라간 버전은 아래처럼 확인할 수 있습니다.

```bash
npm view kasi-lunar version
```

## 3. 권장 검증 순서

기본 배포 전 검증은 아래 순서를 권장합니다.

```bash
bun run harness:smoke
bun run harness:report
```

다음 경우에는 추가 검증을 실행합니다.

- 동작 또는 공개 API 변경이 있으면 `bun test`
- 넓은 범위의 수정이 있으면 `bun run test:all`

`bun run test:all`은 아래 검증을 한 번에 실행합니다.

- `check`
- `harness:smoke`
- `test`
- `test:sample-full`

## 4. 패키지 배포

준비가 끝나면 아래 명령으로 배포합니다.

```bash
bun publish
```

`package.json`의 `prepublishOnly` 훅 때문에 실제 업로드 직전에 아래 검증이 자동으로 실행됩니다.

```bash
bun run check && bun run test
```

즉, `bun publish`만 실행해도 최소한의 타입 검사와 핵심 테스트는 한 번 더 확인됩니다.

## 5. 배포 후 확인

배포가 끝나면 레지스트리 반영 상태를 확인합니다.

```bash
npm view kasi-lunar version repository homepage --json
```

확인 포인트:

- `version`이 새 배포 버전으로 갱신되었는지
- `repository` 링크가 올바른지
- `homepage`가 README 위치를 가리키는지
- npm 패키지 페이지에 `Repository`와 `Homepage` 영역이 표시되는지

## 6. 자주 만나는 문제

### `401 Unauthorized`

현재 터미널 세션이 npm에 로그인되지 않은 상태입니다.

```bash
npm login
npm whoami
```

### `403 Forbidden`

이미 같은 버전이 배포되어 있을 가능성이 큽니다. `package.json` 버전을 올린 뒤 다시 배포합니다.

### `404 Not Found: ... does not exist in this registry`

헷갈리지만 항상 "패키지가 없다"는 뜻은 아닙니다. 기존 패키지여도 인증이 안 되어 있거나 업로드 전에 publish 흐름이 중단되면 비슷한 메시지가 보일 수 있습니다.

먼저 아래 순서로 확인합니다.

```bash
npm whoami
npm view kasi-lunar version
```

## 7. 요약

배포 순서는 아래처럼 유지하면 됩니다.

1. `npm login`
2. `npm whoami`
3. 버전 업데이트
4. `bun run harness:smoke`
5. `bun run harness:report`
6. 필요 시 `bun test` 또는 `bun run test:all`
7. `bun publish`
8. `npm view kasi-lunar version repository homepage --json`
