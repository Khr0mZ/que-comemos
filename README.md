# 🍽️ ¿Qué Comemos?

Una aplicación web progresiva (PWA) para ayudarte a planificar y gestionar tus comidas semanales basándote en los ingredientes que tienes en casa.

## ✨ Características

### 📋 Gestión de Datos

- **Inventario Personal**: Mantén un registro completo de todos los ingredientes en tu despensa con categorías y medidas (cantidad + unidad en un solo campo, ej: "2 kg", "500 ml", "3 unidades")
- **Recetario Personal**: Guarda tus recetas favoritas con ingredientes, instrucciones paso a paso, imágenes, videos y más
- **Recetas Bilingües**: Cada receta puede tener nombre e instrucciones en español e inglés, mostrándose automáticamente según tu idioma preferido
- **Ordenamiento Inteligente**: Todas las listas (recetas, ingredientes) se ordenan alfabéticamente según el idioma seleccionado

### 🗓️ Planificación Semanal

- **Vista Semanal**: Planifica tus comidas para toda la semana (lunes a domingo) en una tabla visual
- **Comida y Cena**: Organiza tanto el almuerzo como la cena para cada día
- **Gestión Visual**: Interfaz intuitiva tipo tabla para ver y gestionar toda tu semana de un vistazo
- **Añadir Recetas**: Desde la página de detalles de una receta, puedes añadirla directamente a cualquier día y comida de la semana
- **Ver Detalles**: Haz clic en cualquier receta en la planificación para ver sus detalles completos
- **Eliminación Rápida**: Elimina recetas de días específicos con un solo clic desde los chips
- **Marcado de Completado**: Las recetas se pueden marcar como completadas directamente en la planificación (visualmente diferenciadas con color verde)
- **Vaciar Semana**: Botón para limpiar toda la planificación de una vez

### 🛒 Lista de Compra Inteligente

- **Detección Automática**: Detecta automáticamente qué ingredientes faltan para las recetas planificadas
- **Agrupación por Receta**: Los ingredientes se agrupan por receta para facilitar la compra
- **Orden por Prioridad**: Las recetas se ordenan según su aparición en la semana (primero las del lunes comida, luego lunes cena, martes comida, etc.)
- **Contador de Instancias**: Muestra cuántas veces aparece cada receta en la semana (solo recetas no completadas)
- **Ingredientes Sueltos**: Añade ingredientes individuales sin asociarlos a una receta
- **Marcado de Comprados**: Al eliminar un ingrediente de la lista de compra, se añade automáticamente al inventario
- **Expansión/Colapso**: Expande o colapsa cada receta para ver/ocultar sus ingredientes

### 👨‍🍳 Página de Cocina

- **Recetas Listas**: Muestra solo las recetas que tienen todos los ingredientes disponibles y que tienen al menos una instancia no completada en la semana
- **Gestión de Inventario**: Ajusta las medidas de ingredientes directamente desde la página de cocina mientras cocinas
- **Vista de Ingredientes Disponibles**: Ve qué ingredientes del inventario se están usando en cada receta
- **Marcado de Completado**: Marca las recetas como completadas una por una según las cocines (marca la primera instancia no completada)
- **Eliminación Automática**: Las recetas se eliminan automáticamente de la lista de compra cuando completas todas sus instancias
- **Navegación Automática**: Al completar una receta, te redirige automáticamente a la planificación semanal

### 🔍 Búsqueda y Filtrado

- **Búsqueda de Recetas**: Busca recetas por nombre (según el idioma seleccionado), categoría, área geográfica o tags
- **Filtros Múltiples**: Combina varios filtros (categoría, área, tags, ingredientes) para encontrar exactamente lo que buscas
- **Filtro de Recetas Internas**: Opción para mostrar solo las recetas creadas por ti
- **Búsqueda de Ingredientes**: Busca ingredientes en tu inventario o en la base de datos global de ingredientes
- **Scroll Infinito**: Carga automática de más resultados al hacer scroll (30 elementos por página)
- **Receta Aleatoria**: Botón para navegar a una receta aleatoria de tu recetario

### 🌐 Internacionalización

- **Bilingüe Completo**: Interfaz completamente traducida al español e inglés
- **Detección Automática**: Detecta automáticamente el idioma del navegador al iniciar
- **Cambio Dinámico**: Cambia el idioma en cualquier momento y toda la aplicación se actualiza instantáneamente
- **Contenido Multilingüe**: Las recetas pueden tener contenido en ambos idiomas, mostrándose según tu preferencia
- **Ordenamiento por Idioma**: Todas las listas se reordenan automáticamente cuando cambias el idioma

### 💾 Tecnología y Rendimiento

- **PWA Offline-First**: Funciona completamente sin conexión a internet
- **Guardado Optimista**: Los cambios se reflejan inmediatamente en la UI
- **Sincronización en Tiempo Real**: WebSockets para sincronización automática entre dispositivos
- **Almacenamiento por Usuario**: Cada usuario tiene sus propios datos aislados y seguros
- **Service Worker**: Cachea recursos para carga rápida y funcionamiento offline

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ y npm
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
# Edita .env y agrega tu
# CLERK_SECRET_KEY=tu_clave_secreta_de_clerk
# CLERK_PUBLISHABLE_KEY=tu_clave_publica_de_clerk
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
   ./run.sh
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

## 📱 Uso

### 🏠 Vista Principal - Planificación Semanal

La página principal (`/`) muestra una tabla semanal donde puedes:

1. **Ver Planificación**: Visualiza todas tus comidas planificadas para la semana en una tabla con días (lunes a domingo) y tipos de comida (almuerzo y cena)
2. **Añadir Recetas**:
   - Haz clic en una celda vacía para navegar al recetario y seleccionar una receta
   - O ve a los detalles de una receta y usa el botón "Confirmar Receta" para añadirla a la semana
3. **Ver Detalles**: Haz clic en cualquier chip de receta para ver sus detalles completos
4. **Eliminar Recetas**: Haz clic en la X de cualquier chip para eliminar esa receta del día específico
5. **Marcar Completadas**: Las recetas completadas se muestran en verde y se pueden marcar directamente desde la planificación
6. **Vaciar Semana**: Usa el botón "🗑️ Vaciar Semana" para limpiar toda la planificación de una vez

### 📦 Inventario (Mi Despensa)

- **Añadir Ingredientes**: Usa el botón "➕" para añadir nuevos ingredientes con nombre (búsqueda en base de datos global), categoría y medida (ej: "2 kg", "500 ml", "3 unidades")
- **Búsqueda Inteligente**: Busca ingredientes en tu inventario. Los resultados incluyen búsqueda en español e inglés
- **Búsqueda Global**: Al buscar, puedes encontrar ingredientes de la base de datos global que aún no están en tu inventario
- **Filtro por Categoría**: Filtra ingredientes por categoría (verduras, frutas, carne, lácteos, cereales, especias, bebidas, otros)
- **Filtro de Faltantes**: Activa "Solo los que no tengo" para ver solo ingredientes sin medida o con medida "0"
- **Edición Rápida**: Haz clic en el botón de editar (✏️) para modificar medidas o eliminar ingredientes
- **Añadir a Lista de Compra**: Desde el inventario puedes añadir ingredientes directamente a tu lista de compra con una medida específica
- **Scroll Infinito**: Carga automática de más ingredientes al hacer scroll (30 por página)
- **Vaciar Despensa**: Botón para eliminar todos los ingredientes del inventario

### 📖 Recetario

- **Crear Recetas**: Haz clic en "➕ Crear Receta" para añadir nuevas recetas personalizadas
- **Búsqueda de Texto**: Busca recetas por nombre (según el idioma seleccionado), tags, categoría o área
- **Filtros Avanzados**:
  - Por categoría (Beef, Chicken, Dessert, etc.)
  - Por área geográfica (Spanish, Italian, Mexican, etc.)
  - Por tags (vegan, vegetarian, etc.)
  - Por ingredientes disponibles en tu inventario
- **Filtro de Recetas Internas**: Activa "Solo mis recetas" para ver solo las recetas que has creado tú
- **Recetas Bilingües**: Al crear/editar recetas, puedes añadir nombre e instrucciones en español e inglés. El formulario muestra solo el campo del idioma actual
- **Vista de Detalles**: Haz clic en cualquier receta para ver todos sus detalles:
  - Nombre (según idioma)
  - Imagen
  - Categoría, área y tags
  - Lista de ingredientes (ordenada alfabéticamente según idioma)
  - Instrucciones paso a paso (según idioma)
  - Video de YouTube (si está disponible)
  - Enlace a fuente original
- **Añadir a Semana**: Desde los detalles de una receta, usa "Confirmar Receta" para añadirla a la planificación semanal
- **Edición**: Edita recetas creadas localmente (botón "Editar Receta")
- **Eliminación**: Elimina recetas individuales o todas las recetas
- **Restaurar Recetas**: Restaura las recetas originales del archivo `recipes.json`
- **Receta Aleatoria**: Botón "🎲 Sorpréndeme" para navegar a una receta aleatoria
- **Scroll Infinito**: Carga automática de más recetas al hacer scroll (30 por página)

### 🛒 Lista de Compra

- **Vista Automática**: Se genera automáticamente basándose en las recetas planificadas en la semana
- **Dos Secciones**:
  - **Ingredientes Sueltos**: Ingredientes añadidos manualmente sin asociar a una receta
  - **Por Receta**: Ingredientes agrupados por cada receta planificada
- **Orden Inteligente**: Las recetas se ordenan según su aparición en la semana (lunes comida → lunes cena → martes comida → etc.)
- **Contador de Instancias**: Muestra cuántas veces aparece cada receta en la semana (solo recetas no completadas)
- **Expansión/Colapso**: Expande o colapsa cada receta para ver/ocultar sus ingredientes faltantes
- **Gestión de Ingredientes**:
  - Elimina ingredientes individuales de una receta
  - Al eliminar un ingrediente, se añade automáticamente al inventario con la medida especificada
- **Eliminar Receta Completa**: Elimina toda una receta de la lista de compra (también la elimina de la planificación semanal)
- **Nombres Bilingües**: Los nombres de las recetas se muestran según el idioma seleccionado

### 👨‍🍳 A los Fogones

- **Recetas Disponibles**: Solo muestra recetas que:
  - Tienen todos los ingredientes necesarios disponibles en el inventario
  - Tienen al menos una instancia no completada en la planificación semanal
- **Contador de Instancias**: Muestra cuántas veces aparece cada receta en la semana
- **Gestión de Inventario**:
  - Ve qué ingredientes del inventario se están usando en cada receta
  - Ajusta las medidas de ingredientes usados directamente desde la página mientras cocinas
  - Confirma los cambios para actualizar el inventario
- **Vista de Receta**: Expande cada receta para ver:
  - Imagen de la receta
  - Lista completa de ingredientes con medidas
  - Instrucciones paso a paso (según idioma)
- **Marcado de Completado**:
  - Marca cada receta como completada cuando termines de cocinarla
  - Marca la primera instancia no completada de la receta (en orden: lunes comida → lunes cena → martes comida → etc.)
  - Al completar todas las instancias de una receta, se elimina automáticamente de la lista de compra
- **Navegación Automática**: Al completar una receta, te redirige automáticamente a la planificación semanal

### 🔐 Autenticación

- **Inicio de Sesión**: Usa Clerk para autenticación segura
- **Registro**: Crea una cuenta nueva desde la página de autenticación
- **Protección de Rutas**: Todas las páginas excepto `/auth` requieren autenticación
- **Gestión de Usuario**: Botón de usuario en la barra de navegación para gestionar tu cuenta

## 🛠️ Tecnologías

### Cliente

- **React 19** + **TypeScript** - Framework y lenguaje
- **Vite** - Build tool y dev server ultrarrápido
- **React Router** - Navegación SPA
- **Material-UI (MUI)** - Componentes de interfaz modernos y responsive
- **Clerk** - Autenticación de usuarios segura
- **i18next** + **React i18next** - Internacionalización completa (ES/EN)
- **Workbox** - Service Worker para PWA offline

### Servidor

- **Express** - Framework web para Node.js
- **TypeScript** - Lenguaje de programación tipado
- **Clerk SDK** - Autenticación y gestión de usuarios
- **WebSockets** - Sincronización en tiempo real entre dispositivos
- **File System** - Almacenamiento de datos en archivos JSON por usuario
- **Cloudflare Tunnels** - Túneles públicos para desarrollo y testing

## 📦 Build para Producción

```bash
cd client
npm run build
```

Los archivos se generarán en la carpeta `dist/`, listos para desplegar.

## 🎨 Características de PWA

La aplicación puede instalarse como PWA en dispositivos móviles y escritorio:

- **Offline-first**: Funciona sin conexión a internet
- **Service Worker**: Cachea recursos para carga rápida
- **Manifest**: Permite instalación como app nativa
- **Responsive**: Diseño adaptado para móvil y escritorio con navegación inferior en móvil y superior en desktop

## 📝 Notas Técnicas

### Almacenamiento y Datos

- **Almacenamiento por Usuario**: Los datos se almacenan en el servidor backend en archivos JSON por usuario (`db/{userId}/`)
- **Estructura de Datos**: Cada usuario tiene sus propios archivos:
  - `ingredients.json` - Inventario personal
  - `recipes.json` - Recetario personal
  - `shopping-list.json` - Lista de compra (con `generalItems` y `recipeLists`)
  - `week.json` - Planificación semanal (estructura por días y tipos de comida)
- **Aislamiento de Datos**: Cada usuario solo puede acceder a sus propios datos gracias a la autenticación con Clerk
- **Guardado Optimista**: Los cambios se reflejan inmediatamente en la UI y luego se guardan en el servidor en segundo plano
- **Carga Automática**: Cuando un usuario inicia sesión, sus datos se cargan automáticamente desde el servidor

### Sincronización

- **WebSockets**: El servidor usa WebSockets para notificar cambios en tiempo real a todos los dispositivos del usuario
- **Sin Recargas**: El servidor backend gestiona los datos sin causar recargas de página
- **Sincronización Multi-dispositivo**: Los cambios se sincronizan automáticamente entre todos los dispositivos donde tengas la app abierta

### Desarrollo

- **Túneles Dinámicos**: El script `start-dev.sh` crea automáticamente túneles públicos de Cloudflare para compartir la aplicación
- **Hot Reload**: Cambios en el código se reflejan automáticamente sin recargar la página
- **TypeScript**: Todo el código está tipado para mayor seguridad y mejor experiencia de desarrollo

### Características de Recetas

- **Recetas Bilingües**: Cada receta tiene `nameES`/`nameEN` e `instructionsES`/`instructionsEN`
- **Identificación**: Las recetas se identifican por `nameES` (con fallback a `nameEN`)
- **Ordenamiento Dinámico**: Las recetas e ingredientes se ordenan alfabéticamente según el idioma seleccionado
- **Recetas Internas**: Las recetas creadas localmente se marcan como `internal: true`
- **Datos de Recetas**: Cada receta puede tener:
  - Nombre (bilingüe)
  - Categoría y área geográfica
  - Tags
  - Lista de ingredientes con medidas
  - Instrucciones paso a paso (bilingües)
  - URL de imagen
  - URL de video de YouTube
  - URL de fuente original

### Características de Ingredientes

- **Base de Datos Global**: Hay una base de datos global de ingredientes con nombres en español e inglés
- **Medida Única**: Cada ingrediente tiene un solo campo `measure` que combina cantidad y unidad (ej: "2 kg")
- **Categorías**: Los ingredientes se organizan en categorías (verduras, frutas, carne, lácteos, cereales, especias, bebidas, otros)
- **Búsqueda Bilingüe**: La búsqueda funciona en ambos idiomas simultáneamente

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

- La comunidad de React y Vite por las herramientas increíbles
- Material-UI por los componentes de interfaz
- Clerk por la autenticación segura
