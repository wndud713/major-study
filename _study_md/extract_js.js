const fs = require('fs');
const fp = '신경계질환별물리치료(이제혁)/파킨슨병.html';
const html = fs.readFileSync(fp, 'utf-8');

// Extract last <script>...</script> block
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
let last = null, m;
while ((m = scriptRe.exec(html)) !== null) last = m[1];
if (!last) { console.error('No script'); process.exit(1); }

fs.writeFileSync('_study_md/parkinson_script.js', last);
console.log('Script extracted, length:', last.length);
