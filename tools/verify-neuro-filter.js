'use strict';
/**
 * tools/verify-neuro-filter.js
 * 필터링 후 검증:
 *  1) div open/close balance
 *  2) script 블록 추출 후 node vm.Script compile (syntax check)
 *  3) SLIDES_DATA.ch1 count
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const files = [
  '신경계질환별물리치료(이제혁)/파킨슨병.html',
  '신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html',
  '신경계질환별물리치료(이제혁)/SOAP_note_TBI.html',
];

function countDivs(c) {
  const open = (c.match(/<div(\s|>)/g) || []).length;
  const close = (c.match(/<\/div>/g) || []).length;
  return { open, close };
}

function extractScripts(c) {
  const scripts = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(c))) scripts.push(m[1]);
  return scripts;
}

function countSlidesData(c) {
  const m = /(?:const\s+)?SLIDES_DATA\s*=\s*\{/.exec(c);
  if (!m) return 'NO_SLIDES_DATA';
  // find [ after ch1:
  const keyIdx = c.indexOf('ch1', m.index);
  if (keyIdx === -1) return 'NO_CH1';
  const arrStart = c.indexOf('[', keyIdx);
  // count top-level { ... } inside
  let depth = 0, inStr = false, strCh = '', end = -1;
  for (let i = arrStart; i < c.length; i++) {
    const ch = c[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '[') depth++;
      else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  const body = c.substring(arrStart + 1, end);
  // split objects
  let count = 0, i = 0, n = body.length;
  while (i < n) {
    while (i < n && body[i] !== '{') i++;
    if (i >= n) break;
    let d = 0; inStr = false; strCh = '';
    for (; i < n; i++) {
      const ch = body[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === strCh) inStr = false;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
        else if (ch === '{') d++;
        else if (ch === '}') { d--; if (d === 0) { i++; count++; break; } }
      }
    }
  }
  return count;
}

function countCarousel(c) {
  return (c.match(/id="[^"]*carousel-area"/g) || []).length;
}

for (const f of files) {
  const full = path.join(ROOT, f);
  const c = fs.readFileSync(full, 'utf8');
  console.log('='.repeat(60));
  console.log(f);
  const divs = countDivs(c);
  console.log('  div open/close:', divs.open, '/', divs.close, divs.open === divs.close ? 'OK' : 'MISMATCH(' + (divs.open - divs.close) + ')');
  const slideCount = countSlidesData(c);
  console.log('  SLIDES_DATA.ch1 count:', slideCount);
  console.log('  carousel-area elements:', countCarousel(c));
  console.log('  HTML size:', (c.length / (1024 * 1024)).toFixed(2), 'MB');
  const scripts = extractScripts(c);
  console.log('  inline scripts:', scripts.length);
  let scriptErr = null;
  for (let idx = 0; idx < scripts.length; idx++) {
    try { new vm.Script(scripts[idx]); }
    catch (e) { scriptErr = 'script#' + idx + ': ' + e.message; break; }
  }
  console.log('  script syntax:', scriptErr ? 'ERROR: ' + scriptErr : 'OK');
}
