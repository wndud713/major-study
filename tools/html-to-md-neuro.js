// 신경계질환별물리치료 3개 재변환 파일 → Markdown 텍스트 추출
// 대상: 파킨슨병, 외상성뇌손상_TBI, SOAP_note_TBI
// 출력: _study_md/신경계질환별물리치료/*.md

const fs = require('fs');
const path = require('path');

const FILES = [
  { src: '신경계질환별물리치료(이제혁)/파킨슨병.html', dst: '_study_md/신경계질환별물리치료/파킨슨병.md', title: '파킨슨병 (Parkinson disease)' },
  { src: '신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html', dst: '_study_md/신경계질환별물리치료/외상성뇌손상_TBI.md', title: '외상성뇌손상 (TBI)' },
  { src: '신경계질환별물리치료(이제혁)/SOAP_note_TBI.html', dst: '_study_md/신경계질환별물리치료/SOAP_note_TBI.md', title: 'SOAP note (TBI)' },
];

const ROOT = path.resolve(__dirname, '..');

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<(th|td)[^>]*>/gi, ' | ')
    .replace(/<h1[^>]*>/gi, '\n# ')
    .replace(/<h2[^>]*>/gi, '\n## ')
    .replace(/<h3[^>]*>/gi, '\n### ')
    .replace(/<h4[^>]*>/gi, '\n#### ')
    .replace(/<b>|<strong>/gi, '**')
    .replace(/<\/b>|<\/strong>/gi, '**')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/^[ \t]+/gm, '')
    .trim();
}

// allDetailData 파싱: 두 가지 패턴 지원
// 1) const allDetailData = { ch1: {...} };
// 2) const allDetailData = {}; allDetailData['ch1'] = {...};
function extractAllDetailData(html) {
  // Pattern 2 (재변환 파일): allDetailData['chN'] = { ... };
  const assigns = [...html.matchAll(/allDetailData\[['"]([^'"]+)['"]\]\s*=\s*\{/g)];
  if (assigns.length > 0) {
    const result = {};
    for (const m of assigns) {
      const chid = m[1];
      const startIdx = m.index + m[0].length - 1; // position of `{`
      // brace depth parser — template literal 안 체크
      let depth = 0, i = startIdx, inStr = false, strCh = '', inTpl = false;
      for (; i < html.length; i++) {
        const c = html[i];
        const prev = html[i-1];
        if (inTpl) {
          if (c === '`' && prev !== '\\') inTpl = false;
          continue;
        }
        if (inStr) {
          if (c === strCh && prev !== '\\') inStr = false;
          continue;
        }
        if (c === '`') { inTpl = true; continue; }
        if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
      }
      const blockStr = html.slice(startIdx, i);
      try {
        const fn = new Function('return ' + blockStr);
        result[chid] = fn();
      } catch (e) {
        console.error(`  allDetailData[${chid}] parse failed: ${e.message}`);
        result[chid] = {};
      }
    }
    return result;
  }
  // Pattern 1 (legacy): const allDetailData = {...};
  const m = html.match(/const\s+allDetailData\s*=\s*(\{[\s\S]*?\n\};)/);
  if (!m) return null;
  try {
    const fn = new Function('return ' + m[1].replace(/;\s*$/, ''));
    return fn();
  } catch (e) {
    console.error('allDetailData parse failed:', e.message);
    return null;
  }
}

// 카드 title/sub 추출 (DOM regex)
function extractCards(html) {
  const cards = [];
  // <div class="card" onclick="toggleCardExpand(this,'ch1','KEY')"> ... <div class="card-title">TITLE</div> <div class="card-sub">SUB</div>
  const re = /<div class="card"[^>]*onclick="toggleCardExpand\(this,['"]([^'"]+)['"],['"]([^'"]+)['"]\)"[^>]*>([\s\S]*?)<\/div>\s*<button class="expand-btn"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const chid = m[1], key = m[2], body = m[3];
    const titleM = body.match(/<div class="card-title"[^>]*>([\s\S]*?)<\/div>/);
    const subM = body.match(/<div class="card-sub"[^>]*>([\s\S]*?)<\/div>/);
    cards.push({
      chid, key,
      title: titleM ? stripHtml(titleM[1]) : '',
      sub: subM ? stripHtml(subM[1]) : '',
    });
  }
  return cards;
}

// 탭 그룹/라벨 추출
function extractTabs(html) {
  const tabs = [];
  // <div class="tab-group-label">LABEL</div>
  // <button class="tab-btn ..." onclick="switchTab('ch1','TABID',this)">...ICON</span>LABEL</button>
  const re = /<div class="tab-group-label"[^>]*>([\s\S]*?)<\/div>|<button[^>]*class="tab-btn[^"]*"[^>]*onclick="switchTab\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"][^>]*"[^>]*>([\s\S]*?)<\/button>/g;
  let m;
  let currentGroup = '';
  while ((m = re.exec(html)) !== null) {
    if (m[1] !== undefined) {
      currentGroup = stripHtml(m[1]);
    } else {
      const chid = m[2], tabid = m[3], body = m[4];
      // remove <span class="tab-icon">..</span>
      const label = stripHtml(body.replace(/<span class="tab-icon"[^>]*>[\s\S]*?<\/span>/g, ''));
      tabs.push({ group: currentGroup, chid, tabid, label });
    }
  }
  return tabs;
}

function convertFile(srcPath, dstPath, title) {
  const html = fs.readFileSync(srcPath, 'utf-8');
  const detail = extractAllDetailData(html);
  const cards = extractCards(html);
  const tabs = extractTabs(html);

  const lines = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> 자동 추출 마크다운 · 총 카드 ${cards.length}개 · 탭 ${tabs.length}개`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 그룹별로 탭 정리
  const tabMap = {};
  tabs.forEach(t => {
    if (!tabMap[t.group]) tabMap[t.group] = [];
    tabMap[t.group].push(t);
  });

  // 각 탭별 카드 (카드에 tabid 정보 없음 → HTML 순서로 탭 경계 파악)
  // 단순히 카드 key 기준으로 detail 매핑
  const chid = cards[0]?.chid || 'ch1';
  const chDetail = (detail && detail[chid]) || {};

  // 탭 순서로 카드 그룹화 (DOM 위치 기준)
  // HTML 에서 <div class="tab-content active" id="ch1-tab-TABID"> 블록 찾아서 그 안의 카드만 추출
  const tabBlocks = [];
  const tabRe = /<div class="tab-content[^"]*"[^>]*id="ch1-tab-([^"]+)"[^>]*>([\s\S]*?)(?=<div class="tab-content|<\/div>\s*<\/div>\s*<\/div>|<\/div>\s*<!-- ?── ?CAROUSEL)/g;
  let tbm;
  while ((tbm = tabRe.exec(html)) !== null) {
    const tabid = tbm[1];
    const tabHtml = tbm[2];
    const tabCards = extractCards('<wrap>' + tabHtml + '</wrap>');
    const tabObj = tabs.find(t => t.tabid === tabid);
    tabBlocks.push({
      tabid,
      group: tabObj?.group || '',
      label: tabObj?.label || tabid,
      cards: tabCards,
    });
  }

  for (const tab of tabBlocks) {
    lines.push(`## ${tab.group ? '[' + tab.group + '] ' : ''}${tab.label}`);
    lines.push('');
    for (const card of tab.cards) {
      lines.push(`### ${card.title}`);
      if (card.sub) lines.push(`*${card.sub}*`);
      lines.push('');
      const body = chDetail[card.key];
      if (body) {
        lines.push(stripHtml(body));
      } else {
        lines.push('_(내용 없음)_');
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  // 출력 폴더 생성
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, lines.join('\n'), 'utf-8');
  const stat = fs.statSync(dstPath);
  console.log(`  ✓ ${dstPath} (${(stat.size/1024).toFixed(1)} KB, ${tabBlocks.length} tabs, ${cards.length} cards)`);
  return { size: stat.size, tabs: tabBlocks.length, cards: cards.length };
}

console.log('신경계질환별물리치료 3파일 MD 추출 시작\n');

let totalSize = 0;
for (const f of FILES) {
  const src = path.join(ROOT, f.src);
  const dst = path.join(ROOT, f.dst);
  if (!fs.existsSync(src)) {
    console.log(`  ✗ ${f.src} 없음`);
    continue;
  }
  const r = convertFile(src, dst, f.title);
  totalSize += r.size;
}

// 통합 MD 재생성
const combinedPath = path.join(ROOT, '_study_md/신경계질환별물리치료_통합.md');
const existing = fs.existsSync(combinedPath) ? fs.readFileSync(combinedPath, 'utf-8') : '';

// 뇌졸중1·2·3·소뇌실조 부분 유지 + 파킨슨·TBI·SOAP 추가
const dir = path.join(ROOT, '_study_md/신경계질환별물리치료');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
const merged = [];
merged.push('# 신경계질환별물리치료 — 전체 통합\n');
for (const f of files) {
  const body = fs.readFileSync(path.join(dir, f), 'utf-8');
  merged.push('\n\n' + body);
}
fs.writeFileSync(combinedPath, merged.join('\n'), 'utf-8');
const cStat = fs.statSync(combinedPath);
console.log(`\n  ✓ 통합: ${combinedPath} (${(cStat.size/1024).toFixed(1)} KB)`);
console.log(`\n완료. 총 ${(totalSize/1024).toFixed(1)} KB (3 파일)`);
