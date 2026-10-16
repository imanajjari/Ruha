@echo off
cd /d "%~dp0"
where py >nul 2>nul && (start "RUHA" http://127.0.0.1:8000 && py -m http.server 8000) || (start "RUHA" http://127.0.0.1:8000 && python -m http.server 8000)
