#!/bin/bash

# Script de instalación completa para Que Comemos
# Este script configura todo el proyecto desde cero

echo "========================================"
echo "  Que Comemos - Instalación Completa"
echo "========================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verificar que estamos en el directorio raíz
if [ ! -d "client" ] || [ ! -d "server" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# 1. Verificar Node.js y npm
echo "========================================"
echo "1. Verificando Node.js y npm..."
echo "========================================"

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo ""
    echo "Por favor instala Node.js 18 o superior desde:"
    echo "https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Se recomienda Node.js 18 o superior. Versión actual: $(node -v)"
else
    print_success "Node.js $(node -v) detectado"
fi

if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

print_success "npm $(npm -v) detectado"
echo ""

# 2. Instalar dependencias del cliente
echo "========================================"
echo "2. Instalando dependencias del cliente..."
echo "========================================"

if [ -d "client/node_modules" ]; then
    print_warning "node_modules del cliente ya existe, reinstalando..."
    rm -rf client/node_modules
fi

cd client
print_info "Ejecutando npm install en client/..."
if npm install; then
    print_success "Dependencias del cliente instaladas correctamente"
else
    print_error "Error al instalar dependencias del cliente"
    cd ..
    exit 1
fi
cd ..
echo ""

# 3. Instalar dependencias del servidor
echo "========================================"
echo "3. Instalando dependencias del servidor..."
echo "========================================"

if [ -d "server/node_modules" ]; then
    print_warning "node_modules del servidor ya existe, reinstalando..."
    rm -rf server/node_modules
fi

cd server
print_info "Ejecutando npm install en server/..."
if npm install; then
    print_success "Dependencias del servidor instaladas correctamente"
else
    print_error "Error al instalar dependencias del servidor"
    cd ..
    exit 1
fi
cd ..
echo ""

# 4. Configurar variables de entorno del servidor
echo "========================================"
echo "4. Configurando variables de entorno del servidor..."
echo "========================================"

SERVER_ENV="server/.env"

if [ -f "$SERVER_ENV" ]; then
    print_warning "El archivo server/.env ya existe"
    read -p "¿Deseas sobrescribirlo? (s/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_info "Manteniendo el archivo .env existente"
    else
        create_server_env=true
    fi
else
    create_server_env=true
fi

if [ "$create_server_env" = true ]; then
    cat > "$SERVER_ENV" << 'EOF'
# Variables de entorno del servidor
# Obtén estas claves desde tu dashboard de Clerk: https://dashboard.clerk.com

# Clave secreta de Clerk (requerida)
CLERK_SECRET_KEY=sk_test_...

# Clave pública de Clerk (requerida)
CLERK_PUBLISHABLE_KEY=pk_test_...

# Puerto del servidor (opcional, por defecto: 3001)
PORT=3001

# URL del cliente (opcional, para CORS en producción)
# CLIENT_URL=http://localhost:5173
EOF
    print_success "Archivo server/.env creado"
    print_warning "IMPORTANTE: Debes editar server/.env y agregar tus claves de Clerk"
else
    print_info "Verificando variables de entorno en server/.env..."
    
    if ! grep -q "CLERK_SECRET_KEY=sk_" "$SERVER_ENV" 2>/dev/null; then
        print_warning "CLERK_SECRET_KEY no está configurada correctamente en server/.env"
    else
        print_success "CLERK_SECRET_KEY configurada"
    fi
    
    if ! grep -q "CLERK_PUBLISHABLE_KEY=pk_" "$SERVER_ENV" 2>/dev/null; then
        print_warning "CLERK_PUBLISHABLE_KEY no está configurada correctamente en server/.env"
    else
        print_success "CLERK_PUBLISHABLE_KEY configurada"
    fi
fi
echo ""

# 5. Configurar variables de entorno del cliente
echo "========================================"
echo "5. Configurando variables de entorno del cliente..."
echo "========================================"

CLIENT_ENV="client/.env"

if [ -f "$CLIENT_ENV" ]; then
    print_warning "El archivo client/.env ya existe"
    read -p "¿Deseas sobrescribirlo? (s/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_info "Manteniendo el archivo .env existente"
    else
        create_client_env=true
    fi
else
    create_client_env=true
fi

if [ "$create_client_env" = true ]; then
    cat > "$CLIENT_ENV" << 'EOF'
# Variables de entorno del cliente
# Obtén esta clave desde tu dashboard de Clerk: https://dashboard.clerk.com

# Clave pública de Clerk (debe ser la misma que CLERK_PUBLISHABLE_KEY en server/.env)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# URL del servidor backend (se actualiza automáticamente por start.sh cuando se crea el túnel)
# Por defecto usa localhost, pero start.sh lo actualizará con la URL del túnel de Cloudflare
VITE_API_URL=http://localhost:3001
EOF
    print_success "Archivo client/.env creado"
    print_warning "IMPORTANTE: Debes editar client/.env y agregar tu clave pública de Clerk"
else
    print_info "Verificando variables de entorno en client/.env..."
    
    if ! grep -q "VITE_CLERK_PUBLISHABLE_KEY=pk_" "$CLIENT_ENV" 2>/dev/null; then
        print_warning "VITE_CLERK_PUBLISHABLE_KEY no está configurada correctamente en client/.env"
    else
        print_success "VITE_CLERK_PUBLISHABLE_KEY configurada"
    fi
fi
echo ""

# 6. Verificar/Descargar cloudflared (opcional)
echo "========================================"
echo "6. Verificando cloudflared (opcional)..."
echo "========================================"

CLOUDFLARED_PATH=""
CLOUDFLARED_DIR="client/cloudflared"

# Detectar sistema operativo
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    CLOUDFLARED_BINARY="cloudflared.exe"
    OS_TYPE="windows"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    CLOUDFLARED_BINARY="cloudflared"
    OS_TYPE="darwin"
else
    CLOUDFLARED_BINARY="cloudflared"
    OS_TYPE="linux"
fi

# Verificar si cloudflared ya existe
if [ -f "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" ]; then
    print_success "cloudflared encontrado en $CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
elif command -v cloudflared &> /dev/null; then
    print_success "cloudflared encontrado en el sistema (PATH)"
else
    print_warning "cloudflared no encontrado"
    echo ""
    print_info "cloudflared es opcional y se usa para crear túneles públicos durante el desarrollo"
    read -p "¿Deseas descargar cloudflared ahora? (s/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        print_info "Descargando cloudflared para $OS_TYPE..."
        
        # Crear directorio si no existe
        mkdir -p "$CLOUDFLARED_DIR"
        
        # URLs de descarga según el sistema operativo
        if [ "$OS_TYPE" = "windows" ]; then
            CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
            if command -v curl &> /dev/null; then
                curl -L -o "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" "$CLOUDFLARED_URL"
            elif command -v wget &> /dev/null; then
                wget -O "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" "$CLOUDFLARED_URL"
            else
                print_error "curl o wget no están disponibles. Por favor descarga cloudflared manualmente desde:"
                echo "  $CLOUDFLARED_URL"
                echo "  Y guárdalo en: $CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
            fi
        elif [ "$OS_TYPE" = "darwin" ]; then
            # macOS - detectar arquitectura
            if [[ $(uname -m) == "arm64" ]]; then
                CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64"
            else
                CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64"
            fi
            if command -v curl &> /dev/null; then
                curl -L -o "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" "$CLOUDFLARED_URL"
                chmod +x "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
            elif command -v wget &> /dev/null; then
                wget -O "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" "$CLOUDFLARED_URL"
                chmod +x "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
            else
                print_error "curl o wget no están disponibles. Por favor descarga cloudflared manualmente desde:"
                echo "  $CLOUDFLARED_URL"
                echo "  Y guárdalo en: $CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
            fi
        else
            # Linux - detectar arquitectura
            ARCH=$(uname -m)
            if [[ "$ARCH" == "x86_64" ]]; then
                CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
            elif [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
                CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
            else
                CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
            fi
            if command -v curl &> /dev/null; then
                curl -L -o "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" "$CLOUDFLARED_URL"
                chmod +x "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
            elif command -v wget &> /dev/null; then
                wget -O "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" "$CLOUDFLARED_URL"
                chmod +x "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
            else
                print_error "curl o wget no están disponibles. Por favor descarga cloudflared manualmente desde:"
                echo "  $CLOUDFLARED_URL"
                echo "  Y guárdalo en: $CLOUDFLARED_DIR/$CLOUDFLARED_BINARY"
            fi
        fi
        
        if [ -f "$CLOUDFLARED_DIR/$CLOUDFLARED_BINARY" ]; then
            print_success "cloudflared descargado correctamente"
        else
            print_warning "No se pudo descargar cloudflared automáticamente"
            print_info "Puedes descargarlo manualmente desde: https://github.com/cloudflare/cloudflared/releases"
        fi
    else
        print_info "Omitiendo descarga de cloudflared"
    fi
fi
echo ""

# 7. Crear directorios necesarios
echo "========================================"
echo "7. Creando directorios necesarios..."
echo "========================================"

# Crear directorio de base de datos del servidor si no existe
if [ ! -d "server/db" ]; then
    mkdir -p server/db
    print_success "Directorio server/db creado"
else
    print_info "Directorio server/db ya existe"
fi

# Crear directorio de logs si no existe
if [ ! -d "server/logs" ]; then
    mkdir -p server/logs
    print_success "Directorio server/logs creado"
else
    print_info "Directorio server/logs ya existe"
fi

echo ""

# 8. Resumen final
echo "========================================"
echo "  Instalación Completada"
echo "========================================"
echo ""
print_success "Todas las dependencias han sido instaladas"
echo ""
print_warning "PASOS IMPORTANTES ANTES DE INICIAR:"
echo ""
echo "1. Configura tus claves de Clerk:"
echo "   - Ve a https://dashboard.clerk.com"
echo "   - Crea una aplicación o usa una existente"
echo "   - Copia las claves a los archivos .env:"
echo "     • server/.env → CLERK_SECRET_KEY y CLERK_PUBLISHABLE_KEY"
echo "     • client/.env → VITE_CLERK_PUBLISHABLE_KEY (misma clave pública)"
echo ""
echo "2. Para iniciar el proyecto, ejecuta:"
echo "   ${GREEN}./start.sh${NC}"
echo ""
echo "   O manualmente:"
echo "   ${GREEN}cd server && npm run dev${NC}  (en una terminal)"
echo "   ${GREEN}cd client && npm run dev${NC}  (en otra terminal)"
echo ""
echo "3. El script start.sh actualizará automáticamente"
echo "   client/.env con la URL del túnel de Cloudflare"
echo ""
echo "========================================"
echo ""

