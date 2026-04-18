/**
 * lib/builder.js — HTML 생성 엔진
 *
 * shell_template_v2.html 기반으로:
 * 1. SLIDES_DATA 구성
 * 2. 챕터 HTML 스캐폴딩 생성
 * 3. Claude용 프롬프트 생성
 * 4. 최종 HTML 조립
 */

const fs = require('fs');
const path = require('path');

// ── 템플릿에서 CSS/JS 추출 ──

/**
 * shell_template_v2.html을 읽어 CSS와 JS 엔진 부분을 추출
 * @param {string} templatePath
 * @returns {{css:string, jsEngine:string, fullTemplate:string}}
 */
function readTemplate(templatePath) {
  const content = fs.readFileSync(templatePath, 'utf-8');

  // CSS: <style>...</style> 사이
  const cssMatch = content.match(/<style>([\s\S]*?)<\/style>/);
  const css = cssMatch ? cssMatch[1].trim() : '';

  // JS 엔진: carouselState부터 closeDetail까지 (SLIDES_DATA와 allDetailData 제외)
  // carousel engine + chapter/tab/detail 함수들
  const jsEngineStart = content.indexOf('const carouselState = {};');
  const jsEngineEnd = content.indexOf('// ════════════════════════════════════════\n//  DETAIL PANEL DATA');

  let jsEngine = '';
  if (jsEngineStart !== -1 && jsEngineEnd !== -1) {
    jsEngine = content.substring(jsEngineStart, jsEngineEnd).trim();
  } else {
    // fallback: 전체 JS 블록에서 추출
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      const fullJs = scriptMatch[1];
      const engineStart = fullJs.indexOf('const carouselState');
      const engineEnd = fullJs.indexOf('const allDetailData');
      if (engineStart !== -1 && engineEnd !== -1) {
        jsEngine = fullJs.substring(engineStart, engineEnd).trim();
      }
    }
  }

  return { css, jsEngine, fullTemplate: content };
}

// ── SLIDES_DATA 구성 ──

/**
 * base64 이미지 배열로 SLIDES_DATA JS 블록 생성
 * @param {Array<{base64:string, label:string}>} images - extractor의 imagesToBase64 결과
 * @param {string} chid - 챕터 ID (예: 'ch1')
 * @returns {string} JavaScript SLIDES_DATA 선언문
 */
function buildSlidesData(images, chid = 'ch1') {
  if (!images || images.length === 0) {
    return `const SLIDES_DATA = {\n  ${chid}: [],\n};`;
  }

  const entries = images.map(img => {
    // base64 문자열 내의 작은따옴표 이스케이프
    const safeSrc = img.base64.replace(/'/g, "\\'");
    const safeLabel = (img.label || '').replace(/'/g, "\\'");
    return `    { src: '${safeSrc}', label: '${safeLabel}' }`;
  });

  return `const SLIDES_DATA = {\n  ${chid}: [\n${entries.join(',\n')},\n  ],\n};`;
}

// ── 챕터 HTML 생성 ──

/**
 * 단일 챕터의 HTML 섹션 생성
 * @param {object} config
 * @param {string} config.chid - 챕터 ID ('ch1')
 * @param {string} config.chNum - 챕터 번호 ('01')
 * @param {string} config.title - 챕터 제목
 * @param {string} config.subject - 과목명
 * @param {string} config.accent - accent 색상 (기본 '#38bdf8')
 * @param {Array} config.tabs - 탭 목록 [{id, icon, label, groupLabel?, cards:[{key, title, sub}]}]
 * @returns {string} HTML 문자열
 */
function buildChapterSection(config) {
  const {
    chid = 'ch1',
    chNum = '01',
    title = '챕터 제목',
    subject = '과목명',
    accent = '#38bdf8',
    accent2 = '#a78bfa',
    tabs = []
  } = config;

  // 탭이 없으면 기본 placeholder 탭 생성
  const effectiveTabs = tabs.length > 0 ? tabs : [{
    id: 'main',
    icon: '📖',
    label: '전체 내용',
    cards: [{ key: 'placeholder', title: '내용 준비 중', sub: 'Claude 프롬프트로 콘텐츠를 생성하세요' }]
  }];

  // 사이드바 탭 버튼 생성
  let sidebarHtml = '';
  let currentGroup = null;

  effectiveTabs.forEach((tab, i) => {
    if (tab.groupLabel && tab.groupLabel !== currentGroup) {
      currentGroup = tab.groupLabel;
      sidebarHtml += `        <div class="tab-group-label">${tab.groupLabel}</div>\n`;
    }
    const activeClass = i === 0 ? ' active' : '';
    sidebarHtml += `        <button class="tab-btn${activeClass}" onclick="switchTab('${chid}','${tab.id}',this)"><span class="tab-icon">${tab.icon || '📖'}</span>${tab.label}</button>\n`;
  });

  // 자료 섹션 (캐러셀 토글)
  sidebarHtml += `\n        <div class="tab-group-label" style="margin-top:6px;border-top:1px solid var(--border);padding-top:10px;">자료</div>\n`;
  sidebarHtml += `        <button class="tab-btn carousel-toggle-btn" id="${chid}-carousel-toggle-btn" onclick="toggleCarousel('${chid}')">\n`;
  sidebarHtml += `          <span class="tab-icon">🖼️</span>슬라이드 이미지\n`;
  sidebarHtml += `        </button>\n`;

  // 탭 콘텐츠 (카드) 생성
  let tabContentsHtml = '';
  effectiveTabs.forEach((tab, i) => {
    const activeClass = i === 0 ? ' active' : '';
    let cardsHtml = '';

    if (tab.sectionTitle) {
      cardsHtml += `          <div class="section-title">${tab.sectionTitle}</div>\n`;
    }

    (tab.cards || []).forEach(card => {
      cardsHtml += `          <div class="card" onclick="openDetail('${chid}','${card.key}')">\n`;
      cardsHtml += `            <div class="card-body">\n`;
      cardsHtml += `              <div class="card-title">${card.title}</div>\n`;
      cardsHtml += `              <div class="card-sub">${card.sub || ''}</div>\n`;
      cardsHtml += `            </div>\n`;
      cardsHtml += `            <button class="expand-btn">↗</button>\n`;
      cardsHtml += `          </div>\n`;
    });

    tabContentsHtml += `\n        <div class="tab-content${activeClass}" id="${chid}-tab-${tab.id}">\n`;
    tabContentsHtml += cardsHtml;
    tabContentsHtml += `        </div>\n`;
  });

  return `
<div class="chapter-section active" id="${chid}" style="--ch-accent:${accent};--accent2:${accent2}">
  <div class="ch-header">
    <span class="ch-badge">CH.${chNum}</span>
    <h1>${title}</h1>
    <p>${subject} · 신구대학교 · 2026</p>
  </div>
  <div class="wrapper">

    <nav class="sidebar">
      <div class="sidebar-tabs">
${sidebarHtml}
      </div>
    </nav>

    <div class="main-wrap">
      <div class="cards-area" id="${chid}-cards-area">
${tabContentsHtml}
      </div>

      <div class="carousel-area" id="${chid}-carousel-area">
        <div class="carousel-main" id="${chid}-carousel-main" onclick="openLightbox('${chid}')">
          <button class="carousel-nav prev" onclick="event.stopPropagation();carouselMove('${chid}',-1)">‹</button>
          <img id="${chid}-carousel-img" src="" alt="">
          <div class="carousel-label" id="${chid}-carousel-label"></div>
          <button class="carousel-nav next" onclick="event.stopPropagation();carouselMove('${chid}',1)">›</button>
        </div>
        <div class="carousel-thumbs" id="${chid}-carousel-thumbs"></div>
      </div>
    </div>

    <aside class="detail-panel" id="${chid}-detail-panel">
      <button class="close-btn" onclick="closeDetail('${chid}')">✕ 닫기</button>
      <div id="${chid}-detail-content"></div>
    </aside>

  </div>
</div>`;
}

// ── allDetailData 스캐폴딩 ──

/**
 * allDetailData 스캐폴딩 생성 (placeholder 내용)
 * @param {string} chid
 * @param {Array} tabs - 탭 목록 (카드 key 포함)
 * @returns {string} JavaScript allDetailData 선언문
 */
function buildDetailDataScaffold(chid, tabs) {
  const allKeys = [];
  for (const tab of tabs) {
    for (const card of (tab.cards || [])) {
      allKeys.push(card.key);
    }
  }

  if (allKeys.length === 0) {
    return `const allDetailData = {};\n\nallDetailData['${chid}'] = {\n  placeholder: \`<h2>내용 준비 중</h2>\n<div class="detail-section">\n  <div class="detail-item accent">Claude 프롬프트를 사용하여 콘텐츠를 생성하세요.</div>\n</div>\`,\n};`;
  }

  let entries = allKeys.map(key => {
    return `  ${key}: \`<h2>${key} 상세</h2>\n<div class="detail-section">\n  <h3>핵심 내용</h3>\n  <div class="detail-item accent"><b>TODO:</b> Claude 프롬프트로 생성된 콘텐츠를 여기에 삽입</div>\n</div>\``;
  });

  return `const allDetailData = {};\n\nallDetailData['${chid}'] = {\n\n${entries.join(',\n\n')},\n\n};`;
}

// ── Claude 프롬프트 생성 ──

/**
 * Claude에게 넘길 구조화된 프롬프트 생성
 * @param {string} text - 추출된 PDF 텍스트
 * @param {number} imageCount - 이미지 개수
 * @param {object} meta - { subject, chapter, chid }
 * @returns {string} 프롬프트 텍스트
 */
function buildPrompt(text, imageCount, meta = {}) {
  const { subject = '과목명', chapter = '챕터명', chid = 'ch1' } = meta;

  return `# PDF → 인터랙티브 HTML 스터디 변환 요청

## 과목: ${subject}
## 챕터: ${chapter}
## 챕터ID: ${chid}
## 이미지 수: ${imageCount}개 (이미 SLIDES_DATA에 포함됨)

---

## 당신이 해야 할 일

아래 PDF 텍스트를 분석하여 다음 2가지를 JSON으로 반환하세요:

### 1. tabs 배열 (사이드바 탭 구조)

\`\`\`json
{
  "tabs": [
    {
      "id": "tab_id",
      "icon": "이모지",
      "label": "탭 이름",
      "groupLabel": "섹션 그룹명 (선택)",
      "sectionTitle": "섹션 라벨 (선택)",
      "cards": [
        {
          "key": "unique_key",
          "title": "카드 제목 (핵심 개념명)",
          "sub": "핵심 키워드 · 부제 · 요약 (중간점 구분)"
        }
      ]
    }
  ]
}
\`\`\`

규칙:
- 탭은 3~8개, 논리적 섹션별로 그룹화
- 각 탭의 카드는 3~5개 (핵심 청킹)
- card.key는 영문 snake_case (예: brain_anatomy, risk_factors)
- card.sub는 핵심 키워드를 중간점(·)으로 구분

### 2. detailData 객체 (디테일 패널 HTML)

\`\`\`json
{
  "detailData": {
    "unique_key": "<h2>제목</h2>\\n<div class=\\"detail-section\\">...</div>"
  }
}
\`\`\`

사용 가능한 HTML 컴포넌트:
- \`<div class="detail-item accent|blue|green|red|yellow"><b>항목:</b> 설명</div>\` — 항목별 설명
- \`<table class="detail-table"><tr><th>...</th></tr><tr><td>...</td></tr></table>\` — 비교표
- \`<div class="step-flow"><div class="step-item">단계</div>...</div>\` — 단계별 흐름
- \`<div class="timeline"><div class="tl-item"><span class="tl-label">라벨</span><span class="tl-body">내용</span></div>...</div>\` — 타임라인
- \`<div class="tip-box"><b>팁:</b> 내용</div>\` — 팁 박스
- \`<div class="warn-box"><b>주의:</b> 내용</div>\` — 경고 박스
- \`<span class="tag">태그</span>\` / \`.tag.blue\` / \`.tag.green\` / \`.tag.red\` — 인라인 태그
- \`<div class="detail-section"><h3>소제목</h3>...</div>\` — 섹션 구분

규칙:
- **PDF 내용을 빠짐없이 전부 수록** — 요약이 아닌 전수 기록
- 새해부학 용어 사용 (비복근→장딴지근, 승모근→등세모근 등)
- 각 detail-item에는 \`<b>핵심어:</b>\` 형태로 시작
- 비교가 필요한 내용은 detail-table 사용
- 단계/순서가 있으면 step-flow 사용
- 임상 팁은 tip-box, 주의사항은 warn-box 사용

---

## PDF 텍스트 (전체)

\`\`\`
${text}
\`\`\`

---

위 텍스트를 분석하여 JSON 형식으로 tabs와 detailData를 반환하세요.
반드시 \`\`\`json ... \`\`\` 코드 블록으로 감싸서 반환하세요.`;
}

// ── 최종 HTML 조립 ──

/**
 * 전체 HTML 파일 조립
 * @param {object} config
 * @param {string} config.css - CSS 문자열
 * @param {string} config.jsEngine - JS 캐러셀 엔진 + 네비게이션 함수
 * @param {string} config.chapterNav - chapter-nav HTML
 * @param {string} config.chapterSection - chapter-section HTML
 * @param {string} config.slidesData - SLIDES_DATA JS 블록
 * @param {string} config.detailData - allDetailData JS 블록
 * @param {string} config.title - <title> 텍스트
 * @returns {string} 완성된 HTML
 */
function assembleHTML(config) {
  const {
    css,
    jsEngine,
    chapterNav,
    chapterSection,
    slidesData,
    detailData,
    title = '스터디 파일'
  } = config;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
${css}
</style>
</head>
<body>

${chapterNav}

${chapterSection}

<!-- 라이트박스 (전역) -->
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()">✕ 닫기</button>
  <img id="lightbox-img" src="" alt="">
  <div class="lightbox-label" id="lightbox-label"></div>
</div>


<script>
// ════════════════════════════════════════
//  CAROUSEL DATA
// ════════════════════════════════════════
${slidesData}

// ════════════════════════════════════════
//  CAROUSEL ENGINE + NAVIGATION
// ════════════════════════════════════════
${jsEngine}

// ════════════════════════════════════════
//  DETAIL PANEL DATA
// ════════════════════════════════════════
${detailData}

</script>
</body>
</html>`;
}

/**
 * chapter-nav 바 HTML 생성
 * @param {string} subject - 과목명
 * @param {Array} chapters - [{chid, chNum, shortTitle, accent}]
 * @returns {string}
 */
function buildChapterNav(subject, chapters) {
  let buttons = chapters.map((ch, i) => {
    const active = i === 0 ? ' active' : '';
    return `  <button class="ch-btn${active}" onclick="switchChapter('${ch.chid}')" data-ch="${ch.chid}" style="--ch-accent:${ch.accent || '#38bdf8'}">CH.${ch.chNum} ${ch.shortTitle}</button>`;
  }).join('\n');

  return `<div class="chapter-nav">\n  <span class="chapter-nav-label">${subject}</span>\n${buttons}\n</div>`;
}

module.exports = {
  readTemplate,
  buildSlidesData,
  buildChapterSection,
  buildDetailDataScaffold,
  buildPrompt,
  assembleHTML,
  buildChapterNav
};
