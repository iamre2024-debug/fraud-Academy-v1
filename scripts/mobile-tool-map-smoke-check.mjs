import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const component = read('src/MobileToolMap.jsx');
const styles = read('src/mobileCaseQueueToolMap.css');
const browserSpec = read('tests/mobile-tool-map-browser.spec.mjs');
const packageManifest = read('package.json');

const checks = [
  [
    'Tool Map keeps five factual clusters and the center overview',
    ['identity', 'access', 'financial', 'business', 'evidence']
      .every((key) => component.includes(`key: '${key}'`))
      && component.includes('mobile-tool-map-overview'),
  ],
  [
    'Tool Map starts without an implicitly selected cluster',
    component.includes("useState('')")
      && component.includes("?? null")
      && !component.includes('clusters[0]'),
  ],
  [
    'Cluster details appear only in the conditional contained sheet',
    component.includes('{selectedCluster && (')
      && component.includes('data-mobile-tool-map-sheet="true"')
      && component.includes("onClick={() => setSelectedClusterKey('')}"),
  ],
  [
    'All investigation and workflow actions remain wired',
    [
      'onOpenTool(tool)',
      'onOpenOverview',
      'onOpenPinnedEvidence',
      'onOpenNotes',
      'onOpenIndicators',
      'onOpenDecision',
    ].every((anchor) => component.includes(anchor)),
  ],
  [
    'Every map and workflow action has an unambiguous accessible name',
    component.includes('aria-label={`Open ${tool}`}')
      && component.includes('aria-label="Close selected tool group"')
      && component.includes('aria-label={`Open ${cluster.label} tool group`}')
      && component.includes('aria-label="Open Case Overview from Tool Map"')
      && component.includes('aria-label="Open Pinned Evidence from Tool Map"')
      && component.includes('aria-label="Open Case Notes from Tool Map"')
      && component.includes('aria-label="Open Indicators from Tool Map"')
      && component.includes('aria-label="Open Determination from Tool Map"')
      && !component.includes('aria-label={`Close ${selectedCluster.label} tools`}'),
  ],
  [
    'Map nodes use non-overlapping grid areas instead of absolute coordinates',
    styles.includes('grid-template-areas:')
      && styles.includes('"identity access"')
      && styles.includes('"overview overview"')
      && styles.includes('"financial business"')
      && styles.includes('"evidence evidence"')
      && /mobile-tool-map-cluster,\s*[\s\S]*?mobile-tool-map-overview\s*\{[^}]*position:\s*relative/.test(styles),
  ],
  [
    'Every node is assigned to its intended grid area',
    ['identity', 'access', 'financial', 'business', 'evidence']
      .every((key) => new RegExp(`mobile-tool-map-cluster-${key}\\s*\\{[^}]*grid-area:\\s*${key}`).test(styles))
      && /mobile-tool-map-overview\s*\{[^}]*grid-area:\s*overview/.test(styles),
  ],
  [
    'Narrow phones retain explicit, contained map geometry',
    styles.includes('@media (max-width: 370px)')
      && /mobile-tool-map-canvas\s*\{[^}]*--tool-map-gap:\s*10px[^}]*grid-template-rows:[^}]*min-height:\s*656px/s.test(styles)
      && /mobile-tool-map-connectors\s*\{[^}]*pointer-events:\s*none/.test(styles),
  ],
  [
    'Browser coverage checks pairwise intersections across phone and portrait tablet widths',
    browserSpec.includes('for (const width of [320, 360, 390, 600, 720, 800])')
      && browserSpec.includes('horizontalOverlap')
      && browserSpec.includes('verticalOverlap')
      && browserSpec.includes('expect(geometry.intersections).toEqual([])')
      && browserSpec.includes('width: 1024, height: 768'),
  ],
  [
    'Browser coverage verifies the initial map-first state',
    browserSpec.includes("locator('#mobile-tool-map-tray')).toHaveCount(0)")
      && browserSpec.includes("mobile-tool-map-cluster[aria-pressed=\"true\"]"),
  ],
  [
    'The focused static contract is wired into repository verification',
    packageManifest.includes('"mobile-tool-map-smoke-check": "node scripts/mobile-tool-map-smoke-check.mjs"')
      && packageManifest.includes('npm run mobile-tool-map-smoke-check'),
  ],
];

const forbiddenAbsolutePositions = [
  'identity',
  'access',
  'financial',
  'business',
  'evidence',
].filter((key) => (
  new RegExp(
    `mobile-tool-map-cluster-${key}\\s*\\{[^}]*(?:left|right|top|bottom):`,
    's',
  ).test(styles)
));

checks.push([
  'No cluster reintroduces absolute edge coordinates',
  forbiddenAbsolutePositions.length === 0,
]);

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) console.log(`${passed ? '✓' : '✗'} ${label}`);
if (failed.length) process.exit(1);
console.log(`Mobile Tool Map smoke check passed (${checks.length} checks).`);
