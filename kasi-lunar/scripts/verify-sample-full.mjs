import assert from "node:assert/strict";

import KasiLunarCalendar from "../dist/index.js";

const SAMPLE_DAYS = [1, 10, 20, 28];
const EXPECTED_SAMPLE_SKIPS = [
  "-59-01-01",
  "-59-01-10",
  "-59-01-20",
  "-59-01-28",
  "-59-02-01",
  "-59-02-10",
  "1582-10-10",
];
const EXPECTED_MONTH_END_SKIPS = ["-59-01-30", "-59-01-31"];

function isLeapYear(year) {
  if (year % 4 !== 0) {
    return false;
  }

  if (year % 100 !== 0) {
    return true;
  }

  return year % 400 === 0;
}

function daysInMonth(year, month) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
    month - 1
  ];
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function roundTripSolar(year, month, day) {
  const calendar = new KasiLunarCalendar();

  if (!calendar.setSolarDate(year, month, day)) {
    return { ok: false, stage: "setSolarDate" };
  }

  const lunar = calendar.getLunarCalendar();
  const replay = new KasiLunarCalendar();
  const replayOk = replay.setLunarDate(
    lunar.year,
    lunar.month,
    lunar.day,
    Boolean(lunar.intercalation),
    lunar.monthLabel,
  );

  if (!replayOk) {
    return { ok: false, stage: "setLunarDate", lunar };
  }

  const solar = replay.getSolarCalendar();

  try {
    assert.deepStrictEqual(solar, { year, month, day });
    return { ok: true };
  } catch {
    return { ok: false, stage: "roundTripMismatch", lunar, solar };
  }
}

function runCheck(name, dayPicker) {
  let candidates = 0;
  let checked = 0;
  let skipped = 0;
  const skippedDates = [];
  const failures = [];

  for (let year = -59; year <= 2050; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const days = [...new Set(dayPicker(year, month))].sort((left, right) => left - right);

      for (const day of days) {
        candidates += 1;

        const result = roundTripSolar(year, month, day);

        if (result.ok) {
          checked += 1;
          continue;
        }

        if (result.stage === "setSolarDate") {
          skipped += 1;
          skippedDates.push(formatDate(year, month, day));
          continue;
        }

        failures.push({ date: formatDate(year, month, day), ...result });
      }
    }
  }

  return { name, candidates, checked, skipped, skippedDates, failures };
}

const sampled = runCheck("sample-1-10-20-28", () => SAMPLE_DAYS);
const monthEnd = runCheck("month-end-last-and-prev", (year, month) => {
  const lastDay = daysInMonth(year, month);

  return [lastDay - 1, lastDay];
});

assert.deepStrictEqual(sampled.skippedDates, EXPECTED_SAMPLE_SKIPS);
assert.deepStrictEqual(monthEnd.skippedDates, EXPECTED_MONTH_END_SKIPS);
assert.deepStrictEqual(sampled.failures, []);
assert.deepStrictEqual(monthEnd.failures, []);

console.log(
  JSON.stringify(
    {
      sampled,
      monthEnd,
    },
    null,
    2,
  ),
);
