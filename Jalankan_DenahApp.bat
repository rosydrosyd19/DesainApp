@echo off
title DenahApp - CAD & Infrastruktur IT Dual Monitor
cd /d "%~dp0"
echo ========================================================
echo   MENJALANKAN DENAHAPP (CAD + DUAL MONITOR SUPPORT)
echo ========================================================
echo Pastikan Apache dan MySQL di XAMPP Control Panel sudah AKTIF!
echo.
echo Membuka browser http://localhost:5173 ...
start http://localhost:5173
echo.
echo Memulai server backend dan frontend...
npm run dev
pause
