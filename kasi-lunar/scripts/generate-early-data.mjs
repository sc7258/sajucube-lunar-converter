import fs from "node:fs/promises";
import path from "node:path";

const START_SOLAR_YEAR = Number(process.env.GENERATE_START_SOLAR_YEAR ?? -59);
const START_SOLAR_MONTH = Number(process.env.GENERATE_START_SOLAR_MONTH ?? 2);
const END_SOLAR_YEAR = Number(process.env.GENERATE_END_SOLAR_YEAR ?? 1000);
const END_SOLAR_MONTH = Number(process.env.GENERATE_END_SOLAR_MONTH ?? 2);
const START_LUNAR_YEAR = Number(process.env.GENERATE_START_LUNAR_YEAR ?? -59);
const END_LUNAR_YEAR = Number(process.env.GENERATE_END_LUNAR_YEAR ?? 1000);
const OUTPUT_PATH = path.resolve("src/early-data.ts");
const FETCH_CONCURRENCY = 24;

function buildMonthList() {
  const months = [];
  let year = START_SOLAR_YEAR;
  let month = START_SOLAR_MONTH;

  while (year < END_SOLAR_YEAR || (year === END_SOLAR_YEAR && month <= END_SOLAR_MONTH)) {
    months.push({ year, month });
    month += 1;

    if (month === 13) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function normalizeCellText(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, "")
    .normalize("NFKC")
    .trim();
}

function parseMonthToken(token) {
  if (/^\d+$/.test(token)) {
    return Number(token);
  }

  const specialMonths = {
    正: 1,
    冬: 11,
    臘: 12,
    臘: 12,
  };

  if (token in specialMonths) {
    return specialMonths[token];
  }

  const numerals = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };

  if (token === "十一") {
    return 11;
  }

  if (token === "十二") {
    return 12;
  }

  if (token in numerals) {
    return numerals[token];
  }

  throw new Error(`Unable to parse month token: ${token}`);
}

function parseDateCell(value) {
  const match = value.match(/^(-?\d+)년(윤)?([^월]+)월(\d+)일$/);

  if (!match) {
    throw new Error(`Unable to parse date cell: ${value}`);
  }

  return {
    year: Number(match[1]),
    intercalation: match[2] ? 1 : 0,
    month: parseMonthToken(match[3]),
    day: Number(match[4]),
    rawMonth: match[3],
  };
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function mapWithConcurrency(values, mapper, concurrency) {
  const results = new Array(values.length);
  let cursor = 0;

  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker()),
  );

  return results;
}

function parseMonthlyRows(html) {
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);

  if (!tbodyMatch) {
    throw new Error("Unable to locate monthly table body.");
  }

  const rows = [];

  for (const rowMatch of tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) =>
      normalizeCellText(match[1]),
    );

    if (cells.length < 5) {
      continue;
    }

    const solar = parseDateCell(cells[0]);
    const lunar = parseDateCell(cells[1]);
    const julian = parseDateCell(cells[4]);

    rows.push({
      solarYear: solar.year,
      solarMonth: solar.month,
      solarDay: solar.day,
      lunarYear: lunar.year,
      lunarMonth: lunar.month,
      lunarDay: lunar.day,
      lunarIntercalation: lunar.intercalation,
      lunarRawMonth: lunar.rawMonth,
      julianYear: julian.year,
      julianMonth: julian.month,
      julianDay: julian.day,
    });
  }

  return rows;
}

function julianToJdn(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const adjustedYear = year + 4800 - a;
  const adjustedMonth = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * adjustedMonth + 2) / 5) +
    365 * adjustedYear +
    Math.floor(adjustedYear / 4) -
    32083
  );
}

async function fetchMonthlyCalendar({ year, month }, index, total) {
  if (index % 120 === 0) {
    console.log(`  progress: ${index + 1}/${total}`);
  }

  const mm = String(month).padStart(2, "0");
  const url =
    "https://astro.kasi.re.kr/life/pageView/5" +
    `?search_year=${year}&search_month=${mm}&search_check=G&search_dp=1`;

  const html = await fetchText(url);

  return parseMonthlyRows(html);
}

function buildEarlyYearData(rows) {
  const byLunarYear = new Map();

  for (const row of rows) {
    if (row.lunarYear < START_LUNAR_YEAR || row.lunarYear > END_LUNAR_YEAR) {
      continue;
    }

    const jdn = julianToJdn(row.julianYear, row.julianMonth, row.julianDay);

    if (!byLunarYear.has(row.lunarYear)) {
      byLunarYear.set(row.lunarYear, []);
    }

    byLunarYear.get(row.lunarYear).push({
      jdn,
      month: row.lunarMonth,
      day: row.lunarDay,
      intercalation: row.lunarIntercalation,
      rawMonth: row.lunarRawMonth,
    });
  }

  const years = [];

  for (let year = START_LUNAR_YEAR; year <= END_LUNAR_YEAR; year += 1) {
    const entries = byLunarYear.get(year) ?? [];
    const uniqueByJdn = new Map();

    for (const entry of entries) {
      if (!uniqueByJdn.has(entry.jdn)) {
        uniqueByJdn.set(entry.jdn, entry);
      }
    }

    const days = [...uniqueByJdn.values()].sort((left, right) => left.jdn - right.jdn);
    const yearStart = days.find(
      (entry) =>
        entry.month === 1 && entry.day === 1 && entry.intercalation === 0,
    );

    if (!yearStart) {
      throw new Error(`Missing lunar 1/1 for year ${year}.`);
    }

    const months = days
      .filter((entry) => entry.day === 1)
      .map((entry, index, monthEntries) => {
        const nextStart = monthEntries[index + 1]?.jdn ?? null;

        return {
          month: entry.month,
          intercalation: entry.intercalation,
          rawMonth: entry.rawMonth,
          startJd: entry.jdn,
          nextStart,
        };
      });

    years.push({
      year,
      yearStartJd: yearStart.jdn,
      months,
    });
  }

  let dayOrdinalStart = 0;
  let monthOrdinalStart = 0;

  return years.slice(0, -1).map((yearData, index) => {
    const nextYear = years[index + 1];
    const months = yearData.months.map((monthEntry, monthIndex) => {
      const nextStart =
        yearData.months[monthIndex + 1]?.startJd ?? nextYear.yearStartJd;
      const days = nextStart - monthEntry.startJd;

      if (days < 28 || days > 31) {
        const monthSummary = yearData.months
          .map(
            (entry) =>
              `${entry.month}${entry.intercalation ? " leap" : ""} (${entry.rawMonth})@${entry.startJd}`,
          )
          .join(", ");

        throw new Error(
          `Unexpected month span ${days} for lunar year ${yearData.year}, month ${monthEntry.month}${monthEntry.intercalation ? " leap" : ""} (${monthEntry.rawMonth}). start=${monthEntry.startJd}, next=${nextStart}, nextMonth=${yearData.months[monthIndex + 1] ? `${yearData.months[monthIndex + 1].month}${yearData.months[monthIndex + 1].intercalation ? " leap" : ""} (${yearData.months[monthIndex + 1].rawMonth})` : `${nextYear.year} year start`}. months=[${monthSummary}]`,
        );
      }

      return {
        month: monthEntry.month,
        intercalation: monthEntry.intercalation,
        offset: monthEntry.startJd - yearData.yearStartJd,
        days,
        label: monthEntry.rawMonth,
      };
    });

    const normalized = {
      year: yearData.year,
      yearStartJd: yearData.yearStartJd,
      dayOrdinalStart,
      monthOrdinalStart,
      months,
    };

    dayOrdinalStart += months.reduce((sum, month) => sum + month.days, 0);
    monthOrdinalStart += months.length;

    return normalized;
  });
}

function renderDataFile(years, nextYearStartJd) {
  const lines = years.map((yearData) => {
    const months = yearData.months
      .map(
        (month) =>
          `[${month.month}, ${month.intercalation}, ${month.offset}, ${month.days}, ${JSON.stringify(month.label)}]`,
      )
      .join(", ");

    return `  [${yearData.year}, ${yearData.yearStartJd}, ${yearData.dayOrdinalStart}, ${yearData.monthOrdinalStart}, [${months}]],`;
  });

  return `// Generated by scripts/generate-early-data.mjs from KASI monthly calendar pages.\n` +
    `// Do not edit this file by hand.\n\n` +
    `export const EARLY_LUNAR_YEAR_START = ${START_LUNAR_YEAR};\n` +
    `export const EARLY_LUNAR_YEAR_END = ${END_LUNAR_YEAR - 1};\n` +
    `export const EARLY_NEXT_YEAR_START_JD = ${nextYearStartJd};\n\n` +
    `export const KASI_EARLY_LUNAR_DATA = [\n${lines.join("\n")}\n] as const;\n`;
}

const months = buildMonthList();
console.log(`Fetching ${months.length} KASI monthly calendar pages...`);

const monthlyRows = await mapWithConcurrency(
  months,
  (month, index) => fetchMonthlyCalendar(month, index, months.length),
  FETCH_CONCURRENCY,
);

const allRows = monthlyRows.flat();
const normalizedYears = buildEarlyYearData(allRows);
const nextYearStartJd = normalizedYears[normalizedYears.length - 1].yearStartJd +
  normalizedYears[normalizedYears.length - 1].months.reduce(
    (sum, month) => sum + month.days,
    0,
  );

await fs.writeFile(OUTPUT_PATH, renderDataFile(normalizedYears, nextYearStartJd));

console.log(`Generated ${normalizedYears.length} early lunar years at ${OUTPUT_PATH}.`);
