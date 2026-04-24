import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import KasiLunarCalendar, {
  SUPPORTED_LUNAR_RANGE,
  SUPPORTED_SOLAR_RANGE,
} from "../dist/index.js";

const EXPECTED_SPECIAL_MONTH_LABELS = [
  { year: 696, month: 1, intercalation: 0, label: "正" },
  { year: 696, month: 12, intercalation: 0, label: "臘" },
  { year: 697, month: 1, intercalation: 0, label: "正" },
  { year: 697, month: 12, intercalation: 0, label: "臘" },
  { year: 698, month: 1, intercalation: 0, label: "正" },
  { year: 698, month: 12, intercalation: 0, label: "臘" },
  { year: 699, month: 1, intercalation: 0, label: "正" },
  { year: 699, month: 12, intercalation: 0, label: "臘" },
  { year: 700, month: 1, intercalation: 0, label: "正" },
  { year: 700, month: 12, intercalation: 0, label: "臘" },
];
const EXPECTED_AMBIGUOUS_MONTH_LABELS = [
  { year: 696, month: 1, intercalation: 0, labels: ["01", "正"] },
  { year: 697, month: 1, intercalation: 0, labels: ["01", "正"] },
  { year: 698, month: 1, intercalation: 0, labels: ["01", "正"] },
  { year: 699, month: 1, intercalation: 0, labels: ["01", "正"] },
  { year: 700, month: 1, intercalation: 0, labels: ["01", "正"] },
  { year: 700, month: 12, intercalation: 0, labels: ["12", "臘"] },
];

function expectCalendar(actual, expected) {
  assert.deepStrictEqual(actual, expected);
}

function testSolarToLunar(input, expected) {
  const calendar = new KasiLunarCalendar();
  assert.equal(calendar.setSolarDate(input.year, input.month, input.day), true);
  expectCalendar(calendar.getLunarCalendar(), expected);
}

function testLunarToSolar(input, expected) {
  const calendar = new KasiLunarCalendar();
  assert.equal(
    calendar.setLunarDate(
      input.year,
      input.month,
      input.day,
      Boolean(input.intercalation),
      input.monthLabel,
    ),
    true,
  );
  expectCalendar(calendar.getSolarCalendar(), expected);
}

function loadSourceEarlyData() {
  const source = fs
    .readFileSync(new URL("../src/early-data.ts", import.meta.url), "utf8")
    .replace(/export const /g, "const ")
    .replace(/ as const;/g, ";");
  const script = new vm.Script(
    `${source}\nmodule.exports = { EARLY_LUNAR_YEAR_START, EARLY_LUNAR_YEAR_END, EARLY_NEXT_YEAR_START_JD, KASI_EARLY_LUNAR_DATA };`,
  );
  const context = { module: { exports: {} } };
  vm.createContext(context);
  script.runInContext(context);

  return context.module.exports;
}

function verifySourceEarlyData() {
  const {
    EARLY_LUNAR_YEAR_START,
    EARLY_LUNAR_YEAR_END,
    EARLY_NEXT_YEAR_START_JD,
    KASI_EARLY_LUNAR_DATA,
  } = loadSourceEarlyData();

  assert.equal(EARLY_LUNAR_YEAR_START, -59);
  assert.equal(EARLY_LUNAR_YEAR_END, 999);
  assert.equal(KASI_EARLY_LUNAR_DATA.length, 1059);

  const specialMonthLabels = [];
  const ambiguousMonthLabels = [];

  for (const [index, yearData] of KASI_EARLY_LUNAR_DATA.entries()) {
    const [year, yearStartJd, , , months] = yearData;
    assert.equal(year, EARLY_LUNAR_YEAR_START + index);

    let expectedOffset = 0;
    const labelsByMonth = new Map();

    for (const month of months) {
      assert.equal(month[2], expectedOffset);
      assert.ok(month[3] >= 28 && month[3] <= 31);
      expectedOffset += month[3];

      if (!/^\d+$/.test(month[4])) {
        specialMonthLabels.push({
          year,
          month: month[0],
          intercalation: month[1],
          label: month[4],
        });
      }

      const key = `${month[0]}:${month[1]}`;
      const labels = labelsByMonth.get(key) ?? [];
      labels.push(month[4]);
      labelsByMonth.set(key, labels);
    }

    const nextStart =
      KASI_EARLY_LUNAR_DATA[index + 1]?.[1] ?? EARLY_NEXT_YEAR_START_JD;
    assert.equal(nextStart - yearStartJd, expectedOffset);

    for (const [key, labels] of labelsByMonth) {
      if (labels.length > 1) {
        const [month, intercalation] = key.split(":").map(Number);
        ambiguousMonthLabels.push({
          year,
          month,
          intercalation,
          labels: [...labels].sort(),
        });
      }
    }
  }

  assert.deepStrictEqual(specialMonthLabels, EXPECTED_SPECIAL_MONTH_LABELS);
  assert.deepStrictEqual(ambiguousMonthLabels, EXPECTED_AMBIGUOUS_MONTH_LABELS);
}

verifySourceEarlyData();

assert.deepStrictEqual(SUPPORTED_SOLAR_RANGE, {
  min: { year: -59, month: 2, day: 13 },
  max: { year: 2050, month: 12, day: 31 },
});

assert.deepStrictEqual(SUPPORTED_LUNAR_RANGE, {
  min: { year: -59, month: 1, day: 1, intercalation: false },
  max: { year: 2050, month: 11, day: 18, intercalation: false },
});

testSolarToLunar(
  { year: -59, month: 2, day: 13 },
  { year: -59, month: 1, day: 1, intercalation: false, monthLabel: "01" },
);
testSolarToLunar(
  { year: 1000, month: 2, day: 13 },
  { year: 1000, month: 1, day: 1, intercalation: false },
);
testSolarToLunar(
  { year: 2023, month: 3, day: 22 },
  { year: 2023, month: 2, day: 1, intercalation: true },
);
testSolarToLunar(
  { year: 2050, month: 12, day: 31 },
  { year: 2050, month: 11, day: 18, intercalation: false },
);
testSolarToLunar(
  { year: 1000, month: 1, day: 1 },
  { year: 999, month: 11, day: 17, intercalation: false, monthLabel: "11" },
);
testSolarToLunar(
  { year: 1000, month: 2, day: 12 },
  { year: 999, month: 12, day: 29, intercalation: false, monthLabel: "12" },
);
testSolarToLunar(
  { year: 1000, month: 2, day: 13 },
  { year: 1000, month: 1, day: 1, intercalation: false },
);

testLunarToSolar(
  { year: 2020, month: 4, day: 1, intercalation: false },
  { year: 2020, month: 4, day: 23 },
);
testLunarToSolar(
  { year: 2020, month: 4, day: 1, intercalation: true },
  { year: 2020, month: 5, day: 23 },
);
testLunarToSolar(
  { year: -59, month: 1, day: 1, intercalation: false },
  { year: -59, month: 2, day: 13 },
);
testSolarToLunar(
  { year: 696, month: 12, day: 3 },
  { year: 697, month: 1, day: 1, intercalation: false, monthLabel: "正" },
);
testSolarToLunar(
  { year: 697, month: 1, day: 31 },
  { year: 697, month: 1, day: 1, intercalation: false, monthLabel: "01" },
);
testLunarToSolar(
  { year: 697, month: 1, day: 1, intercalation: false, monthLabel: "正" },
  { year: 696, month: 12, day: 3 },
);
testLunarToSolar(
  { year: 697, month: 1, day: 1, intercalation: false, monthLabel: "01" },
  { year: 697, month: 1, day: 31 },
);
testSolarToLunar(
  { year: 699, month: 12, day: 30 },
  { year: 700, month: 12, day: 1, intercalation: false, monthLabel: "臘" },
);
testSolarToLunar(
  { year: 701, month: 1, day: 18 },
  { year: 700, month: 12, day: 1, intercalation: false, monthLabel: "12" },
);
testLunarToSolar(
  { year: 700, month: 12, day: 1, intercalation: false, monthLabel: "臘" },
  { year: 699, month: 12, day: 30 },
);
testLunarToSolar(
  { year: 700, month: 12, day: 1, intercalation: false, monthLabel: "12" },
  { year: 701, month: 1, day: 18 },
);

{
  const calendar = new KasiLunarCalendar();
  assert.equal(calendar.setSolarDate(1582, 10, 10), false);
  assert.equal(calendar.setSolarDate(-60, 12, 31), false);
  assert.equal(calendar.setSolarDate(2051, 1, 1), false);
  assert.equal(calendar.setLunarDate(-60, 1, 1, false), false);
  assert.equal(calendar.setLunarDate(697, 1, 1, false), false);
  assert.equal(calendar.setLunarDate(700, 12, 1, false), false);
  assert.equal(calendar.setLunarDate(700, 12, 1, false, "11"), false);
}

// 기원전 26년
testSolarToLunar(
  { year: -26, month: 4, day: 1 },
  { year: -26, month: 2, day: 22, intercalation: false, monthLabel: "02" },
);

// 서기 23년
testSolarToLunar(
  { year: 23, month: 4, day: 1 },
  { year: 23, month: 2, day: 24, intercalation: false, monthLabel: "02" },
);
testSolarToLunar(
  { year: 23, month: 7, day: 1 },
  { year: 23, month: 5, day: 26, intercalation: false, monthLabel: "05" },
);
testSolarToLunar(
  { year: 23, month: 10, day: 1 },
  { year: 23, month: 8, day: 30, intercalation: false, monthLabel: "08" },
);

// 서기 237~241년
testSolarToLunar(
  { year: 237, month: 4, day: 1 },
  { year: 237, month: 2, day: 18, intercalation: false, monthLabel: "02" },
);
testSolarToLunar(
  { year: 238, month: 4, day: 1 },
  { year: 238, month: 2, day: 29, intercalation: false, monthLabel: "02" },
);
testSolarToLunar(
  { year: 240, month: 1, day: 1 },
  { year: 239, month: 11, day: 19, intercalation: false, monthLabel: "11" },
);

// 서기 768년 극단적 월 스팬 (28일 및 31일) 엣지 케이스 검증
{
  const cal = new KasiLunarCalendar();
  
  // 768년 음력 2월 28일 (28일로 끝나는 짧은 달)
  assert.equal(cal.setLunarDate(768, 2, 28, false, "02"), true);
  const solar1 = cal.getSolarCalendar();
  cal.setSolarDate(solar1.year, solar1.month, solar1.day);
  expectCalendar(cal.getLunarCalendar(), { year: 768, month: 2, day: 28, intercalation: false, monthLabel: "02" });

  // 768년 음력 3월 31일 (31일로 끝나는 긴 달)
  assert.equal(cal.setLunarDate(768, 3, 31, false, "03"), true);
  const solar2 = cal.getSolarCalendar();
  cal.setSolarDate(solar2.year, solar2.month, solar2.day);
  expectCalendar(cal.getLunarCalendar(), { year: 768, month: 3, day: 31, intercalation: false, monthLabel: "03" });
}

// 라운드트립 검증: -59..999 전 범위 매월 5, 15, 25일
{
  let checked = 0;
  let skipped = 0;
  for (let y = -59; y <= 999; y++) {
    for (let m = 1; m <= 12; m++) {
      for (const d of [5, 15, 25]) {
        const cal = new KasiLunarCalendar();
        if (!cal.setSolarDate(y, m, d)) {
          skipped++;
          continue;
        }
        const lunar = cal.getLunarCalendar();
        const cal2 = new KasiLunarCalendar();
        const ok = cal2.setLunarDate(
          lunar.year,
          lunar.month,
          lunar.day,
          lunar.intercalation,
          lunar.monthLabel,
        );
        assert.ok(ok, `setLunarDate failed for lunar ${lunar.year}/${lunar.month}/${lunar.day} (from solar ${y}/${m}/${d})`);
        const solar = cal2.getSolarCalendar();
        assert.deepStrictEqual(
          solar,
          { year: y, month: m, day: d },
          `round-trip mismatch: solar ${y}/${m}/${d} → lunar ${lunar.year}/${lunar.month}/${lunar.day}(${lunar.monthLabel}) → solar ${solar.year}/${solar.month}/${solar.day}`,
        );
        checked++;
      }
    }
  }
  console.log(`Round-trip: ${checked} checked, ${skipped} skipped (out of range)`);
}

console.log("Verification passed.");
