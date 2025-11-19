import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { storage } from '../services/storage';

/**
 * Componente que inicializa el userId en storage cuando Clerk carga
 */
export default function UserInitializer() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Usuario autenticado: establecer userId
        storage.setUserId(user.id);
      } else {
        // Usuario no autenticado: limpiar userId
        storage.setUserId(null);
        // Limpiar cache cuando el usuario cierra sesión
        storage.clearCache();
      }
    }
  }, [user, isLoaded]);

  // Este componente no renderiza nada
  return null;
}

