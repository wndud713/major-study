const fs = require('fs');
const src = fs.readFileSync('C:/Users/wndud/AppData/Local/Temp/cdmintro-script-check.js', 'utf8');
const m = /allDetailData\['ch1'\]\s*=\s*\{/.exec(src);
if (!m) { console.error('Not found'); process.exit(1); }
const braceStart = m.index + m[0].lastIndexOf('{');
let depth = 0, inTmpl = false, inStr = false, strCh = '';
let end = -1;
for (let i = braceStart; i < src.length; i++) {
  const ch = src[i];
  if (inStr) {
    if (ch === '\\') { i++; continue; }
    if (ch === strCh) inStr = false;
    continue;
  }
  if (inTmpl) {
    if (ch === '\\') { i++; continue; }
    if (ch === '`') inTmpl = false;
    continue;
  }
  if (ch === '`') { inTmpl = true; continue; }
  if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const block = src.substring(braceStart, end);
const keyMatches = block.match(/\n  q[A-Za-z0-9_]+:\s`/g) || [];
console.log('ch1 keys:', keyMatches.length);
console.log('First:', keyMatches.slice(0, 3).map(s => s.trim()));
console.log('Last:', keyMatches.slice(-3).map(s => s.trim()));

// Compare against the q-cell h2 titles in the grid
const cellTitles = src.match(/<div class="q-cell"><h2>[^<]+<\/h2>/g) || [];
console.log('q-cell entries:', cellTitles.length);
