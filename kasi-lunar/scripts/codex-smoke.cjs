#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function fail(message) {
  console.error(`[harness:smoke] ${message}`);
  process.exit(1);
}

async function main() {
  const root = process.cwd();
  const distPath = path.join(root, "dist", "index.js");

  if (!fs.existsSync(distPath)) {
    fail("Missing dist/index.js. Run the build first.");
  }

  const mod = await import(pathToFileURL(distPath).href);
  const CalendarCtor = mod.default || mod.KasiLunarCalendar;

  if (typeof CalendarCtor !== "function") {
    fail("Library default export is not a constructor.");
  }

  if (!mod.SUPPORTED_SOLAR_RANGE || !mod.SUPPORTED_LUNAR_RANGE) {
    fail("Supported range exports are missing.");
  }

  const calendar = new CalendarCtor();

  if (!calendar.setSolarDate || !calendar.setLunarDate) {
    fail("Calendar instance is missing conversion methods.");
  }

  if (calendar.setSolarDate(-59, 2, 13) !== true) {
    fail("Solar minimum boundary check failed.");
  }

  const lunar = calendar.getLunarCalendar();

  if (!lunar || lunar.year !== -59 || lunar.month !== 1 || lunar.day !== 1) {
    fail("Solar to lunar smoke conversion failed.");
  }

  if (calendar.setLunarDate(2020, 4, 1, true) !== true) {
    fail("Leap month smoke conversion failed.");
  }

  const solar = calendar.getSolarCalendar();

  if (!solar || typeof solar.year !== "number" || typeof solar.month !== "number" || typeof solar.day !== "number") {
    fail("Lunar to solar smoke conversion returned an invalid shape.");
  }

  console.log("[harness:smoke] ok");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
