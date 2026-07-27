const forbiddenPreSubmissionKeys = new Set([
  'hiddenFinding',
]);

export function hiddenFindingLeakPaths(value, root = 'payload') {
  const paths = [];
  const visited = new WeakSet();

  function walk(item, path) {
    if (!item || typeof item !== 'object') return;
    if (visited.has(item)) return;
    visited.add(item);
    for (const [key, child] of Object.entries(item)) {
      const childPath = `${path}.${key}`;
      if (forbiddenPreSubmissionKeys.has(key)) paths.push(childPath);
      walk(child, childPath);
    }
  }

  walk(value, root);
  return paths;
}

export function assertNoHiddenFindingLeak(value, surface = 'pre-submission surface') {
  const paths = hiddenFindingLeakPaths(value, surface);
  if (paths.length) {
    throw new Error(`Hidden finding field reached ${surface}: ${paths.join(', ')}`);
  }
  return value;
}
