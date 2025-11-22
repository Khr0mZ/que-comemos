@echo off
setlocal EnableDelayedExpansion

:: =======================================================
:: CONFIGURACION
:: =======================================================
set "ESC=["
set "GREEN=%ESC%[32m"
set "YELLOW=%ESC%[33m"
set "RED=%ESC%[31m"
set "CYAN=%ESC%[36m"
set "NC=%ESC%[0m"

:: Limpiamos cualquier proceso de node/cloudflared previo para evitar conflictos
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

cls
echo =======================================================
echo  Que Comemos - Dashboard de Desarrollo
echo =======================================================
echo.
echo  [INFO] Iniciando servicios en segundo plano...
echo.

:: =======================================================
:: 1. VERIFICACIONES RAPIDAS
:: =======================================================
if not exist "client\" ( echo [ERROR] Falta carpeta client & pause & exit /b )
if not exist "server\" ( echo [ERROR] Falta carpeta server & pause & exit /b )

:: Detectar cloudflared
set "CLOUDFLARED_CMD="
if exist "client\cloudflared\cloudflared.exe" (
    set "CLOUDFLARED_CMD=client\cloudflared\cloudflared.exe"
) else (
    where cloudflared >nul 2>nul
    if !errorlevel! equ 0 set "CLOUDFLARED_CMD=cloudflared"
)

:: =======================================================
:: 2. INICIAR PROCESOS (MODO SILENCIOSO /B)
:: =======================================================

:: Iniciar Servidor (Background, sin ventana nueva)
echo  - Iniciando Backend (3001)...
cd server
:: start /B ejecuta en la MISMA ventana, pero en background.
start /B cmd /c "npm run dev > server.log 2>&1"
cd ..

:: Iniciar Cliente (Background, sin ventana nueva)
echo  - Iniciando Frontend (5173)...
cd client
start /B cmd /c "npm run dev > ..\server\client.log 2>&1"
cd ..

echo.
echo  Esperando arranque de servicios...
timeout /t 5 /nobreak >nul

:: =======================================================
:: 3. GESTION TUNELES (INVISIBLE)
:: =======================================================

if "%CLOUDFLARED_CMD%"=="" goto :Dashboard

echo  - Iniciando Tunel Servidor...
start /B cmd /c "%CLOUDFLARED_CMD% tunnel --url http://localhost:3001 > server\server-tunnel.log 2>&1"

:: Esperar URL Servidor
set "SERVER_URL="
set "RETRIES=0"
:LoopServer
set /a RETRIES+=1
if !RETRIES! geq 20 goto :StartClientTunnel
timeout /t 1 /nobreak >nul
for /f "usebackq tokens=*" %%A in (`powershell -NoProfile -Command "if (Test-Path 'server\server-tunnel.log') { Select-String -Path 'server\server-tunnel.log' -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | Select-Object -ExpandProperty Matches | Select-Object -ExpandProperty Value | Select-Object -First 1 }"`) do set "SERVER_URL=%%A"
if "!SERVER_URL!"=="" goto :LoopServer

:: Actualizar .env silenciosamente
powershell -NoProfile -Command "$path='client\.env'; $url='!SERVER_URL!'; if(-not (Test-Path $path)){New-Item -Path $path -ItemType File | Out-Null}; $content=Get-Content $path; if($content -match 'VITE_API_URL='){ (Get-Content $path) -replace 'VITE_API_URL=.*', ('VITE_API_URL='+$url) | Set-Content $path } else { Add-Content $path \"`nVITE_API_URL=$url\" }"

:: Reiniciar Cliente (Matar y re-lanzar en background)
echo  - Reiniciando cliente con nueva API URL...
taskkill /F /IM node.exe >nul 2>&1
cd server
start /B cmd /c "npm run dev > server.log 2>&1"
cd ..
cd client
start /B cmd /c "npm run dev > ..\server\client.log 2>&1"
cd ..

:StartClientTunnel
echo  - Iniciando Tunel Cliente...
start /B cmd /c "%CLOUDFLARED_CMD% tunnel --url http://localhost:5173 > server\client-tunnel.log 2>&1"

:: Esperar URL Cliente
set "CLIENT_URL="
set "RETRIES=0"
:LoopClient
set /a RETRIES+=1
if !RETRIES! geq 20 goto :Dashboard
timeout /t 1 /nobreak >nul
for /f "usebackq tokens=*" %%A in (`powershell -NoProfile -Command "if (Test-Path 'server\client-tunnel.log') { Select-String -Path 'server\client-tunnel.log' -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | Select-Object -ExpandProperty Matches | Select-Object -ExpandProperty Value | Select-Object -First 1 }"`) do set "CLIENT_URL=%%A"
if "!CLIENT_URL!"=="" goto :LoopClient

:: =======================================================
:: 4. DASHBOARD FINAL
:: =======================================================
:Dashboard
cls
echo =======================================================
echo  DESARROLLO ACTIVO - TODO EN ORDEN
echo =======================================================
echo.
echo  [LOCAL]
echo    - Frontend: http://localhost:5173
echo    - Backend:  http://localhost:3001
echo.
if not "!SERVER_URL!"=="" (
    echo  [PUBLICO]
    echo    - API: !SERVER_URL!
)
if not "!CLIENT_URL!"=="" (
    echo    - WEB: !CLIENT_URL!
)
echo.
echo =======================================================
echo  REGISTROS (Logs):
echo  Los procesos corren en segundo plano. Para ver errores,
echo  revisa los archivos en la carpeta /server.
echo =======================================================
echo.
echo  [IMPORTANTE] Para cerrar todo correctamente:
echo  Presiona ENTER en esta ventana. NO cierres con la X.
echo.
set /p DUMMY=Presiona ENTER para detener y salir...

:: =======================================================
:: 5. LIMPIEZA TOTAL
:: =======================================================
echo.
echo Deteniendo todos los procesos...

:: Al usar /B, los procesos estan ligados al CMD principal.
:: Matamos node y cloudflared forzosamente para asegurar limpieza.
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

echo Listo.
timeout /t 1 >nul
exit
