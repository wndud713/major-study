# 발견 사항 & 공유 자료

## 2026-04-16 — 메인세션: 프로젝트 분석

### 현재 프로젝트 구조
- 3개 과목: 스포츠물리치료학, 신경계운동치료학, 신경계질환별물리치료(이제혁)
- PDF 21개, HTML 21개 (대부분 수동 변환 완료)
- 기반 템플릿: shell_template_v2.html

### 변환 파이프라인 (현재 수동 과정)
1. pdftotext -layout으로 텍스트 추출
2. pdfimages -list 로 이미지 목록 확인 (width>=150 AND height>=150 필터)
3. pdfimages -png -p 로 이미지 추출
4. 이미지를 base64 인코딩 → SLIDES_DATA 구성
5. 텍스트 분석 → allDetailData의 HTML 콘텐츠 작성
6. shell_template_v2.html 기반으로 최종 HTML 조립

### 핵심 규칙
- PDF 1개 = 상단 탭 1개 (chapter-nav 버튼)
- 캐러셀 엔진 함수 수정 금지
- SLIDES_DATA 교체 시 regex 금지 → brace-depth 파서 사용
- 필수 ID 패턴: {chid}- 접두사
- 이미지 없으면 ch1: []

### 환경
- Codex CLI: 없음 / Gemini CLI: 없음
- gh CLI: 있음 / npm: 있음
- Poppler: $LOCALAPPDATA/Microsoft/WinGet/.../poppler-25.07.0/Library/bin

---

## 2026-04-16 — 개발 결과

### 테스트 결과
- pdfimages -list 출력: 공백 구분, 첫 2줄 헤더+구분선, 이후 데이터
- Ch1 PDF: 254개 이미지 중 84개 150x150 필터 통과
- scaffold HTML 6.5MB (84개 이미지 base64 포함)
- prompt.txt 25KB (텍스트 12,842자)
- Phase 2 mock 테스트: JS 문법 검증 통과, ID 패턴 정상

### 주의사항
- outdir가 존재하지 않으면 자동 생성 필요 (초기 버그 → 수정됨)
- pdfimages 출력에서 smask 타입은 알파 마스크이므로 필터에서 제외
- 한글 경로에 공백이 있는 경우가 많으므로 모든 경로를 큰따옴표로 감쌈

---

# DEAD_ENDS (시도했으나 실패한 접근)

(아직 없음)
