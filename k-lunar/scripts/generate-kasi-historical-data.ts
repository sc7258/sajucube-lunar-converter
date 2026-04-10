// @ts-nocheck
import fs from "fs";
import path from "path";

const KASI_BASE_URL = "https://astro.kasi.re.kr";
const START_YEAR = -59;
const END_YEAR = 2050;
const YEAR_BATCH_SIZE = 1;
const REQUEST_TIMEOUT_MS = 20000;
const KASI_MONTH_QUERIES = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "正",
  "冬",
  "臘"
];

function pad(value, length = 2) {
  const negative = Number(value) < 0;
  const absolute = String(Math.abs(Number(value))).padStart(length, "0");
  return negative ? `-${absolute}` : absolute;
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

function compareDate(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function isGregorianLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getSolarDaysOfMonth(year, month) {
  if (month === 2) {
    return isGregorianLeapYear(year) ? 29 : 28;
  }
  return [31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function getSolarDaysInYear(year, month, day) {
  let days = 0;
  for (let i = 1; i < month; i += 1) {
    days += getSolarDaysOfMonth(year, i);
  }
  return days + day;
}

function getSolarDaysOfYear(year) {
  return isGregorianLeapYear(year) ? 366 : 365;
}

function getSolarDaysBetween(ay, am, ad, by, bm, bd) {
  if (ay === by) {
    return getSolarDaysInYear(by, bm, bd) - getSolarDaysInYear(ay, am, ad);
  }
  if (ay > by) {
    let days = getSolarDaysOfYear(by) - getSolarDaysInYear(by, bm, bd);
    for (let i = by + 1; i < ay; i += 1) {
      days += getSolarDaysOfYear(i);
    }
    days += getSolarDaysInYear(ay, am, ad);
    return -days;
  }
  let days = getSolarDaysOfYear(ay) - getSolarDaysInYear(ay, am, ad);
  for (let i = ay + 1; i < by; i += 1) {
    days += getSolarDaysOfYear(i);
  }
  days += getSolarDaysInYear(by, bm, bd);
  return days;
}

async function fetchJson(pathname, query) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    search.set(key, String(value));
  }
  const response = await fetch(`${KASI_BASE_URL}${pathname}?${search.toString()}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error(`KASI request failed: ${response.status} ${response.statusText} for ${pathname}`);
  }
  const text = await response.text();
  if (!text.trim()) {
    return [];
  }
  return JSON.parse(text);
}

async function fetchLunarMonthStart(year, month) {
  const rows = await fetchJson("/life/lunc", {
    yyyy: year,
    mm: month,
    dd: "01"
  });
  return rows.map((item) => ({
    lunarYear: toKasiNumber(item.LUNC_YYYY),
    lunarMonth: item.LUNC_LEAP_MM === "윤" ? -toKasiLunarMonthNumber(item.LUNC_MM) : toKasiLunarMonthNumber(item.LUNC_MM),
    solarYear: toKasiNumber(item.SOLC_YYYY),
    solarMonth: toKasiNumber(item.SOLC_MM),
    solarDay: toKasiNumber(item.SOLC_DD)
  }));
}

async function fetchYearEntries(year) {
  const rows = await Promise.all(
    KASI_MONTH_QUERIES.map((monthQuery) => fetchLunarMonthStart(year, monthQuery))
  );
  return rows.flat();
}

function dedupeEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = [
      entry.lunarYear,
      entry.lunarMonth,
      entry.solarYear,
      entry.solarMonth,
      entry.solarDay
    ].join("/");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function toMonthRecord(entry, nextEntry) {
  return [
    entry.solarYear,
    entry.solarMonth,
    entry.solarDay,
    entry.lunarYear,
    entry.lunarMonth,
    getSolarDaysBetween(
      entry.solarYear,
      entry.solarMonth,
      entry.solarDay,
      nextEntry.solarYear,
      nextEntry.solarMonth,
      nextEntry.solarDay
    )
  ];
}

async function main() {
  const entries = [];

  for (let year = START_YEAR; year <= END_YEAR; year += YEAR_BATCH_SIZE) {
    const batchYears = [];
    for (let i = 0; i < YEAR_BATCH_SIZE && year + i <= END_YEAR; i += 1) {
      batchYears.push(year + i);
    }
    const batchResults = await Promise.all(batchYears.map((currentYear) => fetchYearEntries(currentYear)));
    entries.push(...batchResults.flat());
    if ((year - START_YEAR) % 50 === 0) {
      console.log(`Fetched through lunar year ${batchYears[batchYears.length - 1]}`);
    }
  }

  const deduped = dedupeEntries(entries).sort((a, b) => {
    return compareDate(
      { year: a.solarYear, month: a.solarMonth, day: a.solarDay },
      { year: b.solarYear, month: b.solarMonth, day: b.solarDay }
    );
  });

  const months = [];
  for (let i = 0; i < deduped.length - 1; i += 1) {
    const entry = deduped[i];
    const nextEntry = deduped[i + 1];
    if (entry.lunarYear < START_YEAR || entry.lunarYear > END_YEAR) {
      continue;
    }
    months.push(toMonthRecord(entry, nextEntry));
  }

  const targetPath = path.join(process.cwd(), "src", "kasiHistoricalData.ts");
  const lines = [];
  lines.push("// Generated from KASI /life/lunc month-start data for lunar years -59..2050.");
  lines.push("// Do not edit by hand; regenerate via scripts/generate-kasi-historical-data.ts.");
  lines.push("export const KASI_HISTORICAL_MONTHS = [");
  for (const row of months) {
    lines.push(`  [${row.join(", ")}],`);
  }
  lines.push("] as const;");
  lines.push("");

  fs.writeFileSync(targetPath, lines.join("\n"));

  console.log(
    JSON.stringify(
      {
        targetPath,
        monthCount: months.length,
        firstMonth: months[0],
        lastMonth: months[months.length - 1]
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
