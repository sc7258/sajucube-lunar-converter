// @ts-nocheck
import { Solar, SolarUtil, Lunar } from "../src/index";

const checks = [
  {
    name: "Solar.fromYmd returns the requested date",
    run() {
      const solar = Solar.fromYmd(2022, 1, 1);
      return (
        solar.getYear() === 2022 &&
        solar.getMonth() === 1 &&
        solar.getDay() === 1
      );
    }
  },
  {
    name: "Solar.next can cross a month boundary",
    run() {
      const solar = Solar.fromYmd(2022, 1, 31).next(1);
      return (
        solar.getYear() === 2022 &&
        solar.getMonth() === 2 &&
        solar.getDay() === 1
      );
    }
  },
  {
    name: "SolarUtil leap-year helper matches Gregorian 1600",
    run() {
      return SolarUtil.isLeapYear(1600) === true;
    }
  },
  {
    name: "Lunar conversion is callable",
    run() {
      const lunar = Lunar.fromYmd(2024, 1, 1);
      return lunar.getYear() === 2024 && lunar.getMonth() === 1;
    }
  },
  {
    name: "Solar.fromDate uses fixed KST at UTC boundary",
    run() {
      const solar = Solar.fromDate(new Date("2024-01-01T15:00:00.000Z"));
      return solar.toYmdHms() === "2024-01-02 00:00:00";
    }
  }
];

let failed = 0;

for (const check of checks) {
  try {
    const ok = check.run();
    if (!ok) {
      failed += 1;
      console.error(`FAIL ${check.name}`);
    } else {
      console.log(`PASS ${check.name}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`ERROR ${check.name}`);
    console.error(error && error.stack ? error.stack : String(error));
  }
}

if (failed > 0) {
  process.exitCode = 1;
  console.error(`Smoke harness failed: ${failed} check(s)`);
} else {
  console.log("Smoke harness passed");
}
