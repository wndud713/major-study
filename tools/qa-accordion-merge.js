// 아코디언 병합 QA 스크립트
// - div nesting depth
// - script 문법 (vm.Script)
// - toggleAccordion / .accordion-parent / .ap-head / .accordion-children / .chev 확인
// - SLIDES_DATA 개수
// - card data-key ↔ allDetailData key 매칭

const fs = require('fs');
const vm = require('vm');

function divBalance(html) {
  let depth = 0, maxDepth = 0, line = 1;
  const openLines = [];
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '\n') line++;
    if (html.substr(i, 4) === '<div' && /[\s>]/.test(html[i + 4] || '')) {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
      openLines.push(line);
      i = html.indexOf('>', i);
      if (i < 0) break;
    } else if (html.substr(i, 6) === '</div>') {
      depth--;
      openLines.pop();
      i += 5;
    }
  }
  return { finalDepth: depth, maxDepth, unclosed: openLines.slice(-5) };
}

function extractScripts(html) {
  const scripts = [];
  const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    scripts.push(m[1]);
  }
  return scripts;
}

function checkScriptSyntax(scripts) {
  const errors = [];
  scripts.forEach((s, idx) => {
    if (!s.trim()) return;
    try {
      new vm.Script(s, { filename: 'script_' + idx + '.js' });
    } catch (e) {
      errors.push({ idx, msg: e.message.split('\n')[0] });
    }
  });
  return errors;
}

function countSlidesData(html) {
  const m = /SLIDES_DATA\s*=\s*\{/.exec(html);
  if (!m) return 0;
  const start = m.index + m[0].length - 1;
  let depth = 0, inStr = false, strCh = '', end = -1;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  const block = html.substring(start, end + 1);
  // count src: occurrences as proxy for slide entries
  const slideCount = (block.match(/src\s*:/g) || []).length;
  return slideCount;
}

function collectDataKeys(html) {
  const keys = new Set();
  const re = /data-key\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function collectDetailKeys(html) {
  // allDetailData = { ... } 블록에서 키 추출
  const m = /allDetailData\s*=\s*\{/.exec(html);
  if (!m) return new Set();
  const start = m.index + m[0].length - 1;
  let depth = 0, inStr = false, strCh = '', end = -1;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  const block = html.substring(start, end + 1);
  // top-level keys only: depth 1, followed by colon
  const keys = new Set();
  depth = 0; inStr = false; strCh = '';
  let i = 0;
  while (i < block.length) {
    const ch = block[i];
    if (inStr) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === strCh) inStr = false;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; i++; continue; }
    if (ch === '{') { depth++; i++; continue; }
    if (ch === '}') { depth--; i++; continue; }
    if (depth === 1 && /[A-Za-z0-9_\-가-힣]/.test(ch)) {
      // possible unquoted key; skip (keys are usually quoted)
    }
    if (depth === 1 && (ch === '"' || ch === "'")) {
      // shouldn't reach because inStr already toggled
    }
    i++;
  }
  // fallback: regex at start-of-line-ish
  const re = /[{,]\s*["']([^"'\n]{1,200}?)["']\s*:/g;
  // more reliably match only depth-1 keys using a 2nd pass
  // Simpler: walk char by char tracking depth, when we encounter string at depth==1 followed by colon
  depth = 0; inStr = false; strCh = '';
  let strStart = -1, strContent = '';
  for (let j = 0; j < block.length; j++) {
    const ch = block[j];
    if (inStr) {
      if (ch === '\\') { strContent += ch + (block[j + 1] || ''); j++; continue; }
      if (ch === strCh) {
        inStr = false;
        // look ahead for colon at depth 1
        if (depth === 1) {
          let k = j + 1;
          while (k < block.length && /\s/.test(block[k])) k++;
          if (block[k] === ':') keys.add(strContent);
        }
        strContent = '';
      } else {
        strContent += ch;
      }
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; strContent = ''; }
      else if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
  }
  return keys;
}

function checkMarkerPresence(html) {
  return {
    accordionParent: (html.match(/accordion-parent/g) || []).length,
    apHead: (html.match(/ap-head/g) || []).length,
    accordionChildren: (html.match(/accordion-children/g) || []).length,
    chev: (html.match(/\bchev\b/g) || []).length,
    toggleAccordionDef: /function\s+toggleAccordion\s*\(/.test(html) || /toggleAccordion\s*=\s*function/.test(html) || /toggleAccordion\s*:\s*function/.test(html),
    toggleAccordionCalls: (html.match(/toggleAccordion\s*\(/g) || []).length,
    stopPropagationCount: (html.match(/stopPropagation/g) || []).length,
  };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node qa-accordion-merge.js <file1> [file2] ...');
  process.exit(1);
}

files.forEach((file, idx) => {
  const sep = '\n' + '='.repeat(70);
  console.log(sep);
  console.log('FILE: ' + file);
  console.log('='.repeat(70));
  const html = fs.readFileSync(file, 'utf8');
  const b = divBalance(html);
  console.log('[1] div nesting:');
  console.log('    finalDepth = ' + b.finalDepth + '  (expect 0)');
  console.log('    maxDepth   = ' + b.maxDepth);
  if (b.finalDepth !== 0) console.log('    UNCLOSED OPENED AT LINES: ' + b.unclosed.join(', '));
  const scripts = extractScripts(html);
  const syntaxErrs = checkScriptSyntax(scripts);
  console.log('[2] script syntax:');
  console.log('    scripts total = ' + scripts.length);
  console.log('    syntax errors = ' + syntaxErrs.length);
  syntaxErrs.forEach(e => console.log('      - [' + e.idx + '] ' + e.msg));
  const slideCount = countSlidesData(html);
  console.log('[3] SLIDES_DATA slide entries = ' + slideCount);
  const dataKeys = collectDataKeys(html);
  const detailKeys = collectDetailKeys(html);
  console.log('[4] card↔detail match:');
  console.log('    data-key count  = ' + dataKeys.size);
  console.log('    allDetailData key count = ' + detailKeys.size);
  const missingDetails = [...dataKeys].filter(k => !detailKeys.has(k));
  const orphanDetails = [...detailKeys].filter(k => !dataKeys.has(k));
  console.log('    missing (card→detail) = ' + missingDetails.length + (missingDetails.length ? '  ex: ' + missingDetails.slice(0, 5).join(', ') : ''));
  console.log('    orphan  (detail→card)  = ' + orphanDetails.length + (orphanDetails.length ? '  ex: ' + orphanDetails.slice(0, 5).join(', ') : ''));
  const m = checkMarkerPresence(html);
  console.log('[5] accordion markers:');
  console.log('    accordion-parent   = ' + m.accordionParent);
  console.log('    ap-head            = ' + m.apHead);
  console.log('    accordion-children = ' + m.accordionChildren);
  console.log('    chev               = ' + m.chev);
  console.log('    toggleAccordion def= ' + m.toggleAccordionDef);
  console.log('    toggleAccordion calls = ' + m.toggleAccordionCalls);
  console.log('    stopPropagation    = ' + m.stopPropagationCount);
});
