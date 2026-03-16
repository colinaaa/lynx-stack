# Optimization Ideas

- **Simplify `tt.ts` lifecycle handling**: `onLifecycleEventImpl` first-screen path is large and branchy; target code-size-neutral refactors that enable better DCE (especially around logging/profiling guarded blocks).
- **Alog/code-splitting hygiene**: verify `__ALOG__`-guarded debug formatting paths (for example in patch formatting/update main thread logging) are fully eliminated from production bundles.
- **Review `renderToOpcodes` surface**: confirm we are not retaining SSR/main-thread-only paths in the background runtime bundle for `examples/react`.
- **Diff/hydrate hot paths**: inspect `hydrate.ts`/`backgroundSnapshot.ts` for repeated helper patterns that can be consolidated without behavior changes.

## Pruned as explored

- `spread.ts` repetitive conditional refactor (already implemented and validated).
- `snapshot.ts` `takeElements` and update-call simplifications (already implemented and validated).
- `const enum` conversion for `SnapshotOperation` (tried; caused major size regression due enum runtime emit).
