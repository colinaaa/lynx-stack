#!/usr/bin/env bash
set -euo pipefail

# Fast pre-check: ensure package exists
[ -f "packages/react/runtime/package.json" ]

# Run coverage workload (disable thresholds so metric can be measured continuously)
pnpm --filter @lynx-js/react-runtime exec vitest run --coverage \
  --coverage.reporter=json-summary \
  --coverage.reporter=text-summary \
  --coverage.thresholds.lines=0 \
  --coverage.thresholds.functions=0 \
  --coverage.thresholds.statements=0 \
  --coverage.thresholds.branches=0

# Extract primary metric from coverage summary
COV_FILE="packages/react/runtime/coverage/coverage-summary.json"
if [ ! -f "$COV_FILE" ]; then
  echo "coverage summary not found: $COV_FILE" >&2
  exit 1
fi

COVERAGE=$(node -e "const fs=require('fs');const p=process.argv[1];const d=JSON.parse(fs.readFileSync(p,'utf8'));process.stdout.write(String(d.total.lines.pct));" "$COV_FILE")

echo "METRIC coverage_lines_pct=$COVERAGE"
