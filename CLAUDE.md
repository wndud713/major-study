# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

물리치료학 전공 PDF 슬라이드를 인터랙티브 HTML 스터디 파일로 변환하는 프로젝트.
변환 원칙·콘텐츠 규칙은 `/pdf-to-html` 스킬(`~/.claude/skills/pdf-to-html/SKILL.md`) 참조.

---

## 빌드 / 실행 명령

```bash
# 전체 통합 1파일 생성 (기본)
node merge-html.js

# 3과목 각각 통합파일 생성
node merge-html.js --all-subjects

# 단일 과목
node merge-html.js --subject neuro-motor    # 신경계운동치료학
node merge-html.js --subject neuro-disease  # 신경계질환별물리치료
node merge-html.js --subject sports         # 스포츠물리치료학

# 생성된 JS 문법 검증 (output HTML 내 script 블록)
node --check 파일.html   # HTML 전체는 오류 나므로 script 부분만 파일로 추출 후 사용
```

**출력 파일 (루트에 생성):**
- `전공공부_통합.html` — 19챕터 통합 (~131MB)
- `신경계운동치료학_통합.html` — 5챕터 (~63MB)
- `신경계질환별물리치료_통합.html` — 7챕터 (~54MB)
- `스포츠물리치료학_통합.html` — 7챕터 (~14MB)

---

## 코드 아키텍처

### 파일 구조

```
전공공부/
├── merge-html.js            ← CLI 진입점
├── merge-config.json        ← 과목·챕터 목록 (파일 경로, shortTitle)
├── shell_template_v2.html   ← 디자인 표준 (수정 금지)
├── lib/
│   ├── html-parser.js       ← 개별 HTML → 정규화 데이터
│   ├── merge-engine.js      ← 챕터들 → 단일 HTML 조립 + 편집 기능 주입
│   ├── builder.js           ← assembleHTML, buildChapterNav, readTemplate
│   └── extractor.js         ← PDF 이미지 추출 유틸 (Poppler 래퍼)
├── 신경계운동치료학/htmlstudy/  ← 완성된 HTML 파일
├── 신경계질환별물리치료(이제혁)/ ← 완성된 HTML 파일
└── 스포츠물리치료학/htmlstudy/  ← 완성된 HTML 파일
```

### 처리 파이프라인

```
parseHtmlFile()          remapChapter()        assembleHTML()
html-parser.js    →→→   html-parser.js  →→→   builder.js
(변형 감지·추출)          (ch1→chN 재번호)        (템플릿 조립)
                                                    ↓
                                           injectEditFeatures()
                                           merge-engine.js
                                           (편집 CSS+JS 주입)
                                                    ↓
                                              .html 파일 출력
```

### lib/html-parser.js

- `detectVariant(content)` → `'standard'` | `'legacy'` | `'hka'`
- `parseHtmlFile(path)` → `{ variant, srcChId, slidesRaw, detailRaw, chapterSectionHtml, accent, accent2, title }`
- `remapChapter(parsed, targetChId, isFirst)` → ID 전체를 `ch1→chN`으로 치환
- `slidesRaw`: 배열 문자열 `[{src:'...', label:'...'}]` — base64 포함이므로 파싱하지 않고 raw 전달

**3종 HTML 변형:**

| 변형 | 감지 조건 | 슬라이드 소스 | 세부 특이사항 |
|------|-----------|--------------|--------------|
| `standard` | `chapter-section` div 존재 | `SLIDES_DATA[chId]` | 대부분 파일 |
| `legacy` | `const CAROUSEL_IMGS` 존재 | `CAROUSEL_IMGS[...]` | 뇌졸중1~3; ID 정규화 필요 (`-carousel` → `-carousel-area`) |
| `hka` | `chapter-section` 없음 | 없음 (`[]`) | 특수 레이아웃; `main-` prefix ID |

### lib/merge-engine.js

핵심 함수:
- `mergeSubject({ subject, templatePath, chapters, outputPath })` — 단일 과목 병합
- `mergeAll({ templatePath, subjects, outputPath })` — 전체 통합; 과목 선택기 드롭다운 네비 생성
- `buildSubjectSelectorNav(groups)` — 전체 통합 전용 상단 네비 (과목 박스 + 챕터 버튼)
- `injectEditFeatures(html)` — 편집 기능(CSS+JS) 주입; 별도 `<script>` 블록을 `</body>` 직전 삽입

**`injectEditFeatures` 내용:**
- Step 6: CSS 변수 (`--sidebar-w`, `--detail-w`, `--cards-max-h`), 리사이즈 핸들 드래그
- Step 7: localStorage 자동저장, 탭 이름·카드 텍스트 더블탭 편집, 슬라이드 추가/삭제

---

## 레포 전용 규칙

- **PDF 1개 = chapter-nav 버튼 1개** — 챕터 분리 필요 시만 2개 이상
- 캐러셀 엔진 함수 **수정 금지** (호출은 가능): `initCarousel`, `goTo`, `carouselMove`, `toggleCarousel`, `openLightbox`, `closeLightbox`, `switchChapter`, `switchTab`, `openDetail`, `closeDetail`
- `shell_template_v2.html` **수정 금지**

---

## 중요 함정 / 트레이드오프

### Template literal 내 따옴표 이스케이프

`injectEditFeatures`의 `js` 변수는 JS template literal(백틱)로 작성됨.  
`\'`는 template literal에서 그냥 `'`로 출력됨 → CSS 속성 선택자나 JS 문자열 안에서 단따옴표가 필요하면 `\\'` 사용.

```javascript
// 잘못됨 — 출력: querySelector('...[onclick*="switchTab('ch1','tabId'"]')
//  → JS SyntaxError (단따옴표 충돌)
var btn = document.querySelector('...[onclick*="switchTab(\''+chId+'\'"]');

// 올바름 — 루프+indexOf 방식으로 우회
document.querySelectorAll('button.tab-btn').forEach(function(b){
  if((b.getAttribute('onclick')||'').indexOf("switchTab('"+chId+"'")!==-1) found=b;
});
```

### CSS `!important` vs 인라인 style

편집 기능 × 버튼처럼 CSS로 show/hide를 제어할 때 인라인 `display:flex`와 충돌 방지:  
인라인 style에서 `display` 제거 → CSS `body.edit-mode .del-slide-btn { display:flex!important }` 로만 제어.

### SLIDES_DATA 교체 시 regex 금지

`src:`, `label:` 키도 매칭되어 잘못된 key가 삽입됨. brace-depth 파서 사용:

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

- stray comma 주의: `마지막키:\`...\`,\n,\n다음키:` 패턴 → JS 문법 오류
- 병합 후 브라우저 콘솔 또는 별도 파일로 추출 후 `node --check`로 검증

---

## HTML 구조 참조

### ID 패턴 (모든 요소는 `{chid}-` 접두사)

| 요소 | ID |
|------|----|
| 챕터 섹션 | `ch1` |
| 카드 영역 | `ch1-cards-area` |
| 탭 컨텐츠 | `ch1-tab-{tabId}` |
| 캐러셀 영역 | `ch1-carousel-area` |
| 캐러셀 토글 버튼 | `ch1-carousel-toggle-btn` |
| 캐러셀 썸네일 | `ch1-carousel-thumbs` |
| 디테일 패널 | `ch1-detail-panel` |
| 라이트박스 | `lightbox` (전역 1개) |

### 챕터 accent 색상

| 색상 | hex |
|------|-----|
| 하늘 | `#38bdf8` |
| 보라 | `#a78bfa` |
| 민트 | `#34d399` |
| 청록 | `#4fd1c5` |
| 주황 | `#fb923c` |

---

## 도구 경로 (Poppler)

```bash
POPPLER="$LOCALAPPDATA/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin"
"$POPPLER/pdfimages.exe"   # 이미지 추출
"$POPPLER/pdftotext.exe"   # 텍스트 추출
"$POPPLER/pdftoppm.exe"    # 래스터화 (fallback)
```

이미지 필터 기준: **width ≥ 150 AND height ≥ 150** (장식 아이콘 제외)  
컬럼 순서: `page(0) num(1) type(2) width(3) height(4) color(5) ...`

```bash
"$POPPLER/pdfimages.exe" -list "파일.pdf" 2>/dev/null
"$POPPLER/pdfimages.exe" -png -p "파일.pdf" "/tmp/img"
# 결과: img-{page:03d}-{num:03d}.png
```
