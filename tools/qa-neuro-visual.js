// Build Edge-headless probe HTMLs + take screenshots + read console
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TMP = process.env.LOCALAPPDATA + '\\Temp';
const BASE = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';

const FILES = [
  { name: '파킨슨병', src: `${BASE}/파킨슨병.html`, masterTableIds: ['pk-atypical-tbl','pk-cardinal-tbl','pk-eval-tbl','pk-tx-tbl'], tabs: ['overview','cause','cardinal','addl','eval','tx','summary'] },
  { name: '외상성뇌손상_TBI', src: `${BASE}/외상성뇌손상_TBI.html`, masterTableIds: ['tbi-mech-tbl','tbi-gcs-tbl','tbi-clinical-tbl','tbi-eval-tbl','tbi-locf-tx-tbl'], tabs: ['mech','severity','pathology','clinical','eval','tx','summary'] },
  { name: 'SOAP_note_TBI', src: `${BASE}/SOAP_note_TBI.html`, masterTableIds: ['soap-struct-tbl','soap-scores-tbl','soap-pgp-tbl'], tabs: ['overview','subj','vitals','cognitive','romMmt','balance','assess','plan','summary'] },
];

// Probe script: opens file → checks console errors → clicks a sample card + master table → thumb count → serialize results to window.__QA_RESULT, then writes to localStorage + DOM for capture
function probeScriptFor(masterIds, tabs) {
  return `
<script>
(function(){
  var errors = [];
  var origErr = window.onerror;
  window.onerror = function(msg, src, line, col, err){ errors.push({msg:msg, line:line, col:col}); return false; };
  window.addEventListener('error', function(e){ errors.push({msg:e.message||'err', src:e.filename, line:e.lineno}); });
  setTimeout(function(){
    var result = { errors: errors };
    // carousel init check
    try {
      var thumbs = document.querySelectorAll('#ch1-carousel-thumbs img, #ch1-carousel-thumbs .carousel-thumb');
      result.thumbCount = thumbs.length;
    } catch(e){ result.thumbErr = String(e); }

    // Count cards per tab-content
    result.cardsPerTab = {};
    ${JSON.stringify(tabs)}.forEach(function(tab){
      var el = document.getElementById('ch1-tab-' + tab);
      if (el) {
        result.cardsPerTab[tab] = el.querySelectorAll('.card').length;
      } else {
        result.cardsPerTab[tab] = 'MISSING';
      }
    });
    // Master tables exist?
    result.masterTables = {};
    ${JSON.stringify(masterIds)}.forEach(function(id){
      var el = document.getElementById(id);
      result.masterTables[id] = el ? { exists: true, hasTable: !!el.querySelector('table'), trCount: el.querySelectorAll('tr').length } : { exists: false };
    });
    // Try to open a carousel
    try {
      if (typeof switchChapter === 'function') switchChapter('ch1');
    } catch(e){ result.switchChErr = String(e); }

    // Write result
    window.__QA_RESULT = result;
    document.title = 'QA_RESULT::' + JSON.stringify(result).length + '::DONE';
    var pre = document.createElement('pre');
    pre.id = '__qa_result_pre';
    pre.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#000;color:#0f0;font-size:11px;padding:8px;white-space:pre-wrap;max-height:50vh;overflow:auto;border:2px solid #f00;';
    pre.textContent = JSON.stringify(result, null, 2);
    document.body.appendChild(pre);
  }, 1500);
})();
</script>
`;
}

for (const f of FILES) {
  const html = fs.readFileSync(f.src, 'utf8');
  const probe = probeScriptFor(f.masterTableIds, f.tabs);
  const injected = html.replace(/<\/body>/i, probe + '\n</body>');
  const testPath = TMP + `\\qa-neuro-${f.name}.html`;
  fs.writeFileSync(testPath, injected, 'utf8');

  const shotPath = TMP + `\\qa-neuro-${f.name}.png`;
  if (fs.existsSync(shotPath)) try { fs.unlinkSync(shotPath); } catch(e){}

  console.log(`\n=== ${f.name} ===`);
  console.log('Probe file:', testPath);
  console.log('Shot file :', shotPath);

  // Run edge
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--window-size=1600,1000',
    '--virtual-time-budget=4000',
    `--screenshot=${shotPath}`,
    `file:///${testPath.replace(/\\/g, '/')}`
  ];
  const r = spawnSync(EDGE, args, { encoding: 'utf8', timeout: 30000 });
  console.log('edge exit:', r.status);
  if (r.stderr && r.stderr.length > 0) {
    // just print first 500 chars
    console.log('edge stderr (first 500):');
    console.log(r.stderr.substring(0, 500));
  }
  console.log('Shot exists:', fs.existsSync(shotPath), fs.existsSync(shotPath) ? `(${fs.statSync(shotPath).size} bytes)` : '');
}
