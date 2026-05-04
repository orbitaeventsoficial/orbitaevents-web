import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const SCAN_DIRS = ['app', 'components', 'lib', 'hooks'];
const SKIP_SEGMENTS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'build']);

const CANONICAL_FETCHES = [
  {
    id: 'google-reviews',
    url: '/api/google-reviews',
    client: 'lib/api/googleReviewsClient.ts',
    helper: 'fetchPublicGoogleReviews()',
  },
  {
    id: 'hero-media',
    url: '/api/hero-media',
    client: 'lib/api/heroMediaClient.ts',
    helper: 'fetchHeroMedia()',
  },
  {
    id: 'public-stats',
    url: '/api/public/stats',
    client: 'lib/api/publicStatsClient.ts',
    helper: 'fetchPublicStats()',
  },
  {
    id: 'public-availability',
    url: '/api/public/availability',
    client: 'lib/api/publicAvailabilityClient.ts',
    helper: 'fetchPublicAvailability()',
  },
  {
    id: 'public-packs',
    url: '/api/public/packs',
    client: 'lib/api/publicPacksClient.ts',
    helper: 'fetchPublicPacks()',
  },
  {
    id: 'image-manager',
    url: '/api/public/image-manager',
    client: 'lib/api/imageManagerClient.ts',
    helper: 'fetchImageManager()',
  },
  {
    id: 'public-coverage',
    url: '/api/public/coverage',
    client: 'lib/api/publicCoverageClient.ts',
    helper: 'fetchPublicCoverage()',
  },
];

const ALLOWLIST = new Set(CANONICAL_FETCHES.map((entry) => entry.client));

function* walkFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (entry.isFile() && /\.(tsx?|jsx?|mjs|cjs)$/i.test(entry.name)) {
      yield full;
    }
  }
}

function toPosix(relative) {
  return relative.split(path.sep).join('/');
}

function buildDetector(url) {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // matches fetch('/api/...'), fetch("/api/..."), fetch(`/api/...`) and template literals beginning with the URL
  return new RegExp(`fetch\\(\\s*['"\`]${escaped}(['"\`?])`);
}

const detectors = CANONICAL_FETCHES.map((entry) => ({
  ...entry,
  pattern: buildDetector(entry.url),
}));

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const filePath of walkFiles(path.join(repoRoot, dir))) {
    const relative = path.relative(repoRoot, filePath);
    const normalized = toPosix(relative);
    if (ALLOWLIST.has(normalized)) continue;

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    for (const detector of detectors) {
      if (detector.pattern.test(content)) {
        violations.push({ file: normalized, detector });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[canonical-fetches] FAIL: ${violations.length} direct fetch(es) outside the canonical API client(s):`,
  );
  for (const v of violations) {
    console.error(
      `  - ${v.file}: fetch('${v.detector.url}') — use ${v.detector.helper} from ${v.detector.client} instead.`,
    );
  }
  console.error(
    "Public API endpoints with a canonical client must go through it to keep monocapa (one URL, one shape, one error path). See Canvis #427 (google-reviews) and #431 (hero-media).",
  );
  process.exit(1);
}

console.log(
  `[canonical-fetches] OK: ${CANONICAL_FETCHES.length} canonical fetch(es) routed exclusively through their lib/api/* client.`,
);
