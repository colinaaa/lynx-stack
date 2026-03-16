# Optimization Ideas

- **Simplify `tt.ts` first-screen path**: continue reducing branchy hydration/event code in `onLifecycleEventImpl`, focusing on behavior-preserving inlining and redundant-state cleanup.
- **Alog/code-splitting hygiene**: verify `__ALOG__`-guarded debug formatting/logging paths are fully eliminated from production bundles.
- **Review `renderToOpcodes` surface**: confirm SSR/main-thread-only paths are not retained in the `examples/react` background runtime bundle.
- **Diff/hydrate hot paths**: inspect `hydrate.ts`/`backgroundSnapshot.ts` for repeated helper patterns that can be consolidated safely.

## Pruned as explored

- `spread.ts` repetitive conditional refactor (implemented and validated).
- `snapshot.ts` `takeElements` and update-call simplifications (implemented and validated).
- `const enum` conversion for `SnapshotOperation` (tried; major size regression due enum runtime emit).
- Remove pretty patch formatting dependency in `updateMainThread` ALOG path (tried; no size change).
- `updateAttribute` event-regex branch reshaping in `spread.ts` (tried; no size change).
- Hoist `__PROFILE__` check to local in `onLifecycleEvent` (tried; no size change).
- `runWithForce` optional-chaining simplification (tried; size regression).
- `tt.ts` hydration commit-task `forEach` -> `for...of` conversion (tried; size regression).
- `delayLifecycleEvent` arrow conversion (tried; no size change).
- `tt.processCardConfig` flattening (tried; no size change).
