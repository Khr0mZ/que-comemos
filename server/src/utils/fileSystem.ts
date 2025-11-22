import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../../db');

/**
 * Asegurar que el directorio db existe
 */
export function ensureDbDirectory(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

/**
 * Obtener la ruta del directorio de datos del usuario
 */
export function getUserDbPath(userId: string): string {
  const userDir = path.join(DB_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

/**
 * Leer un archivo JSON del usuario
 */
export function readUserFile<T>(userId: string, filename: string): T | null {
  try {
    const userDir = getUserDbPath(userId);
    const filePath = path.join(userDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error leyendo archivo ${filename} para usuario ${userId}:`, error);
    return null;
  }
}

/**
 * Escribir un archivo JSON del usuario
 */
export function writeUserFile<T>(userId: string, filename: string, data: T): void {
  try {
    const userDir = getUserDbPath(userId);
    const filePath = path.join(userDir, filename);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error escribiendo archivo ${filename} para usuario ${userId}:`, error);
    throw error;
  }
}

/**
 * Obtener el timestamp de última modificación de un archivo
 */
export function getFileTimestamp(userId: string, filename: string): number | null {
  try {
    const userDir = getUserDbPath(userId);
    const filePath = path.join(userDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    return stats.mtimeMs; // Tiempo de modificación en milisegundos
  } catch (error) {
    console.error(`Error obteniendo timestamp de ${filename} para usuario ${userId}:`, error);
    return null;
  }
}

/**
 * Obtener timestamps de todos los archivos de datos del usuario
 */
export function getUserDataTimestamps(userId: string): Record<string, number | null> {
  return {
    ingredients: getFileTimestamp(userId, 'ingredients.json'),
    recipes: getFileTimestamp(userId, 'recipes.json'),
    'shopping-list': getFileTimestamp(userId, 'shopping-list.json'),
    week: getFileTimestamp(userId, 'week.json'),
  };
}

