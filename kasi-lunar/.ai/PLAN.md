# 현재 계획

## 목표

- `kasi-lunar`를 TypeScript npm 라이브러리로 배포 가능한 상태로 유지
- KASI 지원 범위 전체에서 음력/양력 변환 정확도와 라운드트립 안정성 보존
- 고대 연도의 `monthLabel` 중의성과 생성 데이터 무결성을 검증 루프에 고정

## 최근 완료

- 전체 데이터 라운드트립 테스트 통과 및 배포 후보 버전을 `1.0.4`로 갱신 완료
- `正`/`01`, `臘`/`12` 중의성 케이스를 `scripts/verify-build.mjs`에 명시적 테스트로 고정 완료
- `package.json` 및 문서 변경을 커밋하여 현재 작업 트리를 정리 완료
- `bun run harness:smoke`, `bun run harness:report`를 최신 상태에서 재실행해 통과 확인 완료

## 현재 우선순위

1. `bun publish`로 최종 배포 진행
2. 배포 중 이슈가 생기면 `bun test` 또는 `bun run test:all` 재실행 여부 판단

## 다음에 판단할 일

- 실제 데이터 재생성이 자주 필요해지면 생성 결과 diff 전용 검증 흐름을 추가할지 결정
- 공개 API가 더 넓어지면 README와 아키텍처 문서의 예제를 함께 확장

## 주의 항목

- `package.json` 스크립트 이름과 패키지 진입점은 안정적으로 유지
- 스모크 검사는 빠르고 결정적이어야 함
- 하네스 문서는 현재 저장소 상태를 짧고 정확하게 설명해야 함
- 고대 KASI 연도는 같은 숫자 월을 서로 다른 `monthLabel`로 구분할 수 있음
- 초기 KASI 월 스팬은 `28..31`일까지 나타날 수 있음
- 전체 지원 기간(-59~2050년)은 `src/early-data.ts`를 통해 내부적으로 단독 처리됨 (korean-lunar-calendar 위임 없음, Zero Dependency)
