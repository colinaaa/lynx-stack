# Autoresearch: Improve test coverage of @lynx-js/react-runtime

## Objective

Increase measured test coverage for `@lynx-js/react-runtime` while keeping the package buildable and test suite green. The workload is the package test command with coverage enabled.

## Metrics

- **Primary**: `coverage_lines_pct` (%, higher is better)
- **Secondary**: test duration (s), pass/fail status for required checks

## How to Run

`./autoresearch.sh` — runs the package tests and prints:

- `METRIC coverage_lines_pct=<number>`

## Files in Scope

- `packages/react/runtime/**` — runtime source and tests only.

## Off Limits

- Any files outside `packages/react/runtime/**` (except autoresearch control files in repo root).
- Dependency changes / lockfile changes.

## Constraints

- `pnpm build` must pass.
- `pnpm --filter @lynx-js/react-runtime test` must pass.

## What's Been Tried

- Initialized session and established coverage extraction from Vitest JSON summary.
- Initial baseline with the package `test` script failed due strict global thresholds (`lines 99.53%`, `branches 92.06%`), so benchmark runner now disables thresholds only for metric collection.
- Correctness guard remains in `autoresearch.checks.sh`, which enforces `pnpm build` and `pnpm --filter @lynx-js/react-runtime test`.
- Next: identify low/zero-covered modules within `packages/react/runtime/src/**` and add focused tests under `packages/react/runtime/__test__/**`.
