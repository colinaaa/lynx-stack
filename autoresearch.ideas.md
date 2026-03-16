# Optimization Ideas

- **Simplify `tt.ts`**: The `onLifecycleEventImpl` function is very large and handles many lifecycle events. Breaking it down or simplifying the hydration logic (especially `JSON.parse` and logging) could save bytes.
- **Optimize `snapshot.ts`**: `SnapshotInstance` has many methods for DOM manipulation. Some might be simplified or tree-shaken if not used (e.g. `takeElements`, `unRenderElements`).
- **Refactor `spread.ts`**: Further simplify `updateSpread` logic. The conditional blocks are repetitive.
- **Review `preact` usage**: Check if we are pulling in unnecessary parts of Preact. The `renderToOpcodes` implementation forks `preact-render-to-string`, maybe it can be optimized further.
- **Tree-shake `alog`**: Ensure all `__ALOG__` blocks are effectively stripped.
