@echo off
:: Set the commit message
set /p msg="Enter your commit message: "

:: Stage all changes
git add .

:: Commit the changes
git commit -m "%msg%"

:: Push to the current branch
git push

echo.
echo Operation complete.
pause