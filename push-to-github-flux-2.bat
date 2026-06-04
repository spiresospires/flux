@echo off
setlocal

:: Set the commit message
set /p msg="Enter your commit message: "

if "%msg%"=="" (
  echo Commit message is required.
  pause
  exit /b 1
)

:: Stage all changes
git add .

:: Commit the changes
git commit -m "%msg%"
if errorlevel 1 (
  echo Commit failed or no changes to commit.
  pause
  exit /b 1
)

:: Push current HEAD to the flux-2 branch on origin (spiresospires/flux)
git push origin HEAD:flux-2
if errorlevel 1 (
  echo Push failed.
  pause
  exit /b 1
)

echo.
echo Operation complete. Pushed to origin/flux-2.
pause
