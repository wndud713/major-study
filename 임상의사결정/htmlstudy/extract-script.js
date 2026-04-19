// Extract all <script>...</script> blocks (without external src) from the HTML
// into a single JS file for node --check syntax validation.
const fs = require('fs');
const HTML = 'C:\\Users\\wndud\\Desktop\\전공공부\\임상의사결정\\htmlstudy\\임상의사결정개론.html';
const OUT = 'C:\\Users\\wndud\\AppData\\Local\\Temp\\cdmintro-script-check.js';
const src = fs.readFileSync(HTML, 'utf8');
let out = '';
const re = /<script(\b[^>]*)>([\s\S]*?)<\/script>/g;
let m;
let idx = 0;
while ((m = re.exec(src)) !== null) {
  const attrs = m[1] || '';
  if (/\bsrc\s*=/i.test(attrs)) continue;  // skip external scripts
  out += `\n/* ===== block ${++idx} @ ${m.index} ===== */\n` + m[2] + '\n';
}
fs.writeFileSync(OUT, out);
console.error(`Extracted ${idx} inline script blocks, ${out.length} bytes to ${OUT}`);
