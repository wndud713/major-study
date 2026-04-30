@echo off
REM PDF → HTML 자동 변환 watcher 부팅 시 자동 실행 스크립트
REM Windows Task Scheduler 등록 또는 시작프로그램에 추가하여 사용

cd /d C:\Users\wndud\Desktop\전공공부

REM 의존성 설치 확인
if not exist node_modules\chokidar (
  echo [setup] chokidar 설치
  call npm install
)

REM watcher 실행 (콘솔 띄움)
node tools\auto-pipeline\watcher.js
pause
