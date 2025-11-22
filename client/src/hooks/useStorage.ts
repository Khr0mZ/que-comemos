import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { storage } from "../services/storage";
import { syncService } from "../services/sync";
import type {
  DayOfWeek,
  Ingredient,
  MealType,
  Recipe,
  ShoppingListData,
  WeekData,
} from "../types";
import { getAllIngredients, normalizeSearchText } from "../utils/ingredientTranslations";

// Re-export storage for convenience
export { storage };

/**
 * Hook para obtener ingredientes con reactividad
 */
export function useIngredients() {
  const { i18n } = useTranslation();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(storage.getUserId());

  const loadIngredients = useCallback(async (forceReload = false) => {
    try {
      // Si es una recarga forzada (por sincronización remota), cargar desde la API
      const data = await storage.loadIngredients(forceReload);
      // Usar JSON.parse/stringify para crear una copia completamente nueva
      // Esto asegura que React siempre detecte el cambio
      const newData = JSON.parse(JSON.stringify(data));
      
      // Ordenar alfabéticamente según el idioma actual
      const currentLang = i18n.language || "es";
      const globalIngredientsData = await getAllIngredients();
      
      const sortedData = [...newData].sort((a, b) => {
        // Buscar los datos completos del ingrediente en la lista global por id
        const ingA = globalIngredientsData.find((g) => g.id === a.id);
        const ingB = globalIngredientsData.find((g) => g.id === b.id);

        // Obtener el nombre según el idioma
        const nameA =
          currentLang === "en" ? ingA?.nameEN || a.id : ingA?.nameES || a.id;
        const nameB =
          currentLang === "en" ? ingB?.nameEN || b.id : ingB?.nameES || b.id;

        // Ordenar alfabéticamente ignorando mayúsculas y acentos
        return normalizeSearchText(nameA).localeCompare(
          normalizeSearchText(nameB),
          currentLang,
          { sensitivity: "base" }
        );
      });
      
      // Siempre actualizar para asegurar que los cambios se reflejen
      setIngredients(sortedData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading ingredients:", error);
      setLoading(false);
    }
  }, [i18n.language]);

  // Usar useRef para mantener la referencia más reciente de la función
  const loadIngredientsRef = useRef(loadIngredients);

  useEffect(() => {
    // Actualizar ref dentro del efecto
    loadIngredientsRef.current = loadIngredients;
    loadIngredientsRef.current();

    // Escuchar cambios usando un evento personalizado
    const handleCustomStorageChange = () => {
      loadIngredientsRef.current();
    };

    // Escuchar cambios locales
    window.addEventListener(
      "que-comemos-ingredients-changed",
      handleCustomStorageChange
    );

    // Escuchar cambios remotos (sincronización)
    const unsubscribeSync = syncService.onDataChange('ingredients', () => {
      loadIngredientsRef.current(true); // Forzar recarga desde API
    });

    return () => {
      window.removeEventListener(
        "que-comemos-ingredients-changed",
        handleCustomStorageChange
      );
      unsubscribeSync();
    };
  }, [loadIngredients]);

  // Escuchar cambios en el userId y recargar cuando cambie
  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = storage.getUserId();
      if (currentUserId !== userId) {
        setUserId(currentUserId);
        // Si el userId cambió, recargar los datos
        if (currentUserId) {
          loadIngredientsRef.current(true);
        } else {
          setIngredients([]);
          setLoading(false);
        }
      }
    };

    // Verificar userId periódicamente cuando no hay userId inicial
    const interval = setInterval(checkUserId, 100);
    
    // También verificar inmediatamente
    checkUserId();

    return () => clearInterval(interval);
  }, [userId]);

  // Reordenar ingredientes cuando cambie el idioma
  useEffect(() => {
    const reorderIngredients = async () => {
      const currentLang = i18n.language || "es";
      const globalIngredientsData = await getAllIngredients();
      
      setIngredients((prevIngredients) => {
        return [...prevIngredients].sort((a, b) => {
          const ingA = globalIngredientsData.find((g) => g.id === a.id);
          const ingB = globalIngredientsData.find((g) => g.id === b.id);

          const nameA =
            currentLang === "en" ? ingA?.nameEN || a.id : ingA?.nameES || a.id;
          const nameB =
            currentLang === "en" ? ingB?.nameEN || b.id : ingB?.nameES || b.id;

          return normalizeSearchText(nameA).localeCompare(
            normalizeSearchText(nameB),
            currentLang,
            { sensitivity: "base" }
          );
        });
      });
    };
    
    reorderIngredients();
  }, [i18n]);

  return { ingredients, loading, refresh: loadIngredients };
}

/**
 * Hook para obtener recetas con reactividad
 */
export function useRecipes() {
  const { i18n } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(storage.getUserId());

  const loadRecipes = useCallback(async (forceReload = false) => {
    try {
      setLoading(true);
      // Si es una recarga forzada (por sincronización remota), cargar desde la API
      const data = await storage.loadRecipes(forceReload);
      // Usar JSON.parse/stringify para crear una copia completamente nueva
      // Esto asegura que React siempre detecte el cambio
      const newData = JSON.parse(JSON.stringify(data));
      
      // Ordenar alfabéticamente por nombre según el idioma actual
      const currentLang = i18n.language || "es";
      const sortedData = [...newData].sort((a, b) => {
        const nameA = currentLang === "en" ? (a.nameEN || a.nameES) : (a.nameES || a.nameEN);
        const nameB = currentLang === "en" ? (b.nameEN || b.nameES) : (b.nameES || b.nameEN);
        return nameA.localeCompare(nameB, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      });
      
      // Siempre actualizar para asegurar que los cambios se reflejen
      setRecipes(sortedData);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  // Usar useRef para mantener la referencia más reciente de la función
  const loadRecipesRef = useRef(loadRecipes);

  useEffect(() => {
    // Actualizar ref dentro del efecto
    loadRecipesRef.current = loadRecipes;
    loadRecipesRef.current();

    // Escuchar cambios usando un evento personalizado
    const handleCustomStorageChange = () => {
      loadRecipesRef.current();
    };

    // Escuchar cambios locales
    window.addEventListener(
      "que-comemos-recipes-changed",
      handleCustomStorageChange
    );

    // Escuchar cambios remotos (sincronización)
    const unsubscribeSync = syncService.onDataChange('recipes', () => {
      loadRecipesRef.current(true); // Forzar recarga desde API
    });

    return () => {
      window.removeEventListener(
        "que-comemos-recipes-changed",
        handleCustomStorageChange
      );
      unsubscribeSync();
    };
  }, [loadRecipes]);

  // Escuchar cambios en el userId y recargar cuando cambie
  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = storage.getUserId();
      if (currentUserId !== userId) {
        setUserId(currentUserId);
        // Si el userId cambió, recargar los datos
        if (currentUserId) {
          loadRecipesRef.current(true);
        } else {
          setRecipes([]);
          setLoading(false);
        }
      }
    };

    // Verificar userId periódicamente cuando no hay userId inicial
    const interval = setInterval(checkUserId, 100);
    
    // También verificar inmediatamente
    checkUserId();

    return () => clearInterval(interval);
  }, [userId]);

  // Reordenar recetas cuando cambie el idioma
  useEffect(() => {
    setRecipes((prevRecipes) => {
      const currentLang = i18n.language || "es";
      return [...prevRecipes].sort((a, b) => {
        const nameA = currentLang === "en" ? (a.nameEN || a.nameES) : (a.nameES || a.nameEN);
        const nameB = currentLang === "en" ? (b.nameEN || b.nameES) : (b.nameES || b.nameEN);
        return nameA.localeCompare(nameB, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      });
    });
  }, [i18n]);

  return { recipes, loading, refresh: loadRecipes };
}

/**
 * Disparar evento personalizado para notificar cambios
 */
function notifyRecipesChange() {
  window.dispatchEvent(new Event("que-comemos-recipes-changed"));
}

/**
 * Wrapper para guardar ingredientes y notificar cambios
 */
export async function saveIngredient(
  ingredient: Ingredient
): Promise<Ingredient> {
  const result = await storage.addIngredient(ingredient);
  // No necesitamos notificar aquí porque saveIngredients ya lo hace
  return result;
}

export async function updateIngredient(
  name: string,
  updates: Partial<Ingredient>
): Promise<void> {
  await storage.updateIngredient(name, updates);
  // No necesitamos notificar aquí porque saveIngredients ya lo hace
  // notifyIngredientsChange();
}

export async function deleteIngredient(name: string): Promise<void> {
  await storage.deleteIngredient(name);
  // No necesitamos notificar aquí porque saveIngredients ya lo hace
  // notifyIngredientsChange();
}

export async function deleteAllIngredients(): Promise<void> {
  await storage.deleteAllIngredients();
  // No necesitamos notificar aquí porque saveIngredients ya lo hace
}

/**
 * Wrapper para guardar recetas y notificar cambios
 */
export async function saveRecipe(recipe: Recipe): Promise<Recipe> {
  const result = await storage.addRecipe(recipe);
  notifyRecipesChange();
  return result;
}

export async function updateRecipe(
  name: string,
  updates: Partial<Recipe>
): Promise<void> {
  await storage.updateRecipe(name, updates);
  notifyRecipesChange();
}

export async function deleteRecipe(name: string): Promise<void> {
  await storage.deleteRecipe(name);
  notifyRecipesChange();
}

export async function resetRecipes(): Promise<void> {
  await storage.resetRecipes();
  notifyRecipesChange();
}

export async function deleteAllRecipes(): Promise<void> {
  await storage.deleteAllRecipes();
  notifyRecipesChange();
}

/**
 * Hook para obtener lista de compra con reactividad
 */
export function useShoppingList() {
  const [shoppingList, setShoppingList] = useState<ShoppingListData>({
    generalItems: [],
    recipeLists: [],
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(storage.getUserId());

  const loadShoppingList = useCallback(async (forceReload = false) => {
    try {
      // Si es una recarga forzada (por sincronización remota), cargar desde la API
      const data = await storage.loadShoppingList(forceReload);
      // Usar JSON.parse/stringify para crear una copia completamente nueva
      // Esto asegura que React siempre detecte el cambio
      const newData = JSON.parse(JSON.stringify(data));
      // Siempre actualizar para asegurar que los cambios se reflejen
      setShoppingList(newData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading shopping list:", error);
      setLoading(false);
    }
  }, []);

  // Usar useRef para mantener la referencia más reciente de la función
  const loadShoppingListRef = useRef(loadShoppingList);

  useEffect(() => {
    // Actualizar ref dentro del efecto
    loadShoppingListRef.current = loadShoppingList;
    loadShoppingListRef.current();

    // Escuchar cambios usando un evento personalizado
    const handleShoppingListChange = () => {
      loadShoppingListRef.current();
    };

    // Escuchar cambios locales
    window.addEventListener(
      "que-comemos-shopping-list-changed",
      handleShoppingListChange
    );

    // Escuchar cambios remotos (sincronización)
    const unsubscribeSync = syncService.onDataChange('shopping-list', () => {
      loadShoppingListRef.current(true); // Forzar recarga desde API
    });

    return () => {
      window.removeEventListener(
        "que-comemos-shopping-list-changed",
        handleShoppingListChange
      );
      unsubscribeSync();
    };
  }, [loadShoppingList]);

  // Escuchar cambios en el userId y recargar cuando cambie
  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = storage.getUserId();
      if (currentUserId !== userId) {
        setUserId(currentUserId);
        // Si el userId cambió, recargar los datos
        if (currentUserId) {
          loadShoppingListRef.current(true);
        } else {
          setShoppingList({ generalItems: [], recipeLists: [] });
          setLoading(false);
        }
      }
    };

    // Verificar userId periódicamente cuando no hay userId inicial
    const interval = setInterval(checkUserId, 100);
    
    // También verificar inmediatamente
    checkUserId();

    return () => clearInterval(interval);
  }, [userId]);

  return { shoppingList, loading, refresh: loadShoppingList };
}

/**
 * Hook para obtener datos de la semana con reactividad
 */
export function useWeek() {
  const [week, setWeek] = useState<WeekData>({
    monday: { lunch: [], dinner: [] },
    tuesday: { lunch: [], dinner: [] },
    wednesday: { lunch: [], dinner: [] },
    thursday: { lunch: [], dinner: [] },
    friday: { lunch: [], dinner: [] },
    saturday: { lunch: [], dinner: [] },
    sunday: { lunch: [], dinner: [] },
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(storage.getUserId());

  const loadWeek = useCallback(async (forceReload = false) => {
    try {
      // Si es una recarga forzada (por sincronización remota), cargar desde la API
      const data = await storage.loadWeek(forceReload);
      // Usar JSON.parse/stringify para crear una copia completamente nueva
      // Esto asegura que React siempre detecte el cambio
      const newData = JSON.parse(JSON.stringify(data));
      // Siempre actualizar para asegurar que los cambios se reflejen
      setWeek(newData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading week:", error);
      setLoading(false);
    }
  }, []);

  // Usar useRef para mantener la referencia más reciente de la función
  const loadWeekRef = useRef(loadWeek);

  useEffect(() => {
    // Actualizar ref dentro del efecto
    loadWeekRef.current = loadWeek;
    loadWeekRef.current();

    // Escuchar cambios usando un evento personalizado
    const handleWeekChange = () => {
      loadWeekRef.current();
    };

    // Escuchar cambios locales
    window.addEventListener("que-comemos-week-changed", handleWeekChange);

    // Escuchar cambios remotos (sincronización)
    const unsubscribeSync = syncService.onDataChange('week', () => {
      loadWeekRef.current(true); // Forzar recarga desde API
    });

    return () => {
      window.removeEventListener("que-comemos-week-changed", handleWeekChange);
      unsubscribeSync();
    };
  }, [loadWeek]);

  // Escuchar cambios en el userId y recargar cuando cambie
  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = storage.getUserId();
      if (currentUserId !== userId) {
        setUserId(currentUserId);
        // Si el userId cambió, recargar los datos
        if (currentUserId) {
          loadWeekRef.current(true);
        } else {
          setWeek({
            monday: { lunch: [], dinner: [] },
            tuesday: { lunch: [], dinner: [] },
            wednesday: { lunch: [], dinner: [] },
            thursday: { lunch: [], dinner: [] },
            friday: { lunch: [], dinner: [] },
            saturday: { lunch: [], dinner: [] },
            sunday: { lunch: [], dinner: [] },
          });
          setLoading(false);
        }
      }
    };

    // Verificar userId periódicamente cuando no hay userId inicial
    const interval = setInterval(checkUserId, 100);
    
    // También verificar inmediatamente
    checkUserId();

    return () => clearInterval(interval);
  }, [userId]);

  return { week, loading, refresh: loadWeek };
}

export async function addRecipeToWeek(
  day: DayOfWeek,
  mealType: MealType,
  recipeName: string
): Promise<void> {
  await storage.addRecipeToWeek(day, mealType, recipeName);
}

export async function removeRecipeFromWeek(
  day: DayOfWeek,
  mealType: MealType,
  recipeName: string
): Promise<void> {
  await storage.removeRecipeFromWeek(day, mealType, recipeName);
}

export async function markOneRecipeInstanceAsCompleted(
  recipeName: string
): Promise<void> {
  await storage.markOneRecipeInstanceAsCompleted(recipeName);
}

export async function clearWeek(): Promise<void> {
  await storage.clearWeek();
}
