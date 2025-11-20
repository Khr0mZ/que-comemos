import i18n from "../i18n/config";

import type { IngredientCategory } from "../types";

export interface IngredientData {
  id: string;
  nameEN: string;
  nameES: string;
  category: IngredientCategory;
}

// Cache para los ingredientes cargados desde el archivo JSON
let ingredientsCache: IngredientData[] | null = null;

/**
 * Normaliza una cadena eliminando acentos y caracteres especiales para búsqueda
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos (acentos)
    .trim();
}

/**
 * Carga todos los ingredientes desde el archivo JSON local
 * Devuelve objetos con nombre y categoría
 */
export async function getAllIngredients(): Promise<IngredientData[]> {
  if (ingredientsCache) {
    return ingredientsCache;
  }

  try {
    const ingredientsModule = await import(
      "../data/ingredients/ingredients.json"
    );
    const ingredients = (ingredientsModule.default || []) as IngredientData[];
    ingredientsCache = ingredients;
    return ingredients;
  } catch (error) {
    console.error("Error loading ingredients from local file:", error);
    return [];
  }
}

/**
 * Carga solo los nombres de los ingredientes en inglés (para compatibilidad)
 */
export async function getAllIngredientNames(): Promise<string[]> {
  const ingredients = await getAllIngredients();
  return ingredients.map((ing) => ing.nameEN);
}

/**
 * Traduce el nombre de un ingrediente al idioma actual
 * Busca el ingrediente por nameEN en el cache y retorna nameEN o nameES según el idioma
 * Si no se encuentra en el cache, retorna el nombre original
 */
export function translateIngredient(ingredientName: string): string {
  if (!ingredientName || !ingredientName.trim()) {
    return ingredientName;
  }
  
  const currentLang = i18n.language || "es";
  
  // Buscar el ingrediente por nameEN en el cache si está disponible
  if (ingredientsCache) {
    const found = ingredientsCache.find(
      (ing) => ing.nameEN.toLowerCase().trim() === ingredientName.toLowerCase().trim()
    );
    if (found) {
      return currentLang === "en" ? found.nameEN : found.nameES;
    }
  }
  
  // Si no se encuentra en el cache, retornar el nombre original
  // Esto puede pasar si el cache aún no se ha cargado o para ingredientes personalizados
  return ingredientName;
}

/**
 * Busca el nombre en inglés de un ingrediente a partir de su traducción en español
 * @param translatedName Nombre traducido en español
 * @param allIngredients Lista de todos los ingredientes (opcional, si no se proporciona se cargan automáticamente)
 * @returns El nombre en inglés si se encuentra, null si no
 */
export async function findEnglishName(
  translatedName: string,
  allIngredients?: IngredientData[]
): Promise<string | null> {
  if (!translatedName || !translatedName.trim()) {
    return null;
  }

  const ingredients = allIngredients || (await getAllIngredients());
  const translatedLower = translatedName.toLowerCase().trim();

  for (const ing of ingredients) {
    // Buscar por nameES directamente
    if (ing.nameES.toLowerCase().trim() === translatedLower) {
      return ing.nameEN;
    }
    // También buscar por nameEN por compatibilidad
    if (ing.nameEN.toLowerCase().trim() === translatedLower) {
      return ing.nameEN;
    }
  }

  return null;
}

/**
 * Busca un ingrediente completo (nombre y categoría) a partir de su nombre en inglés o español
 * @param ingredientName Nombre del ingrediente en inglés o español
 * @returns El objeto IngredientData si se encuentra, null si no
 */
export async function findIngredientData(
  ingredientName: string
): Promise<IngredientData | null> {
  if (!ingredientName || !ingredientName.trim()) {
    return null;
  }

  const ingredients = await getAllIngredients();
  const nameLower = ingredientName.toLowerCase().trim();

  const found = ingredients.find(
    (ing) => 
      ing.nameEN.toLowerCase().trim() === nameLower ||
      ing.nameES.toLowerCase().trim() === nameLower
  );

  return found || null;
}

