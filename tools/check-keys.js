const fs = require('fs');
const files = [
  'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)/파킨슨병.html',
  'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html',
  'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)/SOAP_note_TBI.html'
];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const name = f.split(/[\\/]/).pop();
  const keyRe = /(?:toggleCardExpand|moveToSidebar)\(this(?:[^,]*),[^,]*,\s*'([^']+)'\)/g;
  const keys = new Set();
  let m;
  while ((m = keyRe.exec(html)) !== null) keys.add(m[1]);
  console.log(name + ': unique card keys=' + keys.size);
  const missing = [];
  for (const k of keys) {
    const ek = k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp("[\\s,{]" + ek + "\\s*:");
    if (!re.test(html) && html.indexOf("'" + k + "':") === -1 && html.indexOf('"' + k + '":') === -1) missing.push(k);
  }
  console.log('  missing in allDetailData: ' + (missing.length ? missing.join(', ') : 'none'));
}
