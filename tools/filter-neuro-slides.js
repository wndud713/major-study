'use strict';
/**
 * tools/filter-neuro-slides.js
 *
 * 파킨슨병·외상성뇌손상_TBI 2 HTML 파일의 SLIDES_DATA[ch1] 에서
 * vision 판정 KEEP 페이지 index 만 남기고 재구성.
 *
 * 전제: HTML slide count 가 PDF page count 와 정확히 일치 (검증 완료)
 *       → slide index (1-based) == PDF page number
 *       → KEEP 리스트를 slide index 로 필터
 *
 * SOAP_note_TBI 는 전체가 평가 표이므로 필터링 대상에서 제외.
 *
 * base64 src 는 그대로 보존 (이미지 재추출 X).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// vision 판정 결과 기반 KEEP 리스트 (page number = slide index, 1-based)
const KEEP = {
  parkinson: [1,2,3,4,6,7,8,9,10,11,12,13,14,17,24,27,28,29,32,34,38,39,40,41,42,44,46,47,48,49,50,54,55,56,57,61,63],
  tbi: [1,2,4,5,6,7,10,11,12,13,14,15,17,18,23,24,25,27,28,29,30,31,34,37,38,40,41,42,44,45,47,48,49,50,51,52,55,56,57,58,59,60,61,62,63,64,65,66,67],
};

const targets = [
  { id: 'parkinson', html: '신경계질환별물리치료(이제혁)/파킨슨병.html' },
  { id: 'tbi',       html: '신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html' },
];

// brace-depth SLIDES_DATA 찾기
function findSlidesDataBlock(content) {
  const m = /(?:const\s+)?SLIDES_DATA\s*=\s*\{/.exec(content);
  if (!m) throw new Error('SLIDES_DATA not found');
  const braceStart = content.indexOf('{', m.index + m[0].length - 1);
  let depth = 0, inStr = false, strCh = '', endBrace = -1;
  for (let i = braceStart; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
    }
  }
  if (endBrace === -1) throw new Error('SLIDES_DATA close brace not found');
  let blockEnd = endBrace + 1;
  if (content[blockEnd] === ';') blockEnd++;
  return { start: m.index, braceStart, end: blockEnd, endBrace };
}

// ch1 키 바로 뒤 배열 [ ... ] 찾기 (brace-depth aware)
function findCh1ArrayRange(content, blockRange) {
  const sub = content.substring(blockRange.braceStart, blockRange.endBrace + 1);
  const keyMatch = sub.search(/['"]?ch1['"]?\s*:\s*\[/);
  if (keyMatch === -1) throw new Error("ch1 key not found in SLIDES_DATA");
  const arrStart = sub.indexOf('[', keyMatch) + blockRange.braceStart;
  let depth = 0, inStr = false, strCh = '', arrEnd = -1;
  for (let i = arrStart; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '[') depth++;
      else if (ch === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
    }
  }
  if (arrEnd === -1) throw new Error('ch1 array close bracket not found');
  return { start: arrStart, end: arrEnd }; // inclusive of [ and ]
}

// 배열 바디에서 top-level { ... } 오브젝트 단위로 split
function splitObjects(arrBody) {
  const objs = [];
  let i = 0, n = arrBody.length;
  while (i < n) {
    while (i < n && arrBody[i] !== '{') i++;
    if (i >= n) break;
    const oStart = i;
    let depth = 0, inStr = false, strCh = '';
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
    objs.push(arrBody.substring(oStart, i));
  }
  return objs;
}

function processFile(spec) {
  const htmlPath = path.join(ROOT, spec.html);
  const content = fs.readFileSync(htmlPath, 'utf8');

  // backup
  const bak = htmlPath + '.pre-textfilter';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content);

  const block = findSlidesDataBlock(content);
  const arrRange = findCh1ArrayRange(content, block);
  const arrBody = content.substring(arrRange.start + 1, arrRange.end); // [ ... ] 사이
  const objs = splitObjects(arrBody);

  const before = objs.length;
  const keepSet = new Set(KEEP[spec.id]);
  const kept = objs.filter((_, idx) => keepSet.has(idx + 1)); // 1-based

  // 새 배열 리터럴
  const newArr = '[' + kept.join(', ') + ']';

  const newContent =
    content.substring(0, arrRange.start) +
    newArr +
    content.substring(arrRange.end + 1);

  fs.writeFileSync(htmlPath, newContent);
  const sizeMB = (newContent.length / (1024 * 1024)).toFixed(2);
  console.log('[' + spec.id + '] ' + path.basename(spec.html));
  console.log('  before: ' + before + ' slides');
  console.log('  after:  ' + kept.length + ' slides');
  console.log('  dropped: ' + (before - kept.length));
  console.log('  size: ' + sizeMB + ' MB');
  return { id: spec.id, before, after: kept.length };
}

const report = [];
for (const t of targets) {
  try { report.push(processFile(t)); }
  catch (e) { console.error('[' + t.id + '] ERROR:', e.message); process.exitCode = 1; }
}
console.log('\n=== SUMMARY ===');
for (const r of report) {
  console.log('  ' + r.id + ': ' + r.before + ' -> ' + r.after + ' (-' + (r.before - r.after) + ')');
}
console.log('  soap: 28 -> 28 (skipped, all pages are assessment tables)');
