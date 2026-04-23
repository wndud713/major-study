'use strict';
/**
 * tools/inspect-neuro-slides.js
 * 3 신경계질환 HTML 파일의 SLIDES_DATA 구조 덤프.
 * base64 src 는 길이만 표시, label 은 전체 표시.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const files = [
  '신경계질환별물리치료(이제혁)/파킨슨병.html',
  '신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html',
  '신경계질환별물리치료(이제혁)/SOAP_note_TBI.html',
];

function findSlidesDataBlock(content) {
  const m = /(?:const\s+)?SLIDES_DATA\s*=\s*\{/.exec(content);
  if (!m) return null;
  const braceStart = content.indexOf('{', m.index + m[0].length - 1);
  let depth = 0, inStr = false, strCh = '', end = -1;
  for (let i = braceStart; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  return { start: m.index, braceStart, end };
}

// Parse slides array for ch1 key manually (brace-depth, string-aware)
function parseSlides(content, block) {
  // ch1 key 찾기 이후 [ ... ]
  const sub = content.substring(block.braceStart, block.end + 1);
  const chKeyIdx = sub.search(/['"]?ch1['"]?\s*:\s*\[/);
  if (chKeyIdx === -1) return [];
  const arrStart = sub.indexOf('[', chKeyIdx);
  let depth = 0, inStr = false, strCh = '', arrEnd = -1;
  for (let i = arrStart; i < sub.length; i++) {
    const ch = sub[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '[') depth++;
      else if (ch === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
    }
  }
  if (arrEnd === -1) return [];
  const arrBody = sub.substring(arrStart + 1, arrEnd);

  // { src: '...', label: '...' } 단위로 split
  const slides = [];
  let i = 0, n = arrBody.length;
  while (i < n) {
    // find next { at depth 0
    while (i < n && arrBody[i] !== '{') i++;
    if (i >= n) break;
    const oStart = i;
    depth = 0; inStr = false; strCh = '';
    for (; i < n; i++) {
      const ch = arrBody[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === strCh) inStr = false;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
        else if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { i++; break; } }
      }
    }
    const objBody = arrBody.substring(oStart, i);
    // extract src and label
    const srcM = /src\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/s.exec(objBody);
    const labelM = /label\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/s.exec(objBody);
    slides.push({
      src: srcM ? srcM[2] : '',
      srcLen: srcM ? srcM[2].length : 0,
      label: labelM ? labelM[2] : '',
    });
  }
  return slides;
}

for (const f of files) {
  const full = path.join(ROOT, f);
  const c = fs.readFileSync(full, 'utf8');
  const block = findSlidesDataBlock(c);
  if (!block) { console.log(f, '-- NO SLIDES_DATA'); continue; }
  const slides = parseSlides(c, block);
  console.log('='.repeat(72));
  console.log(f);
  console.log('  total slides:', slides.length);
  console.log('  labels:');
  slides.forEach((s, idx) => {
    console.log('    [' + (idx+1) + ']', s.label, '(src ' + s.srcLen + ' chars)');
  });
  console.log();
}
