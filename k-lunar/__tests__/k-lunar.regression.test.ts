// @ts-nocheck
import { Lunar, Solar, SolarUtil } from "../src/index";

test("uses Gregorian solar-date conversion for 1397-05-15", () => {
  const solar = Solar.fromYmd(1397, 5, 15);
  const lunar = solar.getLunar();

  expect(solar.toYmd()).toBe("1397-05-15");
  expect(lunar.getYear()).toBe(1397);
  expect(lunar.getMonth()).toBe(4);
  expect(lunar.getDay()).toBe(10);
  expect(lunar.toString()).toBe("一三九七年四月初十");
});

test("converts 1976-10-28 07:00:00 to the expected lunar date", () => {
  const solar = Solar.fromYmdHms(1976, 10, 28, 7, 0, 0);
  const lunar = solar.getLunar();

  expect(solar.toYmdHms()).toBe("1976-10-28 07:00:00");
  expect(lunar.getYear()).toBe(1976);
  expect(lunar.getMonth()).toBe(9);
  expect(lunar.getDay()).toBe(6);
  expect(lunar.getTimeZhi()).toBe("辰");
  expect(lunar.toString()).toBe("一九七六年九月初六");
});

test("converts lunar 1976-10-28 07:00:00 to the expected solar date", () => {
  const lunar = Lunar.fromYmdHms(1976, 10, 28, 7, 0, 0);
  const solar = lunar.getSolar();

  expect(lunar.getYear()).toBe(1976);
  expect(lunar.getMonth()).toBe(10);
  expect(lunar.getDay()).toBe(28);
  expect(lunar.getTimeZhi()).toBe("辰");
  expect(lunar.toString()).toBe("一九七六年十月廿八");
  expect(solar.toYmdHms()).toBe("1976-12-19 07:00:00");
});

test("keeps October 1582 as continuous Gregorian dates", () => {
  const october4 = Solar.fromYmd(1582, 10, 4);
  const october15 = Solar.fromYmd(1582, 10, 15);
  const lunarOctober18 = Lunar.fromYmdHms(1582, 9, 18, 12, 0, 0);
  const lunarOctober19 = Lunar.fromYmdHms(1582, 9, 19, 12, 0, 0);

  expect(october4.nextDay(1).toYmd()).toBe("1582-10-05");
  expect(october15.nextDay(-1).toYmd()).toBe("1582-10-14");
  expect(SolarUtil.getDaysBetween(1582, 10, 4, 1582, 10, 15)).toBe(11);
  expect(lunarOctober18.getSolar().toYmdHms()).toBe("1582-10-14 12:00:00");
  expect(lunarOctober19.getSolar().toYmdHms()).toBe("1582-10-15 12:00:00");
});

test("interprets Date-based timeline calculations using fixed KST", () => {
  const beforeMidnightKst = Solar.fromDate(new Date("2024-01-01T14:59:59.000Z"));
  const atMidnightKst = Solar.fromDate(new Date("2024-01-01T15:00:00.000Z"));

  expect(beforeMidnightKst.toYmdHms()).toBe("2024-01-01 23:59:59");
  expect(atMidnightKst.toYmdHms()).toBe("2024-01-02 00:00:00");
  expect(beforeMidnightKst.next(1).toYmdHms()).toBe("2024-01-02 23:59:59");
});
