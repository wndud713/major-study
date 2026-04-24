// Deeper probe: click carousel toggle, switch tabs, open summary card
const fs = require('fs');
const { spawnSync } = require('child_process');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TMP = process.env.LOCALAPPDATA + '\\Temp';
const BASE = 'C:/Users/wndud/Desktop/전공공부/신경계질환별물리치료(이제혁)';

const FILES = [
  { name: '파킨슨병', src: `${BASE}/파킨슨병.html`, summaryTab: 'summary', masterTabs: ['cause','cardinal','eval','tx'], expectedSlides: 35 },
  { name: '외상성뇌손상_TBI', src: `${BASE}/외상성뇌손상_TBI.html`, summaryTab: 'summary', masterTabs: ['mech','severity','clinical','eval','tx'], expectedSlides: 54 },
  { name: 'SOAP_note_TBI', src: `${BASE}/SOAP_note_TBI.html`, summaryTab: 'summary', masterTabs: ['overview','cognitive','assess'], expectedSlides: 15 },
];

function probe(tabToOpen, masterTabs, expectedSlides) {
  return `
<script>
(function(){
  var errors = [];
  window.addEventListener('error', function(e){ errors.push({msg:e.message, src:e.filename, line:e.lineno}); });
  window.onerror = function(m,s,l){ errors.push({msg:m, line:l}); return false; };

  function run(){
    var result = { errors: errors, steps: [] };
    try {
      // 1. switchChapter init
      if (typeof switchChapter === 'function') { switchChapter('ch1'); result.steps.push('switchChapter ch1 OK'); }
      else result.steps.push('switchChapter NOT function');

      // 2. switchTab to each master tab and count
      result.tabCardRender = {};
      ${JSON.stringify(masterTabs)}.forEach(function(t){
        try {
          switchTab('ch1', t);
          var cnt = document.querySelectorAll('#ch1-tab-' + t + ' .card').length;
          var vis = document.getElementById('ch1-tab-' + t);
          result.tabCardRender[t] = { cards: cnt, displayedCSS: vis ? getComputedStyle(vis).display : 'n/a' };
        } catch(e){ result.tabCardRender[t] = 'ERR ' + e.message; }
      });

      // 3. Toggle carousel
      var carBtn = document.getElementById('ch1-carousel-toggle-btn');
      if (carBtn) {
        carBtn.click();
        setTimeout(function(){
          var thumbs = document.querySelectorAll('#ch1-carousel-thumbs img, #ch1-carousel-thumbs .carousel-thumb');
          result.thumbCount = thumbs.length;
          result.expectedSlides = ${expectedSlides};
          result.thumbOK = (thumbs.length === ${expectedSlides});

          // 4. Click a master card (first one in summary tab)
          try { switchTab('ch1', '${tabToOpen}'); } catch(e){}
          var masterCard = document.querySelector('.card[style*="width:100%"]');
          if (masterCard) {
            masterCard.click();
            var tbl = masterCard.parentElement.querySelector('div[id$="-tbl"]');
            result.masterCardClick = {
              found: true,
              tblDisplay: tbl ? tbl.style.display : 'n/a',
            };
          } else {
            result.masterCardClick = { found: false };
          }

          // Finalize
          window.__QA_RESULT = result;
          var pre = document.createElement('pre');
          pre.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#000;color:#0f0;font-size:10px;padding:6px;white-space:pre-wrap;max-height:60vh;overflow:auto;border:2px solid #0f0';
          pre.textContent = JSON.stringify(result, null, 2);
          document.body.appendChild(pre);
        }, 500);
      } else {
        result.carouselToggleBtn = 'missing';
        var pre = document.createElement('pre');
        pre.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#000;color:#f80;font-size:10px;padding:6px;white-space:pre-wrap;';
        pre.textContent = JSON.stringify(result, null, 2);
        document.body.appendChild(pre);
      }
    } catch(e){
      result.fatalErr = String(e);
      var pre = document.createElement('pre');
      pre.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#000;color:#f00;font-size:10px;padding:6px;';
      pre.textContent = JSON.stringify(result, null, 2);
      document.body.appendChild(pre);
    }
  }
  setTimeout(run, 800);
})();
</script>
`;
}

for (const f of FILES) {
  const html = fs.readFileSync(f.src, 'utf8');
  const injected = html.replace(/<\/body>/i, probe(f.summaryTab, f.masterTabs, f.expectedSlides) + '\n</body>');
  const testPath = TMP + `\\qa2-neuro-${f.name}.html`;
  fs.writeFileSync(testPath, injected, 'utf8');
  const shotPath = TMP + `\\qa2-neuro-${f.name}.png`;
  if (fs.existsSync(shotPath)) try { fs.unlinkSync(shotPath); } catch(e){}
  console.log(`\n=== ${f.name} ===`);
  const args = ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1600,1000','--virtual-time-budget=6000',`--screenshot=${shotPath}`,`file:///${testPath.replace(/\\/g, '/')}`];
  const r = spawnSync(EDGE, args, { encoding: 'utf8', timeout: 30000 });
  console.log('  exit:', r.status, '  shot:', fs.existsSync(shotPath) ? `${fs.statSync(shotPath).size}B` : 'MISSING');
}
