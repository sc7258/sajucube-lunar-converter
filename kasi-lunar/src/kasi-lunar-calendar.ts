import KoreanLunarCalendar from "korean-lunar-calendar";

import {
  EARLY_LUNAR_YEAR_END,
  EARLY_LUNAR_YEAR_START,
  EARLY_NEXT_YEAR_START_JD,
  KASI_EARLY_LUNAR_DATA,
} from "./early-data";

const KOREAN_CHEONGAN = [
  0xac11, 0xc744, 0xbcd1, 0xc815, 0xbb34, 0xae30, 0xacbd, 0xc2e0, 0xc784,
  0xacc4,
].map((charCode) => String.fromCharCode(charCode));

const KOREAN_GANJI = [
  0xc790, 0xcd95, 0xc778, 0xbb18, 0xc9c4, 0xc0ac, 0xc624, 0xbbf8, 0xc2e0,
  0xc720, 0xc220, 0xd574,
].map((charCode) => String.fromCharCode(charCode));

const KOREAN_GAPJA_UNIT = [0xb144, 0xc6d4, 0xc77c].map((charCode) =>
  String.fromCharCode(charCode),
);

const CHINESE_CHEONGAN = [
  0x7532, 0x4e59, 0x4e19, 0x4e01, 0x620a, 0x5df1, 0x5e9a, 0x8f9b, 0x58ec,
  0x7678,
].map((charCode) => String.fromCharCode(charCode));

const CHINESE_GANJI = [
  0x5b50, 0x4e11, 0x5bc5, 0x536f, 0x8fb0, 0x5df3, 0x5348, 0x672a, 0x7533,
  0x9149, 0x620c, 0x4ea5,
].map((charCode) => String.fromCharCode(charCode));

const CHINESE_GAPJA_UNIT = [0x5e74, 0x6708, 0x65e5].map((charCode) =>
  String.fromCharCode(charCode),
);

const INTERCALATION_STR = [0xc724, 0x958f].map((charCode) =>
  String.fromCharCode(charCode),
);

type EarlyMonthTuple = readonly [
  month: number,
  intercalation: 0 | 1,
  offset: number,
  days: 28 | 29 | 30 | 31,
  monthLabel: string,
];
type EarlyYearTuple = readonly [
  year: number,
  yearStartJd: number,
  dayOrdinalStart: number,
  monthOrdinalStart: number,
  months: readonly EarlyMonthTuple[],
];

type Mode = "none" | "early" | "delegate";

export interface CalendarData {
  year: number;
  month: number;
  day: number;
  intercalation?: boolean;
  monthLabel?: string;
}

export interface GapJaData {
  year: string;
  month: string;
  day: string;
  intercalation?: string;
}

export interface SupportedRange<T> {
  min: T;
  max: T;
}

export const SUPPORTED_SOLAR_RANGE: SupportedRange<CalendarData> = {
  min: { year: -59, month: 2, day: 13 },
  max: { year: 2050, month: 12, day: 31 },
};

export const SUPPORTED_LUNAR_RANGE: SupportedRange<CalendarData> = {
  min: { year: -59, month: 1, day: 1, intercalation: false },
  max: { year: 2050, month: 11, day: 18, intercalation: false },
};

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const adjustedYear = year + 4800 - a;
  const adjustedMonth = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * adjustedMonth + 2) / 5) +
    365 * adjustedYear +
    Math.floor(adjustedYear / 4) -
    Math.floor(adjustedYear / 100) +
    Math.floor(adjustedYear / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): CalendarData {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  return {
    year: 100 * b + d - 4800 + Math.floor(m / 10),
    month: m + 3 - 12 * Math.floor(m / 10),
    day: e - Math.floor((153 * m + 2) / 5) + 1,
  };
}

function isInSupportedSolarRange(year: number, month: number, day: number): boolean {
  const dateValue = year * 10000 + month * 100 + day;

  return (
    dateValue >= -590213 &&
    dateValue <= 20501231 &&
    !(year === 1582 && month === 10 && day > 4 && day < 15)
  );
}

function isInSupportedLunarRange(
  year: number,
  month: number,
  day: number,
  intercalation: boolean,
): boolean {
  const dateValue = year * 10000 + month * 100 + day;

  if (dateValue < -590101 || dateValue > 20501118) {
    return false;
  }

  if (year === 2050 && (month > 11 || (month === 11 && (intercalation || day > 18)))) {
    return false;
  }

  return true;
}

function formatGapja(
  gapjaInx: {
    cheongan: { year: number; month: number; day: number };
    ganji: { year: number; month: number; day: number };
  },
  intercalation: boolean,
  isChinese: boolean,
): GapJaData {
  const cheongan = isChinese ? CHINESE_CHEONGAN : KOREAN_CHEONGAN;
  const ganji = isChinese ? CHINESE_GANJI : KOREAN_GANJI;
  const unit = isChinese ? CHINESE_GAPJA_UNIT : KOREAN_GAPJA_UNIT;
  const intercalationStr = isChinese
    ? `${INTERCALATION_STR[1]}${CHINESE_GAPJA_UNIT[1]}`
    : `${INTERCALATION_STR[0]}${KOREAN_GAPJA_UNIT[1]}`;

  return {
    year: `${cheongan[gapjaInx.cheongan.year]}${ganji[gapjaInx.ganji.year]}${unit[0]}`,
    month: `${cheongan[gapjaInx.cheongan.month]}${ganji[gapjaInx.ganji.month]}${unit[1]}`,
    day: `${cheongan[gapjaInx.cheongan.day]}${ganji[gapjaInx.ganji.day]}${unit[2]}`,
    intercalation: intercalation ? intercalationStr : "",
  };
}

export default class KasiLunarCalendar {
  private readonly delegate = new KoreanLunarCalendar();

  private mode: Mode = "none";

  private earlyMonthIndex: number | null = null;

  private solarCalendar: CalendarData = { year: 0, month: 0, day: 0 };

  private lunarCalendar: CalendarData = {
    year: 0,
    month: 0,
    day: 0,
    intercalation: false,
  };

  private findEarlyYearData(year: number): EarlyYearTuple | undefined {
    if (year < EARLY_LUNAR_YEAR_START || year > EARLY_LUNAR_YEAR_END) {
      return undefined;
    }

    return KASI_EARLY_LUNAR_DATA[year - EARLY_LUNAR_YEAR_START];
  }

  private findEarlyYearByJdn(jdn: number): EarlyYearTuple | undefined {
    let left = 0;
    let right = KASI_EARLY_LUNAR_DATA.length - 1;

    while (left <= right) {
      const middle = Math.floor((left + right) / 2);
      const yearData = KASI_EARLY_LUNAR_DATA[middle];
      const nextStart =
        KASI_EARLY_LUNAR_DATA[middle + 1]?.[1] ?? EARLY_NEXT_YEAR_START_JD;

      if (jdn < yearData[1]) {
        right = middle - 1;
      } else if (jdn >= nextStart) {
        left = middle + 1;
      } else {
        return yearData;
      }
    }

    return undefined;
  }

  private copyFromDelegate(): void {
    this.solarCalendar = { ...this.delegate.getSolarCalendar() };
    this.lunarCalendar = { ...this.delegate.getLunarCalendar() };
    this.earlyMonthIndex = null;
    this.mode = "delegate";
  }

  private findEarlyMonthIndex(
    yearData: EarlyYearTuple,
    month: number,
    intercalation: boolean,
    monthLabel?: string,
  ): number {
    const matches = yearData[4]
      .map((entry, index) => ({ entry, index }))
      .filter(
        ({ entry }) =>
          entry[0] === month &&
          Boolean(entry[1]) === intercalation &&
          (monthLabel === undefined || entry[4] === monthLabel),
      );

    if (matches.length !== 1) {
      return -1;
    }

    return matches[0].index;
  }

  private findEarlyMonthEntry(
    yearData: EarlyYearTuple,
    month: number,
    intercalation: boolean,
    monthLabel?: string,
  ): EarlyMonthTuple | undefined {
    const monthIndex = this.findEarlyMonthIndex(
      yearData,
      month,
      intercalation,
      monthLabel,
    );

    return monthIndex >= 0 ? yearData[4][monthIndex] : undefined;
  }

  private getEarlyGapJaIndex() {
    const yearData = this.findEarlyYearData(this.lunarCalendar.year);

    if (!yearData) {
      throw new Error("Early lunar year data was not found.");
    }

    const monthIndex =
      this.earlyMonthIndex ??
      this.findEarlyMonthIndex(
        yearData,
        this.lunarCalendar.month,
        Boolean(this.lunarCalendar.intercalation),
        this.lunarCalendar.monthLabel,
      );

    if (monthIndex < 0) {
      throw new Error("Early lunar month data was not found.");
    }

    const monthEntry = yearData[4][monthIndex];
    const monthOrdinal = yearData[3] + monthIndex;
    const dayOrdinal = yearData[2] + monthEntry[2] + this.lunarCalendar.day - 1;

    return {
      cheongan: {
        year: mod(this.lunarCalendar.year + 6, KOREAN_CHEONGAN.length),
        month: mod(monthOrdinal + 6, KOREAN_CHEONGAN.length),
        day: mod(dayOrdinal + 3, KOREAN_CHEONGAN.length),
      },
      ganji: {
        year: mod(this.lunarCalendar.year + 8, KOREAN_GANJI.length),
        month: mod(monthOrdinal + 2, KOREAN_GANJI.length),
        day: mod(dayOrdinal + 7, KOREAN_GANJI.length),
      },
    };
  }

  setSolarDate(solarYear: number, solarMonth: number, solarDay: number): boolean {
    if (!isInSupportedSolarRange(solarYear, solarMonth, solarDay)) {
      return false;
    }

    if (solarYear >= 1000) {
      if (!this.delegate.setSolarDate(solarYear, solarMonth, solarDay)) {
        return false;
      }

      this.copyFromDelegate();
      return true;
    }

    const jdn = gregorianToJdn(solarYear, solarMonth, solarDay);
    const yearData = this.findEarlyYearByJdn(jdn);

    if (!yearData) {
      return false;
    }

    const monthIndex = yearData[4].findIndex((entry, index) => {
      const start = yearData[1] + entry[2];
      const end =
        index + 1 < yearData[4].length
          ? yearData[1] + yearData[4][index + 1][2]
          : KASI_EARLY_LUNAR_DATA[yearData[0] - EARLY_LUNAR_YEAR_START + 1]?.[1] ??
            EARLY_NEXT_YEAR_START_JD;

      return jdn >= start && jdn < end;
    });

    if (monthIndex < 0) {
      return false;
    }

    const monthEntry = yearData[4][monthIndex];

    this.solarCalendar = { year: solarYear, month: solarMonth, day: solarDay };
    this.lunarCalendar = {
      year: yearData[0],
      month: monthEntry[0],
      day: jdn - (yearData[1] + monthEntry[2]) + 1,
      intercalation: Boolean(monthEntry[1]),
      monthLabel: monthEntry[4],
    };
    this.earlyMonthIndex = monthIndex;
    this.mode = "early";

    return true;
  }

  setLunarDate(
    lunarYear: number,
    lunarMonth: number,
    lunarDay: number,
    isIntercalation: boolean,
    monthLabel?: string,
  ): boolean {
    if (!isInSupportedLunarRange(lunarYear, lunarMonth, lunarDay, isIntercalation)) {
      return false;
    }

    if (lunarYear >= 1000) {
      if (
        !this.delegate.setLunarDate(
          lunarYear,
          lunarMonth,
          lunarDay,
          isIntercalation,
        )
      ) {
        return false;
      }

      this.copyFromDelegate();
      return true;
    }

    const yearData = this.findEarlyYearData(lunarYear);

    if (!yearData) {
      return false;
    }

    const monthEntry = this.findEarlyMonthEntry(
      yearData,
      lunarMonth,
      isIntercalation,
      monthLabel,
    );
    const monthIndex = this.findEarlyMonthIndex(
      yearData,
      lunarMonth,
      isIntercalation,
      monthLabel,
    );

    if (!monthEntry || monthIndex < 0 || lunarDay < 1 || lunarDay > monthEntry[3]) {
      return false;
    }

    const solarDate = jdnToGregorian(yearData[1] + monthEntry[2] + lunarDay - 1);

    this.lunarCalendar = {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      intercalation: isIntercalation,
      monthLabel: monthEntry[4],
    };
    this.solarCalendar = solarDate;
    this.earlyMonthIndex = monthIndex;
    this.mode = "early";

    return true;
  }

  getGapJaIndex(): {
    cheongan: { year: number; month: number; day: number };
    ganji: { year: number; month: number; day: number };
  } {
    if (this.mode === "delegate") {
      return this.delegate.getGapJaIndex();
    }

    return this.getEarlyGapJaIndex();
  }

  getGapja(isChinese = false): GapJaData {
    if (this.mode === "delegate") {
      return this.delegate.getGapja(isChinese);
    }

    return formatGapja(
      this.getEarlyGapJaIndex(),
      Boolean(this.lunarCalendar.intercalation),
      isChinese,
    );
  }

  getKoreanGapja(): GapJaData {
    return this.getGapja(false);
  }

  getChineseGapja(): GapJaData {
    return this.getGapja(true);
  }

  getLunarCalendar(): CalendarData {
    return this.lunarCalendar;
  }

  getSolarCalendar(): CalendarData {
    return this.solarCalendar;
  }
}
