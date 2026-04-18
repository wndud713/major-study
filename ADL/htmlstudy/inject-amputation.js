'use strict';
// Inject ch4 절단 tab into 기능훈련2_화상환자ADL.html as tab7 (after tab6 dementia)
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '기능훈련2_화상환자ADL.html');
let html = fs.readFileSync(FILE, 'utf8');

const tabBtnMarker = `<button class="tab-btn" onclick="switchTab('ch1','tab6',this)"><span class="tab-icon">🧠</span>치매 ADL</button>`;
const newTabBtn = `<button class="tab-btn" onclick="switchTab('ch1','tab6',this)"><span class="tab-icon">🧠</span>치매 ADL</button>
        <button class="tab-btn" onclick="switchTab('ch1','tab7',this)"><span class="tab-icon">🦿</span>절단 ADL</button>`;
if (html.indexOf(tabBtnMarker) === -1) throw new Error('tab6 btn marker not found');
if (html.indexOf(`switchTab('ch1','tab7'`) !== -1) throw new Error('tab7 exists');
html = html.replace(tabBtnMarker, newTabBtn);

const tab7 = `
        <!-- 탭 7: 절단 ADL -->
        <div class="tab-content" id="ch1-tab-tab7">
          <div class="section-title">절단 개요 · 분류 · 의지·보행 훈련</div>

          <div class="accordion-parent" role="button" tabindex="0" aria-expanded="false"
               onclick="toggleAccordion(this)"
               onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleAccordion(this);}"
               style="background:linear-gradient(135deg,rgba(52,211,153,0.15),rgba(79,209,197,0.12));border:1.5px solid #34d399;margin-bottom:12px;">
            <div class="ap-head">
              <span class="ap-icon">📊</span>
              <div class="ap-body">
                <div class="ap-title">절단 분류 종합표</div>
                <div class="ap-sub" style="font-size:11.5px;color:#34d399;margin-top:2px;">팔 절단 7종 · 다리 절단 9종 ▼</div>
              </div>
              <span class="chev">▶</span>
            </div>
            <div class="accordion-children" style="padding:0 14px;">
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:4px;min-width:680px;">
                  <thead>
                    <tr style="background:var(--bg4);">
                      <th style="padding:8px 10px;text-align:left;color:#34d399;border-bottom:2px solid var(--border);">부위</th>
                      <th style="padding:8px 10px;text-align:left;color:#34d399;border-bottom:2px solid var(--border);">절단 명칭</th>
                      <th style="padding:8px 10px;text-align:left;color:#34d399;border-bottom:2px solid var(--border);">특징</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background:rgba(56,189,248,0.08);"><td rowspan="7" style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #38bdf8;font-weight:600;">팔 절단</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">전사반부 (forequarter)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">어깨뼈·빗장뼈 제거, 가슴우리 사이</td></tr>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">어깨관절 분리 (shoulder disart.)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">팔 전체 완전 절단</td></tr>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>위팔 (A/E, transhumeral)</b></td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">팔꿉관절 위쪽</td></tr>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">팔꿉관절 분리 (elbow disart.)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">팔꿉관절에서 절단</td></tr>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>아래팔 (B/E, transradial)</b></td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">팔꿉 아래, <b>길수록 엎침·뒤침 기능 ↑</b></td></tr>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">손목관절 분리 (wrist disart.)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">손목에서 절단</td></tr>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">부분 손 (손목/손허리/손가락뼈)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">위치별 세분</td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td rowspan="9" style="padding:7px 10px;border-left:3px solid #f472b6;font-weight:600;">다리 절단</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">골반 절반 (hemipelvectomy)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">골반 한쪽 + 다리 전체</td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">엉덩관절 분리 (hip disart.)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">다리 전체 완전 절단</td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>넙다리 (A/K, transfemoral)</b></td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">무릎 위쪽, <b>넙다리뼈 중간 1/3 이상적</b></td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">무릎관절 분리 (knee disart.)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">무릎관절에서</td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>종아리 (B/K, transtibial)</b></td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">무릎 아래, <b>정강뼈 중간 1/3 또는 상 1/3 이상적</b></td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>싸임 (Syme's)</b></td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">발목 약간 위, <b>체중부하 가능 장점</b></td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">쇼파르 (Chopart)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">목말+발뒤꿈치뼈만 남음</td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);">리스후랑 (Lisfranc)</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">발목발허리관절에서</td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;">발허리뼈 / 발가락 절단</td><td style="padding:7px 10px;">위치별 세분</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="warn-box" style="margin-top:10px;">
                <b>⚠️ 국시 빈출:</b><br>
                • <b>A/E</b> = 위팔 (above elbow), <b>B/E</b> = 아래팔 (below elbow)<br>
                • <b>A/K</b> = 넙다리 (above knee), <b>B/K</b> = 종아리 (below knee)<br>
                • 아래팔 절단 = <b>절단단 길수록 엎침·뒤침 기능 ↑</b><br>
                • 넙다리 = <b>중간 1/3이 이상적</b> / 종아리 = <b>중간 또는 상 1/3</b><br>
                • <b>싸임 절단 = 체중부하 가능</b>
              </div>
            </div>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-overview')">
            <div class="card-body">
              <div class="card-title">절단 개요 · 원인</div>
              <div class="card-sub">외상 · 말초혈관질환 · 감염 · 선천기형 · 종양</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-goal')">
            <div class="card-body">
              <div class="card-title">ADL 궁극적 목표</div>
              <div class="card-sub">잔존 능력 발휘 · 침상·보행 · 환경개선 · 사회 장애 최소화</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-arm')">
            <div class="card-body">
              <div class="card-title">📌 팔 절단 분류 (7종)</div>
              <div class="card-sub">전사반부 · 어깨·팔꿉·손목 분리 · A/E · B/E · 부분손</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-leg')">
            <div class="card-body">
              <div class="card-title">📌 다리 절단 분류 (9종)</div>
              <div class="card-sub">골반·엉덩·무릎 분리 · A/K · B/K · Syme · Chopart · Lisfranc</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-stump')">
            <div class="card-body">
              <div class="card-title">절단단 관리</div>
              <div class="card-sub">피부 · 위생 · 소켓 · 합병증 (궤양·환상통·신경종)</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-bandage')">
            <div class="card-body">
              <div class="card-title">붕대감기</div>
              <div class="card-sub">탄력붕대 · 먼쪽 단단 · 몸쪽 느슨 · 일정 압력</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-don')">
            <div class="card-body">
              <div class="card-title">📌 의지 착용 훈련 (넙다리 7단계)</div>
              <div class="card-sub">양말 → 소켓 → 체중부하 위치 확인</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-gait')">
            <div class="card-body">
              <div class="card-title">📌 하지 보행 훈련 (평행봉)</div>
              <div class="card-sub">균형 · 체중이동 · 무릎굽힘 · 한발서기 · 한걸음 내밀기</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-stair')">
            <div class="card-body">
              <div class="card-title">계단 오르내리기</div>
              <div class="card-sub">종아리(교대) · 넙다리(한 계단씩 — 안전)</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','amp-kneel')">
            <div class="card-body">
              <div class="card-title">무릎 꿇기 · 바닥 앉기 · 장애물 · 자동차</div>
              <div class="card-sub">응용 ADL 동작들</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>
        <!-- /탭 7 -->
`;

const tab6End = `</div>
        <!-- /탭 6 -->`;
const idx = html.indexOf(tab6End);
if (idx === -1) throw new Error('tab6 end marker not found');
html = html.slice(0, idx + tab6End.length) + tab7 + html.slice(idx + tab6End.length);

const dd = `
  'amp-overview': \`<h2>절단(AMPUTATION) 개요</h2>
<div class="detail-section">
  <h3>절단의 중요성</h3>
  <div class="detail-item accent">인간이 ADL을 하는 데 중요한 기관인 <b>팔과 다리</b> 등 신체 일부가 절단 → 신체적·정신적·사회적으로 매우 중요한 장애</div>
</div>
<div class="detail-section">
  <h3>치료 목표</h3>
  <div class="detail-item blue">적합한 <b>의수/의족 착용</b> + 독립적 ADL 훈련 → <b>자신감 회복</b>, 사회생활 기능적 수행</div>
</div>
<div class="detail-section">
  <h3>원인 (상·하지 공통)</h3>
  <div class="detail-item green"><b>외상</b> (주요 원인, 대부분)</div>
  <div class="detail-item green">말초혈관질환</div>
  <div class="detail-item green">감염</div>
  <div class="detail-item green">선천적 기형</div>
  <div class="detail-item green">종양</div>
</div>\`,

  'amp-goal': \`<h2>절단환자 ADL의 궁극적 목표</h2>
<div class="detail-section">
  <h3>핵심 목표</h3>
  <div class="detail-item accent"><b>잔존하는 능력</b>을 다양한 훈련을 통해 최대한 발휘</div>
  <div class="detail-item blue"><b>침상활동, 보행</b> 등 ADL을 원활히 수행</div>
  <div class="detail-item green"><b>환경 개선</b>을 통해 사회적 장애 최소화</div>
</div>\`,

  'amp-arm': \`<h2>팔 절단 분류 (7종)</h2>
<table class="detail-table">
  <tr><th>분류</th><th>영문</th><th>위치·특징</th></tr>
  <tr><td>전사반부 절단</td><td>forequarter amputation</td><td>어깨뼈·빗장뼈 제거, 어깨뼈와 가슴우리 사이</td></tr>
  <tr><td>어깨관절 분리절단</td><td>shoulder disarticulation</td><td>어깨관절 절단, <b>팔 전체 완전 절단</b></td></tr>
  <tr><td><b>위팔 절단 (A/E)</b></td><td>transhumeral</td><td>팔꿉관절 <b>위쪽</b>에서 절단</td></tr>
  <tr><td>팔꿉관절 분리절단</td><td>elbow disarticulation</td><td>팔꿉관절에서의 절단</td></tr>
  <tr><td><b>아래팔 절단 (B/E)</b></td><td>transradial</td><td>팔꿉관절 <b>아래쪽</b>. <b>절단단 길수록 엎침·뒤침 운동 기능 ↑</b></td></tr>
  <tr><td>손목관절 분리절단</td><td>wrist disarticulation</td><td>손목관절에서</td></tr>
  <tr><td>부분 손 절단</td><td>partial hand amputation</td><td>손목뼈 / 손허리뼈 / 손가락뼈 절단</td></tr>
</table>
<div class="warn-box"><b>⚠️ 핵심:</b> <b>A/E</b>(Above Elbow, 위팔) · <b>B/E</b>(Below Elbow, 아래팔)</div>\`,

  'amp-leg': \`<h2>다리 절단 분류 (9종)</h2>
<table class="detail-table">
  <tr><th>분류</th><th>영문</th><th>위치·특징</th></tr>
  <tr><td>골반 절반 절단</td><td>hemipelvectomy</td><td>골반 한쪽 + 다리 전체</td></tr>
  <tr><td>엉덩관절 분리절단</td><td>hip disarticulation</td><td>엉덩관절, 다리 전체 완전 절단</td></tr>
  <tr><td><b>넙다리뼈 절단 (A/K)</b></td><td>transfemoral</td><td>무릎 위쪽. <b>넙다리뼈 중간 1/3이 가장 이상적</b></td></tr>
  <tr><td>무릎관절 분리절단</td><td>knee disarticulation</td><td>무릎관절에서, 무릎 아래 전체</td></tr>
  <tr><td><b>종아리 절단 (B/K)</b></td><td>transtibial</td><td>무릎 아래 정강뼈·종아리뼈 절단. <b>정강뼈 중간 1/3, 상 1/3 부위가 이상적</b></td></tr>
  <tr><td><b>싸임 절단</b></td><td>Syme's disarticulation</td><td>정강뼈·종아리뼈를 발목관절 약간 위에서 절단. <b>체중부하 가능 장점</b></td></tr>
  <tr><td>쇼파르 절단</td><td>Chopart amputation</td><td>발목뼈사이관절 이단 → <b>목말뼈와 발뒤꿈치뼈만 남음</b></td></tr>
  <tr><td>리스후랑 절단</td><td>Lisfranc amputation</td><td>발목발허리관절에서</td></tr>
  <tr><td>발허리뼈 / 발가락 절단</td><td>transmetatarsal / phalangeal</td><td>발허리뼈 또는 발가락뼈사이관절</td></tr>
</table>
<div class="warn-box"><b>⚠️ 핵심:</b> <b>A/K</b>(위, 넙다리) / <b>B/K</b>(아래, 종아리) / <b>Syme</b>은 체중부하 가능</div>\`,

  'amp-stump': \`<h2>절단단(stump)의 관리</h2>
<div class="detail-section">
  <h3>1. 절단단의 피부관리</h3>
  <div class="detail-item red"><b>발생 가능 증상:</b> 찰과상, 수포, 부종, 세균감염, 진균감염</div>
  <div class="detail-item red"><b>수술 후 합병증:</b> 궤양, 피부유착, 신경종, 부종, <b>환상통(phantom pain)</b></div>
</div>
<div class="detail-section">
  <h3>2. 중재</h3>
  <div class="detail-item accent"><b>부종 감소:</b> 압박붕대로 절단단을 단단히 감싸기</div>
  <div class="detail-item accent"><b>신경종·환상통 등 감각 문제:</b> 절단단 부위 가볍게 두드리기(마사지)</div>
  <div class="detail-item accent"><b>통증 감소:</b> 경피신경자극치료(TENS), 초음파 적용</div>
</div>
<div class="detail-section">
  <h3>3. 위생관리</h3>
  <div class="detail-item blue"><b>절단단:</b> 따뜻한 물에 깨끗이 닦고, <b>마른 수건으로 완전히 건조</b></div>
  <div class="detail-item blue"><b>의지 소켓 내부:</b> 따뜻한 물 + 중성비누로 닦고, 마른 수건 건조 후 착용</div>
</div>\`,

  'amp-bandage': \`<h2>붕대감기</h2>
<div class="detail-section">
  <h3>목적과 방법</h3>
  <div class="detail-item accent"><b>탄력붕대</b>로 절단단의 <b>이상적인 모양</b>을 만들기 위해 사용</div>
</div>
<div class="detail-section">
  <h3>감는 방법 (핵심 3원칙)</h3>
  <div class="detail-item blue">① <b>먼쪽(원위)</b> 부위 = <b>단단히</b> 감는다</div>
  <div class="detail-item green">② <b>몸쪽(근위)</b> 부위 = <b>약간 느슨하게</b> 감는다</div>
  <div class="detail-item yellow">③ <b>압력은 항상 일정</b>하게</div>
  <div class="detail-item red">④ 너무 강하게 감으면 <b>혈액순환 문제</b> → 주의</div>
</div>
<div class="warn-box">⚠️ <b>국시 포인트:</b> "먼쪽 단단, 몸쪽 느슨, 일정 압력" — 반대로 감으면 안 됨</div>\`,

  'amp-don': \`<h2>의지(Prosthesis) 착용 훈련</h2>
<div class="detail-section">
  <h3>기본 원칙</h3>
  <div class="detail-item accent">의지 <b>착용과 벗기 전 과정을 환자 스스로 완전히 익힐 때까지</b> 반복 연습</div>
  <div class="detail-item accent"><b>올바른 착용 여부를 본인 스스로 점검</b>할 수 있도록 훈련</div>
</div>
<div class="detail-section">
  <h3>넙다리뼈 절단 환자의 의지 착용 순서 (7단계)</h3>
  <ol style="padding-left:20px;color:var(--text);line-height:1.8;">
    <li>환자를 <b>서거나 앉힌다</b></li>
    <li>피부에 가해지는 전단력 감소를 위해 <b>주름 없이 절단단 양말 착용</b></li>
    <li>소켓 안에서 양말 끝은 <b>공기 분출 밸브 구멍으로 빼내기 쉽게 느슨하게</b>, 절단단은 소켓에 정확히 맞게</li>
    <li>서 있는 자세에서 <b>절단단을 소켓 안에 넣음</b></li>
    <li><b>무릎 굽힘 방지</b>하면서 한 손으로 양말 끝을 팽팽하게 잡아당김</li>
    <li>소켓을 조정하여 <b>긴모음근 위치</b>에 맞춤</li>
    <li><b>체중부하는 궁둥뼈결절</b>에 주어지게 함</li>
  </ol>
</div>
<div class="warn-box">⚠️ <b>핵심 해부학:</b> 넙다리 의지 체중부하 = <b>궁둥뼈결절(ischial tuberosity)</b></div>\`,

  'amp-gait': \`<h2>하지 절단의 보행 훈련 (평행봉)</h2>
<div class="detail-section">
  <h3>평행봉 균형 훈련 — 기본 자세</h3>
  <div class="detail-item accent">평행봉 안에서 바로 서서 <b>거울과 마주보면서</b> 균형훈련</div>
</div>
<div class="detail-section">
  <h3>① 체중부하와 균형훈련</h3>
  <div class="detail-item blue">양쪽 발을 <b>4~6인치</b> 정도 벌린 선 자세 유지</div>
  <div class="detail-item blue"><b>체중부하 대칭적·균등하게 분배</b></div>
  <div class="detail-item blue">자세가 익숙해질 때까지 균형 유지 반복 훈련</div>
</div>
<div class="detail-section">
  <h3>② 체중이동</h3>
  <div class="detail-item green"><b>좌우:</b> 무릎 편 상태에서 교대 체중이동. 몸 옆으로 구부리지 않고 <b>어깨·골반 수평 유지</b>, 골반 움직임으로 이동</div>
  <div class="detail-item green"><b>앞뒤:</b> 무릎·엉덩관절 편 상태에서 의지쪽 <b>발뒤꿈치 들며</b> 앞쪽 체중이동, <b>발가락 끝 들며</b> 뒤꿈치로</div>
</div>
<div class="detail-section">
  <h3>③ 선 자세에서 무릎 굽힘</h3>
  <div class="detail-item yellow">발을 내딛지 않고 선 자세에서 무릎 구부리기</div>
  <div class="detail-item yellow">좌우 체중 이동 완전 습득 전에는 <b>힘든 동작</b></div>
</div>
<div class="detail-section">
  <h3>④ 의지 쪽 다리로 한발 서기 훈련</h3>
  <div class="detail-item red"><b>주의점:</b> 의족으로 충분히 체중 이동 / 상체 균형 / 옆으로 기울지 않음</div>
</div>
<div class="detail-section">
  <h3>⑤ 한걸음 내밀기·체중이동 훈련</h3>
  <div class="detail-item accent">정상 쪽 다리 한발 앞 → 그 자리에서 앞으로 체중 이동</div>
  <div class="detail-item accent">의지 쪽 다리 앞으로 내밀어 같은 동작 반복</div>
</div>\`,

  'amp-stair': \`<h2>계단 오르내리기 훈련</h2>
<div class="detail-section">
  <h3>1. 계단 올라가기</h3>
  <div class="detail-item accent">① <b>정상 쪽 다리</b>를 위쪽 계단 위에 올리고 체중 이동</div>
  <div class="detail-item accent">② 의지 쪽 다리를 정상 쪽 다리 옆에 위치</div>
</div>
<div class="detail-section">
  <h3>2. 계단 내려가기</h3>
  <div class="detail-item blue">① <b>정상 쪽 다리</b>에 먼저 체중 이동 후 정상 쪽 엉덩·무릎 굽히며 <b>의지 쪽 다리를 아래 계단</b>으로</div>
  <div class="detail-item blue">② 의지 쪽으로 체중 이동 후 정상 쪽 다리를 아래 계단으로</div>
</div>
<div class="warn-box">
  ⚠️ <b>절단 부위별 차이:</b><br>
  • <b>종아리 절단(B/K):</b> 의지·정상 다리 교대로 한 발씩 올라갈 수 있음<br>
  • <b>넙다리 절단(A/K):</b> 안전상 위험 → <b>한 번에 한 계단씩 올라가는 것이 바람직</b>
</div>\`,

  'amp-kneel': \`<h2>응용 ADL 훈련 — 무릎꿇기·바닥·장애물·자동차</h2>
<div class="detail-section">
  <h3>① 무릎 꿇기</h3>
  <div class="detail-item accent">의지 쪽 다리를 약간 구부리고 체중을 정상 쪽에 지지 → 정상 쪽 다리 구부림</div>
  <div class="detail-item accent">양쪽 무릎 완전 구부림, <b>앞으로 넘어지는 것 방지 위해 뒤쪽으로 체중지지</b></div>
</div>
<div class="detail-section">
  <h3>② 무릎 꿇은 자세에서 일어나기</h3>
  <div class="detail-item blue"><b>정상 쪽 다리 먼저 세워</b> 지면에 위치 → 허리 앞으로 구부리며 정상 쪽 엉덩·무릎 펴고 일어섬</div>
</div>
<div class="detail-section">
  <h3>③ 바닥에 앉기</h3>
  <div class="detail-item green">체중을 정상 쪽 다리에 지지 → <b>의지 쪽 다리를 앞쪽으로</b> 위치 → 허리 구부리며 정상쪽 엉덩·무릎 구부림</div>
  <div class="detail-item green">손으로 바닥을 짚고 <b>정상 쪽 엉덩이로 앉음</b></div>
</div>
<div class="detail-section">
  <h3>④ 바닥에서 일어나기</h3>
  <div class="detail-item yellow">양손을 몸 뒤쪽으로 옮겨 지탱 → 정상 쪽 다리 구부려 정상 쪽으로 회전하여 <b>엎드린 자세</b> → 정상 쪽 다리 세워 엉덩·무릎 펴며 일어섬</div>
</div>
<div class="detail-section">
  <h3>⑤ 장애물 넘기</h3>
  <div class="detail-item red">정상 쪽으로 체중이동 후 <b>의지 쪽 다리로 장애물 넘기</b></div>
  <div class="detail-item red">장애물 넘고 의지 쪽 엉덩·무릎 펴고 정상 쪽 다리로 넘기</div>
</div>
<div class="detail-section">
  <h3>⑥ 자동차 타기</h3>
  <div class="detail-item accent">① 정상 쪽 손으로 차 안쪽 좌석, 의지 쪽 손으로 문 잡기 → 정상 쪽 다리에 체중지지</div>
  <div class="detail-item accent">② 몸을 차 안으로 숙이며 <b>의지 쪽 다리 먼저</b> 차 안으로 → 정상 쪽 다리 옮기며 좌석에 앉음</div>
</div>\`,

`;

// Insert details into allDetailData['ch1']
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
if (endBrace === -1) throw new Error('close brace missing');
html = html.slice(0, endBrace) + dd + html.slice(endBrace);

fs.writeFileSync(FILE, html);
console.log('OK. New size:', fs.statSync(FILE).size);
