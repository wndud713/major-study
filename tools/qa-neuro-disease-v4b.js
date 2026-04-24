// QA v4b: dual-action(ROM) 패턴 — toggleCardExpand + card-expand-wrap + allDetailData
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';
const FILES = [
  { name: '파킨슨병', curr: `${BASE}/파킨슨병.html`, prev: `${BASE}/파킨슨병.html.prestruct-v4`, expectedSlides: 35 },
  { name: '외상성뇌손상_TBI', curr: `${BASE}/외상성뇌손상_TBI.html`, prev: `${BASE}/외상성뇌손상_TBI.html.prestruct-v4`, expectedSlides: 54 },
  { name: 'SOAP_note_TBI', curr: `${BASE}/SOAP_note_TBI.html`, prev: `${BASE}/SOAP_note_TBI.html.prestruct-v4`, expectedSlides: 15 },
];

function divNesting(html) {
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
      if (/(cards-area|main-wrap|carousel-area|wrapper|chapter-section|detail-panel|tab-content)/.test(frag)) {
        keyEvents.push({ line, op: 'OPEN', d: depth, frag: frag.substring(0, 100) });
      }
      i = end;
    } else if (html.substr(i, 6) === '</div>') {
      keyEvents.push({ line, op: 'CLOSE', d: depth });
      depth--;
      i += 5;
    }
  }
  return { finalDepth: depth, maxDepth, keyEvents };
}

function countCards(html) {
  const re = /class="card"[^>]*onclick="toggleCardExpand\(\s*this\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)"/g;
  const all = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    all.push({ ch: m[1], key: m[2] });
  }
  const keySet = new Set(all.map(x => x.key));
  const dups = {};
  const seen = {};
  all.forEach(x => { if (seen[x.key]) dups[x.key] = (dups[x.key] || 1) + 1; seen[x.key] = true; });
  return { total: all.length, unique: keySet.size, keys: [...keySet], duplicates: Object.keys(dups), all };
}

function countExpandWraps(html) {
  const count = (html.match(/class="[^"]*\bcard-expand-wrap\b/g) || []).length;
  return count;
}

function extractTabs(html) {
  // tab-btn with switchTab + actual tab-content id
  const btnRe = /onclick="switchTab\('([^']+)',\s*'([^']+)'\)"/g;
  const tabBtns = new Map();
  let m;
  while ((m = btnRe.exec(html)) !== null) {
    if (!tabBtns.has(m[1])) tabBtns.set(m[1], new Set());
    tabBtns.get(m[1]).add(m[2]);
  }
  // tab-content id="{ch}-tab-{id}"
  const tcRe = /id="(ch\d+)-tab-([^"]+)"/g;
  const tabContents = new Map();
  while ((m = tcRe.exec(html)) !== null) {
    if (!tabContents.has(m[1])) tabContents.set(m[1], new Set());
    tabContents.get(m[1]).add(m[2]);
  }
  return { tabBtns, tabContents };
}

function extractAllDetailData(html) {
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
  // Parse: two-level object? allDetailData = { ch1: { key: `...`, key2: `...` } }  OR  allDetailData = { key: `...`, ... }
  const keys = [];
  let d = 0, inS = false, sCh = '', esc = false;
  const outer = [];
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
      const mm = /^\s*([A-Za-z0-9_\-]+|"[^"]+"|'[^']+')\s*:/.exec(block.substring(i));
      if (mm) {
        let k = mm[1];
        if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1);
        outer.push(k);
        i += mm[0].length;
        continue;
      }
    }
    i++;
  }
  // Detect if outer keys are chapter ids like ch1/ch2 only; if so, dive into each
  const chOnly = outer.length > 0 && outer.every(k => /^ch\d+$/.test(k));
  if (chOnly) {
    // reparse: for each chN: { subkeys }
    // Simpler: for each chN: {...}, scan block to find balanced sub
    for (const chKey of outer) {
      const reCh = new RegExp('(^|[{,\\s])' + chKey + '\\s*:\\s*\\{');
      const mCh = reCh.exec(block);
      if (!mCh) continue;
      let subStart = mCh.index + mCh[0].length - 1; // at {
      let sd = 0, si = false, sch = '', se = false, subEnd = -1;
      for (let j = subStart; j < block.length; j++) {
        const c = block[j];
        if (se) { se = false; continue; }
        if (si) { if (c === '\\') { se = true; continue; } if (c === sch) si = false; continue; }
        if (c === '"' || c === "'" || c === '`') { si = true; sch = c; continue; }
        if (c === '{') sd++;
        else if (c === '}') { sd--; if (sd === 0) { subEnd = j; break; } }
      }
      if (subEnd === -1) continue;
      const sub = block.substring(subStart + 1, subEnd);
      // parse keys from sub
      let ii = 0, dd2 = 0, iss = false, scc = '', es2 = false;
      while (ii < sub.length) {
        const c = sub[ii];
        if (es2) { es2 = false; ii++; continue; }
        if (iss) { if (c === '\\') { es2 = true; ii++; continue; } if (c === scc) iss = false; ii++; continue; }
        if (c === '"' || c === "'" || c === '`') { iss = true; scc = c; ii++; continue; }
        if (c === '{' || c === '[' || c === '(') { dd2++; ii++; continue; }
        if (c === '}' || c === ']' || c === ')') { dd2--; ii++; continue; }
        if (dd2 === 0) {
          const mm2 = /^\s*([A-Za-z0-9_\-]+|"[^"]+"|'[^']+')\s*:/.exec(sub.substring(ii));
          if (mm2) {
            let k = mm2[1];
            if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1);
            keys.push({ ch: chKey, key: k });
            ii += mm2[0].length;
            continue;
          }
        }
        ii++;
      }
    }
    return { found: true, structured: true, chapters: outer, keys };
  } else {
    return { found: true, structured: false, keys: outer.map(k => ({ ch: 'root', key: k })) };
  }
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
  const srcCount = (block.match(/\bsrc\s*:/g) || []).length;
  const labelCount = (block.match(/\blabel\s*:/g) || []).length;
  const chRe = /^\s*(ch\d+)\s*:\s*\[/gm;
  const chKeys = [];
  let mm;
  while ((mm = chRe.exec(block)) !== null) chKeys.push(mm[1]);
  return { found: true, srcCount, labelCount, chKeys };
}

function extractScripts(html) {
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const openTag = html.substring(m.index, m.index + m[0].indexOf('>') + 1);
    if (/\bsrc\s*=/.test(openTag)) continue;
    scripts.push({ content: m[1], start: m.index });
  }
  return scripts;
}

function scriptSyntaxCheck(scripts) {
  return scripts.map((s, i) => {
    if (s.content.trim().length < 5) return { i, ok: true, skipped: true };
    try {
      new vm.Script(s.content, { filename: `script-${i}.js` });
      return { i, ok: true, len: s.content.length };
    } catch (e) {
      return { i, ok: false, err: e.message, len: s.content.length };
    }
  });
}

function accordionCheck(html) {
  return {
    toggleAccordionCalls: (html.match(/toggleAccordion\s*\(/g) || []).length,
    accordionParents: (html.match(/class="[^"]*\baccordion-parent\b/g) || []).length,
    accordionChildren: (html.match(/class="[^"]*\baccordion-children\b/g) || []).length,
    toggleAccordionDefined: /function\s+toggleAccordion\s*\(/.test(html),
  };
}

function summaryTableMasterCards(html) {
  // Detect master card pattern: toggleAccordion onclick on a card; count per tab
  // Use regex around "class=\"card accordion-parent\"" or card that toggles accordion
  const re1 = (html.match(/class="card\s+accordion-parent"/g) || []).length;
  const re2 = (html.match(/class="card[^"]*"\s+onclick="toggleAccordion\(/g) || []).length;
  const re3 = (html.match(/onclick="toggleAccordion\(/g) || []).length;
  return { cardAccordionParent: re1, cardOnclickAccordion: re2, anyOnclickAccordion: re3 };
}

function carouselFuncs(html) {
  const fns = ['initCarousel', 'goTo', 'carouselMove', 'toggleCarousel', 'openLightbox', 'closeLightbox', 'switchChapter', 'switchTab', 'openDetail', 'closeDetail', 'toggleCardExpand'];
  const out = {};
  for (const fn of fns) {
    out[fn] = {
      defined: new RegExp(`function\\s+${fn}\\s*\\(`).test(html),
      calls: (html.match(new RegExp(`\\b${fn}\\s*\\(`, 'g')) || []).length,
    };
  }
  return out;
}

function audit(spec) {
  const out = { file: spec.name };
  const curr = fs.readFileSync(spec.curr, 'utf8');
  const prev = fs.existsSync(spec.prev) ? fs.readFileSync(spec.prev, 'utf8') : null;

  const nc = divNesting(curr);
  out.nestingFinalDepth = nc.finalDepth;
  out.nestingMaxDepth = nc.maxDepth;
  if (prev) {
    const np = divNesting(prev);
    out.nestingFinalDepthPrev = np.finalDepth;
    out.nestingMaxDepthPrev = np.maxDepth;
  }

  const scripts = extractScripts(curr);
  out.scriptCount = scripts.length;
  out.scriptSyntax = scriptSyntaxCheck(scripts);

  out.slides = extractSlidesData(curr);
  out.slidesExpected = spec.expectedSlides;
  if (prev) out.slidesPrev = extractSlidesData(prev);

  out.cards = countCards(curr);
  out.expandWraps = countExpandWraps(curr);
  if (prev) {
    out.cardsPrev = countCards(prev);
    out.expandWrapsPrev = countExpandWraps(prev);
  }

  const tabs = extractTabs(curr);
  out.tabs = {
    btns: Object.fromEntries([...tabs.tabBtns].map(([k, v]) => [k, [...v]])),
    contents: Object.fromEntries([...tabs.tabContents].map(([k, v]) => [k, [...v]])),
  };
  if (prev) {
    const pt = extractTabs(prev);
    out.tabsPrev = {
      btns: Object.fromEntries([...pt.tabBtns].map(([k, v]) => [k, [...v]])),
      contents: Object.fromEntries([...pt.tabContents].map(([k, v]) => [k, [...v]])),
    };
  }

  out.detailData = extractAllDetailData(curr);
  if (prev) out.detailDataPrev = extractAllDetailData(prev);

  // matching
  if (out.detailData.found) {
    const detailKeys = new Set(out.detailData.keys.map(x => x.key));
    const cardKeys = new Set(out.cards.keys);
    const orphanCards = [...cardKeys].filter(k => !detailKeys.has(k));
    const orphanDetails = [...detailKeys].filter(k => !cardKeys.has(k));
    out.match = {
      cardUnique: cardKeys.size,
      detailUnique: detailKeys.size,
      orphanCards,
      orphanDetails,
      orphanCardCount: orphanCards.length,
      orphanDetailCount: orphanDetails.length,
    };
  }

  out.accordion = accordionCheck(curr);
  out.masterCards = summaryTableMasterCards(curr);
  if (prev) {
    out.accordionPrev = accordionCheck(prev);
    out.masterCardsPrev = summaryTableMasterCards(prev);
  }

  out.carousel = carouselFuncs(curr);

  out.size = fs.statSync(spec.curr).size;
  if (prev) out.sizePrev = fs.statSync(spec.prev).size;

  // Card-to-tab mapping: each card is inside a tab-content. Need to map card → tab
  // Parse tab-content open/close positions and find cards inside.
  const tabContentRe = /<div[^>]*id="(ch\d+)-tab-([^"]+)"[^>]*>/g;
  const tcPositions = [];
  let tm;
  while ((tm = tabContentRe.exec(curr)) !== null) {
    tcPositions.push({ ch: tm[1], tab: tm[2], start: tm.index });
  }
  // For each card, find the enclosing tab
  const cardRe = /class="card"[^>]*onclick="toggleCardExpand\(\s*this\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)"/g;
  const tabOfCard = {}; // key -> tab
  const cardsPerTab = {}; // tab -> [keys]
  let cm;
  while ((cm = cardRe.exec(curr)) !== null) {
    const pos = cm.index;
    // find the latest tabContent opening before pos (not closed)
    // Simplified: find max start <= pos
    let best = null;
    for (const tc of tcPositions) {
      if (tc.start <= pos && (!best || tc.start > best.start)) best = tc;
    }
    const tabId = best ? best.tab : 'ROOT';
    tabOfCard[cm[2]] = tabId;
    if (!cardsPerTab[tabId]) cardsPerTab[tabId] = [];
    cardsPerTab[tabId].push(cm[2]);
  }
  out.cardsPerTab = Object.fromEntries(Object.entries(cardsPerTab).map(([t, arr]) => [t, arr.length]));
  out.cardKeysPerTab = cardsPerTab;

  if (prev) {
    const tcPrev = [];
    let tmp;
    const tcR2 = /<div[^>]*id="(ch\d+)-tab-([^"]+)"[^>]*>/g;
    while ((tmp = tcR2.exec(prev)) !== null) tcPrev.push({ ch: tmp[1], tab: tmp[2], start: tmp.index });
    const cardsPerTabP = {};
    const cR2 = /class="card"[^>]*onclick="toggleCardExpand\(\s*this\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)"/g;
    let cmp;
    while ((cmp = cR2.exec(prev)) !== null) {
      const pos = cmp.index;
      let best = null;
      for (const tc of tcPrev) if (tc.start <= pos && (!best || tc.start > best.start)) best = tc;
      const tabId = best ? best.tab : 'ROOT';
      if (!cardsPerTabP[tabId]) cardsPerTabP[tabId] = [];
      cardsPerTabP[tabId].push(cmp[2]);
    }
    out.cardsPerTabPrev = Object.fromEntries(Object.entries(cardsPerTabP).map(([t, arr]) => [t, arr.length]));
    out.cardKeysPerTabPrev = cardsPerTabP;
  }

  return out;
}

const results = FILES.map(audit);
console.log(JSON.stringify(results, null, 2));
