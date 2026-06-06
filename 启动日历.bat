@echo off
chcp 65001 >nul
title 趣味日历

echo.
echo    🌸 趣味日历启动中...
echo.

cd /d "%~dp0www"
start http://localhost:8080
python -m http.server 8080
pause
