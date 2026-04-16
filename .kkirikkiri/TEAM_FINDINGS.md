# 발견 사항 & 공유 자료

## 2026-04-16 — 메인세션: 새 세션 시작 (콘텐츠 보강)

### 작업 목표
기존 HTML 21개를 원본 PDF와 대조하여 누락된 allDetailData 콘텐츠 보강

### 보강 시 사용할 컴포넌트
- `<div class="detail-item accent|blue|green|red|yellow"><b>항목:</b> 설명</div>`
- `<table class="detail-table">...</table>`
- `<div class="step-flow"><div class="step-item">단계</div>...</div>`
- `<div class="timeline"><div class="tl-item">...</div></div>`
- `<div class="tip-box"><b>팁:</b> 내용</div>`
- `<div class="warn-box"><b>주의:</b> 내용</div>`
- `<span class="tag">태그</span>`

### 핵심 규칙
- 새해부학 용어: 비복근→장딴지근, 승모근→등세모근 등
- allDetailData 수정 시 brace-depth 파서 사용 (regex 금지)
- 각 detail-item은 `<b>핵심어:</b>` 로 시작
- PDF 내용 빠짐없이 전수 기록 (요약 아님)

---

# DEAD_ENDS (시도했으나 실패한 접근)

(아직 없음)
