@echo off
chcp 65001 >nul
title 🌸 趣味日历

echo.
echo    🌸 正在启动趣味日历...
echo    ────────────────────────
echo.
echo    日历会在浏览器里自动打开~
echo    关掉这个窗口就会停止服务。
echo.
echo    手机上打开: 在同一个 WiFi 下
echo    用手机浏览器访问下面的地址 👇
echo.

REM 获取本机 IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo    📱 手机访问: http://%LOCAL_IP%:8080
echo    💻 电脑访问: http://localhost:8080
echo.

REM 启动 Python 服务器（从 www 目录）
cd www
start http://localhost:8080
python -m http.server 8080

pause
