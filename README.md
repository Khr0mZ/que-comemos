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

### Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd que-comemos
```

2. Instala las dependencias:

```bash
npm install
```

3. Inicia el servidor de desarrollo:

```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:5173`

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

- **React 19** + **TypeScript**
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Dexie.js** - IndexedDB wrapper para almacenamiento local
- **i18next** - Internacionalización
- **TheMealDB API** - Base de datos de recetas externas
- **Ollama** - Modelo de IA local para generación de recetas

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

- Los datos se almacenan localmente en IndexedDB (solo en tu dispositivo)
- Las recetas externas de TheMealDB se pueden guardar localmente para acceso offline
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
