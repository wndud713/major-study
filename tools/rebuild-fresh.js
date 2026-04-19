'use strict';
/**
 * tools/rebuild-fresh.js
 * 8개 HTML 재구축:
 *   1. .v1-archive/<name>.html.preexam 을 소스로 (T3 콘텐츠 + 기본 다탭 구조 보존)
 *   2. 기존 SLIDES_DATA 블록 제거 후 새 pdfimages 결과로 교체
 *   3. htmlstudy 폴더에 결과 저장
 *
 * 사용:  node tools/rebuild-fresh.js [id]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(process.env.TEMP || 'C:\\Temp', 'pdf-crops');
const POPPLER = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages',
  'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe', 'poppler-25.07.0', 'Library', 'bin');
const PDFIMAGES = path.join(POPPLER, 'pdfimages.exe');

const specs = [
  { id:'rom',      pdf:'임상의사결정/R.O.M.pptx - Google Slides.pdf',
    src:'임상의사결정/htmlstudy/.v1-archive/관절가동범위측정.html.preexam',
    out:'임상의사결정/htmlstudy/관절가동범위측정.html' },
  { id:'finger',   pdf:'임상의사결정/7. 손가락 근력검사.pptx - Google Slides.pdf',
    src:'임상의사결정/htmlstudy/.v1-archive/손가락근력검사.html.preexam',
    out:'임상의사결정/htmlstudy/손가락근력검사.html' },
  { id:'hip',      pdf:'임상의사결정/8. 엉덩 관절 근력검사.pptx - Google Slides.pdf',
    src:'임상의사결정/htmlstudy/.v1-archive/엉덩관절근력검사.html.preexam',
    out:'임상의사결정/htmlstudy/엉덩관절근력검사.html' },
  { id:'amp',      pdf:'임상의사결정/제 1장 절단 (2).pptx - Google Slides.pdf',
    src:'임상의사결정/htmlstudy/.v1-archive/절단.html.preexam',
    out:'임상의사결정/htmlstudy/절단.html' },
  { id:'cts',      pdf:'임상의사결정/제 2장 carpal tunnel syndrome (3).pptx - Google Slides.pdf',
    src:'임상의사결정/htmlstudy/.v1-archive/손목굴증후군.html.preexam',
    out:'임상의사결정/htmlstudy/손목굴증후군.html' },
  { id:'cdmintro', pdf:'임상의사결정/임상의사 결정 개론 (1).pptx - Google Slides.pdf',
    src:'임상의사결정/htmlstudy/.v1-archive/임상의사결정개론.html.preexam',
    out:'임상의사결정/htmlstudy/임상의사결정개론.html' },
  { id:'adl1',     pdf:'ADL/2026_기능훈련_1 (1).pdf',
    src:'ADL/htmlstudy/.v1-archive/기능훈련1_ADL개론.html.preexam',
    out:'ADL/htmlstudy/기능훈련1_ADL개론.html' },
  { id:'adl2',     pdf:'ADL/2026_기능훈련_2.pdf',
    src:'ADL/htmlstudy/.v1-archive/기능훈련2_화상환자ADL.html.preexam',
    out:'ADL/htmlstudy/기능훈련2_화상환자ADL.html' },
];

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
  if (endBrace === -1) throw new Error('SLIDES close brace missing');
  let blockEnd = endBrace + 1;
  if (content[blockEnd] === ';') blockEnd++;
  return { start: m.index, end: blockEnd };
}

function extractImages(spec) {
  const outDir = path.join(TMP, spec.id);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const existing = fs.readdirSync(outDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  if (existing.length === 0) {
    console.log(`  [pdfimages] 추출...`);
    execFileSync(PDFIMAGES, ['-j', '-png', '-p', path.join(ROOT, spec.pdf), path.join(outDir, 'img')], { stdio: 'pipe' });
  } else {
    console.log(`  [cache] ${existing.length}개 사용`);
  }
  const files = fs.readdirSync(outDir).filter(f => /^img-\d+-\d+\.(png|jpg)$/i.test(f));
  const pageMap = {};
  for (const f of files) {
    const m = /^img-(\d+)-(\d+)\.(png|jpg)$/i.exec(f);
    const page = parseInt(m[1], 10);
    if (!pageMap[page]) pageMap[page] = [];
    pageMap[page].push({ path: path.join(outDir, f), ext: m[3].toLowerCase() });
  }
  return pageMap;
}

function getImageSize(filePath, ext) {
  const buf = fs.readFileSync(filePath);
  if (ext === 'png') {
    if (buf.slice(0,8).toString('hex') !== '89504e470d0a1a0a') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xFF) return null;
      const marker = buf[i+1];
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8) {
        return { w: buf.readUInt16BE(i+7), h: buf.readUInt16BE(i+5) };
      }
      i += 2 + buf.readUInt16BE(i+2);
    }
    return null;
  }
  return null;
}

function buildSlides(pageMap) {
  const pages = Object.keys(pageMap).map(Number).sort((a,b)=>a-b);
  const slides = [];
  for (const p of pages) {
    for (const item of pageMap[p]) {
      const sz = getImageSize(item.path, item.ext);
      if (!sz || sz.w < 150 || sz.h < 150) continue;
      const buf = fs.readFileSync(item.path);
      const b64 = buf.toString('base64');
      const mime = item.ext === 'jpg' ? 'image/jpeg' : 'image/png';
      const labelN = String(slides.length + 1).padStart(3, '0');
      slides.push(`    { src: 'data:${mime};base64,${b64}', label: 'p${p} · Slide ${labelN}' }`);
    }
  }
  return slides;
}

function processSpec(spec) {
  console.log(`\n[${spec.id}] ${path.basename(spec.out)}`);
  const srcPath = path.join(ROOT, spec.src);
  const outPath = path.join(ROOT, spec.out);
  if (!fs.existsSync(srcPath)) { console.error(`  소스 없음: ${srcPath}`); return; }

  let content = fs.readFileSync(srcPath, 'utf8');
  const block = findSlidesDataBlock(content);

  const pageMap = extractImages(spec);
  const slides = buildSlides(pageMap);
  const arr = slides.length ? '[\n' + slides.join(',\n') + '\n  ]' : '[]';
  const newBlock = `const SLIDES_DATA = {\n  ch1: ${arr},\n};`;
  content = content.substring(0, block.start) + newBlock + content.substring(block.end);

  fs.writeFileSync(outPath, content);
  const sz = (content.length / (1024 * 1024)).toFixed(2);
  console.log(`  완료: ${slides.length}장, ${sz}MB`);
}

function main() {
  const target = process.argv[2];
  const list = target ? specs.filter(s => s.id === target) : specs;
  for (const s of list) {
    try { processSpec(s); }
    catch (e) { console.error(`  [ERR] ${s.id}: ${e.message}`); }
  }
  console.log('\n완료');
}

if (require.main === module) main();
