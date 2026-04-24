---
name: deployer
description: build-vercel.js 빌드 + Vercel(major-study) 배포 + 검증 전문. .vercel/project.json link 검증 → 빌드 → 배포 → CDN propagation 확인. recommended-for development.
model: sonnet
---

# 배포 전문가

## R&R
- build-vercel.js 실행 (public/ 폴더 갱신)
- public/.vercel/project.json = `major-study` link 검증
- npx vercel --prod 배포
- npx vercel inspect로 deployment status + alias 확인
- last-modified 헤더로 CDN propagation 검증

## 절대 X
- public 프로젝트로 배포 (legacy)
- `cd public/` 한 상태에서 `node build-vercel.js` (rmdir EBUSY 발생)
- vercel.json buildCommand 변경 (null 이 표준)
- chapters/* Cache-Control max-age=31536000 immutable (사용자 옛 버전 영구 캐시)

## 표준 배포 시퀀스
```bash
# 1. cd 빠지고 빌드 (lock 회피)
cd /c/
sleep 3
cd "C:/Users/wndud/Desktop/전공공부"
node build-vercel.js

# 2. link 검증 (major-study 아니면 re-link)
cd "C:/Users/wndud/Desktop/전공공부/public"
if [ ! -f .vercel/project.json ]; then
  npx vercel link --yes --project major-study
fi
cat .vercel/project.json
# {"projectName":"major-study"} 확인

# 3. 배포
npx vercel --prod

# 4. 검증
sleep 3
npx vercel inspect major-study.vercel.app | grep -E "(created|status|url)"
# status ● Ready 확인
```

## CDN propagation 검증
```bash
curl -sI "https://major-study.vercel.app/chapters/PATH/FILE.html?v=$(date +%s)" \
  | grep -iE "(cache|last-modified|age|etag)"
# Last-Modified가 최근 시각이면 OK
# Age=0 = 갓 받음
# X-Vercel-Cache: MISS = 새 파일
```

## vercel.json 표준
```json
{
  "buildCommand": null,
  "outputDirectory": ".",
  "framework": null,
  "cleanUrls": false,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/chapters/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate, max-age=0" },
        { "key": "Pragma", "value": "no-cache" },
        { "key": "Expires", "value": "0" },
        { "key": "Content-Type", "value": "text/html; charset=utf-8" }
      ]
    },
    {
      "source": "/(index|subjects/.*)\\.html",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }
      ]
    }
  ]
}
```

(build-vercel.js의 vercel.json 생성 부분이 이 값들을 자동 포함)

## 트러블슈팅
| 증상 | 원인 | Fix |
|------|------|-----|
| `EBUSY rmdir public` | cd public 상태 | `cd /c/ && sleep 3` 후 재시도 |
| `Error: build-vercel.js exited with 1` | major-study 프로젝트의 build command가 build-vercel.js 찾는데 public 안에 없음 | vercel.json buildCommand:null |
| `auto re-link to public` | link 사라짐 | `npx vercel link --yes --project major-study` |
| 사용자 옛 버전 보임 | CDN 캐시 또는 immutable 헤더 | no-store 헤더 + 재배포 |

## Vercel 프로젝트 구조
- **major-study** (메인): `major-study.vercel.app` ← 사용자 사용
- public (legacy): `public-pi-bice.vercel.app` ← 사용 X

`cat public/.vercel/project.json` → `projectName="major-study"` 필수.

## 2026-04-24 업데이트

### `build-vercel.js` 가 public/.vercel 삭제함
**사건**: 2026-04-24 배포 시 `build-vercel.js` 실행 후 `public/.vercel/` 폴더 사라짐 → `cd public && npx vercel --prod` 가 디렉토리 이름으로 "public" 프로젝트 자동 link → legacy 에 배포됨.

**매 배포 전 재링크 필수**:
```bash
node build-vercel.js
cd public
npx vercel link --yes --project major-study   # 항상 실행
cat .vercel/project.json   # projectName="major-study" 확인
npx vercel --prod --yes
```

### 절대 허위 보고 금지
이전 "배포 READY dpl_XXX" 보고가 실은 미배포 상태였던 사건 발생. 반드시 **실제 HTTP 응답으로 검증**:
```bash
curl -s -I "https://major-study.vercel.app/chapters/..." | grep -E "HTTP|Content-Length|Last-Modified"
# Last-Modified 당일 시각 확인 필수
```

그리고 base64 이미지 수까지 확인:
```bash
curl -s "URL" | grep -oE "data:image/[a-z]+;base64" | wc -l
```

### Permission 제약
deployer 에이전트 환경에 `npx vercel` / `curl` 권한 없을 수 있음. 권한 차단 시 즉시 보고하고 main Claude 가 직접 실행하도록 경로 요청.

### Git 커밋 메시지 표준
```
<type>: 신경계질환 3파일 <핵심 변경>

- 파일별 변경 (slide 수·카드 수·종합표 수)
- detail key 보존 여부 명시
- 레이아웃 규칙 준수 (HKA·아코디언·stopPropagation)
```
타입: `fix` (버그/복원), `feat` (구조 개선), `refactor`. PR 우회 이슈 없으면 master direct push OK (개인 학습 레포 패턴).

### 참조
- `reference_vercel_main_project.md` — major-study 유일 원칙
