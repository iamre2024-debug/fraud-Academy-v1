import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const entrypoint = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
const failures = [];

if (entrypoint.includes("import './mobileNeonCardStack.css';")) {
  failures.push('The retired Neon Card Stack is still loaded and can repaint the old mobile layout.');
}
if (!entrypoint.includes("import './mobileMissionDeckV3.css';")) {
  failures.push('The dedicated Blue Mission Deck v3 component styles are not loaded.');
}
if (entrypoint.includes("import './mobileBlueMissionDeck.css';")) {
  failures.push('The legacy Blue Mission Deck override layer is still loaded.');
}

if (failures.length) {
  console.error('Retired mobile theme isolation check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Retired mobile theme isolation check passed. Neither the Neon Card Stack nor the legacy Blue override layer is loaded beneath Mission Deck v3.');
