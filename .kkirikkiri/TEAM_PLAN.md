# 팀 작업 계획

- 팀명: kkirikkiri-development-0416-supplement
- 목표: 기존 HTML 파일 21개 누락 콘텐츠 보강 (PDF 원본 대조)
- 생성 시각: 2026-04-16
- 프로젝트 루트: C:/Users/wndud/Desktop/전공공부

## 팀 구성
| 이름 | 역할 | 모델 | 담당 업무 |
|------|------|------|----------|
| lead | 팀장 | Opus | 파일 배분/진행 조율/품질 검증/결과 통합 |
| analyzer-1 | 분석가1 | Opus | 신경계운동치료학 (5개 파일) |
| analyzer-2 | 분석가2 | Opus | 신경계질환별물리치료(이제혁) (7개 파일) |
| analyzer-3 | 분석가3 | Opus | 스포츠물리치료학 (9개 파일) |
| reviewer | 검증자 | Sonnet | 최종 QA |

## 파일 배분
### analyzer-1 담당 (신경계운동치료학)
- 신경계운동치료학/htmlstudy/기능적움직임재교육.html ↔ 기능적 움직임 재교육 (1).pdf
- 신경계운동치료학/htmlstudy/루드의치료법.html ↔ 루드의 치료법.pdf
- 신경계운동치료학/htmlstudy/보바스브룬스트롬.html ↔ 보바스브룬스트롬.pdf
- 신경계운동치료학/htmlstudy/보행1.html ↔ 보행1.pdf
- 신경계운동치료학/htmlstudy/오리엔테이션.html ↔ 2026 신경계운동치료학 오리엔테이션 (1).pdf

### analyzer-2 담당 (신경계질환별물리치료)
- 신경계질환별물리치료(이제혁)/뇌졸중1_뇌혈관질환.html ↔ 2. 2026 신경계질환별물리치료(뇌졸중1).pdf
- 신경계질환별물리치료(이제혁)/뇌졸중2_임상증상_평가.html ↔ 3. 2026 신경계질환별물리치료(뇌졸중2).pdf
- 신경계질환별물리치료(이제혁)/뇌졸중3_중재_치료기법.html ↔ 4. 2026 신경계질환별물리치료(뇌졸중3).pdf
- 신경계질환별물리치료(이제혁)/소뇌실조.html ↔ 6. 2026 질환별물리치료학(소뇌실조).pdf
- 신경계질환별물리치료(이제혁)/외상성뇌손상_TBI.html ↔ 5. 2026 질환별물리치료학(외상성 뇌손상).pdf
- 신경계질환별물리치료(이제혁)/파킨슨병.html ↔ 7. 2026 질환별물리치료학(파킨슨병).pdf
- 신경계질환별물리치료(이제혁)/SOAP_note_TBI.html ↔ SOAP note(TBI).pdf

### analyzer-3 담당 (스포츠물리치료학)
- 스포츠물리치료학/HTML/Ch1_상해선수의재활프로그램수립.html ↔ Ch 1. 상해선수의 재활프로그램 수립 DK.pdf
- 스포츠물리치료학/HTML/Ch2_치유과정의이해와관리.html ↔ Ch 2.재활 중 치유과정의 이해와 관리 DK (1).pdf
- 스포츠물리치료학/HTML/Ch3_재활평가과정.html ↔ Ch 3. 재활평가과정 DK.pdf
- 스포츠물리치료학/HTML/Ch4_재활을위한심리적고찰.html ↔ Ch 4 상해선수의 재활을 위한 심리적 고찰 DK.pdf
- 스포츠물리치료학/HTML/Ch5_핵심안정화.html ↔ Ch 5. 재활에서 핵심안정화 DK.pdf
- 스포츠물리치료학/HTML/Ch6_신경근조절의재설정.html ↔ Ch 6.신경근 조절의 재설정 DK (1).pdf
- 스포츠물리치료학/HTML/HKA_assessment_study.html ↔ H-K-A assessment.pdf / H-K-A assessment chart.pdf
- 스포츠물리치료학/HKA_assessment_study.html ↔ H-K-A assessment.pdf
- 스포츠물리치료학/HKA_Janda_통합스터디.html ↔ Janda.pdf

## Poppler 경로
POPPLER="$LOCALAPPDATA/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin"

## 보강 방법
각 파일에 대해:
1. pdftotext로 PDF 텍스트 추출
2. HTML에서 allDetailData 현재 내용 파악
3. PDF 내용과 비교 → 누락 항목 식별
4. detail-item/table/step-flow 등 컴포넌트로 누락 내용 추가
5. CLAUDE.md 규칙 준수 (새해부학 용어, brace-depth 파서 등)

## 핵심 규칙
- SLIDES_DATA 교체 시 regex 금지 → brace-depth 파서 사용
- 새해부학 용어 (비복근→장딴지근 등)
- 캐러셀 엔진 함수 수정 금지
- detail-item 컴포넌트: accent/blue/green/red/yellow 클래스

## 태스크 목록
- [ ] 태스크 1: 파일 배분 + 작업 계획 수립 → lead
- [ ] 태스크 2: 신경계운동치료학 5개 파일 보강 → analyzer-1
- [ ] 태스크 3: 신경계질환별물리치료 7개 파일 보강 → analyzer-2
- [ ] 태스크 4: 스포츠물리치료학 9개 파일 보강 → analyzer-3
- [ ] 태스크 5: 최종 QA + 리포트 → reviewer + lead

## 주요 결정사항
(팀장이 결정할 때마다 여기에 기록)
