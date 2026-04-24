// Compare SLIDES_DATA block content between two files
const fs = require('fs');
const crypto = require('crypto');

function extractSlidesBlock(html) {
  const m = /SLIDES_DATA\s*=\s*\{/.exec(html);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  let depth = 0, inStr = false, strCh = '', end = -1;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  return html.substring(start, end + 1);
}

const pairs = [
  ['신경계질환별물리치료(이제혁)/파킨슨병.html.precardmerge', '신경계질환별물리치료(이제혁)/파킨슨병.html'],
  ['신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html.precardmerge', '신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html'],
  ['신경계질환별물리치료(이제혁)/SOAP_note_TBI.html.precardmerge', '신경계질환별물리치료(이제혁)/SOAP_note_TBI.html'],
];

pairs.forEach(([before, after]) => {
  const b = extractSlidesBlock(fs.readFileSync(before, 'utf8'));
  const a = extractSlidesBlock(fs.readFileSync(after, 'utf8'));
  const bHash = b ? crypto.createHash('md5').update(b).digest('hex') : 'null';
  const aHash = a ? crypto.createHash('md5').update(a).digest('hex') : 'null';
  const bSlides = b ? (b.match(/src\s*:/g) || []).length : 0;
  const aSlides = a ? (a.match(/src\s*:/g) || []).length : 0;
  console.log('FILE: ' + after);
  console.log('  before len=' + (b ? b.length : 0) + '  slides=' + bSlides + '  md5=' + bHash);
  console.log('  after  len=' + (a ? a.length : 0) + '  slides=' + aSlides + '  md5=' + aHash);
  console.log('  identical = ' + (bHash === aHash));
});
