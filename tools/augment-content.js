'use strict';
/**
 * tools/augment-content.js
 * 임상의사결정 6개 HTML 파일에 누락된 카드 + 디테일 키 일괄 주입
 *
 * 사용:
 *   node tools/augment-content.js                # 모든 파일 처리
 *   node tools/augment-content.js <fileKey>      # 단일 파일
 *
 * 카드/디테일 정의는 augmentations 객체에 정의.
 * 주입 위치는 marker 문자열로 지정 (해당 라인 직전 또는 직후).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ─── 추가 콘텐츠 정의 ────────────────────────────────────────────────────
const augmentations = {
  // ──────────── 절단 ────────────
  amputation: {
    file: '임상의사결정/htmlstudy/절단.html',
    cards: [
      {
        // 탭 2 (postop) 끝에 추가 — exercise 카드 직후
        afterMarker: `<div class="card" onclick="openDetail('ch1','exercise')">`,
        afterCloseMarker: `</div>\n          </div>`, // exercise 카드 닫는 부분
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','wound_care')">
            <div class="card-body">
              <div class="card-title">상처 관리 (Wound Care)</div>
              <div class="card-sub">절개부 위생 · 봉합사 제거 시기 · 흉터조직 관리</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
          <div class="card" onclick="openDetail('ch1','phantom_pain')">
            <div class="card-body">
              <div class="card-title">환상통(Phantom Pain) vs 절단부통(Stump Pain)</div>
              <div class="card-sub">감각 vs 통증 구분 · 거울치료 · TENS · 약물</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
          <div class="card" onclick="openDetail('ch1','mirror_therapy')">
            <div class="card-body">
              <div class="card-title">거울치료(Mirror Therapy) 프로토콜</div>
              <div class="card-sub">거울상자 · 좌·우 대칭 운동 · 1회 15-30분 · 일 1-2회</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
          <div class="card" onclick="openDetail('ch1','prosthetic_fit')">
            <div class="card-body">
              <div class="card-title">의지(Prosthesis) 적합 평가</div>
              <div class="card-sub">소켓 핏 · 정렬 · 안정성 · 보행 단계별 진행</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
    ],
    details: [
      {
        key: 'wound_care',
        html: `<h2>상처 관리 (Wound Care)</h2>
<div class="detail-section">
  <h3>절개부 관리</h3>
  <div class="detail-item">• 봉합사 제거: 일반적으로 술 후 <b>10-14일</b></div>
  <div class="detail-item">• 절개부 청결 유지 — 멸균 거즈 드레싱, 1일 1회 교체</div>
  <div class="detail-item">• 감염 징후 관찰: 발적·열감·삼출물 증가·악취</div>
</div>
<div class="detail-section">
  <h3>흉터조직 관리</h3>
  <div class="detail-item">• 부드러운 마사지 (수직·환형) — 흉터 가동성 확보</div>
  <div class="detail-item">• 실리콘 시트 / 흉터 크림 — 비후성 흉터 예방</div>
  <div class="detail-item">• 의지 착용 전 흉터-피부 유착 평가 필수</div>
</div>
<div class="warn-box"><b>주의:</b> 봉합사 제거 전 격렬한 ROM 운동 금지 — 절개부 열림 위험</div>`,
      },
      {
        key: 'phantom_pain',
        html: `<h2>환상통 vs 절단부통</h2>
<div class="detail-section">
  <h3>환상감각 (Phantom Sensation)</h3>
  <div class="detail-item">• 절단된 부위가 <b>존재한다는 느낌</b> — 통증 X</div>
  <div class="detail-item">• 정상 적응 과정, 대부분 시간 경과로 감소</div>
</div>
<div class="detail-section">
  <h3>환상통 (Phantom Pain)</h3>
  <div class="detail-item">• 절단된 부위에 <b>통증 인식</b> — 작열감·찌르는 듯·전기충격 양상</div>
  <div class="detail-item">• 발생률: 50-80% (시간 경과로 대부분 감소)</div>
  <div class="detail-item">• 중재: 거울치료 · TENS · 약물 (gabapentin 등) · 인지행동치료</div>
</div>
<div class="detail-section">
  <h3>절단부통 (Stump/Residual Limb Pain)</h3>
  <div class="detail-item">• <b>잘린끝 자체</b>의 통증 — 신경종(neuroma)·골돌출·감염·소켓 부적합</div>
  <div class="detail-item">• 중재: 원인 교정 (소켓 조정·신경종 절제) · 탈감각화</div>
</div>
<div class="tip-box">💡 <b>구분 핵심:</b> "없는 부위가 아프다" = 환상통 / "잘린 부위가 아프다" = 절단부통</div>`,
      },
      {
        key: 'mirror_therapy',
        html: `<h2>거울치료(Mirror Therapy) 프로토콜</h2>
<div class="detail-section">
  <h3>원리</h3>
  <div class="detail-item">반대편(건측)의 거울상을 통해 <b>절단측 운동의 시각적 피드백</b> 제공 → 대뇌피질 재조직 유도, 환상통 완화</div>
</div>
<div class="detail-section">
  <h3>절차</h3>
  <div class="detail-item">1. 거울상자에 건측을 넣고 절단측은 가린다</div>
  <div class="detail-item">2. 환자가 건측 사지를 거울에 비추어 본다 → 절단측이 움직이는 것처럼 인식</div>
  <div class="detail-item">3. 천천히 ROM 운동 시작 (굽힘·폄·돌림 등)</div>
  <div class="detail-item">4. 점진적으로 복잡한 동작 추가 (잡기·풀기·손가락 개별 운동)</div>
</div>
<div class="detail-section">
  <h3>처방</h3>
  <div class="detail-item">• 1회 <b>15-30분</b>, 일 <b>1-2회</b>, 4주 이상 지속</div>
  <div class="detail-item">• 조용한 환경, 거울 정렬 정확히</div>
</div>
<div class="warn-box"><b>금기:</b> 어지러움·메스꺼움 발생 시 즉시 중단</div>`,
      },
      {
        key: 'prosthetic_fit',
        html: `<h2>의지(Prosthesis) 적합 평가</h2>
<div class="detail-section">
  <h3>소켓 적합성 (Socket Fit)</h3>
  <div class="detail-item">• 절단부 균등한 압력 분포 — 골돌출부 압통 없음</div>
  <div class="detail-item">• 피부 변색·물집·통증 부위 점검</div>
  <div class="detail-item">• 부피 변화 시 양말(stump sock) 두께 조정</div>
</div>
<div class="detail-section">
  <h3>정렬 (Alignment)</h3>
  <div class="detail-item">• <b>정적 정렬:</b> 서있는 자세에서 체중부하선 점검</div>
  <div class="detail-item">• <b>동적 정렬:</b> 보행 중 무릎·엉덩관절 움직임 관찰</div>
</div>
<div class="detail-section">
  <h3>의지 착용 단계 진행</h3>
  <div class="detail-item">1. <b>수술 전</b> — 환자 교육·근력강화</div>
  <div class="detail-item">2. <b>수술 직후~1주</b> — 잘린끝 형성, 부종 관리</div>
  <div class="detail-item">3. <b>2-6주</b> — 임시의지(temporary prosthesis) 착용 시작</div>
  <div class="detail-item">4. <b>6주 이후</b> — 영구의지 처방, 보행훈련 본격화</div>
  <div class="detail-item">5. <b>지역사회 보행</b> — 계단·경사·다양 지면 적응</div>
</div>
<div class="tip-box">💡 절단 후 영구의지 착용 권장 시기는 <b>잘린끝 부피 안정 후</b> (보통 술 후 6주~3개월)</div>`,
      },
    ],
  },

  // ──────────── 임상의사결정개론 ────────────
  cdmintro: {
    file: '임상의사결정/htmlstudy/임상의사결정개론.html',
    cards: [
      {
        // tab4 (근거중심) 끝에 추가 — pico 카드 직후
        afterMarker: `<div class="card" onclick="openDetail('ch1','pico')">`,
        afterCloseMarker: `</div>\n          </div>`,
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','research_methods')">
            <div class="card-body">
              <div class="card-title">연구 방법 분류</div>
              <div class="card-sub">메타분석 · 체계적고찰 · RCT · 코호트 · 환자대조 · 단면 · 사례연구</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
          <div class="card" onclick="openDetail('ch1','databases')">
            <div class="card-body">
              <div class="card-title">EBPT 데이터베이스</div>
              <div class="card-sub">PEDro · MEDLINE/PubMed · Embase · 국내 사이트</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
      {
        // tab2 (ICF) 끝에 추가 — icf_compare 카드 직후
        afterMarker: `<div class="card" onclick="openDetail('ch1','icf_compare')">`,
        afterCloseMarker: `</div>\n          </div>`,
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','case_frozen_shoulder')">
            <div class="card-body">
              <div class="card-title">사례 — 굳은 어깨 (Frozen Shoulder)</div>
              <div class="card-sub">손상(impairment) vs 활동제한(activity limitation) 구분 연습</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
          <div class="card" onclick="openDetail('ch1','case_head_injury')">
            <div class="card-body">
              <div class="card-title">사례 — 머리손상 (40세 남자)</div>
              <div class="card-sub">목욕·옷 입기 어려움 — 기능제한 vs 장애 구분</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
      {
        // tab5 (문서화) 끝에 추가 — soap_principle 카드 직후
        afterMarker: `<div class="card" onclick="openDetail('ch1','soap_principle')">`,
        afterCloseMarker: `</div>\n          </div>`,
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','case_lefs')">
            <div class="card-body">
              <div class="card-title">사례 — 하지기능 (LEFS)</div>
              <div class="card-sub">VAS 6, LEFS 26점 — Objective(O) 영역 작성</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>
          <div class="card" onclick="openDetail('ch1','ethics_confidentiality')">
            <div class="card-body">
              <div class="card-title">윤리 — 환자 정보 보호</div>
              <div class="card-sub">감염성 질환 격리 vs 개인정보 보호 원칙</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
    ],
    details: [
      {
        key: 'research_methods',
        html: `<h2>연구 방법 분류</h2>
<div class="detail-section">
  <h3>증거 수준 높은 순</h3>
  <div class="detail-item green"><b>① 메타분석 (Meta-analysis)</b> — 동일 주제 여러 연구 통계적 통합</div>
  <div class="detail-item green"><b>② 체계적 고찰 (Systematic Review)</b> — 명확한 기준으로 문헌 검토·종합</div>
  <div class="detail-item green"><b>③ 무작위 대조 시험 (RCT)</b> — 무작위 배정 + 대조군 비교</div>
  <div class="detail-item accent"><b>④ 코호트 연구</b> — 추적조사, 노출군 vs 비노출군</div>
  <div class="detail-item accent"><b>⑤ 환자대조군 연구 (Case-control)</b> — 질병군 vs 정상군 비교</div>
  <div class="detail-item"><b>⑥ 단면 연구 (Cross-sectional)</b> — 특정 시점 횡단 조사</div>
  <div class="detail-item"><b>⑦ 단일 사례 연구 (Case Report/Series)</b> — 개별 사례 관찰·기술</div>
  <div class="detail-item"><b>⑧ 전문가 의견 (Expert opinion)</b> — 임상 경험 기반</div>
</div>
<div class="tip-box">💡 <b>국시 포인트:</b> 무작위 임상실험 = RCT, 추적조사 = 코호트, 단일 사례 연구 = 한 명 또는 동일 특성 집단 대상 중재 반응 관찰</div>`,
      },
      {
        key: 'databases',
        html: `<h2>EBPT 데이터베이스</h2>
<div class="detail-section">
  <h3>국제 데이터베이스</h3>
  <div class="detail-item"><b>PEDro</b> (호주) — 물리치료 RCT 전문, 평가도구 점수 제공</div>
  <div class="detail-item"><b>MEDLINE / PubMed</b> (미국) — 의학·생명과학 종합</div>
  <div class="detail-item"><b>Embase</b> (유럽) — 생의학·약학 종합</div>
  <div class="detail-item"><b>Cochrane Library</b> — 체계적 고찰·메타분석 전문</div>
  <div class="detail-item"><b>CINAHL</b> — 간호·보건의료</div>
</div>
<div class="detail-section">
  <h3>국내 데이터베이스</h3>
  <div class="detail-item">• KISS (한국학술정보)</div>
  <div class="detail-item">• RISS (학술연구정보서비스)</div>
  <div class="detail-item">• KMbase (한국의학논문데이터베이스)</div>
  <div class="detail-item">• DBPIA</div>
</div>
<div class="tip-box">💡 물리치료 근거 검색 우선순위: <b>PEDro → Cochrane → PubMed</b></div>`,
      },
      {
        key: 'case_frozen_shoulder',
        html: `<h2>사례 — 굳은 어깨 (Frozen Shoulder)</h2>
<div class="detail-section">
  <h3>환자 정보</h3>
  <div class="detail-item">• 50대 여성, 진단명: 굳은 어깨 (adhesive capsulitis)</div>
  <div class="detail-item">• 주증상: 어깨 ROM 제한 (외전·외회전 특히 제한)</div>
</div>
<div class="detail-section">
  <h3>Nagi / ICF 분류</h3>
  <div class="detail-item red"><b>병리 (Pathology):</b> 관절낭 유착·섬유화</div>
  <div class="detail-item accent"><b>손상 (Impairment):</b> ROM 감소, 통증</div>
  <div class="detail-item accent"><b>기능제한 (Functional limitation):</b> 머리 빗기·옷 입기 어려움</div>
  <div class="detail-item accent"><b>장애 (Disability):</b> 직장 업무 수행 곤란, 사회참여 제한</div>
</div>
<div class="warn-box"><b>국시 포인트:</b> "ROM 제한" = <b>손상</b>, "팔을 머리 위로 들기 어렵다" = <b>기능제한</b>, "사회적 역할 못함" = <b>장애</b></div>`,
      },
      {
        key: 'case_head_injury',
        html: `<h2>사례 — 머리손상 (40세 남자)</h2>
<div class="detail-section">
  <h3>환자 정보</h3>
  <div class="detail-item">• 40세 남자, 진단명: 외상성 뇌손상 (TBI)</div>
  <div class="detail-item">• 주호소: 목욕·옷 입기 등 일상활동 어려움</div>
</div>
<div class="detail-section">
  <h3>분류</h3>
  <div class="detail-item red"><b>병리:</b> 뇌 실질 손상, 인지·운동 통합 장애</div>
  <div class="detail-item accent"><b>손상:</b> 근력 저하, 균형 감소, 인지 저하</div>
  <div class="detail-item accent"><b>기능제한:</b> ADL 수행 곤란 (목욕·옷 입기)</div>
  <div class="detail-item accent"><b>장애:</b> 가정·직장 역할 수행 불가</div>
</div>
<div class="tip-box">💡 ADL 수행 곤란은 <b>기능제한</b> 단계 — 사회 역할까지 못 하면 <b>장애</b></div>`,
      },
      {
        key: 'case_lefs',
        html: `<h2>사례 — 하지기능 (LEFS)</h2>
<div class="detail-section">
  <h3>환자 정보</h3>
  <div class="detail-item">• 오른쪽 다리 통증으로 내원</div>
  <div class="detail-item">• <b>VAS:</b> 6/10 (중등도 통증)</div>
  <div class="detail-item">• <b>LEFS (Lower Extremity Functional Scale):</b> 26점 / 80점 만점 (낮을수록 기능 저하)</div>
</div>
<div class="detail-section">
  <h3>SOAP 노트 작성</h3>
  <div class="detail-item"><b>S (Subjective):</b> "걸을 때 오른쪽 다리가 아프다"</div>
  <div class="detail-item"><b>O (Objective):</b> VAS 6, LEFS 26점, ROM 측정값, 근력 등급</div>
  <div class="detail-item"><b>A (Assessment):</b> 하지 기능 저하 — 통증 + ADL 제한</div>
  <div class="detail-item"><b>P (Plan):</b> 통증조절, 근력강화, 보행훈련 — 단기·장기 목표</div>
</div>
<div class="warn-box"><b>국시 포인트:</b> 측정값(VAS·LEFS·ROM·근력)은 <b>O(Objective)</b>에 기록</div>`,
      },
      {
        key: 'ethics_confidentiality',
        html: `<h2>윤리 — 환자 정보 보호</h2>
<div class="detail-section">
  <h3>원칙</h3>
  <div class="detail-item">• 환자 개인정보는 <b>치료 목적 외 사용·공개 금지</b></div>
  <div class="detail-item">• 의료진간 정보 공유는 <b>치료에 필요한 범위</b>로 제한</div>
  <div class="detail-item">• 환자 동의 없이 제3자 공개 금지 (가족·고용주 포함)</div>
</div>
<div class="detail-section">
  <h3>예외 — 공익 우선</h3>
  <div class="detail-item">• <b>감염성 질환 신고 의무</b> (법정 감염병)</div>
  <div class="detail-item">• 타인에 즉각적 위험 우려 시 (자살·타살 위협)</div>
  <div class="detail-item">• 법원 명령</div>
</div>
<div class="detail-section">
  <h3>사례</h3>
  <div class="detail-item accent">감염성 질환 환자 격리는 <b>공중보건 보호</b> 목적이지만, 환자의 진단명·신원은 <b>제3자에 공개되지 않도록</b> 보호</div>
</div>
<div class="tip-box">💡 환자 안전 vs 공익이 충돌할 때 — 법적 신고 의무 우선, 그 외엔 환자 동의 필수</div>`,
      },
    ],
  },

  // ──────────── 손가락근력검사 ────────────
  finger: {
    file: '임상의사결정/htmlstudy/손가락근력검사.html',
    cards: [
      {
        afterMarker: `<div class="card" onclick="openDetail('ch1','dip_test')">`,
        afterCloseMarker: `</div>\n          </div>`,
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','pip_dip_overview')">
            <div class="card-body">
              <div class="card-title">PIP/DIP 관절 개론</div>
              <div class="card-sub">관절 구조 · 움직임 메커니즘 · 협동 vs 분리 굽힘</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
    ],
    details: [
      {
        key: 'pip_dip_overview',
        html: `<h2>PIP / DIP 관절 개론</h2>
<div class="detail-section">
  <h3>관절 구조</h3>
  <div class="detail-item"><b>PIP (Proximal Interphalangeal):</b> 첫째·둘째 손가락뼈 사이 — hinge joint</div>
  <div class="detail-item"><b>DIP (Distal Interphalangeal):</b> 둘째·셋째 손가락뼈 사이 — hinge joint</div>
  <div class="detail-item">움직임: 굽힘·폄 (1축)</div>
</div>
<div class="detail-section">
  <h3>굽힘 메커니즘</h3>
  <div class="detail-item">• <b>PIP 굽힘:</b> 얕은손가락굽힘근 (FDS, Flexor Digitorum Superficialis) 주작용</div>
  <div class="detail-item">• <b>DIP 굽힘:</b> 깊은손가락굽힘근 (FDP, Flexor Digitorum Profundus) 단독 작용</div>
  <div class="detail-item">• FDP는 PIP·DIP 모두 통과 — 두 관절 모두 작용</div>
</div>
<div class="detail-section">
  <h3>분리 검사 원리</h3>
  <div class="detail-item">• <b>PIP 검사 (FDS):</b> 다른 손가락 MCP·PIP·DIP 모두 신전 고정 → FDP 비활성화 → FDS만 PIP 굽힘</div>
  <div class="detail-item">• <b>DIP 검사 (FDP):</b> PIP를 신전 고정 → FDP만 DIP 굽힘 가능</div>
</div>
<div class="warn-box"><b>임상 의의:</b> 정중신경 손상 (CTS) → FDS·FDP 일부 약화 → PIP·DIP 굽힘 불완전</div>`,
      },
    ],
  },

  // ──────────── 엉덩관절근력검사 ────────────
  hip: {
    file: '임상의사결정/htmlstudy/엉덩관절근력검사.html',
    cards: [
      {
        afterMarker: `<div class="card" onclick="openDetail('ch1','hip_er_test')">`,
        afterCloseMarker: `</div>\n          </div>`,
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','hip_er_muscle')">
            <div class="card-body">
              <div class="card-title">엉덩관절 가쪽돌림근 해부</div>
              <div class="card-sub">궁둥구멍근 · 속·바깥폐쇄근 · 위·아래쌍둥이근 · 넙다리네모근</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
      {
        afterMarker: `<div class="card" onclick="openDetail('ch1','hip_ir_test')">`,
        afterCloseMarker: `</div>\n          </div>`,
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','hip_ir_muscle')">
            <div class="card-body">
              <div class="card-title">엉덩관절 안쪽돌림근 해부</div>
              <div class="card-sub">중간볼기근(앞섬유) · 작은볼기근 · 넙다리근막긴장근(TFL)</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
    ],
    details: [
      {
        key: 'hip_er_muscle',
        html: `<h2>엉덩관절 가쪽돌림근 (External Rotators)</h2>
<div class="detail-section">
  <h3>주작용근 — 깊은 6근육</h3>
  <table style="width:100%;font-size:12px;border-collapse:collapse;">
    <tr style="background:var(--bg3);"><th>근육</th><th>이는곳</th><th>닿는곳</th><th>신경</th></tr>
    <tr><td><b>궁둥구멍근</b><br>(Piriformis)</td><td>엉치뼈 앞면</td><td>큰돌기 위면</td><td>L5-S2</td></tr>
    <tr><td><b>속폐쇄근</b><br>(Obturator internus)</td><td>폐쇄막 안면</td><td>큰돌기 안면</td><td>L5-S2</td></tr>
    <tr><td><b>바깥폐쇄근</b><br>(Obturator externus)</td><td>폐쇄막 바깥면</td><td>돌기오목</td><td>L3-L4 (폐쇄신경)</td></tr>
    <tr><td><b>위쌍둥이근</b><br>(Gemellus superior)</td><td>궁둥뼈가시</td><td>큰돌기 안면</td><td>L5-S2</td></tr>
    <tr><td><b>아래쌍둥이근</b><br>(Gemellus inferior)</td><td>궁둥뼈결절</td><td>큰돌기 안면</td><td>L4-S1</td></tr>
    <tr><td><b>넙다리네모근</b><br>(Quadratus femoris)</td><td>궁둥뼈결절</td><td>돌기사이능선</td><td>L4-S1</td></tr>
  </table>
</div>
<div class="detail-section">
  <h3>보조 작용근</h3>
  <div class="detail-item">• 큰볼기근 (Gluteus maximus) — 엉덩관절 폄 + 가쪽돌림</div>
  <div class="detail-item">• 봉공근 (Sartorius) — 굽힘 + 가쪽돌림</div>
</div>
<div class="tip-box">💡 깊은 가쪽돌림 6근육 암기: "<b>피 · 폐(속·바깥) · 쌍(위·아래) · 사</b>" (피리포·폐쇄근2·쌍둥이근2·사각형근)</div>`,
      },
      {
        key: 'hip_ir_muscle',
        html: `<h2>엉덩관절 안쪽돌림근 (Internal Rotators)</h2>
<div class="detail-section">
  <h3>주작용근 — 단독 안쪽돌림 근육 없음 (보조 작용)</h3>
  <table style="width:100%;font-size:12px;border-collapse:collapse;">
    <tr style="background:var(--bg3);"><th>근육</th><th>이는곳</th><th>닿는곳</th><th>신경</th></tr>
    <tr><td><b>중간볼기근 앞섬유</b><br>(Glut. medius ant.)</td><td>엉덩뼈 가쪽면</td><td>큰돌기 가쪽</td><td>위볼기신경 L4-S1</td></tr>
    <tr><td><b>작은볼기근</b><br>(Glut. minimus)</td><td>엉덩뼈 가쪽면</td><td>큰돌기 앞면</td><td>위볼기신경 L4-S1</td></tr>
    <tr><td><b>넙다리근막긴장근</b><br>(TFL)</td><td>위앞엉덩뼈가시</td><td>엉덩정강근막띠 (ITB)</td><td>위볼기신경 L4-S1</td></tr>
  </table>
</div>
<div class="detail-section">
  <h3>특징</h3>
  <div class="detail-item">• 안쪽돌림은 <b>독립적 주근육이 없음</b> → 여러 근육의 보조 작용</div>
  <div class="detail-item">• 정상 ROM은 가쪽돌림(45°)보다 약간 작음 (40°)</div>
  <div class="detail-item">• 굽힘 자세에서 가장 강한 안쪽돌림 가능</div>
</div>
<div class="warn-box"><b>임상:</b> 안쪽돌림 약화 → 보행 시 발끝 가쪽 향함 (toe-out gait)</div>`,
      },
    ],
  },

  // ──────────── 손목굴증후군 ────────────
  cts: {
    file: '임상의사결정/htmlstudy/손목굴증후군.html',
    cards: [
      {
        afterMarker: `<div class="card" onclick="openDetail('ch1','phalen')">`,
        afterCloseMarker: `</div>\n          </div>`,
        cardHtml: `
          <div class="card" onclick="openDetail('ch1','pain_assessment')">
            <div class="card-body">
              <div class="card-title">통증 평가 상세</div>
              <div class="card-sub">VAS · 위치 · 유발자세 · 야간 각성 빈도</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`,
      },
    ],
    details: [
      {
        key: 'pain_assessment',
        html: `<h2>통증 평가 상세 (CTS)</h2>
<div class="detail-section">
  <h3>VAS (Visual Analogue Scale)</h3>
  <div class="detail-item">• 0 (통증 없음) ~ 10 (상상 가능 최악)</div>
  <div class="detail-item">• 평상시 / 야간 / 활동 시 분리 측정</div>
  <div class="detail-item">• 치료 전·후 비교로 효과 평가</div>
</div>
<div class="detail-section">
  <h3>통증 위치</h3>
  <div class="detail-item">• <b>손바닥쪽:</b> 정중신경 분포 영역 (엄지·검지·중지·반쪽 약지)</div>
  <div class="detail-item">• <b>손등쪽:</b> 손가락 끝 마디 (정중신경 등쪽 분지)</div>
  <div class="detail-item">• 새끼손가락은 자신경 영역 — 영향 없음 (감별 진단 핵심)</div>
</div>
<div class="detail-section">
  <h3>유발 자세 (Provocative)</h3>
  <div class="detail-item">• 손목 굽힘 자세 유지 (전화 받기·운전·자전거)</div>
  <div class="detail-item">• 반복적 손가락 굽힘 (타이핑·재봉)</div>
  <div class="detail-item">• 야간 손목 굽힘 자세로 인한 각성 → 손 흔들면 완화 (Flick sign)</div>
</div>
<div class="detail-section">
  <h3>완화 자세</h3>
  <div class="detail-item">• 손목 중립위 유지</div>
  <div class="detail-item">• 손 흔들기 (shaking)</div>
  <div class="detail-item">• 야간 부목 착용</div>
</div>
<div class="tip-box">💡 <b>야간 각성 빈도</b>는 CTS 중증도 지표 — 주 3회 이상 = 중등도 이상</div>`,
      },
    ],
  },
};

// ─── 디테일 키 주입 ──────────────────────────────────────────────────────
function findAllDetailDataEnd(content) {
  // allDetailData['ch1'] = { ... } 의 닫는 } 위치 찾기
  const m = /allDetailData\s*\[\s*['"]ch1['"]\s*\]\s*=\s*\{/.exec(content);
  if (!m) throw new Error("allDetailData['ch1'] not found");
  const braceStart = content.indexOf('{', m.index + m[0].length - 1);
  let depth = 0, inStr = false, strCh = '', endBrace = -1;
  for (let i = braceStart; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
    } else {
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
    }
  }
  if (endBrace === -1) throw new Error('allDetailData closing brace not found');
  return endBrace;
}

function escapeBacktick(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function injectDetails(content, details) {
  const endBrace = findAllDetailDataEnd(content);
  // endBrace 직전에 콤마 + 새 키들 삽입
  const before = content.substring(0, endBrace);
  const after = content.substring(endBrace);
  // 마지막 키 뒤 콤마 보장
  const trimmedBefore = before.replace(/,?\s*$/, '');
  const newEntries = details.map(d =>
    `,\n  ${d.key}: \`${escapeBacktick(d.html)}\``
  ).join('');
  return trimmedBefore + newEntries + '\n' + after;
}

// ─── 카드 주입 ──────────────────────────────────────────────────────────
function injectCards(content, cards) {
  let result = content;
  for (const c of cards) {
    // afterMarker 뒤로 진행하다가 그 카드 블록의 닫는 </div></div> 쌍을 찾아 그 뒤에 삽입
    const idx = result.indexOf(c.afterMarker);
    if (idx === -1) {
      console.warn(`  [WARN] 마커 못 찾음: ${c.afterMarker.substring(0, 60)}...`);
      continue;
    }
    // 카드 블록은 보통 다음 패턴: <div class="card" onclick="...">...</div>...<button class="expand-btn">↗</button>\n          </div>
    // 닫는 </div>의 위치를 찾기 위해 brace-depth 사용 — 여기서는 div depth
    const startBlock = idx;
    let depth = 0, i = startBlock, endIdx = -1;
    // 시작 카드 div 찾기
    while (i < result.length) {
      // div 열기 / 닫기 추적 (단순)
      const openMatch = result.substring(i, i + 5);
      const closeMatch = result.substring(i, i + 6);
      if (openMatch === '<div ' || openMatch === '<div>') {
        depth++;
        i += 4;
      } else if (closeMatch === '</div>') {
        depth--;
        i += 6;
        if (depth === 0) { endIdx = i; break; }
      } else {
        i++;
      }
    }
    if (endIdx === -1) {
      console.warn(`  [WARN] 카드 블록 끝 못 찾음`);
      continue;
    }
    result = result.substring(0, endIdx) + c.cardHtml + result.substring(endIdx);
  }
  return result;
}

// ─── 메인 ────────────────────────────────────────────────────────────────
function processFile(key) {
  const aug = augmentations[key];
  if (!aug) { console.error('알 수 없는 키:', key); return; }
  const filePath = path.join(ROOT, aug.file);
  if (!fs.existsSync(filePath)) { console.error('파일 없음:', filePath); return; }

  console.log(`\n[${key}] ${path.basename(aug.file)}`);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalSize = content.length;

  // 추가 백업 (slide 주입 후 상태)
  const bak2 = filePath + '.preaug';
  if (!fs.existsSync(bak2)) fs.writeFileSync(bak2, content);

  if (aug.cards) {
    console.log(`  카드 ${aug.cards.length}개 주입...`);
    content = injectCards(content, aug.cards);
  }
  if (aug.details) {
    console.log(`  디테일 ${aug.details.length}개 주입...`);
    content = injectDetails(content, aug.details);
  }

  fs.writeFileSync(filePath, content);
  const delta = content.length - originalSize;
  console.log(`  완료 (+${delta} bytes)`);
}

function main() {
  const target = process.argv[2];
  const keys = target ? [target] : Object.keys(augmentations);
  for (const k of keys) processFile(k);
  console.log('\n전체 완료');
}

if (require.main === module) main();
