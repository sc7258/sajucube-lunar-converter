# 배포 가이드 (Deployment Guide)

`kasi-lunar` 패키지를 npm 저장소에 배포하는 전체 프로세스와 주의사항을 안내합니다.

## 1. 사전 준비

- 터미널에서 npm 레지스트리에 로그인되어 있어야 합니다. (필요 시 `npm login` 또는 `bun npm login` 실행)
- 작업 디렉터리가 `kasi-lunar` 최상위 폴더인지 확인합니다.
- Git 워킹 트리가 깨끗한 상태(작업 내용이 모두 커밋된 상태)인지 확인하는 것을 권장합니다.

## 2. 전체 테스트 및 검증

배포 전 코드가 KASI 전체 지원 범위에서 정상 동작하는지 완벽하게 검증합니다.

```bash
bun run test:all
```
- 타입 검사(`check`), 빠른 검증(`harness:smoke`), 엣지 케이스 점검(`test`), 그리고 기원전 59년부터 서기 2050년까지의 전체 데이터 라운드트립(`test:sample-full`)이 모두 성공해야 합니다.

## 3. 버전 업데이트 (중요)

npm은 저장소 무결성을 위해 한 번 배포된 버전을 덮어쓰는 것을 엄격히 금지합니다. 소스 코드를 변경하고 동일한 버전으로 배포를 시도하면 **`E403 Forbidden` 에러**가 발생합니다. 따라서 배포 전 반드시 `package.json`의 버전을 올려야 합니다.

```bash
# 버그 수정 등 (예: 1.0.1 -> 1.0.2)
npm version patch

# 기능 추가 등 (예: 1.0.2 -> 1.1.0)
npm version minor
```

## 4. 패키지 배포

준비가 완료되었다면 npm 저장소에 패키지를 퍼블리싱합니다.

```bash
npm publish
```

> **💡 자동 검증 (prepublishOnly)**:
> `npm publish`를 실행하면 패키지가 업로드되기 직전에 `package.json`에 정의된 `prepublishOnly` 훅이 작동하여 `npm run check && npm run test`가 자동으로 실행됩니다. 변경 사항을 테스트하지 않고 배포하려 할 경우, 이 단계에서 숨은 에러가 발견되어 배포가 안전하게 차단됩니다.