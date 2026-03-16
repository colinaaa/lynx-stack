# Optimization Ideas

- **snapshot/workletRef.ts (line ~21, 1 missing)**: attempted `_wkltId` queue forcing (including `Object.create(null)` shape) did not invoke `runWorkletCtx`; branch may be effectively unreachable in current runtime wiring.
- **snapshot.ts switch null-branch hits (line ~388)**: coverage shows `[14,null,null,null]`; likely instrumentation artifact for switch mapping rather than an actionable missing runtime path.
- **utils.ts null-branch hit (line ~86)**: `lynxQueueMicrotask` branch reports `[1,null]`; likely instrumentation artifact for environment-gated initializer.

## Recently closed

- renderToOpcodes/index.ts recoverable-thenable catch path closed (DIRTY false side), improving overall branches to 99.52%.
- commit.ts callback guard at line ~171 (`if (commitTask)`) false side closed by clearing `globalCommitTaskMap` before callback.
- backgroundSnapshot.ts missing branches at lines ~200/203/290/422 closed.
- snapshot/spread.ts missing branch at line ~56 closed.
