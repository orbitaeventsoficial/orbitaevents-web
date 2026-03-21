export function isBuildPrerenderPhase() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
