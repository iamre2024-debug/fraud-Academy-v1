import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const entrypoint = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
const failures = [];

if (entrypoint.includes("import './mobileNeonCardStack.css';")) {
  failures.push('The retired Neon Card Stack is still loaded and can repaint the old mobile layout.');
}
if (!entrypoint.includes("import './mobileBlueMissionDeck.css';")) {
  failures.push('The replacement Blue Mission Deck mobile information architecture is not loaded.');
}

if (failures.length) {
  console.error('Retired mobile theme isolation check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Retired mobile theme isolation check passed. The old Neon Card Stack is no longer loaded beneath Blue Mission Deck v2.');
