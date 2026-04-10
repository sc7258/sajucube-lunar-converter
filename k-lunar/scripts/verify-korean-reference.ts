// @ts-nocheck
import KoreanLunarCalendar = require("korean-lunar-calendar");
import { Solar, Lunar } from "../src/index";

const START = { year: 1000, month: 2, day: 13 };
const END = { year: 2050, month: 12, day: 31 };
const MAX_MISMATCHES = 20;

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function toYmd(year, month, day) {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

function nextGregorianDay(year, month, day) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  day += 1;
  if (day > daysInMonth) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return { year, month, day };
}

function sameDate(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function compareLunar(refLunar, lunar) {
  return (
    refLunar.year === lunar.getYear() &&
    refLunar.month === Math.abs(lunar.getMonth()) &&
    refLunar.day === lunar.getDay() &&
    Boolean(refLunar.intercalation) === (lunar.getMonth() < 0)
  );
}

function main() {
  const calendar = new KoreanLunarCalendar();
  const mismatches = [];
  const skippedReferenceInvalidSolarDates = [];
  let checked = 0;
  let cursor = { ...START };

  while (true) {
    const ok = calendar.setSolarDate(cursor.year, cursor.month, cursor.day);
    if (!ok) {
      skippedReferenceInvalidSolarDates.push(toYmd(cursor.year, cursor.month, cursor.day));
    } else {
      const refLunar = calendar.getLunarCalendar();
      const solar = Solar.fromYmd(cursor.year, cursor.month, cursor.day);
      const lunar = solar.getLunar();

      if (!compareLunar(refLunar, lunar)) {
        mismatches.push({
          type: "solar-to-lunar",
          solar: toYmd(cursor.year, cursor.month, cursor.day),
          expected: refLunar,
          actual: {
            year: lunar.getYear(),
            month: Math.abs(lunar.getMonth()),
            day: lunar.getDay(),
            intercalation: lunar.getMonth() < 0
          }
        });
      }

      const expectedSolar = toYmd(cursor.year, cursor.month, cursor.day);
      try {
        const backSolar = Lunar.fromYmd(
          refLunar.year,
          refLunar.intercalation ? -refLunar.month : refLunar.month,
          refLunar.day
        ).getSolar();
        const actualSolar = backSolar.toYmd();

        if (actualSolar !== expectedSolar) {
          mismatches.push({
            type: "lunar-to-solar",
            lunar: refLunar,
            expected: expectedSolar,
            actual: actualSolar
          });
        }
      } catch (error) {
        mismatches.push({
          type: "lunar-to-solar-error",
          lunar: refLunar,
          expected: expectedSolar,
          error: error.message
        });
      }

      checked += 1;
      if (mismatches.length >= MAX_MISMATCHES) {
        break;
      }
    }

    if (sameDate(cursor, END)) {
      break;
    }
    cursor = nextGregorianDay(cursor.year, cursor.month, cursor.day);
  }

  const result = {
    reference: "korean-lunar-calendar@0.3.6",
    checkedSolarDates: checked,
    start: toYmd(START.year, START.month, START.day),
    end: toYmd(END.year, END.month, END.day),
    skippedReferenceInvalidSolarDatesCount: skippedReferenceInvalidSolarDates.length,
    mismatchCount: mismatches.length
  };

  console.log(JSON.stringify(result, null, 2));

  if (skippedReferenceInvalidSolarDates.length > 0) {
    console.log(
      JSON.stringify(
        {
          skippedReferenceInvalidSolarDates
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

main();
