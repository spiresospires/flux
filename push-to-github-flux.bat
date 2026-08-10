@echo off
:: Set the commit message
set /p msg="Enter your commit message: "

:: Stage all changes
git add .

:: Commit the changes
git commit -m "%msg%"

:: Stop here if the commit did not happen. Without this guard the script pushed and
:: printed "Operation complete." even when the pre-commit hook aborted the commit —
:: reporting success for work that was never committed. A non-zero exit here also
:: covers the ordinary "nothing to commit" case.
if errorlevel 1 goto :failed

:: Push to the current branch
git push
if errorlevel 1 goto :failed

echo.
echo Operation complete.
pause
exit /b 0

:failed
echo.
echo ============================================================
echo  NOT PUSHED - the commit or push did not succeed.
echo  Read the output above before re-running.
echo.
echo  If it says "Failed to start threads worker", that is the
echo  known vitest worker-start flake, not a test failure - see
echo  docs\quality-gates.md. Re-running usually clears it.
echo ============================================================
pause
exit /b 1
