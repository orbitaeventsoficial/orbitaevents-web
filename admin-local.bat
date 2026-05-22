@echo off
title Orbita Events — Admin Local

:: Comprova si el port 3000 ja esta en us
netstat -an | find "0.0.0.0:3000" >nul 2>&1
if %errorlevel%==0 (
  echo El servidor ja esta en marxa. Obrint el navegador...
  timeout /t 1 >nul
  start http://localhost:3000/admin
  exit
)

echo Arrancant el servidor local...
echo Obre http://localhost:3000/admin quan aparegui "Ready"
echo (Tanca aquesta finestra per aturar el servidor)
echo.

:: Obre el navegador despres de 6 segons (temps per arrancar)
start /min cmd /c "timeout /t 6 >nul && start http://localhost:3000/admin"

:: Arranca el servidor (mantingut en primer pla)
cd /d "D:\orbitaevents"
pnpm run dev
