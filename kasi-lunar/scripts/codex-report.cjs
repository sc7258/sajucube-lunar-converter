#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(relativePath) {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function main() {
  const pkg = readJson(path.join(process.cwd(), "package.json"));

  const report = {
    package: pkg.name,
    version: pkg.version,
    harnessDocs: {
      agents: exists("AGENTS.md"),
      memory: exists(".ai/MEMORY.md"),
      plan: exists(".ai/PLAN.md"),
      rules: exists(".ai/RULES.md"),
      quickstart: exists("docs/CODEX_HARNESS_QUICKSTART.md"),
    },
    harnessScripts: {
      smoke: pkg.scripts?.["harness:smoke"] || null,
      report: pkg.scripts?.["harness:report"] || null,
      build: pkg.scripts?.build || null,
      test: pkg.scripts?.test || null,
    },
    libraryFiles: {
      srcIndex: exists("src/index.ts"),
      distIndexJs: exists("dist/index.js"),
      distIndexCjs: exists("dist/index.cjs"),
      verifyBuildScript: exists("scripts/verify-build.mjs"),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
