# 📚 전공공부 — 물리치료 인터랙티브 스터디

PDF 강의자료를 인터랙티브 HTML 스터디 파일로 변환. 6 과목, 28 챕터.

## 🌐 온라인으로 보기

> **Vercel 배포 후 URL 추가 예정**
> 예시: https://major-study.vercel.app/

빠른 인덱스 → 과목 → 챕터 3단계 네비게이션. 각 챕터 1~22MB 점진 로딩.

## 💾 오프라인 다운로드

[GitHub Releases](https://github.com/wndud713/major-study/releases/latest)
- 챕터별 HTML 다운로드
- 더블클릭으로 브라우저 실행 (인터넷 불필요)

---

## 📖 과목 구성

| 과목 | 챕터 | 합계 |
|------|-----:|-----:|
| 🧠 신경계운동치료학 | 5 | 53MB |
| 🩺 신경계질환별물리치료 | 7 | 28MB |
| 🏥 기능훈련 (ADL) | 2 | 34MB |
| 🏃 스포츠물리치료학 | 7 | 16MB |
| 📋 임상의사결정 | 6 | 28MB |
| 🔬 임상세미나 | 1 | 1MB |
| **합계** | **28** | **160MB** |

---

## 🛠 빌드 시스템

### Vercel 분할 배포 (권장 — 다른 사람 공유용)
```bash
node build-vercel.js   # public/ 생성
cd public && npx vercel --prod
```

### 본인용 통합본 (오프라인 단일 파일)
```bash
node merge-html.js                      # 전체 통합 (전공공부_통합.html, ~167MB)
node merge-html.js --all-subjects       # 과목별 통합본 6개
node merge-html.js --subject neuro-motor   # 단일 과목
```

상세: [DEPLOY.md](DEPLOY.md)

---

## 📂 구조

```
전공공부/
├── merge-config.json          ← 과목·챕터 메타
├── merge-html.js              ← 통합본 빌더 CLI
├── build-vercel.js            ← Vercel 분할 배포 빌더
├── shell_template_v2.html     ← 디자인 표준 (수정 금지)
├── lib/
│   ├── builder.js
│   ├── extractor.js
│   ├── html-parser.js         ← 3 variant 감지·파싱
│   └── merge-engine.js        ← injectEditFeatures
├── ADL/htmlstudy/
├── 신경계운동치료학/htmlstudy/
├── 신경계질환별물리치료(이제혁)/
├── 스포츠물리치료학/htmlstudy/
├── 임상의사결정/htmlstudy/
├── 임상세미나/htmlstudy/
└── public/                    ← Vercel 배포 결과 (build-vercel.js 생성)
    ├── index.html
    ├── subjects/
    └── chapters/
```

---

## ⚙️ 사용 기술

- **Frontend**: 순수 HTML/CSS/JS (의존성 없음)
- **PDF 처리**: Poppler (pdftotext, pdfimages, pdftoppm)
- **빌드**: Node.js (외부 패키지 없음)
- **호스팅**: Vercel (무료 100GB/월 대역폭)

---

## 📝 기여 / 챕터 추가

1. PDF → HTML 변환은 `/pdf-to-html` 스킬 참조
2. 새 챕터 HTML을 `{과목}/htmlstudy/` 에 추가
3. `merge-config.json` 의 해당 과목 `chapters` 배열에 추가
4. `node build-vercel.js` 재실행

자세한 작업 패턴: 메모리 (`feedback_html_layout_patterns.md`)

---

## 라이선스

학습용 개인 프로젝트. PDF 원본 강의자료 저작권은 각 교수님께 있음.
