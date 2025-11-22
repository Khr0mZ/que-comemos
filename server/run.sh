#!/bin/bash

# Script para iniciar servidor backend y túnel automáticamente

echo "========================================"
echo "  Que Comemos - Servidor Backend"
echo "========================================"
echo ""
echo "Este script iniciará:"
echo "  1. Servidor Backend (puerto 3001)"
echo "  2. Túnel Cloudflare para el servidor (URL pública)"
echo "  3. Túnel Cloudflare para el cliente (si está corriendo en puerto 5173)"
echo ""
echo "Presiona Ctrl+C para detener todo"
echo "========================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}Deteniendo procesos...${NC}"
    kill $SERVER_PID $SERVER_TUNNEL_PID $CLIENT_TUNNEL_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verificar que estamos en el directorio server
if [ ! -f "package.json" ]; then
    echo "Error: Este script debe ejecutarse desde el directorio server/"
    exit 1
fi

# Verificar dependencias
echo -e "${YELLOW}Verificando dependencias...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del servidor..."
    npm install
fi

# Verificar cloudflared
CLOUDFLARED_PATH=""
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    if [ -f "../client/cloudflared/cloudflared.exe" ]; then
        CLOUDFLARED_PATH="../client/cloudflared/cloudflared.exe"
    fi
else
    if [ -f "../client/cloudflared/cloudflared" ]; then
        CLOUDFLARED_PATH="../client/cloudflared/cloudflared"
    elif command -v cloudflared &> /dev/null; then
        CLOUDFLARED_PATH="cloudflared"
    fi
fi

if [ -z "$CLOUDFLARED_PATH" ]; then
    echo -e "${YELLOW}Advertencia: cloudflared no encontrado. Los túneles no se iniciarán.${NC}"
    SERVER_TUNNEL_PID=""
    CLIENT_TUNNEL_PID=""
else
    echo -e "${GREEN}✓ cloudflared encontrado${NC}"
fi

# Iniciar servidor backend
echo ""
echo -e "${GREEN}Iniciando servidor backend...${NC}"
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Esperar a que el servidor esté listo
echo "Esperando a que el servidor esté listo..."
sleep 3

# Verificar que el servidor esté corriendo
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Error: El servidor no pudo iniciarse. Revisa server.log"
    exit 1
fi

echo -e "${GREEN}✓ Servidor backend iniciado (PID: $SERVER_PID)${NC}"
echo "Servidor: http://localhost:3001"

# Función para actualizar el .env del cliente con la URL del túnel
update_client_env() {
    local tunnel_url=$1
    local client_env="../client/.env"
    
    # Verificar que el directorio client existe
    if [ ! -d "../client" ]; then
        echo -e "${YELLOW}Advertencia: Directorio client/ no encontrado${NC}"
        return 1
    fi
    
    # Crear el archivo .env si no existe
    if [ ! -f "$client_env" ]; then
        touch "$client_env"
        echo -e "${GREEN}✓ Creado archivo client/.env${NC}"
    fi
    
    # Verificar si VITE_API_URL ya existe en el archivo (con o sin espacios)
    if grep -qE "^[[:space:]]*VITE_API_URL[[:space:]]*=" "$client_env"; then
        # Actualizar la línea existente
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS usa una sintaxis diferente para sed
            sed -i '' "s|^[[:space:]]*VITE_API_URL[[:space:]]*=.*|VITE_API_URL=$tunnel_url|" "$client_env"
        else
            # Linux y Git Bash en Windows
            sed -i "s|^[[:space:]]*VITE_API_URL[[:space:]]*=.*|VITE_API_URL=$tunnel_url|" "$client_env"
        fi
        echo -e "${GREEN}✓ Actualizado VITE_API_URL=$tunnel_url en client/.env${NC}"
    else
        # Agregar la nueva línea al final del archivo
        # Asegurarse de que haya una línea en blanco antes si el archivo no está vacío
        if [ -s "$client_env" ]; then
            # Verificar si el archivo termina con nueva línea
            if [ "$(tail -c 1 "$client_env" 2>/dev/null)" != "" ]; then
                echo "" >> "$client_env"
            fi
        fi
        echo "" >> "$client_env"
        echo "# URL del servidor backend (actualizado automáticamente por start-dev.sh)" >> "$client_env"
        echo "VITE_API_URL=$tunnel_url" >> "$client_env"
        echo -e "${GREEN}✓ Agregado VITE_API_URL=$tunnel_url a client/.env${NC}"
    fi
}

# Función para detectar URL del túnel desde un archivo de log
detect_tunnel_url() {
    local log_file=$1
    local tunnel_url=""
    local max_attempts=15
    local attempt=0
    
    while [ -z "$tunnel_url" ] && [ $attempt -lt $max_attempts ]; do
        sleep 2
        if [ -f "$log_file" ]; then
            # Buscar la URL del túnel en diferentes formatos posibles
            tunnel_url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$log_file" | head -1)
            
            if [ -z "$tunnel_url" ]; then
                tunnel_url=$(grep -oE '\| https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$log_file" | grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | head -1)
            fi
            
            if [ -z "$tunnel_url" ]; then
                tunnel_url=$(grep -i 'trycloudflare.com' "$log_file" | grep -oE 'https://[^[:space:]]+\.trycloudflare\.com' | head -1)
            fi
        fi
        attempt=$((attempt + 1))
    done
    
    echo "$tunnel_url"
}

# Iniciar túnel del servidor si está disponible
if [ -n "$CLOUDFLARED_PATH" ]; then
    echo ""
    echo -e "${GREEN}Iniciando túnel Cloudflare para el servidor...${NC}"
    sleep 2
    
    # Iniciar el túnel del servidor
    $CLOUDFLARED_PATH tunnel --url http://localhost:3001 > server-tunnel.log 2>&1 &
    SERVER_TUNNEL_PID=$!
    
    # Esperar y buscar la URL del túnel del servidor
    echo "Esperando a que el túnel del servidor se establezca..."
    SERVER_TUNNEL_URL=$(detect_tunnel_url "server-tunnel.log")
    
    if [ -n "$SERVER_TUNNEL_URL" ]; then
        echo -e "${GREEN}✓ Túnel del servidor iniciado: $SERVER_TUNNEL_URL${NC}"
        
        # Actualizar el .env del cliente automáticamente
        update_client_env "$SERVER_TUNNEL_URL"
    else
        echo -e "${YELLOW}Advertencia: No se pudo detectar la URL del túnel del servidor${NC}"
        echo "Revisa server-tunnel.log para ver la URL manualmente"
    fi
    
    # Verificar si el cliente está corriendo en el puerto 5173
    echo ""
    echo "Verificando si el cliente está corriendo..."
    sleep 2
    
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Cliente detectado en puerto 5173${NC}"
        echo -e "${GREEN}Iniciando túnel Cloudflare para el cliente...${NC}"
        
        # Iniciar el túnel del cliente
        $CLOUDFLARED_PATH tunnel --url http://localhost:5173 > client-tunnel.log 2>&1 &
        CLIENT_TUNNEL_PID=$!
        
        # Esperar y buscar la URL del túnel del cliente
        echo "Esperando a que el túnel del cliente se establezca..."
        CLIENT_TUNNEL_URL=$(detect_tunnel_url "client-tunnel.log")
        
        if [ -n "$CLIENT_TUNNEL_URL" ]; then
            echo ""
            echo ""
            echo "╔════════════════════════════════════════════════════════════╗"
            echo "║                                                            ║"
            echo "║  ${GREEN}✓ TÚNEL DEL CLIENTE INICIADO${NC}                              ║"
            echo "║                                                            ║"
            echo "║  ${GREEN}URL PÚBLICA PARA USUARIOS:${NC}                                ║"
            echo "║                                                            ║"
            echo "║  ${GREEN}$CLIENT_TUNNEL_URL${NC}  ║"
            echo "║                                                            ║"
            echo "║  Comparte esta URL con los usuarios para acceder          ║"
            echo "║  a la aplicación                                           ║"
            echo "║                                                            ║"
            echo "╚════════════════════════════════════════════════════════════╝"
            echo ""
            echo ""
        else
            echo -e "${YELLOW}Advertencia: No se pudo detectar la URL del túnel del cliente${NC}"
            echo "Revisa client-tunnel.log para ver la URL manualmente"
        fi
    else
        echo -e "${YELLOW}Cliente no detectado en puerto 5173${NC}"
        echo "Inicia el cliente con: cd ../client && npm run dev"
        echo "Luego reinicia este script o espera unos segundos y el túnel se creará automáticamente"
    fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}Servidor backend corriendo!${NC}"
echo ""
echo "Servidor local: http://localhost:3001"
if [ -n "$SERVER_TUNNEL_URL" ]; then
    echo "Servidor público: $SERVER_TUNNEL_URL"
fi
echo ""
if [ -n "$CLIENT_TUNNEL_URL" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🌐 URL PÚBLICA PARA USUARIOS:${NC}"
    echo ""
    echo -e "${GREEN}$CLIENT_TUNNEL_URL${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
fi
echo "Logs:"
echo "  - Servidor:        tail -f server.log"
if [ -n "$SERVER_TUNNEL_PID" ]; then
    echo "  - Túnel servidor: tail -f server-tunnel.log"
fi
if [ -n "$CLIENT_TUNNEL_PID" ]; then
    echo "  - Túnel cliente:  tail -f client-tunnel.log"
fi
echo ""
echo "Presiona Ctrl+C para detener todo"
echo "========================================"

# Mantener el script corriendo
wait

