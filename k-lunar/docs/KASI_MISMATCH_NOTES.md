# KASI 불일치 확인 메모

## 목적

이 문서는 `k-lunar`와 KASI 음양력변환계산 결과가 어긋나는 초기 연도 구간을 직접 확인할 수 있게 정리한 메모입니다.

현재는 원인 분석을 시작하는 단계이므로, "확인된 사실"과 "추정 원인"을 구분해서 적습니다.

## 현재 결론

- 공식 검증 보장 범위는 여전히 다음과 같습니다.
  - 양력: `1000-02-13 ~ 2050-12-31`
  - 음력: `1000-01-01 ~ 2050-11-18`
- 이 범위는 `korean-lunar-calendar` 기준 검증에서 `mismatchCount = 0`입니다.
- KASI 장기 검증은 현재 별도 백로그/확장 작업입니다.
- `-59 ~ 999` KASI 연도 샘플링 스캔은 이제 `mismatchCount = 0`입니다.
- 다만 `696 ~ 700`의 특수 월명(`正`, `臘`) 5건은 숫자 month API로 역변환이 모호해서 skip 처리합니다.

## 현재 KASI 스캔 결과

실행 명령:

```bash
PATH=/tmp/node-v22.14.0-linux-x64/bin:$PATH npm run verify:kasi:years
```

최근 결과:

- `checkedSolarSamples = 4237`
- `mismatchCount = 0`
- `skippedReverseChecksCount = 5`

의미:

- `-59 ~ 999` 구간 전체가 틀린 것은 아닙니다.
- 연도별 샘플 포인트(`01-01`, `04-01`, `07-01`, `10-01` + 경계일) 중 일부만 KASI와 다릅니다.
- 현재는 "차이 탐지용 스캔" 단계입니다.

## 처리한 원인

현재까지 확인된 핵심 원인은 두 가지였습니다.

### 1. `1000년 이전`은 참조 브리지 바깥이었다

- 원래 `k-lunar`는 `1000-02-13 ~ 2050-12-31` 구간에서만 `korean-lunar-calendar` 브리지를 사용했습니다.
- 그래서 `-59 ~ 999`에서는 upstream 유래 천문 월 계산 경로가 그대로 동작했습니다.
- 이 경로의 월 시작점/윤달 배치가 KASI와 다르면서 `-26`, `23`, `237 ~ 241` 같은 초기 연도 불일치가 발생했습니다.

처리:

- KASI `lunc` 월 시작 데이터를 `src/kasiHistoricalData.ts`로 생성
- `src/lunar.ts`에서 `-59 ~ 999` 구간은 KASI 기준 월 메타데이터 브리지 우선 사용

### 2. KASI는 일부 연도에서 숫자 month가 아닌 특수 월명을 쓴다

대표 예시:

- `696-01-01 -> 696년 正월 18일`
- `700-01-01 -> 700년 臘월 03일`

이 월명은 현재 숫자 month API(`Lunar.fromYmd(year, month, day)`)로는 고유하게 역표현하기 어렵습니다.

예:

- `700년 臘월 03일`
- `700년 12월 03일`

이 둘은 KASI에서 서로 다른 날짜를 가리킬 수 있습니다.

처리:

- solar -> lunar 비교는 특수 월명을 숫자 보조값으로 정규화해서 통과
- lunar -> solar 역검증은 `ambiguous-special-lunar-month-reverse-check`로 skip 분류

## 이전에 확인됐던 대표 불일치 구간

이 구간들은 현재 KASI 브리지 처리로 정렬된 상태입니다.

### 1. 기원전 26년

- `양력 -0026-04-01`
  - KASI: `음력 -26년 02월 22일`
  - `k-lunar`: `음력 -26년 02월 23일`
  - 차이: `1일`

### 2. 서기 23년

- `양력 0023-04-01`
  - KASI: `음력 23년 02월 24일`
  - `k-lunar`: `음력 23년 03월 24일`
  - 차이: `1개월`
- `양력 0023-07-01`
  - KASI: `음력 23년 05월 26일`
  - `k-lunar`: `음력 23년 06월 26일`
  - 차이: `1개월`
- `양력 0023-10-01`
  - KASI: `음력 23년 08월 30일`
  - `k-lunar`: `음력 23년 09월 30일`
  - 차이: `1개월`

### 3. 서기 237 ~ 241년

대표 예시:

- `양력 0237-04-01`
  - KASI: `음력 237년 02월 18일`
  - `k-lunar`: `음력 237년 02월 19일`
  - 차이: `1일`
- `양력 0238-04-01`
  - KASI: `음력 238년 02월 29일`
  - `k-lunar`: `음력 238년 03월 30일`
  - 차이: `1개월 + 1일`
- `양력 0240-01-01`
  - KASI: `음력 239년 11월 19일`
  - `k-lunar`: `음력 239년 윤11월 20일`
  - 차이: `윤달 여부 + 1일`

## 불일치 패턴

지금까지 보이는 패턴은 대략 세 가지입니다.

1. `1일 차이`
2. `음력 월이 1개월 밀림`
3. `윤달 여부가 다름`

즉 단순 포맷 문제가 아니라, 초기 연도대의 월 경계 또는 윤달 배치가 KASI와 다를 가능성이 큽니다.

## 현재 skip 처리되는 5건

현재 스캔에서 skip으로 남는 것은 모두 KASI 특수 월명 때문입니다.

- `0696-01-01 -> 696년 正월 18일`
- `0697-01-01 -> 697년 正월 30일`
- `0698-01-01 -> 698년 正월 10일`
- `0699-01-01 -> 699년 正월 22일`
- `0700-01-01 -> 700년 臘월 03일`

이 5건은 현재 API가 "숫자 month"만 받기 때문에 역방향에서 고유하게 지정할 수 없습니다.

## 직접 확인 명령

### 1. KASI 단건 조회

양력 -> 음력:

```bash
python3 - <<'PY'
import requests, json
for y, m, d in [(26, 4, 1), (-26, 4, 1), (23, 4, 1), (240, 1, 1)]:
    data = requests.get(
        'https://astro.kasi.re.kr/life/solc',
        params={'yyyy': y, 'mm': f'{m:02d}', 'dd': f'{d:02d}'},
        timeout=20,
    ).json()
    print(json.dumps({
        'solar': [y, m, d],
        'lunarYear': data['LUNC_YYYY'].strip(),
        'lunarMonth': data['LUNC_MM'],
        'lunarDay': data['LUNC_DD'],
        'leapMonth': data['LUNC_LEAP_MM'],
    }, ensure_ascii=False))
PY
```

### 2. `k-lunar` 단건 조회

```bash
PATH=/tmp/node-v22.14.0-linux-x64/bin:$PATH node - <<'NODE'
const { Solar } = require('./dist/src/index.js');
for (const [y, m, d] of [[26, 4, 1], [-26, 4, 1], [23, 4, 1], [240, 1, 1]]) {
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  console.log(JSON.stringify({
    solar: [y, m, d],
    lunar: [lunar.getYear(), lunar.getMonth(), lunar.getDay()],
    text: lunar.toString()
  }));
}
NODE
```

### 3. KASI 연도 샘플링 스캔

```bash
PATH=/tmp/node-v22.14.0-linux-x64/bin:$PATH npm run verify:kasi:years
```

## 오해하기 쉬운 점

`26년`과 `-26년`은 다른 케이스입니다.

예:

- `양력 0026-04-01`
  - KASI와 `k-lunar`가 일치
  - 결과: `음력 26년 02월 27일`
- `양력 -0026-04-01`
  - 현재 불일치
  - KASI: `음력 -26년 02월 22일`
  - `k-lunar`: `음력 -26년 02월 23일`

## 현재 판단

원인 자체는 이미 확인됐습니다.

1. `-59 ~ 999` 구간의 월 시작/윤달 배치를 KASI 기준으로 브리지하지 않아서 생긴 차이
2. `696 ~ 700`의 KASI 특수 월명(`正`, `臘`)이 현재 숫자 month API로는 역표현이 모호한 문제

즉 지금 남은 건 "원인 미상 버그"가 아니라 "현재 API 표현 범위의 한계"에 가깝습니다.

## 다음 조사 순서

추천 조사 순서:

1. 특수 월명을 위한 별도 label-aware API가 필요한지 결정
2. 필요하면 `正`, `冬`, `臘`를 구분하는 입력 경로 설계
3. 필요하지 않으면 현재처럼 solar -> lunar 정렬 + reverse skip 정책 유지
## 관련 파일

- [src/lunar.ts](/home/sc7258/_work_github/sajucube-lunar-converter/k-lunar/src/lunar.ts)
- [scripts/verify-kasi-reference.ts](/home/sc7258/_work_github/sajucube-lunar-converter/k-lunar/scripts/verify-kasi-reference.ts)
- [scripts/verify-kasi-year-scan.ts](/home/sc7258/_work_github/sajucube-lunar-converter/k-lunar/scripts/verify-kasi-year-scan.ts)
- [.ai/PLAN.md](/home/sc7258/_work_github/sajucube-lunar-converter/k-lunar/.ai/PLAN.md)
- [docs/check-test.md](/home/sc7258/_work_github/sajucube-lunar-converter/k-lunar/docs/check-test.md)
