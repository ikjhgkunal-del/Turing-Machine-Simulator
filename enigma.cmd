@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0.tools\node-v22.23.4-win-x64\node.exe" set "PATH=%~dp0.tools\node-v22.23.4-win-x64;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12 or newer is required. Install Node.js LTS and reopen this terminal.
  exit /b 1
)
if "%~1"=="install" goto install
if "%~1"=="test" goto test
if "%~1"=="build" goto build
if "%~1"=="preview" goto preview
if "%~1"=="test:browser" goto browser
if "%~1"=="dev" goto dev
if "%~1"=="" goto dev
echo Usage: enigma.cmd [install^|dev^|test^|build^|preview^|test:browser]
exit /b 1
:install
call npm.cmd install
exit /b %errorlevel%
:test
call npm.cmd test
exit /b %errorlevel%
:build
call npm.cmd run build
exit /b %errorlevel%
:preview
call npm.cmd run preview
exit /b %errorlevel%
:browser
call npm.cmd run test:browser
exit /b %errorlevel%
:dev
call npm.cmd run dev
exit /b %errorlevel%
