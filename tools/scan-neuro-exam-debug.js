'use strict';
// 낮은 임계값으로 3 PDF 전 페이지 스코어 분포 덤프 (검증용)

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

function pages(p) { return parseInt(/Pages:\s*(\d+)/.exec(execFileSync(PDFINFO, [p], { encoding: 'utf8' }))[1]); }
function pageText(pdf, p) {
  try { return execFileSync(PDFTOTEXT, ['-f', String(p), '-l', String(p), '-layout', pdf, '-'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }); }
  catch { return ''; }
}

for (const s of specs) {
  const n = pages(s.pdf);
  console.log(`\n=== ${s.id} (${n}p) ===`);
  const hits = [];
  for (let p = 1; p <= n; p++) {
    const t = pageText(s.pdf, p);
    const kw = [];
    if (/국가고시|국시|기출/.test(t)) kw.push('GOSI');
    if (/다음\s*중|옳은\s*것은|옳지\s*않은/.test(t)) kw.push('Q');
    const cc = (t.match(/[①②③④⑤]/g) || []).length;
    const pc = (t.match(/^\s*[1-5]\)/gm) || []).length;
    const dc = (t.match(/^\s*[1-5]\./gm) || []).length;
    if (cc >= 3) kw.push(`circle${cc}`);
    if (pc >= 3) kw.push(`paren${pc}`);
    if (dc >= 3) kw.push(`dot${dc}`);
    if (/정답|해설/.test(t)) kw.push('ANS');
    if (/문제\s*\d|Q\s*\d/.test(t)) kw.push('Qnum');
    if (kw.length > 0) hits.push({ p, kw: kw.join(',') });
  }
  if (hits.length === 0) console.log('  시그니처 없음');
  else hits.forEach(h => console.log(`  p${h.p}: ${h.kw}`));
}
