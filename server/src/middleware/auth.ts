import { clerkMiddleware as clerkExpressMiddleware, authenticateRequest } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

// Configurar Clerk con ambas claves desde variables de entorno
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY no está configurada. La autenticación fallará.');
  console.error('   Agrega CLERK_SECRET_KEY=sk_test_... en server/.env');
}

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('❌ CLERK_PUBLISHABLE_KEY no está configurada. La autenticación fallará.');
  console.error('   Agrega CLERK_PUBLISHABLE_KEY=pk_test_... en server/.env');
  throw new Error('CLERK_PUBLISHABLE_KEY es requerida. Configúrala en server/.env');
}

// Extender el tipo Request para incluir userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      auth?: () => {
        userId?: string;
        sessionId?: string;
      } | null;
    }
  }
}

/**
 * Middleware para verificar el token de Clerk usando @clerk/express
 */
export const clerkMiddleware = clerkExpressMiddleware({
  secretKey: CLERK_SECRET_KEY,
  publishableKey: CLERK_PUBLISHABLE_KEY,
});

/**
 * Middleware para requerir autenticación
 * Maneja autenticación especial para SSE que no soporta headers personalizados
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Verificar si el usuario está autenticado (ya procesado por clerkMiddleware)
  const auth = req.auth?.();
  if (auth?.userId) {
    req.userId = auth.userId;
    next();
    return;
  }

  // Para SSE, verificar token en query params (ya que EventSource no soporta headers personalizados)
  if ((req.path === '/sse' || req.path.endsWith('/sse')) && req.query.token) {
    const token = req.query.token as string;
    
    // Modificar el header de autorización del request original
    const originalAuth = req.headers.authorization;
    req.headers.authorization = `Bearer ${token}`;

    try {
      // Usar authenticateRequest de @clerk/express para verificar el token
      // authenticateRequest modifica el request directamente
      await authenticateRequest(req, {
        secretKey: CLERK_SECRET_KEY,
        publishableKey: CLERK_PUBLISHABLE_KEY,
      });

      const authAfterVerify = req.auth?.();
      if (authAfterVerify?.userId) {
        req.userId = authAfterVerify.userId;
        next();
        return;
      } else {
        console.error('SSE: Token verificado pero no se obtuvo userId');
        // Restaurar header original
        req.headers.authorization = originalAuth;
      }
    } catch (error) {
      console.error('SSE: Error verificando token:', error);
      // Restaurar header original en caso de error
      req.headers.authorization = originalAuth;
    }
  }

  res.status(401).json({ error: 'No autenticado' });
}
