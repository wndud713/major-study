// allDetailData['chX'] = { key1: ..., key2: ... } 패턴에서 키 전부 수집
const fs = require('fs');
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');

// collect data-key attrs
const cardKeys = new Set();
const cardRe = /data-key\s*=\s*["']([^"']+)["']/g;
let m;
while ((m = cardRe.exec(html)) !== null) cardKeys.add(m[1]);

// find all allDetailData['...'] = { ... } blocks
const detailKeys = new Set();
const re = /allDetailData\[['"`]([^'"`]+)['"`]\]\s*=\s*\{/g;
let blockCount = 0;
while ((m = re.exec(html)) !== null) {
  blockCount++;
  const chapterId = m[1];
  const start = m.index + m[0].length - 1; // at {
  let depth = 0, inStr = false, strCh = '', prev = '', end = -1;
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
  // collect depth-1 keys in this object
  let d = 0, iS = false, sC = '';
  let sStart = -1;
  let captured = '';
  for (let j = 0; j < block.length; j++) {
    const ch = block[j];
    if (iS) {
      if (ch === '\\') { captured += ch + (block[j + 1] || ''); j++; continue; }
      if (ch === sC) {
        iS = false;
        // check if at depth 1 and followed by colon
        if (d === 1) {
          let k = j + 1;
          while (k < block.length && /\s/.test(block[k])) k++;
          if (block[k] === ':') detailKeys.add(captured);
        }
        captured = '';
      } else captured += ch;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { iS = true; sC = ch; captured = ''; }
      else if (ch === '{') d++;
      else if (ch === '}') d--;
      else if (d === 1 && /[A-Za-z_$]/.test(ch)) {
        // unquoted key candidate
        let k = j;
        let kw = '';
        while (k < block.length && /[A-Za-z0-9_\-$]/.test(block[k])) { kw += block[k]; k++; }
        let k2 = k;
        while (k2 < block.length && /\s/.test(block[k2])) k2++;
        if (block[k2] === ':' && kw.length > 0) {
          detailKeys.add(kw);
        }
        j = k - 1;
      }
    }
  }
}

console.log('file           = ' + file);
console.log('blockCount     = ' + blockCount);
console.log('cardKeys       = ' + cardKeys.size);
console.log('detailKeys     = ' + detailKeys.size);
const missing = [...cardKeys].filter(k => !detailKeys.has(k));
const orphan = [...detailKeys].filter(k => !cardKeys.has(k));
console.log('missing (card→detail) = ' + missing.length);
if (missing.length) console.log('  ' + missing.slice(0, 20).join(', '));
console.log('orphan  (detail→card) = ' + orphan.length);
if (orphan.length) console.log('  ' + orphan.slice(0, 20).join(', '));
