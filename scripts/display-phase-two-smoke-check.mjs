import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const rail = fs.readFileSync(path.join(rootDir, 'src/ActiveCaseWorkflowRail.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const categoryRail = fs.readFileSync(path.join(rootDir, 'src/CategoryTileRail.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayPhaseTwo.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const sourceOfTruth = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md'), 'utf8');
const displayHandoff = fs.readFileSync(path.join(rootDir, 'docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Phase 2 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden Phase 2 text: ${text}`);
}

const stageBlock = rail.match(/const workflowStages = \[([\s\S]*?)\n\];/);
if (!stageBlock) {
  failures.push('ActiveCaseWorkflowRail.jsx is missing the workflowStages block.');
} else {
  const keys = [...stageBlock[1].matchAll(/key: '([^']+)'/g)].map((match) => match[1]);
  const labels = [...stageBlock[1].matchAll(/label: '([^']+)'/g)].map((match) => match[1]);
  const expectedKeys = ['briefing', 'investigate', 'timeline', 'summary', 'indicators', 'determination', 'debrief'];
  const expectedLabels = ['Case Briefing', 'Investigate', 'Timeline', 'Summary', 'Indicators', 'Determination', 'Debrief'];
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    failures.push(`Workflow stage keys must be exactly ${expectedKeys.join(', ')}; found ${keys.join(', ') || 'none'}.`);
  }
  if (JSON.stringify(labels) !== JSON.stringify(expectedLabels)) {
    failures.push(`Workflow labels must be exactly ${expectedLabels.join(', ')}; found ${labels.join(', ') || 'none'}.`);
  }
}

mustContain('ActiveCaseWorkflowRail.jsx', rail, 'aria-label="Active case workflow"');
mustContain('ActiveCaseWorkflowRail.jsx', rail, "aria-current={active ? 'step' : undefined}");
mustContain('ActiveCaseWorkflowRail.jsx', rail, 'data-workflow-stage-button={stage.key}');
mustContain('VisualWorkspace.jsx', workspace, "const [activeStage, setActiveStage] = useState('briefing');");
mustContain('VisualWorkspace.jsx', workspace, '<ActiveCaseWorkflowRail');
mustContain('VisualWorkspace.jsx', workspace, 'stageStatus={stageStatus}');
mustContain('VisualWorkspace.jsx', workspace, 'data-workflow-stage="briefing"');
mustContain('VisualWorkspace.jsx', workspace, 'data-workflow-stage="investigate"');
mustContain('VisualWorkspace.jsx', workspace, 'data-workflow-stage="indicators"');
mustContain('VisualWorkspace.jsx', workspace, 'data-workflow-stage="determination"');
mustContain('VisualWorkspace.jsx', workspace, "openTool('Timeline', 'timeline')");
mustContain('VisualWorkspace.jsx', workspace, "openTool('Case Report', 'summary')");
mustContain('VisualWorkspace.jsx', workspace, "openTool('Evidence Center', 'indicators')");
mustContain('VisualWorkspace.jsx', workspace, "scrollToWorkspace('.luna-visual-panel', 80)");
mustContain('VisualWorkspace.jsx', workspace, "label: hasReviewPackage ? 'Available' : 'Locked'");
mustContain('VisualWorkspace.jsx', workspace, 'packageStatus.ready');
mustContain('CategoryTileRail.jsx', categoryRail, 'onInvestigate');
mustContain('CategoryTileRail.jsx', categoryRail, 'onInvestigate?.();');
mustContain('displayPhaseTwo.css', styles, '.active-case-workflow-list');
mustContain('displayPhaseTwo.css', styles, 'grid-template-columns: repeat(7, minmax(0, 1fr));');
mustContain('displayPhaseTwo.css', styles, '@media (max-width: 620px)');
mustContain('main.jsx', entrypoint, "import './displayPhaseTwo.css';");
mustContain('Source of Truth', sourceOfTruth, '`src/ActiveCaseWorkflowRail.jsx`');
mustContain('Display Handoff', displayHandoff, 'Completed in the focused workflow-rail change:');

for (const forbidden of ['Red flag', 'Green flag', 'Fraudulent', 'Legitimate', 'Correct answer', 'AI recommendation']) {
  mustNotContain('ActiveCaseWorkflowRail.jsx', rail, forbidden);
  mustNotContain('VisualWorkspace.jsx workflow status', workspace, forbidden);
}

mustNotContain('VisualWorkspace.jsx', workspace, 'generatedCaseRepository');
mustNotContain('VisualWorkspace.jsx', workspace, 'indexedDB');
mustNotContain('VisualWorkspace.jsx', workspace, 'SystemAccessLane');

if (failures.length) {
  console.error('Display Phase 2 smoke check failed. Repair these workflow-rail anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Display Phase 2 smoke check passed. The seven neutral stages are wired, the category rail stays inside Investigate, determination remains package-gated, and Debrief stays locked until a saved package exists.');
