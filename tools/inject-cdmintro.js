'use strict';
/**
 * tools/inject-cdmintro.js
 * Inject 13 new cdmintro questions from tmp/exam-extracted-cdmintro.json
 * into 임상의사결정/htmlstudy/임상의사결정개론.html
 *
 * Usage: node tools/inject-cdmintro.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp/exam-extracted-cdmintro.json'), 'utf8'));

function findAllDetailDataEnd(content) {
  const m = /allDetailData\s*\[\s*['"]ch1['"]\s*\]\s*=\s*\{/.exec(content);
  if (!m) throw new Error("allDetailData['ch1'] not found");
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
  if (endBrace === -1) throw new Error('closing brace not found');
  return endBrace;
}

function findExamTabBody(content) {
  const tabIds = ['ch1-tab-exam', 'ch1-tab-tab4', 'ch1-tab-tab5', 'ch1-tab-tab6'];
  for (const tid of tabIds) {
    const re = new RegExp(`<div class="tab-content[^"]*"\\s+id="${tid}"[^>]*>`);
    const m = re.exec(content);
    if (!m) continue;
    const start = m.index + m[0].length;
    let depth = 1, i = start, end = -1;
    while (i < content.length && depth > 0) {
      const o = content.substring(i, i + 5);
      const c = content.substring(i, i + 6);
      if (o === '<div ' || o === '<div>') { depth++; i += 4; }
      else if (c === '</div>') { depth--; i += 6; if (depth === 0) end = i - 6; }
      else i++;
    }
    if (end !== -1) return { tabId: tid, start, end };
  }
  throw new Error('exam tab not found');
}

function escapeBacktick(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function buildCard(q) {
  const subText = q.question.length > 60 ? q.question.substring(0, 60) + '...' : q.question;
  return `
          <hr class="q-divider">
          <div class="card" onclick="openDetail('ch1','${q.key}')">
            <div class="card-body">
              <div class="card-title">${q.year} 국가고시 ${q.num}번 — ${q.title}</div>
              <div class="card-sub">${subText}</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`;
}

function buildDetail(q) {
  const choiceLines = Object.entries(q.choices)
    .map(([k, v]) => {
      const isAnswer = k === q.answer;
      const cls = isAnswer ? 'green' : 'red';
      const mark = isAnswer ? ' <b>→ 정답 ✓</b>' : '';
      return `  <div class="detail-item ${cls}">${k} ${v}${mark}</div>`;
    })
    .join('\n');
  return `<h2>${q.year} 국가고시 ${q.num}번</h2>
<div class="detail-section">
  <div class="detail-item accent"><b>문제:</b> ${q.question}</div>
</div>
<div class="detail-section">
  <h3>선택지 분석</h3>
${choiceLines}
</div>
<div class="tip-box">💡 <b>해설:</b> ${q.explain}</div>`;
}

function buildAnswersEntry(q) {
  const qShort = q.question.length > 100 ? q.question.substring(0, 100) + '...' : q.question;
  return `

<div class="detail-section">
  <h3>${q.year} ${q.num}번 — ${q.title}</h3>
  <div class="detail-item accent"><b>Q.</b> ${qShort}</div>
  <div class="detail-item green"><b>정답 ${q.answer}</b> ${q.choices[q.answer]}</div>
  <div class="tip-box">💡 ${q.explain}</div>
</div>`;
}

function buildNumsEntry(q) {
  return `
  <div class="detail-item green"><b>${q.year} ${q.num}번</b> — ${q.answer} ${q.choices[q.answer]}</div>`;
}

function processFile(spec) {
  const filePath = path.join(ROOT, spec.file);
  if (!fs.existsSync(filePath)) { console.error('  파일 없음:', filePath); return; }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1) 국시문제 탭 본문에 카드 추가
  const tab = findExamTabBody(content);
  const newCards = spec.new_questions.map(buildCard).join('');
  content = content.substring(0, tab.end) + newCards + '\n        ' + content.substring(tab.end);

  // 2) allDetailData 에 detail 키 추가
  const endBrace = findAllDetailDataEnd(content);
  const before = content.substring(0, endBrace);
  const after = content.substring(endBrace);
  const trimmed = before.replace(/,?\s*$/, '');
  const entries = spec.new_questions.map(q =>
    `,\n  ${q.key}: \`${escapeBacktick(buildDetail(q))}\``
  ).join('');
  content = trimmed + entries + '\n' + after;

  // 3) exam_answers 마스터 카드 append (bold 해설 포함)
  const answersAdd = spec.new_questions.map(buildAnswersEntry).join('');
  const eaRe = /(exam_answers\s*:\s*`)([\s\S]*?)(`)/;
  const em = eaRe.exec(content);
  if (em) {
    const newInner = em[2] + escapeBacktick(answersAdd);
    const newBlock = em[1] + newInner + em[3];
    content = content.substring(0, em.index) + newBlock + content.substring(em.index + em[0].length);
  }

  // 4) exam_answer_nums 마스터 카드 append (정답 번호만)
  const numsAdd = spec.new_questions.map(buildNumsEntry).join('');
  const enRe = /(exam_answer_nums\s*:\s*`)([\s\S]*?)(`)/;
  const en = enRe.exec(content);
  if (en) {
    const newInner = en[2] + escapeBacktick(numsAdd);
    const newBlock = en[1] + newInner + en[3];
    content = content.substring(0, en.index) + newBlock + content.substring(en.index + en[0].length);
  }

  fs.writeFileSync(filePath, content);
  console.log(`  완료: +${spec.new_questions.length}문제`);
}

function main() {
  for (const [id, spec] of Object.entries(DATA)) {
    console.log(`\n[${id}] ${path.basename(spec.file)}`);
    try { processFile(spec); }
    catch (e) { console.error(`  [ERR] ${e.message}`); throw e; }
  }
}

if (require.main === module) main();
