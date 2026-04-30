# 📡 PDF 자동 변환 파이프라인

Google Drive 입력 폴더에 PDF 추가 → 자동 변환·배포·커밋.

## 흐름

```
[외부 기기에서 PDF 업로드]
    ↓ Drive 클라우드
[PC: G:\내 드라이브\전공공부\입력대기\새파일.pdf]
    ↓ Drive Desktop sync (~10초~수분)
[chokidar watcher 감지 + 안정성 대기 30초]
    ↓
[claude CLI 헤드리스 호출 → html-lead 워크플로]
    ↓ pdf-converter agent
    ↓ table-designer agent
    ↓ html-debugger agent
    ↓ deployer agent (build-vercel.js + Vercel + curl 검증)
    ↓ git commit + push
[처리완료 → G:\내 드라이브\전공공부\처리완료\]
```

## 파일명 규칙

`{subject-id}_{챕터명}.pdf`

| Prefix | 과목 |
|---|---|
| `clinical_*` | 임상의사결정 |
| `neuro-motor_*` | 신경계운동치료학 |
| `neuro-disease_*` | 신경계질환별물리치료 |
| `adl_*` | 기능훈련(ADL) |
| `sports_*` | 스포츠물리치료학 |
| `clinical-seminar_*` | 임상세미나 |

**예시:**
- `clinical_제3장_DMD.pptx.pdf` → 임상의사결정 / DMD
- `neuro-motor_보바스.pdf` → 신경계운동치료학 / 보바스
- `sports_Ch8_스포츠손상.pdf` → 스포츠물리치료학 / Ch8_스포츠손상

prefix 없으면 처리실패 폴더로 이동.

## 1회 설정

```bash
cd C:\Users\wndud\Desktop\전공공부
npm install
```

## 실행

### 콘솔 창 띄움 (테스트·디버깅)
```bash
npm run watch
# 또는
tools\auto-pipeline\start-watcher.bat
```

### Silent 백그라운드 (PC 부팅 시 자동)

**시작프로그램 등록**:
1. `Win + R` → `shell:startup` 입력 → 시작프로그램 폴더 열림
2. `tools\auto-pipeline\start-watcher-silent.vbs` 바로가기 만들어 복사
3. PC 재부팅 → 자동 실행

**Task Scheduler 등록 (권장)**:
1. `taskschd.msc` 실행
2. "기본 작업 만들기"
3. 트리거: "로그온할 때"
4. 동작: `wscript.exe "C:\Users\wndud\Desktop\전공공부\tools\auto-pipeline\start-watcher-silent.vbs"`
5. "사용자가 로그온하지 않은 경우에도 실행" + "최고 권한으로 실행" 체크

## 모니터링

- **로그**: `tools\auto-pipeline\logs\pipeline.log`
- **stdout (silent)**: `tools\auto-pipeline\logs\stdout.log`
- **상태**: `tools\auto-pipeline\state.json` (처리완료/진행중)
- **처리완료 PDF**: `G:\내 드라이브\전공공부\처리완료\` (timestamp prefix)
- **실패 PDF**: `G:\내 드라이브\전공공부\처리실패\` (실패 사유 suffix)

## 주의사항

### PC 절전 모드
- **절전(Sleep)**: USB·네트워크 이벤트로 깨어남 — 작동 OK
- **최대 절전 모드 / 종료**: 변환 중단. catchup 로직으로 부팅 후 미처리 PDF 자동 재시도.

### Drive Desktop 로그인
- 가끔 재로그인 요구. 1주일에 1회 PC 직접 확인.

### 변환 비용
- Claude Opus 4.7 = $5/$25 per 1M tokens. PDF 1개 변환 ~ $0.5~2 (대략).

### 중단·재시작
- watcher 중단해도 processed 파일은 state.json 에 기록 → 재시작 시 catchup 재처리 X.
- inFlight 상태로 중단 시 다음 부팅에서 재처리 (안전).

## 디버깅

### 수동 테스트
```bash
# 단일 PDF 직접 테스트
cp test.pdf "G:\내 드라이브\전공공부\입력대기\clinical_test.pdf"
# → watcher 가 감지·변환 시도
```

### 처리 강제 재시도
```bash
# state.json 에서 해당 파일명 entry 삭제
node -e "const fs=require('fs'); const p='tools/auto-pipeline/state.json'; const s=JSON.parse(fs.readFileSync(p)); delete s.processed['파일명.pdf']; fs.writeFileSync(p, JSON.stringify(s,null,2));"
# 처리완료 폴더에서 입력대기로 복사 → 재감지
```

### claude CLI 검증
```bash
claude --version
# 2.1.123+ 필요
```

## 안전장치

- ✅ 안정성 체크 (Drive sync 완료 대기)
- ✅ 중복 처리 방지 (state.json 기반)
- ✅ inFlight 락 (동시 실행 방지)
- ✅ 실패 시 자동 분리 (처리실패 폴더)
- ✅ catchup (재부팅 후 놓친 파일 처리)
- ✅ 로그 영속화 (장애 분석 가능)

## 비활성화

```json
// config.json
"deploy": { "skipDeploy": true, "skipCommit": true }
// 변환만 하고 배포·커밋 X
```

## 향후 확장 (선택)

- **Slack/Telegram 알림** (config.notify.webhookUrl)
- **Phase 2 마이그레이션**: Drive Watch API → GitHub Actions (PC 의존성 제거)
- **이미지 사전 검증**: 변환 전 PDF page count / 텍스트 추출 가능 여부 확인
