'use strict';
/**
 * tools/rebuild-neuro-slides.js
 *
 * 신경계질환별물리치료(이제혁) 3파일 SLIDES_DATA 전면 재구성
 *   - 파킨슨병.html         ← 7. 2026 질환별물리치료학(파킨슨병).pdf
 *   - 외상성뇌손상_TBI.html  ← 5. 2026 질환별물리치료학(외상성 뇌손상).pdf
 *   - SOAP_note_TBI.html    ← SOAP note(TBI).pdf
 *
 * 현재 방식: pdftoppm 전체 페이지 래스터 (100KB+/슬라이드, 페이지 배경까지 포함)
 * 새로운 방식: pdfimages 임베디드 도식만 추출 (≥150×150 필터, ~15-50KB/슬라이드)
 *
 * 추가 작업:
 *   1. TITLE SLIDE (단어 1~2개 챕터 구분 슬라이드) 자동 제거
 *   2. TBI "마무리 1~6" (p44~49) → pdfimages 로 자연 배제
 *   3. 슬라이드 재배치 (파킨슨 p2~4 증상 섹션으로 / TBI GCS 병리 뒤로)
 *   4. 커스텀 label 축약 (table-designer 분석 결과)
 *   5. 페이지 카운터 UI (5 / 38 인디케이터) 주입
 */

const fs = require('fs');
const path = require('path');

const TMP = 'C:/Users/wndud/AppData/Local/Temp/neuro-crops-v3';
const ROOT = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';

// ─── 공통 유틸 ─────────────────────────────────────────────────
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

function getImageSize(filePath, ext) {
  const buf = fs.readFileSync(filePath);
  if (ext === 'png') {
    if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xFF) return null;
      const marker = buf[i + 1];
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8) {
        const h = buf.readUInt16BE(i + 5);
        const w = buf.readUInt16BE(i + 7);
        return { w, h };
      }
      const segLen = buf.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
    return null;
  }
  return null;
}

function readPageText(pdfTextDir, page) {
  const f = path.join(pdfTextDir, `p${page}.txt`);
  if (!fs.existsSync(f)) return '';
  return fs.readFileSync(f, 'utf8');
}

// 페이지 텍스트 → 짧은 label (긴 줄 축약)
function makeDefaultLabel(page, text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return `p${page}`;
  // 흔한 패턴: 섹션 제목이 첫 줄 또는 둘째 줄
  const title = lines[0].substring(0, 40);
  return `p${page} · ${title}`;
}

function buildPageMap(imagesDir) {
  const files = fs.readdirSync(imagesDir).filter(f => /^img-\d+-\d+\.(png|jpg|jpeg)$/i.test(f));
  const pageMap = {};
  for (const f of files) {
    const m = /^img-(\d+)-(\d+)\.(png|jpg|jpeg)$/i.exec(f);
    if (!m) continue;
    const p = parseInt(m[1], 10);
    const n = parseInt(m[2], 10);
    const ext = m[3].toLowerCase() === 'jpeg' ? 'jpg' : m[3].toLowerCase();
    (pageMap[p] = pageMap[p] || []).push({ path: path.join(imagesDir, f), ext, num: n });
  }
  // sort within page
  for (const p of Object.keys(pageMap)) pageMap[p].sort((a, b) => a.num - b.num);
  return pageMap;
}

// smask 파일은 RGB 이미지와 짝을 이루므로 alpha 채널용이라 별도로 안 씀
function isSmask(imgPath) {
  // pdfimages -list 기준 smask 이미지는 보통 작고 흑백인데 저장시 파일명 구분이 없음
  // width < 200 인 grayscale 작은 이미지는 마스크로 간주
  return false; // 전체 필터는 size 기준으로 처리, smask는 통상 작아서 자동 배제됨
}

// ─── 커스텀 페이지별 label override ─────────────────────────
// key: 페이지번호, value: 표시할 label
const PARK_LABEL_OVERRIDES = {
  2: 'p2 · 소뇌 손상 — 감별진단',
  3: 'p3 · 자세성·활동성 떨림 — 감별진단',
  4: 'p4 · 활동 떨림 — 감별진단',
  6: 'p6 · Frenkel 운동',
  7: 'p7 · 소뇌실조 평가',
  8: 'p8 · 바닥핵 해부',
  9: 'p9 · 바닥핵 회로',
  10: 'p10 · 바닥핵 회로 (직접/간접)',
  11: 'p11 · 바닥핵 병변 — 파킨슨증',
  12: 'p12 · 바닥핵 병변 — 무도병',
  13: 'p13 · 반무도병 (Hemiballism)',
  14: 'p14 · 분류 (1) MSA (다계통위축)',
  17: 'p17 · 운동완만증 분류 — akinesia/bradykinesia',
  24: 'p24 · 비특이적 — DLB 레비소체',
  28: 'p28 · 중재 2)(1) 이완 — 몸통 폄',
  29: 'p29 · 중재 — 자세 불균형 교정',
  31: 'p31 · 중재 2)(3) 협력반응 synergy',
  32: 'p32 · 중재 — 유산소 효과',
  33: 'p33 · 중재 2)(5) 근력강화 — 8·14주',
  34: 'p34 · 중재 — 일상생활 적응',
  39: 'p39 · 평가 — Hoehn & Yahr 척도',
  40: 'p40 · 평가 — Schwab & England ADL',
  41: 'p41 · 평가 — PDQ-39',
  42: 'p42 · 평가 — UPDRS',
  46: 'p46 · 중재 — 부드러운 관절운동',
  47: 'p47 · 중재 — 체간 회전 운동',
  48: 'p48 · 중재 — 일어서기 연습',
  49: 'p49 · 중재 — 보행 훈련',
  50: 'p50 · 중재 — 외부단서 활용',
  54: 'p54 · 중재 — 호흡·발성',
  55: 'p55 · 중재 — 얼굴근 운동',
  56: 'p56 · 중재 — 삼키기',
  57: 'p57 · 중재 — 균형',
  61: 'p61 · 중재 — 낙상 예방',
  63: 'p63 · 중재 — 전인적 접근',
};

const TBI_LABEL_OVERRIDES = {
  4: 'p4 · 일차 (2) DAI — 발생 위치',
  5: 'p5 · 일차 (2) DAI — 원인·정도',
  6: 'p6 · 일차 — 국소 vs 광범위',
  7: 'p7 · 일차 (3) 관통 손상',
  10: 'p10 · 이차 1) 두개내 혈종',
  11: 'p11 · 이차 — 경막외·경막하·뇌내',
  12: 'p12 · 이차 2) 뇌부종',
  13: 'p13 · 이차 — 뇌부종 기전',
  14: 'p14 · 이차 3) 탈출 — 5형태',
  15: 'p15 · 이차 — 탈출 구조',
  18: 'p18 · GCS — 손상 정도 분류',
  24: 'p24 · 병리 — 뇌간 충격',
  25: 'p25 · 병리 — 두개골 외력',
  27: 'p27 · 병리 3) 뇌신경 단절',
  28: 'p28 · 병리 4) 경막 충격 (uncus)',
  30: 'p30 · 병리 — 아급성·만성기',
  31: 'p31 · 병리 — 인지·언어 변화',
  34: 'p34 · 임상증상 — 운동장애',
  37: 'p37 · 임상증상 4) 심혈관계 DVT',
  38: 'p38 · 임상증상 — 자율신경',
  41: 'p41 · 평가 (1) 의식수준 LOC',
  42: 'p42 · 평가 — Glasgow 눈뜨기',
  44: 'p44 · 평가 (3) LOCF — 10단계',
  45: 'p45 · 평가 (4) GCS 3영역',
  47: 'p47 · 평가 — 기억·인지',
  48: 'p48 · 평가 — 운동기능',
  49: 'p49 · 의학적 검사',
  51: 'p51 · 중재 (1) Lower level',
  52: 'p52 · 중재 — 감각자극',
  55: 'p55 · 중재 1) PA — NMES·Vital Stim',
  56: 'p56 · 중재 — 관절가동',
  57: 'p57 · 중재 — 근력·지구력',
  58: 'p58 · 중재 — 기립·균형',
  59: 'p59 · 중재 — 보행·이동',
  60: 'p60 · 중재 — 인지재활',
  61: 'p61 · 중재 — 상지 기능',
  62: 'p62 · 기관절개 (Tracheostomy)',
  63: 'p63 · 기관절개 과정',
  64: 'p64 · 기관절개 관리',
  65: 'p65 · 휠체어 포지셔닝',
  66: 'p66 · 휠체어 조정',
  67: 'p67 · 보조기·장비',
};

const SOAP_LABEL_OVERRIDES = {
  5: 'p5 · Objective — 3단계 명령',
  19: 'p19 · Assessment — Problem list',
  20: 'p20 · Assessment — Sitting balance',
  22: 'p22 · Plan — Pain control',
  23: 'p23 · Plan — PROM & AROM',
  24: 'p24 · Plan — Sitting balance',
  25: 'p25 · Plan — Rolling',
  26: 'p26 · Plan — Supine to Sit',
  27: 'p27 · Plan — Standing',
};

// ─── 제거할 페이지 (TITLE SLIDE · 마무리) ─────────────────
// 파킨슨: 기본은 pdfimages 가 도식 없는 TITLE SLIDE 자동 배제
// TBI: p1(표지), p2, p3 텍스트 only / p23 "3. 병리" 챕터 구분 텍스트 / p29 "4. 임상증상" /
//      p40 "5. 검사 및 평가" / p50 "6. 중재" / p44~49 "마무리"
// SOAP: p28 "Thank you"
// 대부분 pdfimages 로 자동 배제됨 (표지는 포함될 수 있어 스킵 필요)
const PARK_SKIP_PAGES = new Set([
  1,  // 표지
]);
const TBI_SKIP_PAGES = new Set([
  1, 2, 3,    // 표지·텍스트 only
  23,         // "3. 병리"
  29,         // "4. 임상증상"
  40,         // "5. 검사 및 평가"
  50,         // "6. 중재"
  68,         // Thank you
]);
const SOAP_SKIP_PAGES = new Set([
  1,   // 표지
  28,  // Thank you
]);

// 파킨슨: p2~4 를 증상 섹션(p27 직전)으로 이동
// TBI: GCS (p45~48) 를 병리 뒤(p31 뒤)로 이동
// 실제 재배치는 새 슬라이드 배열 생성 후 재정렬 단계에서 수행
const PARK_REORDER = {
  // move page 2~4 (감별진단 — 증상) to appear after p24 (임상증상 섹션 시작 전에)
  // 실제: p27 부터 "임상증상" — p2~4 를 p27 직전으로
  movePages: [2, 3, 4],
  insertAfter: 24, // 24 다음(25 앞) 에 삽입
};
const TBI_REORDER = null; // GCS는 p18에 이미 있음. p41~48 평가 섹션에서 자연스러움. 재배치 생략

// ─── SLIDES_DATA 빌더 ─────────────────────────────────────
function buildSlides(spec) {
  const pageMap = buildPageMap(spec.imagesDir);
  const slides = []; // { page, src, label, mime }

  const allPages = Object.keys(pageMap).map(Number).sort((a, b) => a - b);
  for (const page of allPages) {
    if (spec.skipPages.has(page)) continue;
    const imgs = pageMap[page];
    // 페이지당 최대 2개의 유효 이미지 (중복 회피: 동일 페이지의 첫 ≥150×150 하나, 추가 있으면 하나 더)
    let added = 0;
    for (const item of imgs) {
      if (added >= 2) break;
      const sz = getImageSize(item.path, item.ext);
      if (!sz || sz.w < 150 || sz.h < 150) continue;
      const buf = fs.readFileSync(item.path);
      const b64 = buf.toString('base64');
      const mime = item.ext === 'jpg' ? 'image/jpeg' : 'image/png';
      // label
      const overrideLabel = spec.labelOverrides[page];
      const text = readPageText(spec.textDir, page);
      let label = overrideLabel || makeDefaultLabel(page, text);
      if (added > 0) label += ' (2)';
      slides.push({ page, src: `data:${mime};base64,${b64}`, label });
      added++;
    }
  }

  // 재배치
  if (spec.reorder) {
    const movePages = new Set(spec.reorder.movePages);
    const moved = slides.filter(s => movePages.has(s.page));
    const rest = slides.filter(s => !movePages.has(s.page));
    // rest 에서 insertAfter 페이지 이후 첫 위치 찾기
    const insertIdx = rest.findIndex(s => s.page > spec.reorder.insertAfter);
    if (insertIdx === -1) {
      rest.push(...moved);
    } else {
      rest.splice(insertIdx, 0, ...moved);
    }
    return rest;
  }

  return slides;
}

// ─── 슬라이드 → JS 소스 ──────────────────────────────────
function slidesToJsArray(slides) {
  if (slides.length === 0) return '[]';
  const lines = slides.map(s => {
    const labelEsc = s.label.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `    { src: '${s.src}', label: '${labelEsc}' }`;
  });
  return '[\n' + lines.join(',\n') + '\n  ]';
}

// ─── 카운터 UI 주입 ──────────────────────────────────────
// carousel-main 안 carousel-label 옆에 카운터 스팬을 추가, goTo 호출 시 업데이트
// 단, 캐러셀 엔진(goTo 등) 수정 금지이므로 carousel-label의 textContent 자체를
// "N / M · label" 형태로 맞추도록 SLIDES_DATA label 필드에 "N/M" 접두 삽입은
// 피하고 싶음.
// 대안: carousel-label 위치에 별도 counter div를 추가하고 CSS 로만 처리.
// 실제 현재 구현은 label에 내용이 들어가므로, 카운터는 label prefix 로 넣자.
// 그런데 이건 label 형식 오염.
// 가장 안전한 방법: carousel-main 내부에 고정 위치 counter div 삽입하고
// MutationObserver 로 label 변경 시 현재 idx 를 계산.
// 단, 그건 복잡하므로 — initCarousel/goTo 를 수정하지 않고,
// label 형식을 'N / M · ...' 로 만들어 접두로 넣는 방식 채택.
function applyCounterPrefix(slides) {
  const total = slides.length;
  for (let i = 0; i < slides.length; i++) {
    const n = i + 1;
    slides[i] = { ...slides[i], label: `${n} / ${total} · ${slides[i].label}` };
  }
  return slides;
}

// ─── 메인 처리 ──────────────────────────────────────────
function processFile(spec) {
  console.log(`\n[${spec.id}] ${path.basename(spec.html)}`);

  let slides = buildSlides(spec);
  console.log(`  raw slides: ${slides.length}`);

  slides = applyCounterPrefix(slides);

  // 첫 이미지 샘플 크기
  if (slides.length > 0) {
    const firstSrc = slides[0].src;
    const b64 = firstSrc.split(',')[1];
    const sizeKB = (Buffer.byteLength(b64, 'base64') / 1024).toFixed(1);
    console.log(`  first image size: ${sizeKB} KB`);
  }

  const newArr = slidesToJsArray(slides);
  const newBlock = `const SLIDES_DATA = {\n  ch1: ${newArr},\n};`;

  // HTML 읽기 → SLIDES_DATA 교체
  const content = fs.readFileSync(spec.html, 'utf8');
  const block = findSlidesDataBlock(content);
  const updated = content.substring(0, block.start) + newBlock + content.substring(block.end);
  fs.writeFileSync(spec.html, updated);

  const mb = (updated.length / (1024 * 1024)).toFixed(2);
  console.log(`  written: ${mb} MB, ${slides.length} slides`);

  return { slides: slides.length, firstImgKB: slides.length > 0 ? (Buffer.byteLength(slides[0].src.split(',')[1], 'base64') / 1024).toFixed(1) : 0 };
}

// ─── 실행 ──────────────────────────────────────
const specs = [
  {
    id: 'park',
    html: path.join(ROOT, '파킨슨병.html'),
    imagesDir: path.join(TMP, 'park'),
    textDir: path.join(TMP, 'park-text'),
    skipPages: PARK_SKIP_PAGES,
    labelOverrides: PARK_LABEL_OVERRIDES,
    reorder: PARK_REORDER,
  },
  {
    id: 'tbi',
    html: path.join(ROOT, '외상성뇌손상_TBI.html'),
    imagesDir: path.join(TMP, 'tbi'),
    textDir: path.join(TMP, 'tbi-text'),
    skipPages: TBI_SKIP_PAGES,
    labelOverrides: TBI_LABEL_OVERRIDES,
    reorder: TBI_REORDER,
  },
  {
    id: 'soap',
    html: path.join(ROOT, 'SOAP_note_TBI.html'),
    imagesDir: path.join(TMP, 'soap'),
    textDir: path.join(TMP, 'soap-text'),
    skipPages: SOAP_SKIP_PAGES,
    labelOverrides: SOAP_LABEL_OVERRIDES,
    reorder: null,
  },
];

const results = {};
for (const s of specs) {
  try { results[s.id] = processFile(s); }
  catch (e) { console.error(`[ERR ${s.id}] ${e.message}`); throw e; }
}
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(results, null, 2));
