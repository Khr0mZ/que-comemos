import { Server, Socket } from 'socket.io';
import { verifyToken } from '@clerk/backend';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY no está configurada. La autenticación WebSocket fallará.');
}

/**
 * Configurar WebSocket server con autenticación Clerk
 */
export function setupWebSocket(io: Server): void {
  // Middleware de autenticación para WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        console.error('WebSocket: No se proporcionó token');
        return next(new Error('No autenticado'));
      }

      if (!CLERK_SECRET_KEY) {
        console.error('WebSocket: CLERK_SECRET_KEY no está configurada');
        return next(new Error('No autenticado'));
      }

      // Verificar el token directamente con Clerk
      // El token puede venir con o sin el prefijo "Bearer "
      const tokenToVerify = typeof token === 'string' && token.startsWith('Bearer ') 
        ? token.substring(7) 
        : token;

      try {
        const sessionClaims = await verifyToken(tokenToVerify, {
          secretKey: CLERK_SECRET_KEY,
        });
        
        if (sessionClaims && sessionClaims.sub) {
          // Agregar userId al socket para uso posterior
          (socket as any).userId = sessionClaims.sub;
          next();
        } else {
          console.error('WebSocket: Token válido pero no se obtuvo userId');
          next(new Error('No autenticado'));
        }
      } catch (verifyError) {
        console.error('WebSocket: Error verificando token:', verifyError);
        next(new Error('No autenticado'));
      }
    } catch (error) {
      console.error('WebSocket: Error de autenticación:', error);
      next(new Error('No autenticado'));
    }
  });

  // Manejar conexiones
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    
    if (!userId) {
      console.error('WebSocket: Socket sin userId, desconectando');
      socket.disconnect();
      return;
    }

    // Unir al socket a una sala específica del usuario
    socket.join(`user:${userId}`);

    // Manejar errores
    socket.on('error', (error) => {
      console.error(`WebSocket: Error en socket de usuario ${userId}:`, error);
    });
  });
}

/**
 * Notificar a todos los clientes de un usuario sobre un cambio
 */
export function notifyUserChange(userId: string, dataType: string): void {
  const io = (global as any).io as Server | undefined;
  
  if (!io) {
    console.error('WebSocket: io no está disponible');
    return;
  }

  const message = {
    type: 'data-changed',
    dataType,
    timestamp: Date.now(),
  };
  
  // Enviar a todos los sockets en la sala del usuario
  io.to(`user:${userId}`).emit('data-changed', message);
}

