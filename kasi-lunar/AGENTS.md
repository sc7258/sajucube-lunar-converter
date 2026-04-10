# Codex Entry Guide

## Real Work Target

- The active project is this directory: `kasi-lunar/`
- Neighbor folders in the workspace are reference projects only
- Treat `kasi-lunar` as the only edit target unless a task explicitly says otherwise

## Project Intent

- `kasi-lunar` is an npm-published TypeScript library
- The package is intended to extend `korean-lunar-calendar`
- The long-term goal is KASI-aligned lunar/solar conversion support across the KASI published range

## Read Order

1. `AGENTS.md`
2. `.ai/MEMORY.md`
3. `.ai/RULES.md`
4. `.ai/PLAN.md`
5. `README.md`
6. `package.json`

## Important Files

- `src/` for library source
- `scripts/` for verification and harness helpers
- `docs/` for stable project docs
- `.ai/` for Codex working context

## Verification Loop

1. Make the smallest focused change
2. Run `npm run harness:smoke`
3. Run `npm run harness:report`
4. Run `npm test` when the change affects behavior or public API
