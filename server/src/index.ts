import 'dotenv/config'; // Cargar variables de entorno desde .env
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { clerkMiddleware, requireAuth } from './middleware/auth.js';
import ingredientsRoutes from './routes/ingredients.js';
import recipesRoutes from './routes/recipes.js';
import shoppingListRoutes from './routes/shopping-list.js';
import weekRoutes from './routes/week.js';
import syncRoutes from './routes/sync.js';
import { setupWebSocket } from './services/websocket.js';
import { ensureDbDirectory } from './utils/fileSystem.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // En producción, restringir a dominios específicos
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Hacer io disponible globalmente para el servicio de WebSocket
(global as any).io = io;

const PORT = process.env.PORT || 3001;

// Middleware
// Permitir CORS desde cualquier origen cuando se usa con túneles dinámicos
// En producción, deberías restringir esto a dominios específicos
const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173', /^https:\/\/.*\.trycloudflare\.com$/];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está permitido
    if (typeof allowedOrigins === 'string') {
      if (origin === allowedOrigins) return callback(null, true);
    } else if (Array.isArray(allowedOrigins)) {
      for (const allowed of allowedOrigins) {
        if (typeof allowed === 'string' && origin === allowed) {
          return callback(null, true);
        }
        if (allowed instanceof RegExp && allowed.test(origin)) {
          return callback(null, true);
        }
      }
    }
    
    callback(null, true); // Permitir todos los orígenes en desarrollo
  },
  credentials: true
}));
// Configurar límite de tamaño del body (aumentado para manejar muchas recetas)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk middleware para verificar autenticación (debe ir después de express.json)
app.use(clerkMiddleware);

// Asegurar que el directorio db existe
ensureDbDirectory();

// Rutas protegidas (requieren autenticación)
app.use('/api/ingredients', requireAuth, ingredientsRoutes);
app.use('/api/recipes', requireAuth, recipesRoutes);
app.use('/api/shopping-list', requireAuth, shoppingListRoutes);
app.use('/api/week', requireAuth, weekRoutes);
app.use('/api/sync', requireAuth, syncRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Configurar WebSocket
setupWebSocket(io);

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}`);
});

