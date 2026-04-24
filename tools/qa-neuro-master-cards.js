// Locate master (summary table) cards per tab
const fs = require('fs');
const BASE = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';
const FILES = [
  { name: '파킨슨병', curr: `${BASE}/파킨슨병.html` },
  { name: '외상성뇌손상_TBI', curr: `${BASE}/외상성뇌손상_TBI.html` },
  { name: 'SOAP_note_TBI', curr: `${BASE}/SOAP_note_TBI.html` },
];

for (const f of FILES) {
  const html = fs.readFileSync(f.curr, 'utf8');
  // master cards (IIFE toggle pattern)
  const masterRe = /<div class="card" style="width:100%[^>]*>\s*([\s\S]*?)(?=<button class="expand-btn")/g;
  const masters = [];
  let m;
  while ((m = masterRe.exec(html)) !== null) {
    const titleMatch = /<div class="card-title">([\s\S]*?)<\/div>/.exec(m[1]);
    const subMatch = /<div class="card-sub">([\s\S]*?)<\/div>/.exec(m[1]);
    masters.push({
      pos: m.index,
      title: titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null,
      sub: subMatch ? subMatch[1].replace(/\s+/g, ' ').trim() : null,
    });
  }
  // Tab content positions
  const tcRe = /<div[^>]*id="(ch\d+)-tab-([^"]+)"[^>]*>/g;
  const tcPos = [];
  let t;
  while ((t = tcRe.exec(html)) !== null) tcPos.push({ ch: t[1], tab: t[2], start: t.index });

  console.log(`\n=== ${f.name} ===`);
  console.log(`Master summary-table cards: ${masters.length}`);
  for (const mc of masters) {
    let tab = null;
    for (const p of tcPos) if (p.start <= mc.pos && (!tab || p.start > tab.start)) tab = p;
    console.log(`  [tab=${tab ? tab.tab : 'ROOT'}] ${mc.title}  │  ${mc.sub}`);
  }

  // Also detect table ids within these master cards
  const tblIdRe = /<div id="([^"]+)" style="display:none[^>]*>\s*<div[^>]*>\s*<table/g;
  let tm;
  console.log('  Master table IDs:');
  while ((tm = tblIdRe.exec(html)) !== null) console.log('   ', tm[1]);
}
