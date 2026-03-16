# Optimization Ideas

- **backgroundSnapshot.ts branch coverage**: 6 branches missing (96.98%). Likely related to `setAttributeImpl` edge cases (e.g. `__lynx_timing_flag` logic) or `removeChild` ref updates. Requires verifying `globalPipelineOptions` interaction.
- **commit.ts branch coverage**: 1 branch missing. Check `delayedRunOnMainThreadData` interactions.
- **workletRef.ts branch coverage**: 1 missing in both snapshot and worklet variants.
- **Coverage tooling**: `coverage-summary.json` sometimes missing in `autoresearch.sh` run (race condition or cleanup issue?).
