'use strict';
/**
 * tools/inject-slides.js
 * PDF → 150dpi PNG → base64 → SLIDES_DATA 주입
 *
 * 사용:
 *   node tools/inject-slides.js                 # 전체 매핑 처리
 *   node tools/inject-slides.js <key>           # 단일 매핑 처리
 *
 * 매핑은 mappings 배열에 정의.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(ROOT, 'tmp', 'slides');
const POPPLER = path.join(
  process.env.LOCALAPPDATA || '',
  'Microsoft', 'WinGet', 'Packages',
  'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'poppler-25.07.0', 'Library', 'bin'
);
const PDFTOPPM = path.join(POPPLER, 'pdftoppm.exe');

const mappings = [
  { id: 'rom',       pdf: '임상의사결정/R.O.M.pptx - Google Slides.pdf',                          html: '임상의사결정/htmlstudy/관절가동범위측정.html' },
  { id: 'finger',    pdf: '임상의사결정/7. 손가락 근력검사.pptx - Google Slides.pdf',              html: '임상의사결정/htmlstudy/손가락근력검사.html' },
  { id: 'hip',       pdf: '임상의사결정/8. 엉덩 관절 근력검사.pptx - Google Slides.pdf',           html: '임상의사결정/htmlstudy/엉덩관절근력검사.html' },
  { id: 'amp',       pdf: '임상의사결정/제 1장 절단 (2).pptx - Google Slides.pdf',                 html: '임상의사결정/htmlstudy/절단.html' },
  { id: 'cts',       pdf: '임상의사결정/제 2장 carpal tunnel syndrome (3).pptx - Google Slides.pdf', html: '임상의사결정/htmlstudy/손목굴증후군.html' },
  { id: 'cdmintro',  pdf: '임상의사결정/임상의사 결정 개론 (1).pptx - Google Slides.pdf',          html: '임상의사결정/htmlstudy/임상의사결정개론.html' },
  { id: 'adl1',      pdf: 'ADL/2026_기능훈련_1 (1).pdf',                                          html: 'ADL/htmlstudy/기능훈련1_ADL개론.html' },
  { id: 'adl2',      pdf: 'ADL/2026_기능훈련_2.pdf',                                              html: 'ADL/htmlstudy/기능훈련2_화상환자ADL.html' },
];

// ─── brace-depth parser ───────────────────────────────────────────────────
function findSlidesDataBlock(content) {
  const m = /(const\s+SLIDES_DATA\s*=\s*\{)/.exec(content);
  if (!m) throw new Error('SLIDES_DATA not found');
  const braceStart = m.index + m[0].lastIndexOf('{');
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
  if (endBrace === -1) throw new Error('SLIDES_DATA closing brace not found');
  let blockEnd = endBrace + 1;
  if (content[blockEnd] === ';') blockEnd++;
  return { start: m.index, end: blockEnd };
}

// ─── PDF → PNG ────────────────────────────────────────────────────────────
function extractPngs(pdfPath, outDir, dpi = 150) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // 이미 추출되어 있으면 스킵
  const existing = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
  if (existing.length > 0) {
    console.log(`    [cache] PNG ${existing.length}장 사용`);
    return existing.sort().map(f => path.join(outDir, f));
  }
  const prefix = path.join(outDir, 'p');
  const args = ['-png', '-r', String(dpi), pdfPath, prefix];
  console.log(`    pdftoppm -r ${dpi} ...`);
  const result = spawnSync(PDFTOPPM, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error('    stderr:', result.stderr);
    throw new Error(`pdftoppm 실패: ${pdfPath}`);
  }
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.png')).sort();
  console.log(`    → ${files.length}장 생성`);
  return files.map(f => path.join(outDir, f));
}

// ─── PNG → base64 SLIDES 배열 ────────────────────────────────────────────
function buildSlidesArray(pngPaths) {
  const items = pngPaths.map((p, i) => {
    const buf = fs.readFileSync(p);
    const b64 = buf.toString('base64');
    const num = String(i + 1).padStart(3, '0');
    return `    { src: 'data:image/png;base64,${b64}', label: 'Slide ${num}' }`;
  });
  return '[\n' + items.join(',\n') + '\n  ]';
}

// ─── HTML 주입 ────────────────────────────────────────────────────────────
function injectSlides(htmlPath, slidesArrayStr) {
  const content = fs.readFileSync(htmlPath, 'utf8');
  const block = findSlidesDataBlock(content);
  const newBlock = `const SLIDES_DATA = {\n  ch1: ${slidesArrayStr},\n};`;
  const before = content.substring(0, block.start);
  const after = content.substring(block.end);
  // 백업
  const bak = htmlPath + '.bak';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content);
  fs.writeFileSync(htmlPath, before + newBlock + after);
  const newSize = (before.length + newBlock.length + after.length) / (1024 * 1024);
  console.log(`    [write] ${path.basename(htmlPath)} (${newSize.toFixed(1)}MB)`);
}

// ─── 메인 ────────────────────────────────────────────────────────────────
function main() {
  const target = process.argv[2];
  const list = target ? mappings.filter(m => m.id === target) : mappings;
  if (list.length === 0) {
    console.error('매핑 없음:', target);
    process.exit(1);
  }
  for (const m of list) {
    const pdfFull = path.join(ROOT, m.pdf);
    const htmlFull = path.join(ROOT, m.html);
    const outDir = path.join(TMP, m.id);
    console.log(`\n[${m.id}] ${path.basename(m.pdf)}`);
    if (!fs.existsSync(pdfFull)) { console.error('  PDF 없음:', pdfFull); continue; }
    if (!fs.existsSync(htmlFull)) { console.error('  HTML 없음:', htmlFull); continue; }
    const pngs = extractPngs(pdfFull, outDir, 150);
    const arr = buildSlidesArray(pngs);
    injectSlides(htmlFull, arr);
  }
  console.log('\n완료');
}

if (require.main === module) main();

module.exports = { findSlidesDataBlock, buildSlidesArray, injectSlides };
