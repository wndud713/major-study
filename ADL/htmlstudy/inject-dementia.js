'use strict';
// Inject ch2 치매 tab into 기능훈련2_화상환자ADL.html as tab6
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '기능훈련2_화상환자ADL.html');
let html = fs.readFileSync(FILE, 'utf8');

// 1) Tab button — insert after 국시문제 button (tab5)
const tabBtnMarker = `<button class="tab-btn" onclick="switchTab('ch1','tab5',this)"><span class="tab-icon">🎯</span>국시문제</button>`;
const newTabBtn = `<button class="tab-btn" onclick="switchTab('ch1','tab5',this)"><span class="tab-icon">🎯</span>국시문제</button>
        <button class="tab-btn" onclick="switchTab('ch1','tab6',this)"><span class="tab-icon">🧠</span>치매 ADL</button>`;
if (html.indexOf(tabBtnMarker) === -1) throw new Error('tab5 btn marker not found');
if (html.indexOf(`switchTab('ch1','tab6'`) !== -1) throw new Error('tab6 already exists (idempotency)');
html = html.replace(tabBtnMarker, newTabBtn);

// 2) Build tab6 content
const tab6 = `
        <!-- 탭 6: 치매 ADL -->
        <div class="tab-content" id="ch1-tab-tab6">
          <div class="section-title">치매 개요 · 평가도구 · 단계별 ADL</div>

          <div class="accordion-parent" role="button" tabindex="0" aria-expanded="false"
               onclick="toggleAccordion(this)"
               onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleAccordion(this);}"
               style="background:linear-gradient(135deg,rgba(167,139,250,0.15),rgba(244,114,182,0.12));border:1.5px solid #a78bfa;margin-bottom:12px;">
            <div class="ap-head">
              <span class="ap-icon">📊</span>
              <div class="ap-body">
                <div class="ap-title">치매 평가도구 종합표</div>
                <div class="ap-sub" style="font-size:11.5px;color:#a78bfa;margin-top:2px;">S-SDQ · MMSE · 7MS · KDSQ · ACLS · CDR · GDS · BPSD ▼</div>
              </div>
              <span class="chev">▶</span>
            </div>
            <div class="accordion-children" style="padding:0 14px;">
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:4px;min-width:640px;">
                  <thead>
                    <tr style="background:var(--bg4);">
                      <th style="padding:8px 10px;text-align:left;color:#a78bfa;border-bottom:2px solid var(--border);">분류</th>
                      <th style="padding:8px 10px;text-align:left;color:#a78bfa;border-bottom:2px solid var(--border);">도구</th>
                      <th style="padding:8px 10px;text-align:left;color:#a78bfa;border-bottom:2px solid var(--border);">목적</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="background:rgba(167,139,250,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #a78bfa;font-weight:600;" rowspan="4">선별<br>(5~10분)</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>S-SDQ</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">단축형 삼성치매선별지</td>
                    </tr>
                    <tr style="background:rgba(167,139,250,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>MMSE</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">간이정신상태 검사</td>
                    </tr>
                    <tr style="background:rgba(167,139,250,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>7MS</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">7분 선별 검사</td>
                    </tr>
                    <tr style="background:rgba(167,139,250,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>KDSQ</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">한국판 치매선별 설문지</td>
                    </tr>
                    <tr style="background:rgba(244,114,182,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #f472b6;font-weight:600;" rowspan="3">중증도</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>ACLS</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">인지 판별 (Allen)</td>
                    </tr>
                    <tr style="background:rgba(244,114,182,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>CDR</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">임상 치매 평가 척도 (알츠하이머)</td>
                    </tr>
                    <tr style="background:rgba(244,114,182,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>GDS</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">전반적 퇴화 척도 (퇴행성 중증도)</td>
                    </tr>
                    <tr style="background:rgba(52,211,153,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #34d399;font-weight:600;" rowspan="2">종합 인지</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>CERAD-K</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">한국판 신경심리평가집</td>
                    </tr>
                    <tr style="background:rgba(52,211,153,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>SNSB</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">서울신경심리평가집</td>
                    </tr>
                    <tr style="background:rgba(251,146,60,0.08);">
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);border-left:3px solid #fb923c;font-weight:600;">IADL</td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);"><b>Seoul-IADL</b></td>
                      <td style="padding:7px 10px;border-bottom:1px solid var(--border);">전화·돈 관리·대중교통 — 치매 초기 선별</td>
                    </tr>
                    <tr style="background:rgba(79,209,197,0.08);">
                      <td style="padding:7px 10px;border-left:3px solid #4fd1c5;font-weight:600;">행동</td>
                      <td style="padding:7px 10px;"><b>BPSD</b></td>
                      <td style="padding:7px 10px;">12가지 정신행동 증상 (망각·환각·초조·우울·수면 등)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="warn-box" style="margin-top:10px;">
                <b>⚠️ 국시 빈출:</b><br>
                • <b>MMSE</b> = 선별 검사 대표 도구<br>
                • <b>CDR</b> = 알츠하이머 전반 인지·사회 기능<br>
                • <b>GDS</b> = 퇴행성 치매 중증도<br>
                • <b>BPSD</b> = 12가지 정신행동 증상
              </div>
            </div>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-overview')">
            <div class="card-body">
              <div class="card-title">치매 개요 · 어원</div>
              <div class="card-sub">de-(사라진) + mens(정신) + tia(상태) · 고령화 · 국가적 부담</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-cause')">
            <div class="card-body">
              <div class="card-title">치매의 원인</div>
              <div class="card-sub">대뇌 겉질 퇴화 · 뇌세포 소실 · 가역/비가역 손상</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-symptoms')">
            <div class="card-body">
              <div class="card-title">치매의 일반 증상 (9가지)</div>
              <div class="card-sub">기억 상실 · 언어 · 혼동 · 작업수행 불가 · 기분/행동 변화 등</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-classify')">
            <div class="card-body">
              <div class="card-title">치매 분류 (5유형)</div>
              <div class="card-sub">경도인지장애 · 알츠하이머 · 혈관성 · 루이소체 · 이마관자엽</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-eval')">
            <div class="card-body">
              <div class="card-title">치매 평가 절차</div>
              <div class="card-sub">초기평가 · 신경심리 · 선별 · 종합인지 · IADL · 신체 · BPSD</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-basic')">
            <div class="card-body">
              <div class="card-title">치매 ADL 훈련 기본방법</div>
              <div class="card-sub">습관 유지 · 단계적 지시 · 주간 활동 · 회상 활동</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-stage')">
            <div class="card-body">
              <div class="card-title">단계별 ADL (경도 · 중등도 · 중증)</div>
              <div class="card-sub">3단계별 특성 · 훈련 접근 전략</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','dem-adl10')">
            <div class="card-body">
              <div class="card-title">ADL 훈련 10영역</div>
              <div class="card-sub">식사 · 약 · 구강 · 수면 · 착탈의 · 목욕 · 배설 · 이동 · 환경 · 예방</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>
        <!-- /탭 6 -->
`;

// 3) Insert before `</div>\n\n      </div><!-- /cards-area -->` marker
const tab5End = `</div>

      </div><!-- /cards-area -->`;
const tab5EndIdx = html.indexOf(tab5End);
if (tab5EndIdx === -1) throw new Error('tab5 end marker not found');
html = html.slice(0, tab5EndIdx) + `</div>` + tab6 + `
      </div><!-- /cards-area -->` + html.slice(tab5EndIdx + tab5End.length);

// 4) Detail entries
const dd = `
  'dem-overview': \`<h2>치매 개요</h2>
<div class="detail-section">
  <h3>어원</h3>
  <div class="detail-item accent"><b>라틴어 유래:</b> de-(사라진) + mens(정신) + tia(상태) = <b>"정신이 없어진 것"</b></div>
</div>
<div class="detail-section">
  <h3>정의</h3>
  <div class="detail-item blue">정상적으로 생활해오던 사람이 다양한 원인에 의해 <b>뇌기능이 손상</b>되면서 인지기능이 지속적이고 전반적으로 저하되어 일상생활에 상당한 지장이 나타나는 상태</div>
</div>
<div class="detail-section">
  <h3>사회적 맥락</h3>
  <div class="detail-item yellow">급속한 고령화로 치매 유병률 증가 → 개인·가족만의 문제를 넘어 <b>사회가 함께 해결해야 하는 국가적 부담</b></div>
  <div class="detail-item yellow">국가적 차원의 <b>치매 관리 종합계획</b> 실시</div>
</div>\`,

  'dem-cause': \`<h2>치매의 원인</h2>
<div class="detail-section">
  <h3>주요 기전</h3>
  <div class="detail-item accent"><b>대뇌 겉질(cortex)의 퇴화</b>에 의해 발생</div>
  <div class="detail-item accent"><b>사고, 기억, 행동, 성격</b>을 담당하는 뇌의 부분과 직접적으로 연관</div>
</div>
<div class="detail-section">
  <h3>병리</h3>
  <div class="detail-item blue">뇌세포 소실 → 인지장애</div>
  <div class="detail-item blue">뇌의 <b>가역적 또는 비가역적 손상</b>을 초래할 수 있는 질환들이 치매 유발</div>
</div>\`,

  'dem-symptoms': \`<h2>치매의 일반적 증상 (9가지)</h2>
<table class="detail-table">
  <tr><th>No.</th><th>증상</th></tr>
  <tr><td>1</td><td><b>빈번하고 점진적 기억 상실</b></td></tr>
  <tr><td>2</td><td>언어의 어려움</td></tr>
  <tr><td>3</td><td>혼동</td></tr>
  <tr><td>4</td><td>익숙한 작업 수행의 불가능</td></tr>
  <tr><td>5</td><td>추상적인 사고의 어려움</td></tr>
  <tr><td>6</td><td>물건 잘못 두기</td></tr>
  <tr><td>7</td><td>급속한 기분의 변화</td></tr>
  <tr><td>8</td><td>행동 변화</td></tr>
  <tr><td>9</td><td>자발성 결여 / 무관심</td></tr>
</table>\`,

  'dem-classify': \`<h2>치매의 분류 (5유형)</h2>
<div class="detail-section">
  <h3>1. 경도인지장애 (MCI)</h3>
  <div class="detail-item accent">인지기능장애는 있으나 치매라고 할 만큼 심하지 않은 상태</div>
</div>
<div class="detail-section">
  <h3>2. 알츠하이머형 치매</h3>
  <div class="detail-item blue">기억장애가 있으며 <b>인지기능장애가 점진적으로 악화</b>되는 것이 특징</div>
</div>
<div class="detail-section">
  <h3>3. 혈관성 치매</h3>
  <div class="detail-item green">원인: <b>뇌경색, 대뇌 허혈, 대뇌 출혈</b> 등 혈관 손상</div>
</div>
<div class="detail-section">
  <h3>4. 루이소체 치매</h3>
  <div class="detail-item yellow"><b>흑질 + 피질 영역 전반</b>에 걸쳐 <b>도파민성 뉴런의 변성</b>이 나타나는 퇴행성 질환</div>
</div>
<div class="detail-section">
  <h3>5. 이마관자엽 치매 (Frontotemporal)</h3>
  <div class="detail-item red">전측두 부위의 퇴화 → 피질성 치매의 한 유형, 점진적으로 서서히 진행</div>
</div>\`,

  'dem-eval': \`<h2>치매 평가 절차</h2>
<div class="detail-section">
  <h3>1. 초기평가</h3>
  <div class="detail-item accent">전반적인 정보 수집: 주요 원인, 개인력, 과거력, 현재병력, 투약정보, 주거정보, 가족정보, 성격·정동상태</div>
  <div class="detail-item accent">치매선별 검사 + 신경심리 검사 포함</div>
</div>
<div class="detail-section">
  <h3>2. 신경심리 검사</h3>
  <div class="detail-item blue">순서: 신경심리 → 임상병리 → 뇌 영상의학</div>
  <div class="detail-item blue">치매선별, 인지기능, ADL, 행동증상, 치매단계, 삶의 질, 가족 스트레스 등 평가</div>
</div>
<div class="detail-section">
  <h3>3. 치매 선별 검사 (5~10분)</h3>
  <div class="detail-item green"><b>스크리닝:</b> S-SDQ, MMSE, 7MS, KDSQ</div>
  <div class="detail-item green"><b>인지 판별:</b> ACLS (Allen Cognitive Level Screen)</div>
  <div class="detail-item green"><b>알츠하이머 전반:</b> CDR (한국판 확장판 임상 치매 평가 척도)</div>
  <div class="detail-item green"><b>퇴행성 중증도:</b> GDS (한국판 전반적 퇴화 척도)</div>
</div>
<div class="detail-section">
  <h3>4. 종합적 인지기능 검사</h3>
  <div class="detail-item yellow">기억력·언어·시공간구성·행위·이마엽 기능 평가</div>
  <div class="detail-item yellow">도구: <b>SDQ, S-SDQ, CERAD-K, SNSB</b></div>
</div>
<div class="detail-section">
  <h3>5. 일상생활활동 평가</h3>
  <div class="detail-item red"><b>Seoul-IADL:</b> 도구적 일상활동 평가 (전화·돈 관리·대중교통) → <b>치매 초기 여부</b> 적절히 평가</div>
</div>
<div class="detail-section">
  <h3>6. 신체기능 평가</h3>
  <ul style="padding-left:20px;color:var(--text);line-height:1.8;">
    <li>머리 위 선반 물건 꺼내기</li>
    <li>코트 입기 / 바닥 물건 집기</li>
    <li>계단 올라가기</li>
    <li>의자에서 일어나기</li>
    <li>욕조에서 나오기</li>
    <li>바닥에서 일어나기</li>
  </ul>
</div>
<div class="detail-section">
  <h3>7. 정신행동 증상 평가</h3>
  <div class="detail-item accent"><b>BPSD:</b> 신경심리행동 검사 — 망각, 환각, 초조, 우울, 수면 등 <b>12가지 정신행동 증상</b></div>
</div>\`,

  'dem-basic': \`<h2>치매 ADL 훈련 — 기본방법</h2>
<div class="detail-section">
  <h3>환경·습관 관리</h3>
  <div class="detail-item accent">자주 쓰는 품목은 잘 보이는 곳에 둔다</div>
  <div class="detail-item accent"><b>간단하게 한 단계씩</b> 지시한다</div>
  <div class="detail-item accent">가능한 한 <b>습관적인 활동을 유지</b>하고 간단하게 한다</div>
</div>
<div class="detail-section">
  <h3>안전 조치</h3>
  <div class="detail-item blue">기억 손상으로 길을 잃은 경우 대비 — <b>신분 증명 팔찌</b> 착용</div>
  <div class="detail-item blue"><b>치명적 결과를 초래할 수 있는 붐비는 곳·익숙하지 않은 환경 피함</b></div>
</div>
<div class="detail-section">
  <h3>수면·활동 관리</h3>
  <div class="detail-item green">밤에 잘 자도록 <b>낮 동안 신체적 활동 장려</b></div>
  <div class="detail-item green">기억 자극: 즐겨 듣던 <b>음악, 취미활동 등 회상 활동</b></div>
  <div class="detail-item green">삶을 풍부하게 할 수 있는 활동 참여 + <b>순서·습관 강화 → 절차적 기억 촉진</b></div>
</div>
<div class="detail-section">
  <h3>자원 연계</h3>
  <div class="detail-item yellow">자원 목록과 지원 그룹에 대해 <b>지역기관에 문의</b></div>
</div>
<div class="detail-section">
  <h3>일상생활활동 방법</h3>
  <div class="detail-item red">최대한 독립적으로 오랫동안 유지하도록 격려</div>
  <div class="detail-item red">보조도구 제공 및 사용법 교육</div>
  <div class="detail-item red">환경적 구조 수정</div>
  <div class="detail-item red">불안감 감소·신체적 안정 배려</div>
  <div class="detail-item red">가족의 지지·지역 원조 정보 제공</div>
</div>\`,

  'dem-stage': \`<h2>치매 단계별 ADL 훈련</h2>
<div class="detail-section">
  <h3>① 경도 치매단계</h3>
  <div class="detail-item accent"><b>감각·인지 훈련</b> 실시</div>
  <div class="detail-item accent">신체기능 활동 제공</div>
  <div class="detail-item accent"><b>하루 일과를 꾸준히</b> 행할 수 있도록 함</div>
  <div class="detail-item accent">다양한 <b>언어적·비언어적 방법</b> 사용</div>
  <div class="detail-item accent">의사전달 간단명료하고 이해하기 쉽도록</div>
</div>
<div class="detail-section">
  <h3>② 중등도 치매단계</h3>
  <div class="detail-item blue"><b>지남력·기억장애</b>로 인해 최근에 알게 된 사실이나 친숙하지 않은 것 금방 잊음</div>
  <div class="detail-item blue"><b>간단한 방법으로 일상생활</b>을 하도록 도움</div>
  <div class="detail-item blue"><b>생활 전반에서 보조도구 필요</b></div>
</div>
<div class="detail-section">
  <h3>③ 중증 치매단계</h3>
  <div class="detail-item red">장기기억도 아주 <b>단편적 기억만</b> 남음</div>
  <div class="detail-item red"><b>친숙한 사람·매일 돌봐주는 가까운 사람만 알아봄</b></div>
  <div class="detail-item red"><b>판단·문제해결 불가능</b></div>
  <div class="detail-item red"><b>안전 개념 상실</b> → 이에 대한 관리 필요</div>
</div>
<table class="detail-table">
  <tr><th>단계</th><th>기억</th><th>독립성</th><th>초점</th></tr>
  <tr><td>경도</td><td>최근 기억 약간 저하</td><td>대부분 독립</td><td>훈련·습관 강화</td></tr>
  <tr><td>중등도</td><td>지남력·기억 장애</td><td>보조도구 필요</td><td>간단 방법 지원</td></tr>
  <tr><td>중증</td><td>단편적 장기기억만</td><td>의존</td><td>안전·보호 관리</td></tr>
</table>\`,

  'dem-adl10': \`<h2>치매 ADL 훈련 — 10영역</h2>
<table class="detail-table">
  <tr><th>No.</th><th>영역</th></tr>
  <tr><td>1</td><td>식사</td></tr>
  <tr><td>2</td><td>약복용</td></tr>
  <tr><td>3</td><td>구강위생</td></tr>
  <tr><td>4</td><td>수면</td></tr>
  <tr><td>5</td><td>착탈의</td></tr>
  <tr><td>6</td><td>목욕</td></tr>
  <tr><td>7</td><td>배설 및 화장실 이용</td></tr>
  <tr><td>8</td><td>이동과 보행</td></tr>
  <tr><td>9</td><td><b>치매환자의 환경 수정</b></td></tr>
  <tr><td>10</td><td><b>치매예방수칙</b></td></tr>
</table>
<div class="tip-box">💡 <b>7가지 ADL(식사~이동) + 환경 수정 + 예방수칙</b> — 생활 전반과 예방까지 포괄</div>\`,

`;

// 5) Insert into allDetailData['ch1'] — brace-depth parse
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
html = html.slice(0, endBrace) + dd + html.slice(endBrace);

fs.writeFileSync(FILE, html);
console.log('OK. New size:', fs.statSync(FILE).size);
