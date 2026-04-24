'use strict';
/**
 * scan-neuro-exam.js
 *   파킨슨 / TBI / SOAP(TBI) PDF 스캔 → 국시문제 후보 탐지 → JSON 저장.
 *   수정 X, 분석 only.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const POPPLER = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages',
  'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe', 'poppler-25.07.0', 'Library', 'bin');
const PDFTOTEXT = path.join(POPPLER, 'pdftotext.exe');
const PDFINFO = path.join(POPPLER, 'pdfinfo.exe');

const BASE = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';

const specs = [
  { id: 'parkinson', pdf: path.join(BASE, '7. 2026 질환별물리치료학(파킨슨병).pdf') },
  { id: 'tbi',       pdf: path.join(BASE, '5. 2026 질환별물리치료학(외상성 뇌손상).pdf') },
  { id: 'soap',      pdf: path.join(BASE, 'SOAP note(TBI).pdf') },
];

function getPages(pdfPath) {
  const out = execFileSync(PDFINFO, [pdfPath], { encoding: 'utf8' });
  const m = /Pages:\s*(\d+)/.exec(out);
  return m ? parseInt(m[1], 10) : 0;
}

function getPageText(pdfPath, p) {
  try {
    return execFileSync(PDFTOTEXT, ['-f', String(p), '-l', String(p), '-layout', pdfPath, '-'],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch { return ''; }
}

function scorePage(text) {
  if (!text) return { score: 0, reason: 'empty' };
  let score = 0;
  const signals = [];

  if (/국가고시|국시|기출|출제문제/.test(text)) { score += 5; signals.push('header'); }
  if (/20\d{2}\s*년?\s*국가고시|20\d{2}\s*국가고시|제\s*\d+\s*회/.test(text)) { score += 3; signals.push('year'); }

  if (/다음\s*중|옳은\s*것은|옳지\s*않은|해당하는\s*것은|설명으로|올바른\s*것은/.test(text)) { score += 2; signals.push('question'); }
  if (/다음\s*검사로|판정되는가|근육은\?|질환은\?|근육으로\s*옳은|짝지어진/.test(text)) { score += 3; signals.push('qphrase'); }

  const circleCount = (text.match(/[①②③④⑤]/g) || []).length;
  const parenCount = (text.match(/^\s*[1-5]\)/gm) || []).length;
  const dotCount = (text.match(/^\s*[1-5]\./gm) || []).length;

  if (circleCount >= 3) { score += 4; signals.push(`circle${circleCount}`); }
  if (parenCount >= 3) { score += 4; signals.push(`paren${parenCount}`); }
  if (dotCount >= 3 && circleCount < 3 && parenCount < 3) { score += 3; signals.push(`dot${dotCount}`); }

  if (/정답\s*[:：]|답\s*[:：]\s*[①②③④⑤1-5]/.test(text)) { score += 2; signals.push('answer'); }
  if (/해설\s*[:：]/.test(text)) { score += 2; signals.push('explanation'); }
  if (/^\s*\d{1,3}\.\s+.{8,}\?/m.test(text)) { score += 3; signals.push('numq'); }

  return { score, reason: signals.join(',') };
}

function parseQuestionBlock(text, pageNum) {
  // 보기 5지선다 추출 시도
  const options = { '①': '', '②': '', '③': '', '④': '', '⑤': '' };
  const marks = ['①', '②', '③', '④', '⑤'];
  for (let i = 0; i < marks.length; i++) {
    const cur = marks[i];
    const next = marks[i + 1];
    const idx = text.indexOf(cur);
    if (idx === -1) continue;
    let end = next ? text.indexOf(next, idx) : -1;
    if (end === -1) end = text.length;
    options[cur] = text.substring(idx + cur.length, end).trim().replace(/\s+/g, ' ').substring(0, 200);
  }

  // 문제 텍스트: 첫 ① 이전 부분
  let question = '';
  const firstCircle = text.indexOf('①');
  if (firstCircle !== -1) {
    question = text.substring(0, firstCircle).trim().replace(/\s+/g, ' ').substring(0, 500);
  }

  // 정답
  const ansMatch = /정답\s*[:：]\s*([①②③④⑤1-5])/.exec(text);
  const answer = ansMatch ? ansMatch[1] : '';

  // 해설
  const expMatch = /해설\s*[:：]\s*([\s\S]{0,500})/.exec(text);
  const explanation = expMatch ? expMatch[1].trim().replace(/\s+/g, ' ').substring(0, 500) : '';

  return { page: pageNum, question, options, answer, explanation };
}

function processSpec(spec) {
  const pages = getPages(spec.pdf);
  console.log(`\n[${spec.id}] ${pages} 페이지 스캔 (${path.basename(spec.pdf)})`);
  const candidates = [];
  for (let p = 1; p <= pages; p++) {
    const text = getPageText(spec.pdf, p);
    const { score, reason } = scorePage(text);
    if (score >= 5) {
      const parsed = parseQuestionBlock(text, p);
      parsed.score = score;
      parsed.reason = reason;
      parsed.rawSnippet = text.replace(/\s+/g, ' ').trim().substring(0, 300);
      candidates.push(parsed);
    }
  }
  console.log(`  후보 ${candidates.length}개: ${candidates.map(c => `p${c.page}(s${c.score})`).join(', ')}`);
  return candidates;
}

function main() {
  const result = {};
  for (const s of specs) {
    result[s.id] = processSpec(s);
  }

  const outPath = 'C:/tmp/neuro-exam-candidates.json';
  if (!fs.existsSync(path.dirname(outPath))) fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n저장: ${outPath}`);

  console.log('\n=== 요약 ===');
  let total = 0;
  for (const s of specs) {
    const n = result[s.id].length;
    total += n;
    console.log(`${s.id}: ${n}개 후보`);
    if (n > 0) {
      const sample = result[s.id][0];
      console.log(`  샘플 p${sample.page}: ${sample.question.substring(0, 120)}${sample.question.length > 120 ? '...' : ''}`);
      const opts = Object.entries(sample.options).filter(([, v]) => v).slice(0, 2);
      for (const [k, v] of opts) console.log(`    ${k} ${v.substring(0, 80)}`);
      if (sample.answer) console.log(`    정답: ${sample.answer}`);
    } else {
      console.log('  없음');
    }
  }
  console.log(`총 ${total}문항`);
}

main();
