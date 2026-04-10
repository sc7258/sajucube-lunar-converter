// @ts-nocheck
import { Lunar, Solar } from "../src/index";

const KASI_BASE_URL = "https://astro.kasi.re.kr";
const START = { year: -59, month: 2, day: 13 };
const END = { year: 999, month: 12, day: 31 };
const MAX_MISMATCHES = 20;
const CONCURRENCY = 4;
const SOLAR_ANCHORS = [
  { month: 1, day: 1 },
  { month: 4, day: 1 },
  { month: 7, day: 1 },
  { month: 10, day: 1 }
];

function pad(value, length = 2) {
  const negative = Number(value) < 0;
  const absolute = String(Math.abs(Number(value))).padStart(length, "0");
  return negative ? `-${absolute}` : absolute;
}

function toYmd(year, month, day) {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

function compareDate(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function isWithinRange(target) {
  return compareDate(target, START) >= 0 && compareDate(target, END) <= 0;
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

function isKasiSpecialLunarMonthLabel(value) {
  return Number.isNaN(Number.parseInt(String(value).trim(), 10));
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

async function fetchKasiSolarToLunar(sample) {
  return fetchJson("/life/solc", {
    yyyy: sample.year,
    mm: pad(sample.month),
    dd: pad(sample.day)
  });
}

function compareSolarToLunar(kasi, lunar) {
  return (
    toKasiNumber(kasi.LUNC_YYYY) === lunar.getYear() &&
    toKasiLunarMonthNumber(kasi.LUNC_MM) === Math.abs(lunar.getMonth()) &&
    toKasiNumber(kasi.LUNC_DD) === lunar.getDay() &&
    String(kasi.LUNC_LEAP_MM) === toLeapLabel(lunar.getMonth() < 0)
  );
}

function compareSolarDateParts(solar, year, month, day) {
  return (
    solar.getYear() === year &&
    solar.getMonth() === month &&
    solar.getDay() === day
  );
}

function buildSolarSamples() {
  const samples = [START];

  for (let year = START.year; year <= END.year; year += 1) {
    for (const anchor of SOLAR_ANCHORS) {
      const sample = { year, month: anchor.month, day: anchor.day };
      if (!isWithinRange(sample)) {
        continue;
      }
      const last = samples[samples.length - 1];
      if (last && compareDate(last, sample) === 0) {
        continue;
      }
      samples.push(sample);
    }
  }

  const last = samples[samples.length - 1];
  if (!last || compareDate(last, END) !== 0) {
    samples.push(END);
  }

  return samples;
}

async function verifySample(sample) {
  const kasi = await fetchKasiSolarToLunar(sample);
  const solar = Solar.fromYmd(sample.year, sample.month, sample.day);
  const lunar = solar.getLunar();

  const result = {
    solar: toYmd(sample.year, sample.month, sample.day),
    mismatch: null,
    skippedReverseCheck: null
  };

  if (!compareSolarToLunar(kasi, lunar)) {
    result.mismatch = {
      type: "kasi-solar-to-lunar",
      solar: result.solar,
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
    };
    return result;
  }

  if (isKasiSpecialLunarMonthLabel(kasi.LUNC_MM)) {
    result.skippedReverseCheck = {
      type: "ambiguous-special-lunar-month-reverse-check",
      solar: result.solar,
      lunar: {
        year: toKasiNumber(kasi.LUNC_YYYY),
        monthLabel: String(kasi.LUNC_MM).trim(),
        month: pad(toKasiLunarMonthNumber(kasi.LUNC_MM)),
        day: pad(toKasiNumber(kasi.LUNC_DD)),
        leapMonth: kasi.LUNC_LEAP_MM
      },
      reason: "KASI special lunar month labels like 正/冬/臘 cannot be uniquely reversed through the numeric month API."
    };
    return result;
  }

  let backSolar;
  try {
    backSolar = Lunar.fromYmd(
      toKasiNumber(kasi.LUNC_YYYY),
      kasi.LUNC_LEAP_MM === "윤" ? -toKasiLunarMonthNumber(kasi.LUNC_MM) : toKasiLunarMonthNumber(kasi.LUNC_MM),
      toKasiNumber(kasi.LUNC_DD)
    ).getSolar();
  } catch (error) {
    result.skippedReverseCheck = {
      type: "unsupported-lunar-to-solar-reverse-check",
      solar: result.solar,
      lunar: {
        year: toKasiNumber(kasi.LUNC_YYYY),
        month: pad(toKasiLunarMonthNumber(kasi.LUNC_MM)),
        day: pad(toKasiNumber(kasi.LUNC_DD)),
        leapMonth: kasi.LUNC_LEAP_MM
      },
      reason: error instanceof Error ? error.message : String(error)
    };
    return result;
  }

  if (!compareSolarDateParts(backSolar, sample.year, sample.month, sample.day)) {
    result.mismatch = {
      type: "kasi-lunar-to-solar",
      solar: result.solar,
      lunar: {
        year: toKasiNumber(kasi.LUNC_YYYY),
        month: pad(toKasiLunarMonthNumber(kasi.LUNC_MM)),
        day: pad(toKasiNumber(kasi.LUNC_DD)),
        leapMonth: kasi.LUNC_LEAP_MM
      },
      expected: result.solar,
      actual: {
        year: backSolar.getYear(),
        month: pad(backSolar.getMonth()),
        day: pad(backSolar.getDay()),
        ymd: backSolar.toYmd()
      }
    };
  }

  return result;
}

async function main() {
  const samples = buildSolarSamples();
  const mismatches = [];
  const skippedReverseChecks = [];
  let checked = 0;

  for (let index = 0; index < samples.length; index += CONCURRENCY) {
    const batch = samples.slice(index, index + CONCURRENCY);
    const results = await Promise.all(batch.map((sample) => verifySample(sample)));

    for (const result of results) {
      checked += 1;
      if (result.mismatch) {
        mismatches.push(result.mismatch);
        if (mismatches.length >= MAX_MISMATCHES) {
          break;
        }
      }
      if (result.skippedReverseCheck) {
        skippedReverseChecks.push(result.skippedReverseCheck);
      }
    }

    if (mismatches.length >= MAX_MISMATCHES) {
      break;
    }
  }

  console.log(
    JSON.stringify(
      {
        reference: "KASI life page 8 yearly sample scan",
        baseUrl: KASI_BASE_URL,
        start: toYmd(START.year, START.month, START.day),
        end: toYmd(END.year, END.month, END.day),
        checkedSolarSamples: checked,
        anchorsPerYear: SOLAR_ANCHORS.map((anchor) => `${pad(anchor.month)}-${pad(anchor.day)}`),
        skippedReverseChecksCount: skippedReverseChecks.length,
        mismatchCount: mismatches.length
      },
      null,
      2
    )
  );

  if (skippedReverseChecks.length > 0) {
    console.log(
      JSON.stringify(
        {
          skippedReverseChecks: skippedReverseChecks.slice(0, MAX_MISMATCHES)
        },
        null,
        2
      )
    );
  }

  if (mismatches.length > 0) {
    console.log(JSON.stringify({ mismatches }, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
