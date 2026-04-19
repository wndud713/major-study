// Build fresh SLIDES_DATA['ch1'] block for 임상의사결정개론.html
// v4: Full-page rasterization via pdftoppm (120 dpi JPEG) — 87 pages → 87 carousel entries.
// Rationale: Google Slides PDF exports store most text slides as vector (no embedded images),
// so pdfimages skips them. Rasterizing every page guarantees all slides appear in the carousel.
const fs = require('fs');
const path = require('path');

const IMG_DIR = 'C:\\Users\\wndud\\AppData\\Local\\Temp\\cdmintro-pages';
const PAGETEXT_DIR = 'C:\\Users\\wndud\\AppData\\Local\\Temp\\cdmintro-pagetext';
const OUT_FILE = 'C:\\Users\\wndud\\AppData\\Local\\Temp\\cdmintro-slides-data.txt';

// Curated labels for key slides (overrides auto-extraction).
// Preserved from v3 selective-image build; augmented with labels for previously-skipped slides.
const STATIC_LABELS = {
  1: '표지',
  2: '목차',
  3: '임상의사결정 정의',
  4: '임상의사결정 6단계 개요',
  5: '2019 국시 (Q95)',
  6: '2019 국시 (Q96)',
  7: '2019 국시 (Q97)',
  8: '2019 국시 (Q98)',
  9: '2019 국시 (Q101)',
  10: '2019 국시 (Q102)',
  11: '2022 국시',
  12: '2021 국시 Q101 (EBP 수행 5단계)',
  13: '2022 국시',
  14: '2022 국시',
  15: '2022 국시',
  16: '2022 국시',
  17: '2024 국시 Q101 (SOAP 단락)',
  18: '2022 국시',
  19: '2023 국시',
  20: '2023 국시',
  21: '2023 국시',
  22: '2023 국시',
  23: '2023 국시',
  24: '2023 국시',
  25: '2024 국시 Q96 (PICO)',
  26: '2024 국시 (ICF 참여)',
  27: '2024 국시 Q100 (평가단계)',
  28: '2023 국시',
  29: 'Nagi 장애개념 모델',
  30: 'Nagi 모델 도식',
  31: 'ICF 소개',
  32: 'ICF 구성요소',
  33: 'ICF 활동 예시',
  34: 'ICF 참여 예시',
  35: 'ICF 환경요인',
  36: 'ICF 개인요인',
  37: 'ICF 사례',
  38: 'ICF 사례 2',
  39: 'ICF 장애 정의',
  40: 'ICF 도식 (건강상태)',
  41: '임상추론 정의',
  42: '임상추론 유형',
  43: '가설지향 알고리즘 I',
  44: '가설지향 알고리즘 II',
  45: 'HOAC II 배경',
  46: 'HOAC II 목적',
  47: 'HOAC II 단계 개요',
  48: 'HOAC II 플로우차트',
  49: 'HOAC II 1단계',
  50: 'HOAC II 2단계',
  51: 'HOAC II 3단계',
  52: 'HOAC II 도식',
  53: '근거중심 물리치료 정의',
  54: '근거중심 물리치료 필요성',
  55: '근거중심 물리치료 (EBP)',
  56: '근거중심 물리치료 도식',
  57: 'EBP 구성요소',
  58: 'EBP 5단계',
  59: '근거 수준',
  60: '근거 수준 피라미드',
  61: '체계적 문헌고찰',
  62: '메타분석',
  63: '무작위 대조시험',
  64: '코호트 연구',
  65: '환자대조 연구',
  66: '근거평가 표',
  67: '비뚤림 평가',
  68: '근거 적용',
  69: '근거 질 분류',
  70: '근거 해석',
  71: '연구설계 비교',
  72: '임상연구 설계',
  73: '코호트/추적조사',
  74: '환자대조군 설계',
  75: 'PICO 방법',
  76: 'PICO 예시',
  77: '임상질문 작성',
  78: '근거검색 데이터베이스',
  79: '근거 적용 및 평가',
  80: '2025 국시 Q102 (SOAP)',
  81: '문서화 목적',
  82: 'SOAP 예시',
  83: 'SOAP 구성',
  84: '문서화 예시',
  85: '문서화 주의사항',
  86: '요약',
  87: '참고문헌',
};

function labelFromText(page) {
  try {
    const txt = fs.readFileSync(path.join(PAGETEXT_DIR, 'p' + String(page).padStart(2, '0') + '.txt'), 'utf8');
    // Take first non-empty line trimmed
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return '';
    let first = lines[0];
    // Drop leading bullets/markers
    first = first.replace(/^[\s•·\-–.•●○]+/, '').trim();
    // Drop leading numbering like "1)", "1.", "①"
    first = first.replace(/^[0-9]+[\)\.\u00B7]\s*/, '').trim();
    if (first.length > 26) first = first.substring(0, 26) + '…';
    return first;
  } catch (e) {
    return '';
  }
}

function simplifyLabel(page) {
  if (STATIC_LABELS[page]) return STATIC_LABELS[page];
  const t = labelFromText(page);
  return t || `Slide ${page}`;
}

// Load images — sorted by name (page-01.jpg … page-87.jpg)
const files = fs.readdirSync(IMG_DIR)
  .filter(f => /^page-\d+\.jpg$/.test(f))
  .sort();

console.error(`Found ${files.length} rasterized pages`);

const entries = [];
for (const f of files) {
  const m = f.match(/^page-(\d+)\.jpg$/);
  if (!m) continue;
  const page = parseInt(m[1], 10);
  const raw = fs.readFileSync(path.join(IMG_DIR, f));
  const b64 = raw.toString('base64');
  const short = simplifyLabel(page);
  const label = `p${page} · ${short}`;
  entries.push({ page, label, b64 });
}

entries.sort((a, b) => a.page - b.page);

// Output the block
let out = '';
out += 'const SLIDES_DATA = {\n';
out += '  ch1: [\n';
for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  const safeLabel = e.label.replace(/'/g, "\\'");
  out += `    { src: 'data:image/jpeg;base64,${e.b64}', label: '${safeLabel}' }`;
  out += (i < entries.length - 1) ? ',\n' : '\n';
}
out += '  ],\n';
out += '};';

fs.writeFileSync(OUT_FILE, out);
console.error(`Wrote ${entries.length} entries, ${out.length} bytes to ${OUT_FILE}`);
