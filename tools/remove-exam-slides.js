'use strict';
/**
 * tools/remove-exam-slides.js
 * 국시문제로 감지된 페이지의 슬라이드 이미지를 SLIDES_DATA 에서 제거.
 * 국시문제 탭 카드는 그대로 유지.
 *
 * 사용: node tools/remove-exam-slides.js <id>
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(process.env.TEMP || 'C:\\Temp', 'exam-candidates');

const specs = {
  rom:      { file: '임상의사결정/htmlstudy/관절가동범위측정.html' },
  finger:   { file: '임상의사결정/htmlstudy/손가락근력검사.html' },
  hip:      { file: '임상의사결정/htmlstudy/엉덩관절근력검사.html' },
  amp:      { file: '임상의사결정/htmlstudy/절단.html' },
  cts:      { file: '임상의사결정/htmlstudy/손목굴증후군.html' },
  cdmintro: { file: '임상의사결정/htmlstudy/임상의사결정개론.html' },
};

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
  let blockEnd = endBrace + 1;
  if (content[blockEnd] === ';') blockEnd++;
  return { start: m.index, end: blockEnd };
}

function processSpec(id) {
  const spec = specs[id];
  if (!spec) { console.error('unknown id:', id); return; }
  const htmlPath = path.join(ROOT, spec.file);
  const candPath = path.join(TMP, id, 'candidates.json');
  if (!fs.existsSync(candPath)) { console.error('no candidates:', candPath); return; }

  const candidates = JSON.parse(fs.readFileSync(candPath, 'utf8'));
  const examPages = new Set(candidates.map(c => c.page));
  console.log(`\n[${id}] 국시 페이지 ${examPages.size}개: ${[...examPages].sort((a,b)=>a-b).join(',')}`);

  let content = fs.readFileSync(htmlPath, 'utf8');
  const bak = htmlPath + '.preremove';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content);

  const block = findSlidesDataBlock(content);
  const body = content.substring(block.start, block.end);

  // 각 슬라이드 entry: `    { src: '...', label: 'pN · Slide NNN' }`
  // label의 p번호 추출해 필터링
  // entry 경계: "{ src: ... }"
  const entryRe = /\{\s*src:\s*'[^']*',\s*label:\s*'p(\d+)\s*·\s*Slide\s*\d+'\s*\}/g;
  let removed = 0, kept = 0;
  let i = 0;
  const entries = [];
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    const page = parseInt(m[1], 10);
    if (examPages.has(page)) {
      removed++;
    } else {
      entries.push(m[0]);
      kept++;
    }
  }
  // 다시 라벨 재번호
  const renumbered = entries.map((e, idx) => {
    const labelN = String(idx + 1).padStart(3, '0');
    return e.replace(/'p(\d+)\s*·\s*Slide\s*\d+'/, (_, p) => `'p${p} · Slide ${labelN}'`);
  });
  const newBody = `const SLIDES_DATA = {\n  ch1: [\n` + renumbered.map(e => '    ' + e).join(',\n') + `\n  ],\n};`;
  content = content.substring(0, block.start) + newBody + content.substring(block.end);
  fs.writeFileSync(htmlPath, content);

  const sz = (content.length / (1024 * 1024)).toFixed(2);
  console.log(`  제거 ${removed}개 / 유지 ${kept}개 → ${sz}MB`);
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('사용: node tools/remove-exam-slides.js <id>');
    console.error('id:', Object.keys(specs).join(', '));
    process.exit(1);
  }
  processSpec(target);
}

if (require.main === module) main();
