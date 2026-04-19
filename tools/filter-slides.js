'use strict';
/**
 * tools/filter-slides.js
 *
 * 1. PDF 페이지별 텍스트 추출 → 국시문제 전용 페이지 감지
 * 2. 감지된 국시 페이지의 문제·보기·정답 파싱 → 국시문제 탭 카드 + exam_answers 추가
 * 3. pdfimages 로 임베디드 이미지 추출 (page-numbered) → 도식만 크롭
 * 4. SLIDES_DATA 재구성: 국시 페이지 제외, 임베디드 이미지(≥150×150)만 사용
 *
 * 사용:
 *   node tools/filter-slides.js              # 전체
 *   node tools/filter-slides.js <id>         # 단일
 *
 * id: rom, finger, hip, amp, cts, cdmintro, adl1, adl2
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
// pdfimages 한글 경로 I/O 에러 회피 → 임시 디렉터리 ASCII 경로 사용
const TMP = path.join(process.env.TEMP || 'C:\\Temp', 'pdf-crops');
const POPPLER = path.join(
  process.env.LOCALAPPDATA || '',
  'Microsoft', 'WinGet', 'Packages',
  'oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'poppler-25.07.0', 'Library', 'bin'
);
const PDFIMAGES = path.join(POPPLER, 'pdfimages.exe');
const PDFTOTEXT = path.join(POPPLER, 'pdftotext.exe');

const targets = [
  { id:'rom',      pdf:'임상의사결정/R.O.M.pptx - Google Slides.pdf',                          html:'임상의사결정/htmlstudy/관절가동범위측정.html', pages:22 },
  { id:'finger',   pdf:'임상의사결정/7. 손가락 근력검사.pptx - Google Slides.pdf',              html:'임상의사결정/htmlstudy/손가락근력검사.html',   pages:38 },
  { id:'hip',      pdf:'임상의사결정/8. 엉덩 관절 근력검사.pptx - Google Slides.pdf',           html:'임상의사결정/htmlstudy/엉덩관절근력검사.html', pages:52 },
  { id:'amp',      pdf:'임상의사결정/제 1장 절단 (2).pptx - Google Slides.pdf',                 html:'임상의사결정/htmlstudy/절단.html',             pages:24 },
  { id:'cts',      pdf:'임상의사결정/제 2장 carpal tunnel syndrome (3).pptx - Google Slides.pdf', html:'임상의사결정/htmlstudy/손목굴증후군.html',     pages:24 },
  { id:'cdmintro', pdf:'임상의사결정/임상의사 결정 개론 (1).pptx - Google Slides.pdf',          html:'임상의사결정/htmlstudy/임상의사결정개론.html', pages:87 },
  { id:'adl1',     pdf:'ADL/2026_기능훈련_1 (1).pdf',                                          html:'ADL/htmlstudy/기능훈련1_ADL개론.html',       pages:204 },
  { id:'adl2',     pdf:'ADL/2026_기능훈련_2.pdf',                                              html:'ADL/htmlstudy/기능훈련2_화상환자ADL.html',   pages:144 },
];

// ─── 유틸 ────────────────────────────────────────────────────────────────
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
  if (endBrace === -1) throw new Error('SLIDES_DATA close brace not found');
  let blockEnd = endBrace + 1;
  if (content[blockEnd] === ';') blockEnd++;
  return { start: m.index, end: blockEnd };
}

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
  return { start: braceStart, end: endBrace };
}

function escapeBacktick(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

// ─── 페이지 텍스트 ─────────────────────────────────────────────────────
function getPageText(pdfPath, pageNum) {
  try {
    return execFileSync(PDFTOTEXT, ['-f', String(pageNum), '-l', String(pageNum), '-layout', pdfPath, '-'], { encoding: 'utf8' });
  } catch (e) {
    return '';
  }
}

// 국시 전용 페이지 감지
function isExamOnlyPage(text) {
  if (!text || text.trim().length < 20) return false;
  const choiceCount = (text.match(/[①②③④⑤]/g) || []).length;
  // 정답 표시 또는 연속 보기 4개 이상
  const hasExam = /국가고시|기출|국시|다음 중|옳은 것은|정답/.test(text);
  // 해부학 전문 용어 (국시 외 슬라이드 의심)
  const hasAnatomy = /이는곳|닿는곳|작용|신경지배|혈관|근육 분류/.test(text);
  return choiceCount >= 4 && hasExam && !hasAnatomy;
}

// 문제 텍스트 → 구조화
function parseExamFromText(text, pageNum) {
  // 첫 줄 (제목 추정)
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  // 보기 라인 추출 (① ~ ⑤)
  const choiceMap = {};
  const choiceMarks = ['①','②','③','④','⑤'];
  let questionLines = [];
  let answerLine = '';
  let inChoices = false;
  for (const line of lines) {
    const mark = choiceMarks.find(m => line.startsWith(m));
    if (mark) {
      inChoices = true;
      choiceMap[mark] = line.replace(/^[①②③④⑤]\s*/, '').trim();
    } else if (/정답/.test(line)) {
      answerLine = line;
    } else if (!inChoices) {
      questionLines.push(line);
    }
  }
  const questionText = questionLines.join(' ').trim().substring(0, 300);
  // 정답 추출
  let answer = '';
  const am = /정답[:：]\s*([①②③④⑤\d])/.exec(answerLine);
  if (am) answer = am[1];
  return {
    pageNum,
    title: `[페이지 ${pageNum}] ${questionText.substring(0, 60)}`,
    question: questionText,
    choices: choiceMap,
    answer,
    raw: text.substring(0, 500),
  };
}

// ─── pdfimages 실행 + 페이지별 매핑 ─────────────────────────────────────
function extractEmbeddedImages(spec) {
  const outDir = path.join(TMP, spec.id);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // 캐시
  const existing = fs.readdirSync(outDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  if (existing.length === 0) {
    console.log(`  [pdfimages] 추출 중 (${spec.pages}페이지)...`);
    // -j: JPEG 원본 보존, -png: 그 외 PNG, -p: 페이지 번호
    execFileSync(PDFIMAGES, ['-j', '-png', '-p', path.join(ROOT, spec.pdf), path.join(outDir, 'img')], { stdio: 'pipe' });
  } else {
    console.log(`  [cache] ${existing.length}개 추출본 사용`);
  }
  const files = fs.readdirSync(outDir).filter(f => /^img-/.test(f) && /\.(png|jpg)$/i.test(f));
  const pageMap = {};
  for (const f of files) {
    const m = /^img-(\d+)-(\d+)\.(png|jpg)$/i.exec(f);
    if (!m) continue;
    const page = parseInt(m[1], 10);
    if (!pageMap[page]) pageMap[page] = [];
    pageMap[page].push({ path: path.join(outDir, f), ext: m[3].toLowerCase() });
  }
  return pageMap;
}

// 이미지 크기 (PNG/JPG 헤더 파싱)
function getImageSize(filePath, ext) {
  const buf = fs.readFileSync(filePath);
  if (ext === 'png') {
    if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    // SOI 0xFFD8
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xFF) return null;
      const marker = buf[i+1];
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8) {
        // SOF marker
        const h = buf.readUInt16BE(i+5);
        const w = buf.readUInt16BE(i+7);
        return { w, h };
      }
      const segLen = buf.readUInt16BE(i+2);
      i += 2 + segLen;
    }
    return null;
  }
  return null;
}

// 메인 처리
function processFile(spec) {
  console.log(`\n[${spec.id}] ${path.basename(spec.html)}`);
  const htmlPath = path.join(ROOT, spec.html);
  const pdfPath = path.join(ROOT, spec.pdf);

  // 1) 백업
  const bak = htmlPath + '.preslide';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, fs.readFileSync(htmlPath));

  // 2) 페이지별 텍스트 → 국시 전용 감지
  const examPages = [];
  for (let p = 1; p <= spec.pages; p++) {
    const txt = getPageText(pdfPath, p);
    if (isExamOnlyPage(txt)) {
      const parsed = parseExamFromText(txt, p);
      examPages.push(parsed);
    }
  }
  console.log(`  국시 전용 페이지: ${examPages.length}개 (${examPages.map(e=>e.pageNum).join(',')})`);

  // 3) 임베디드 이미지 추출
  const pageMap = extractEmbeddedImages(spec);

  // 4) 새 SLIDES_DATA 빌드: 국시 페이지 제외, 페이지별 임베디드 이미지(≥150×150) 사용
  const examPageSet = new Set(examPages.map(e => e.pageNum));
  const newSlides = [];
  for (let p = 1; p <= spec.pages; p++) {
    if (examPageSet.has(p)) continue;
    const imgs = pageMap[p] || [];
    for (const item of imgs) {
      const sz = getImageSize(item.path, item.ext);
      if (!sz || sz.w < 150 || sz.h < 150) continue;
      const buf = fs.readFileSync(item.path);
      const b64 = buf.toString('base64');
      const mime = item.ext === 'jpg' ? 'image/jpeg' : 'image/png';
      const labelN = String(newSlides.length + 1).padStart(3, '0');
      newSlides.push(`    { src: 'data:${mime};base64,${b64}', label: 'p${p} · Slide ${labelN}' }`);
    }
  }
  console.log(`  새 슬라이드 수: ${newSlides.length}장 (이전: ${spec.pages}장)`);

  // 5) HTML 수정: SLIDES_DATA 교체
  let content = fs.readFileSync(htmlPath, 'utf8');
  const block = findSlidesDataBlock(content);
  const newSlidesArr = newSlides.length > 0
    ? '[\n' + newSlides.join(',\n') + '\n  ]'
    : '[]';
  const newBlock = `const SLIDES_DATA = {\n  ch1: ${newSlidesArr},\n};`;
  content = content.substring(0, block.start) + newBlock + content.substring(block.end);

  // 6) 국시 페이지 → 국시문제 탭에 카드 추가 + exam_answers 보강
  if (examPages.length > 0) {
    // 국시문제 탭 ID 자동 감지
    const tabIdPatterns = ['ch1-tab-exam', 'ch1-tab-tab4', 'ch1-tab-tab5', 'ch1-tab-tab6'];
    let examTabId = null;
    for (const tid of tabIdPatterns) {
      if (content.includes(`id="${tid}"`)) { examTabId = tid; break; }
    }
    if (examTabId) {
      // 새 카드 HTML 생성
      const newCardsHtml = examPages.map(e => {
        const choicesHtml = ['①','②','③','④','⑤']
          .map(m => e.choices[m] ? `${m} ${e.choices[m]}<br>` : '')
          .filter(s => s).join('\n                ');
        return `
          <hr class="q-divider">
          <div class="card">
            <div class="card-body">
              <div class="card-title">[자동 추출 P${e.pageNum}] ${e.question.substring(0, 50)}...</div>
              <div class="card-sub">
                ${e.question}<br><br>
                ${choicesHtml}
              </div>
            </div>
          </div>`;
      }).join('');
      // 탭 본문 끝에 추가
      const tabRe = new RegExp(`(<div class="tab-content[^"]*"\\s+id="${examTabId}"[^>]*>)`);
      const tm = tabRe.exec(content);
      if (tm) {
        // 탭 닫는 </div> 위치 찾기 (depth 추적)
        let i = tm.index + tm[0].length, depth = 1, end = -1;
        while (i < content.length && depth > 0) {
          const o = content.substring(i, i + 5);
          const c = content.substring(i, i + 6);
          if (o === '<div ' || o === '<div>') { depth++; i += 4; }
          else if (c === '</div>') { depth--; i += 6; if (depth === 0) end = i - 6; }
          else i++;
        }
        if (end !== -1) {
          content = content.substring(0, end) + newCardsHtml + '\n        ' + content.substring(end);
        }
      }

      // exam_answers 디테일에 정답 추가 (있으면)
      const answeredOnly = examPages.filter(e => e.answer);
      if (answeredOnly.length > 0) {
        const range = findAllDetailDataRange(content);
        const body = content.substring(range.start, range.end);
        // exam_answers 키 위치 찾기 → 끝에 새 정답 블록 추가
        const eaRe = /(\bexam_answers\s*:\s*`)([\s\S]*?)(`)/;
        const em = eaRe.exec(body);
        if (em) {
          const additions = answeredOnly.map(e =>
            `\n<hr class="q-divider">\n<div class="detail-section">
  <h3>P${e.pageNum} (자동 추출)</h3>
  <div class="detail-item green"><b>정답: ${e.answer}</b></div>
</div>`
          ).join('');
          const newBody = body.substring(0, em.index) + em[1] + em[2] + escapeBacktick(additions) + em[3] + body.substring(em.index + em[0].length);
          content = content.substring(0, range.start) + newBody + content.substring(range.end);
        }
      }
    }
  }

  fs.writeFileSync(htmlPath, content);
  const newSize = (content.length / (1024 * 1024)).toFixed(2);
  console.log(`  완료 (HTML ${newSize}MB)`);
}

function main() {
  const target = process.argv[2];
  const list = target ? targets.filter(t => t.id === target) : targets;
  for (const t of list) {
    try { processFile(t); }
    catch (e) { console.error(`  [ERROR] ${t.id}: ${e.message}`); }
  }
  console.log('\n전체 완료');
}

if (require.main === module) main();
