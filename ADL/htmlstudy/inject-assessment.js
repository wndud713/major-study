'use strict';
// Inject ch5 평가도구 tab into 기능훈련1_ADL개론.html
// Adds: tab button "📊 평가도구" + tab-content + allDetailData entries

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '기능훈련1_ADL개론.html');
let html = fs.readFileSync(FILE, 'utf8');

// 1) Insert tab button after 국시문제 tab button
const tabBtnMarker = `<button class="tab-btn" onclick="switchTab('ch1','tab4',this)"><span class="tab-icon">🎯</span>국시문제</button>`;
const newTabBtn = `<button class="tab-btn" onclick="switchTab('ch1','tab4',this)"><span class="tab-icon">🎯</span>국시문제</button>
        <button class="tab-btn" onclick="switchTab('ch1','tab5',this)"><span class="tab-icon">📊</span>ADL 평가도구</button>`;
if (html.indexOf(tabBtnMarker) === -1) throw new Error('tab btn marker not found');
if (html.indexOf(`switchTab('ch1','tab5'`) !== -1) throw new Error('tab5 already exists - aborting (idempotency)');
html = html.replace(tabBtnMarker, newTabBtn);

// 2) Build tab5 content
const tab5Content = `
        <!-- 탭 5: ADL 평가도구 -->
        <div class="tab-content" id="ch1-tab-tab5">
          <div class="section-title">평가도구 종류 · 점수체계 · 적용</div>

          <!-- 평가도구 비교 종합표 (inline accordion) -->
          <div class="accordion-parent" role="button" tabindex="0" aria-expanded="false"
               onclick="toggleAccordion(this)"
               onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleAccordion(this);}"
               style="background:linear-gradient(135deg,rgba(56,189,248,0.15),rgba(167,139,250,0.12));border:1.5px solid var(--ch-accent);margin-bottom:12px;">
            <div class="ap-head">
              <span class="ap-icon">📊</span>
              <div class="ap-body">
                <div class="ap-title">ADL 평가도구 비교 종합표</div>
                <div class="ap-sub" style="font-size:11.5px;color:var(--ch-accent);margin-top:2px;">MBI · FIM · SCIM · Katz · PULSE · K-ADL ▼</div>
              </div>
              <span class="chev">▶</span>
            </div>
            <div class="accordion-children" style="padding:0 14px;">
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:4px;min-width:700px;">
                  <thead>
                    <tr style="background:var(--bg4);">
                      <th style="padding:8px 10px;text-align:left;color:var(--ch-accent);border-bottom:2px solid var(--border);">도구</th>
                      <th style="padding:8px 10px;text-align:left;color:var(--ch-accent);border-bottom:2px solid var(--border);">개발</th>
                      <th style="padding:8px 10px;text-align:left;color:var(--ch-accent);border-bottom:2px solid var(--border);">대상</th>
                      <th style="padding:8px 10px;text-align:center;color:var(--ch-accent);border-bottom:2px solid var(--border);">항목</th>
                      <th style="padding:8px 10px;text-align:center;color:var(--ch-accent);border-bottom:2px solid var(--border);">총점</th>
                      <th style="padding:8px 10px;text-align:left;color:var(--ch-accent);border-bottom:2px solid var(--border);">특징</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background:rgba(56,189,248,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #38bdf8;font-weight:600;">MBI<br><span style="font-size:10px;color:var(--text-dim);font-weight:400;">수정바델</span></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">Mahoney·Barthel<br>(1965, 개정 1989)</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">만성질환자</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);">10</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);"><b>100</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">5단계 평가, 항목별 가중치, 장애등급판정</td>
                    </tr>
                    <tr style="background:rgba(167,139,250,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #a78bfa;font-weight:600;">FIM</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">Carl Granger<br>(1983)</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">전반적</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);">18</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);"><b>18~126</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">7점 척도, MBI보다 민감, 운동+인지</td>
                    </tr>
                    <tr style="background:rgba(52,211,153,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #34d399;font-weight:600;">SCIM</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">Catz 등<br>(1997, v3 2002)</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>척수손상</b></td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);">17</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);"><b>100</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">FIM 단점 보완, 가중치 부여</td>
                    </tr>
                    <tr style="background:rgba(79,209,197,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #4fd1c5;font-weight:600;">Katz</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">Katz<br>(1963)</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">뇌졸중·노인</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);">6</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);"><b>0~6</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">A~G 등급, 5~10분 빠른 평가</td>
                    </tr>
                    <tr style="background:rgba(251,146,60,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #fb923c;font-weight:600;">PULSE</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">Moskowitz·McCann<br>(1957, 개정 1979)</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">뇌졸중·척수·노인</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);">6 (P/U/L/S/E/S)</td>
                      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid var(--border);"><b>6~24</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">정상 6점, 의존 24점 (역방향)</td>
                    </tr>
                    <tr style="background:rgba(244,114,182,0.08);">
                      <td style="padding:7px 10px;border-left:3px solid #f472b6;font-weight:600;">K-ADL/<br>K-IADL</td>
                      <td style="padding:7px 10px;">원장원 등<br>(2002)</td>
                      <td style="padding:7px 10px;"><b>한국 노인</b></td>
                      <td style="padding:7px 10px;text-align:center;">7 / 10</td>
                      <td style="padding:7px 10px;text-align:center;"><b>7~21</b></td>
                      <td style="padding:7px 10px;">3단계(자립1, 부분의존2, 의존3)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="warn-box" style="margin-top:10px;">
                <b>⚠️ 국시 빈출 포인트:</b><br>
                • <b>MBI</b> = 만성질환, 10항목, 100점, 5단계 평가, 점수별 장애등급<br>
                • <b>FIM</b> = 18항목, 7점 척도, 총점 <b>18(완전의존)~126(완전독립)</b>, 운동+인지<br>
                • <b>SCIM</b> = <b>척수손상</b> 전용, FIM 보완<br>
                • <b>PULSE</b> = 점수가 <b>높을수록 의존</b> (역방향 주의)<br>
                • <b>K-ADL</b> = 한국 노인, 7항목, 점수↑ = 의존↑
              </div>
            </div>
          </div>

          <div class="card" onclick="openDetail('ch1','assess-meaning')">
            <div class="card-body">
              <div class="card-title">평가의 의의 및 고려사항</div>
              <div class="card-sub">재활 목표 · 치료사 역할 · 면담·관찰·사생활</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','assess-method')">
            <div class="card-body">
              <div class="card-title">평가방법 4가지</div>
              <div class="card-sub">면담 · 수행평가 · 자기평가 · 평가-중재 과정</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','assess-doc')">
            <div class="card-body">
              <div class="card-title">평가결과 문서화</div>
              <div class="card-sub">CPR · EMR · EPR 비교</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','mbi')">
            <div class="card-body">
              <div class="card-title">📌 수정바델지수 (MBI)</div>
              <div class="card-sub">10항목 · 100점 · 5단계 평가 · 장애등급</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','fim')">
            <div class="card-body">
              <div class="card-title">📌 FIM (Functional Independence Measure)</div>
              <div class="card-sub">18항목 · 7점 척도 · 18~126점 · 운동+인지</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','scim')">
            <div class="card-body">
              <div class="card-title">📌 SCIM (척수독립성평가)</div>
              <div class="card-sub">척수손상 · 17항목 · 100점 · 가중치</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','katz')">
            <div class="card-body">
              <div class="card-title">📌 카츠지수 (Katz Index)</div>
              <div class="card-sub">뇌졸중·노인 · 6영역 · A~G 등급</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','pulse')">
            <div class="card-body">
              <div class="card-title">📌 PULSE 프로파일</div>
              <div class="card-sub">P/U/L/S/E/S · 6~24점 (역방향)</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','kadl')">
            <div class="card-body">
              <div class="card-title">📌 K-ADL · K-IADL (한국판)</div>
              <div class="card-sub">한국 노인 · 7+10항목 · 3단계</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','other-tools')">
            <div class="card-body">
              <div class="card-title">기타 평가도구</div>
              <div class="card-sub">weeFIM · Klein-Bell · Kenny · AMPS · COPM · KELS 등</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>

        <!-- /탭 5 -->
`;

// 3) Insert tab5 content after tab4 content closing
// Find the marker: end of tab4 — last </div> after Q4 exam-question-block
const tab4Marker = `</div>

      </div><!-- /cards-area -->`;
const tab4MarkerIdx = html.indexOf(tab4Marker);
if (tab4MarkerIdx === -1) throw new Error('tab4 closing marker not found');
html = html.slice(0, tab4MarkerIdx) + `</div>` + tab5Content + `
      </div><!-- /cards-area -->` + html.slice(tab4MarkerIdx + tab4Marker.length);

// 4) Build detail entries (escaped backticks ok since template literal contents)
const newDetails = `
  'assess-meaning': \`<h2>평가의 의의 및 고려사항</h2>
<div class="detail-section">
  <h3>재활의 목표</h3>
  <div class="detail-item accent"><b>환자 목표:</b> 일상생활에서 최대의 기능적 독립성을 획득하고 삶에 참여할 수 있도록 돕는 것</div>
</div>
<div class="detail-section">
  <h3>치료사의 역할</h3>
  <div class="detail-item blue">환자의 일상생활활동에 대한 전반적 독립수준을 평가하여 수행에 제한을 가져오는 문제점을 확인</div>
  <div class="detail-item blue">중재계획을 설정하며, 향후 퇴원 계획을 준비할 수 있도록 도움</div>
</div>
<div class="detail-section">
  <h3>일상생활활동 평가·훈련 목적</h3>
  <div class="detail-item green">① 환자에게 가장 알맞은 ADL 평가도구를 선택하여 신체적·정신적·환경적 방해요인 파악</div>
  <div class="detail-item green">② 가정과 사회활동에서 요구되는 자신의 역할 획득</div>
  <div class="detail-item green">③ 더 나은 삶을 영위할 수 있도록 기여</div>
</div>
<div class="detail-section">
  <h3>평가 시 고려사항</h3>
  <div class="detail-item yellow"><b>면담 시:</b> 적절한 목록을 만들어 사용, 효율적으로 기록할 수 있도록 준비</div>
  <div class="detail-item yellow"><b>직접 관찰 및 표준화 도구:</b> 기본 지침과 정확한 수행방법 숙지</div>
  <div class="detail-item red"><b>사생활 관련 항목:</b> 수치심을 느끼지 않도록 특별히 배려, 환자 가치관·습관 고려</div>
</div>\`,

  'assess-method': \`<h2>평가방법 4가지</h2>
<div class="detail-section">
  <h3>① 면담</h3>
  <div class="detail-item accent">초기 면담은 환자와의 신뢰감을 형성하는 시기</div>
  <div class="detail-item accent">조용하고 프라이버시가 보장되는 공간에서 진행</div>
  <div class="detail-item accent">정답이 유도될 수 있는 단서는 가급적 주지 않도록 주의</div>
</div>
<div class="detail-section">
  <h3>② 수행 평가</h3>
  <div class="detail-item blue">환자의 ADL 수행기능을 직접 관찰하여 장·단점 파악</div>
  <div class="detail-item blue">수행분석을 통해 환자가 과제를 달성하는 데 사용한 방식 관찰, 수행문제의 원인 파악</div>
</div>
<div class="detail-section">
  <h3>③ 자기 평가</h3>
  <div class="detail-item green">환자 스스로 설문지를 통해 ADL 기능적 독립 상태 평가</div>
  <div class="detail-item green">자신의 활동수행상 문제를 인식 → 우선순위와 동기(motivation) 유도</div>
</div>
<div class="detail-section">
  <h3>④ 평가-중재 과정</h3>
  <div class="detail-item yellow">평가 결과를 바탕으로 중재계획 수립 및 진행</div>
</div>\`,

  'assess-doc': \`<h2>평가결과 문서화</h2>
<table class="detail-table">
  <tr><th>약어</th><th>풀이</th><th>특징</th></tr>
  <tr><td><b>CPR</b></td><td>Computer-based<br>Patient Record</td><td>환자정보·병원의 전반적 정보 발생·흐름 분석<br>데이터 구조화 + 여러 용도에 알맞게 구현</td></tr>
  <tr><td><b>EMR</b></td><td>Electronic<br>Medical Record</td><td>병원 내 의무기록 전산화에만 주안점</td></tr>
  <tr><td><b>EPR</b></td><td>Electronic<br>Patient Record</td><td>전산화 비용 적게, 환자의 의무기록 접근성 증진 장점</td></tr>
</table>
<div class="tip-box">💡 <b>구분 포인트:</b> CPR(전반적)·EMR(병원 내부)·EPR(환자 접근성)</div>\`,

  'mbi': \`<h2>수정바델지수 (Modified Barthel Index)</h2>
<div class="detail-section">
  <h3>1. 평가목적</h3>
  <div class="detail-item accent">Mahoney와 Barthel(<b>1965</b>)이 만성질환자의 일상생활자립도를 알아보기 위해 개발</div>
  <div class="detail-item accent"><b>1989년</b> 민감도를 높여 개정</div>
</div>
<div class="detail-section">
  <h3>2. 평가 대상·방법</h3>
  <div class="detail-item blue"><b>대상:</b> 만성질환자</div>
  <div class="detail-item blue"><b>방법:</b> 직접적인 관찰과 면접 → 의존정도 평가</div>
  <div class="detail-item blue">완전독립 / 약간의 도움 / 중간정도의 도움 / 많은 도움 / 완전의존</div>
  <div class="detail-item blue"><b>10개 항목을 5단계로 평가, 총점 100점</b> (항목별 가중치)</div>
</div>
<div class="detail-section">
  <h3>3. 장애등급판정 (점수 기준)</h3>
  <table class="detail-table">
    <tr><th>등급</th><th>점수</th><th>특징</th></tr>
    <tr><td>3급</td><td>54~69</td><td>보행·ADL 독립 어려움, 부분적 타인 도움</td></tr>
    <tr><td>4급</td><td>70~80</td><td>대부분 자신이 수행, 간헐적 도움</td></tr>
    <tr><td>5급</td><td>81~89</td><td>도움 없이 수행, 완벽하지 못한 때 있음</td></tr>
    <tr><td>6급</td><td>90~96</td><td>완벽 수행, 간혹 시간 느리거나 비정상</td></tr>
  </table>
</div>
<div class="detail-section">
  <h3>4. 10개 항목 (점수배점)</h3>
  <table class="detail-table">
    <tr><th>항목</th><th>최대점</th></tr>
    <tr><td>개인위생 (Personal Hygiene)</td><td>5</td></tr>
    <tr><td>목욕하기 (Bathing)</td><td>5</td></tr>
    <tr><td>식사하기 (Feeding)</td><td>10</td></tr>
    <tr><td>화장실 사용 (Toilet)</td><td>10</td></tr>
    <tr><td>계단 오르내리기 (Stair)</td><td>10</td></tr>
    <tr><td>옷 입고 벗기 (Dressing)</td><td>10</td></tr>
    <tr><td>배변조절 (Bowel)</td><td>10</td></tr>
    <tr><td>배뇨조절 (Bladder)</td><td>10</td></tr>
    <tr><td>보행 (Ambulation)</td><td>15</td></tr>
    <tr><td>휠체어 사용 (Wheelchair) <i>또는</i> 의자/침대 이동 (Transfers)</td><td>15</td></tr>
    <tr><td><b>총점</b></td><td><b>100</b></td></tr>
  </table>
  <div class="tip-box" style="margin-top:8px;">💡 보행과 이동(Transfers)이 <b>가장 높은 가중치(15점)</b></div>
</div>\`,

  'fim': \`<h2>FIM (Functional Independence Measure)</h2>
<div class="detail-section">
  <h3>1. 개발</h3>
  <div class="detail-item accent"><b>1983년</b> 재활의학과 의사인 <b>Carl Granger</b>에 의해 개발</div>
  <div class="detail-item accent">신뢰도·타당도가 높으며 <b>바델지수보다 비교적 민감도가 높아</b> 임상에서 많이 사용</div>
</div>
<div class="detail-section">
  <h3>2. 평가방법</h3>
  <div class="detail-item blue">환자가 실제로 가정에서 활동하는 수행력을 측정하며 의존정도 평가</div>
  <div class="detail-item blue">보호자의 도움 정도에 따라 7점 척도</div>
</div>
<div class="detail-section">
  <h3>3. 7점 척도</h3>
  <table class="detail-table">
    <tr><th>점수</th><th>의미</th></tr>
    <tr><td><b>7</b></td><td>완전 독립 (Complete Independence)</td></tr>
    <tr><td>6</td><td>부분 독립 (Modified Independence) — 보조도구 사용</td></tr>
    <tr><td>5</td><td>감독 또는 준비 (Supervision)</td></tr>
    <tr><td>4</td><td>최소의 도움 (Minimal Assist) — 75% 이상 수행</td></tr>
    <tr><td>3</td><td>중등도의 도움 (Moderate Assist) — 50~74%</td></tr>
    <tr><td>2</td><td>최대의 도움 (Maximal Assist) — 25~49%</td></tr>
    <tr><td><b>1</b></td><td>완전 의존 (Total Assist) — 25% 미만</td></tr>
  </table>
</div>
<div class="detail-section">
  <h3>4. 총점 범위</h3>
  <div class="detail-item green"><b>최고:</b> 126점 (완전 독립) — 18항목 × 7점</div>
  <div class="detail-item red"><b>최저:</b> 18점 (완전 의존) — 18항목 × 1점</div>
</div>
<div class="detail-section">
  <h3>5. 18개 항목 (운동 13 + 인지 5)</h3>
  <table class="detail-table">
    <tr><th>영역</th><th>항목</th></tr>
    <tr><td rowspan="6"><b>자기관리</b></td><td>식사하기 (Eating)</td></tr>
    <tr><td>몸단장하기 (Grooming)</td></tr>
    <tr><td>목욕하기 (Bathing)</td></tr>
    <tr><td>옷 입기 — 상의</td></tr>
    <tr><td>옷 입기 — 하의</td></tr>
    <tr><td>화장실 사용</td></tr>
    <tr><td rowspan="2"><b>괄약근 조절</b></td><td>방광 조절</td></tr>
    <tr><td>장 조절</td></tr>
    <tr><td rowspan="3"><b>이동</b></td><td>침대·의자·휠체어 이동</td></tr>
    <tr><td>화장실 이동</td></tr>
    <tr><td>욕조·샤워 이동</td></tr>
    <tr><td rowspan="2"><b>보행</b></td><td>걷기 / 휠체어</td></tr>
    <tr><td>계단</td></tr>
    <tr><td rowspan="2"><b>의사소통</b></td><td>이해하기 (Comprehension)</td></tr>
    <tr><td>표현하기 (Expression)</td></tr>
    <tr><td rowspan="3"><b>사회적 인지</b></td><td>사회적 작용 (Social Interaction)</td></tr>
    <tr><td>문제 해결 (Problem Solving)</td></tr>
    <tr><td>기억 (Memory)</td></tr>
  </table>
  <div class="tip-box" style="margin-top:8px;">💡 <b>운동 13항목 + 인지 5항목 = 18항목</b>. MBI는 운동만 평가하므로 FIM이 더 포괄적</div>
</div>\`,

  'scim': \`<h2>척수독립성평가 (SCIM, Spinal Cord Independence Measure)</h2>
<div class="detail-section">
  <h3>1. 개발</h3>
  <div class="detail-item accent"><b>1997년 Catz 등</b>이 <b>FIM의 단점을 보완</b>하여 척수손상 환자에게 사용하기 위해 개발</div>
  <div class="detail-item accent">SCIM 1 (1997) → SCIM 2 (2001) → <b>SCIM 3 (2002)</b> — 국제판 (문화 차이 극복)</div>
  <div class="detail-item accent">신뢰도와 타당도가 검증된 평가도구</div>
</div>
<div class="detail-section">
  <h3>2. 평가 방법</h3>
  <div class="detail-item blue">직접적인 관찰과 면접</div>
  <div class="detail-item blue"><b>척수손상 환자에게 중요한 17가지 항목</b>, 기능의 중요성에 따라 <b>가중치 부여</b>, <b>총 100점</b></div>
</div>
<div class="detail-section">
  <h3>3. 17개 항목 영역별 점수</h3>
  <table class="detail-table">
    <tr><th>영역</th><th>항목</th><th>최대점</th></tr>
    <tr><td rowspan="4"><b>자기관리</b></td><td>식사하기 (Feeding)</td><td>3</td></tr>
    <tr><td>목욕 — 상체</td><td>3</td></tr>
    <tr><td>목욕 — 하체</td><td>3</td></tr>
    <tr><td>몸단장 (Grooming)</td><td>3</td></tr>
    <tr><td rowspan="2"><b>옷</b></td><td>옷 입기 — 상의</td><td>4</td></tr>
    <tr><td>옷 입기 — 하의</td><td>4</td></tr>
    <tr><td rowspan="3"><b>호흡·괄약근</b></td><td>호흡 (Respiration)</td><td>10</td></tr>
    <tr><td>괄약근 — 방광</td><td>15</td></tr>
    <tr><td>괄약근 — 장</td><td>10</td></tr>
    <tr><td><b>화장실</b></td><td>화장실 사용</td><td>5</td></tr>
    <tr><td rowspan="6"><b>이동</b></td><td>실내 이동(방·화장실)</td><td>6</td></tr>
    <tr><td>이동 동작 — 침대-휠체어</td><td>2</td></tr>
    <tr><td>이동 동작 — 휠체어-변기-욕조</td><td>2</td></tr>
    <tr><td>실내 이동 (10m 이내)</td><td>8</td></tr>
    <tr><td>중등도 거리 (10~100m)</td><td>8</td></tr>
    <tr><td>실외 (100m 이상)</td><td>8</td></tr>
    <tr><td><b>계단</b></td><td>계단 오르내리기</td><td>3</td></tr>
    <tr><td><b>차량/바닥</b></td><td>휠체어-자동차 / 바닥-휠체어</td><td>3</td></tr>
    <tr><td colspan="2"><b>총점</b></td><td><b>100</b></td></tr>
  </table>
  <div class="warn-box" style="margin-top:8px;">💡 <b>호흡(10) + 방광(15) + 장(10) + 보행(8×3) = 가장 큰 비중</b> — 척수손상 특성 반영</div>
</div>\`,

  'katz': \`<h2>카츠지수 (Katz Index)</h2>
<div class="detail-section">
  <h3>1. 평가대상</h3>
  <div class="detail-item accent"><b>뇌졸중, 다발성 경화증, 엉덩관절 질환</b> 등</div>
</div>
<div class="detail-section">
  <h3>2. 평가방법</h3>
  <div class="detail-item blue"><b>6개 영역:</b> 목욕하기, 옷 입고 벗기, 용변처리, 이동, 대소변 조절, 식사 활동</div>
  <div class="detail-item blue">각 영역 독립수준: <b>독립적 수행(1점), 보조 받음/수행불능(0점)</b></div>
  <div class="detail-item blue">결정된 독립수준을 기초로 <b>A, B, C, D, E, F, G, 기타</b>로 등급</div>
  <div class="detail-item green"><b>6~5점:</b> 완전한 기능 / <b>4~3점:</b> 중등도 손상 / <b>2점 이하:</b> 심각한 기능 손상</div>
  <div class="detail-item yellow"><b>5~10분</b> 정도 시간으로 빠른 평가, 세부 치료계획에는 다소 제한</div>
</div>
<div class="detail-section">
  <h3>3. 등급별 기준</h3>
  <table class="detail-table">
    <tr><th>등급</th><th>독립 수행 영역</th></tr>
    <tr><td><b>A</b></td><td>식사·소변·대소변·옷·목욕 — <b>모두 독립</b></td></tr>
    <tr><td><b>B</b></td><td>위 중 <b>1개 제외</b> 모두 독립</td></tr>
    <tr><td><b>C</b></td><td><b>목욕 + 다른 1개 제외</b> 모두 독립</td></tr>
    <tr><td><b>D</b></td><td><b>목욕 + 옷 + 다른 1개 제외</b> 모두 독립</td></tr>
    <tr><td><b>E</b></td><td>목욕 + 옷 + 대소변처리 + 다른 1개 제외 모두 독립</td></tr>
    <tr><td><b>F</b></td><td>목욕 + 옷 + 대소변처리 + 이동 + 다른 1개 제외 모두 독립</td></tr>
    <tr><td><b>G</b></td><td>6개 영역 모두 의존</td></tr>
    <tr><td><b>기타</b></td><td>적어도 2개 영역 의존이지만 C, D, E, F, G 미분류</td></tr>
  </table>
</div>\`,

  'pulse': \`<h2>PULSE 프로파일 (PULSE Profile Evaluation)</h2>
<div class="detail-section">
  <h3>1. 개발·대상</h3>
  <div class="detail-item accent"><b>1957년 Moskowitz·McCann</b>에 의해 개발, <b>1979년 Granger에 의해 개정</b></div>
  <div class="detail-item accent">대상: <b>뇌졸중, 척수손상, 노인</b> 등</div>
</div>
<div class="detail-section">
  <h3>2. 6개 영역 (PULSES)</h3>
  <table class="detail-table">
    <tr><th>약자</th><th>영역</th></tr>
    <tr><td><b>P</b></td><td>Physical condition (신체 상태)</td></tr>
    <tr><td><b>U</b></td><td>Upper limb function (상지 기능)</td></tr>
    <tr><td><b>L</b></td><td>Lower limb function (하지 기능)</td></tr>
    <tr><td><b>S</b></td><td>Sensation (감각 기능)</td></tr>
    <tr><td><b>E</b></td><td>Excretion control (배설 조절)</td></tr>
    <tr><td><b>S</b></td><td>Social support (사회적 지지)</td></tr>
  </table>
</div>
<div class="detail-section">
  <h3>3. 점수 체계 (역방향 ⚠️)</h3>
  <div class="detail-item green"><b>각 영역 4점 척도</b> — 정상 1점, 장애 심해질수록 1점씩 더함</div>
  <div class="detail-item green"><b>총점:</b> 6점(완전 독립) ~ 24점(완전 의존)</div>
  <div class="warn-box" style="margin-top:8px;">⚠️ <b>다른 도구와 반대:</b> 점수가 <b>높을수록 의존도가 높음</b> (MBI/FIM은 점수↑ = 독립↑)</div>
</div>\`,

  'kadl': \`<h2>한국판 일상생활활동 (K-ADL · K-IADL)</h2>
<div class="detail-section">
  <h3>1. K-ADL 평가</h3>
  <div class="detail-item accent"><b>대상:</b> 노인 (한국 노인의 ADL 수행 시 겪는 기능장애 정도 측정)</div>
  <div class="detail-item accent"><b>개발:</b> 2002년 원장원 등</div>
</div>
<div class="detail-section">
  <h3>2. 평가 방법</h3>
  <div class="detail-item blue">직접적인 관찰과 면접을 통해 측정</div>
</div>
<div class="detail-section">
  <h3>3. K-ADL 7개 항목</h3>
  <ol style="padding-left:20px;color:var(--text);line-height:1.8;">
    <li>옷 입고 벗기</li>
    <li>세수하기</li>
    <li>목욕</li>
    <li>식사하기</li>
    <li>이동</li>
    <li>화장실 사용</li>
    <li>대소변조절</li>
  </ol>
  <div class="detail-item green"><b>3단계 채점:</b> 완전자립(1점), 부분의존(2점), 완전의존(3점)</div>
  <div class="detail-item green"><b>총점:</b> 7점(완전자립) ~ 21점(완전의존)</div>
</div>
<div class="detail-section">
  <h3>4. K-IADL</h3>
  <div class="detail-item yellow">가정 및 지역사회에서 자신의 역할을 어느정도 수행하고 있는가에 대해 알아보기 위한 <b>10개 항목</b></div>
  <div class="detail-item yellow">일부 항목은 추가질문이 포함됨</div>
</div>
<div class="warn-box">⚠️ <b>주의:</b> K-ADL은 점수가 <b>높을수록 의존도 증가</b> (PULSE와 같은 방향)</div>\`,

  'other-tools': \`<h2>기타 ADL 평가도구</h2>
<div class="detail-section">
  <h3>아동·소아용</h3>
  <div class="detail-item accent"><b>weeFIM</b> — 아동용 기능적 독립수준 평가</div>
</div>
<div class="detail-section">
  <h3>전반적 ADL 평가</h3>
  <div class="detail-item blue"><b>Klein-Bell scale</b> — 클라인-벨 일상생활활동 척도</div>
  <div class="detail-item blue"><b>Kenny self-care evaluation</b> — 케니 셀프-케어 평가</div>
</div>
<div class="detail-section">
  <h3>운동·인지 통합 평가</h3>
  <div class="detail-item green"><b>AMPS</b> (Assessment of Motor and Process Skill) — 운동과 처리기술 평가</div>
  <div class="detail-item green"><b>A-one</b> (Arnadottir OT-ADL Neurobehavioral Evaluation) — 작업-ADL 신경행동 평가</div>
</div>
<div class="detail-section">
  <h3>특수 영역</h3>
  <div class="detail-item yellow"><b>KTA</b> (Kitchen Task Assessment) — 부엌과제평가</div>
  <div class="detail-item yellow"><b>KELS</b> (Kohlman Evaluation of Living Skill) — 콜만 생활기술 평가</div>
  <div class="detail-item yellow"><b>운전 평가</b> — 수단적 ADL을 위한 운전 평가</div>
</div>
<div class="detail-section">
  <h3>IADL · 환자 중심</h3>
  <div class="detail-item red"><b>COPM</b> (Canadian Occupational Performance Measure) — 캐나다 작업수행 평가</div>
  <div class="detail-item red"><b>Frenchay Activity Index</b> — 프랭키 일상생활활동 자기평가지수</div>
  <div class="detail-item red"><b>Lawton IADL evaluation</b> — 로턴의 수단적 일상생활활동 평가</div>
</div>\`,

`;

// 5) Insert detail entries before the closing }; of allDetailData['ch1']
// Find the entry "  'exam-q4'" (last one) and insert before the close brace
// Use the second-to-last `};` as marker - allDetailData close
// Simpler: find last detail key entry with regex and append

// Locate close: the second `};` (line 1090 originally)
// Use brace-depth parse instead
// Find allDetailData['ch1'] = {  ... };
const blockStart = html.indexOf("allDetailData['ch1'] = {");
if (blockStart === -1) throw new Error("allDetailData['ch1'] block not found");
const braceStart = html.indexOf('{', blockStart);
let depth = 0, inStr = false, strCh = '', endBrace = -1, prevCh = '';
for (let i = braceStart; i < html.length; i++) {
  const ch = html[i];
  if (inStr) {
    if (ch === strCh && prevCh !== '\\') inStr = false;
  } else {
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
  }
  prevCh = ch;
}
if (endBrace === -1) throw new Error('allDetailData close brace not found');

html = html.slice(0, endBrace) + newDetails + html.slice(endBrace);

// Write
fs.writeFileSync(FILE, html);
console.log('OK. New file size:', fs.statSync(FILE).size);
