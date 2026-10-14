@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================================
echo   مزامنة - تشغيل التطبيق
echo ============================================================
echo.
echo المجلد: %CD%
echo.
echo جاري تشغيل الخادم...
echo.

REM افتح المتصفح بعد 3 ثوان
start "" cmd /c "timeout /t 3 >nul && start http://localhost:8000"

REM شغّل Python
python server.py

pause