# Optimization Ideas

- **renderToOpcodes/index.ts (line ~261, 1 missing)**: investigate recoverable suspend path where `component[DIRTY]` stays false after `setState` in catch branch.
- **commit.ts (line ~171, 1 missing)**: `if (globalPipelineOptions)` false branch still unhit despite `setPipeline(undefined/null)` attempts; may require runtime path that does not initialize pipeline state.
- **snapshot/workletRef.ts (line ~21, 1 missing)**: else-if false side appears structurally hard to reach because queue entries are added only for `_wvid` or `_wkltId` values.
- **snapshot.ts and utils.ts null-hit branches**: remaining misses are likely instrumentation artifacts (`null` branch slots); verify practical reachability before investing further.

## Recently closed

- backgroundSnapshot.ts missing branches at lines ~200/203/290/422 closed.
- snapshot/spread.ts missing branch at line ~56 closed.
