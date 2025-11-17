import type { Recipe, ShoppingListItem, RecipeAvailability } from '../types';
import { storage } from '../db/storage';

/**
 * Comparar ingredientes de receta con inventario y generar lista de compra
 */
export async function checkRecipeAvailability(
  recipe: Recipe
): Promise<RecipeAvailability> {
  const inventory = await storage.loadIngredients();
  const missingIngredients: ShoppingListItem[] = [];

  for (const recipeIngredient of recipe.ingredients) {
    const normalizedRecipeName = normalizeIngredientName(recipeIngredient.name);
    
    // Buscar en inventario (comparación flexible)
    const found = inventory.find(inv => {
      const normalizedInvName = normalizeIngredientName(inv.name);
      return normalizedInvName.includes(normalizedRecipeName) ||
             normalizedRecipeName.includes(normalizedInvName);
    });

    if (!found) {
      missingIngredients.push({
        name: recipeIngredient.name,
        measure: recipeIngredient.measure,
      });
    }
  }

  let availabilityStatus: 'available' | 'partial' | 'unavailable';
  if (missingIngredients.length === 0) {
    availabilityStatus = 'available';
  } else if (missingIngredients.length < recipe.ingredients.length / 2) {
    availabilityStatus = 'partial';
  } else {
    availabilityStatus = 'unavailable';
  }

  return {
    recipe,
    missingIngredients,
    availabilityStatus,
  };
}

/**
 * Normalizar nombre de ingrediente para comparación
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .trim();
}

/**
 * Filtrar recetas por ingredientes seleccionados
 */
export function filterRecipesByIngredients(
  recipes: Recipe[],
  selectedIngredients: string[]
): Recipe[] {
  if (selectedIngredients.length === 0) {
    return recipes;
  }

  return recipes.filter(recipe => {
    const recipeIngredientNames = recipe.ingredients.map(ing =>
      normalizeIngredientName(ing.name)
    );
    
    return selectedIngredients.every(selected => {
      const normalizedSelected = normalizeIngredientName(selected);
      return recipeIngredientNames.some(recipeIng =>
        recipeIng.includes(normalizedSelected) ||
        normalizedSelected.includes(recipeIng)
      );
    });
  });
}

/**
 * Filtrar recetas por etiquetas
 */
export function filterRecipesByTags(
  recipes: Recipe[],
  selectedTags: string[]
): Recipe[] {
  if (selectedTags.length === 0) {
    return recipes;
  }

  return recipes.filter(recipe =>
    selectedTags.some(tag => {
      if (!recipe.tags || recipe.tags.length === 0) return false;
      return recipe.tags.some(recipeTag =>
        recipeTag.toLowerCase() === tag.toLowerCase()
      );
    })
  );
}

/**
 * Filtrar recetas por categoría
 */
export function filterRecipesByCategory(
  recipes: Recipe[],
  category: string
): Recipe[] {
  if (!category) {
    return recipes;
  }

  const categoryLower = category.toLowerCase();
  return recipes.filter(recipe =>
    recipe.category && recipe.category.toLowerCase() === categoryLower
  );
}

/**
 * Filtrar recetas por área
 */
export function filterRecipesByArea(
  recipes: Recipe[],
  area: string
): Recipe[] {
  if (!area) {
    return recipes;
  }

  const areaLower = area.toLowerCase();
  return recipes.filter(recipe =>
    recipe.area && recipe.area.toLowerCase() === areaLower
  );
}

/**
 * Convertir URL de YouTube a formato embed
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  // Ya está en formato embed
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Formato: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  return null;
}

