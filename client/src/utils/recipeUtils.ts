import { storage } from "../services/storage";
import type {
  InventoryIngredientMatch,
  Recipe,
  RecipeAvailability,
  ShoppingListItem,
} from "../types";

/**
 * Comparar ingredientes de receta con inventario y generar lista de compra
 */
export async function checkRecipeAvailability(
  recipe: Recipe
): Promise<RecipeAvailability> {
  const inventory = await storage.loadIngredients();
  const missingIngredients: ShoppingListItem[] = [];
  const availableIngredients: InventoryIngredientMatch[] = [];

  for (const recipeIngredient of recipe.ingredients) {
    // Buscar en inventario por id
    const found = inventory.find((inv) => {
      return inv.id === recipeIngredient.id;
    });

    // Verificar si el ingrediente está disponible:
    // 1. Debe estar en el inventario
    // 2. Su measure debe estar definido (no undefined, null o string vacío)
    // 3. Su measure no debe ser "0"
    const isAvailable =
      found &&
      found.measure !== undefined &&
      found.measure !== null &&
      found.measure.trim() !== "" &&
      found.measure.trim() !== "0";

    if (!isAvailable) {
      missingIngredients.push({
        id: recipeIngredient.id,
        measure: recipeIngredient.measure,
      });
    } else {
      // Ingrediente encontrado en inventario y disponible - agregar a la lista de disponibles
      availableIngredients.push({
        recipeIngredientName: recipeIngredient.id, // Esto es el id ahora
        recipeIngredientMeasure: recipeIngredient.measure,
        inventoryIngredient: found,
      });
    }
  }

  let availabilityStatus: "available" | "partial" | "unavailable";
  if (missingIngredients.length === 0) {
    availabilityStatus = "available";
  } else if (missingIngredients.length < recipe.ingredients.length / 2) {
    availabilityStatus = "partial";
  } else {
    availabilityStatus = "unavailable";
  }

  return {
    recipe,
    missingIngredients,
    availableIngredients,
    availabilityStatus,
  };
}

/**
 * Filtrar recetas por ingredientes seleccionados
 * Solo devuelve recetas que contengan TODOS los ingredientes seleccionados
 */
export function filterRecipesByIngredients(
  recipes: Recipe[],
  selectedIngredients: string[]
): Recipe[] {
  if (selectedIngredients.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    // Obtener todos los ids de ingredientes de la receta
    const recipeIngredientIds = recipe.ingredients.map((ing) => ing.id);

    // Verificar que TODOS los ingredientes seleccionados (ids) estén en la receta
    return selectedIngredients.every((selectedId) => {
      // Comparación exacta por id
      return recipeIngredientIds.includes(selectedId);
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

  return recipes.filter((recipe) =>
    selectedTags.every((tag) => {
      if (!recipe.tags || recipe.tags.length === 0) return false;
      return recipe.tags.some(
        (recipeTag) => recipeTag.toLowerCase() === tag.toLowerCase()
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
  return recipes.filter(
    (recipe) =>
      recipe.category && recipe.category.toLowerCase() === categoryLower
  );
}

/**
 * Filtrar recetas por área
 */
export function filterRecipesByArea(recipes: Recipe[], area: string): Recipe[] {
  if (!area) {
    return recipes;
  }

  const areaLower = area.toLowerCase();
  return recipes.filter(
    (recipe) => recipe.area && recipe.area.toLowerCase() === areaLower
  );
}

/**
 * Convertir URL de YouTube a formato embed
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  // Ya está en formato embed
  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  // Formato: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
  );
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  return null;
}
