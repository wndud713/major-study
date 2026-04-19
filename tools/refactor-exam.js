'use strict';
/**
 * tools/refactor-exam.js
 * 8개 HTML 파일의 국시문제 레이아웃을 통일:
 *  - 국시문제 탭 최상단에 '🎯 국시문제 답' 마스터 카드 주입
 *  - allDetailData에 'exam_answers' 키 추가 (모든 정답 일괄 나열)
 *  - 인라인 정답 마크업이 있는 파일(임상의사결정개론, ADL 2개)은 정답 라인 제거
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ─── 파일 정의 ────────────────────────────────────────────────────────────
const files = [
  // per-q openDetail 패턴 — q* 키들에서 답 추출, 인라인 정답 없음
  { id: 'rom',      file: '임상의사결정/htmlstudy/관절가동범위측정.html', tabId: 'ch1-tab-exam', style: 'perq', qKeys: ['q2024_63','q2025_62','q2025_63','q2025_64'] },
  { id: 'finger',   file: '임상의사결정/htmlstudy/손가락근력검사.html',   tabId: 'ch1-tab-exam', style: 'perq', qKeys: ['q2024_7','q2022_pip_dip'] },
  { id: 'cts',      file: '임상의사결정/htmlstudy/손목굴증후군.html',     tabId: 'ch1-tab-exam', style: 'perq', qKeys: ['q2021_cts','q_exam2'] },
  { id: 'hip',      file: '임상의사결정/htmlstudy/엉덩관절근력검사.html', tabId: 'ch1-tab-exam', style: 'perq', qKeys: ['q2025_90','q2024_8'] },
  { id: 'amp',      file: '임상의사결정/htmlstudy/절단.html',             tabId: 'ch1-tab-exam', style: 'perq', qKeys: ['q2025_49'] },
  // inline answer 패턴 — exam-card 안에 정답 마크업, 추출+제거 필요
  { id: 'cdmintro', file: '임상의사결정/htmlstudy/임상의사결정개론.html', tabId: 'ch1-tab-tab6', style: 'inline' },
  { id: 'adl1',     file: 'ADL/htmlstudy/기능훈련1_ADL개론.html',         tabId: 'ch1-tab-tab4', style: 'inline' },
  { id: 'adl2',     file: 'ADL/htmlstudy/기능훈련2_화상환자ADL.html',     tabId: 'ch1-tab-tab5', style: 'inline' },
];

// ─── allDetailData parser (재사용) ───────────────────────────────────────
function findAllDetailDataRange(content) {
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
  return { start: braceStart, end: endBrace, body: content.substring(braceStart, endBrace + 1) };
}

// 키별 값(`...`) 추출
function extractKeyContent(detailBlock, key) {
  const pattern = new RegExp(`(^|[\\s,])${key}\\s*:\\s*\\\``);
  const m = pattern.exec(detailBlock);
  if (!m) return null;
  const startIdx = m.index + m[0].length;
  // backtick-string 끝까지 (이스케이프 처리)
  let i = startIdx;
  while (i < detailBlock.length) {
    const ch = detailBlock[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '`') break;
    i++;
  }
  return detailBlock.substring(startIdx, i);
}

function escapeBacktick(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

// ─── exam-card inline 패턴 파서 ─────────────────────────────────────────
function extractInlineExamCards(content, tabId) {
  // tab-content id="<tabId>" 내부 추출
  const tabRe = new RegExp(`<div class="tab-content[^"]*"\\s+id="${tabId}"[^>]*>`);
  const tabM = tabRe.exec(content);
  if (!tabM) throw new Error(`tab ${tabId} not found`);
  const tabStart = tabM.index + tabM[0].length;
  // closing </div> 찾기 (depth 추적)
  let depth = 1, i = tabStart, tabEnd = -1;
  while (i < content.length && depth > 0) {
    const open = content.substring(i, i + 5);
    const close = content.substring(i, i + 6);
    if (open === '<div ' || open === '<div>') { depth++; i += 4; }
    else if (close === '</div>') { depth--; i += 6; if (depth === 0) tabEnd = i - 6; }
    else i++;
  }
  if (tabEnd === -1) throw new Error('tab end not found');
  const tabBody = content.substring(tabStart, tabEnd);

  // 카드 추출: <div class="card"> 또는 <div class="card xxx"> (단, card-body 등 자식 div는 제외)
  const cards = [];
  // 카드 시작: card 다음에 공백 또는 닫는 따옴표만
  const cardStartRe = /<div class="card(?:\s+[^"]*)?"[^>]*>/g;
  let cm;
  while ((cm = cardStartRe.exec(tabBody)) !== null) {
    // 이 카드 블록의 끝 (depth 추적)
    let cdepth = 1, ci = cm.index + cm[0].length, cend = -1;
    while (ci < tabBody.length && cdepth > 0) {
      const co = tabBody.substring(ci, ci + 5);
      const cc = tabBody.substring(ci, ci + 6);
      if (co === '<div ' || co === '<div>') { cdepth++; ci += 4; }
      else if (cc === '</div>') { cdepth--; ci += 6; if (cdepth === 0) cend = ci; }
      else ci++;
    }
    if (cend === -1) continue;
    const cardHtml = tabBody.substring(cm.index, cend);
    // 정답 마크업이 있는 카드만 (exam 카드 식별)
    if (/<b\s+style="color:var\(--ch-accent\)/.test(cardHtml)) {
      cards.push({ html: cardHtml, startInTab: cm.index, endInTab: cend });
    }
  }
  return { tabStart, tabEnd, tabBody, cards };
}

// 카드에서 질문 + 정답 분리
function parseExamCard(cardHtml) {
  const titleM = /<div class="card-title">([\s\S]*?)<\/div>/.exec(cardHtml);
  const subM = /<div class="card-sub">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/.exec(cardHtml);
  const title = titleM ? titleM[1].trim() : '';
  const subRaw = subM ? subM[1] : '';
  // 정답 마크업: <b style="color:var(--ch-accent)">...정답...</b> 또는 <b style="color:var(--ch-accent);...">...✓...</b>
  const answerMarks = [];
  const answerRe = /<b\s+style="color:var\(--ch-accent\)[^"]*"[^>]*>([\s\S]*?)<\/b>/g;
  let am;
  while ((am = answerRe.exec(subRaw)) !== null) {
    answerMarks.push(am[1].replace(/<[^>]+>/g,'').trim());
  }
  // 정답 라인 제거된 sub
  const subStripped = subRaw.replace(answerRe, (m, txt) => {
    // ✓ 표시 제거하고 일반 텍스트로
    return `<span style="color:var(--text-dim)">${txt.replace(/<[^>]+>/g,'').replace(/\s*✓\s*$/, '').replace(/^정답\s*[:：]\s*/, '')}</span>`;
  });
  return { title, subRaw, subStripped, answers: answerMarks };
}

// ─── exam_answers 빌더 ──────────────────────────────────────────────────
function buildExamAnswersFromQKeys(detailBlock, qKeys) {
  const sections = [];
  for (const k of qKeys) {
    const content = extractKeyContent(detailBlock, k);
    if (!content) {
      console.warn(`    [WARN] q-key 못찾음: ${k}`);
      continue;
    }
    sections.push(content.trim());
  }
  return `<h2>🎯 국시문제 정답 모음</h2>
<div class="detail-section">
  <p style="color:var(--text-dim);font-size:12px;">전체 기출문제 정답 + 해설</p>
</div>
<hr class="q-divider">
${sections.join('\n<hr class="q-divider">\n')}`;
}

function buildExamAnswersFromInline(parsedCards) {
  const blocks = parsedCards.map((p, i) => {
    const ansLines = p.answers.length
      ? p.answers.map(a => `  <div class="detail-item green"><b>${a}</b></div>`).join('\n')
      : '  <div class="detail-item">정답 정보 없음</div>';
    return `<div class="detail-section">
  <h3>Q${i + 1}. ${p.title}</h3>
${ansLines}
</div>`;
  });
  return `<h2>🎯 국시문제 정답 모음</h2>
<div class="detail-section">
  <p style="color:var(--text-dim);font-size:12px;">전체 기출문제 정답 일괄 나열</p>
</div>
${blocks.join('\n<hr class="q-divider">\n')}`;
}

// ─── 마스터 카드 HTML ───────────────────────────────────────────────────
const masterCard = `          <div class="card" onclick="openDetail('ch1','exam_answers')" style="border:2px solid var(--ch-accent);background:linear-gradient(135deg,var(--bg2),var(--bg3));">
            <div class="card-body">
              <div class="card-title">🎯 국시문제 답 모음</div>
              <div class="card-sub" style="color:var(--ch-accent);">전체 정답 + 해설 보기 →</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
          <hr class="q-divider">
`;

// ─── 메인 처리 ──────────────────────────────────────────────────────────
function processFile(spec) {
  const filePath = path.join(ROOT, spec.file);
  if (!fs.existsSync(filePath)) { console.error('파일 없음:', filePath); return; }
  console.log(`\n[${spec.id}] ${path.basename(spec.file)} (style=${spec.style})`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 백업 (T4 직전)
  const bak = filePath + '.preexam';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content);

  // 1) 탭 본문 + exam_answers 빌드
  const detailRange = findAllDetailDataRange(content);
  let examAnswersHtml;

  if (spec.style === 'perq') {
    examAnswersHtml = buildExamAnswersFromQKeys(detailRange.body, spec.qKeys);
  } else {
    // inline: 카드들 추출, 답 분리, 인라인 답 제거
    const ext = extractInlineExamCards(content, spec.tabId);
    console.log(`    inline 카드 ${ext.cards.length}개 발견`);
    const parsed = ext.cards.map(c => parseExamCard(c.html));
    examAnswersHtml = buildExamAnswersFromInline(parsed);
    // 탭 본문에서 인라인 답 마크업을 stripped 버전으로 교체
    let newTabBody = ext.tabBody;
    for (let i = 0; i < ext.cards.length; i++) {
      const oldHtml = ext.cards[i].html;
      const newHtml = oldHtml.replace(/<div class="card-sub">([\s\S]*?)<\/div>(\s*<\/div>\s*<\/div>)/, (m, sub, tail) => {
        return `<div class="card-sub">${parsed[i].subStripped}</div>${tail}`;
      });
      newTabBody = newTabBody.replace(oldHtml, newHtml);
    }
    content = content.substring(0, ext.tabStart) + newTabBody + content.substring(ext.tabEnd);
  }

  // 2) 마스터 카드를 exam tab 본문 최상단에 주입
  const tabRe = new RegExp(`(<div class="tab-content[^"]*"\\s+id="${spec.tabId}"[^>]*>)([\\s\\S]*?)(<div class="section-title">[^<]*</div>\\s*)?`);
  // 더 간단: tab-content 시작 직후의 첫 section-title 뒤
  const tabStartRe = new RegExp(`<div class="tab-content[^"]*"\\s+id="${spec.tabId}"[^>]*>`);
  const tm = tabStartRe.exec(content);
  if (!tm) throw new Error(`tab ${spec.tabId} not found at master-card insert`);
  // section-title 찾기
  const afterTabStart = tm.index + tm[0].length;
  const sectionTitleRe = /<div class="section-title">[^<]*<\/div>\s*/;
  const stRest = content.substring(afterTabStart);
  const stm = sectionTitleRe.exec(stRest);
  let insertPos;
  if (stm && stm.index < 200) {
    insertPos = afterTabStart + stm.index + stm[0].length;
  } else {
    insertPos = afterTabStart;
  }
  content = content.substring(0, insertPos) + '\n' + masterCard + content.substring(insertPos);

  // 3) exam_answers 디테일 키 주입 (allDetailData['ch1'] 닫는 } 직전)
  const range2 = findAllDetailDataRange(content);
  const before = content.substring(0, range2.end);
  const after = content.substring(range2.end);
  const trimmedBefore = before.replace(/,?\s*$/, '');
  const newEntry = `,\n  exam_answers: \`${escapeBacktick(examAnswersHtml)}\`\n`;
  content = trimmedBefore + newEntry + after;

  fs.writeFileSync(filePath, content);
  console.log(`  완료 — exam_answers 길이 ${examAnswersHtml.length}`);
}

function main() {
  const target = process.argv[2];
  const list = target ? files.filter(f => f.id === target) : files;
  for (const s of list) {
    try { processFile(s); }
    catch (e) { console.error(`  [ERROR] ${s.id}: ${e.message}`); }
  }
  console.log('\n전체 완료');
}

if (require.main === module) main();
