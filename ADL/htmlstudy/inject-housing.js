'use strict';
// ch3 주거·교통 → 기능훈련2_화상환자ADL.html as tab8
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '기능훈련2_화상환자ADL.html');
let html = fs.readFileSync(FILE, 'utf8');

const marker = `<button class="tab-btn" onclick="switchTab('ch1','tab7',this)"><span class="tab-icon">🦿</span>절단 ADL</button>`;
const newBtn = `<button class="tab-btn" onclick="switchTab('ch1','tab7',this)"><span class="tab-icon">🦿</span>절단 ADL</button>
        <button class="tab-btn" onclick="switchTab('ch1','tab8',this)"><span class="tab-icon">🏠</span>주거·교통</button>`;
if (html.indexOf(marker) === -1) throw new Error('marker not found');
if (html.indexOf(`switchTab('ch1','tab8'`) !== -1) throw new Error('tab8 exists');
html = html.replace(marker, newBtn);

const tab8 = `
        <!-- 탭 8: 주거·교통 -->
        <div class="tab-content" id="ch1-tab-tab8">
          <div class="section-title">주거 환경 · 지역사회 · 공공교통 (접근권·이동권)</div>

          <div class="card" onclick="openDetail('ch1','house-overview')">
            <div class="card-body">
              <div class="card-title">주거 환경 개요·역사</div>
              <div class="card-sub">1981 장애인복지법 · 1997 편의증진법 · barrier free</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','house-req')">
            <div class="card-body">
              <div class="card-title">📌 주거 기본 요건 (5가지)</div>
              <div class="card-sub">안전 · 쾌적 · 편리 · 융통 · 보건</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','house-pt-role')">
            <div class="card-body">
              <div class="card-title">물리·작업치료사의 역할</div>
              <div class="card-sub">기본 동작능력 회복 · 사회복귀 · 구체적 제안</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','house-principle')">
            <div class="card-body">
              <div class="card-title">📌 주택개조 일반원칙 (6가지)</div>
              <div class="card-sub">정주성 · 범용성 · 안전성 · 자립성 · 편리성 · 쾌적성</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','house-consider')">
            <div class="card-body">
              <div class="card-title">개조 시 고려사항 (대상 특성 5)</div>
              <div class="card-sub">인구학·신체·경제·사회·심리 특성</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','house-modify')">
            <div class="card-body">
              <div class="card-title">📌 주거 개조하기 (구역별)</div>
              <div class="card-sub">바닥·벽·문·단차 · 안전손잡이 · 가구·수납·조작기</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','community')">
            <div class="card-body">
              <div class="card-title">지역사회 환경</div>
              <div class="card-sub">점자도서관·블럭 · 장애인 화장실 · 단차 제거 · 자동센서</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','access-right')">
            <div class="card-body">
              <div class="card-title">📌 접근권 (Rights to Access)</div>
              <div class="card-sub">이동권 + 시설이용권 + 정보접근권</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','mobility-right')">
            <div class="card-body">
              <div class="card-title">📌 이동권 (Rights to Mobility)</div>
              <div class="card-sub">교통시설 이용 제약 받지 않을 권리</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','transport')">
            <div class="card-body">
              <div class="card-title">공공교통 보조시설</div>
              <div class="card-sub">저상버스 · 지하철 안전발판 · 핸드컨트롤러 · 음성장치</div>
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
  'house-overview': \`<h2>주거 환경의 개요</h2>
<div class="detail-section">
  <h3>장애인과 주거환경의 정비 — 역사</h3>
  <div class="detail-item accent"><b>1981년 국제장애인의 해</b>를 계기로 <b>"장벽해소(barrier free)"</b> 라는 말 보편화</div>
  <div class="detail-item blue"><b>1981년 장애인복지법</b> 제정 → 여러 차례 개정·보완</div>
  <div class="detail-item green"><b>1997년 장애인 편의증진법</b> 제정</div>
  <div class="detail-item yellow"><b>2008년 노인장기요양보험</b>과 함께 장애인·고령자 보호 생활환경 마련</div>
</div>
<div class="detail-section">
  <h3>핵심 개념</h3>
  <div class="detail-item red">신체에 장애가 발생해도 <b>주거환경이 대응할 수 있으면 "생활장애인"이 되지 않음</b></div>
  <div class="detail-item red">신체상황과 그 변화도 함께 고려하여 주택 개조</div>
</div>\`,

  'house-req': \`<h2>주거의 기본 요건과 기능 (5가지)</h2>
<table class="detail-table">
  <tr><th>요건</th><th>설명</th></tr>
  <tr><td><b>안전성</b></td><td>일상생활 사고·위험 염려가 없도록</td></tr>
  <tr><td><b>쾌적성</b></td><td>적당한 환기·냉난방, 효율적 환경설비 → 심신 쉴 수 있는 곳</td></tr>
  <tr><td><b>편리성</b></td><td>각 방으로 이동 쉬움, 주택설비 안전·조작 쉬움</td></tr>
  <tr><td><b>융통성</b></td><td>장애·나이에 따른 신체능력 저하에 대응한 <b>가변성 확보</b></td></tr>
  <tr><td><b>보건성</b></td><td><b>알레르기 반응이 일어나지 않는 위생적 건축재료</b> 선정·도입</td></tr>
</table>\`,

  'house-pt-role': \`<h2>주택개조와 물리·작업치료사의 역할</h2>
<div class="detail-section">
  <h3>주택개조 정의</h3>
  <div class="detail-item accent">노인·장애인의 <b>안전성과 자립성 증진</b>을 위해 주택구조를 개선하거나 시설 등을 교체하는 등의 <b>주택의 물리적 개선</b></div>
</div>
<div class="detail-section">
  <h3>주택개조의 필요성</h3>
  <div class="detail-item blue">일상생활 중 안전사고 사전 방지</div>
  <div class="detail-item blue">자립적 생활 영위 → 안전손잡이 부착, 바닥 단차 제거 등</div>
</div>
<div class="detail-section">
  <h3>물리치료사의 역할</h3>
  <div class="detail-item green"><b>장애인의 기본적 동작능력 회복</b>을 위한 여러 치료 담당</div>
  <div class="detail-item green">치료행위는 <b>사회복귀가 목표</b></div>
  <div class="detail-item green">대상자의 필요·생활상 구체적 문제 발견 → 사회생활 영위할 수 있도록 문제 해결</div>
  <div class="detail-item green">쾌적한 사회생활을 향한 <b>구체적 제안 → 치료로 연결</b></div>
</div>\`,

  'house-principle': \`<h2>주택개조의 일반원칙 (6가지)</h2>
<table class="detail-table">
  <tr><th>원칙</th><th>설명</th></tr>
  <tr><td><b>정주성</b></td><td>살던 지역의 자기 집에서 <b>계속 지낼 수 있도록</b> 지원</td></tr>
  <tr><td><b>범용성</b></td><td>함께 사는 다른 가족의 사용성도 고려하여 개조</td></tr>
  <tr><td><b>안전성</b></td><td>발생 가능 사고 예방 → 안전 생활</td></tr>
  <tr><td><b>자립성</b></td><td>스스로 타인 도움 없이 ADL 가능하도록 지원</td></tr>
  <tr><td><b>편리성</b></td><td>편리하게 이용 가능, <b>설비·부품의 설치·교체 용이</b></td></tr>
  <tr><td><b>쾌적성</b></td><td>물리적(일조·채광·통풍·환기·냉난방) + 심리적 환경요인 충족</td></tr>
</table>
<div class="warn-box">⚠️ <b>국시 핵심:</b> 6원칙 = <b>정·범·안·자·편·쾌</b></div>\`,

  'house-consider': \`<h2>주택개조 시 고려사항 — 대상 특성 5가지</h2>
<table class="detail-table">
  <tr><th>특성</th><th>파악 항목</th></tr>
  <tr><td><b>인구학적</b></td><td>연령, 성별, 가족구성(관계, 동거·별거, 건강, 연락처, 특이사항)</td></tr>
  <tr><td><b>신체적</b></td><td>수행능력, 이동능력, 과거병력, 장애 종류, 보조기 사용, 신장·체중</td></tr>
  <tr><td><b>경제적</b></td><td>소득수준, 개조비 지출 가능성</td></tr>
  <tr><td><b>사회적</b></td><td>생활양식, 외부활동 종류·내용</td></tr>
  <tr><td><b>심리적</b></td><td>성격, 개조의향</td></tr>
</table>\`,

  'house-modify': \`<h2>주거 개조하기 (구역별)</h2>
<div class="detail-section">
  <h3>구분 (장애 유형별 개조)</h3>
  <div class="detail-item accent">주택 내 주로 <b>휠체어 사용 / 목발 사용 / 앉거나 기는 생활</b>로 구분</div>
  <div class="detail-item accent">자신의 장애 유형에 맞는 개조 내용 선택</div>
</div>
<div class="detail-section">
  <h3>일반 사항 — 구조</h3>
  <div class="detail-item blue"><b>바닥:</b> 미끄럼 방지 마감, 단차 제거</div>
  <div class="detail-item blue"><b>벽:</b> 핸드레일 설치, 모서리 보호</div>
  <div class="detail-item blue"><b>문:</b> <b>유효폭 0.8m 이상</b> (휠체어 통과), 미닫이·자동문, 손잡이 레버형</div>
  <div class="detail-item blue"><b>단차:</b> 경사로(slope), 단차 제거, 단차표시</div>
</div>
<div class="detail-section">
  <h3>설비·가구</h3>
  <div class="detail-item green"><b>조작기:</b> 스위치·콘센트·인터폰 — 휠체어 사용자 높이 (0.4~1.2m)</div>
  <div class="detail-item green"><b>가구·수납공간:</b> 휠체어 무릎이 들어가는 깊이, 손 닿는 높이</div>
  <div class="detail-item green"><b>전동 침대 / 휠체어 사용자 침실</b></div>
  <div class="detail-item green"><b>전기 수동높이 조절 조리대·서랍장</b></div>
</div>
<div class="detail-section">
  <h3>안전손잡이 (Grab bar)</h3>
  <div class="detail-item yellow">화장실·욕실·복도 — 일어서기·이동·균형 보조</div>
</div>\`,

  'community': \`<h2>지역사회 환경</h2>
<div class="detail-section">
  <h3>의의</h3>
  <div class="detail-item accent">장애인·노약자가 지역사회 안에서 ADL 시 많은 어려움 → 이를 제거하여 <b>독립적 일상생활·자유 이동·사회참여</b> 가능하도록 환경 재구성 필요</div>
  <div class="detail-item accent">지역사회환경·공공교통 포함 사회 전체 시스템을 <b>장애를 가진 사람이 이용하기 편리한 구조로 재구성</b></div>
</div>
<div class="detail-section">
  <h3>주요 시설</h3>
  <div class="detail-item blue"><b>점자도서관</b> — 시각장애</div>
  <div class="detail-item blue"><b>점자블럭</b> — 보도·역사 안내</div>
  <div class="detail-item blue"><b>장애인 전용 화장실</b></div>
  <div class="detail-item green"><b>낮은 연결 턱</b> — 단차 없애 이동 불편 해소</div>
  <div class="detail-item green"><b>자동 센서를 이용한 대상 인식</b> — 자동문</div>
  <div class="detail-item green"><b>주 출입구 유효폭 0.8m</b> 이상</div>
  <div class="detail-item yellow"><b>전동 휠체어·스쿠터 급속 충전기</b> — 휠체어 사용자가 사용할 수 있도록 높이 차이를 둠</div>
</div>\`,

  'access-right': \`<h2>장애인의 접근권 (Rights to Access)</h2>
<div class="detail-section">
  <h3>정의</h3>
  <div class="detail-item accent"><b>접근권:</b> 장애인이 사회 전 분야에 걸쳐 <b>기회의 균등과 적극적 사회 참여</b>를 목적으로 <b>교육, 노동, 문화 생활을 향유</b>할 수 있는 근본적 권리</div>
</div>
<div class="detail-section">
  <h3>접근권의 구성</h3>
  <div class="detail-item blue"><b>이동권</b> — 물리적 장벽 제거</div>
  <div class="detail-item blue"><b>시설이용권</b> — 물리적 장벽 제거</div>
  <div class="detail-item green"><b>정보통신권 (정보접근권)</b> — 정보의 장벽 제거</div>
</div>
<div class="detail-section">
  <h3>법적 근거</h3>
  <div class="detail-item yellow"><b>1997년 편의증진법</b> 제정 → 장애인의 사회 구성원으로 참여 가능</div>
  <div class="detail-item yellow"><b>2004년부터</b> 보조공학센터·재활공학서비스연구지원센터 통해 보조공학기기 보급·지원</div>
  <div class="detail-item yellow">정보취약계층 정보통신 접근성 제고 방안 제시</div>
</div>\`,

  'mobility-right': \`<h2>이동권 (Rights to Mobility)</h2>
<div class="detail-section">
  <h3>정의</h3>
  <div class="detail-item accent"><b>이동권:</b> <b>물리적 장벽, 특히 교통시설 이용 등에서의 제약을 받지 않을 권리</b></div>
  <div class="detail-item accent">장애인이 일상생활에서 비장애인과 마찬가지로 <b>원하는 곳으로 이동하는 데 불편 없이 움직일 권리</b></div>
</div>
<div class="detail-section">
  <h3>이동권 존중 이유</h3>
  <div class="detail-item blue">거리·건물 설계가 <b>비장애인 기준</b>으로 되어 있어 이동 불편을 초래할 환경적 요소가 많음</div>
  <div class="detail-item blue">장애인 이동권 = 장애인 이동에 지장 초래하지 않게 <b>거리 정비·건물설계·비장애인 협조 요구</b></div>
</div>
<div class="detail-section">
  <h3>장애인 공공교통 체계</h3>
  <div class="detail-item green"><b>개별교통수단:</b> 자가운전 또는 다른 사람의 차량에 동승</div>
  <div class="detail-item green"><b>대중교통수단:</b> 차량 미소유 → 일정 요금 지불 후 공동 이용</div>
</div>\`,

  'transport': \`<h2>공공교통 보조시설</h2>
<div class="detail-section">
  <h3>지하철</h3>
  <div class="detail-item accent"><b>지하철 안 휠체어 공간</b></div>
  <div class="detail-item accent"><b>지하철 개찰구 입구</b> 확장</div>
  <div class="detail-item accent"><b>장애인을 위한 안내시설</b> — 음성장치</div>
  <div class="detail-item accent"><b>지하철 안전발판</b> — 발 빠짐 예방, 휠체어·지팡이 이동 편리</div>
</div>
<div class="detail-section">
  <h3>경사로·리프트</h3>
  <div class="detail-item blue"><b>경사로 구조</b> — 단차 극복</div>
  <div class="detail-item green"><b>리프트 구조</b> — 계단 옆 휠체어 리프트</div>
</div>
<div class="detail-section">
  <h3>버스</h3>
  <div class="detail-item yellow"><b>저상버스</b> — 휠체어 공간 + 안전 손잡이</div>
</div>
<div class="detail-section">
  <h3>자가운전 보조</h3>
  <div class="detail-item red"><b>핸드컨트롤러 손잡이 (운전):</b> 손가락을 이용하지 않고 <b>손목·어깨 동작</b>으로 방향지시기·브레이크락 조작 → 일체형</div>
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
