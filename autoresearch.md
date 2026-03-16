# Autoresearch Guidelines

Optimize the bundle size of `examples/react/dist/main.lynx.bundle` by reducing code in `packages/react/runtime`.

## Rules

1. **Metric**: Bundle size in bytes of `examples/react/dist/main.lynx.bundle`. Lower is better.
2. **Workload**: Build the `examples/react` project using `pnpm run build`.
3. **Scope**: Modifications should be limited to `packages/react/runtime`.
4. **Correctness**: Ensure that the optimized code still builds and functions correctly. We can run existing tests to verify.
5. **Optimization**: Look for unused code, redundant logic, or verbose implementations that can be simplified.
6. **Verification**: After each optimization, verify the bundle size and ensure the build succeeds.

## Steps

1. Measure baseline bundle size.
2. Identify a candidate for optimization in `packages/react/runtime`.
3. Apply the optimization.
4. Rebuild `packages/react/runtime` (if necessary) and `examples/react`.
5. Measure the new bundle size.
6. Log the result.
7. If successful, keep the change. If not, revert.
