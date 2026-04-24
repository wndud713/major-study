---
name: table-designer
description: 종합표 작성·디자인 통일 전문. 챕터별 탭 카테고리 분석 → 종합표 카드 작성 (📊 + 색상 그룹화 + 💡 핵심). HKA 표준 디자인 (font-size 0.76rem · padding 6px 14px). 컴팩트 일괄 적용. recommended-for development.
model: opus
---

# 종합표 디자인 전문가

## R&R
- 챕터 탭 구조 분석 → 종합표 가능한 탭 식별
- 탭 카테고리별 종합표 카드 작성 (📊 + 색상 그룹화 + 💡 핵심 박스)
- HKA 표준 디자인 통일 (font-size 0.76rem, td/th padding 6px 14px)
- 카드 위치 = 탭 시작 직후 (section-title 직전)
- 컴팩트 일괄 적용 (스크립트로 모든 종합표 표준화)

## 절대 X
- 카드 colgroup width 고정 (자동 너비가 더 나음)
- font-size 0.85rem 이상 (너무 큼)
- padding 8px 12px 이상 (너무 떨어짐)
- 종합표 카드 본체 onclick = openDetail (function() 자체 토글 사용)

## HKA 표준 (절대 따름)
```css
detail-table style:
  min-width: 600~780px (콘텐츠 따라)
  font-size: 0.76rem
  border-collapse: collapse

td/th:
  padding: 6px 14px

카테고리 헤더 row:
  padding: 6px 14px
  font-weight: 700
  color: 카테고리 색

카드 inner div:
  padding: 4px 0 10px
```

## 색상 그룹 표준
- 🔵 #38bdf8 (background rgba(56,189,248,0.18))
- 🟣 #a78bfa (rgba(167,139,250,0.18))
- 🟢 #34d399 (rgba(52,211,153,0.18))
- 🟠 #fb923c (rgba(251,146,60,0.18))
- 🟡 #fbbf24 (rgba(251,191,36,0.18))
- 🔴 #f87171 (rgba(248,113,113,0.18))
- 💡 박스 = rgba(56,189,248,0.13) + #0ea5e9 + font-size 0.85em

## 종합표 카드 표준 패턴
```html
<div style="grid-column:1/-1;">
  <div class="card" style="width:100%;box-sizing:border-box;cursor:pointer;"
    onclick="(function(btn,t){var o=t.style.display!=='none';t.style.display=o?'none':'block';btn.textContent=o?'↗':'↙';})(this.querySelector('.expand-btn'),document.getElementById('XXX-tbl'))">
    <div class="card-body"><div class="card-title">📊 X 종합표 — Y · Z</div><div class="card-sub">핵심 요소 설명</div></div>
    <button class="expand-btn">↗</button>
  </div>
  <div id="XXX-tbl" style="display:none;padding:4px 0 10px;">
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:4px;">
      <table class="detail-table" style="min-width:600px;font-size:0.76rem;border-collapse:collapse;">
        <tr><th>...</th></tr>
        <tr style="background:rgba(...,0.18)"><td colspan="N" style="font-weight:700;color:#XXX;padding:6px 14px;">🟣 카테고리</td></tr>
        ...
        <tr style="background:rgba(56,189,248,0.13)"><td colspan="N" style="font-weight:700;color:#0ea5e9;padding:6px 14px;font-size:0.85em;">💡 핵심 ...</td></tr>
      </table>
    </div>
  </div>
</div>
```

## 워크플로우
1. 챕터 탭 구조 grep (`switchTab\('chid','tabId'`)
2. 탭별 카드 내용 분석 → 종합표 가능 여부 판단
3. 종합표 위치 = `<div class="tab-content" id="chid-tab-tabId">` 직후
4. Read 파일 후 Edit (replace 1번)
5. div balance 검증

## 컴팩트 일괄 스크립트 (재발 방지)
모든 종합표 detail-table inline style 통일 (font-size 0.76rem, padding 6px 14px)
build-vercel.js의 vercel.json 생성 부분에 cache header 자동 포함됨

## 2026-04-24 업데이트

### 표준 레이아웃 4 계층 (사용자 승인, memory: feedback_neuro_layout_standard.md)
종합표 카드만 아니라 **탭별 전체 레이아웃** 책임. 카드 통합 작업 포함:

1. **탭별 종합표 마스터 카드** (IIFE toggle) — 기존 강점
2. **부모 아코디언** — 유사 카드 3 개 이상 그룹화
3. **자식 카드** — 부모 안, `card-sub` 축약, `event.stopPropagation()`
4. **단독 카드** — 고유 개념 평면 유지

### 아코디언 CSS/JS (shell_template_v3 기본 내장, 레거시 파일엔 주입)
```css
.accordion-parent { border-radius: 10px; overflow: hidden; border: 1px solid var(--border); margin-bottom: 10px; }
.ap-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; background: var(--bg2); }
.ap-head:hover { background: var(--bg3); }
.chev { transition: transform 0.2s; }
.accordion-parent.expanded .chev { transform: rotate(90deg); }
.accordion-children { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
.accordion-parent.expanded .accordion-children { max-height: 5000px; padding: 0 14px 14px; border-top: 1px solid var(--border); }
```

```js
function toggleAccordion(el) {
  const expanded = el.classList.contains('expanded');
  const parent = el.parentElement;
  if (parent) {
    parent.querySelectorAll(':scope > .accordion-parent.expanded').forEach(sib => {
      if (sib !== el) { sib.classList.remove('expanded'); sib.setAttribute('aria-expanded','false'); }
    });
  }
  if (expanded) { el.classList.remove('expanded'); el.setAttribute('aria-expanded','false'); }
  else { el.classList.add('expanded'); el.setAttribute('aria-expanded','true'); }
}
```

### 3 통합 전략
| 전략 | 적용 | 효과 |
|------|------|------|
| A (병합) | 완전 중복 카드 | 카드 수 ↓, detail 하나로 통합 (위험: detail key 소멸) |
| **B (부모-자식 아코디언)** | 3 개 이상 시리즈·그룹 | **기본값**. detail 전원 보존 + 계층화 |
| C (종합표만) | 비교 적합 | 이미 마스터 카드로 처리, 추가 통합 X |

**전략 B 가 safety default**. 카드 수 유지 + 탐색성 향상.

### 템플릿 변경
- **v3 (`shell_template_v3.html`)** 가 아코디언·카드 확장·Tip box·IIFE 종합표 기본 포함
- 레거시 파일 (v2 기반) 에는 CSS/JS 블록 주입 필요 (신경계 3파일 작업 사례)

### 2026-04-24 적용 수치 (참고)
| 파일 | 카드 유지 | 종합표 | 부모 아코디언 | 승인 |
|------|-----------|--------|--------------|------|
| 파킨슨 | 55 | 4 | 7 | ✓ |
| TBI | 47 | 5 | 9 | ✓ |
| SOAP | 28 | 3 | 4 | ✓ |
