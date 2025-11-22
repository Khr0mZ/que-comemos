# Configuración de Túneles Cloudflare

Esta guía explica cómo configurar los túneles de Cloudflare para que la aplicación funcione correctamente con URLs dinámicas.

## 🚀 Configuración Automática (Recomendado)

El script `start-dev.sh` maneja automáticamente toda la configuración de túneles:

1. **Inicia el servidor backend** (puerto 3001)
2. **Crea un túnel Cloudflare para el servidor** automáticamente
3. **Detecta si el cliente está corriendo** y crea un túnel para él también
4. **Actualiza automáticamente** `client/.env` con la URL del túnel del servidor

**Uso:**

```bash
cd server
./start-dev.sh
```

En otra terminal, inicia el cliente:

```bash
cd client
npm run dev
```

El script `start-dev.sh` detectará automáticamente cuando el cliente esté corriendo y creará un túnel para él también. La URL pública del cliente se mostrará claramente en la consola.

## Configuración Manual (Solo si necesitas control total)

Si prefieres configurar los túneles manualmente:

### Opción 1: Túnel solo para el Cliente

Esta es la configuración más simple. El proxy de Vite redirige las peticiones `/api` al servidor backend local.

**Configuración:**

1. **Terminal 1 - Servidor Backend:**
   ```bash
   cd server
   npm run dev
   ```
   El servidor estará en `http://localhost:3001`

2. **Terminal 2 - Cliente:**
   ```bash
   cd client
   npm run dev
   ```
   El cliente estará en `http://localhost:5173`

3. **Terminal 3 - Túnel Cloudflare (solo cliente):**
   ```bash
   cd client
   ../client/cloudflared/cloudflared tunnel --url http://localhost:5173
   ```
   Esto expondrá el cliente a través de un túnel de Cloudflare (ej: `https://xxxxx.trycloudflare.com`)

**Cómo funciona:**
- El proxy de Vite en `vite.config.ts` redirige todas las peticiones `/api` a `http://localhost:3001`
- Cuando accedes desde el túnel, las peticiones `/api` se redirigen automáticamente al servidor backend local
- **Limitación**: Solo funciona si el servidor backend está corriendo en la misma máquina que el cliente

### Opción 2: Túneles Separados

Si necesitas que el servidor backend también sea accesible desde fuera de tu máquina local:

1. **Terminal 1 - Servidor Backend:**
   ```bash
   cd server
   npm run dev
   ```
   
2. **Terminal 2 - Túnel para el Servidor:**
   ```bash
   cd server
   ../client/cloudflared/cloudflared tunnel --url http://localhost:3001
   ```
   Esto generará una URL como `https://yyyyy.trycloudflare.com` para el servidor

3. **Terminal 3 - Cliente:**
   ```bash
   cd client
   npm run dev
   ```

4. **Terminal 4 - Túnel para el Cliente:**
   ```bash
   cd client
   ../client/cloudflared/cloudflared tunnel --url http://localhost:5173
   ```
   Esto generará una URL como `https://xxxxx.trycloudflare.com` para el cliente

5. **Configurar la URL del servidor en el cliente:**
   Crea un archivo `.env` en `client/`:
   ```
   VITE_API_URL=https://yyyyy.trycloudflare.com
   ```
   (Reemplaza `yyyyy` con la URL real del túnel del servidor)

### Opción 3: Túnel Unificado con Proxy Reverso (Avanzado)

Si quieres que ambos servicios estén en el mismo dominio:

1. Usa un proxy reverso como nginx o Caddy para enrutar:
   - `/` → cliente (puerto 5173)
   - `/api` → servidor backend (puerto 3001)

2. Expón el proxy reverso a través de un único túnel de Cloudflare

## Configuración Actual

La aplicación está configurada para usar **URLs relativas** por defecto, lo que significa:

- ✅ Funciona automáticamente con la Opción 1 (túnel solo cliente)
- ✅ No necesitas configurar `VITE_API_URL` si usas la Opción 1
- ✅ El proxy de Vite maneja las peticiones `/api` automáticamente
- ✅ El script `start-dev.sh` actualiza automáticamente `VITE_API_URL` cuando usa túneles separados

## Variables de Entorno

### Cliente (`client/.env`)
```env
# Opcional: Solo necesaria si usas la Opción 2
VITE_API_URL=https://tu-tunel-servidor.trycloudflare.com

# Requerida: Clave pública de Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Servidor (`server/.env`)
```env
# Requerida: Clave secreta de Clerk
CLERK_SECRET_KEY=sk_test_...

# Opcional: URL del cliente (para CORS)
CLIENT_URL=http://localhost:5173

# Opcional: Puerto del servidor
PORT=3001
```

## Notas Importantes

1. **En desarrollo local**: El proxy de Vite funciona perfectamente y no necesitas configurar `VITE_API_URL`

2. **Con túneles dinámicos**: Las URLs cambian cada vez que reinicias el túnel. Si usas la Opción 2, necesitarás actualizar `VITE_API_URL` cada vez.

3. **CORS**: El servidor está configurado para aceptar peticiones desde cualquier origen cuando se usa con túneles. En producción, deberías restringir esto.

4. **Seguridad**: Los túneles de Cloudflare son públicos por defecto. No uses esto para datos sensibles sin autenticación adecuada (que ya tienes con Clerk).

