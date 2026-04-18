'use strict';
// HTML2 fix: tab2 화상평가 보강 (5 cards) + 짧은 detail 확장
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '기능훈련2_화상환자ADL.html');
let html = fs.readFileSync(FILE, 'utf8');

// 1) tab2 카드 추가 - 5개 새 카드 (rule-of-nines, burn-depth 뒤)
const insertMarker = `          <div class="card" onclick="openDetail('ch1','burn-depth')">
            <div class="card-body">
              <div class="card-title">화상 깊이 분류</div>
              <div class="card-sub">1도(홍반) · 2도=일부층화상(수포) · 3도=전층화상(무통각)</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>

        <!-- 탭 3: 합병증 -->`;

const newCards = `          <div class="card" onclick="openDetail('ch1','burn-depth')">
            <div class="card-body">
              <div class="card-title">화상 깊이 분류</div>
              <div class="card-sub">1도(홍반) · 2도=일부층화상(수포) · 3도=전층화상(무통각)</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','burn-cause-4types')">
            <div class="card-body">
              <div class="card-title">📌 화상의 원인 (4가지)</div>
              <div class="card-sub">열 · 전기 · 화학 · 방사선</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','lund-browder')">
            <div class="card-body">
              <div class="card-title">📌 Lund-Browder 차트</div>
              <div class="card-sub">소아 화상 면적 평가 · 9의 법칙보다 정확</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','burn-severity')">
            <div class="card-body">
              <div class="card-title">📌 중증도 분류 (ABA)</div>
              <div class="card-sub">경증 · 중등도 · 중증 · 입원 기준</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','baux-score-detail')">
            <div class="card-body">
              <div class="card-title">생존율 평가 (Baux Score)</div>
              <div class="card-sub">나이 + 화상 면적(%) · Revised Baux 추가</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','burn-eval-pt')">
            <div class="card-body">
              <div class="card-title">물리치료사의 화상 평가</div>
              <div class="card-sub">관절가동범위 · 근력 · 감각 · ADL · 통증</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
        </div>

        <!-- 탭 3: 합병증 -->`;

if (html.indexOf(insertMarker) === -1) throw new Error('tab2 marker not found');
if (html.indexOf("'burn-cause-4types'") !== -1) throw new Error('burn-cause already exists');
html = html.replace(insertMarker, newCards);

// 2) 5개 신규 detail entries
const newDetails = `
  'burn-cause-4types': \`<h2>화상의 원인 (4가지)</h2>
<table class="detail-table">
  <tr><th>분류</th><th>원인·특징</th><th>치료 고려사항</th></tr>
  <tr><td><b>열 화상 (Thermal)</b></td><td>화염, 뜨거운 물·기름·증기, 접촉 (가장 흔함)</td><td>차가운 물 식히기 (10~20분), 부종·수포 관리</td></tr>
  <tr><td><b>전기 화상 (Electrical)</b></td><td>저전압(<1000V) / 고전압(>1000V) · 입출구 손상</td><td><b>심부 조직 손상</b> 평가 (외관보다 심함), 심전도 모니터, 횡문근융해증</td></tr>
  <tr><td><b>화학 화상 (Chemical)</b></td><td>산(acid) / 알칼리(alkali) / 유기용제</td><td><b>대량의 물로 세척</b> (최소 20분), 알칼리 화상이 더 깊게 진행</td></tr>
  <tr><td><b>방사선 화상 (Radiation)</b></td><td>자외선·X선·감마선 · 만성 노출</td><td>색소침착, 위축, 만성 궤양, <b>피부암 위험</b></td></tr>
</table>
<div class="warn-box">
  ⚠️ <b>국시 빈출:</b><br>
  • <b>전기 화상</b> = 외관보다 <b>심부 조직 손상</b>이 심각, 1~2년 후 척수마비 증상 가능 (고전압)<br>
  • <b>알칼리 화상</b> = 산 화상보다 <b>더 깊게 진행</b> (단백질 응고괴사)<br>
  • <b>화학 화상 처치</b> = 대량의 물로 즉시 세척
</div>\`,

  'lund-browder': \`<h2>Lund-Browder 차트</h2>
<div class="detail-section">
  <h3>개요</h3>
  <div class="detail-item accent"><b>Lund-Browder Chart</b> — 화상 면적을 <b>나이별로 정확하게</b> 평가하는 도구</div>
  <div class="detail-item blue"><b>9의 법칙보다 정확</b> — 특히 <b>소아 화상 평가의 표준</b></div>
</div>
<div class="detail-section">
  <h3>9의 법칙과의 차이</h3>
  <table class="detail-table">
    <tr><th>부위</th><th>성인 9의 법칙</th><th>1세 영아 (Lund-Browder)</th></tr>
    <tr><td>머리</td><td>9%</td><td><b>19%</b></td></tr>
    <tr><td>몸통(앞·뒤)</td><td>36%</td><td>32%</td></tr>
    <tr><td>다리(양쪽)</td><td>36%</td><td><b>26%</b></td></tr>
    <tr><td>팔(양쪽)</td><td>18%</td><td>18%</td></tr>
    <tr><td>회음부</td><td>1%</td><td>1%</td></tr>
  </table>
  <div class="tip-box" style="margin-top:8px;">💡 <b>소아는 머리가 큼·다리가 짧음</b> → 9의 법칙 적용 시 면적 과소 평가</div>
</div>
<div class="detail-section">
  <h3>임상 의의</h3>
  <div class="detail-item green">소아 화상 시 <b>Lund-Browder 차트 우선 사용</b></div>
  <div class="detail-item green">수액 요구량 계산 (Parkland 공식) 정확도 향상</div>
  <div class="detail-item green">중증도 판정 정확도 향상</div>
</div>\`,

  'burn-severity': \`<h2>화상 중증도 분류 (American Burn Association)</h2>
<table class="detail-table">
  <tr><th>등급</th><th>2도 화상</th><th>3도 화상</th><th>처치</th></tr>
  <tr><td><b>경증 (Minor)</b></td><td>성인 &lt;15%, 소아 &lt;10%</td><td>&lt;2%</td><td>외래 처치</td></tr>
  <tr><td><b>중등도 (Moderate)</b></td><td>성인 15~25%, 소아 10~20%</td><td>2~10%</td><td>일반 병원 입원</td></tr>
  <tr><td><b>중증 (Major)</b></td><td>성인 >25%, 소아 >20%</td><td>>10%</td><td><b>화상 전문센터</b> 입원</td></tr>
</table>
<div class="detail-section">
  <h3>중증으로 분류되는 추가 기준</h3>
  <div class="detail-item red"><b>흡입 손상 (Inhalation injury)</b></div>
  <div class="detail-item red"><b>전기 화상 (고전압)</b></div>
  <div class="detail-item red">얼굴·손·발·회음부·주요 관절 화상</div>
  <div class="detail-item red">동반 외상·기저질환</div>
  <div class="detail-item red">화학 화상</div>
</div>
<div class="warn-box">⚠️ 손·발·얼굴·회음부 = <b>기능적·미용적 중요 부위</b> → 면적 작아도 중증으로 분류</div>\`,

  'baux-score-detail': \`<h2>생존율 평가 — Baux Score</h2>
<div class="detail-section">
  <h3>기본 Baux Score</h3>
  <div class="detail-item accent" style="font-size:14px;text-align:center;background:rgba(56,189,248,0.15);padding:12px;border-radius:8px;">
    <b>Baux Score = 나이 + 화상 면적(%TBSA)</b>
  </div>
  <div class="detail-item blue">100점 = 사망률 약 50%</div>
  <div class="detail-item blue">140점 이상 = 거의 100% 사망</div>
</div>
<div class="detail-section">
  <h3>Revised Baux Score (2010)</h3>
  <div class="detail-item green" style="font-size:13.5px;text-align:center;background:rgba(52,211,153,0.15);padding:10px;border-radius:8px;">
    <b>Revised Baux = 나이 + %TBSA + (17 × 흡입손상 여부)</b>
  </div>
  <div class="detail-item yellow"><b>흡입손상 시 +17점</b> — 사망률 17% 추가 증가 효과</div>
</div>
<div class="detail-section">
  <h3>임상 활용</h3>
  <div class="detail-item red">예후 평가, 치료 강도 결정</div>
  <div class="detail-item red">가족 상담 자료</div>
  <div class="detail-item red">중환자실 입원 기준</div>
</div>\`,

  'burn-eval-pt': \`<h2>물리치료사의 화상 평가</h2>
<div class="detail-section">
  <h3>1. 관절가동범위 (ROM)</h3>
  <div class="detail-item accent">화상 부위 주요 관절 ROM 측정</div>
  <div class="detail-item accent"><b>접촉 화상·관절 가로지르는 부위</b> 우선 평가 (구축 호발)</div>
</div>
<div class="detail-section">
  <h3>2. 근력 (MMT)</h3>
  <div class="detail-item blue">손상되지 않은 부위 근력 측정 → 보상 동작 평가</div>
  <div class="detail-item blue">치유 후 점진적 근력 평가</div>
</div>
<div class="detail-section">
  <h3>3. 감각 평가</h3>
  <div class="detail-item green">표재성 감각 (촉각·통각·온각)</div>
  <div class="detail-item green">2점 식별 검사</div>
  <div class="detail-item green"><b>전기 화상</b>: 말초신경 손상 평가</div>
</div>
<div class="detail-section">
  <h3>4. ADL·기능 평가</h3>
  <div class="detail-item yellow">손·얼굴 화상 시 ADL 수행 평가</div>
  <div class="detail-item yellow"><b>Modified Barthel Index</b>, FIM</div>
</div>
<div class="detail-section">
  <h3>5. 통증 평가</h3>
  <div class="detail-item red"><b>VAS (Visual Analog Scale)</b> · NRS · 행동 통증 척도 (소아·인지장애)</div>
</div>
<div class="detail-section">
  <h3>6. 흉터 평가</h3>
  <div class="detail-item accent"><b>Vancouver Scar Scale</b>: 색깔(pigmentation), 혈관분포(vascularity), 유연성(pliability), 두께(height)</div>
</div>\`,

`;

// Insert into allDetailData['ch1']
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
html = html.slice(0, endBrace) + newDetails + html.slice(endBrace);

fs.writeFileSync(FILE, html);
console.log('OK. Size:', fs.statSync(FILE).size);
