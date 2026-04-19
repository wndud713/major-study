'use strict';
/**
 * tools/remove-exam-slides-v2.js
 * 페이지 내용 유사도 분석하여 순수 국시 페이지만 슬라이드 제거.
 * 혼재 페이지(국시 + 해부도식)는 유지.
 *
 * 판정 로직:
 *   1. pdftotext로 페이지 본문 추출
 *   2. 국시 신호 (①②③④⑤, 국가고시, 다음 중) + 해부 신호 (이는곳/닿는곳/신경지배 등) 체크
 *   3. 국시 + 해부 없음 → 'remove'
 *      국시 + 해부 있음 → 'mixed' (유지)
 *      국시 없음 → 'keep' (원래 아님)
 *   4. 텍스트 부족 (< 50자) → Vision 권장 (현 버전은 'mixed' 로 보수적 처리)
 *
 * 사용:
 *   node tools/remove-exam-slides-v2.js <id> [--dry-run] [--force]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(process.env.TEMP || 'C:\\Temp', 'exam-candidates');
const POPPLER = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages',
  'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe', 'poppler-25.07.0', 'Library', 'bin');
const PDFTOTEXT = path.join(POPPLER, 'pdftotext.exe');

const specs = {
  rom:      { file:'임상의사결정/htmlstudy/관절가동범위측정.html', pdf:'임상의사결정/R.O.M.pptx - Google Slides.pdf' },
  finger:   { file:'임상의사결정/htmlstudy/손가락근력검사.html',   pdf:'임상의사결정/7. 손가락 근력검사.pptx - Google Slides.pdf' },
  hip:      { file:'임상의사결정/htmlstudy/엉덩관절근력검사.html', pdf:'임상의사결정/8. 엉덩 관절 근력검사.pptx - Google Slides.pdf' },
  amp:      { file:'임상의사결정/htmlstudy/절단.html',             pdf:'임상의사결정/제 1장 절단 (2).pptx - Google Slides.pdf' },
  cts:      { file:'임상의사결정/htmlstudy/손목굴증후군.html',     pdf:'임상의사결정/제 2장 carpal tunnel syndrome (3).pptx - Google Slides.pdf' },
  cdmintro: { file:'임상의사결정/htmlstudy/임상의사결정개론.html', pdf:'임상의사결정/임상의사 결정 개론 (1).pptx - Google Slides.pdf' },
};

function getPageText(pdfPath, p) {
  try {
    return execFileSync(PDFTOTEXT, ['-f', String(p), '-l', String(p), '-layout', pdfPath, '-'], { encoding:'utf8' });
  } catch { return ''; }
}

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

// ─── 페이지 판정 ────────────────────────────────────────────────────────
function classifyPage(text) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  const len = clean.length;

  if (len < 50) {
    return { decision: 'mixed', reason: 'text_sparse(vision_needed)', examSignals: 0, anatomySignals: 0, len };
  }

  // 국시 신호
  const choiceCount = (clean.match(/[①②③④⑤]/g) || []).length
                    + (clean.match(/(?:^|\s)[1-5]\)/g) || []).length;
  const hasExamHeader = /국가고시|국시|기출|출제문제/.test(clean);
  const hasQuestionForm = /다음\s*중|옳은\s*것은|옳지\s*않은|해당하는\s*것은|설명으로/.test(clean);
  const examSignals = (choiceCount >= 3 ? 2 : 0) + (hasExamHeader ? 2 : 0) + (hasQuestionForm ? 1 : 0);

  // 해부·도식 신호 (국시 혼재 판별)
  const anatomyPatterns = [
    /이는곳|닿는곳|기시\s*:|정지\s*:/,
    /근\s*\([A-Za-z\s]+\)/,   // 근육 라틴명
    /신경지배|신경분포/,
    /동맥|정맥|혈관/,
    /정상\s*값|정상\s*ROM|정상\s*운동범위/,
    /측정\s*자세|검사\s*자세|축\s*:/,
    /\d+\s*-\s*\d+\s*°|\d+\s*-\s*\d+\s*도/,  // ROM 수치 (예: "120-140°")
  ];
  const anatomySignals = anatomyPatterns.filter(re => re.test(clean)).length;

  if (examSignals < 2) {
    return { decision: 'keep', reason: 'not_exam', examSignals, anatomySignals, len };
  }

  if (anatomySignals >= 2) {
    return { decision: 'mixed', reason: 'exam+anatomy_mixed', examSignals, anatomySignals, len };
  }

  return { decision: 'remove', reason: 'pure_exam', examSignals, anatomySignals, len };
}

// ─── 메인 ───────────────────────────────────────────────────────────────
function processSpec(id, opts) {
  const spec = specs[id];
  if (!spec) { console.error('unknown id'); return; }
  const htmlPath = path.join(ROOT, spec.file);
  const pdfPath  = path.join(ROOT, spec.pdf);
  const candPath = path.join(TMP, id, 'candidates.json');

  if (!fs.existsSync(candPath)) {
    console.error(`후보 JSON 없음. detect-exam-candidates.js 먼저 실행: ${candPath}`);
    return;
  }

  const candidates = JSON.parse(fs.readFileSync(candPath, 'utf8'));
  console.log(`\n[${id}] 후보 페이지 ${candidates.length}개`);

  // Vision 사전 분류 JSON (사용자·Claude가 PNG 보고 작성): {page: "remove"|"mixed"|"keep"}
  const visionPath = path.join(TMP, id, 'vision-classification.json');
  const visionMap = fs.existsSync(visionPath) ? JSON.parse(fs.readFileSync(visionPath, 'utf8')) : {};
  if (Object.keys(visionMap).length) {
    console.log(`  [Vision] ${Object.keys(visionMap).length}개 페이지 사전 분류 로드`);
  }

  // 각 후보 페이지 분류
  const decisions = [];
  for (const c of candidates) {
    let cls;
    if (visionMap[c.page]) {
      cls = { decision: visionMap[c.page], reason: 'vision_override', examSignals: '-', anatomySignals: '-', len: '-' };
    } else {
      const pageText = c.rawText || getPageText(pdfPath, c.page);
      cls = classifyPage(pageText);
    }
    decisions.push({ page: c.page, ...cls });
    const mark = cls.decision === 'remove' ? '🗑️' : cls.decision === 'mixed' ? '⚠️' : '✓';
    console.log(`  ${mark} p${c.page} → ${cls.decision} (${cls.reason}, exam=${cls.examSignals}, anat=${cls.anatomySignals}, len=${cls.len})`);
  }

  const removeSet = new Set(decisions.filter(d => d.decision === 'remove').map(d => d.page));
  const mixedSet  = new Set(decisions.filter(d => d.decision === 'mixed').map(d => d.page));

  console.log(`\n  제거 대상: ${removeSet.size}개 페이지 (${[...removeSet].sort((a,b)=>a-b).join(',')})`);
  console.log(`  혼재 유지: ${mixedSet.size}개 페이지 (${[...mixedSet].sort((a,b)=>a-b).join(',')})`);

  if (opts.dryRun) {
    console.log('\n[DRY-RUN] 실제 제거 안 함. --force 없이 종료.');
    return;
  }

  // SLIDES_DATA 필터링
  let content = fs.readFileSync(htmlPath, 'utf8');
  const bak = htmlPath + '.preremove2';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content);

  const block = findSlidesDataBlock(content);
  const body = content.substring(block.start, block.end);

  const entryRe = /\{\s*src:\s*'[^']*',\s*label:\s*'p(\d+)\s*·\s*Slide\s*\d+'\s*\}/g;
  let removed = 0, kept = 0;
  const entries = [];
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    const page = parseInt(m[1], 10);
    if (removeSet.has(page)) { removed++; }
    else { entries.push(m[0]); kept++; }
  }

  const renumbered = entries.map((e, idx) => {
    const labelN = String(idx + 1).padStart(3, '0');
    return e.replace(/'p(\d+)\s*·\s*Slide\s*\d+'/, (_, p) => `'p${p} · Slide ${labelN}'`);
  });

  const newBody = `const SLIDES_DATA = {\n  ch1: [\n` + renumbered.map(e => '    ' + e).join(',\n') + `\n  ],\n};`;
  content = content.substring(0, block.start) + newBody + content.substring(block.end);
  fs.writeFileSync(htmlPath, content);

  const sz = (content.length / (1024 * 1024)).toFixed(2);
  console.log(`\n  슬라이드 제거 ${removed}개 / 유지 ${kept}개 → ${sz}MB`);
  if (mixedSet.size > 0) {
    console.log(`  ⚠️  혼재 페이지 ${mixedSet.size}개는 슬라이드 유지됨 — Vision 수동 검토 권장`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const target = args.find(a => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  if (!target) {
    console.error('사용: node tools/remove-exam-slides-v2.js <id> [--dry-run] [--force]');
    console.error('id:', Object.keys(specs).join(', '));
    process.exit(1);
  }
  processSpec(target, { dryRun: dryRun && !force });
}

if (require.main === module) main();
