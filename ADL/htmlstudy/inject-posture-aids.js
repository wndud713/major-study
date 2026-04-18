'use strict';
// Inject ch2 자세·감염관리 (tab6) + ch4 보조도구 (tab7) into 기능훈련1_ADL개론.html
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '기능훈련1_ADL개론.html');
let html = fs.readFileSync(FILE, 'utf8');

const tabBtnMarker = `<button class="tab-btn" onclick="switchTab('ch1','tab5',this)"><span class="tab-icon">📊</span>ADL 평가도구</button>`;
const newTabBtn = `<button class="tab-btn" onclick="switchTab('ch1','tab5',this)"><span class="tab-icon">📊</span>ADL 평가도구</button>
        <button class="tab-btn" onclick="switchTab('ch1','tab6',this)"><span class="tab-icon">🛏️</span>자세·감염관리</button>
        <button class="tab-btn" onclick="switchTab('ch1','tab7',this)"><span class="tab-icon">🦽</span>보조도구</button>`;
if (html.indexOf(tabBtnMarker) === -1) throw new Error('tab5 btn not found');
if (html.indexOf(`switchTab('ch1','tab6'`) !== -1) throw new Error('tab6 exists');
html = html.replace(tabBtnMarker, newTabBtn);

const tab67 = `
        <!-- 탭 6: 자세·감염관리 -->
        <div class="tab-content" id="ch1-tab-tab6">
          <div class="section-title">환자 자세취하기 · 병원 감염관리</div>

          <div class="card" onclick="openDetail('ch1','posture-types')">
            <div class="card-body">
              <div class="card-title">📌 환자 자세 5종</div>
              <div class="card-sub">앙와위 · 측와위 · 복와위 · 반좌위 · Fowler</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','posture-method')">
            <div class="card-body">
              <div class="card-title">자세 취하기 방법</div>
              <div class="card-sub">베개 위치 · 관절 정렬 · 압력 분산 · 욕창 예방</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','infection-def')">
            <div class="card-body">
              <div class="card-title">병원 감염 정의·중요성</div>
              <div class="card-sub">입원 후 발생 감염 · 의료 질·경제·법적·윤리·사회 문제</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','infection-effect')">
            <div class="card-body">
              <div class="card-title">감염관리 효과</div>
              <div class="card-sub">안전한 환경 제공 · 재원일수↓ · 추가비용↓</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','infection-room')">
            <div class="card-body">
              <div class="card-title">치료실 감염관리 지침</div>
              <div class="card-sub">감염 환자 별도 치료 · VRE/VRSA → 접촉경계</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','infection-staff')">
            <div class="card-body">
              <div class="card-title">치료사 감염관리 지침</div>
              <div class="card-sub">건강검진 · 예방접종 · 직원교육 · 임신직원 관리</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','hand-hygiene')">
            <div class="card-body">
              <div class="card-title">손 위생</div>
              <div class="card-sub">손씻기·소독 · 위생제 선택 · 동기화 프로그램</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>

        <!-- 탭 7: ADL 보조도구 -->
        <div class="tab-content" id="ch1-tab-tab7">
          <div class="section-title">ADL 보조도구 카테고리별 분류</div>

          <div class="accordion-parent" role="button" tabindex="0" aria-expanded="false"
               onclick="toggleAccordion(this)"
               onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleAccordion(this);}"
               style="background:linear-gradient(135deg,rgba(251,146,60,0.15),rgba(244,114,182,0.12));border:1.5px solid #fb923c;margin-bottom:12px;">
            <div class="ap-head">
              <span class="ap-icon">📊</span>
              <div class="ap-body">
                <div class="ap-title">ADL 보조도구 종합표</div>
                <div class="ap-sub" style="font-size:11.5px;color:#fb923c;margin-top:2px;">식사·위생·착탈의·이동·의사소통 ▼</div>
              </div>
              <span class="chev">▶</span>
            </div>
            <div class="accordion-children" style="padding:0 14px;">
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:4px;min-width:560px;">
                  <thead>
                    <tr style="background:var(--bg4);">
                      <th style="padding:8px 10px;text-align:left;color:#fb923c;border-bottom:2px solid var(--border);">영역</th>
                      <th style="padding:8px 10px;text-align:left;color:#fb923c;border-bottom:2px solid var(--border);">대표 도구</th>
                      <th style="padding:8px 10px;text-align:left;color:#fb923c;border-bottom:2px solid var(--border);">목적</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #38bdf8;font-weight:600;">식사</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">Built-up handle 숟가락, Plate guard, Rocker knife, Suction cup, 빨대 컵</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">악력 약화·한 손 사용 보조</td></tr>
                    <tr style="background:rgba(167,139,250,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #a78bfa;font-weight:600;">위생</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">Long handle sponge, 양치기 보조, 면도기 핸들, Wash mitt</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">관절가동범위(ROM) 제한 보완</td></tr>
                    <tr style="background:rgba(52,211,153,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #34d399;font-weight:600;">착탈의</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>Dressing stick, Button hook, Reacher, Sock aid, Long handle shoehorn</b>, Velcro fastener</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">단추·지퍼·양말·신발 자조</td></tr>
                    <tr style="background:rgba(79,209,197,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #4fd1c5;font-weight:600;">화장실</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>Grab bar, Raised toilet seat, Commode, Bedside commode, Bidet</b></td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">앉기·일어서기·이동 안전</td></tr>
                    <tr style="background:rgba(251,146,60,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #fb923c;font-weight:600;">목욕</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">Tub bench, Shower chair, Hand-held shower, Non-slip mat</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">미끄럼·낙상 예방</td></tr>
                    <tr style="background:rgba(244,114,182,0.08);"><td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #f472b6;font-weight:600;">이동</td><td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>Sliding board, Transfer belt, Hoyer lift, Walker, Crutches, Cane, Wheelchair</b></td><td style="padding:7px 10px;border-bottom:1px solid var(--border);">침상·휠체어·보행 이동</td></tr>
                    <tr style="background:rgba(56,189,248,0.08);"><td style="padding:7px 10px;border-left:3px solid #38bdf8;font-weight:600;">의사소통</td><td style="padding:7px 10px;">의사소통판(communication board), AAC 기기, 음성합성장치, 환경제어시스템(ECS)</td><td style="padding:7px 10px;">언어·운동 장애 보완</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="warn-box" style="margin-top:10px;">
                <b>⚠️ 국시 빈출:</b><br>
                • <b>Reacher</b> = 손 닿지 않는 곳 잡기 (척추 굴곡 제한 환자)<br>
                • <b>Sock aid</b> = 양말 신기 (엉덩관절 굴곡 제한)<br>
                • <b>Button hook</b> = 단추 잠그기 (편마비·관절염)<br>
                • <b>Long handle shoehorn</b> = 신발 신기<br>
                • <b>Grab bar / Raised toilet seat</b> = 화장실 안전 + 일어서기 보조
              </div>
            </div>
          </div>

          <div class="card" onclick="openDetail('ch1','aid-eating')">
            <div class="card-body">
              <div class="card-title">📌 식사 보조도구</div>
              <div class="card-sub">Built-up handle · Plate guard · Rocker knife · Suction cup</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','aid-hygiene')">
            <div class="card-body">
              <div class="card-title">📌 개인위생 보조도구</div>
              <div class="card-sub">Long handle sponge · Wash mitt · 양치·면도 보조</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','aid-dressing')">
            <div class="card-body">
              <div class="card-title">📌 옷 입기 보조도구 5종</div>
              <div class="card-sub">Dressing stick · Button hook · Reacher · Sock aid · Long handle shoehorn</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','aid-toilet')">
            <div class="card-body">
              <div class="card-title">📌 화장실·목욕 보조도구</div>
              <div class="card-sub">Grab bar · Raised toilet seat · Tub bench · Commode</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','aid-mobility')">
            <div class="card-body">
              <div class="card-title">📌 이동 보조도구</div>
              <div class="card-sub">Sliding board · Transfer belt · Hoyer lift · Walker · Cane · Wheelchair</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','aid-comm')">
            <div class="card-body">
              <div class="card-title">📌 의사소통 보조도구</div>
              <div class="card-sub">Communication board · AAC · 음성합성 · ECS</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>
        <!-- /탭 7 -->
`;

// Insert tab6+tab7 after tab5 close
const tab5Marker = `<!-- /탭 5 -->`;
const idx = html.indexOf(tab5Marker);
if (idx === -1) throw new Error('tab5 marker not found');
html = html.slice(0, idx + tab5Marker.length) + tab67 + html.slice(idx + tab5Marker.length);

const dd = `
  'posture-types': \`<h2>환자 자세 5종</h2>
<table class="detail-table">
  <tr><th>자세</th><th>영문</th><th>특징</th></tr>
  <tr><td><b>앙와위</b></td><td>Supine</td><td>등을 바닥에 대고 누운 자세. 가장 기본, 욕창 호발(천골·발뒤꿈치)</td></tr>
  <tr><td><b>복와위</b></td><td>Prone</td><td>엎드린 자세. 등쪽 욕창 예방, 호흡 곤란 환자 부적합</td></tr>
  <tr><td><b>측와위</b></td><td>Side-lying</td><td>옆으로 누운 자세. 30° 측와위 권장 (전자부 압력 감소)</td></tr>
  <tr><td><b>반좌위</b></td><td>Semi-Fowler</td><td>상체 30° 거상. 호흡·식사 보조</td></tr>
  <tr><td><b>좌위 (Fowler)</b></td><td>Fowler / High-Fowler</td><td>상체 45~90° 거상. 호흡·식사·위장 역류 방지</td></tr>
</table>
<div class="tip-box">💡 30° 측와위 = <b>전자부(greater trochanter) 압력 회피</b> → 욕창 예방 표준</div>\`,

  'posture-method': \`<h2>환자 자세취하기 방법</h2>
<div class="detail-section">
  <h3>핵심 원칙</h3>
  <div class="detail-item accent"><b>관절 정렬 유지</b> — 신체 정렬·기능적 자세 (functional position)</div>
  <div class="detail-item blue"><b>압력 분산</b> — 베개·쿠션으로 골 돌출부 보호 (천골·발뒤꿈치·전자부·복사뼈)</div>
  <div class="detail-item green"><b>욕창 예방</b> — <b>2시간마다 체위 변경</b></div>
  <div class="detail-item yellow"><b>구축 예방</b> — 발목 90° (foot drop 방지), 손가락 약간 굽힘 (functional position)</div>
</div>
<div class="detail-section">
  <h3>자세별 베개 위치</h3>
  <div class="detail-item red"><b>앙와위:</b> 머리·어깨·무릎 아래·발 보호 (heel float)</div>
  <div class="detail-item red"><b>측와위:</b> 머리·위쪽 팔·다리 아래·등 뒤</div>
  <div class="detail-item red"><b>복와위:</b> 가슴·복부·발등 (foot drop 방지)</div>
</div>\`,

  'infection-def': \`<h2>병원 감염 정의 · 중요성</h2>
<div class="detail-section">
  <h3>1. 병원 감염의 정의</h3>
  <div class="detail-item accent"><b>입원 당시 증상이 없고 잠복 상태도 아니었던 감염증</b>이 입원 후 또는 퇴원 후에 발생하는 경우</div>
  <div class="detail-item accent">= Hospital-Acquired Infection (HAI) / Nosocomial Infection</div>
</div>
<div class="detail-section">
  <h3>2. 감염관리의 중요성</h3>
  <div class="detail-item red"><b>의료의 질 저하</b></div>
  <div class="detail-item red"><b>경제적 손실</b></div>
  <div class="detail-item red"><b>법적 문제</b></div>
  <div class="detail-item red"><b>윤리적 문제</b></div>
  <div class="detail-item red"><b>사회적 문제</b></div>
</div>
<div class="detail-section">
  <h3>3. 결과</h3>
  <div class="detail-item yellow">유병률 증가, <b>치료 지연</b>, 심한 경우 <b>환자 사망까지</b> 발생 가능</div>
</div>\`,

  'infection-effect': \`<h2>감염관리 효과</h2>
<div class="detail-section">
  <h3>감염관리 목적</h3>
  <div class="detail-item accent">입원과 관련하여 <b>환자, 보호자, 방문객, 직원</b>의 감염위험을 감소시켜 <b>안전한 환경 제공</b></div>
</div>
<div class="detail-section">
  <h3>조직적 감염관리의 효과</h3>
  <div class="detail-item blue"><b>병원이 생명존중의 장</b>으로서 사회적·윤리적·법적 사명을 다할 수 있음</div>
  <div class="detail-item green">환자의 <b>추가 재원일수 감소</b></div>
  <div class="detail-item green">국가·환자·병원이 부담하는 <b>추가 비용 최소화</b></div>
</div>\`,

  'infection-room': \`<h2>치료실의 감염관리 지침</h2>
<div class="detail-section">
  <h3>기본 원칙</h3>
  <div class="detail-item accent"><b>감염이 있는 환자는 치료실에서 치료받지 않도록</b> 함</div>
</div>
<div class="detail-section">
  <h3>접촉경계 적용 대상</h3>
  <div class="detail-item red"><b>VRE</b> (Vancomycin-Resistant Enterococci) — 반코마이신내성 장구균</div>
  <div class="detail-item red"><b>VRSA</b> (Vancomycin-Resistant Staphylococcus Aureus) — 반코마이신내성 황색포도상구균</div>
</div>
<div class="warn-box">⚠️ <b>국시 포인트:</b> VRE/VRSA = <b>접촉경계(Contact Precaution)</b> 격리 적용</div>\`,

  'infection-staff': \`<h2>치료사의 감염관리 지침</h2>
<div class="detail-section">
  <h3>(1) 건강검진</h3>
  <div class="detail-item accent">① 신입직원 건강검진</div>
  <div class="detail-item accent">② 정기적 건강검진</div>
  <div class="detail-item accent">③ 특수부서 직원 건강검진</div>
</div>
<div class="detail-section">
  <h3>(2) 예방접종</h3>
  <div class="detail-item blue">B형 간염, 인플루엔자, MMR, 수두, Tdap 등 권장</div>
</div>
<div class="detail-section">
  <h3>(3) 직원교육</h3>
  <div class="detail-item green">정기적 감염관리 교육 의무</div>
</div>
<div class="detail-section">
  <h3>(4) 임신한 병원직원의 감염관리</h3>
  <div class="detail-item yellow">풍진·수두·CMV·B19 등 노출 시 위험 → <b>특별 관리 필요</b></div>
</div>\`,

  'hand-hygiene': \`<h2>손 위생 (Hand Hygiene)</h2>
<div class="detail-section">
  <h3>(1) 의료환경에서 손씻기와 손소독</h3>
  <div class="detail-item accent"><b>WHO 5 Moments:</b> ① 환자 접촉 전 ② 청결·무균 술기 전 ③ 체액 노출 후 ④ 환자 접촉 후 ⑤ 환자 주변 환경 접촉 후</div>
</div>
<div class="detail-section">
  <h3>(2) 손 위생제의 선택</h3>
  <div class="detail-item blue"><b>육안 오염 시:</b> 비누+물 손씻기 (40~60초)</div>
  <div class="detail-item green"><b>육안 오염 없을 시:</b> 알코올 핸드러브 (20~30초)</div>
</div>
<div class="detail-section">
  <h3>(3) 치료사 교육 및 동기화 프로그램</h3>
  <div class="detail-item yellow">정기 교육 + 모니터링 + 피드백 → 손 위생 준수율 향상</div>
</div>
<div class="detail-section">
  <h3>(4) 관리방법</h3>
  <div class="detail-item red">손 위생 자원(세면대·페이퍼타올·알코올 디스펜서) 가용성 확보</div>
</div>\`,

  'aid-eating': \`<h2>식사 보조도구</h2>
<table class="detail-table">
  <tr><th>도구</th><th>적응증</th><th>기능</th></tr>
  <tr><td><b>Built-up handle 숟가락·포크</b></td><td>악력 약화 (관절염·신경계)</td><td>잡기 쉽도록 손잡이 굵게</td></tr>
  <tr><td><b>Plate guard</b></td><td>한 손 사용·편마비</td><td>접시 가장자리 둘러 음식 떨어짐 방지</td></tr>
  <tr><td><b>Rocker knife</b></td><td>한 손 사용</td><td>흔드는 동작으로 음식 자르기</td></tr>
  <tr><td><b>Suction cup</b></td><td>한 손 사용</td><td>접시·컵 바닥 고정</td></tr>
  <tr><td><b>Long straw / Cup with handle</b></td><td>ROM 제한·악력 약화</td><td>고개 숙이지 않고 마시기</td></tr>
  <tr><td><b>Universal cuff</b></td><td>손가락 굴곡 불가</td><td>손바닥에 도구 고정</td></tr>
</table>\`,

  'aid-hygiene': \`<h2>개인위생 보조도구</h2>
<table class="detail-table">
  <tr><th>도구</th><th>적응증</th><th>기능</th></tr>
  <tr><td><b>Long handle sponge</b></td><td>ROM 제한 (어깨·등)</td><td>등·하지 닦기</td></tr>
  <tr><td><b>Wash mitt</b></td><td>악력 약화</td><td>장갑형 수건</td></tr>
  <tr><td><b>전동칫솔·손잡이 굵게</b></td><td>악력 약화·관절염</td><td>양치질 보조</td></tr>
  <tr><td><b>전기면도기·면도기 핸들</b></td><td>편마비·진전</td><td>면도 안전</td></tr>
  <tr><td><b>Hair brush with extension</b></td><td>어깨 ROM 제한</td><td>머리 빗기</td></tr>
</table>\`,

  'aid-dressing': \`<h2>옷 입기 보조도구 (5종 핵심)</h2>
<table class="detail-table">
  <tr><th>도구</th><th>적응증</th><th>기능</th></tr>
  <tr><td><b>Dressing stick</b></td><td>ROM 제한·편마비</td><td>옷을 끌어올리거나 벗기 보조</td></tr>
  <tr><td><b>Button hook</b></td><td>한 손·관절염·편마비</td><td>단추 잠그기·풀기</td></tr>
  <tr><td><b>Reacher</b></td><td>척추 굴곡 제한·고관절 수술 후</td><td>바닥 물건·옷 집기</td></tr>
  <tr><td><b>Sock aid</b></td><td>엉덩관절 굴곡 제한 (THR)</td><td>양말 신기</td></tr>
  <tr><td><b>Long handle shoehorn</b></td><td>척추·고관절 굴곡 제한</td><td>신발 신기</td></tr>
  <tr><td><b>Velcro fastener</b></td><td>한 손·악력 약화</td><td>지퍼·끈 대신</td></tr>
  <tr><td><b>Elastic shoelace</b></td><td>한 손·악력 약화</td><td>신발끈 묶지 않고 신기</td></tr>
  <tr><td><b>Zipper pull</b></td><td>한 손·악력 약화</td><td>지퍼 잡기 보조</td></tr>
</table>
<div class="warn-box">⚠️ <b>고관절치환술(THR) 환자:</b> Reacher + Sock aid + Long handle shoehorn 3종 — <b>고관절 90° 굴곡 금지</b></div>\`,

  'aid-toilet': \`<h2>화장실 · 목욕 보조도구</h2>
<table class="detail-table">
  <tr><th>도구</th><th>적응증</th><th>기능</th></tr>
  <tr><td><b>Grab bar</b></td><td>균형 약화·편마비</td><td>이동·앉기 안전</td></tr>
  <tr><td><b>Raised toilet seat</b></td><td>고관절·무릎 굴곡 제한, 하지근력 약화</td><td><b>변기 높이 ↑ → 일어서기 쉬움</b></td></tr>
  <tr><td><b>Commode</b></td><td>화장실 이동 곤란</td><td>침상 옆 변기</td></tr>
  <tr><td><b>Bidet</b></td><td>한 손·악력 약화</td><td>뒤처리 보조</td></tr>
  <tr><td><b>Tub bench / Shower chair</b></td><td>균형·근력 약화</td><td>욕조·샤워 좌위 사용</td></tr>
  <tr><td><b>Hand-held shower</b></td><td>좌위 목욕</td><td>이동식 샤워헤드</td></tr>
  <tr><td><b>Non-slip mat</b></td><td>모든 환자</td><td>욕실 미끄럼 방지</td></tr>
</table>
<div class="warn-box">⚠️ <b>고관절치환술 환자:</b> Raised toilet seat 필수 — 90° 굴곡 금지 규칙</div>\`,

  'aid-mobility': \`<h2>이동 보조도구</h2>
<table class="detail-table">
  <tr><th>도구</th><th>적응증</th><th>기능</th></tr>
  <tr><td><b>Sliding board (Transfer board)</b></td><td>하지마비·척수손상</td><td>휠체어 ↔ 침대·변기 이동</td></tr>
  <tr><td><b>Transfer belt (Gait belt)</b></td><td>균형 약화</td><td>치료사가 환자 잡고 안전 이동</td></tr>
  <tr><td><b>Hoyer lift (기계식 리프트)</b></td><td>완전 의존 환자</td><td>전기·수동 들어올림</td></tr>
  <tr><td><b>Walker (보행기)</b></td><td>균형·근력 약화</td><td>표준·바퀴식·롤레이터</td></tr>
  <tr><td><b>Crutches (목발)</b></td><td>편측 하지 비체중부하</td><td>겨드랑이·전완(Lofstrand)</td></tr>
  <tr><td><b>Cane (지팡이)</b></td><td>경증 균형 약화·편마비</td><td>단일 / Quad cane</td></tr>
  <tr><td><b>Wheelchair (휠체어)</b></td><td>보행 불가</td><td>수동 / 전동</td></tr>
</table>\`,

  'aid-comm': \`<h2>의사소통 보조도구 (AAC)</h2>
<div class="detail-section">
  <h3>비전자식 (Low-tech)</h3>
  <div class="detail-item accent"><b>Communication board</b> — 그림·글자판으로 의사 표현</div>
  <div class="detail-item accent">PECS (Picture Exchange Communication System) — 자폐·발달장애</div>
</div>
<div class="detail-section">
  <h3>전자식 (High-tech)</h3>
  <div class="detail-item blue"><b>AAC (Augmentative and Alternative Communication)</b> 기기 — 음성 출력 장치 (SGD)</div>
  <div class="detail-item green"><b>음성합성장치 (Voice Synthesizer)</b> — ALS·뇌졸중 실어증</div>
  <div class="detail-item yellow"><b>ECS (Environmental Control System)</b> — 가전·문·조명 원격 제어 (척수손상 사지마비)</div>
</div>
<div class="detail-section">
  <h3>입력 방식</h3>
  <div class="detail-item red">스위치 (Switch) · 시선 추적 (Eye-gaze) · 두부 포인터 (Head pointer) · 음성 인식</div>
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
console.log('OK. New size:', fs.statSync(FILE).size);
