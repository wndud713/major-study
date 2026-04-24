// QA: 신경계질환별물리치료 3 파일 structural audit (prestruct-v4 대비)
// 수정 없이 읽기만. 보고서 stdout 출력.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';
const FILES = [
  { name: '파킨슨병', curr: `${BASE}/파킨슨병.html`, prev: `${BASE}/파킨슨병.html.prestruct-v4`, expectedSlides: 35 },
  { name: '외상성뇌손상_TBI', curr: `${BASE}/외상성뇌손상_TBI.html`, prev: `${BASE}/외상성뇌손상_TBI.html.prestruct-v4`, expectedSlides: 54 },
  { name: 'SOAP_note_TBI', curr: `${BASE}/SOAP_note_TBI.html`, prev: `${BASE}/SOAP_note_TBI.html.prestruct-v4`, expectedSlides: 15 },
];

function divNestingCheck(html) {
  let depth = 0, line = 1, maxDepth = 0;
  const keyEvents = [];
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '\n') line++;
    if (html.substr(i, 4) === '<div') {
      const end = html.indexOf('>', i);
      if (end === -1) break;
      depth++;
      if (depth > maxDepth) maxDepth = depth;
      const frag = html.substring(i, end + 1);
      if (/(cards-area|main-wrap|carousel-area|wrapper|chapter-section|aside|detail-panel)/.test(frag)) {
        keyEvents.push(`L${line} OPEN d${depth}: ${frag.substring(0, 90)}`);
      }
      i = end;
    } else if (html.substr(i, 6) === '</div>') {
      keyEvents.push(`L${line} CLOSE d${depth}`);
      depth--;
      i += 5;
    }
  }
  return { finalDepth: depth, maxDepth, keyEvents };
}

function countCards(html) {
  // card onclick="openDetail('key')" or data-detail-key
  const re = /class="[^"]*\bcard\b[^"]*"[^>]*onclick="openDetail\('([^']+)'/g;
  const keys = new Set();
  const all = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    all.push(m[1]);
    keys.add(m[1]);
  }
  return { total: all.length, unique: keys.size, keys: [...keys], duplicates: all.length - keys.size };
}

function extractTabs(html) {
  // data-tab-btn or tab button with switchTab('ch1','tabId')
  const re = /switchTab\('([^']+)',\s*'([^']+)'\)/g;
  const tabs = new Map(); // chId -> Set(tabId)
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!tabs.has(m[1])) tabs.set(m[1], new Set());
    tabs.get(m[1]).add(m[2]);
  }
  return tabs;
}

function extractAllDetailDataKeys(html) {
  // find allDetailData = { ... } — return keys (top-level)
  const m = /allDetailData\s*=\s*\{/.exec(html);
  if (!m) return { found: false, keys: [] };
  const braceStart = m.index + m[0].length - 1;
  let depth = 0, inStr = false, strCh = '', escape = false, endBrace = -1;
  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (inStr) {
      if (ch === '\\') { escape = true; continue; }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
  }
  if (endBrace === -1) return { found: true, keys: [], error: 'unclosed' };
  const block = html.substring(braceStart + 1, endBrace);

  // Walk top-level keys: key: `...`
  const keys = [];
  let d = 0, inS = false, sCh = '', esc = false;
  let i = 0;
  while (i < block.length) {
    const ch = block[i];
    if (esc) { esc = false; i++; continue; }
    if (inS) {
      if (ch === '\\') { esc = true; i++; continue; }
      if (ch === sCh) inS = false;
      i++; continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inS = true; sCh = ch; i++; continue; }
    if (ch === '{' || ch === '[' || ch === '(') { d++; i++; continue; }
    if (ch === '}' || ch === ']' || ch === ')') { d--; i++; continue; }
    if (d === 0) {
      // search for key token
      const mm = /^\s*([A-Za-z0-9_\-]+|"[^"]+"|'[^']+')\s*:/.exec(block.substring(i));
      if (mm) {
        let k = mm[1];
        if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1);
        keys.push(k);
        i += mm[0].length;
        continue;
      }
    }
    i++;
  }
  return { found: true, keys, blockLen: endBrace - braceStart };
}

function extractSlidesData(html) {
  const m = /SLIDES_DATA\s*=\s*\{/.exec(html);
  if (!m) return { found: false };
  const braceStart = m.index + m[0].length - 1;
  let depth = 0, inStr = false, strCh = '', escape = false, endBrace = -1;
  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (inStr) {
      if (ch === '\\') { escape = true; continue; }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
  }
  if (endBrace === -1) return { found: true, error: 'unclosed' };
  const block = html.substring(braceStart, endBrace + 1);
  // Count src: occurrences
  const srcCount = (block.match(/\bsrc\s*:/g) || []).length;
  const labelCount = (block.match(/\blabel\s*:/g) || []).length;
  // top-level chapter keys
  const chRe = /^\s*(ch\d+)\s*:\s*\[/gm;
  const chKeys = [];
  let mm;
  while ((mm = chRe.exec(block)) !== null) chKeys.push(mm[1]);
  return { found: true, srcCount, labelCount, chKeys, blockLen: block.length };
}

function extractScripts(html) {
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const openTag = html.substring(m.index, m.index + m[0].indexOf('>') + 1);
    if (/\bsrc\s*=/.test(openTag)) continue; // external
    scripts.push(m[1]);
  }
  return scripts;
}

function scriptSyntaxCheck(scripts) {
  const res = [];
  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    if (s.trim().length < 5) { res.push({ i, len: s.length, ok: true, skipped: true }); continue; }
    try {
      new vm.Script(s, { filename: `script-${i}.js` });
      res.push({ i, len: s.length, ok: true });
    } catch (e) {
      res.push({ i, len: s.length, ok: false, err: e.message, head: s.substring(0, 200) });
    }
  }
  return res;
}

function countToggleAccordion(html) {
  const onclicks = (html.match(/toggleAccordion\(/g) || []).length;
  const parents = (html.match(/\baccordion-parent\b/g) || []).length;
  const children = (html.match(/\baccordion-children\b/g) || []).length;
  const defined = /function\s+toggleAccordion\s*\(/.test(html);
  return { onclicks, parents, children, defined };
}

function countCarouselFuncs(html) {
  const fns = ['initCarousel', 'goTo', 'carouselMove', 'toggleCarousel', 'openLightbox', 'closeLightbox', 'switchChapter', 'switchTab', 'openDetail', 'closeDetail'];
  const result = {};
  for (const fn of fns) {
    const def = new RegExp(`function\\s+${fn}\\s*\\(`).test(html);
    const calls = (html.match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length;
    result[fn] = { defined: def, calls };
  }
  return result;
}

function audit(fileSpec) {
  const out = { file: fileSpec.name, path: fileSpec.curr };
  const curr = fs.readFileSync(fileSpec.curr, 'utf8');
  const prev = fs.existsSync(fileSpec.prev) ? fs.readFileSync(fileSpec.prev, 'utf8') : null;

  // 1. Nesting
  const nestCurr = divNestingCheck(curr);
  out.nesting = { finalDepth: nestCurr.finalDepth, maxDepth: nestCurr.maxDepth };
  if (prev) {
    const nestPrev = divNestingCheck(prev);
    out.nesting.prevFinalDepth = nestPrev.finalDepth;
    out.nesting.prevMaxDepth = nestPrev.maxDepth;
  }
  // key events tail (last 30 for context)
  out.nestingTail = nestCurr.keyEvents.slice(-40);

  // 2. Scripts syntax
  const scripts = extractScripts(curr);
  out.scriptCount = scripts.length;
  out.scriptResults = scriptSyntaxCheck(scripts);

  // 3. SLIDES_DATA
  out.slides = extractSlidesData(curr);
  out.slidesExpected = fileSpec.expectedSlides;
  if (prev) {
    const pSlides = extractSlidesData(prev);
    out.slidesPrev = { srcCount: pSlides.srcCount, chKeys: pSlides.chKeys };
  }

  // 4. Cards
  out.cards = countCards(curr);
  if (prev) out.cardsPrev = countCards(prev);

  // 5. Tabs
  const tabs = extractTabs(curr);
  out.tabs = {};
  for (const [ch, ts] of tabs) out.tabs[ch] = [...ts];
  if (prev) {
    const pt = extractTabs(prev);
    out.tabsPrev = {};
    for (const [ch, ts] of pt) out.tabsPrev[ch] = [...ts];
  }

  // 6. allDetailData
  const dd = extractAllDetailDataKeys(curr);
  out.detailData = { found: dd.found, keyCount: dd.keys.length };
  if (prev) {
    const pdd = extractAllDetailDataKeys(prev);
    out.detailDataPrev = { found: pdd.found, keyCount: pdd.keys.length };
  }

  // 7. Matching cards ↔ detail
  if (dd.found) {
    const detailSet = new Set(dd.keys);
    const cardSet = new Set(out.cards.keys);
    const orphanCards = [...cardSet].filter(k => !detailSet.has(k));
    const orphanDetails = [...detailSet].filter(k => !cardSet.has(k));
    out.match = { orphanCards, orphanDetails, orphanCardCount: orphanCards.length, orphanDetailCount: orphanDetails.length };
  }

  // 8. Accordion / summary tables
  out.accordion = countToggleAccordion(curr);
  if (prev) out.accordionPrev = countToggleAccordion(prev);

  // 9. Carousel functions
  out.carousel = countCarouselFuncs(curr);

  // 10. File size
  out.size = fs.statSync(fileSpec.curr).size;
  if (prev) out.sizePrev = fs.statSync(fileSpec.prev).size;

  return out;
}

const results = FILES.map(audit);
console.log(JSON.stringify(results, null, 2));
