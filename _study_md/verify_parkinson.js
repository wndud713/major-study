// 검증 스크립트
const fs = require('fs');
const fp = '신경계질환별물리치료(이제혁)/파킨슨병.html';
const html = fs.readFileSync(fp, 'utf-8');

// 1) div balance — top-level body open vs close
const opens = (html.match(/<div\b/g) || []).length;
const closes = (html.match(/<\/div>/g) || []).length;
console.log(`<div> open: ${opens}, </div> close: ${closes}, diff: ${opens - closes}`);

// 2) Card keys vs allDetailData keys
const cardKeys = [...html.matchAll(/toggleCardExpand\(this,'ch1','([^']+)'\)/g)].map(m => m[1]);
const wrapKeys = [...html.matchAll(/<div class="card-expand-wrap" data-key="([^"]+)"/g)].map(m => m[1]);

// allDetailData['ch1'] = { ... } block
const blockMatch = /allDetailData\['ch1'\]\s*=\s*\{([\s\S]*?)\n\};/.exec(html);
if (!blockMatch) { console.error("allDetailData['ch1'] block NOT found"); process.exit(1); }
const block = blockMatch[1];
// Extract top-level keys (lines that start with whitespace + key + colon, before backtick)
// Keys can be: bareword OR 'quoted-with-dash'
const dataKeys = new Set();
const keyRe = /^\s*(?:'([^']+)'|([A-Za-z_][\w-]*)):\s*`/gm;
let m;
while ((m = keyRe.exec(block)) !== null) {
  dataKeys.add(m[1] || m[2]);
}

console.log(`Card onclick: ${cardKeys.length}`);
console.log(`Wrap data-key: ${wrapKeys.length}`);
console.log(`allDetailData keys: ${dataKeys.size}`);

// Card↔Wrap pairing
const wrapSet = new Set(wrapKeys);
const cardSet = new Set(cardKeys);
const cardOnly = cardKeys.filter(k => !wrapSet.has(k));
const wrapOnly = wrapKeys.filter(k => !cardSet.has(k));
console.log("\nCard without Wrap:", cardOnly);
console.log("Wrap without Card:", wrapOnly);

// Card key not in allDetailData
const orphans = cardKeys.filter(k => !dataKeys.has(k));
const unused = [...dataKeys].filter(k => !cardSet.has(k));
console.log("\nCards without detail content:", orphans);
console.log("Detail keys with no card (unused):", unused);

// 3) toggleCardExpand func presence
console.log("\ntoggleCardExpand function defined:", html.includes("function toggleCardExpand"));
console.log("moveToSidebar function defined:", html.includes("function moveToSidebar"));
console.log("card-expand-wrap CSS defined:", html.includes(".card-expand-wrap{display:none"));
console.log("HKA font-size 0.76rem present:", (html.match(/font-size:0\.76rem/g) || []).length, "times");
console.log("HKA padding 6px 14px present:", (html.match(/padding:6px 14px/g) || []).length, "times");
