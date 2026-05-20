@echo off
cd /d "%~dp0"
echo.
echo  Starting Flux dev server...
echo  Open your browser at: http://localhost:5173
echo.
start "" "http://localhost:5173"
npm run dev