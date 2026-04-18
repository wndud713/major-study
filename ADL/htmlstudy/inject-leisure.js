'use strict';
// ch3 여가·스포츠 → 기능훈련1_ADL개론.html as tab8
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '기능훈련1_ADL개론.html');
let html = fs.readFileSync(FILE, 'utf8');

const marker = `<button class="tab-btn" onclick="switchTab('ch1','tab7',this)"><span class="tab-icon">🦽</span>보조도구</button>`;
const newBtn = `<button class="tab-btn" onclick="switchTab('ch1','tab7',this)"><span class="tab-icon">🦽</span>보조도구</button>
        <button class="tab-btn" onclick="switchTab('ch1','tab8',this)"><span class="tab-icon">🏊</span>여가·스포츠</button>`;
if (html.indexOf(marker) === -1) throw new Error('marker not found');
if (html.indexOf(`switchTab('ch1','tab8'`) !== -1) throw new Error('tab8 exists');
html = html.replace(marker, newBtn);

const tab8 = `
        <!-- 탭 8: 여가·스포츠 -->
        <div class="tab-content" id="ch1-tab-tab8">
          <div class="section-title">여가의 기능·요소 · 장애인 스포츠</div>

          <div class="card" onclick="openDetail('ch1','leisure-func')">
            <div class="card-body">
              <div class="card-title">📌 여가의 긍정적 기능 (5가지)</div>
              <div class="card-sub">휴식 · 심리 · 자기실현 · 사회 · 교육·문화</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','leisure-elem')">
            <div class="card-body">
              <div class="card-title">📌 여가의 요소 (4가지)</div>
              <div class="card-sub">자기관리 · 동기부여 · 자유 · 전념</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','sports-types')">
            <div class="card-body">
              <div class="card-title">장애인 스포츠 종류</div>
              <div class="card-sub">패럴림픽·휠체어 농구·수영·양궁·역도·골볼 등</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','sports-effect')">
            <div class="card-body">
              <div class="card-title">스포츠 활동 효과</div>
              <div class="card-sub">신체·심리·사회 통합 · 재활 효과</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>
        <!-- /탭 8 -->
`;

const tab7End = `<!-- /탭 7 -->`;
const idx = html.indexOf(tab7End);
if (idx === -1) throw new Error('tab7 end marker not found');
html = html.slice(0, idx + tab7End.length) + tab8 + html.slice(idx + tab7End.length);

const dd = `
  'leisure-func': \`<h2>여가의 긍정적 기능 (5가지)</h2>
<table class="detail-table">
  <tr><th>No.</th><th>기능</th><th>의미</th></tr>
  <tr><td>1</td><td><b>휴식 기능</b></td><td>일상 스트레스·피로 해소, 심신 회복</td></tr>
  <tr><td>2</td><td><b>심리적 기능</b></td><td>즐거움·만족감·정서적 안정</td></tr>
  <tr><td>3</td><td><b>자기실현 기능</b></td><td>잠재력 개발·자존감 향상</td></tr>
  <tr><td>4</td><td><b>사회적 기능</b></td><td>사회적 관계·소속감·통합</td></tr>
  <tr><td>5</td><td><b>교육·문화적 기능</b></td><td>학습·창의성·문화적 풍요</td></tr>
</table>
<div class="tip-box">💡 <b>장애인에게 더 중요한 이유:</b> ADL 제한 → 여가는 사회 통합·자기실현의 핵심 통로</div>\`,

  'leisure-elem': \`<h2>여가의 요소 (4가지)</h2>
<table class="detail-table">
  <tr><th>요소</th><th>설명</th></tr>
  <tr><td><b>자기관리 (Self-management)</b></td><td>자신이 선택·관리하는 활동</td></tr>
  <tr><td><b>동기부여 (Motivation)</b></td><td>내적 욕구·즐거움이 동기</td></tr>
  <tr><td><b>현실구속으로부터의 자유</b></td><td>의무·책임으로부터 해방감</td></tr>
  <tr><td><b>전념 (Engagement)</b></td><td>활동에 몰입·집중</td></tr>
</table>
<div class="warn-box">⚠️ <b>국시 포인트:</b> 여가 = 자기 선택 + 내적 동기 + 자유감 + 몰입 (의무·강제가 아님)</div>\`,

  'sports-types': \`<h2>장애인 스포츠 종류</h2>
<div class="detail-section">
  <h3>패럴림픽 종목 (대표)</h3>
  <div class="detail-item accent"><b>휠체어 종목:</b> 농구, 럭비, 펜싱, 테니스, 컬링</div>
  <div class="detail-item blue"><b>수상:</b> 수영, 카누, 조정, 트라이애슬론</div>
  <div class="detail-item green"><b>육상:</b> 트랙, 멀리뛰기, 창던지기, 마라톤 (휠체어/시각장애 가이드)</div>
  <div class="detail-item yellow"><b>구기:</b> <b>골볼(시각장애)</b>, 보치아(뇌성마비)</div>
  <div class="detail-item red"><b>기타:</b> 양궁, 역도, 사이클, 승마, 사격, 유도</div>
</div>
<div class="detail-section">
  <h3>일반 여가 스포츠</h3>
  <div class="detail-item accent">수영, 요가, 필라테스, 등산, 자전거, 댄스, 게이트볼</div>
</div>\`,

  'sports-effect': \`<h2>스포츠 활동의 효과</h2>
<div class="detail-section">
  <h3>신체적 효과</h3>
  <div class="detail-item accent"><b>심폐 기능</b> 향상</div>
  <div class="detail-item accent"><b>근력·근지구력</b> 강화</div>
  <div class="detail-item accent">유연성·균형·협응 향상</div>
  <div class="detail-item accent">체중 관리·만성질환 예방</div>
</div>
<div class="detail-section">
  <h3>심리적 효과</h3>
  <div class="detail-item blue">자존감·자기효능감 향상</div>
  <div class="detail-item blue">우울·불안 감소</div>
  <div class="detail-item blue">스트레스 해소</div>
</div>
<div class="detail-section">
  <h3>사회적 효과</h3>
  <div class="detail-item green">또래·팀원과의 관계 형성</div>
  <div class="detail-item green">사회 통합·시민의식</div>
  <div class="detail-item green">장애에 대한 사회 인식 개선</div>
</div>
<div class="detail-section">
  <h3>재활 효과</h3>
  <div class="detail-item yellow">ADL 수행 능력 향상</div>
  <div class="detail-item yellow">2차 합병증 예방 (욕창·심폐 저하·근위축)</div>
</div>\`,

`;

const blockStart = html.indexOf("allDetailData['ch1'] = {");
const braceStart = html.indexOf('{', blockStart);
let depth = 0, inStr = false, strCh = '', endBrace = -1, prevCh = '';
for (let i = braceStart; i < html.length; i++) {
  const ch = html[i];
  if (inStr) { if (ch === strCh && prevCh !== '\\') inStr = false; }
  else {
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
  }
  prevCh = ch;
}
html = html.slice(0, endBrace) + dd + html.slice(endBrace);
fs.writeFileSync(FILE, html);
console.log('OK. Size:', fs.statSync(FILE).size);
