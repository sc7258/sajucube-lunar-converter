import assert from "node:assert/strict";
import KasiLunarCalendar, {
  SUPPORTED_LUNAR_RANGE,
  SUPPORTED_SOLAR_RANGE,
} from "../dist/index.js";

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

{
  const calendar = new KasiLunarCalendar();
  assert.equal(calendar.setSolarDate(1582, 10, 10), false);
  assert.equal(calendar.setSolarDate(-60, 12, 31), false);
  assert.equal(calendar.setSolarDate(2051, 1, 1), false);
  assert.equal(calendar.setLunarDate(-60, 1, 1, false), false);
  assert.equal(calendar.setLunarDate(697, 1, 1, false), false);
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
