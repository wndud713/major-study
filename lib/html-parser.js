'use strict';
/**
 * lib/html-parser.js
 * 개별 HTML 스터디 파일을 파싱하여 정규화된 챕터 데이터를 추출
 *
 * 지원 변형:
 *   standard — SLIDES_DATA + allDetailData (대부분 파일)
 *   legacy   — CAROUSEL_IMGS + DETAILS (뇌졸중 1~3)
 *   hka      — main- prefix IDs, no chapter-section wrapper (HKA)
 */

const fs = require('fs');

// ─── 변형 감지 ────────────────────────────────────────────────────────────

function detectVariant(content) {
  if (content.includes('const CAROUSEL_IMGS')) return 'legacy';
  if (!content.includes('<div class="chapter-section')) return 'hka';
  return 'standard';
}

// ─── 색상 추출 ────────────────────────────────────────────────────────────

function extractAccents(content) {
  // chapter-section style 속성에서 추출
  const csM = content.match(/<div class="chapter-section[^>]+style="([^"]+)"/);
  const styleStr = csM ? csM[1] : content;
  const accentM = styleStr.match(/--ch-accent:\s*([#\w]+)/);
  const accent2M = styleStr.match(/--accent2:\s*([#\w]+)/);
  return {
    accent: accentM ? accentM[1].trim() : '#38bdf8',
    accent2: accent2M ? accent2M[1].trim() : '#a78bfa'
  };
}

// ─── 챕터 ID 추출 ─────────────────────────────────────────────────────────

function extractSrcChId(content) {
  const m = content.match(/<div class="chapter-section[^>]+id="(ch\d+)"/);
  return m ? m[1] : 'ch1';
}

// ─── 제목 추출 ────────────────────────────────────────────────────────────

function extractTitle(content, variant) {
  if (variant === 'hka') {
    const m = content.match(/<span class="top-title">([^<]+)<\/span>/);
    return m ? m[1].trim() : 'HKA Assessment';
  }
  // Standard/Legacy: ch-header h1
  const m = content.match(/<h1>([^<]+)<\/h1>/);
  return m ? m[1].trim() : '제목 없음';
}

// ─── Depth 파서 ───────────────────────────────────────────────────────────

/**
 * startIdx 위치의 '{' 부터 대응하는 '}' 까지 추출
 */
function findBraceBlock(content, startIdx) {
  let depth = 0, inStr = false, strCh = '', i = startIdx;
  let start = -1, end = -1;
  while (i < content.length) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
      else if (ch === '`') { inStr = true; strCh = '`'; }
      else if (ch === '{') { depth++; if (start === -1) start = i; }
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    i++;
  }
  if (start === -1 || end === -1) return null;
  return { start, end, raw: content.substring(start, end + 1) };
}

/**
 * startIdx 위치의 '[' 부터 대응하는 ']' 까지 추출
 */
function findBracketBlock(content, startIdx) {
  let depth = 0, inStr = false, strCh = '', i = startIdx;
  let start = -1, end = -1;
  while (i < content.length) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
      else if (ch === '`') { inStr = true; strCh = '`'; }
      else if (ch === '[') { depth++; if (start === -1) start = i; }
      else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
    }
    i++;
  }
  if (start === -1 || end === -1) return null;
  return { start, end, raw: content.substring(start, end + 1) };
}

// ─── 슬라이드 추출 ────────────────────────────────────────────────────────

/**
 * 슬라이드 배열 Raw 문자열 추출 ('[...]')
 * base64 포함이므로 파싱하지 않고 Raw 문자열로 반환
 */
function extractSlidesRaw(content, variant, srcChId) {
  if (variant === 'hka') return '[]';

  if (variant === 'legacy') {
    const idx = content.indexOf('const CAROUSEL_IMGS');
    if (idx === -1) return '[]';
    const bracketStart = content.indexOf('[', idx);
    if (bracketStart === -1) return '[]';
    const block = findBracketBlock(content, bracketStart);
    // CAROUSEL_IMGS는 {src, label} 형식이나 label 없을 수 있음
    // 그대로 반환 (src/label 키 형식은 standard와 동일)
    return block ? block.raw : '[]';
  }

  // Standard: SLIDES_DATA = { chId: [...] }
  const slidesIdx = content.indexOf('SLIDES_DATA');
  if (slidesIdx === -1) return '[]';
  const outerBrace = content.indexOf('{', slidesIdx);
  if (outerBrace === -1) return '[]';
  const outerBlock = findBraceBlock(content, outerBrace);
  if (!outerBlock) return '[]';

  // srcChId 키의 배열 찾기
  const innerStr = outerBlock.raw;
  // 'ch1:' 또는 'ch1 :' 또는 ch1: 패턴
  const chIdRe = new RegExp(srcChId + '\\s*:');
  const chIdMatch = chIdRe.exec(innerStr);
  if (!chIdMatch) return '[]';
  const bracketStart = innerStr.indexOf('[', chIdMatch.index);
  if (bracketStart === -1) return '[]';
  const innerBracket = findBracketBlock(innerStr, bracketStart);
  return innerBracket ? innerBracket.raw : '[]';
}

// ─── 디테일 데이터 추출 ──────────────────────────────────────────────────

/**
 * 디테일 데이터를 표준 형식으로 추출
 * Returns: { type: 'raw'|'parsed', value: string|object }
 *   raw: 직접 allDetailData['chN'] = RAW 으로 삽입 가능한 '{...}' 문자열
 *   parsed: { key: htmlString } 객체 (legacy/hka에서 변환된 것)
 */
function extractDetailData(content, variant, srcChId) {
  if (variant === 'standard') {
    // 패턴 1: allDetailData['chId'] = { ... }  (가장 일반적)
    for (const q of ["'", '"']) {
      const pat = `allDetailData[${q}${srcChId}${q}]`;
      const idx = content.indexOf(pat);
      if (idx !== -1) {
        const braceStart = content.indexOf('{', idx);
        if (braceStart === -1) continue;
        const block = findBraceBlock(content, braceStart);
        if (block) return { type: 'raw', value: block.raw };
      }
    }

    // 패턴 2: const allDetailData = { chId: { ... } }
    const constIdx = content.indexOf('const allDetailData');
    if (constIdx !== -1) {
      const outerBrace = content.indexOf('{', constIdx);
      if (outerBrace !== -1) {
        const outer = findBraceBlock(content, outerBrace);
        if (outer) {
          // outer.raw = '{ ch3: { ... } }'
          // srcChId 키 찾기
          const chKeyRe = new RegExp(srcChId + '\\s*:');
          const m = chKeyRe.exec(outer.raw);
          if (m) {
            const innerBrace = outer.raw.indexOf('{', m.index);
            if (innerBrace !== -1) {
              const inner = findBraceBlock(outer.raw, innerBrace);
              if (inner) return { type: 'raw', value: inner.raw };
            }
          }
        }
      }
    }

    return { type: 'raw', value: '{}' };
  }

  if (variant === 'legacy') {
    // const DETAILS = { key: { title: '...', html: `...` } }
    const detIdx = content.indexOf('const DETAILS');
    if (detIdx === -1) return { type: 'parsed', value: {} };
    const braceStart = content.indexOf('{', detIdx);
    if (braceStart === -1) return { type: 'parsed', value: {} };
    const block = findBraceBlock(content, braceStart);
    if (!block) return { type: 'parsed', value: {} };

    try {
      // Function constructor로 안전하게 평가
      const DETAILS = Function('"use strict"; return (' + block.raw + ')')();
      const result = {};
      for (const [key, val] of Object.entries(DETAILS)) {
        // {title, html} → '<h2>title</h2>html'
        const title = (val.title || '').trim();
        const html = (val.html || '').trim();
        result[key] = title ? `<h2>${title}</h2>${html}` : html;
      }
      return { type: 'parsed', value: result };
    } catch (e) {
      console.error(`  [WARN] DETAILS 파싱 실패: ${e.message}`);
      return { type: 'parsed', value: {} };
    }
  }

  if (variant === 'hka') {
    // const DETAIL = { key: `html` }
    const detIdx = content.indexOf('const DETAIL ');
    if (detIdx === -1) return { type: 'parsed', value: {} };
    const braceStart = content.indexOf('{', detIdx);
    if (braceStart === -1) return { type: 'parsed', value: {} };
    const block = findBraceBlock(content, braceStart);
    if (!block) return { type: 'parsed', value: {} };

    try {
      const DETAIL = Function('"use strict"; return (' + block.raw + ')')();
      return { type: 'parsed', value: DETAIL };
    } catch (e) {
      console.error(`  [WARN] DETAIL 파싱 실패: ${e.message}`);
      return { type: 'parsed', value: {} };
    }
  }

  return { type: 'raw', value: '{}' };
}

// ─── 챕터 섹션 HTML 추출 ─────────────────────────────────────────────────

function extractChapterSectionHtml(content, variant) {
  if (variant === 'hka') {
    // <body> 이후 ~ lightbox 이전
    const bodyStart = content.indexOf('<body>') + 6;
    const lightboxStart = content.indexOf('\n<!-- Lightbox');
    if (lightboxStart === -1) {
      const lb2 = content.indexOf('<div class="lightbox"');
      const end = lb2 !== -1 ? lb2 : content.indexOf('<script>');
      return content.substring(bodyStart, end).trim();
    }
    return content.substring(bodyStart, lightboxStart).trim();
  }

  // Standard/Legacy: <div class="chapter-section" ~ before lightbox
  const csStart = content.indexOf('<div class="chapter-section');
  if (csStart === -1) return '';
  const lightboxStart = content.indexOf('<div class="lightbox"');
  const end = lightboxStart !== -1 ? lightboxStart : content.indexOf('<script>');
  return content.substring(csStart, end).trim();
}

// ─── 디테일 데이터 직렬화 ────────────────────────────────────────────────

/**
 * parsed {key: htmlString} 객체를 raw JS 오브젝트 문자열로 직렬화
 * backtick 이스케이프 처리
 */
function serializeDetailEntries(entries) {
  const lines = Object.entries(entries).map(([key, html]) => {
    // backtick, ${...} 이스케이프
    const escaped = html
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    return `  ${key}: \`${escaped}\``;
  });
  return '{\n' + lines.join(',\n\n') + '\n}';
}

// ─── HTML 정규화 + 리매핑 ─────────────────────────────────────────────────

/**
 * 챕터 섹션 HTML 정규화:
 * - legacy: ch1-detail" → ch1-detail-panel"
 * - hka: main- 접두사 → targetChId-, 함수 호출 변환, chapter-section 래핑
 * - standard/legacy: srcChId → targetChId 전체 교체
 */
function normalizeChapterHtml(html, variant, srcChId, targetChId, accent, accent2, title) {
  let result = html;

  if (variant === 'legacy') {
    // detail panel ID 정규화: -detail" → -detail-panel"
    // -detail-content"는 유지 (already correct)
    result = result.replace(
      new RegExp(`(id="${srcChId})-detail"`, 'g'),
      `$1-detail-panel"`
    );
    // carousel-area ID 정규화: id="ch1-carousel" → id="ch1-carousel-area"
    // (legacy는 -area 없이 -carousel만 사용; template JS는 -carousel-area 필요)
    result = result.replace(
      new RegExp(`id="${srcChId}-carousel"`, 'g'),
      `id="${srcChId}-carousel-area"`
    );
  }

  if (variant === 'hka') {
    const ch = targetChId;

    // main- 접두사 ID → chN-
    const mainIds = [
      'carousel-toggle-btn', 'cards-area', 'carousel-area',
      'carousel-main', 'carousel-img', 'carousel-label',
      'carousel-thumbs', 'detail-panel', 'detail-content'
    ];
    for (const id of mainIds) {
      result = result.replaceAll(`id="main-${id}"`, `id="${ch}-${id}"`);
      result = result.replaceAll(`'main-${id}'`, `'${ch}-${id}'`);
    }

    // tab- 접두사 탭 콘텐츠 ID → chN-tab-
    result = result.replace(/id="tab-/g, `id="${ch}-tab-`);

    // 함수 호출 변환
    result = result
      // switchTab('tabId', this) → switchTab('chN', 'tabId', this)
      .replace(/switchTab\('([^']+)',\s*this\)/g, `switchTab('${ch}', '$1', this)`)
      // openDetail('key') → openDetail('chN', 'key')
      .replace(/openDetail\('([^']+)'\)/g, `openDetail('${ch}', '$1')`)
      // closeDetail() → closeDetail('chN')
      .replace(/closeDetail\(\)/g, `closeDetail('${ch}')`)
      // toggleCarousel() → toggleCarousel('chN')
      .replace(/toggleCarousel\(\)/g, `toggleCarousel('${ch}')`)
      // carouselMove('main', dir) → carouselMove('chN', dir)
      .replace(/carouselMove\('main',/g, `carouselMove('${ch}',`)
      // openLightbox('main') → openLightbox('chN')
      .replace(/openLightbox\('main'\)/g, `openLightbox('${ch}')`);

    // chapter-section 래핑
    const chHeader = [
      `<div class="chapter-section" id="${ch}" style="--ch-accent:${accent};--accent2:${accent2}">`,
      `  <div class="ch-header">`,
      `    <span class="ch-badge">${ch.toUpperCase()}</span>`,
      `    <h1>${title}</h1>`,
      `    <p>스포츠물리치료학 · 신구대학교 · 2026</p>`,
      `  </div>`
    ].join('\n');

    result = chHeader + '\n' + result + '\n</div>';
    return result; // srcChId 리매핑 불필요
  }

  // Standard/Legacy: srcChId → targetChId (HTML 부분만, base64 없음)
  if (srcChId !== targetChId) {
    result = result.replaceAll(srcChId, targetChId);
  }

  return result;
}

// ─── 메인 파서 ────────────────────────────────────────────────────────────

/**
 * HTML 파일을 파싱하여 정규화된 챕터 데이터 반환
 *
 * @param {string} filePath
 * @returns {{
 *   filePath: string,
 *   variant: 'standard'|'legacy'|'hka',
 *   srcChId: string,
 *   accent: string,
 *   accent2: string,
 *   title: string,
 *   chapterSectionHtml: string,    // 원본 (리매핑 전)
 *   slidesRaw: string,             // '[...]' 슬라이드 배열
 *   detailData: {type, value}      // 디테일 데이터
 * }}
 */
function parseHtmlFile(filePath) {
  console.log(`  Parsing: ${filePath.split('/').pop() || filePath.split('\\').pop()}`);
  const content = fs.readFileSync(filePath, 'utf8');

  const variant = detectVariant(content);
  const { accent, accent2 } = extractAccents(content);
  const srcChId = variant === 'hka' ? 'ch1' : extractSrcChId(content);
  const title = extractTitle(content, variant);
  const chapterSectionHtml = extractChapterSectionHtml(content, variant);
  const slidesRaw = extractSlidesRaw(content, variant, srcChId);
  const detailData = extractDetailData(content, variant, srcChId);

  const slideCount = (slidesRaw.match(/"?src"?\s*:/g) || []).length;
  const detailCount = detailData.type === 'parsed'
    ? Object.keys(detailData.value).length
    : (detailData.value.match(/^\s+\w+:/mg) || []).length;

  console.log(`    variant=${variant} srcChId=${srcChId} slides=${slideCount} details=${detailCount} accent=${accent}`);

  return {
    filePath,
    variant,
    srcChId,
    accent,
    accent2,
    title,
    chapterSectionHtml,
    slidesRaw,
    detailData
  };
}

/**
 * 파싱된 챕터를 targetChId로 리매핑하여 병합 준비된 데이터 반환
 *
 * @param {object} parsed - parseHtmlFile() 반환값
 * @param {string} targetChId - 대상 챕터 ID (예: 'ch3')
 * @param {boolean} isFirst - 첫 번째 챕터 여부 (active 클래스)
 * @returns {{
 *   chId: string,
 *   chapterSectionHtml: string,   // 리매핑 완료된 HTML
 *   slidesRaw: string,
 *   detailRaw: string,            // allDetailData['chN'] = {...} 에 넣을 '{...}' 문자열
 *   accent: string,
 *   title: string
 * }}
 */
function remapChapter(parsed, targetChId, isFirst = false) {
  const { variant, srcChId, accent, accent2, title, chapterSectionHtml, slidesRaw, detailData } = parsed;

  // HTML 정규화 + 리매핑
  let html = normalizeChapterHtml(
    chapterSectionHtml, variant, srcChId, targetChId, accent, accent2, title
  );

  // active 클래스 처리
  if (!isFirst) {
    html = html.replace('class="chapter-section active"', 'class="chapter-section"');
  } else {
    // 첫 번째인데 active 없으면 추가
    if (!html.includes('chapter-section active')) {
      html = html.replace('class="chapter-section"', 'class="chapter-section active"');
    }
  }

  // 디테일 Raw 문자열 생성
  let detailRaw;
  if (detailData.type === 'raw') {
    detailRaw = detailData.value;
  } else {
    // parsed → serialize
    detailRaw = serializeDetailEntries(detailData.value);
  }

  return {
    chId: targetChId,
    chapterSectionHtml: html,
    slidesRaw,
    detailRaw,
    accent,
    title
  };
}

module.exports = { parseHtmlFile, remapChapter, detectVariant };
