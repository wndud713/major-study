'use strict';

/**
 * lib/merge-engine.js — 파싱된 챕터들을 단일 HTML로 병합
 *
 * 사용:
 *   const { mergeSubject, mergeAll } = require('./merge-engine');
 *
 *   mergeSubject({
 *     subject: '스포츠물리치료학',
 *     templatePath: '...shell_template_v2.html',
 *     chapters: [{ parsed, shortTitle }],
 *     outputPath: '...통합.html'
 *   });
 */

const fs = require('fs');
const { readTemplate, assembleHTML, buildChapterNav } = require('./builder');
const { remapChapter } = require('./html-parser');

// ── SLIDES_DATA 합치기 ──────────────────────────────────────────────────────

function buildCombinedSlidesData(remapped) {
  const parts = remapped.map(r => `  ${r.chId}: ${r.slidesRaw}`);
  return 'const SLIDES_DATA = {\n' + parts.join(',\n') + '\n};';
}

// ── allDetailData 합치기 ────────────────────────────────────────────────────

function buildCombinedDetailData(remapped) {
  const lines = ['const allDetailData = {};'];
  for (const r of remapped) {
    lines.push(`allDetailData['${r.chId}'] = ${r.detailRaw};`);
  }
  return lines.join('\n\n');
}

// ── chapter-nav (과목 내 단순 목록) ─────────────────────────────────────────

function buildSubjectChapterNav(subject, remapped) {
  const chapters = remapped.map((r, i) => ({
    chid: r.chId,
    chNum: String(i + 1).padStart(2, '0'),
    shortTitle: r.title,
    accent: r.accent
  }));
  return buildChapterNav(subject, chapters);
}

// ── chapter-nav (과목 그룹 라벨 포함, 전체 통합용) ──────────────────────────

function buildGroupedChapterNav(groups) {
  // groups: [{subject, remapped:[{chId, title, accent}]}]
  const lines = ['<div class="chapter-nav">'];
  for (const g of groups) {
    lines.push(`  <span class="ch-group-label">${g.subject}</span>`);
    g.remapped.forEach((r, i) => {
      const active = (groups[0] === g && i === 0) ? ' active' : '';
      const num = String(r.globalIndex + 1).padStart(2, '0');
      lines.push(
        `  <button class="ch-btn${active}" onclick="switchChapter('${r.chId}')" data-ch="${r.chId}" style="--ch-accent:${r.accent}">CH.${num} ${r.title}</button>`
      );
    });
  }
  lines.push('</div>');
  return lines.join('\n');
}

// ── 과목 선택기 드롭다운 네비게이션 (전체 통합 전용) ─────────────────────────

function buildSubjectSelectorNav(groups) {
  // ── HTML ──────────────────────────────────────────────────────────────────
  const lines = ['<div class="subject-nav">'];

  // 과목 선택 박스
  const firstName = groups[0].subject;
  lines.push(
    `  <div class="subject-selector" onclick="toggleSubjectDropdown()">`,
    `    <span id="subject-current-name">${firstName}</span>`,
    `    <span class="subject-arrow" id="subject-arrow">▼</span>`,
    `  </div>`
  );

  // 드롭다운 목록
  lines.push(`  <div class="subject-dropdown" id="subject-dropdown">`);
  groups.forEach((g, gi) => {
    const activeClass = gi === 0 ? ' active' : '';
    lines.push(`    <div class="subject-opt${activeClass}" data-sid="s${gi}" onclick="selectSubject('s${gi}',event)">${g.subject}</div>`);
  });
  lines.push(`  </div>`);

  // 과목별 챕터 버튼 목록
  groups.forEach((g, gi) => {
    const activeClass = gi === 0 ? ' active' : '';
    lines.push(`  <div class="subject-chapters${activeClass}" id="sch-s${gi}">`);
    g.remapped.forEach((r, ri) => {
      const btnActive = gi === 0 && ri === 0 ? ' active' : '';
      const num = String(ri + 1).padStart(2, '0');
      lines.push(
        `    <button class="ch-btn${btnActive}" onclick="switchChapter('${r.chId}')" data-ch="${r.chId}" style="--ch-accent:${r.accent}">CH.${num} ${r.title}</button>`
      );
    });
    lines.push(`  </div>`);
  });

  lines.push('</div>');
  const navHtml = lines.join('\n');

  // ── SUBJ_FIRST 맵 (JS용) ──────────────────────────────────────────────────
  const subjFirstEntries = groups.map((g, gi) =>
    `  's${gi}': '${g.remapped[0].chId}'`
  ).join(',\n');

  // ── 추가 CSS ──────────────────────────────────────────────────────────────
  const extraCss = `
/* ── 과목 선택기 (전체 통합 전용) ── */
.subject-nav{background:#0a0c10;border-bottom:1px solid #1e2235;padding:0 12px;display:flex;align-items:center;gap:0;min-height:44px;flex-shrink:0;position:relative;}
.subject-selector{display:flex;align-items:center;gap:8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:5px 14px;cursor:pointer;user-select:none;font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;flex-shrink:0;margin-right:10px;transition:border-color .15s;}
.subject-selector:hover{border-color:var(--accent);}
.subject-arrow{font-size:10px;opacity:.7;transition:transform .2s;display:inline-block;}
.subject-arrow.open{transform:rotate(180deg);}
.subject-dropdown{display:none;position:absolute;top:44px;left:12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;z-index:300;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,.45);overflow:hidden;}
.subject-dropdown.open{display:block;}
.subject-opt{padding:10px 16px;font-size:13px;cursor:pointer;color:var(--text-dim);transition:background .15s,color .15s;}
.subject-opt:hover{background:var(--bg3);color:var(--text);}
.subject-opt.active{color:var(--accent);font-weight:600;}
.subject-chapters{display:none;align-items:center;gap:4px;flex:1;overflow-x:auto;padding:2px 0;}
.subject-chapters.active{display:flex;}`;

  // ── 추가 JS ───────────────────────────────────────────────────────────────
  const extraJs = `
// ── 과목 선택기 (전체 통합 전용) ─────────────────────────────────────────────
(function(){
  var SUBJ_FIRST = {
${subjFirstEntries}
  };
  function toggleSubjectDropdown(){
    var dd=document.getElementById('subject-dropdown');
    var ar=document.getElementById('subject-arrow');
    dd.classList.toggle('open');
    ar.classList.toggle('open');
  }
  function selectSubject(sid,e){
    if(e) e.stopPropagation();
    document.querySelectorAll('.subject-chapters').forEach(function(el){el.classList.remove('active');});
    document.getElementById('sch-'+sid).classList.add('active');
    document.querySelectorAll('.subject-opt').forEach(function(el){el.classList.remove('active');});
    var opt=document.querySelector('.subject-opt[data-sid="'+sid+'"]');
    opt.classList.add('active');
    document.getElementById('subject-current-name').textContent=opt.textContent.trim();
    document.getElementById('subject-dropdown').classList.remove('open');
    document.getElementById('subject-arrow').classList.remove('open');
    switchChapter(SUBJ_FIRST[sid]);
  }
  window.toggleSubjectDropdown=toggleSubjectDropdown;
  window.selectSubject=selectSubject;
  document.addEventListener('click',function(e){
    if(!e.target.closest('.subject-selector')){
      var dd=document.getElementById('subject-dropdown');
      var ar=document.getElementById('subject-arrow');
      if(dd){dd.classList.remove('open');}
      if(ar){ar.classList.remove('open');}
    }
  });
})();`;

  return { navHtml, extraCss, extraJs };
}

// ── 챕터 섹션 HTML 합치기 ───────────────────────────────────────────────────

function buildCombinedChapterSection(remapped) {
  return remapped.map(r => r.chapterSectionHtml).join('\n\n');
}

// ── 편집 기능 주입 (통합 파일 전용) ──────────────────────────────────────────

function injectEditFeatures(html) {
  const css = `
/* ── 편집 모드 (통합 파일 전용) ── */
:root{--sidebar-w:210px;--detail-w:370px;}
@media(min-width:769px){
  .sidebar{width:var(--sidebar-w)!important;}
  .detail-panel{width:var(--detail-w)!important;}
}
.cards-area.carousel-on{max-height:var(--cards-max-h,45%)!important;}
#edit-toggle-btn{position:fixed;bottom:20px;right:20px;z-index:500;background:var(--bg3);border:1px solid var(--border);color:var(--text-dim);padding:7px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:all .2s;font-family:inherit;}
#edit-toggle-btn:hover{border-color:var(--accent);color:var(--accent);}
#edit-toggle-btn.active{background:var(--accent);color:#0a0c10;border-color:transparent;}
.resize-handle{display:none;z-index:50;user-select:none;touch-action:none;flex-shrink:0;}
body.edit-mode .resize-handle{display:block;}
.resize-handle-v{width:6px;cursor:col-resize;align-self:stretch;position:relative;background:transparent;}
.resize-handle-v::after{content:'';position:absolute;top:0;bottom:0;left:1px;width:4px;background:var(--border);border-radius:2px;transition:background .15s;}
.resize-handle-v:hover::after,.resize-handle-v.dragging::after{background:var(--accent);}
.resize-handle-h{height:6px;cursor:row-resize;width:100%;position:relative;background:transparent;}
.resize-handle-h::after{content:'';position:absolute;left:0;right:0;top:1px;height:4px;background:var(--border);border-radius:2px;transition:background .15s;}
.resize-handle-h:hover::after,.resize-handle-h.dragging::after{background:var(--accent);}
.del-slide-btn{display:none!important;}
body.edit-mode .del-slide-btn{display:flex!important;}
.slide-add-row{display:flex;align-items:center;padding:3px 12px 2px;flex-shrink:0;border-bottom:1px solid var(--border);}
.slide-add-btn-perm{height:20px;padding:0 8px;background:var(--bg3);border:1px dashed var(--border);color:var(--accent);border-radius:4px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit;transition:border-color .15s,background .15s;white-space:nowrap;}
.slide-add-btn-perm:hover{border-color:var(--accent);background:var(--bg4);}`;

  const editBtn = `\n<button id="edit-toggle-btn" onclick="toggleEditMode()">✏️ 편집</button>`;

  const js = `
// ── 편집 모드 ────────────────────────────────────────────────────────────────
(function(){
  function setupDrag(el,axis,onDelta){
    function start(e){
      e.preventDefault();
      var last=axis==='h'?(e.touches?e.touches[0].clientX:e.clientX):(e.touches?e.touches[0].clientY:e.clientY);
      el.classList.add('dragging');
      function move(e2){
        var cur=axis==='h'?(e2.touches?e2.touches[0].clientX:e2.clientX):(e2.touches?e2.touches[0].clientY:e2.clientY);
        onDelta(cur-last); last=cur;
      }
      function end(){
        el.classList.remove('dragging');
        document.removeEventListener('mousemove',move);
        document.removeEventListener('mouseup',end);
        document.removeEventListener('touchmove',move);
        document.removeEventListener('touchend',end);
        if(window._studySchedSave)window._studySchedSave();
      }
      document.addEventListener('mousemove',move);
      document.addEventListener('mouseup',end);
      document.addEventListener('touchmove',move,{passive:false});
      document.addEventListener('touchend',end);
    }
    el.addEventListener('mousedown',start);
    el.addEventListener('touchstart',start,{passive:false});
  }

  function setVar(name,val){ document.documentElement.style.setProperty(name,val); }

  function setupResizeHandles(){
    document.querySelectorAll('.wrapper').forEach(function(wrapper){
      if(wrapper.querySelector('.rh-sidebar')) return;
      var sidebar=wrapper.querySelector('.sidebar');
      var mainWrap=wrapper.querySelector('.main-wrap');
      var detailPanel=wrapper.querySelector('.detail-panel');
      var cardsArea=wrapper.querySelector('.cards-area');
      var carouselArea=wrapper.querySelector('[id$="-carousel-area"]');

      // ① 사이드바 너비 핸들 (sidebar | main-wrap 경계)
      var rhS=document.createElement('div');
      rhS.className='resize-handle resize-handle-v rh-sidebar';
      wrapper.insertBefore(rhS,mainWrap);
      setupDrag(rhS,'h',function(dx){
        setVar('--sidebar-w',Math.max(120,Math.min(400,sidebar.offsetWidth+dx))+'px');
      });

      // ② 디테일 패널 너비 핸들 (main-wrap | detail-panel 경계)
      if(detailPanel){
        var rhD=document.createElement('div');
        rhD.className='resize-handle resize-handle-v rh-detail';
        wrapper.insertBefore(rhD,detailPanel);
        setupDrag(rhD,'h',function(dx){
          var cur=detailPanel.classList.contains('open')?detailPanel.offsetWidth:370;
          setVar('--detail-w',Math.max(200,Math.min(600,cur-dx))+'px');
        });
      }

      // ③ 캐러셀 높이 핸들 (cards-area | carousel-area 경계)
      if(cardsArea&&carouselArea){
        var rhC=document.createElement('div');
        rhC.className='resize-handle resize-handle-h rh-carousel';
        mainWrap.insertBefore(rhC,carouselArea);
        setupDrag(rhC,'v',function(dy){
          setVar('--cards-max-h',Math.max(150,Math.min(mainWrap.offsetHeight*0.75,cardsArea.offsetHeight+dy))+'px');
        });
      }
    });
  }

  function toggleEditMode(){
    var btn=document.getElementById('edit-toggle-btn');
    var on=document.body.classList.toggle('edit-mode');
    btn.classList.toggle('active',on);
    btn.textContent=on?'✕ 편집 종료':'✏️ 편집';
    if(on) setupResizeHandles();
  }
  window.toggleEditMode=toggleEditMode;
})();

// ── Step 7: 콘텐츠 편집 + 이미지 관리 + localStorage ────────────────────────
(function(){
  'use strict';
  var STORE_KEY='study-edits-'+document.title;
  var edits={layout:{},tabs:{},cards:{},slidesAdded:{},slidesDeleted:{}};
  var origCounts={};
  var saveTimer=null;
  var thumbObservers={};

  /* ── 원본 슬라이드 수 캡처 ── */
  Object.keys(SLIDES_DATA).forEach(function(chId){
    origCounts[chId]=(SLIDES_DATA[chId]||[]).length;
  });

  /* ══ 저장/로드 ═══════════════════════════════════════════════════════════ */
  function schedSave(){clearTimeout(saveTimer);saveTimer=setTimeout(doSave,500);}
  window._studySchedSave=schedSave;

  function doSave(){
    var st=document.documentElement.style;
    edits.layout.sidebarW =st.getPropertyValue('--sidebar-w').trim();
    edits.layout.detailW  =st.getPropertyValue('--detail-w').trim();
    edits.layout.cardsMaxH=st.getPropertyValue('--cards-max-h').trim();
    try{localStorage.setItem(STORE_KEY,JSON.stringify(edits));}
    catch(e){
      try{localStorage.setItem(STORE_KEY,JSON.stringify(
        {layout:edits.layout,tabs:edits.tabs,cards:edits.cards,slidesAdded:{},slidesDeleted:edits.slidesDeleted}
      ));}catch(e2){}
    }
  }

  function loadEdits(){
    try{
      var raw=localStorage.getItem(STORE_KEY);
      if(!raw) return;
      var sv=JSON.parse(raw);
      edits.layout       =sv.layout       ||{};
      edits.tabs         =sv.tabs         ||{};
      edits.cards        =sv.cards        ||{};
      edits.slidesAdded  =sv.slidesAdded  ||{};
      edits.slidesDeleted=sv.slidesDeleted||{};
    }catch(e){return;}
    /* layout */
    var l=edits.layout,root=document.documentElement;
    if(l.sidebarW)  root.style.setProperty('--sidebar-w',  l.sidebarW);
    if(l.detailW)   root.style.setProperty('--detail-w',   l.detailW);
    if(l.cardsMaxH) root.style.setProperty('--cards-max-h',l.cardsMaxH);
    /* SLIDES_DATA: 삭제 먼저(내림차순), 그다음 추가 */
    Object.keys(edits.slidesDeleted).forEach(function(chId){
      var dels=(edits.slidesDeleted[chId]||[]).slice().sort(function(a,b){return b-a;});
      dels.forEach(function(idx){
        if(SLIDES_DATA[chId]&&idx<SLIDES_DATA[chId].length) SLIDES_DATA[chId].splice(idx,1);
      });
    });
    Object.keys(edits.slidesAdded).forEach(function(chId){
      (edits.slidesAdded[chId]||[]).forEach(function(item){
        if(SLIDES_DATA[chId]) SLIDES_DATA[chId].push(item);
      });
    });
  }

  /* ══ 헬퍼 ═══════════════════════════════════════════════════════════════ */
  function mapToOrigIdx(chId,curI){
    var dels=(edits.slidesDeleted[chId]||[]).slice().sort(function(a,b){return a-b;});
    var orig=curI;
    for(var i=0;i<dels.length;i++){if(dels[i]<=orig)orig++;else break;}
    return orig;
  }

  /* ══ 카드 키 부여 ════════════════════════════════════════════════════════ */
  function assignCardKeys(){
    document.querySelectorAll('.tab-content').forEach(function(tabDiv){
      var m=tabDiv.id.match(/^(ch\\d+)-tab-(.+)$/);
      if(!m) return;
      var chId=m[1],tabId=m[2];
      tabDiv.querySelectorAll('.card').forEach(function(card,ci){
        card.setAttribute('data-edit-key',chId+'|'+tabId+'|'+ci);
      });
    });
  }

  /* ══ 복원 적용 ════════════════════════════════════════════════════════════ */
  function applyCardEdits(){
    Object.keys(edits.cards).forEach(function(key){
      var card=document.querySelector('[data-edit-key="'+key+'"]');
      if(!card) return;
      var c=edits.cards[key];
      if(c.title!=null){var t=card.querySelector('.card-title');if(t)t.textContent=c.title;}
      if(c.sub!=null)  {var s=card.querySelector('.card-sub');  if(s)s.textContent=c.sub;}
    });
  }

  function findTabBtn(chId,tabId){
    // HKA variant emits 'switchTab(\\'ch\\', \\'tab\\', this)' with spaces; standard emits no space.
    // Match both via whitespace-tolerant regex.
    var re=new RegExp("switchTab\\\\(\\\\s*'"+chId+"'\\\\s*,\\\\s*'"+tabId+"'");
    var found=null;
    document.querySelectorAll('button.tab-btn').forEach(function(b){
      if(re.test(b.getAttribute('onclick')||'')) found=b;
    });
    return found;
  }

  function applyTabEdits(){
    Object.keys(edits.tabs).forEach(function(key){
      var parts=key.split('|'),chId=parts[0],tabId=parts[1];
      var btn=findTabBtn(chId,tabId);
      if(!btn) return;
      var icon=btn.querySelector('.tab-icon'),toRm=[];
      btn.childNodes.forEach(function(n){if(n!==icon)toRm.push(n);});
      toRm.forEach(function(n){btn.removeChild(n);});
      btn.appendChild(document.createTextNode(edits.tabs[key]));
    });
  }

  /* ── 더블탭/더블클릭 헬퍼 (PC+모바일 통합) ────────────────────────────── */
  function onDblActivate(el, fn){
    el.addEventListener('dblclick', fn);
    var lastTap=0;
    el.addEventListener('touchend',function(e){
      var now=Date.now();
      if(now-lastTap<350){e.preventDefault();fn(e);}
      lastTap=now;
    },{passive:false});
  }

  /* ══ 탭 이름 편집 ════════════════════════════════════════════════════════ */
  function setupTabEditing(){
    document.querySelectorAll('button.tab-btn').forEach(function(btn){
      if(btn._editTabBound) return;
      btn._editTabBound=true;
      onDblActivate(btn,function(e){
        if(!document.body.classList.contains('edit-mode')) return;
        e.stopPropagation();
        var oc=btn.getAttribute('onclick')||'';
        var m=oc.match(/switchTab\\(\\s*'([^']+)'\\s*,\\s*'([^']+)'/);
        if(!m) return;
        var key=m[1]+'|'+m[2];
        var icon=btn.querySelector('.tab-icon'),cur='';
        btn.childNodes.forEach(function(n){if(n!==icon)cur+=n.textContent;});
        cur=cur.trim();
        var inp=document.createElement('input');
        inp.value=cur;
        inp.style.cssText='background:#1a1f2e;color:var(--text);border:1px solid var(--accent);border-radius:4px;padding:2px 6px;font-size:11px;width:100px;font-family:inherit;outline:none;';
        var toRm=[];
        btn.childNodes.forEach(function(n){if(n!==icon)toRm.push(n);});
        toRm.forEach(function(n){btn.removeChild(n);});
        btn.appendChild(inp);
        inp.focus();inp.select();
        var done=false;
        function commit(){
          if(done)return;done=true;
          var val=inp.value.trim()||cur;
          if(btn.contains(inp))btn.removeChild(inp);
          btn.appendChild(document.createTextNode(val));
          edits.tabs[key]=val;schedSave();
        }
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(ev){
          if(ev.key==='Enter'){ev.preventDefault();commit();}
          if(ev.key==='Escape'){inp.value=cur;commit();}
        });
      });
    });
  }

  /* ══ 카드 텍스트 편집 ════════════════════════════════════════════════════ */
  function setupCardEditing(){
    document.querySelectorAll('.card[data-edit-key]').forEach(function(card){
      if(card._editCardBound) return;
      card._editCardBound=true;
      ['card-title','card-sub'].forEach(function(cls){
        var el=card.querySelector('.'+cls);
        if(!el) return;
        /* 편집 모드에서 단일 탭/클릭이 상위 card onclick 도달 방지 */
        el.addEventListener('click',function(e){
          if(document.body.classList.contains('edit-mode'))e.stopPropagation();
        });
        el.addEventListener('touchstart',function(e){
          if(document.body.classList.contains('edit-mode'))e.stopPropagation();
        },{passive:true});
        function activateEdit(e){
          if(!document.body.classList.contains('edit-mode')) return;
          e.stopPropagation();
          if(el.contentEditable==='true') return;
          el.contentEditable='true';
          el.style.outline='1px dashed var(--accent)';
          el.style.borderRadius='3px';
          el.focus();
          /* 모바일 소프트 키보드 올리기 */
          var tmp=document.createElement('input');
          tmp.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px;';
          document.body.appendChild(tmp);tmp.focus();tmp.remove();
          el.focus();
          var orig=el.textContent;
          function commit2(){
            el.contentEditable='false';
            el.style.outline='';el.style.borderRadius='';
            var k=card.getAttribute('data-edit-key');
            if(!edits.cards[k])edits.cards[k]={};
            edits.cards[k][cls==='card-title'?'title':'sub']=el.textContent;
            schedSave();
          }
          el.addEventListener('blur',commit2,{once:true});
          el.addEventListener('keydown',function onKey(ev){
            if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();el.blur();el.removeEventListener('keydown',onKey);}
            if(ev.key==='Escape'){el.textContent=orig;el.blur();el.removeEventListener('keydown',onKey);}
          });
        }
        onDblActivate(el, activateEdit);
      });
    });
  }

  /* ══ 슬라이드 관리 ═══════════════════════════════════════════════════════ */
  function attachThumbEditUI(chId,thumbsEl){
    var obs=thumbObservers[chId];
    if(obs)obs.disconnect();
    /* × 버튼 부착 */
    Array.from(thumbsEl.querySelectorAll('img.carousel-thumb')).forEach(function(img,ti){
      if(img.parentNode.classList&&img.parentNode.classList.contains('edit-thumb-wrap')) return;
      var wrap=document.createElement('div');
      wrap.className='edit-thumb-wrap';
      wrap.style.cssText='position:relative;display:inline-flex;flex-shrink:0;';
      thumbsEl.insertBefore(wrap,img);
      wrap.appendChild(img);
      var del=document.createElement('button');
      del.className='del-slide-btn';  /* CSS 로 편집모드에서만 표시 */
      del.textContent='×';del.title='슬라이드 삭제';
      del.style.cssText='position:absolute;top:1px;right:1px;width:16px;height:16px;background:rgba(239,68,68,.9);color:#fff;border:none;border-radius:50%;font-size:12px;line-height:1;cursor:pointer;padding:0;z-index:10;align-items:center;justify-content:center;';
      del.addEventListener('click',function(e){e.stopPropagation();deleteSlide(chId,ti);});
      wrap.appendChild(del);
    });
    if(obs)obs.observe(thumbsEl,{childList:true});
  }

  /* + 추가 버튼 — 항상 표시, thumbs 위 고정 행 ─────────────────────────────── */
  function setupAddButton(chId){
    var area=document.getElementById(chId+'-carousel-area');
    var thumbsEl=document.getElementById(chId+'-carousel-thumbs');
    if(!area||!thumbsEl||area.querySelector('.slide-add-row')) return;
    var row=document.createElement('div');
    row.className='slide-add-row';
    var btn=document.createElement('button');
    btn.className='slide-add-btn-perm';
    btn.innerHTML='+ 이미지 추가';
    btn.title='슬라이드 이미지 추가';
    btn.addEventListener('click',function(){addSlide(chId);});
    row.appendChild(btn);
    area.insertBefore(row,thumbsEl);
  }

  /* 캐러셀 area.open 감시 → 추가 버튼 삽입 ──────────────────────────────── */
  function setupCarouselAreaObserver(chId){
    var area=document.getElementById(chId+'-carousel-area');
    if(!area||area._addRowObs) return;
    area._addRowObs=true;
    var obs=new MutationObserver(function(){
      if(area.classList.contains('open')) setupAddButton(chId);
    });
    obs.observe(area,{attributes:true,attributeFilter:['class']});
    if(area.classList.contains('open')) setupAddButton(chId);
  }

  function setupThumbObserver(chId){
    if(thumbObservers[chId]) return;
    var thumbsEl=document.getElementById(chId+'-carousel-thumbs');
    if(!thumbsEl) return;
    var obs=new MutationObserver(function(){
      if(document.body.classList.contains('edit-mode'))
        setTimeout(function(){attachThumbEditUI(chId,thumbsEl);},40);
    });
    obs.observe(thumbsEl,{childList:true});
    thumbObservers[chId]=obs;
  }

  function deleteSlide(chId,curI){
    if(!SLIDES_DATA[chId]) return;
    if(!edits.slidesDeleted[chId])edits.slidesDeleted[chId]=[];
    var origRemaining=(origCounts[chId]||0)-(edits.slidesDeleted[chId]||[]).length;
    if(curI<origRemaining){
      var origIdx=mapToOrigIdx(chId,curI);
      if(edits.slidesDeleted[chId].indexOf(origIdx)===-1)edits.slidesDeleted[chId].push(origIdx);
    } else {
      var addedIdx=curI-origRemaining;
      if(edits.slidesAdded[chId])edits.slidesAdded[chId].splice(addedIdx,1);
    }
    SLIDES_DATA[chId].splice(curI,1);
    initCarousel(chId);
    schedSave();
  }

  function addSlide(chId){
    var inp=document.createElement('input');
    inp.type='file';inp.accept='image/*';inp.style.display='none';
    document.body.appendChild(inp);
    inp.click();
    inp.addEventListener('change',function(){
      var file=inp.files[0];
      if(inp.parentNode)inp.parentNode.removeChild(inp);
      if(!file) return;
      var reader=new FileReader();
      reader.onload=function(ev){
        var item={src:ev.target.result,label:'p.추가'};
        SLIDES_DATA[chId].push(item);
        if(!edits.slidesAdded[chId])edits.slidesAdded[chId]=[];
        edits.slidesAdded[chId].push(item);
        initCarousel(chId);
        goTo(chId,SLIDES_DATA[chId].length-1);
        schedSave();
      };
      reader.readAsDataURL(file);
    });
  }

  /* ══ 초기화 버튼 ═════════════════════════════════════════════════════════ */
  var resetBtn=document.createElement('button');
  resetBtn.id='edit-reset-btn';resetBtn.textContent='↺ 초기화';
  resetBtn.style.cssText='position:fixed;bottom:56px;right:20px;z-index:500;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);color:#f87171;padding:7px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;display:none;font-family:inherit;';
  resetBtn.addEventListener('click',function(){
    if(!confirm('모든 편집 내용을 초기화하고 새로고침합니다.\\n계속하시겠습니까?')) return;
    localStorage.removeItem(STORE_KEY);location.reload();
  });
  document.body.appendChild(resetBtn);

  /* ══ toggleEditMode 확장 ════════════════════════════════════════════════ */
  var _orig=window.toggleEditMode;
  window.toggleEditMode=function(){
    _orig();
    var on=document.body.classList.contains('edit-mode');
    resetBtn.style.display=on?'block':'none';
    if(on){
      /* 이미 열려있는 캐러셀에 × 버튼 즉시 부착 */
      document.querySelectorAll('[id$="-carousel-thumbs"]').forEach(function(el){
        var chId=el.id.replace('-carousel-thumbs','');
        if(el.querySelector('img.carousel-thumb'))attachThumbEditUI(chId,el);
      });
      setupTabEditing();
      setupCardEditing();
    }
  };

  /* ══ 초기화 실행 ═════════════════════════════════════════════════════════ */
  loadEdits();
  assignCardKeys();
  applyCardEdits();
  applyTabEdits();
  /* 캐러셀 observer 는 페이지 로드 시 바로 세팅 */
  document.querySelectorAll('[id$="-carousel-area"]').forEach(function(area){
    var chId=area.id.replace('-carousel-area','');
    setupThumbObserver(chId);
    setupCarouselAreaObserver(chId);
  });
})();`;

  // CSS 주입 (첫 번째 </style> 직전)
  const styleClose = html.indexOf('</style>');
  html = html.slice(0, styleClose) + css + '\n' + html.slice(styleClose);

  // 버튼 + JS 주입 (</body> 직전)
  const bodyClose = html.lastIndexOf('</body>');
  html = html.slice(0, bodyClose) + editBtn + '\n<script>' + js + '\n</script>\n' + html.slice(bodyClose);

  return html;
}

// ── 과목별 통합 ─────────────────────────────────────────────────────────────

/**
 * 단일 과목의 HTML 파일들을 하나로 병합
 * @param {object} opts
 * @param {string} opts.subject — 과목명 (chapter-nav 라벨)
 * @param {string} opts.templatePath — shell_template_v2.html 경로
 * @param {Array}  opts.chapters — [{parsed, shortTitle}]
 *   parsed: parseHtmlFile() 반환값
 *   shortTitle: chapter-nav 버튼 짧은 이름 (없으면 parsed.title 사용)
 * @param {string} opts.outputPath — 출력 파일 경로
 * @param {string} [opts.title] — <title> 텍스트 (없으면 subject 사용)
 */
function mergeSubject({ subject, templatePath, chapters, outputPath, title }) {
  console.log(`\n[mergeSubject] ${subject} — ${chapters.length}개 챕터`);

  const { css, jsEngine } = readTemplate(templatePath);

  // 각 챕터를 chN으로 리매핑
  const remapped = chapters.map(({ parsed, shortTitle }, idx) => {
    const chId = `ch${idx + 1}`;
    const isFirst = idx === 0;
    const r = remapChapter(parsed, chId, isFirst);
    r.title = shortTitle || parsed.title;
    return r;
  });

  const chapterNav = buildSubjectChapterNav(subject, remapped);
  const chapterSection = buildCombinedChapterSection(remapped);
  const slidesData = buildCombinedSlidesData(remapped);
  const detailData = buildCombinedDetailData(remapped);

  let html = assembleHTML({
    css,
    jsEngine,
    chapterNav,
    chapterSection,
    slidesData,
    detailData,
    title: title || subject
  });

  html = injectEditFeatures(html);
  fs.writeFileSync(outputPath, html, 'utf8');
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);

  console.log(`  -> ${outputPath}`);
  console.log(`     ${remapped.length}챕터, ${sizeMB}MB`);
  remapped.forEach((r, i) => {
    const slides = (r.slidesRaw.match(/"?src"?\s*:/g) || []).length;
    const details = (r.detailRaw.match(/^\s+\w[\w-]*\s*:/mg) || []).length;
    console.log(`     ch${i+1}: ${r.title} | slides=${slides} details=${details}`);
  });

  return { outputPath, chaptersCount: remapped.length, sizeMB };
}

// ── 전체 통합 ────────────────────────────────────────────────────────────────

/**
 * 여러 과목의 모든 HTML 파일을 하나로 병합 (과목별 그룹 라벨 포함)
 * @param {object} opts
 * @param {string} opts.templatePath
 * @param {Array}  opts.subjects — [{subject, chapters:[{parsed, shortTitle}]}]
 * @param {string} opts.outputPath
 * @param {string} [opts.title]
 */
function mergeAll({ templatePath, subjects, outputPath, title = '전공공부 통합' }) {
  console.log(`\n[mergeAll] ${subjects.map(s => s.subject).join(' / ')}`);

  const { css, jsEngine } = readTemplate(templatePath);

  let globalIdx = 0;
  const groups = subjects.map(({ subject, chapters }) => {
    const remapped = chapters.map(({ parsed, shortTitle }, localIdx) => {
      const chId = `ch${globalIdx + 1}`;
      const isFirst = globalIdx === 0;
      const r = remapChapter(parsed, chId, isFirst);
      r.title = shortTitle || parsed.title;
      r.globalIndex = globalIdx;
      globalIdx++;
      return r;
    });
    return { subject, remapped };
  });

  const allRemapped = groups.flatMap(g => g.remapped);

  const { navHtml, extraCss, extraJs } = buildSubjectSelectorNav(groups);
  const chapterSection = buildCombinedChapterSection(allRemapped);
  const slidesData = buildCombinedSlidesData(allRemapped);
  const detailData = buildCombinedDetailData(allRemapped);

  let html = assembleHTML({
    css,
    jsEngine,
    chapterNav: navHtml,
    chapterSection,
    slidesData,
    detailData,
    title
  });

  // 추가 CSS 주입 (첫 번째 </style> 직전)
  const styleClose = html.indexOf('</style>');
  html = html.slice(0, styleClose) + extraCss + '\n' + html.slice(styleClose);

  // 추가 JS 주입 (마지막 </script> 직전)
  const scriptClose = html.lastIndexOf('</script>');
  html = html.slice(0, scriptClose) + extraJs + '\n' + html.slice(scriptClose);

  html = injectEditFeatures(html);
  fs.writeFileSync(outputPath, html, 'utf8');
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);

  console.log(`  -> ${outputPath}`);
  console.log(`     총 ${allRemapped.length}챕터, ${sizeMB}MB`);

  return { outputPath, chaptersCount: allRemapped.length, sizeMB };
}

module.exports = { mergeSubject, mergeAll, injectEditFeatures };
