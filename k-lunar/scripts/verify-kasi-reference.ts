// @ts-nocheck
import { Lunar, Solar } from "../src/index";

const KASI_BASE_URL = "https://astro.kasi.re.kr";
const MAX_MISMATCHES = 20;

const SOLAR_SAMPLES = [
  { year: -59, month: 2, day: 13, note: "KASI lower bound" },
  { year: 1, month: 1, day: 1, note: "early CE sample" },
  { year: 918, month: 1, day: 1, note: "pre-reference historic sample" },
  { year: 999, month: 1, day: 1, note: "pre-reference boundary sample" },
  { year: 1000, month: 2, day: 13, note: "reference overlap start" },
  { year: 1397, month: 5, day: 15, note: "historic Gregorian regression" },
  { year: 1582, month: 10, day: 4, note: "Gregorian reform eve" },
  { year: 1582, month: 10, day: 15, note: "Gregorian reform boundary" },
  { year: 1976, month: 10, day: 28, note: "modern sample" },
  { year: 2050, month: 12, day: 31, note: "KASI upper bound" }
];

const LUNAR_SAMPLES = [
  { year: -59, month: 1, day: 1, isLeapMonth: false, note: "KASI lower bound" },
  { year: 1, month: 1, day: 1, isLeapMonth: false, note: "early CE sample" },
  { year: 918, month: 1, day: 1, isLeapMonth: false, note: "pre-reference historic sample" },
  { year: 999, month: 1, day: 1, isLeapMonth: false, note: "pre-reference boundary sample" },
  { year: 1000, month: 1, day: 1, isLeapMonth: false, note: "reference overlap start" },
  { year: 1397, month: 4, day: 10, isLeapMonth: false, note: "historic Gregorian regression" },
  { year: 1582, month: 9, day: 18, isLeapMonth: false, note: "Gregorian reform eve" },
  { year: 1582, month: 9, day: 19, isLeapMonth: false, note: "Gregorian reform boundary" },
  { year: 1976, month: 9, day: 6, isLeapMonth: false, note: "modern sample" },
  { year: 2050, month: 11, day: 18, isLeapMonth: false, note: "KASI upper bound" }
];

function pad(value, length = 2) {
  const negative = Number(value) < 0;
  const absolute = String(Math.abs(Number(value))).padStart(length, "0");
  return negative ? `-${absolute}` : absolute;
}

function toYmd(year, month, day) {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

function toLeapLabel(isLeapMonth) {
  return isLeapMonth ? "윤" : "평";
}

function toKasiNumber(value) {
  return Number.parseInt(String(value).trim(), 10);
}

function toKasiLunarMonthNumber(value) {
  const normalized = String(value).trim();
  if (normalized === "正" || normalized === "冬") {
    return 11;
  }
  if (normalized === "臘" || normalized === "臘" || normalized === "腊") {
    return 12;
  }
  return Number.parseInt(normalized, 10);
}

async function fetchJson(path, query) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    search.set(key, String(value));
  }
  const response = await fetch(`${KASI_BASE_URL}${path}?${search.toString()}`);
  if (!response.ok) {
    throw new Error(`KASI request failed: ${response.status} ${response.statusText} for ${path}`);
  }
  return response.json();
}

async function fetchKasiSolarMaxDate() {
  const data = await fetchJson("/life/lunc/getMaxDate", {});
  return Array.isArray(data) ? data[0] : data;
}

async function fetchKasiSolarToLunar(sample) {
  return fetchJson("/life/solc", {
    yyyy: sample.year,
    mm: pad(sample.month),
    dd: pad(sample.day)
  });
}

async function fetchKasiLunarToSolar(sample) {
  const data = await fetchJson("/life/lunc", {
    yyyy: sample.year,
    mm: pad(sample.month),
    dd: pad(sample.day)
  });
  if (!Array.isArray(data)) {
    throw new Error("Unexpected KASI lunar response shape");
  }
  const targetLeap = toLeapLabel(sample.isLeapMonth);
  return data.find((item) => item.LUNC_LEAP_MM === targetLeap) || data[0] || null;
}

function compareSolarToLunar(kasi, lunar) {
  return (
    toKasiNumber(kasi.LUNC_YYYY) === lunar.getYear() &&
    toKasiLunarMonthNumber(kasi.LUNC_MM) === Math.abs(lunar.getMonth()) &&
    toKasiNumber(kasi.LUNC_DD) === lunar.getDay() &&
    String(kasi.LUNC_LEAP_MM) === toLeapLabel(lunar.getMonth() < 0)
  );
}

function compareLunarToSolar(kasi, solar) {
  return (
    toKasiNumber(kasi.SOLC_YYYY) === solar.getYear() &&
    toKasiNumber(kasi.SOLC_MM) === solar.getMonth() &&
    toKasiNumber(kasi.SOLC_DD) === solar.getDay()
  );
}

async function verifySolarSamples(mismatches) {
  let checked = 0;
  for (const sample of SOLAR_SAMPLES) {
    const kasi = await fetchKasiSolarToLunar(sample);
    const lunar = Solar.fromYmd(sample.year, sample.month, sample.day).getLunar();
    checked += 1;

    if (!compareSolarToLunar(kasi, lunar)) {
      mismatches.push({
        type: "kasi-solar-to-lunar",
        note: sample.note,
        solar: toYmd(sample.year, sample.month, sample.day),
        expected: {
          year: toKasiNumber(kasi.LUNC_YYYY),
          month: pad(toKasiLunarMonthNumber(kasi.LUNC_MM)),
          day: pad(toKasiNumber(kasi.LUNC_DD)),
          leapMonth: kasi.LUNC_LEAP_MM
        },
        actual: {
          year: lunar.getYear(),
          month: pad(Math.abs(lunar.getMonth())),
          day: pad(lunar.getDay()),
          leapMonth: toLeapLabel(lunar.getMonth() < 0)
        }
      });
    }

    if (mismatches.length >= MAX_MISMATCHES) {
      break;
    }
  }
  return checked;
}

async function verifyLunarSamples(mismatches) {
  let checked = 0;
  for (const sample of LUNAR_SAMPLES) {
    const kasi = await fetchKasiLunarToSolar(sample);
    const lunar = Lunar.fromYmd(
      sample.year,
      sample.isLeapMonth ? -sample.month : sample.month,
      sample.day
    );
    const solar = lunar.getSolar();
    checked += 1;

    if (!kasi) {
      mismatches.push({
        type: "kasi-lunar-to-solar-no-result",
        note: sample.note,
        lunar: {
          year: sample.year,
          month: sample.month,
          day: sample.day,
          leapMonth: sample.isLeapMonth
        }
      });
      if (mismatches.length >= MAX_MISMATCHES) {
        break;
      }
      continue;
    }

    if (!compareLunarToSolar(kasi, solar)) {
      mismatches.push({
        type: "kasi-lunar-to-solar",
        note: sample.note,
        lunar: {
          year: sample.year,
          month: sample.month,
          day: sample.day,
          leapMonth: sample.isLeapMonth
        },
        expected: toYmd(toKasiNumber(kasi.SOLC_YYYY), toKasiNumber(kasi.SOLC_MM), toKasiNumber(kasi.SOLC_DD)),
        actual: solar.toYmd()
      });
    }

    if (mismatches.length >= MAX_MISMATCHES) {
      break;
    }
  }
  return checked;
}

async function main() {
  const mismatches = [];
  const maxDate = await fetchKasiSolarMaxDate();
  const checkedSolarSamples = await verifySolarSamples(mismatches);
  const checkedLunarSamples = await verifyLunarSamples(mismatches);

  console.log(
    JSON.stringify(
      {
        reference: "KASI life page 8",
        baseUrl: KASI_BASE_URL,
        checkedSolarSamples,
        checkedLunarSamples,
        maxDate: {
          solar: toYmd(toKasiNumber(maxDate.SOLC_YYYY), toKasiNumber(maxDate.SOLC_MM), toKasiNumber(maxDate.SOLC_DD)),
          lunar: `${toKasiNumber(maxDate.LUNC_YYYY)}-${pad(toKasiNumber(maxDate.LUNC_MM))}-${pad(toKasiNumber(maxDate.LUNC_DD))}`
        },
        mismatchCount: mismatches.length
      },
      null,
      2
    )
  );

  if (mismatches.length > 0) {
    console.log(JSON.stringify({ mismatches }, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
