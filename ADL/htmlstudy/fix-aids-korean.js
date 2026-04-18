'use strict';
// Add Korean translations to aid English terms in HTML1
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '기능훈련1_ADL개론.html');
let html = fs.readFileSync(FILE, 'utf8');

// English term → Korean (avoid double-add by checking presence of next char)
// Most terms appear in <b>Term</b> form in tables and bullets
const map = [
  ['Built-up handle 숟가락·포크', 'Built-up handle (굵은 손잡이) 숟가락·포크'],
  ['Built-up handle 숟가락', 'Built-up handle (굵은 손잡이) 숟가락'],
  ['Built-up handle', 'Built-up handle (굵은 손잡이)'],
  ['Plate guard', 'Plate guard (접시 가드)'],
  ['Rocker knife', 'Rocker knife (락커 나이프)'],
  ['Suction cup', 'Suction cup (흡착컵)'],
  ['Universal cuff', 'Universal cuff (유니버설 커프)'],
  ['Long handle sponge', 'Long handle sponge (긴 손잡이 스펀지)'],
  ['Wash mitt', 'Wash mitt (장갑형 수건)'],
  ['Long straw', 'Long straw (긴 빨대)'],
  ['Cup with handle', 'Cup with handle (손잡이 컵)'],
  ['Hair brush with extension', 'Hair brush with extension (긴 빗)'],
  ['Dressing stick', 'Dressing stick (옷 입기 스틱)'],
  ['Button hook', 'Button hook (단추 끼우기 도구)'],
  ['Reacher', 'Reacher (집게형 도구)'],
  ['Sock aid', 'Sock aid (양말 신기 도구)'],
  ['Long handle shoehorn', 'Long handle shoehorn (긴 구두주걱)'],
  ['Velcro fastener', 'Velcro fastener (벨크로 잠금장치)'],
  ['Elastic shoelace', 'Elastic shoelace (탄성 신발끈)'],
  ['Zipper pull', 'Zipper pull (지퍼 보조)'],
  ['Bedside commode', 'Bedside commode (침상용 변기)'],
  ['Raised toilet seat', 'Raised toilet seat (높이 변기 시트)'],
  ['Grab bar', 'Grab bar (안전 손잡이)'],
  ['Commode', 'Commode (이동식 변기)'],
  ['Bidet', 'Bidet (비데)'],
  ['Tub bench', 'Tub bench (욕조 의자)'],
  ['Shower chair', 'Shower chair (샤워 의자)'],
  ['Hand-held shower', 'Hand-held shower (이동식 샤워기)'],
  ['Non-slip mat', 'Non-slip mat (미끄럼 방지 매트)'],
  ['Sliding board (Transfer board)', 'Sliding board / Transfer board (이동판)'],
  ['Transfer belt (Gait belt)', 'Transfer belt / Gait belt (이동 벨트)'],
  ['AAC (Augmentative and Alternative Communication)', 'AAC (보완대체의사소통, Augmentative and Alternative Communication)'],
  ['ECS (Environmental Control System)', 'ECS (환경제어시스템, Environmental Control System)'],
  ['Hoyer lift (기계식 리프트)', 'Hoyer lift (호이어 리프트, 기계식)'],
  ['communication board', 'Communication board (의사소통판)'],
  ['Communication board', 'Communication board (의사소통판)'],
  // Note: skip already-Korean (Walker, Crutches, Cane, Wheelchair, Hoyer lift)
];

// Apply only first instance per term per match cycle? — using split-join replaces all
// To avoid double-add (e.g., "Reacher" appearing many times), we do safe replace_all
// but since Korean text is now appended, second pass with same key will skip-noop
// (the key "Reacher" exists in "Reacher (집게형 도구)" — would re-replace!)
// FIX: use a sentinel for done items

let total = 0;
for (const [from, to] of map) {
  // Skip if `to` already exists (idempotency)
  if (html.indexOf(to) !== -1 && from === to.substring(0, from.length) && to.indexOf('(') !== -1) {
    // partial match scenario — we still need to replace any remaining bare instances
    // but only those NOT already followed by " ("
  }
  // Replace only `from` instances NOT already followed by " (" on the same line
  // Use regex: `from(?! \()`
  const re = new RegExp(escapeReg(from) + '(?!\\s*\\()', 'g');
  const before = (html.match(re) || []).length;
  if (before > 0) {
    html = html.replace(re, to);
    console.log(`  ${from} → ${to}: ${before}건`);
    total += before;
  }
}

function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

fs.writeFileSync(FILE, html);
console.log(`\n총 ${total}건 변환. 새 크기:`, fs.statSync(FILE).size);
