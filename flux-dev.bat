@echo off
cd /d "%~dp0"
echo.
echo  Starting Flux dev server...
echo  Open your browser at: http://localhost:5173
echo.
start "" "http://localhost:5173"
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
