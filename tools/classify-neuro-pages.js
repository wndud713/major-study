'use strict';
/**
 * tools/classify-neuro-pages.js
 * 3 신경계질환 PDF 의 페이지별 KEEP/DROP/BORDER 분류.
 *
 * 분류 기준:
 *  - 표지 (p1) → KEEP
 *  - pdfimages 결과에 width>=150 AND height>=150 이미지 존재 → KEEP
 *  - 텍스트 없음 또는 매우 짧음 (<30 chars) → KEEP (blank/title/image-only slide 로 추정)
 *  - 위 조건 모두 해당 안 됨 + 이미지 0 또는 소형만 → BORDER (vision 재검증 대상)
 *    BORDER 중 텍스트에 도식 키워드 (→ ⇒ ↑ ↓ ← 화살표 박스 등) 있으면 KEEP 쪽으로 기움
 *
 * 출력: JSON {file:{page: {status, imgs, largeImgs, textLen, textHead}}}
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const POPPLER = path.join(
  process.env.LOCALAPPDATA || '',
  'Microsoft', 'WinGet', 'Packages',
  'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'poppler-25.07.0', 'Library', 'bin'
);
const PDFIMAGES = path.join(POPPLER, 'pdfimages.exe');
const PDFTOTEXT = path.join(POPPLER, 'pdftotext.exe');

const targets = [
  { id: 'parkinson', pdf: '신경계질환별물리치료(이제혁)/7. 2026 질환별물리치료학(파킨슨병).pdf', pages: 65 },
  { id: 'tbi', pdf: '신경계질환별물리치료(이제혁)/5. 2026 질환별물리치료학(외상성 뇌손상).pdf', pages: 68 },
  { id: 'soap', pdf: '신경계질환별물리치료(이제혁)/SOAP note(TBI).pdf', pages: 28 },
];

// pdfimages -list 결과 파싱 (width, height 컬럼)
function getImagesList(pdfPath) {
  // winget 실행 — 한글 경로 허용
  let stdout = '';
  try {
    const r = spawnSync(PDFIMAGES, ['-list', pdfPath], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    stdout = r.stdout || '';
  } catch (e) { return {}; }
  // 컬럼: page num type width height color comp bpc enc ...
  const lines = stdout.split(/\r?\n/);
  const byPage = {}; // page -> [{w,h}]
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;
    if (isNaN(parseInt(parts[0], 10))) continue;
    const page = parseInt(parts[0], 10);
    const w = parseInt(parts[3], 10);
    const h = parseInt(parts[4], 10);
    if (isNaN(w) || isNaN(h)) continue;
    if (!byPage[page]) byPage[page] = [];
    byPage[page].push({ w, h });
  }
  return byPage;
}

// 페이지 텍스트 추출
function getPageText(pdfPath, p) {
  try {
    const r = spawnSync(PDFTOTEXT, ['-f', String(p), '-l', String(p), '-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    return r.stdout || '';
  } catch (e) { return ''; }
}

// 도식 키워드 (텍스트 전용이라도 구조 설명 함유 → KEEP 경향)
const DIAGRAM_HINTS = /[→⇒↑↓←⟶⟹⟵∴∵][-·]|━|─|┌|└|┐|┘|├|┤|┬|┴|┼|\$\{.*\}|\|.+\|/;

function classify(spec) {
  const abs = path.join(ROOT, spec.pdf);
  console.log('\n============================');
  console.log('[' + spec.id + '] ' + spec.pdf);
  const imgs = getImagesList(abs);
  const result = {};
  for (let p = 1; p <= spec.pages; p++) {
    const pImgs = imgs[p] || [];
    const largeImgs = pImgs.filter(i => i.w >= 150 && i.h >= 150).length;
    const allImgs = pImgs.length;
    const txt = getPageText(abs, p).replace(/\s+/g, ' ').trim();
    const textLen = txt.length;
    const textHead = txt.substring(0, 120);

    let status = '';
    let reason = '';
    if (p === 1) { status = 'KEEP'; reason = 'cover'; }
    else if (largeImgs > 0) { status = 'KEEP'; reason = 'large-img(' + largeImgs + ')'; }
    else if (textLen < 30) { status = 'KEEP'; reason = 'sparse-text(' + textLen + ')'; }
    else if (DIAGRAM_HINTS.test(txt)) { status = 'BORDER'; reason = 'diagram-hints'; }
    else if (allImgs > 0) { status = 'BORDER'; reason = 'small-img(' + allImgs + ')'; }
    else { status = 'DROP'; reason = 'text-only'; }

    result[p] = { status, reason, imgs: allImgs, largeImgs, textLen, textHead };
  }
  return result;
}

const out = {};
for (const t of targets) {
  out[t.id] = classify(t);
}

const outPath = path.join(__dirname, 'neuro-pages-classification.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

// 요약 출력
for (const id of Object.keys(out)) {
  const rows = out[id];
  const keep = [], border = [], drop = [];
  for (const p of Object.keys(rows)) {
    const r = rows[p];
    if (r.status === 'KEEP') keep.push(p);
    else if (r.status === 'BORDER') border.push(p);
    else drop.push(p);
  }
  console.log('\n[' + id + '] KEEP=' + keep.length + ' BORDER=' + border.length + ' DROP=' + drop.length);
  console.log('  KEEP pages:', keep.join(','));
  console.log('  BORDER pages:', border.join(','));
  console.log('  DROP pages:', drop.join(','));
  console.log('  --- BORDER details ---');
  for (const p of border) {
    const r = rows[p];
    console.log('  p' + p + ' [' + r.reason + '] imgs=' + r.imgs + ' txtLen=' + r.textLen + ' head: ' + r.textHead);
  }
  console.log('  --- DROP head (first 10) ---');
  for (const p of drop.slice(0, 10)) {
    const r = rows[p];
    console.log('  p' + p + ' txtLen=' + r.textLen + ' head: ' + r.textHead);
  }
}
console.log('\n[output] ' + outPath);
