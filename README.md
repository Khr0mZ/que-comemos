# 🍽️ ¿Qué Comemos?

Una aplicación web progresiva (PWA) para ayudarte a decidir qué cocinar cada día basándote en los ingredientes que tienes en casa.

## ✨ Características

- **Gestión de Inventario**: Mantén un registro de todos los ingredientes que tienes en tu despensa
- **Recetario Personal**: Guarda tus recetas favoritas con ingredientes e instrucciones
- **Búsqueda de Recetas**: Busca recetas en tu recetario o en la base de datos externa de TheMealDB
- **Generación con IA**: Genera recetas creativas usando Ollama con GPT-OSS-20B (local)
- **Lista de Compra**: Automáticamente detecta qué ingredientes faltan para cada receta
- **Funciona Offline**: Todas las funciones principales funcionan sin conexión a internet
- **Bilingüe**: Soporte para español e inglés

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ y npm
- Ollama instalado con el modelo `gpt-oss-20b` (opcional, solo para generación de recetas con IA)
- Clerk account (para autenticación)

### Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd que-comemos
```

2. Instala las dependencias del cliente:

```bash
cd client
npm install
```

3. Instala las dependencias del servidor:

```bash
cd ../server
npm install
```

4. Configura las variables de entorno del servidor:

```bash
cd server
cp .env.example .env
# Edita .env y agrega tu CLERK_SECRET_KEY
```

5. Configura las variables de entorno del cliente:

```bash
cd ../client
# Crea un archivo .env con:
# VITE_CLERK_PUBLISHABLE_KEY=tu_clave_publica_de_clerk
```

6. **Inicio del servidor backend:**

   ```bash
   cd server
   ./start-dev.sh
   ```

   Este script iniciará automáticamente:

   - Servidor backend (puerto 3001)
   - Túnel Cloudflare (URL pública)
   - **Actualizará automáticamente** `client/.env` con la URL del túnel

   El script detectará la URL del túnel y la agregará/actualizará en `client/.env` automáticamente.

7. **Inicio del cliente frontend (en otra terminal):**

   ```bash
   cd client
   npm run dev
   ```

   El script del servidor detectará automáticamente cuando el cliente esté corriendo y creará un túnel para él también.

8. Abre tu navegador en la URL del túnel del cliente (mostrada por el script) o `http://localhost:5173`

### Configuración de Ollama (Opcional)

Para usar la generación de recetas con IA:

1. Instala [Ollama](https://ollama.ai/)
2. Descarga el modelo GPT-OSS-20B:

```bash
ollama pull gpt-oss-20b
```

3. Asegúrate de que Ollama esté corriendo en `http://localhost:11434`

Si Ollama está en otra URL o puerto, puedes modificar `src/services/ollama.ts` para cambiar la URL base.

## 📱 Uso

### Inventario

- Añade ingredientes con nombre, categoría, cantidad y unidad
- Busca ingredientes en tu inventario local
- Activa "Incluir ingredientes globales" para buscar también en la base de datos de TheMealDB
- Edita o elimina ingredientes según necesites

### Recetas

- Crea recetas personalizadas con ingredientes e instrucciones
- Busca recetas en tu recetario local
- Activa "Incluir resultados de internet" para buscar en TheMealDB
- Guarda recetas externas en tu recetario para acceso offline

### Vista Principal - ¿Qué comemos?

1. Selecciona una receta específica, una categoría, o ingredientes disponibles
2. Haz clic en "Buscar Recetas" para ver sugerencias
3. O usa "Generar Receta con IA" para crear algo nuevo
4. Cada receta muestra automáticamente qué ingredientes faltan en tu inventario

## 🛠️ Tecnologías

### Cliente

- **React 19** + **TypeScript**
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Clerk** - Autenticación de usuarios
- **i18next** - Internacionalización
- **TheMealDB API** - Base de datos de recetas externas
- **Ollama** - Modelo de IA local para generación de recetas

### Servidor

- **Express** - Framework web para Node.js
- **TypeScript** - Lenguaje de programación
- **Clerk SDK** - Autenticación y gestión de usuarios
- **File System** - Almacenamiento de datos en archivos JSON

## 📦 Build para Producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`, listos para desplegar.

## 🎨 Características de PWA

La aplicación puede instalarse como PWA en dispositivos móviles y escritorio:

- **Offline-first**: Funciona sin conexión a internet
- **Service Worker**: Cachea recursos para carga rápida
- **Manifest**: Permite instalación como app nativa
- **Responsive**: Diseño adaptado para móvil y escritorio

## 📝 Notas

- **Almacenamiento**: Los datos se almacenan en el servidor backend en archivos JSON por usuario (`db/{userId}/`)
- **Guardado optimista**: Los cambios se reflejan inmediatamente en la UI y luego se guardan en el servidor en segundo plano
- **Carga automática**: Cuando un usuario inicia sesión, sus datos se cargan automáticamente desde el servidor
- **Aislamiento de datos**: Cada usuario solo puede acceder a sus propios datos gracias a la autenticación con Clerk
- **Túneles dinámicos**: El script `start-dev.sh` crea automáticamente un túnel público de Cloudflare para compartir la aplicación
- **Sin recargas**: El servidor backend gestiona los datos sin causar recargas de página
- Las recetas externas de TheMealDB se pueden guardar en tu recetario personal
- La generación con IA requiere Ollama corriendo localmente
- La API de TheMealDB es gratuita pero tiene límites (considera obtener una API key propia para producción)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🙏 Agradecimientos

- [TheMealDB](https://www.themealdb.com/) por la API de recetas
- [Ollama](https://ollama.ai/) por el modelo de IA local
- La comunidad de React y Vite por las herramientas increíbles
