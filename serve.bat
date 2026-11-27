@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo   Toko Kriya Sidoarjo - server lokal
echo   Buka di browser: http://localhost:8000
echo   Tekan Ctrl+C untuk menghentikan server.
echo ============================================================
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8000
) else (
  python -m http.server 8000
)
