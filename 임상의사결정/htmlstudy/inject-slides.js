// Inject fresh SLIDES_DATA block into 임상의사결정개론.html using brace-depth parser
const fs = require('fs');

const HTML_PATH = 'C:\\Users\\wndud\\Desktop\\전공공부\\임상의사결정\\htmlstudy\\임상의사결정개론.html';
const NEW_BLOCK_PATH = 'C:\\Users\\wndud\\AppData\\Local\\Temp\\cdmintro-slides-data.txt';

const content = fs.readFileSync(HTML_PATH, 'utf8');
const newBlock = fs.readFileSync(NEW_BLOCK_PATH, 'utf8');

// Locate `const SLIDES_DATA = {` via regex, then find matching closing brace
const m = /(const\s+SLIDES_DATA\s*=\s*\{)/.exec(content);
if (!m) {
  console.error('SLIDES_DATA not found');
  process.exit(1);
}
const startIdx = m.index;
const braceStart = m.index + m[0].lastIndexOf('{');

let depth = 0, inStr = false, strCh = '', endBrace = -1;
for (let i = braceStart; i < content.length; i++) {
  const ch = content[i];
  if (inStr) {
    if (ch === '\\') { i++; continue; }
    if (ch === strCh) inStr = false;
  } else {
    if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
    else if (ch === '`') { inStr = true; strCh = '`'; }
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { endBrace = i; break; }
    }
  }
}

if (endBrace < 0) { console.error('Closing brace not found'); process.exit(1); }

let blockEnd = endBrace + 1;
if (content[blockEnd] === ';') blockEnd++;

const before = content.substring(0, startIdx);
const after = content.substring(blockEnd);

console.error(`Replacing ${blockEnd - startIdx} chars with ${newBlock.length} chars`);
console.error(`Old start: char ${startIdx}, end: char ${blockEnd}`);

fs.writeFileSync(HTML_PATH, before + newBlock + after);
console.error('Done');
