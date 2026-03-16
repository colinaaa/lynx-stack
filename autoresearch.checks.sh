#!/usr/bin/env bash
set -euo pipefail

BUILD_LOG=$(mktemp)
TEST_LOG=$(mktemp)

cleanup() {
  rm -f "$BUILD_LOG" "$TEST_LOG"
}
trap cleanup EXIT

pnpm build >"$BUILD_LOG" 2>&1 || {
  tail -80 "$BUILD_LOG"
  exit 1
}

pnpm --filter @lynx-js/react-runtime test >"$TEST_LOG" 2>&1 || {
  tail -80 "$TEST_LOG"
  exit 1
}
