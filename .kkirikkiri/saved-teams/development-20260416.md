# 저장된 팀: PDF→HTML 자동화 도구 개발팀

- 생성일: 2026-04-16
- 프리셋: development (확장)
- 목표: PDF → 인터랙티브 HTML 스터디 파일 자동 변환 도구 개발

## 팀 구성
| 역할 | 모델 | 담당 |
|------|------|------|
| 팀장 (Lead) | Opus | 아키텍처 설계, 태스크 분배, 코드 리뷰, 결과 통합 |
| 개발자1 (dev-extractor) | Opus | PDF 추출 파이프라인 (Poppler 텍스트/이미지 추출, base64 인코딩) |
| 개발자2 (dev-builder) | Opus | HTML 생성 엔진 (shell_template_v2 기반, SLIDES_DATA/allDetailData 빌더) |
| 테스터 | Sonnet | 실제 PDF 변환 테스트 + 기존 HTML 비교 검증 |

## 인터뷰 답변 요약
- 팀 목적: 변환 자동화 도구 개발
- 깊이: 제대로 꼼꼼하게 (확장 구성)

## 환경 조건
- Codex CLI: 없음
- Gemini CLI: 없음
- gh CLI: 있음
- npm: 있음

## 성과
- 라운드: 1라운드 (품질 충분)
- 결과물: convert-pdf.js + lib/extractor.js + lib/builder.js
- 테스트: Ch1 PDF로 Phase 1+2 성공, JS 문법 검증 통과
