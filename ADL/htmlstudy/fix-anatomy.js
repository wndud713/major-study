'use strict';
// Convert old Korean anatomy terms → new (대한해부학회 새용어) in HTML1
// Aids tab Korean addition handled separately
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '기능훈련1_ADL개론.html');
let html = fs.readFileSync(FILE, 'utf8');

// Map: old → new (apply in order; longer keys first to avoid partial collisions)
const repl = [
  // joints
  ['엉덩관절(hip)', 'XXENTITYXX-HIP'],   // sentinel for already-correct
  ['고관절치환술', '엉덩관절치환술'],
  ['고관절', '엉덩관절'],
  ['슬관절', '무릎관절'],
  ['주관절', '팔꿉관절'],
  ['견관절', '어깨관절'],
  ['족관절', '발목관절'],
  // muscles (compound — must precede bare 대퇴 rule to avoid partial collision)
  ['대퇴사두근', '넙다리네갈래근'],
  ['대퇴이두근', '넙다리두갈래근'],
  ['비복근', '장딴지근'],
  // bones / regions
  ['대퇴골', '넙다리뼈'],
  ['대퇴', '넙다리'],
  ['전완', '아래팔'],
  ['상완', '위팔'],
  ['상박', '위팔'],
  ['요골', '노뼈'],
  ['척골', '자뼈'],
  ['경골', '정강뼈'],
  ['비골', '종아리뼈'],
  ['쇄골', '빗장뼈'],
  ['견갑골', '어깨뼈'],
  ['견갑', '어깨'],
  ['족근', '발목뼈'],
  ['수근', '손목뼈'],
  ['족지', '발가락'],
  ['수지', '손가락'],
  // movements (only standalone, not in compound words like 굴곡근)
  // Use word-boundary approximation via context check
  // restore sentinel
  ['XXENTITYXX-HIP', '엉덩관절(hip)'],
];

for (const [from, to] of repl) {
  const before = html.split(from).length - 1;
  if (before > 0) {
    html = html.split(from).join(to);
    console.log(`  ${from} → ${to}: ${before}건`);
  }
}

fs.writeFileSync(FILE, html);
console.log('OK. Size:', fs.statSync(FILE).size);
