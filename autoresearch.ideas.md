# Optimization Ideas

- **Simplify `tt.ts` first-screen path**: continue reducing branchy hydration/event code in `onLifecycleEventImpl`, focusing on behavior-preserving inlining and redundant-state cleanup.
- **Alog/code-splitting hygiene**: verify `__ALOG__`-guarded debug formatting/logging paths are fully eliminated from production bundles.
- **Review `renderToOpcodes` surface**: confirm SSR/main-thread-only paths are not retained in the `examples/react` background runtime bundle.
- **Diff/hydrate hot paths**: inspect `hydrate.ts`/`backgroundSnapshot.ts` for repeated helper patterns that can be consolidated safely.
- **Hook callback dedup sweep**: continue finding repeated hook callback wrappers in runtime lifecycle/performance modules where generic shared handlers may reduce emitted code.

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
- `hydrate.ts` forEach-to-for conversion in hydrate path (tried; size regression).
- `destroy.ts` forEach-to-for-of conversion (tried; size regression).
- `isRendering.ts` inlining set helper into callback (tried; no size change).
- `performance.ts` helper inlining into hook callback (tried; no size change).
- `tt.ts` remap loop rewrite to cached `for` variable (tried; size regression).
- `publishEvent` snapshot-id parse shape changes (tried; no size change).
- Enum-scaffolding removals completed for `lifecycleConstant.ts`, `dynamicPartType.ts`, and local `Opcode` in `opcodes.ts` (large wins, path exhausted in runtime scope).
