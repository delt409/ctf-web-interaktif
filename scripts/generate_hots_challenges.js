const fs = require('fs');
const path = require('path');

// Directory containing individual challenge files
const CHALLENGES_DIR = path.join(__dirname, '..', 'challenges');

// Collect all .js files (ignore hidden files)
const challengeFiles = fs.readdirSync(CHALLENGES_DIR)
  .filter(fn => fn.endsWith('.js') && !fn.startsWith('.'));

let merged = [];

for (const file of challengeFiles) {
  const fullPath = path.join(CHALLENGES_DIR, file);
  try {
    const mod = require(fullPath);
    const arr = Array.isArray(mod) ? mod : (mod.challenges || mod.default);
    if (Array.isArray(arr)) merged.push(...arr);
    else console.warn(`⚠️ ${file} does not export an array`);
  } catch (e) {
    console.error(`❌ Failed to load ${file}: ${e.message}`);
  }
}

// De‑duplicate by id (keep first occurrence)
const uniq = [];
const seen = new Set();
for (const c of merged) {
  if (!c.id) continue;
  if (!seen.has(c.id)) { uniq.push(c); seen.add(c.id); }
}

// Write combined file as CommonJS export
const outPath = path.join(__dirname, '..', 'challenges', 'baseChallenges.js');
fs.writeFileSync(outPath, `module.exports = ${JSON.stringify(uniq, null, 2)};`);
console.log(`✅ Wrote ${uniq.length} challenges to ${outPath}`);
