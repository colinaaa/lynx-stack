# Optimization Ideas

- **backgroundSnapshot.ts branch coverage (6 missing)**: prioritize `setAttributeImpl` timing-flag handling and `removeChild`/ref cleanup edges.
- **snapshot.ts branch coverage (3 missing, switch-related)**: inspect `ensureElements` `DynamicPartType` switch paths and confirm whether null-hit branches are practically coverable.
- **commit.ts branch coverage (1 missing)**: `if (globalPipelineOptions)` false path in `commitPatchUpdate` still not hit; prior attempts with `setPipeline(undefined/null)` in tests were ineffective.
- **snapshot/workletRef.ts branch coverage (1 missing)**: `applyRefQueue` first `if ('_wvid' in worklet)` false side still unhit; `_wkltId` test path appears not to drive this branch in coverage.
- **utils.ts branch coverage (1 missing, null branch hit)**: inspect `lynxQueueMicrotask` initialization branch at line ~86 for meaningful additional test coverage.
