#!/bin/bash

echo "========================================"
echo " Cloudflare Tunnel para Que Comemos"
echo "========================================"
echo ""
echo "Iniciando túnel..."
echo ""
echo "IMPORTANTE: Asegúrate de que el servidor esté corriendo en otra terminal:"
echo "  npm run dev"
echo ""
echo "Presiona Ctrl+C para detener el túnel"
echo ""
echo "========================================"
echo ""

# Detectar el sistema operativo
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash, MSYS2, Cygwin)
    ./cloudflared/cloudflared.exe tunnel --url http://localhost:5173
else
    # Linux/Mac - intentar usar el ejecutable local o el del sistema
    if [ -f "./cloudflared/cloudflared" ]; then
        ./cloudflared/cloudflared tunnel --url http://localhost:5173
    elif [ -f "./cloudflared/cloudflared.exe" ]; then
        ./cloudflared/cloudflared.exe tunnel --url http://localhost:5173
    elif command -v cloudflared &> /dev/null; then
        cloudflared tunnel --url http://localhost:5173
    else
        echo "ERROR: cloudflared no encontrado."
        echo "Coloca cloudflared en la carpeta ./cloudflared/ o instálalo en el sistema."
        exit 1
    fi
fi

