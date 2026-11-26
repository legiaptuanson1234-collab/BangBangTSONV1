@echo off
REM BangBang — ban tai ve: mo game bang may chu web cuc bo (localhost:8000).
REM KHONG mo truc tiep index.html: Chrome chan fetch() tu file:// nen game se bao
REM "Khong tai duoc du lieu game (assets/data2.json)" va dung lai.
REM LUU Y: tren may chua cai Python that, lenh "python" la shortcut Microsoft Store
REM — vi tri nay THUC THI van thanh cong (tra ve ma 0) nhung khong chay duoc
REM "http.server". Vi vay file nay kiem tra NOI DUNG cau --version phai bat dau
REM bang "Python <so ban" (chu ki hieu so), khong chi dung errorlevel. Uu tien
REM dung "py" (Python Launcher chinh thuc) neu co.
chcp 65001 >nul
title BangBang - Ban tai ve
cd /d "%~dp0"
set "USE="
for /f "tokens=*" %%v in ('py --version 2^>nul') do (
  echo %%v | findstr /r "^Python [0-9]" >nul
  if not errorlevel 1 set "USE=py"
)
if "%USE%"=="" for /f "tokens=*" %%v in ('python --version 2^>nul') do (
  echo %%v | findstr /r "^Python [0-9]" >nul
  if not errorlevel 1 set "USE=python"
)
if "%USE%"=="py" goto :run
if "%USE%"=="python" goto :run
echo May chua co Python that (chi co shortcut Microsoft Store) — dung may chu PowerShell co san cua Windows...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MO-GAME.ps1"
goto :eof
:run
echo Mo game BangBang (ban tai ve) tai http://localhost:8000/ bang %USE%...
start /min "BangBang Server" %USE% -m http.server 8000
timeout /t 2 /nobreak >nul
start http://localhost:8000/
echo Da mo trinh duyet. De DUNG game, dong cua so "BangBang Server".
