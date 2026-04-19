// Replace the contents of <div class="exam-grid"> inside tab6 with the fresh grid HTML.
// Works whether the grid already exists (re-runs safely) or if tab6 still has the old card layout.
// Also injects quiz CSS (details/summary styles) once.
const fs = require('fs');

const HTML_PATH = 'C:\\Users\\wndud\\Desktop\\전공공부\\임상의사결정\\htmlstudy\\임상의사결정개론.html';
const GRID_HTML = fs.readFileSync('C:\\Users\\wndud\\AppData\\Local\\Temp\\cdmintro-exam-grid.html', 'utf8');

let content = fs.readFileSync(HTML_PATH, 'utf8');

// -------- Path A: exam-grid already exists → replace its contents --------
const examGridOpen = '<div class="exam-grid">';
const existingIdx = content.indexOf(examGridOpen);
let updated;

if (existingIdx >= 0) {
  // Find the matching </div> for this .exam-grid using div-depth scan.
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

  const before = content.substring(0, startBody);
  const after = content.substring(endBody);
  updated = before + '\n' + GRID_HTML.trimEnd() + '\n            ' + after;
  console.error('Path A: Replaced exam-grid contents (', endBody - startBody, 'chars → ', GRID_HTML.length, 'chars)');
} else {
  // -------- Path B: first-time injection (old card layout still present) --------
  const START_MARKER = '<div class="section-title" style="margin-top:18px;">2019 국가고시</div>';
  const startIdx = content.indexOf(START_MARKER);
  if (startIdx < 0) { console.error('neither exam-grid nor old start marker found'); process.exit(1); }

  const END_MARKER = '</div><!-- /tab6 -->';
  const endIdx = content.indexOf(END_MARKER, startIdx);
  if (endIdx < 0) { console.error('end marker missing'); process.exit(1); }

  let lineStart = endIdx;
  while (lineStart > 0 && content[lineStart - 1] !== '\n') lineStart--;

  const newBlock =
`<div class="exam-master" id="ch1-exam-master" onclick="toggleExamGrid(this)" aria-expanded="false">
            <div>
              <div class="em-title">🎯 국시문제 전체 펼치기</div>
              <div class="em-sub">2019·2021·2022·2024·2025 국가고시 + Nagi/HOAC II 개념문제 — 한 화면에서 3열로 전체 보기 (29문항)</div>
            </div>
            <span class="em-chev">▶</span>
          </div>
          <div class="exam-grid-wrap" id="ch1-exam-grid-wrap">
            <div class="exam-grid">
${GRID_HTML.trimEnd()}
            </div>
          </div>
`;
  updated = content.substring(0, startIdx) + newBlock + content.substring(lineStart);
  console.error('Path B: First-time tab6 replacement');
}

// ---- Ensure toggleExamGrid function exists ----
if (!/function\s+toggleExamGrid\s*\(/.test(updated)) {
  const adIdx = updated.indexOf('const allDetailData');
  if (adIdx < 0) { console.error('allDetailData not found for fn injection'); process.exit(1); }
  const scriptCloseIdx = updated.indexOf('</script>', adIdx);
  if (scriptCloseIdx < 0) { console.error('No </script> after allDetailData'); process.exit(1); }
  const fn =
`\nfunction toggleExamGrid(el){\n` +
`  var expanded = el.classList.contains('expanded');\n` +
`  var wrap = document.getElementById('ch1-exam-grid-wrap');\n` +
`  if(expanded){\n` +
`    el.classList.remove('expanded');\n` +
`    el.setAttribute('aria-expanded','false');\n` +
`    if(wrap) wrap.classList.remove('open');\n` +
`    var t=el.querySelector('.em-title'); if(t) t.textContent='\\uD83C\\uDFAF 국시문제 전체 펼치기';\n` +
`  } else {\n` +
`    el.classList.add('expanded');\n` +
`    el.setAttribute('aria-expanded','true');\n` +
`    if(wrap) wrap.classList.add('open');\n` +
`    var t2=el.querySelector('.em-title'); if(t2) t2.textContent='\\uD83C\\uDFAF 국시문제 접기';\n` +
`  }\n` +
`}\n`;
  updated = updated.substring(0, scriptCloseIdx) + fn + updated.substring(scriptCloseIdx);
  console.error('Injected toggleExamGrid function');
}

// ---- Ensure quiz-reveal CSS exists (idempotent) ----
const QUIZ_CSS_MARKER = '/* -- q-reveal (quiz mode) -- */';
if (updated.indexOf(QUIZ_CSS_MARKER) < 0) {
  const quizCss = `
${QUIZ_CSS_MARKER}
.q-cell details.q-reveal{margin-top:6px}
.q-cell details.q-reveal > summary.q-reveal-btn{
  display:inline-block;list-style:none;cursor:pointer;
  background:color-mix(in srgb,var(--ch-accent,#38bdf8) 18%,transparent);
  color:var(--ch-accent,#38bdf8);
  border:1px solid color-mix(in srgb,var(--ch-accent,#38bdf8) 45%,transparent);
  border-radius:999px;padding:5px 14px;font-size:11px;font-weight:600;
  letter-spacing:.04em;transition:background .15s,border-color .15s;
  user-select:none;
}
.q-cell details.q-reveal > summary.q-reveal-btn::-webkit-details-marker{display:none}
.q-cell details.q-reveal > summary.q-reveal-btn::before{content:'👁 ';opacity:.85;margin-right:3px}
.q-cell details.q-reveal[open] > summary.q-reveal-btn::before{content:'✅ '}
.q-cell details.q-reveal[open] > summary.q-reveal-btn{
  background:color-mix(in srgb,var(--ch-accent,#38bdf8) 30%,transparent);
}
.q-cell details.q-reveal > summary.q-reveal-btn:hover{
  background:color-mix(in srgb,var(--ch-accent,#38bdf8) 28%,transparent);
}
.q-cell details.q-reveal > .q-reveal-body{margin-top:8px;animation:qFade .22s ease-out}
@keyframes qFade{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}
`;
  // Place at end of the first large <style> block (before </style>)
  const styleCloseIdx = updated.indexOf('</style>');
  if (styleCloseIdx < 0) { console.error('No </style> tag to append quiz CSS'); process.exit(1); }
  updated = updated.substring(0, styleCloseIdx) + quizCss + updated.substring(styleCloseIdx);
  console.error('Injected quiz-reveal CSS');
}

fs.writeFileSync(HTML_PATH, updated);
console.error('Done');
