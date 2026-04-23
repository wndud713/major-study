// 임상세미나 HTML → Markdown 텍스트 추출
// 대상: 임상세미나_연구방법론.html (탭1·탭2 서술형 시험 대비 보강본)
// 출력: _study_md/임상세미나/임상세미나_연구방법론.md

const fs = require('fs');
const path = require('path');

const FILES = [
  { src: '임상세미나/htmlstudy/임상세미나_연구방법론.html', dst: '_study_md/임상세미나/임상세미나_연구방법론.md', title: '임상세미나 — 연구방법론' },
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

function extractAllDetailData(html) {
  const assigns = [...html.matchAll(/allDetailData\[['"]([^'"]+)['"]\]\s*=\s*\{/g)];
  if (assigns.length > 0) {
    const result = {};
    for (const m of assigns) {
      const chid = m[1];
      const startIdx = m.index + m[0].length - 1;
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

function extractCards(html) {
  const cards = [];
  // toggleCardExpand or openDetail 패턴 둘 다 지원
  const re = /<div class="card"[^>]*onclick="(?:toggleCardExpand|openDetail)\(this,['"]([^'"]+)['"],['"]([^'"]+)['"]\)"[^>]*>([\s\S]*?)<\/div>\s*(?:<button class="expand-btn"|<div class="card-expand-wrap"|<div class="card"\s+onclick=)/g;
  let m;
  let lastIndex = 0;
  while ((m = re.exec(html)) !== null) {
    const chid = m[1], key = m[2], body = m[3];
    const titleM = body.match(/<div class="card-title"[^>]*>([\s\S]*?)<\/div>/);
    const subM = body.match(/<div class="card-sub"[^>]*>([\s\S]*?)<\/div>/);
    cards.push({
      chid, key,
      title: titleM ? stripHtml(titleM[1]) : '',
      sub: subM ? stripHtml(subM[1]) : '',
      offset: m.index,
    });
    // 다음 card 매칭 시 겹치지 않게 lookahead 로 끝낸 만큼 포인터 복원
    re.lastIndex = m.index + m[0].length - (m[0].match(/<div class="card-expand-wrap"|<button class="expand-btn"|<div class="card"/)?.[0].length || 0);
  }
  return cards;
}

function extractTabs(html) {
  const tabs = [];
  const re = /<div class="tab-group-label"[^>]*>([\s\S]*?)<\/div>|<button[^>]*class="tab-btn[^"]*"[^>]*onclick="switchTab\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"][^>]*"[^>]*>([\s\S]*?)<\/button>/g;
  let m;
  let currentGroup = '';
  while ((m = re.exec(html)) !== null) {
    if (m[1] !== undefined) {
      currentGroup = stripHtml(m[1]);
    } else {
      const chid = m[2], tabid = m[3], body = m[4];
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

  const chid = cards[0]?.chid || 'ch1';
  const chDetail = (detail && detail[chid]) || {};

  // tab-content 경계 offset 수집 (offset 기반 card 분류)
  const tabBoundaries = [];
  const tabStartRe = /<div class="tab-content[^"]*"[^>]*id="ch1-tab-([^"]+)"[^>]*>/g;
  let tbm;
  while ((tbm = tabStartRe.exec(html)) !== null) {
    tabBoundaries.push({ tabid: tbm[1], offset: tbm.index });
  }
  // 각 탭의 end = 다음 탭 offset 또는 html.length
  const tabBlocks = tabBoundaries.map((tb, i) => {
    const end = i + 1 < tabBoundaries.length ? tabBoundaries[i+1].offset : html.length;
    const tabObj = tabs.find(t => t.tabid === tb.tabid);
    const tabCards = cards.filter(c => c.offset >= tb.offset && c.offset < end);
    return {
      tabid: tb.tabid,
      group: tabObj?.group || '',
      label: tabObj?.label || tb.tabid,
      cards: tabCards,
    };
  });

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

  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, lines.join('\n'), 'utf-8');
  const stat = fs.statSync(dstPath);
  console.log(`  ✓ ${dstPath} (${(stat.size/1024).toFixed(1)} KB, ${tabBlocks.length} tabs, ${cards.length} cards)`);
  return { size: stat.size, tabs: tabBlocks.length, cards: cards.length };
}

console.log('임상세미나 MD 추출 시작\n');

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

console.log(`\n완료. 총 ${(totalSize/1024).toFixed(1)} KB`);
