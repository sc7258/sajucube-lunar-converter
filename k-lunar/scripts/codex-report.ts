// @ts-nocheck
import { Solar, SolarUtil } from "../src/index";

function inspectSolarFromDate(iso) {
  const date = new Date(iso);
  const solar = Solar.fromDate(date);
  return {
    iso,
    ymdHms: solar.toYmdHms()
  };
}

function inspectDateValidity(year, month, day) {
  try {
    const solar = Solar.fromYmd(year, month, day);
    return {
      input: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      valid: true,
      output: solar.toYmd()
    };
  } catch (error) {
    return {
      input: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      valid: false,
      error: error.message
    };
  }
}

function printSection(title, rows) {
  console.log(`\n[${title}]`);
  for (const row of rows) {
    console.log(JSON.stringify(row));
  }
}

printSection("leap-years", [
  { year: 1500, isLeapYear: SolarUtil.isLeapYear(1500) },
  { year: 1582, isLeapYear: SolarUtil.isLeapYear(1582) },
  { year: 1599, isLeapYear: SolarUtil.isLeapYear(1599) },
  { year: 1600, isLeapYear: SolarUtil.isLeapYear(1600) }
]);

printSection("october-1582", [
  inspectDateValidity(1582, 10, 4),
  inspectDateValidity(1582, 10, 5),
  inspectDateValidity(1582, 10, 14),
  inspectDateValidity(1582, 10, 15)
]);

printSection("date-boundary-from-utc", [
  inspectSolarFromDate("2024-01-01T14:59:59.000Z"),
  inspectSolarFromDate("2024-01-01T15:00:00.000Z"),
  inspectSolarFromDate("2024-06-30T14:59:59.000Z"),
  inspectSolarFromDate("2024-06-30T15:00:00.000Z")
]);
