@echo off
REM Script de instalación completa para Que Comemos
REM Este script configura todo el proyecto desde cero

setlocal enabledelayedexpansion

echo ========================================
echo   Que Comemos - Instalación Completa
echo ========================================
echo.

REM Verificar que estamos en el directorio raíz
if not exist "client\" (
    echo [ERROR] Este script debe ejecutarse desde el directorio raíz del proyecto
    exit /b 1
)

if not exist "server\" (
    echo [ERROR] Este script debe ejecutarse desde el directorio raíz del proyecto
    exit /b 1
)

REM 1. Verificar Node.js y npm
echo ========================================
echo 1. Verificando Node.js y npm...
echo ========================================

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado
    echo.
    echo Por favor instala Node.js 18 o superior desde:
    echo https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detectado

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm no está instalado
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% detectado
echo.

REM 2. Instalar dependencias del cliente
echo ========================================
echo 2. Instalando dependencias del cliente...
echo ========================================

if exist "client\node_modules" (
    echo [ADVERTENCIA] node_modules del cliente ya existe, reinstalando...
    rmdir /s /q "client\node_modules"
)

cd client
echo [INFO] Ejecutando npm install en client\...
call npm install
if errorlevel 1 (
    echo [ERROR] Error al instalar dependencias del cliente
    cd ..
    exit /b 1
)
echo [OK] Dependencias del cliente instaladas correctamente
cd ..
echo.

REM 3. Instalar dependencias del servidor
echo ========================================
echo 3. Instalando dependencias del servidor...
echo ========================================

if exist "server\node_modules" (
    echo [ADVERTENCIA] node_modules del servidor ya existe, reinstalando...
    rmdir /s /q "server\node_modules"
)

cd server
echo [INFO] Ejecutando npm install en server\...
call npm install
if errorlevel 1 (
    echo [ERROR] Error al instalar dependencias del servidor
    cd ..
    exit /b 1
)
echo [OK] Dependencias del servidor instaladas correctamente
cd ..
echo.

REM 4. Configurar variables de entorno del servidor
echo ========================================
echo 4. Configurando variables de entorno del servidor...
echo ========================================

set SERVER_ENV=server\.env
set CREATE_SERVER_ENV=0

if exist "%SERVER_ENV%" (
    echo [ADVERTENCIA] El archivo server\.env ya existe
    set /p OVERWRITE_SERVER="¿Deseas sobrescribirlo? (s/N): "
    if /i "!OVERWRITE_SERVER!"=="s" (
        set CREATE_SERVER_ENV=1
    ) else (
        echo [INFO] Manteniendo el archivo .env existente
        echo [INFO] Verificando variables de entorno en server\.env...
        findstr /c:"CLERK_SECRET_KEY=sk_" "%SERVER_ENV%" >nul 2>&1
        if errorlevel 1 (
            echo [ADVERTENCIA] CLERK_SECRET_KEY no está configurada correctamente en server\.env
        ) else (
            echo [OK] CLERK_SECRET_KEY configurada
        )
        findstr /c:"CLERK_PUBLISHABLE_KEY=pk_" "%SERVER_ENV%" >nul 2>&1
        if errorlevel 1 (
            echo [ADVERTENCIA] CLERK_PUBLISHABLE_KEY no está configurada correctamente en server\.env
        ) else (
            echo [OK] CLERK_PUBLISHABLE_KEY configurada
        )
    )
) else (
    set CREATE_SERVER_ENV=1
)

if !CREATE_SERVER_ENV!==1 (
    (
        echo # Variables de entorno del servidor
        echo # Obtén estas claves desde tu dashboard de Clerk: https://dashboard.clerk.com
        echo.
        echo # Clave secreta de Clerk (requerida)
        echo CLERK_SECRET_KEY=sk_test_...
        echo.
        echo # Clave pública de Clerk (requerida)
        echo CLERK_PUBLISHABLE_KEY=pk_test_...
        echo.
        echo # Puerto del servidor (opcional, por defecto: 3001)
        echo PORT=3001
        echo.
        echo # URL del cliente (opcional, para CORS en producción)
        echo # CLIENT_URL=http://localhost:5173
    ) > "%SERVER_ENV%"
    echo [OK] Archivo server\.env creado
    echo [ADVERTENCIA] IMPORTANTE: Debes editar server\.env y agregar tus claves de Clerk
)
echo.

REM 5. Configurar variables de entorno del cliente
echo ========================================
echo 5. Configurando variables de entorno del cliente...
echo ========================================

set CLIENT_ENV=client\.env
set CREATE_CLIENT_ENV=0

if exist "%CLIENT_ENV%" (
    echo [ADVERTENCIA] El archivo client\.env ya existe
    set /p OVERWRITE_CLIENT="¿Deseas sobrescribirlo? (s/N): "
    if /i "!OVERWRITE_CLIENT!"=="s" (
        set CREATE_CLIENT_ENV=1
    ) else (
        echo [INFO] Manteniendo el archivo .env existente
        echo [INFO] Verificando variables de entorno en client\.env...
        findstr /c:"VITE_CLERK_PUBLISHABLE_KEY=pk_" "%CLIENT_ENV%" >nul 2>&1
        if errorlevel 1 (
            echo [ADVERTENCIA] VITE_CLERK_PUBLISHABLE_KEY no está configurada correctamente en client\.env
        ) else (
            echo [OK] VITE_CLERK_PUBLISHABLE_KEY configurada
        )
    )
) else (
    set CREATE_CLIENT_ENV=1
)

if !CREATE_CLIENT_ENV!==1 (
    (
        echo # Variables de entorno del cliente
        echo # Obtén esta clave desde tu dashboard de Clerk: https://dashboard.clerk.com
        echo.
        echo # Clave pública de Clerk (debe ser la misma que CLERK_PUBLISHABLE_KEY en server\.env)
        echo VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
        echo.
        echo # URL del servidor backend (se actualiza automáticamente por start.sh cuando se crea el túnel)
        echo # Por defecto usa localhost, pero start.sh lo actualizará con la URL del túnel de Cloudflare
        echo VITE_API_URL=http://localhost:3001
    ) > "%CLIENT_ENV%"
    echo [OK] Archivo client\.env creado
    echo [ADVERTENCIA] IMPORTANTE: Debes editar client\.env y agregar tu clave pública de Clerk
)
echo.

REM 6. Verificar/Descargar cloudflared (opcional)
echo ========================================
echo 6. Verificando cloudflared (opcional)...
echo ========================================

set CLOUDFLARED_DIR=client\cloudflared
set CLOUDFLARED_BINARY=cloudflared.exe

if exist "%CLOUDFLARED_DIR%\%CLOUDFLARED_BINARY%" (
    echo [OK] cloudflared encontrado en %CLOUDFLARED_DIR%\%CLOUDFLARED_BINARY%
) else (
    where cloudflared >nul 2>&1
    if errorlevel 1 (
        echo [ADVERTENCIA] cloudflared no encontrado
        echo.
        echo [INFO] cloudflared es opcional y se usa para crear túneles públicos durante el desarrollo
        set /p DOWNLOAD_CLOUDFLARED="¿Deseas descargar cloudflared ahora? (s/N): "
        if /i "!DOWNLOAD_CLOUDFLARED!"=="s" (
            echo [INFO] Descargando cloudflared para Windows...
            
            REM Crear directorio si no existe
            if not exist "%CLOUDFLARED_DIR%" mkdir "%CLOUDFLARED_DIR%"
            
            set CLOUDFLARED_URL=https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
            
            REM Intentar usar PowerShell para descargar
            powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%CLOUDFLARED_URL%' -OutFile '%CLOUDFLARED_DIR%\%CLOUDFLARED_BINARY%'}" >nul 2>&1
            
            if exist "%CLOUDFLARED_DIR%\%CLOUDFLARED_BINARY%" (
                echo [OK] cloudflared descargado correctamente
            ) else (
                echo [ADVERTENCIA] No se pudo descargar cloudflared automáticamente
                echo [INFO] Puedes descargarlo manualmente desde: https://github.com/cloudflare/cloudflared/releases
                echo [INFO] Guarda el archivo como: %CLOUDFLARED_DIR%\%CLOUDFLARED_BINARY%
            )
        ) else (
            echo [INFO] Omitiendo descarga de cloudflared
        )
    ) else (
        echo [OK] cloudflared encontrado en el sistema (PATH)
    )
)
echo.

REM 7. Crear directorios necesarios
echo ========================================
echo 7. Creando directorios necesarios...
echo ========================================

if not exist "server\db" (
    mkdir "server\db"
    echo [OK] Directorio server\db creado
) else (
    echo [INFO] Directorio server\db ya existe
)

if not exist "server\logs" (
    mkdir "server\logs"
    echo [OK] Directorio server\logs creado
) else (
    echo [INFO] Directorio server\logs ya existe
)

echo.

REM 8. Resumen final
echo ========================================
echo   Instalación Completada
echo ========================================
echo.
echo [OK] Todas las dependencias han sido instaladas
echo.
echo [ADVERTENCIA] PASOS IMPORTANTES ANTES DE INICIAR:
echo.
echo 1. Configura tus claves de Clerk:
echo    - Ve a https://dashboard.clerk.com
echo    - Crea una aplicación o usa una existente
echo    - Copia las claves a los archivos .env:
echo      • server\.env → CLERK_SECRET_KEY y CLERK_PUBLISHABLE_KEY
echo      • client\.env → VITE_CLERK_PUBLISHABLE_KEY (misma clave pública)
echo.
echo 2. Para iniciar el proyecto, ejecuta:
echo    start.sh
echo.
echo    O manualmente:
echo    cd server ^&^& npm run dev  (en una terminal)
echo    cd client ^&^& npm run dev  (en otra terminal)
echo.
echo 3. El script start.sh actualizará automáticamente
echo    client\.env con la URL del túnel de Cloudflare
echo.
echo ========================================
echo.

endlocal
pause

