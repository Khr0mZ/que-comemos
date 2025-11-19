import { useUser } from '@clerk/clerk-react';

/**
 * Hook para obtener el ID del usuario actual de Clerk
 * Retorna null si el usuario no está autenticado
 */
export function useUserId(): string | null {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return null;
  }
  
  return user?.id || null;
}

