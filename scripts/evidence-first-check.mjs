import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'src');

const bannedPreSubmissionPatterns = [
  { label: 'fraud score', pattern: /fraud\s+score/i },
  { label: 'red flag wording', pattern: /red\s+flags?/i },
  { label: 'green flag wording', pattern: /green\s+flags?/i },
  { label: 'correct answer wording', pattern: /correct\s+answer/i },
  { label: 'fraud-or-non-fraud reveal wording', pattern: /fraud\s*\/\s*non[-\s]?fraud/i },
  { label: 'AI recommendation wording', pattern: /ai\s+recommendations?/i },
  { label: 'final answer wording', pattern: /final\s+answer/i },
  { label: 'decision hint wording', pattern: /decision\s+hints?/i },
];

function walkDirectory(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkDirectory(fullPath);
    if (!/\.(js|jsx|ts|tsx|css)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

const violations = [];

for (const file of walkDirectory(sourceDir)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of bannedPreSubmissionPatterns) {
    if (rule.pattern.test(text)) {
      violations.push(`${path.relative(rootDir, file)} contains ${rule.label}`);
    }
  }
}

if (violations.length) {
  console.error('Evidence First check failed. Remove pre-submission answer-leaking wording:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Evidence First wording check passed.');
