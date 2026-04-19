'use strict';
/**
 * tools/detect-exam-candidates.js
 * 1단계: 각 PDF 페이지 텍스트 스코어링으로 국시문제 후보 뽑기
 * 2단계: 후보 페이지를 pdftoppm으로 PNG 렌더
 *
 * 산출: tmp/exam-candidates/<id>/
 *        - candidates.json: [{page, score, snippet}, ...]
 *        - p-NNN.png (렌더된 페이지)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(process.env.TEMP || 'C:\\Temp', 'exam-candidates');
const POPPLER = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages',
  'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe', 'poppler-25.07.0', 'Library', 'bin');
const PDFTOTEXT = path.join(POPPLER, 'pdftotext.exe');
const PDFTOPPM = path.join(POPPLER, 'pdftoppm.exe');
const PDFIMAGES = path.join(POPPLER, 'pdfimages.exe');

const specs = [
  { id:'rom',      pdf:'임상의사결정/R.O.M.pptx - Google Slides.pdf',                          pages:22 },
  { id:'finger',   pdf:'임상의사결정/7. 손가락 근력검사.pptx - Google Slides.pdf',              pages:38 },
  { id:'hip',      pdf:'임상의사결정/8. 엉덩 관절 근력검사.pptx - Google Slides.pdf',           pages:52 },
  { id:'amp',      pdf:'임상의사결정/제 1장 절단 (2).pptx - Google Slides.pdf',                 pages:24 },
  { id:'cts',      pdf:'임상의사결정/제 2장 carpal tunnel syndrome (3).pptx - Google Slides.pdf', pages:24 },
  { id:'cdmintro', pdf:'임상의사결정/임상의사 결정 개론 (1).pptx - Google Slides.pdf',          pages:87 },
  { id:'adl1',     pdf:'ADL/2026_기능훈련_1 (1).pdf',                                          pages:204 },
  { id:'adl2',     pdf:'ADL/2026_기능훈련_2.pdf',                                              pages:144 },
];

function getPageText(pdfPath, p) {
  try {
    return execFileSync(PDFTOTEXT, ['-f', String(p), '-l', String(p), '-layout', pdfPath, '-'], { encoding:'utf8' });
  } catch { return ''; }
}

function scorePage(text) {
  if (!text) return { score: 0, reason: 'empty' };
  let score = 0;
  const signals = [];

  // 강한 신호 (확정 국시)
  if (/국가고시|국시|기출|출제문제/.test(text)) { score += 5; signals.push('header'); }
  if (/20\d{2}\s*년?\s*국가고시|20\d{2}\s*국가고시/.test(text)) { score += 3; signals.push('year'); }

  // 질문 패턴
  if (/다음\s*중|옳은\s*것은|옳지\s*않은|해당하는\s*것은|설명으로/.test(text)) { score += 2; signals.push('question'); }
  // 신규: "다음 검사로", "~으로 판정되는가", "~근육은?" 등
  if (/다음\s*검사로|판정되는가|근육은\?|질환은\?|근육으로\s*옳은|짝지어진/.test(text)) { score += 3; signals.push('qphrase'); }
  if (/\?$|\?\s/.test(text)) { score += 1; signals.push('qmark'); }

  // 보기 패턴 (① 또는 1))
  const circleCount = (text.match(/[①②③④⑤]/g) || []).length;
  const parenCount = (text.match(/^\s*[1-5]\)/gm) || []).length;
  const dotCount = (text.match(/^\s*[1-5]\./gm) || []).length;

  if (circleCount >= 3) { score += 4; signals.push(`circle${circleCount}`); }
  if (parenCount >= 3) { score += 4; signals.push(`paren${parenCount}`); }
  if (dotCount >= 3 && circleCount < 3 && parenCount < 3) { score += 3; signals.push(`dot${dotCount}`); }

  // 정답 표시
  if (/정답\s*[:：]/.test(text)) { score += 2; signals.push('answer'); }

  // 신규: 번호 질문 (76. 다음... / 15. 어떤...)
  if (/^\s*\d{1,3}\.\s+.{8,}\?/m.test(text)) { score += 3; signals.push('numq'); }

  // 페이지 번호 박스 (예: "51." 문제번호) — 하지만 목차와 혼동 가능
  if (/^\s*\d+\.\s*\S/m.test(text) && circleCount >= 3) { score += 1; signals.push('qnum'); }

  return { score, reason: signals.join(',') };
}

/**
 * 신규: 이미지-only 페이지(텍스트 <30자)에서 이미지 크기 기반으로 문제 후보 의심 신호
 *   - 페이지에 큰 이미지(w>=700 && h<=300)가 1개만 있으면 질문 박스일 가능성 (15/32/36처럼 문제 캡션 박스)
 *   - 페이지에 큰 이미지(w>=600 && h>=200 && h<=600) 1-2개면 검사 그림 페이지일 수 있음 (Q76처럼)
 * 반환: { suspectScore, imgInfo }
 */
function imageSignalForPage(pdfPath, pageNum) {
  try {
    const out = execFileSync(PDFIMAGES, ['-list', pdfPath], { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    const lines = out.split(/\r?\n/).filter(L => /^\s*\d/.test(L));
    const pageImgs = [];
    for (const L of lines) {
      const m = L.trim().split(/\s+/);
      const p = parseInt(m[0], 10);
      if (p === pageNum) {
        pageImgs.push({ w: parseInt(m[3], 10), h: parseInt(m[4], 10) });
      }
    }
    if (pageImgs.length === 0) return { suspectScore: 0, imgInfo: 'no-img' };
    // Long thin image = 문제 캡션 박스 패턴 (Q15/Q32/Q36)
    const hasCaptionBox = pageImgs.some(i => i.w >= 700 && i.h <= 300 && i.h >= 100);
    if (hasCaptionBox && pageImgs.length <= 2) return { suspectScore: 6, imgInfo: `caption-box(${pageImgs.length}img)` };
    // 큰 단일 이미지 (w>=600, h>=400) = 문제 박스 전체가 이미지로 캡처된 패턴 (Q76: 689x556)
    if (pageImgs.length === 1) {
      const i = pageImgs[0];
      if (i.w >= 600 && i.h >= 400) return { suspectScore: 5, imgInfo: `big-single(${i.w}x${i.h})` };
    }
    return { suspectScore: 0, imgInfo: `${pageImgs.length}img` };
  } catch {
    return { suspectScore: 0, imgInfo: 'err' };
  }
}

function processSpec(spec) {
  const pdfPath = path.join(ROOT, spec.pdf);
  const outDir = path.join(TMP, spec.id);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n[${spec.id}] ${spec.pages} 페이지 스캔...`);
  const candidates = [];
  for (let p = 1; p <= spec.pages; p++) {
    const text = getPageText(pdfPath, p);
    let { score, reason } = scorePage(text);
    // 신규: 텍스트 희소(<30자) 페이지는 이미지 기반 신호로 보강
    const stripped = (text || '').replace(/\s+/g, '').length;
    let sparseTag = '';
    if (stripped < 30) {
      const { suspectScore, imgInfo } = imageSignalForPage(pdfPath, p);
      if (suspectScore > 0) {
        score += suspectScore;
        reason = (reason ? reason + ',' : '') + 'sparse-img:' + imgInfo;
        sparseTag = 'visionNeeded';
      }
    }
    if (score >= 5) {
      const snippet = text.replace(/\s+/g, ' ').trim().substring(0, 200);
      const entry = { page: p, score, reason, snippet, rawText: text };
      if (sparseTag) entry.sparseTag = sparseTag;
      candidates.push(entry);
    }
  }

  console.log(`  후보 ${candidates.length}개: ${candidates.map(c=>`p${c.page}(s${c.score})`).join(',')}`);

  // 후보 페이지 PDF → PNG 렌더 (150dpi, ASCII 경로)
  if (candidates.length > 0) {
    console.log(`  PNG 렌더링...`);
    for (const c of candidates) {
      const outPrefix = path.join(outDir, `p-${String(c.page).padStart(3,'0')}`);
      if (!fs.existsSync(outPrefix + '-1.png') && !fs.existsSync(outPrefix + '.png')) {
        try {
          execFileSync(PDFTOPPM, ['-png', '-r', '150', '-f', String(c.page), '-l', String(c.page), pdfPath, outPrefix], { stdio: 'pipe' });
        } catch (e) { console.error(`    p${c.page} 렌더 실패: ${e.message}`); }
      }
    }
  }

  // candidates.json 저장
  const jsonPath = path.join(outDir, 'candidates.json');
  fs.writeFileSync(jsonPath, JSON.stringify(candidates, null, 2));
  return { id: spec.id, candidates };
}

function main() {
  const target = process.argv[2];
  const list = target ? specs.filter(s => s.id === target) : specs;
  const results = [];
  for (const s of list) {
    try { results.push(processSpec(s)); }
    catch (e) { console.error(`[ERR] ${s.id}: ${e.message}`); }
  }
  console.log('\n=== 요약 ===');
  for (const r of results) {
    console.log(`${r.id}: ${r.candidates.length}개 후보`);
  }
}

if (require.main === module) main();
