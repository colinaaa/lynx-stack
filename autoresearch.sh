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

# Extract metrics from coverage summary
COV_FILE="packages/react/runtime/coverage/coverage-summary.json"
if [ ! -f "$COV_FILE" ]; then
  echo "coverage summary not found: $COV_FILE" >&2
  exit 1
fi

read -r LINES BRANCHES STATEMENTS FUNCTIONS < <(
  node -e "const fs=require('fs');const p=process.argv[1];const d=JSON.parse(fs.readFileSync(p,'utf8')).total;console.log([d.lines.pct,d.branches.pct,d.statements.pct,d.functions.pct].join(' '));" "$COV_FILE"
)

echo "METRIC coverage_branches_pct=$BRANCHES"
echo "METRIC coverage_lines_pct=$LINES"
echo "METRIC coverage_statements_pct=$STATEMENTS"
echo "METRIC coverage_functions_pct=$FUNCTIONS"
