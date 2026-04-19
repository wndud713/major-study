#!/usr/bin/env node
// Fix 임상의사결정개론.html exam tab:
// 1) Replace tab6 inline exam-question-block divs with clickable openDetail cards
// 2) Remove redundant q-cards from tab4 (they belong in tab6)
// 3) Add allDetailData entries for all newly-keyed questions
// 4) Add missing Nagi 장애과정 and 6단계 검진 questions

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', '임상의사결정', 'htmlstudy', '임상의사결정개론.html');

// ═══════════════════════════════════════════════════════════
//  QUESTION DEFINITIONS
// ═══════════════════════════════════════════════════════════
// New keys introduced by this fix (for tab6's 12 inline + 2 missing)
const NEW_QUESTIONS = [
  {
    key: 'q2024_101', label: '2024 국가고시 101번 — SOAP 객관적 정보',
    sub: 'HOAC II 정량적 결과(VAS 6, LEFS 26점) SOAP 단락은?',
    question: '물리치료사는 가설지향알고리즘 II 절차에 따라 다음의 정량적 결과를 수집하였다. SOAP 노트의 어느 단락에 기록해야 하는가? — 오른쪽 다리 VAS 6 / 다리기능척도(LEFS) 26점',
    choices: ['예후', '치료계획', '주관적 정보', '객관적 정보', '문제목록 작성'],
    answer: 4, explain: 'VAS·LEFS 등 치료사가 측정한 정량적 수치 = Objective(객관적 정보).'
  },
  {
    key: 'q2024_96', label: '2024 국가고시 96번 — EBPT PICO 임상질문 작성',
    sub: '최적의 중재법 선택을 위해 PICO 형태로 구체화하는 단계?',
    question: '최적의 중재법을 선택하기 위하여 근거중심물리치료를 수행할 때 물리치료사의 의사결정이 필요한 내용을 PICO(P:환자, I:중재법, C:비교, O:결과) 형태로 구체화하고 조직화 하는 단계는?',
    choices: ['근거검색', '근거선택', '임상적용', '치료결과 평가', '임상질문 작성'],
    answer: 5, explain: 'PICO 형태로 질문을 구체화하는 단계 = EBPT 1단계 임상질문 작성.'
  },
  {
    key: 'q2024_icf_participation', label: '2024 국가고시 — ICF 참여(Participation)',
    sub: 'ICF 구성요소 중 개개인의 사회적 역할을 의미하는 용어?',
    question: '국제기능·장애·건강분류(ICF)를 구성하는 건강요소 중에서 개개인의 사회적 역할을 의미하는 용어는?',
    choices: ['활동', '참여', '건강상태', '환경요인', '개인요인'],
    answer: 2, explain: '사회적 역할 수행 = Participation(참여). 활동은 개인의 일상행위 수행.'
  },
  {
    key: 'q2024_100', label: '2024 국가고시 100번 — 환자/고객관리모델 검진',
    sub: '측정항목 결정 단계 (어깨통증·옷입기·배드민턴 동호회)',
    question: '환자/고객관리 모델에서 다음과 같은 정보를 바탕으로 측정항목을 결정하는 단계는? — 가슴 앞을 가로질러 오른팔을 뻗을 때 어깨 통증 / 팔을 위로 들어 옷 입고 벗기 어려움 / 배드민턴 동호회 활동 못함',
    choices: ['검진', '평가', '중재', '예후', '물리치료 진단'],
    answer: 1, explain: '주관적 호소를 수집하여 측정항목을 결정하는 단계 = 검진(Examination).'
  },
  {
    key: 'q2025_100', label: '2025 국가고시 100번 — 임상의사결정 평가',
    sub: '수집한 자료를 임상적 해석·판단하여 기능적 문제 식별',
    question: '임상의사 결정에서 수집한 자료에 대한 임상적 해석과 판단을 하는 과정으로 환자의 기능적 문제를 식별하여 인식하는 단계는?',
    choices: ['검진', '평가', '진단', '예후', '결과'],
    answer: 2, explain: '검진으로 수집한 자료를 임상적으로 해석·판단 = 평가(Evaluation).'
  },
  {
    key: 'q2025_101', label: '2025 국가고시 101번 — HOAC II 중재전략수립',
    sub: '적용할 중재법 결정 + 기간·강도·횟수 구체화 단계',
    question: '적용할 중재법을 결정하고 치료의 기간, 강도, 횟수 등을 구체적으로 정하는 가설지향 알고리즘 II의 단계는?',
    choices: ['목표수립', '예측기준수립', '검사전략수립', '중재전략수립', '가설검증 기준수립'],
    answer: 4, explain: '중재법·기간·강도·횟수 구체화 = HOAC II 중재전략수립.'
  },
  {
    key: 'q2025_99', label: '2025 국가고시 99번 — EBPT 수행평가',
    sub: '자기성찰·근거활용 점검·예후 판단 단계',
    question: '다음 근거중심 물리치료 절차는? — 치료의 질 향상을 위한 자기성찰 / 최선의 근거를 활용했는지 점검 / 중재 후 환자의 예후를 판단하고 향후 중재방법 보강',
    choices: ['임상질문 작성', '근거찾기', '근거평가', '임상적용', '치료에 대한 수행평가'],
    answer: 5, explain: '자기성찰·근거활용 점검·중재방법 보강 = EBPT 5단계 수행평가.'
  },
  {
    key: 'q2025_102', label: '2025 국가고시 102번 — SOAP 주관적 정보',
    sub: '외과적 치료방법·복용약물·환자 목표 단락은?',
    question: '15세 남자가 목말밑 관절의 아탈구로 석고고정을 하고 물리치료실을 방문하였다. 환자에게 다음 정보를 수집하였을 때 SOAP 노트의 단락은? — 손상부위의 외과적 치료방법, 합병증 유무 / 복용약물 / 환자의 목표',
    choices: ['평가', '진단', '치료계획', '주관적 정보', '객관적 정보'],
    answer: 4, explain: '환자가 보고한 병력·복용약물·목표 = 주관적 정보(Subjective).'
  },
  {
    key: 'q2024_102', label: '2024 국가고시 102번 — 환자 개인정보 보호',
    sub: '감염 격리 환자 정보 요청 시 대응',
    question: '뇌졸중으로 운동치료를 받던 A 환자가 병원균에 감염되어 격리치료를 받게 되었다. 물리치료사와 친분이 있는 B 환자가 A 환자의 격리치료 사유를 물어볼 때 대응방법으로 옳은 것은?',
    choices: ['물리치료실 책임자와 상의하여 알려준다', '담당간호사에게 알아보라고 한다', '자세하게 알려주고 주의시킨다', '사유를 알려주고 혼자만 알라고 한다', '개인 정보이므로 알려 줄 수 없음을 설명한다'],
    answer: 5, explain: '환자 정보는 본인 동의 없이 타인에게 제공 불가 — 개인정보 보호 원칙.'
  },
  {
    key: 'q2024_97', label: '2024 국가고시 97번 — 단일 사례연구',
    sub: '한 명/한 집단 중재 반응 확인 연구형태',
    question: '한 명의 대상자 또는 동일한 특성으로 묶인 한 집단을 대상으로 중재에 대하여 어떤 반응을 보이는지 알아보기 위한 연구형태는?',
    choices: ['메타분석', '단면연구', '체계적 고찰', '단일 사례연구', '무작위대조연구'],
    answer: 4, explain: '한 명 또는 한 집단 대상 중재 반응 = 단일 사례연구(Single case study).'
  },
  {
    key: 'q_nagi_lighting', label: 'Nagi — 조명기술자 사례 (기능적 제한)',
    sub: '40대 조명기술자, 어깨통증으로 팔 올림 어려움',
    question: '40대 박모씨는 실내 인테리어 일을 하는 조명 기술자로 15년 간 종사. 최근 작업 중 어깨 위에 통증, 팔을 머리 위로 들어 올릴 때 힘이 없어 완전한 올림이 어렵고 어깨를 움츠리게 됨. Nagi 모델에서 어느 단계?',
    choices: ['병리학(pathology)', '손상(impairment)', '장애(disability)', '기능적 제한(functional limitation)', '핸디캡(handicap)'],
    answer: 4, explain: '팔 올림·조명기술 직무 수행 곤란 = 개인 수준 기능제한(Functional limitation). 핸디캡은 사회적 역할 제한.'
  },
  {
    key: 'q_nagi_stairs', label: 'Nagi 장애과정 — 계단 오르내리기 (기능제한)',
    sub: '30세 여자, 독립보행·계단에서 시간 많이 소요',
    question: '30세 여자가 독립적인 보행에 어려움을 호소한다. 특히 계단 오르내리기와 같은 동작에서 시간이 많이 소요되고 잘 수행하지 못한다. Nagi 모델 장애과정 중 어떤 단계에 해당하는가?',
    choices: ['질병(disease)', '손상(impairment)', '사회적 불리(handicap)', '장애(disability)', '기능제한(functional limitation)'],
    answer: 5, explain: '서기·걷기·계단 오르기 등 개인 수행 수준 제한 = 기능제한(Functional limitation).'
  },
  {
    key: 'q_nagi_frozen', label: 'Nagi — 굳은 어깨 ROM 제한 (손상)',
    sub: 'Frozen shoulder 관절가동범위 제한 해당 용어',
    question: '굳은 어깨(frozen shoulder)로 진단받은 환자의 어깨 관절을 검사한 결과 제한된 관절가동범위를 확인할 수 있었다. 다음 중 이에 해당하는 용어로 옳은 것은?',
    choices: ['질환(disease)', '장애(disability)', '손상(impairments)', '활동 제한(activity limitations)', '참여제한(participation restrictions)'],
    answer: 3, explain: '해부학적·생리학적 기능 이상(ROM 제한) = 손상(Impairment). 기관 수준.'
  },
  {
    key: 'q_nagi_headinjury', label: 'Nagi — 머리손상 목욕·옷입기 (장애)',
    sub: '머리손상 40세, 목욕·옷 입기 곤란',
    question: '머리손상을 받은 40세 남자가 독립적으로 목욕을 하고 옷을 입는데 시간이 많이 걸리고 어려움이 있다면 어떤 상태에 해당하는가? Nagi model',
    choices: ['질병(disease)', '손상(impairment)', '핸디캡(handicap)', '장애(disability)', '기능적 제한(functional limitation)'],
    answer: 4, explain: 'Nagi 모델에서 일상생활 자립 수행 제한(목욕·옷입기) = 장애(Disability). 사회적으로 정해진 역할(자립) 수행 제한.'
  },
  {
    key: 'q_hoac_perceived', label: 'HOAC II — 환자가 인식한 문제 (2단계)',
    sub: '화장실·등산·공장 운영 어려움 호소',
    question: '환자는 "밤에 화장실을 혼자 다니기 어렵다", "등산이 취미인데 친구들과 등산을 갈 수 없다", "공장을 운영하는데 어려움이 많다"라고 본인이 느끼고 있다. HOAC II 단계는?',
    choices: ['1단계: 초기데이터 수집', '2단계: 환자가 인식한 문제리스트 작성', '5단계: 환자가 인식하지 못한 문제점 추가', '6단계: 가설수립/예방적 중재 근거제시', '7단계: 문제리스트 구체화'],
    answer: 2, explain: '환자 본인이 인식·호소하는 문제를 수집 = HOAC II 2단계 환자 인식 문제리스트 작성.'
  },
  {
    key: 'q_cdm6_dynamic', label: '임상의사결정 6단계 — 동적 판단 과정 (평가)',
    sub: '검진 자료를 임상적으로 판단하는 동적 과정',
    question: '다음의 내용은 임상의사결정 6단계 중 어느 단계에 해당되는가? — 검진으로 수집된 자료를 임상적으로 판단하는 동적 과정',
    choices: ['검진', '평가', '진단', '치료계획 및 예후', '중재'],
    answer: 2, explain: '검진 자료를 임상적으로 해석·판단하는 동적 과정 = 평가(Evaluation) 단계. 2025 100번과 동일 개념.'
  },
];

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
const CIRCLED = ['①','②','③','④','⑤'];

function buildCardHtml(q) {
  const sub = q.sub || q.question.slice(0, 80) + '…';
  return `          <div class="card" onclick="openDetail('ch1','${q.key}')">
            <div class="card-body">
              <div class="card-title">${q.label}</div>
              <div class="card-sub">${escapeHtml(sub)}</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`;
}

function buildDetailEntry(q) {
  const choicesHtml = q.choices.map((c, i) => {
    const n = i + 1;
    const cls = (n === q.answer) ? 'green' : 'red';
    const mark = (n === q.answer) ? ' <b>→ 정답 ✓</b>' : '';
    return `  <div class="detail-item ${cls}">${CIRCLED[i]} ${escapeHtml(c)}${mark}</div>`;
  }).join('\n');
  return `  ${q.key}: \`<h2>${escapeHtml(q.label)}</h2>
<div class="detail-section">
  <div class="detail-item accent"><b>문제:</b> ${escapeHtml(q.question)}</div>
</div>
<div class="detail-section">
  <h3>선택지 분석</h3>
${choicesHtml}
</div>
<div class="tip-box">💡 <b>해설:</b> ${escapeHtml(q.explain)}</div>\``;
}

function escapeHtml(s) {
  return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════
let html = fs.readFileSync(FILE, 'utf8');
const origLen = html.length;

// STEP 1: Remove the 13 q-cards from tab4.
// They start at the first `<hr class="q-divider">` AFTER 'databases' card.
// They span from that hr up to the closing `</div>` before `<!-- 탭5: 문서화 -->`.
{
  const databasesIdx = html.indexOf("openDetail('ch1','databases')");
  if (databasesIdx === -1) throw new Error('databases card not found');
  // find the first hr class="q-divider" after databasesIdx
  const hrIdx = html.indexOf('<hr class="q-divider">', databasesIdx);
  if (hrIdx === -1) throw new Error('q-divider hr not found');
  // find closing of tab4: look for '<!-- 탭5:' comment
  const tab5Idx = html.indexOf('<!-- 탭5:', hrIdx);
  if (tab5Idx === -1) throw new Error('tab5 start not found');
  // back up to find the </div> before tab5Idx that closes tab4
  const tab4Close = html.lastIndexOf('</div>', tab5Idx);
  if (tab4Close === -1) throw new Error('tab4 closing div not found');

  // Delete from hrIdx up to (but not including) tab4Close. But must preserve the </div> before it.
  // The cards end with `          </div>\n` for the last card; we want to cut the 13-cards block ending
  // right before the final `        </div>` that closes the tab4 container.
  // Find last `</div>` that is on its own line and has ≤8 spaces indent before tab5Idx.
  // Simpler: cut everything from hrIdx to the closing div of tab4 (tab4Close), then re-emit the closing div.
  const before = html.slice(0, hrIdx);
  const after = html.slice(tab4Close);
  html = before + '        ' + after.trimStart();
  console.log(`[1] Removed tab4 q-cards: ${(origLen - html.length)} bytes`);
}

// STEP 2: Replace tab6 content. Find tab6 body and rewrite entirely.
{
  const tab6Marker = '<!-- 탭6: 국시문제 -->';
  const i = html.indexOf(tab6Marker);
  if (i === -1) throw new Error('tab6 marker not found');
  // Find the opening div and its end
  const tab6Open = html.indexOf('<div class="tab-content" id="ch1-tab-tab6">', i);
  if (tab6Open === -1) throw new Error('tab6 open not found');
  // Find '</div><!-- /tab6 -->'
  const tab6End = html.indexOf('</div><!-- /tab6 -->', tab6Open);
  if (tab6End === -1) throw new Error('tab6 close marker not found');

  // Build new tab6 body
  // Keep the 2 summary cards (exam_answers, exam_answer_nums), then sections by year
  const existingKeys = [
    // 2019
    'q2019_95','q2019_96','q2019_97','q2019_98','q2019_101','q2019_102',
    // 2021
    'q2021_97','q2021_98','q2021_101',
    // 2022
    'q2022_65','q2022_98','q2022_99','q2022_101',
  ];
  const existingLabels = {
    q2019_101: '2019 국가고시 101번 — EBPT 4단계 임상적용',
    q2019_98:  '2019 국가고시 98번 — SOAP 객관적 정보',
    q2019_97:  '2019 국가고시 97번 — ICF 활동제한',
    q2019_96:  '2019 국가고시 96번 — 치료 계획 및 예후',
    q2019_95:  '2019 국가고시 95번 — 임상추론 의사결정',
    q2019_102: '2019 국가고시 102번 — C5 척수손상 가로막 강화',
    q2021_97:  '2021 국가고시 97번 — 메타분석',
    q2021_98:  '2021 국가고시 98번 — HOAC II 가설 수립',
    q2021_101: '2021 국가고시 101번 — 환자관리모델 결과',
    q2022_65:  '2022 국가고시 65번 — ICF 신체구조·기능',
    q2022_98:  '2022 국가고시 98번 — 임상추론 의사결정',
    q2022_99:  '2022 국가고시 99번 — HOAC II 9단계 가설검증',
    q2022_101: '2022 국가고시 101번 — SOAP 객관적 정보',
  };
  const existingSubs = {
    q2019_101: 'EBPT 수행과정 단계는? (근거+경험+환자가치+교육)',
    q2019_98:  'ROM·MMT·BBS 측정값이 해당하는 SOAP 단락?',
    q2019_97:  'ICF 활동제한(activity limitation)에 해당?',
    q2019_96:  '장·단기 목표, 중재 기간, 종결 기준 단계?',
    q2019_95:  '가설 유지·기각, 치료방법 변경 임상추론 과정?',
    q2019_102: 'C5 완전척수손상 가정방문 물리치료?',
    q2021_97:  '20개 논문, 효과크기·forest plot 분석 연구방법?',
    q2021_98:  'HOAC II — \"~때문일 것이다\" 추론 단계?',
    q2021_101: 'L4 척수손상 ASIA C→D, AFO 제거 단계?',
    q2022_65:  '뇌졸중 근력·근긴장·통증·ROM — ICF 구성요소?',
    q2022_98:  '인식 전환·치료방법 변경·가설 유지폐지 단계?',
    q2022_99:  '가설 참/거짓 측정변수로 검증 HOAC II 단계?',
    q2022_101: 'ROM·MMT·BBS 측정값 SOAP 단락?',
  };

  function existingCard(key) {
    return `          <div class="card" onclick="openDetail('ch1','${key}')">
            <div class="card-body">
              <div class="card-title">${existingLabels[key]}</div>
              <div class="card-sub">${existingSubs[key]}</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>`;
  }

  const byKey = Object.fromEntries(NEW_QUESTIONS.map(q => [q.key, q]));
  const pieces = [];
  pieces.push(`        <!-- 탭6: 국시문제 -->
        <div class="tab-content" id="ch1-tab-tab6">
          <div class="section-title">국가고시 기출문제</div>

          <div class="card" onclick="openDetail('ch1','exam_answers')" style="background:linear-gradient(135deg,rgba(56,189,248,0.12),rgba(167,139,250,0.12));border:1.5px solid var(--ch-accent);">
            <div class="card-body">
              <div class="card-title">🎯 국시문제 답 모음</div>
              <div class="card-sub">전체 문항 정답+핵심 해설 한눈에 보기</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="card" onclick="openDetail('ch1','exam_answer_nums')" style="background:linear-gradient(135deg,rgba(52,211,153,0.12),rgba(79,209,197,0.12));border:1.5px solid var(--ch-accent);margin-top:10px;">
            <div class="card-body">
              <div class="card-title">🔢 정답 번호만 보기</div>
              <div class="card-sub">연도별·문제번호별 정답(①~⑤)만 간단히</div>
            </div>
            <button class="expand-btn">↗</button>
          </div>

          <div class="section-title" style="margin-top:18px;">2019 국가고시</div>
`);
  for (const k of ['q2019_95','q2019_96','q2019_97','q2019_98','q2019_101','q2019_102']) {
    pieces.push(existingCard(k));
  }
  pieces.push(`          <div class="section-title" style="margin-top:16px;">2021 국가고시</div>
`);
  for (const k of ['q2021_97','q2021_98','q2021_101']) pieces.push(existingCard(k));
  pieces.push(`          <div class="section-title" style="margin-top:16px;">2022 국가고시</div>
`);
  for (const k of ['q2022_65','q2022_98','q2022_99','q2022_101']) pieces.push(existingCard(k));
  pieces.push(`          <div class="section-title" style="margin-top:16px;">2024 국가고시</div>
`);
  for (const k of ['q2024_96','q2024_97','q2024_100','q2024_101','q2024_102','q2024_icf_participation']) {
    pieces.push(buildCardHtml(byKey[k]));
  }
  pieces.push(`          <div class="section-title" style="margin-top:16px;">2025 국가고시</div>
`);
  for (const k of ['q2025_99','q2025_100','q2025_101','q2025_102']) {
    pieces.push(buildCardHtml(byKey[k]));
  }
  pieces.push(`          <div class="section-title" style="margin-top:16px;">개념 문제 (Nagi / HOAC II / 6단계)</div>
`);
  for (const k of ['q_nagi_lighting','q_nagi_stairs','q_nagi_frozen','q_nagi_headinjury','q_hoac_perceived','q_cdm6_dynamic']) {
    pieces.push(buildCardHtml(byKey[k]));
  }
  pieces.push(`        `);

  const newTab6 = pieces.join('\n\n');
  html = html.slice(0, i) + newTab6 + html.slice(tab6End);
  console.log(`[2] Rewrote tab6 content`);
}

// STEP 3: Inject new detail entries into allDetailData['ch1'].
// Find closing `}` of the object (brace-depth parser).
{
  const m = /allDetailData\['ch1'\]\s*=\s*\{/.exec(html);
  if (!m) throw new Error('allDetailData[ch1] init not found');
  const braceStart = m.index + m[0].length - 1;
  let depth = 0, inStr = false, strCh = '', inTick = false, inTickBS = false;
  let endBrace = -1;
  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (inTick) {
      if (inTickBS) { inTickBS = false; continue; }
      if (ch === '\\') { inTickBS = true; continue; }
      if (ch === '`') { inTick = false; continue; }
      continue;
    }
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === '`') { inTick = true; continue; }
    if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { endBrace = i; break; }
    }
  }
  if (endBrace === -1) throw new Error('closing brace of allDetailData[ch1] not found');

  // Build new entries (only those whose key doesn't already exist)
  const alreadyHas = /(^|[{,\s])(q\w+|[a-z_][a-z0-9_]*)\s*:\s*`/g;
  const existing = new Set();
  const block = html.slice(m.index, endBrace + 1);
  let mm;
  // simpler: detect keys at line starts
  const lines = block.split('\n');
  for (const line of lines) {
    const km = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*`/.exec(line);
    if (km) existing.add(km[1]);
  }
  const toAdd = NEW_QUESTIONS.filter(q => !existing.has(q.key));
  console.log(`[3] Existing data keys: ${existing.size}; to add: ${toAdd.length}`);

  if (toAdd.length) {
    const additions = toAdd.map(buildDetailEntry).join(',\n');
    // Insert before closing brace, making sure prior last entry has trailing comma
    const before = html.slice(0, endBrace);
    const after = html.slice(endBrace);
    // Find last non-whitespace char before endBrace
    let k = before.length - 1;
    while (k >= 0 && /\s/.test(before[k])) k--;
    const lastCh = before[k];
    const sep = (lastCh === ',' || lastCh === '{') ? '\n' : ',\n';
    html = before + sep + additions + '\n' + after;
  }
}

// STEP 4: Write
fs.writeFileSync(FILE, html, 'utf8');
console.log(`[OK] Wrote ${FILE}  (${origLen} → ${html.length} bytes)`);
