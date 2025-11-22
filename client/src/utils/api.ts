/**
 * Función helper para obtener el token de autenticación
 * Esta función puede ser llamada desde fuera de componentes React
 */
let getTokenFunction: (() => Promise<string | null>) | null = null;

export function setGetTokenFunction(fn: () => Promise<string | null>): void {
  getTokenFunction = fn;
}

export async function getAuthTokenSync(): Promise<string | null> {
  if (getTokenFunction) {
    return await getTokenFunction();
  }
  return null;
}

/**
 * Obtener la URL base de la API
 * Usa URL relativa para que funcione con túneles dinámicos de Cloudflare
 * En desarrollo, el proxy de Vite redirige /api al servidor backend
 * En producción, ambos servicios deben estar en el mismo dominio o usar un proxy reverso
 */
function getApiBaseUrl(): string {
  // Si hay una URL específica configurada, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Usar URL relativa para que funcione con cualquier dominio (incluyendo túneles)
  return '';
}

/**
 * Realizar una petición autenticada a la API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthTokenSync();
  
  if (!token) {
    throw new Error('No autenticado');
  }

  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

