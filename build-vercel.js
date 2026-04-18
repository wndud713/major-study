#!/usr/bin/env node
'use strict';
/**
 * build-vercel.js — Vercel 분할 배포 빌더
 *
 * 입력: merge-config.json
 * 출력:
 *   public/index.html              — 6 과목 카드 (즉시 로딩, ~10KB)
 *   public/subjects/{id}.html      — 과목별 챕터 카드 (즉시 로딩, ~10KB)
 *   public/chapters/{과목}/...      — 챕터 HTML (원본 복사, 1~22MB)
 *   public/vercel.json             — Vercel 라우팅
 *
 * 핵심 통찰: 단일 통합본 = 안티패턴.
 * 사용자 한 번에 한 챕터만 봄 → 인덱스 + 챕터별 분할이 27배 효율적.
 */
const fs = require('fs');
const path = require('path');
const { injectEditFeatures } = require('./lib/merge-engine');

const ROOT = __dirname;
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'merge-config.json'), 'utf8'));
const PUBLIC = path.join(ROOT, 'public');
const CHAPTERS_DIR = path.join(PUBLIC, 'chapters');
const SUBJECTS_DIR = path.join(PUBLIC, 'subjects');

// 과목별 메타 (icon · 색상)
const SUBJECT_META = {
  'neuro-motor':       { icon: '🧠', accent: '#38bdf8', desc: '오리엔테이션·보바스·루드·기능적움직임·보행' },
  'neuro-disease':     { icon: '🩺', accent: '#a78bfa', desc: '뇌졸중·소뇌실조·파킨슨·TBI·SOAP' },
  'adl':               { icon: '🏥', accent: '#fb923c', desc: 'ADL개론·화상환자ADL' },
  'sports':            { icon: '🏃', accent: '#34d399', desc: '재활프로그램·치유·평가·심리·핵심안정화·신경근·HKA' },
  'clinical':          { icon: '📋', accent: '#f472b6', desc: '의사결정개론·ROM·근력검사·손목굴·절단' },
  'clinical-seminar':  { icon: '🔬', accent: '#4fd1c5', desc: '연구방법론' },
};

// ============================================================
// 공통 — 디자인 토큰 (shell_template_v2.html 일치)
// ============================================================
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap');
:root{
  --bg:#0d0f14;--bg2:#13161e;--bg3:#1a1e2a;--bg4:#222736;
  --border:#2a3048;--accent:#38bdf8;--accent2:#a78bfa;
  --text:#dce3f0;--text-dim:#7a8aaa;--text-bright:#fff;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Noto Sans KR',sans-serif;font-size:14px;line-height:1.65;padding:32px 20px;min-height:100vh}
.container{max-width:1100px;margin:0 auto}
header{margin-bottom:32px;padding-bottom:18px;border-bottom:1px solid var(--border)}
header h1{font-size:24px;color:var(--text-bright);margin-bottom:8px;display:flex;align-items:center;gap:10px}
header .subtitle{color:var(--text-dim);font-size:13px}
header .breadcrumb{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim);margin-bottom:6px}
header .breadcrumb a{color:var(--accent);text-decoration:none}
header .breadcrumb a:hover{text-decoration:underline}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.card{display:block;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:18px 20px;text-decoration:none;color:var(--text);transition:all .18s;cursor:pointer}
.card:hover{border-color:var(--card-accent,var(--accent));background:var(--bg3);transform:translateY(-2px)}
.card .card-icon{font-size:28px;margin-bottom:10px}
.card .card-title{font-size:15px;font-weight:700;color:var(--text-bright);margin-bottom:6px}
.card .card-meta{font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--card-accent,var(--accent));margin-bottom:8px;letter-spacing:.05em}
.card .card-desc{font-size:12px;color:var(--text-dim);line-height:1.55}
footer{margin-top:48px;padding-top:18px;border-top:1px solid var(--border);font-size:11px;color:var(--text-dim);text-align:center}
footer a{color:var(--accent);text-decoration:none;margin:0 6px}
footer a:hover{text-decoration:underline}
.tip{background:var(--bg2);border-left:3px solid var(--accent);padding:12px 16px;border-radius:6px;margin-bottom:20px;font-size:12.5px;color:var(--text-dim)}
.tip b{color:var(--text-bright)}
@media (max-width:600px){
  body{padding:20px 12px}
  header h1{font-size:18px}
  .grid{grid-template-columns:1fr;gap:10px}
}
`;

// ============================================================
// 인덱스 페이지 (전체)
// ============================================================
function buildIndex() {
  const subjectsHtml = CONFIG.subjects.map(s => {
    const meta = SUBJECT_META[s.id] || { icon: '📚', accent: '#38bdf8', desc: '' };
    return `    <a class="card" href="/subjects/${s.id}.html" style="--card-accent:${meta.accent}">
      <div class="card-icon">${meta.icon}</div>
      <div class="card-meta">${s.chapters.length} 챕터</div>
      <div class="card-title">${s.name}</div>
      <div class="card-desc">${meta.desc}</div>
    </a>`;
  }).join('\n');

  const totalChapters = CONFIG.subjects.reduce((sum, s) => sum + s.chapters.length, 0);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>전공공부 — 물리치료 인터랙티브 스터디</title>
<style>${SHARED_CSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>📚 전공공부</h1>
    <div class="subtitle">${CONFIG.subjects.length} 과목 · ${totalChapters} 챕터 — 원하는 과목 선택</div>
  </header>

  <div class="tip">
    💡 <b>사용 팁:</b> 각 챕터는 1~22MB. 처음 클릭 시 잠시 대기 → 두 번째부터는 캐시되어 즉시 로딩.
    오프라인 사용 시 GitHub Releases에서 통합본 다운로드.
  </div>

  <div class="grid">
${subjectsHtml}
  </div>

  <footer>
    💾 오프라인 다운로드:
    <a href="https://github.com/wndud713/major-study/releases/latest" target="_blank" rel="noopener">GitHub Releases</a>
    ·
    <a href="https://github.com/wndud713/major-study" target="_blank" rel="noopener">소스 코드</a>
  </footer>
</div>
</body>
</html>`;
}

// ============================================================
// 과목별 인덱스
// ============================================================
function buildSubjectIndex(subject) {
  const meta = SUBJECT_META[subject.id] || { icon: '📚', accent: '#38bdf8', desc: '' };
  const subjectFolder = subject.chapters[0].file.split('/')[0]; // e.g., "신경계운동치료학"

  const chaptersHtml = subject.chapters.map((ch, i) => {
    const filename = ch.file.split('/').pop();
    const stat = fs.statSync(path.join(ROOT, ch.file));
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    const href = `/chapters/${encodeURIComponent(subjectFolder)}/${encodeURIComponent(filename)}`;
    return `    <a class="card" href="${href}" style="--card-accent:${meta.accent}">
      <div class="card-meta">CH.${String(i + 1).padStart(2, '0')} · ${sizeMB} MB</div>
      <div class="card-title">${ch.shortTitle}</div>
      <div class="card-desc">${filename.replace(/\.html$/, '')}</div>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject.name} — 전공공부</title>
<style>${SHARED_CSS}</style>
</head>
<body>
<div class="container">
  <header>
    <div class="breadcrumb"><a href="/">← 전체 인덱스</a></div>
    <h1>${meta.icon} ${subject.name}</h1>
    <div class="subtitle">${subject.chapters.length} 챕터 · ${meta.desc}</div>
  </header>

  <div class="grid">
${chaptersHtml}
  </div>

  <footer>
    <a href="/">← 전체 인덱스로</a>
  </footer>
</div>
</body>
</html>`;
}

// ============================================================
// 빌드 실행
// ============================================================
function rmrf(p) {
  if (!fs.existsSync(p)) return;
  for (const f of fs.readdirSync(p)) {
    const fp = path.join(p, f);
    if (fs.statSync(fp).isDirectory()) rmrf(fp);
    else fs.unlinkSync(fp);
  }
  fs.rmdirSync(p);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// ============================================================
// 챕터 페이지 상단 nav (모든 과목·챕터 dropdown)
// ============================================================
function buildChapterNavHtml(currentSubjectId, currentChapterFile) {
  const subjectFolder = encodeURIComponent;
  const fileEnc = encodeURIComponent;

  // 옵션 HTML — 6 과목 × 챕터들
  let dropdownHtml = '<div class="vc-nav-dropdown" id="vc-nav-dropdown">';
  for (const s of CONFIG.subjects) {
    const meta = SUBJECT_META[s.id] || { icon: '📚', accent: '#38bdf8' };
    dropdownHtml += `<div class="vc-subj-group" style="--subj-accent:${meta.accent}">`;
    dropdownHtml += `<div class="vc-subj-label">${meta.icon} ${s.name}</div>`;
    for (let i = 0; i < s.chapters.length; i++) {
      const ch = s.chapters[i];
      const folder = ch.file.split('/')[0];
      const fname = ch.file.split('/').pop();
      const href = `/chapters/${fileEnc(folder)}/${fileEnc(fname)}`;
      const isCurrent = (s.id === currentSubjectId && fname === currentChapterFile);
      const activeCls = isCurrent ? ' active' : '';
      dropdownHtml += `<a class="vc-ch-link${activeCls}" href="${href}">CH.${String(i+1).padStart(2,'0')} ${ch.shortTitle}</a>`;
    }
    dropdownHtml += `</div>`;
  }
  dropdownHtml += '</div>';

  const currentMeta = SUBJECT_META[currentSubjectId] || { icon: '📚', accent: '#38bdf8' };
  const currentSubject = CONFIG.subjects.find(s => s.id === currentSubjectId);
  const currentSubjectName = currentSubject ? currentSubject.name : '전공공부';

  // 이전·다음 챕터 계산
  let prevHref = null, nextHref = null, prevTitle = '', nextTitle = '';
  if (currentSubject) {
    const idx = currentSubject.chapters.findIndex(ch => ch.file.split('/').pop() === currentChapterFile);
    if (idx > 0) {
      const p = currentSubject.chapters[idx - 1];
      prevHref = `/chapters/${fileEnc(p.file.split('/')[0])}/${fileEnc(p.file.split('/').pop())}`;
      prevTitle = p.shortTitle;
    }
    if (idx >= 0 && idx < currentSubject.chapters.length - 1) {
      const n = currentSubject.chapters[idx + 1];
      nextHref = `/chapters/${fileEnc(n.file.split('/')[0])}/${fileEnc(n.file.split('/').pop())}`;
      nextTitle = n.shortTitle;
    }
  }

  return `
<style>
.vc-top-nav{position:fixed;top:0;left:0;right:0;height:44px;background:#0a0c10;border-bottom:1px solid #1e2235;display:flex;align-items:center;padding:0 14px;gap:8px;z-index:1000;font-family:'Noto Sans KR',sans-serif;font-size:13px}
.vc-home-btn{display:flex;align-items:center;justify-content:center;width:34px;height:30px;background:transparent;border:1px solid #252840;color:#dce3f0;border-radius:6px;cursor:pointer;text-decoration:none;font-size:15px;transition:all .15s;flex-shrink:0}
.vc-home-btn:hover{background:#13161e;border-color:#3a3f60}
.vc-subj-trigger{display:flex;align-items:center;gap:8px;padding:6px 14px;background:#13161e;border:1px solid #252840;color:#dce3f0;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s;white-space:nowrap;font-family:inherit;height:30px}
.vc-subj-trigger:hover{border-color:${currentMeta.accent}}
.vc-subj-trigger .vc-arrow{font-size:10px;opacity:.7;transition:transform .2s}
.vc-subj-trigger.open .vc-arrow{transform:rotate(180deg)}
.vc-prevnext{display:flex;gap:6px;margin-left:auto;flex-shrink:0}
.vc-pn-btn{padding:6px 14px;background:color-mix(in srgb,${currentMeta.accent} 12%,transparent);border:1px solid color-mix(in srgb,${currentMeta.accent} 35%,transparent);color:${currentMeta.accent};border-radius:6px;cursor:pointer;text-decoration:none;font-size:12.5px;font-weight:600;transition:all .15s;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;height:30px;display:flex;align-items:center;font-family:inherit}
.vc-pn-btn:hover{background:color-mix(in srgb,${currentMeta.accent} 22%,transparent);border-color:${currentMeta.accent}}
.vc-pn-btn.disabled{opacity:.25;pointer-events:none;background:transparent;border-color:#252840;color:#7a8aaa}
.vc-nav-dropdown{display:none;position:fixed;top:44px;left:60px;background:#13161e;border:1px solid #2a3048;border-radius:8px;box-shadow:0 12px 32px rgba(0,0,0,.6);padding:10px;max-height:78vh;overflow-y:auto;z-index:999;min-width:320px;max-width:92vw}
.vc-nav-dropdown.open{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.vc-subj-group{background:#0d0f14;border:1px solid #2a3048;border-radius:6px;padding:10px;border-left:3px solid var(--subj-accent)}
.vc-subj-label{font-size:12.5px;font-weight:700;color:#dce3f0;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #2a3048}
.vc-ch-link{display:block;padding:6px 10px;font-size:12px;color:#9ab;text-decoration:none;border-radius:4px;transition:all .15s;margin-bottom:3px}
.vc-ch-link:hover{background:#1a1e2a;color:#dce3f0}
.vc-ch-link.active{background:color-mix(in srgb,var(--subj-accent) 22%,transparent);color:var(--subj-accent);font-weight:600}
.chapter-nav-label{display:none!important}
@media(max-width:700px){.vc-pn-btn{max-width:90px;font-size:11px;padding:5px 9px}.vc-subj-trigger{font-size:12px;padding:5px 10px}}
</style>
<nav class="vc-top-nav">
  <a class="vc-home-btn" href="/" title="전체 인덱스">🏠</a>
  <button class="vc-subj-trigger" id="vc-subj-trigger" onclick="vcToggleNav()">${currentMeta.icon} ${currentSubjectName} <span class="vc-arrow">▼</span></button>
  <div class="vc-prevnext">
    ${prevHref ? `<a class="vc-pn-btn" href="${prevHref}" title="${prevTitle}">‹ ${prevTitle}</a>` : `<span class="vc-pn-btn disabled">‹</span>`}
    ${nextHref ? `<a class="vc-pn-btn" href="${nextHref}" title="${nextTitle}">${nextTitle} ›</a>` : `<span class="vc-pn-btn disabled">›</span>`}
  </div>
</nav>
${dropdownHtml}
<script>
function vcToggleNav(){
  var dd=document.getElementById('vc-nav-dropdown');
  var t=document.getElementById('vc-subj-trigger');
  var open=dd.classList.toggle('open');
  t.classList.toggle('open',open);
}
document.addEventListener('click',function(e){
  if(!e.target.closest('.vc-subj-trigger') && !e.target.closest('.vc-nav-dropdown')){
    document.getElementById('vc-nav-dropdown').classList.remove('open');
    document.getElementById('vc-subj-trigger').classList.remove('open');
  }
});
</script>
`;
}

// 챕터 HTML에 nav + 편집 기능 주입
function injectChapterFeatures(html, subjectId, chapterFile) {
  const navBlock = buildChapterNavHtml(subjectId, chapterFile);

  // 1. nav를 <body> 직후 삽입
  html = html.replace(/<body([^>]*)>/, `<body$1>${navBlock}`);

  // 2. body padding-top 보정 (기존 body 스타일에 padding-top:44px)
  html = html.replace(
    /body\{background:var\(--bg\);color:var\(--text\);font-family:'Noto Sans KR',sans-serif;font-size:14px;line-height:1\.65;display:flex;flex-direction:column\}/,
    `body{background:var(--bg);color:var(--text);font-family:'Noto Sans KR',sans-serif;font-size:14px;line-height:1.65;display:flex;flex-direction:column;padding-top:44px}`
  );

  // 3. 편집 기능 주입 (lib/merge-engine.js의 injectEditFeatures 재사용)
  try {
    html = injectEditFeatures(html);
  } catch (e) {
    console.log(`    편집 기능 주입 실패: ${e.message}`);
  }

  return html;
}

function copyChapters() {
  console.log('\n=== Phase A: 챕터 HTML 복사 + 후처리 (nav + 편집) ===');
  let count = 0, totalBytes = 0;
  for (const subject of CONFIG.subjects) {
    const subjectFolder = subject.chapters[0].file.split('/')[0];
    const destDir = path.join(CHAPTERS_DIR, subjectFolder);
    ensureDir(destDir);
    for (const ch of subject.chapters) {
      const src = path.join(ROOT, ch.file);
      const filename = ch.file.split('/').pop();
      const dest = path.join(destDir, filename);

      // 복사 + 후처리 (nav + 편집)
      let html = fs.readFileSync(src, 'utf8');
      html = injectChapterFeatures(html, subject.id, filename);
      fs.writeFileSync(dest, html, 'utf8');

      const size = fs.statSync(dest).size;
      totalBytes += size;
      count++;
      console.log(`  ✓ [${subject.id}] ${filename} (${(size / 1024 / 1024).toFixed(1)} MB)`);
    }
  }
  console.log(`\n  총 ${count} 챕터 복사 + nav·편집 주입 완료. 총 크기: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
}

function buildSubjectIndexes() {
  console.log('\n=== Phase B: 과목별 인덱스 생성 ===');
  ensureDir(SUBJECTS_DIR);
  for (const subject of CONFIG.subjects) {
    const html = buildSubjectIndex(subject);
    const dest = path.join(SUBJECTS_DIR, `${subject.id}.html`);
    fs.writeFileSync(dest, html, 'utf8');
    console.log(`  ✓ subjects/${subject.id}.html (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
  }
}

function buildMainIndex() {
  console.log('\n=== Phase C: 전체 인덱스 생성 ===');
  const html = buildIndex();
  const dest = path.join(PUBLIC, 'index.html');
  fs.writeFileSync(dest, html, 'utf8');
  console.log(`  ✓ index.html (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
}

function buildVercelConfig() {
  console.log('\n=== Phase D: vercel.json 생성 ===');
  const vercelJson = {
    cleanUrls: false,
    trailingSlash: false,
    headers: [
      {
        source: '/chapters/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'text/html; charset=utf-8' }
        ]
      },
      {
        source: '/(index|subjects/.*)\\.html',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, must-revalidate' }
        ]
      }
    ]
  };
  const dest = path.join(PUBLIC, 'vercel.json');
  fs.writeFileSync(dest, JSON.stringify(vercelJson, null, 2), 'utf8');
  console.log(`  ✓ vercel.json`);
}

function main() {
  console.log('🚀 build-vercel.js 시작\n');

  if (fs.existsSync(PUBLIC)) {
    console.log(`⚠️  기존 public/ 삭제`);
    rmrf(PUBLIC);
  }
  ensureDir(PUBLIC);

  copyChapters();
  buildSubjectIndexes();
  buildMainIndex();
  buildVercelConfig();

  // 통계
  console.log('\n=== 빌드 완료 ===');
  function dirSize(dir) {
    let total = 0;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isDirectory()) total += dirSize(fp);
      else total += fs.statSync(fp).size;
    }
    return total;
  }
  const total = dirSize(PUBLIC);
  console.log(`  총 크기: ${(total / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  배포: cd public && npx vercel --prod`);
}

main();
