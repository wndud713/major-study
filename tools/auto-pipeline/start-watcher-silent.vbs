' 백그라운드 silent 실행 (콘솔 창 안 띄움)
' 시작프로그램 폴더(shell:startup)에 이 .vbs 바로가기 등록 시 부팅 후 자동 실행
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\wndud\Desktop\전공공부"
WshShell.Run "cmd /c node tools\auto-pipeline\watcher.js >> tools\auto-pipeline\logs\stdout.log 2>&1", 0, False
