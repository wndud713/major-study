# Vercel 배포 가이드

`build-vercel.js` 실행 결과 `public/` 디렉토리를 Vercel에 배포한다. 두 가지 방법 중 택일.

---

## 방법 A: GitHub 연동 (권장 — 자동 배포 영구)

한 번 설정 후 `git push` 만으로 자동 재배포.

### Step 1 — public/ 빌드 결과를 git에 포함시킬지 결정

**옵션 1 (간단)**: `public/` 도 git push → Vercel은 그대로 호스팅
- 장점: Vercel 빌드 단계 없음 (즉시 배포)
- 단점: repo 크기 +163MB

**옵션 2 (깔끔)**: `public/` 은 .gitignore + GitHub Actions 또는 Vercel 빌드로 생성
- 장점: repo 가벼움
- 단점: 빌드 step 설정 필요

**옵션 1 선택 시**:
```bash
cd C:/Users/wndud/Desktop/전공공부
# .gitignore 에 public/ 있다면 제거
git add public/ build-vercel.js
git commit -m "Vercel 분할 배포: 28챕터 + 인덱스"
git push origin master
```

**옵션 2 선택 시**:
```bash
# .gitignore 에 public/ 추가 (이미 있을 수 있음)
echo "public/" >> .gitignore
git add build-vercel.js .gitignore
git commit -m "Vercel 빌드 스크립트 추가"
git push origin master
```

### Step 2 — Vercel 대시보드 설정

1. https://vercel.com/new 접속
2. GitHub 인증 → `wndud713/major-study` repo 선택
3. **Configure Project**:
   - Framework Preset: **Other**
   - Root Directory: `.` (기본)
   - Build Command: `node build-vercel.js` (옵션 2) 또는 비워두기 (옵션 1)
   - Output Directory: `public`
   - Install Command: 비워두기 (의존성 없음)
4. **Deploy** 클릭
5. 1~2분 후 URL 발급: `https://major-study-{random}.vercel.app/`

### Step 3 — 도메인 변경 (선택)
- Project Settings → Domains
- `major-study.vercel.app` 같은 짧은 이름으로 변경

### 자동 재배포
이후 master 브랜치 push 시 Vercel 자동 빌드·배포.
- 챕터 수정 → `git push` → 1~2분 후 라이브

---

## 방법 B: Vercel CLI (수동 배포)

### 첫 실행 (인증)
```bash
cd C:/Users/wndud/Desktop/전공공부/public
npx vercel login
# 이메일 입력 → 메일 받은 링크 클릭 → 터미널 자동 인증
```

### 배포
```bash
cd C:/Users/wndud/Desktop/전공공부/public
npx vercel --prod
# 첫 실행: 프로젝트명·organization 선택
# 이후: 자동 배포 + URL 출력
```

### 재배포
챕터 수정 후:
```bash
cd C:/Users/wndud/Desktop/전공공부
node build-vercel.js          # public/ 재생성
cd public
npx vercel --prod             # 재배포
```

---

## 확인

배포 후:
- 인덱스: `https://{your-url}/`
- 과목별: `https://{your-url}/subjects/clinical.html`
- 챕터: `https://{your-url}/chapters/임상의사결정/임상의사결정개론.html`

---

## 무료 한도 (Vercel Hobby)

| 항목 | 한도 |
|------|------|
| Fast Data Transfer (대역폭) | 100 GB / 월 |
| Edge Requests | 1M / 월 |
| 프로젝트 크기 | 1GB 권장 (현재 163MB OK) |

**예상 사용량**: 한 사람 평균 5챕터 × 6MB = 30MB → **3,300명/월** 가능.

대시보드에서 사용량 모니터링: https://vercel.com/dashboard → Usage

---

## 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| 배포 실패 "size limit" | 100MB 단일 파일 한계 | 통합본 파일 제외 (현재 분할이라 해당 없음) |
| 인덱스 404 | output directory 잘못 | `public` 으로 설정 |
| 챕터 한글 URL 깨짐 | URL 인코딩 | 브라우저 자동 처리, 문제 X |
| 캐시 오래됨 | Vercel CDN | 강제 새로고침 (Ctrl+Shift+R) 또는 5분 대기 |
