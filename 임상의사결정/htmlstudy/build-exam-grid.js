// Build the inline 3-column exam grid HTML for tab6 — QUIZ mode.
// v4: Each q-cell renders choices neutrally; a <details> "정답 확인" summary reveals
//     the correct answer + 해설 on demand. Per-cell toggle state via native <details>.
const fs = require('fs');

const HTML_PATH = 'C:\\Users\\wndud\\Desktop\\전공공부\\임상의사결정\\htmlstudy\\임상의사결정개론.html';
const OUT_FILE = 'C:\\Users\\wndud\\AppData\\Local\\Temp\\cdmintro-exam-grid.html';

const content = fs.readFileSync(HTML_PATH, 'utf8');

// Find allDetailData block start
const ad = /const\s+allDetailData\s*=\s*\{/.exec(content);
if (!ad) { console.error('allDetailData not found'); process.exit(1); }

const groups = [
  { sep: '2019 국가고시', cls: 'year-2019', keys: ['q2019_95', 'q2019_96', 'q2019_97', 'q2019_98', 'q2019_101', 'q2019_102'] },
  { sep: '2021 국가고시', cls: 'year-2021', keys: ['q2021_97', 'q2021_98', 'q2021_101'] },
  { sep: '2022 국가고시', cls: 'year-2022', keys: ['q2022_65', 'q2022_98', 'q2022_99', 'q2022_101'] },
  { sep: '2024 국가고시', cls: 'year-2024', keys: ['q2024_96', 'q2024_97', 'q2024_100', 'q2024_101', 'q2024_102', 'q2024_icf_participation'] },
  { sep: '2025 국가고시', cls: 'year-2025', keys: ['q2025_99', 'q2025_100', 'q2025_101', 'q2025_102'] },
  { sep: '개념 문제 (Nagi / HOAC II / 6단계)', cls: 'year-concept', keys: ['q_nagi_lighting', 'q_nagi_stairs', 'q_nagi_frozen', 'q_nagi_headinjury', 'q_hoac_perceived', 'q_cdm6_dynamic'] },
];

// Helper: extract the template-literal body for `qkey: \`...\`` inside allDetailData.
// Uses brace/backtick-aware scanning (no regex over content).
function extractDetail(key) {
  // Find the key's start: `\n  key: ``
  const needle = '\n  ' + key + ': `';
  const idx = content.indexOf(needle, ad.index);
  if (idx < 0) return null;
  const start = idx + needle.length;
  // Content contains no backticks (template-literal body) so just scan forward
  const end = content.indexOf('`', start);
  if (end < 0) return null;
  return content.substring(start, end);
}

// Transform a detail body into quiz form:
// - strip the `<b>→ 정답 ✓</b>` marker inside the green choice, demote `.detail-item green`
//   to `.detail-item neutral` (pre-reveal neutral style)
// - extract the correct choice text + tip-box
// - append <details> block
function toQuizForm(body, qkey) {
  // Match the single green choice line (only one per cell)
  const greenRe = /<div class="detail-item green">([\s\S]*?)<\/div>/;
  const greenMatch = greenRe.exec(body);
  let correctHtml = '';
  if (greenMatch) {
    // Strip `<b>→ 정답 ✓</b>` (with optional surrounding whitespace) from captured inner
    correctHtml = greenMatch[1].replace(/\s*<b>\s*→\s*정답\s*✓\s*<\/b>\s*/g, '').trim();
  }

  // Extract tip-box (해설) if present
  const tipRe = /<div class="tip-box">([\s\S]*?)<\/div>/;
  const tipMatch = tipRe.exec(body);
  let tipHtml = '';
  if (tipMatch) {
    tipHtml = tipMatch[1].trim();
  }

  // Build the stripped body:
  // 1) remove the tip-box line (and leading newline before it)
  // 2) convert green choice to neutral by: class="detail-item green" -> class="detail-item", strip marker
  let stripped = body;
  if (tipMatch) {
    // Remove the tip-box element and any preceding whitespace/newline
    stripped = stripped.replace(/\s*<div class="tip-box">[\s\S]*?<\/div>\s*$/, '');
  }
  // Neutralize green choice
  stripped = stripped.replace(/<div class="detail-item green">([\s\S]*?)<\/div>/g, function(_m, inner) {
    const clean = inner.replace(/\s*<b>\s*→\s*정답\s*✓\s*<\/b>\s*/g, '').trim();
    return `<div class="detail-item">${clean}</div>`;
  });

  // Assemble <details> reveal block
  let revealInner = '';
  if (correctHtml) {
    revealInner += `<div class="detail-item green"><b>정답 ✓</b> ${correctHtml}</div>`;
  }
  if (tipHtml) {
    revealInner += `<div class="tip-box">${tipHtml}</div>`;
  }

  const detailsBlock = `
<details class="q-reveal">
  <summary class="q-reveal-btn">정답 확인</summary>
  <div class="q-reveal-body">
    ${revealInner}
  </div>
</details>`;

  return stripped.trimEnd() + detailsBlock;
}

const ids = groups.flatMap(g => g.keys);
console.error('Total q-keys:', ids.length);

let out = '';
for (const g of groups) {
  out += `          <div class="q-year-sep ${g.cls}">${g.sep}</div>\n`;
  for (const k of g.keys) {
    const body = extractDetail(k);
    if (!body) {
      console.error('MISSING:', k);
      out += `          <div class="q-cell"><h2>${k}</h2><div class="detail-item red">(데이터 없음)</div></div>\n`;
      continue;
    }
    const quiz = toQuizForm(body, k);
    out += `          <div class="q-cell">${quiz}</div>\n`;
  }
}

fs.writeFileSync(OUT_FILE, out);
console.error('Wrote', out.length, 'bytes to', OUT_FILE);
