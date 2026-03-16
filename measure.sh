#!/bin/bash
set -e

# Build examples/react
cd examples/react
pnpm run build > /dev/null 2>&1

# Measure size
SIZE=$(stat -c%s dist/main.lynx.bundle)
echo "$SIZE"
