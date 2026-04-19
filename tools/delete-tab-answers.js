'use strict';
/**
 * tools/delete-tab-answers.js
 * 국시문제 탭 카드에서 답 마크업 완전 제거.
 * exam_answers 디테일 키는 손대지 않음.
 *
 * 패턴:
 *  Pattern A (ADL): <br>\s*<span style="color:var(--text-dim)">...</span>\s*<span style="color:var(--text-dim)">...</span>
 *      → 완전 삭제 (trailing 정답+해설)
 *  Pattern C (cdmintro): <span style="color:var(--text-dim)">CHOICE</span>
 *      → unwrap (텍스트만 유지)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const targets = [
  { file: 'ADL/htmlstudy/기능훈련1_ADL개론.html',           tabId: 'ch1-tab-tab4', pattern: 'A' },
  { file: 'ADL/htmlstudy/기능훈련2_화상환자ADL.html',       tabId: 'ch1-tab-tab5', pattern: 'A' },
  { file: '임상의사결정/htmlstudy/임상의사결정개론.html',   tabId: 'ch1-tab-tab6', pattern: 'C' },
];

function findTabBodyRange(content, tabId) {
  const tabRe = new RegExp(`<div class="tab-content[^"]*"\\s+id="${tabId}"[^>]*>`);
  const m = tabRe.exec(content);
  if (!m) throw new Error(`tab ${tabId} not found`);
  const start = m.index + m[0].length;
  let depth = 1, i = start, end = -1;
  while (i < content.length && depth > 0) {
    const o = content.substring(i, i + 5);
    const c = content.substring(i, i + 6);
    if (o === '<div ' || o === '<div>') { depth++; i += 4; }
    else if (c === '</div>') { depth--; i += 6; if (depth === 0) end = i - 6; }
    else i++;
  }
  if (end === -1) throw new Error('tab end not found');
  return { start, end };
}

function applyPatternA(tabBody) {
  // <br>\s*<span style="color:var(--text-dim)">번호</span>\s*<span style="color:var(--text-dim)">해설</span>
  // 또는 단일 span만 있을 수도
  let result = tabBody;
  // trailing answer: 앞에 <br> 있고 뒤로 dim span들 나오는 구간 제거
  // 2개 span + 앞 <br>
  result = result.replace(
    /<br>\s*<span style="color:var\(--text-dim\)"[^>]*>[^<]*<\/span>\s*<span style="color:var\(--text-dim\)"[^>]*>[^<]*<\/span>/g,
    ''
  );
  // 1개 span + 앞 <br> (fallback)
  result = result.replace(
    /<br>\s*<span style="color:var\(--text-dim\)"[^>]*>[^<]*<\/span>/g,
    ''
  );
  return result;
}

function applyPatternC(tabBody) {
  // <span style="color:var(--text-dim)">텍스트</span> → 텍스트 (unwrap)
  return tabBody.replace(
    /<span style="color:var\(--text-dim\)"[^>]*>([^<]*)<\/span>/g,
    '$1'
  );
}

function countDimSpans(s) {
  const m = s.match(/color:var\(--text-dim\)/g);
  return m ? m.length : 0;
}

function processFile(spec) {
  const filePath = path.join(ROOT, spec.file);
  if (!fs.existsSync(filePath)) { console.error('파일 없음:', filePath); return; }
  console.log(`\n[${path.basename(filePath)}] pattern=${spec.pattern} tab=${spec.tabId}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const bak = filePath + '.predelete2';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content);

  const range = findTabBodyRange(content, spec.tabId);
  const tabBody = content.substring(range.start, range.end);
  const before = countDimSpans(tabBody);

  let newBody;
  if (spec.pattern === 'A') newBody = applyPatternA(tabBody);
  else newBody = applyPatternC(tabBody);

  const after = countDimSpans(newBody);
  content = content.substring(0, range.start) + newBody + content.substring(range.end);
  fs.writeFileSync(filePath, content);

  console.log(`  dim span ${before} → ${after} (제거 ${before - after})`);
}

function main() {
  for (const t of targets) {
    try { processFile(t); }
    catch (e) { console.error(`  [ERROR] ${t.file}: ${e.message}`); }
  }
  console.log('\n완료');
}

if (require.main === module) main();
