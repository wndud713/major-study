// Inject 60 quiz questions into 임상의사결정개론.html:
//   (A) Replace the allDetailData['ch1'] = { ... } block with 60 new key entries
//   (B) Replace the <div class="exam-grid"> contents with 60 q-cell entries
// Uses brace-depth parsing (no regex over HTML/JS) to locate block boundaries safely.

const fs = require('fs');

const HTML_PATH = 'C:\\Users\\wndud\\Desktop\\전공공부\\임상의사결정\\htmlstudy\\임상의사결정개론.html';
const JSON_PATH = 'C:\\Users\\wndud\\Desktop\\전공공부\\임상의사결정\\htmlstudy\\tmp\\exam-extracted-cdmintro-v5.json';

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const questions = data.questions;
console.error('Loaded', questions.length, 'questions');

// -------- Build allDetailData['ch1'] body (each key: `...`) --------
// Each body: <h2>title</h2><section: 문제><section: 선택지 (green for answer)><tip>
function buildDetail(q) {
  let choicesHtml = '';
  const keys = ['①','②','③','④','⑤'];
  for (const k of keys) {
    const txt = (q.choices[k] || '').trim();
    const isAns = (k === q.answer);
    const cls = isAns ? 'detail-item green' : 'detail-item red';
    const tail = isAns ? ' <b>→ 정답 ✓</b>' : '';
    choicesHtml += `  <div class="${cls}">${k} ${txt}${tail}</div>\n`;
  }
  return `<h2>${q.title}</h2>\n` +
    `<div class="detail-section">\n  <div class="detail-item accent"><b>문제:</b> ${q.stem}</div>\n</div>\n` +
    `<div class="detail-section">\n  <h3>선택지 분석</h3>\n${choicesHtml}</div>\n` +
    `<div class="tip-box">💡 <b>해설:</b> ${q.explain}</div>`;
}

// Build the full ch1 object body
const adch1Body = questions.map(q => {
  const body = buildDetail(q);
  // Ensure no backticks in body (we don't use them in content)
  if (body.indexOf('`') >= 0) throw new Error('Backtick in body for ' + q.key);
  return `  ${q.key}: \`${body}\``;
}).join(',\n');

const newAdch1 = `allDetailData['ch1'] = {\n${adch1Body}\n};`;

// -------- (A) Replace allDetailData['ch1'] = {...}; in the HTML --------
let content = fs.readFileSync(HTML_PATH, 'utf8');

function findCh1Block(src) {
  const m = /allDetailData\['ch1'\]\s*=\s*\{/.exec(src);
  if (!m) return null;
  const braceStart = m.index + m[0].lastIndexOf('{');
  let depth = 0, inTmpl = false, inStr = false, strCh = '';
  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (inTmpl) {
      if (ch === '\\') { i++; continue; }
      if (ch === '`') inTmpl = false;
      continue;
    }
    if (ch === '`') { inTmpl = true; continue; }
    if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        let end = i + 1;
        if (src[end] === ';') end++;
        return { start: m.index, end: end };
      }
    }
  }
  return null;
}

const ch1Block = findCh1Block(content);
if (!ch1Block) { console.error('allDetailData[ch1] block not found'); process.exit(1); }
console.error('Found ch1 block:', ch1Block.start, '→', ch1Block.end, '(', ch1Block.end - ch1Block.start, 'chars)');

content = content.substring(0, ch1Block.start) + newAdch1 + content.substring(ch1Block.end);

// -------- (B) Build the new exam-grid HTML --------
// Group by year (insert separators)
const groupOrder = ['2019','2020','2021','2022','2023','2024','2025','기타'];
const byYear = {};
for (const q of questions) {
  if (!byYear[q.year]) byYear[q.year] = [];
  byYear[q.year].push(q);
}

function quizCellHtml(q) {
  // Neutral choices (no green pre-reveal). Details reveal answer.
  const keys = ['①','②','③','④','⑤'];
  let choicesHtml = '';
  for (const k of keys) {
    const txt = (q.choices[k] || '').trim();
    choicesHtml += `  <div class="detail-item">${k} ${txt}</div>\n`;
  }
  const correct = q.answer + ' ' + (q.choices[q.answer] || '').trim();
  return `<h2>${q.title}</h2>\n` +
    `<div class="detail-section">\n  <div class="detail-item accent"><b>문제:</b> ${q.stem}</div>\n</div>\n` +
    `<div class="detail-section">\n  <h3>선택지 분석</h3>\n${choicesHtml}</div>\n` +
    `<details class="q-reveal">\n` +
    `  <summary class="q-reveal-btn">정답 확인</summary>\n` +
    `  <div class="q-reveal-body">\n` +
    `    <div class="detail-item green"><b>정답 ✓</b> ${correct}</div><div class="tip-box">💡 <b>해설:</b> ${q.explain}</div>\n` +
    `  </div>\n` +
    `</details>`;
}

let gridOut = '';
for (const year of groupOrder) {
  const qs = byYear[year];
  if (!qs || !qs.length) continue;
  const sepLabel = (year === '기타') ? '개념 문제 (Nagi / HOAC II / ICF / EBPT 등)' : `${year} 국가고시`;
  const cls = (year === '기타') ? 'year-concept' : `year-${year}`;
  gridOut += `          <div class="q-year-sep ${cls}">${sepLabel}</div>\n`;
  for (const q of qs) {
    gridOut += `          <div class="q-cell">${quizCellHtml(q)}</div>\n`;
  }
}

// Locate <div class="exam-grid"> and replace its contents via div-depth scan
const examGridOpen = '<div class="exam-grid">';
const existingIdx = content.indexOf(examGridOpen);
if (existingIdx < 0) { console.error('exam-grid not found'); process.exit(1); }
const startBody = existingIdx + examGridOpen.length;
let depth = 1;
let i = startBody;
const openRe = /<div\b/g;
const closeRe = /<\/div>/g;
let endBody = -1;
while (i < content.length) {
  openRe.lastIndex = i;
  closeRe.lastIndex = i;
  const om = openRe.exec(content);
  const cm = closeRe.exec(content);
  if (!cm) break;
  if (om && om.index < cm.index) {
    depth++;
    i = om.index + om[0].length;
  } else {
    depth--;
    if (depth === 0) { endBody = cm.index; break; }
    i = cm.index + cm[0].length;
  }
}
if (endBody < 0) { console.error('exam-grid closing </div> not found'); process.exit(1); }
console.error('exam-grid body:', startBody, '→', endBody, '(', endBody - startBody, 'chars)');

content = content.substring(0, startBody) + '\n' + gridOut.trimEnd() + '\n            ' + content.substring(endBody);

// -------- Update em-sub text to reflect 60 questions --------
content = content.replace(
  /<div class="em-sub">[^<]*<\/div>/,
  '<div class="em-sub">2019~2025 국가고시 + 개념 문제 (Nagi / HOAC II / ICF / EBPT) — 한 화면에서 3열로 전체 보기 (60문항)</div>'
);

fs.writeFileSync(HTML_PATH, content, 'utf8');
console.error('DONE. Wrote', content.length, 'bytes');
