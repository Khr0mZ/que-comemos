# Que Comemos - Servidor Backend

Servidor Express que gestiona los datos de la aplicación Que Comemos usando archivos JSON.

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (crear archivo `.env`):
```
CLERK_SECRET_KEY=tu_clave_secreta_de_clerk
CLERK_PUBLISHABLE_KEY=tu_clave_publica_de_clerk
CLIENT_URL=http://localhost:5173
PORT=3001
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Compilar para producción:
```bash
npm run build
npm start
```

## APIs

Todas las rutas requieren autenticación mediante token de Clerk en el header:
```
Authorization: Bearer <token>
```

### Ingredientes
- `GET /api/ingredients` - Obtener todos los ingredientes
- `POST /api/ingredients` - Guardar ingredientes

### Recetas
- `GET /api/recipes` - Obtener todas las recetas
- `POST /api/recipes` - Guardar recetas

### Lista de Compra
- `GET /api/shopping-list` - Obtener lista de compra
- `POST /api/shopping-list` - Guardar lista de compra

### Semana
- `GET /api/week` - Obtener datos de la semana
- `POST /api/week` - Guardar datos de la semana

## Estructura de Datos

Los datos se almacenan en `db/{userId}/`:
- `ingredients.json` - Lista de ingredientes del usuario
- `recipes.json` - Lista de recetas del usuario
- `shopping-list.json` - Lista de compra del usuario
- `week.json` - Planificación semanal del usuario

## Autenticación

El servidor usa Clerk para autenticación. El token JWT se verifica en cada petición y el `userId` se extrae del token para identificar al usuario.
