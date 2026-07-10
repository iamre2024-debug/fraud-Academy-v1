import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function requireText(path, content, text) {
  if (!content.includes(text)) {
    console.error(`${path}: missing ${text}`);
    process.exitCode = 1;
  }
}

const overview = read('src/CoreOverviewPanels.jsx');
const records = read('src/data/coreToolRecords.js');
const panel = read('src/ActiveToolPanel.jsx');
const main = read('src/main.jsx');

for (const text of ['Case Briefing', 'Claimed Transactions', 'Case Intake Documents', 'Customer 360', 'Customer Timeline']) {
  requireText('src/CoreOverviewPanels.jsx', overview, text);
}

for (const text of ['Identity Intelligence', 'Login History', 'Device Intelligence', 'IP Intelligence', 'Session History', 'Financial Intelligence']) {
  requireText('src/data/coreToolRecords.js', records, text);
}

for (const text of ['buildCoreToolRecords', "item !== 'System Access Lane'", "openTool('Case Briefing')"]) {
  requireText('src/ActiveToolPanel.jsx', panel, text);
}

requireText('src/main.jsx', main, "./coreInvestigatorPanels.css");

for (const forbidden of ['Why am I here?', 'Who am I investigating?', 'Briefing questions', 'Suggested First Tool', 'Investigation Objective']) {
  if (overview.includes(forbidden) || panel.includes(forbidden)) {
    console.error(`Visible coaching copy remains: ${forbidden}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log('Core investigator wave smoke check passed.');
