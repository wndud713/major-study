// Focused diff: what changed between prestruct-v4 and current?
const fs = require('fs');
const BASE = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';
const FILES = [
  { name: '파킨슨병', curr: `${BASE}/파킨슨병.html`, prev: `${BASE}/파킨슨병.html.prestruct-v4` },
  { name: '외상성뇌손상_TBI', curr: `${BASE}/외상성뇌손상_TBI.html`, prev: `${BASE}/외상성뇌손상_TBI.html.prestruct-v4` },
  { name: 'SOAP_note_TBI', curr: `${BASE}/SOAP_note_TBI.html`, prev: `${BASE}/SOAP_note_TBI.html.prestruct-v4` },
];

function sig(html) {
  return {
    size: html.length,
    lines: html.split('\n').length,
    cardCount: (html.match(/class="card"\s+onclick="toggleCardExpand/g) || []).length,
    expandWrap: (html.match(/class="[^"]*card-expand-wrap/g) || []).length,
    cardExpand: (html.match(/class="[^"]*\bcard-expand\b/g) || []).length,
    accordionParent: (html.match(/accordion-parent/g) || []).length,
    accordionChildren: (html.match(/accordion-children/g) || []).length,
    toggleAccordion: (html.match(/toggleAccordion\(/g) || []).length,
    tableCount: (html.match(/<table\b/g) || []).length,
    tdCount: (html.match(/<td\b/g) || []).length,
    thCount: (html.match(/<th\b/g) || []).length,
    imgCount: (html.match(/<img\b/g) || []).length,
    sectionTitle: (html.match(/class="section-title"/g) || []).length,
    detailSection: (html.match(/class="detail-section"/g) || []).length,
    detailItem: (html.match(/class="detail-item/g) || []).length,
    cssRuleCount: (html.match(/[\{;]\s*[a-z-]+\s*:/g) || []).length,
  };
}

// Find line ranges where content differs
function lineDiff(a, b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  const maxL = Math.min(al.length, bl.length);
  let firstDiffA = -1;
  for (let i = 0; i < maxL; i++) {
    if (al[i] !== bl[i]) { firstDiffA = i; break; }
  }
  // Find from end
  let endDiffA = -1;
  const minLen = Math.min(al.length, bl.length);
  for (let i = 0; i < minLen; i++) {
    const ai = al.length - 1 - i;
    const bi = bl.length - 1 - i;
    if (al[ai] !== bl[bi]) { endDiffA = ai; break; }
  }
  return { firstDiffA, endDiffA, linesPrev: bl.length, linesCurr: al.length };
}

// Extract card titles map
function extractCardBlocks(html) {
  // card onclick=... and trailing subtitle until next </div> of card
  const result = new Map();
  const re = /class="card"\s+onclick="toggleCardExpand\(\s*this\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="card-expand-wrap)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const key = m[2];
    const body = m[3];
    // title between <div class="card-title">...</div>
    const t = /<div class="card-title"[^>]*>([\s\S]*?)<\/div>/.exec(body);
    const s = /<div class="card-sub"[^>]*>([\s\S]*?)<\/div>/.exec(body);
    result.set(key, { title: t ? t[1].replace(/\s+/g, ' ').trim() : null, sub: s ? s[1].replace(/\s+/g, ' ').trim() : null });
  }
  return result;
}

for (const f of FILES) {
  const curr = fs.readFileSync(f.curr, 'utf8');
  const prev = fs.readFileSync(f.prev, 'utf8');
  const sC = sig(curr);
  const sP = sig(prev);
  console.log(`\n=== ${f.name} ===`);
  console.log('SIG prev:', JSON.stringify(sP));
  console.log('SIG curr:', JSON.stringify(sC));
  const delta = {};
  for (const k of Object.keys(sC)) delta[k] = sC[k] - sP[k];
  console.log('DELTA   :', JSON.stringify(delta));

  const d = lineDiff(curr, prev);
  console.log('LINE DIFF:', JSON.stringify(d));

  // Title comparison
  const tC = extractCardBlocks(curr);
  const tP = extractCardBlocks(prev);
  const titleChanges = [];
  const subChanges = [];
  for (const [k, v] of tC) {
    const pv = tP.get(k);
    if (!pv) { titleChanges.push({ key: k, prev: null, curr: v.title, type: 'added' }); continue; }
    if (pv.title !== v.title) titleChanges.push({ key: k, prev: pv.title, curr: v.title });
    if (pv.sub !== v.sub) subChanges.push({ key: k, prev: pv.sub, curr: v.sub });
  }
  for (const [k, v] of tP) if (!tC.has(k)) titleChanges.push({ key: k, prev: v.title, curr: null, type: 'removed' });
  console.log('TITLE CHANGES:', titleChanges.length);
  for (const t of titleChanges.slice(0, 10)) console.log('  ', JSON.stringify(t));
  console.log('SUB CHANGES  :', subChanges.length);
  for (const t of subChanges.slice(0, 10)) console.log('  ', JSON.stringify(t));
}
