# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

물리치료학 전공 PDF 슬라이드를 인터랙티브 HTML 스터디 파일로 변환하는 프로젝트.
변환 원칙·콘텐츠 규칙은 `/pdf-to-html` 스킬(`~/.claude/skills/pdf-to-html/SKILL.md`) 참조.

```
전공공부/
├── shell_template_v2.html        ← 디자인 표준 (수정 금지)
├── 신경계운동치료학/
│   ├── htmlstudy/                ← 완성된 HTML 파일들
│   └── *.pdf
├── 신경계질환별물리치료(이제혁)/
│   ├── *.html
│   └── *.pdf
└── 스포츠물리치료학/
    ├── HTML/                     ← 완성된 HTML 파일들
    └── *.pdf
```

## 레포 전용 규칙

- **PDF 1개 = 상단 탭(chapter-nav 버튼) 1개** — 챕터 분리 필요 시만 2개 이상
- 캐러셀 엔진 함수(`initCarousel`, `goTo`, `carouselMove`, `toggleCarousel`, `openLightbox`, `closeLightbox`, `switchChapter`, `switchTab`, `openDetail`, `closeDetail`) 수정 금지

## 도구 경로 (Poppler)

```bash
POPPLER="$LOCALAPPDATA/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin"
"$POPPLER/pdfimages.exe"   # 이미지 추출
"$POPPLER/pdftotext.exe"   # 텍스트 추출
"$POPPLER/pdftoppm.exe"    # 래스터화 (fallback)
```

## 이미지 추출 세부 (레포 전용)

```bash
"$POPPLER/pdfimages.exe" -list "파일.pdf" 2>/dev/null
```

컬럼 순서: `page(0) num(1) type(2) width(3) height(4) color(5) ...`  
필터 기준: **width ≥ 150 AND height ≥ 150** (장식 아이콘 제외)

```bash
"$POPPLER/pdfimages.exe" -png -p "파일.pdf" "/tmp/img"
# 결과: img-{page:03d}-{num:03d}.png
```

`SLIDES_DATA` 교체 시 **regex 금지** — `src:`, `label:` 키도 매칭되어 잘못된 key 삽입됨. brace-depth 파서 사용 (아래 참조).

## HTML 파일 구조 (shell_template_v2.html 기반)

### 필수 ID 패턴

모든 ID는 `{chid}-` 접두사:

| 요소 | ID |
|------|-----|
| 챕터 섹션 | `ch1` |
| 카드 영역 | `ch1-cards-area` |
| 탭 컨텐츠 | `ch1-tab-{tabId}` |
| 캐러셀 영역 | `ch1-carousel-area` |
| 캐러셀 토글 버튼 | `ch1-carousel-toggle-btn` |
| 디테일 패널 | `ch1-detail-panel` |
| 디테일 컨텐츠 | `ch1-detail-content` |
| 라이트박스 | `lightbox` (전역 1개) |

### SLIDES_DATA 형식

```javascript
const SLIDES_DATA = {
  ch1: [
    { src: 'data:image/png;base64,...', label: 'p.3' },
  ],
};
```

- 이미지 없으면 `ch1: []`
- 탭별 캐러셀 분리 금지 — 챕터당 단일 캐러셀

### allDetailData 형식

```javascript
const allDetailData = {};
allDetailData['ch1'] = {
  key1: `<h2>제목</h2><div class="detail-section">...</div>`,
};
```

디테일 패널 컴포넌트: `.detail-item.accent/.blue/.green/.red/.yellow`, `.detail-table`, `.step-flow > .step-item`, `.timeline > .tl-item`, `.tip-box`, `.warn-box`, `.tag`

### 챕터 accent 색상 (권장)

| 색상 | hex |
|------|-----|
| 하늘 | `#38bdf8` |
| 보라 | `#a78bfa` |
| 민트 | `#34d399` |
| 청록 | `#4fd1c5` |
| 주황 | `#fb923c` |

## 기존 파일 수정 시 주의

### SLIDES_DATA 교체

중괄호 깊이 파서로 블록 경계를 찾은 뒤 문자열 치환:

```javascript
function findSlidesDataBlock(content) {
  const m = /((?:const\s+)?SLIDES_DATA\s*=\s*\{)/.exec(content);
  const braceStart = m.index + m[0].lastIndexOf('{');
  let depth = 0, inStr = false, strCh = '', endBrace = -1;
  for (let i = braceStart; i < content.length; i++) {
    const ch = content[i];
    if (inStr) { if (ch === strCh) inStr = false; }
    else {
      if (ch === '"' || ch === "'") { inStr = true; strCh = ch; }
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
    }
  }
  let blockEnd = endBrace + 1;
  if (content[blockEnd] === ';') blockEnd++;
  return { start: m.index, end: blockEnd };
}
```

### allDetailData 병합 시

- stray comma 주의: `마지막키:\`...\`,\n,\n다음키:` 패턴은 JS 문법 오류
- 중복 HTML 태그 주의: 병합 스크립트가 태그를 이중 삽입하는 버그 발생 가능 → 병합 후 `node --check 파일.html` 또는 브라우저 콘솔에서 syntax error 확인
