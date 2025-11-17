import i18n from "../i18n/config";

import type { IngredientCategory } from "../types";

export interface IngredientData {
  name: string;
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
 * Carga solo los nombres de los ingredientes (para compatibilidad)
 */
export async function getAllIngredientNames(): Promise<string[]> {
  const ingredients = await getAllIngredients();
  return ingredients.map((ing) => ing.name);
}

/**
 * Normaliza el nombre de un ingrediente para usar como clave de traducción
 */
function normalizeIngredientKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Traduce el nombre de un ingrediente al idioma actual
 * Si no hay traducción disponible, devuelve el nombre original
 */
export function translateIngredient(ingredientName: string): string {
  if (!ingredientName || !ingredientName.trim()) {
    return ingredientName;
  }
  
  const key = normalizeIngredientKey(ingredientName);
  const translationKey = `ingredients.${key}`;
  const translation = i18n.t(translationKey, { defaultValue: ingredientName });
  
  // Si la traducción es igual a la clave, significa que no existe traducción
  if (translation === translationKey) {
    return ingredientName;
  }
  
  return translation;
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
    const translated = translateIngredient(ing.name);
    if (translated.toLowerCase().trim() === translatedLower) {
      return ing.name;
    }
  }

  return null;
}

/**
 * Busca un ingrediente completo (nombre y categoría) a partir de su nombre en inglés
 * @param ingredientName Nombre del ingrediente en inglés
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
    (ing) => ing.name.toLowerCase().trim() === nameLower
  );

  return found || null;
}

