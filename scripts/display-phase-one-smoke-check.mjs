import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const navigation = fs.readFileSync(path.join(rootDir, 'src/VisualNavigation.jsx'), 'utf8');
const header = fs.readFileSync(path.join(rootDir, 'src/VisualShellHeader.jsx'), 'utf8');
const workspace = fs.readFileSync(path.join(rootDir, 'src/VisualWorkspace.jsx'), 'utf8');
const styles = fs.readFileSync(path.join(rootDir, 'src/displayPhaseOne.css'), 'utf8');
const entrypoint = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf8');
const failures = [];

function mustContain(fileLabel, content, text) {
  if (!content.includes(text)) failures.push(`${fileLabel} is missing required Phase 1 anchor: ${text}`);
}

function mustNotContain(fileLabel, content, text) {
  if (content.includes(text)) failures.push(`${fileLabel} contains forbidden or transitional Phase 1 text: ${text}`);
}

const navigationBlock = navigation.match(/const navigationItems = \[([\s\S]*?)\n\];/);
if (!navigationBlock) {
  failures.push('VisualNavigation.jsx is missing the global navigationItems block.');
} else {
  const keys = [...navigationBlock[1].matchAll(/key: '([^']+)'/g)].map((match) => match[1]);
  const expected = ['dashboard', 'cases', 'workspace', 'academy'];
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    failures.push(`Global navigation must be exactly ${expected.join(', ')}; found ${keys.join(', ') || 'none'}.`);
  }
}

mustNotContain('VisualNavigation.jsx global navigation', navigationBlock?.[1] ?? '', "key: 'progress'");
mustContain('VisualNavigation.jsx', navigation, "progress: {");
mustContain('VisualNavigation.jsx', navigation, "onClick={() => onNavigate('progress')}>View Progress</button>");
mustContain('VisualNavigation.jsx', navigation, "onClick={() => onNavigate('progress')}>Open Academy Progress</button>");
mustContain('VisualNavigation.jsx', navigation, '<AcademyProgressPanel cases={cases} packagesByCase={snapshot.packagesByCase} onOpenCase={onOpenCase} />');

mustContain('VisualShellHeader.jsx', header, "import { useEffect, useState } from 'react';");
mustContain('VisualShellHeader.jsx', header, 'aria-label="Application controls"');
mustContain('VisualShellHeader.jsx', header, 'aria-label="Open Help"');
mustContain('VisualShellHeader.jsx', header, 'aria-label="Open Settings"');
mustContain('VisualShellHeader.jsx', header, 'aria-label="Open Agent profile"');
mustContain('VisualShellHeader.jsx', header, 'aria-expanded={activeControl ===');
mustContain('VisualShellHeader.jsx', header, 'Evidence First guide');
mustContain('VisualShellHeader.jsx', header, 'type="checkbox" checked={reducedMotion}');
mustContain('VisualShellHeader.jsx', header, "window.localStorage.setItem(reducedMotionKey, String(reducedMotion))");
mustContain('VisualShellHeader.jsx', header, "navigate('progress')");
mustContain('VisualShellHeader.jsx', header, 'Current assignment: <strong>{activeCase.id}</strong>');
mustNotContain('VisualShellHeader.jsx', header, 'Coming soon');
mustNotContain('VisualShellHeader.jsx', header, 'placeholder');

mustContain('VisualWorkspace.jsx', workspace, '<VisualShellHeader');
mustContain('VisualWorkspace.jsx', workspace, 'onNavigate={onNavigate}');
mustContain('displayPhaseOne.css', styles, '.visual-react-bottom-nav');
mustContain('displayPhaseOne.css', styles, 'grid-template-columns: repeat(4, minmax(0, 1fr));');
mustContain('displayPhaseOne.css', styles, '.visual-header-controls');
mustContain('displayPhaseOne.css', styles, 'body[data-visual-motion="reduced"]');
mustContain('displayPhaseOne.css', styles, '.nav-context-card');
mustContain('main.jsx', entrypoint, "import './displayPhaseOne.css';");

if (failures.length) {
  console.error('Display Phase 1 smoke check failed. Repair these global-shell anchors before shipping:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Display Phase 1 smoke check passed. Global navigation has four destinations, Progress remains contextual, and Help, Settings, and Agent profile controls are functional and accessible.');
