@echo off
title Barbershop ERP - Dev Environment

cd /d "%~dp0"

echo Starting Backend (port 3001)...
start "Barbershop-Backend" cmd /c "cd /d "%~dp0backend" && npm run start:dev"

echo Waiting 5s for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend (port 3000)...
start "Barbershop-Frontend" cmd /c "cd /d "%~dp0frontend" && npx next dev -p 3000"

echo.
echo ========================================
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:3000
echo  Login:    http://localhost:3000/login
echo ========================================
echo.
echo Close this window to stop both servers.
pause
