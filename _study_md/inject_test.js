// 파킨슨 HTML에 dual-action 테스트 코드를 임시 삽입 → headless 로드 → DOM dump
const fs = require('fs');
const orig = fs.readFileSync('신경계질환별물리치료(이제혁)/파킨슨병.html', 'utf-8');

const testJs = `
<div id="__test_result__" style="position:fixed;top:0;right:0;z-index:99999;background:#000;color:#0f0;font:11px monospace;padding:10px;width:600px;border:2px solid #0f0;white-space:pre-wrap;"></div>
<script>
window.addEventListener('load', () => {
  setTimeout(() => {
    const out = document.getElementById('__test_result__');
    const log = (s) => { out.textContent += s + '\\n'; };
    try {
      const card = document.querySelector('div.card[onclick*="\\'def\\'"]');
      if (!card) { log('FAIL: card not found'); return; }
      log('Card OK: ' + card.querySelector('.card-title').textContent);
      const wrap = card.nextElementSibling;
      log('Initial wrap.style.display: "' + wrap.style.display + '"');

      // Direct call to toggleCardExpand
      window.toggleCardExpand(card, 'ch1', 'def');
      log('[c1] wrap.display="' + wrap.style.display + '" loaded=' + wrap.dataset.loaded + ' card.cls="' + card.className + '"');
      log('[c1] wrap.innerHTML.length=' + wrap.innerHTML.length);

      window.toggleCardExpand(card, 'ch1', 'def');
      const panel = document.getElementById('ch1-detail-panel');
      log('[c2] wrap.display="' + wrap.style.display + '" panel.cls="' + panel.className + '" key="' + panel.dataset.currentKey + '"');

      window.toggleCardExpand(card, 'ch1', 'def');
      log('[c3] panel.cls="' + panel.className + '" wrap.display="' + wrap.style.display + '" key="' + panel.dataset.currentKey + '"');

      log('=== ALL DUAL-ACTION OK ===');
    } catch(e) { log('ERROR: ' + e.message + '\\n' + e.stack); }
  }, 200);
});
</script>
</body>`;

const injected = orig.replace('</body>', testJs);
fs.writeFileSync('_study_md/parkinson_test.html', injected);
console.log('Injected test build written');
