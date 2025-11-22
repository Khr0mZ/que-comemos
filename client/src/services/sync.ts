import { io, Socket } from 'socket.io-client';
import { getAuthTokenSync } from '../utils/api';

export type DataType = 'ingredients' | 'recipes' | 'shopping-list' | 'week';

/**
 * Servicio de sincronización usando WebSockets (Socket.IO)
 * El servidor notifica al cliente cuando hay cambios en tiempo real
 */
class SyncService {
  private socket: Socket | null = null;
  private syncCallbacks: Map<string, Set<() => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Empezar con 1 segundo

  /**
   * Obtener la URL base de la API
   */
  private getApiBaseUrl(): string {
    // Si hay una URL configurada, usarla directamente
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    // Si no hay URL configurada, usar el proxy
    return '';
  }

  /**
   * Registrar callback para cuando se detecten cambios en un tipo de dato
   */
  onDataChange(dataType: DataType, callback: () => void): () => void {
    if (!this.syncCallbacks.has(dataType)) {
      this.syncCallbacks.set(dataType, new Set());
    }
    this.syncCallbacks.get(dataType)!.add(callback);

    // Retornar función para desregistrar
    return () => {
      this.syncCallbacks.get(dataType)?.delete(callback);
    };
  }

  /**
   * Disparar callbacks para un tipo de dato
   */
  private notifyChange(dataType: DataType): void {
    const callbacks = this.syncCallbacks.get(dataType);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`WebSocket: Error ejecutando callback de sincronización para ${dataType}:`, error);
        }
      });
    }
  }

  /**
   * Iniciar conexión WebSocket
   */
  startSync(): void {
    if (this.socket?.connected) {
      // Ya está conectado
      return;
    }

    this.connect();
  }

  /**
   * Conectar al servidor WebSocket
   */
  private async connect(): Promise<void> {
    try {
      // Obtener token de autenticación
      const token = await getAuthTokenSync();
      if (!token) {
        console.error('WebSocket: No se pudo obtener token de autenticación');
        return;
      }

      const apiBaseUrl = this.getApiBaseUrl();
      const wsUrl = apiBaseUrl || 'http://localhost:3001';

      // Crear conexión WebSocket con autenticación
      const socket = io(wsUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'], // Intentar WebSocket primero, luego polling como fallback
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket = socket;

      // Manejar conexión exitosa
      socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      });

      // Manejar desconexión
      socket.on('disconnect', () => {
        // Desconexión manejada silenciosamente
      });

      // Manejar eventos de cambio de datos
      socket.on('data-changed', (data: { type: string; dataType: DataType; timestamp: number }) => {
        const dataType = data.dataType;
        if (dataType) {
          this.notifyChange(dataType);
        }
      });

      // Manejar errores de conexión
      socket.on('connect_error', (error) => {
        console.error('WebSocket: Error de conexión:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('WebSocket: Máximo de intentos de reconexión alcanzado');
        }
      });

      // Manejar errores generales
      socket.on('error', (error) => {
        console.error('WebSocket: Error:', error);
      });

    } catch (error) {
      console.error('WebSocket: Error iniciando conexión:', error);
    }
  }

  /**
   * Cerrar conexión WebSocket
   */
  private close(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Detener sincronización
   */
  stopSync(): void {
    this.close();
    this.reconnectAttempts = 0;
    this.syncCallbacks.clear();
  }

  /**
   * Resetear servicio (útil cuando el usuario cambia)
   */
  reset(): void {
    this.stopSync();
  }

  /**
   * Verificar si hay una conexión WebSocket activa
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const syncService = new SyncService();
