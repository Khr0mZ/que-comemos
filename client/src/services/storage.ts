import type {
  DayOfWeek,
  Ingredient,
  IngredientCategory,
  MealType,
  Recipe,
  ShoppingListData,
  ShoppingListItem,
  WeekData,
  WeekDayMeals,
  WeekMeal,
} from "../types";
import { apiRequest } from "../utils/api";

// Cache en memoria para los datos cargados por usuario
// Estructura: { [userId]: { ingredients: [...], recipes: [...], shoppingList: {...}, week: {...} } }
const cacheByUser: Record<string, {
  ingredients: Ingredient[] | null;
  recipes: Recipe[] | null;
  shoppingList: ShoppingListData | null;
  week: WeekData | null;
}> = {};

/**
 * Obtener el userId actual desde localStorage o retornar null
 * Esto se usa cuando Clerk aún no está cargado
 */
function getCurrentUserId(): string | null {
  // Intentar obtener desde localStorage (se guarda cuando Clerk carga)
  return localStorage.getItem('que-comemos-user-id') || null;
}


/**
 * Servicio de almacenamiento usando APIs REST del servidor backend
 */
class JSONFileService {
  private userId: string | null = null;

  /**
   * Establecer el userId actual
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
    if (userId) {
      localStorage.setItem('que-comemos-user-id', userId);
    } else {
      localStorage.removeItem('que-comemos-user-id');
    }
  }

  /**
   * Obtener el userId actual
   */
  getUserId(): string | null {
    return this.userId || getCurrentUserId();
  }

  /**
   * Obtener o crear el cache para el usuario actual
   */
  private getUserCache() {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    if (!cacheByUser[userId]) {
      cacheByUser[userId] = {
        ingredients: null,
        recipes: null,
        shoppingList: null,
        week: null,
      };
    }
    return cacheByUser[userId];
  }
  /**
   * Cargar ingredientes desde la API
   */
  async loadIngredients(forceReload = false): Promise<Ingredient[]> {
    const userId = this.getUserId();
    if (!userId) {
      return [];
    }

    const userCache = this.getUserCache();
    
    // Si hay cache y no se fuerza recarga, devolver una copia nueva
    if (userCache.ingredients && !forceReload) {
      return userCache.ingredients.map((ing) => ({ ...ing }));
    }

    // Cargar desde la API
    try {
      const ingredients = await apiRequest<Ingredient[]>('/api/ingredients');
      userCache.ingredients = ingredients || [];
      return userCache.ingredients.map((ing) => ({ ...ing }));
    } catch (error) {
      console.error("Error loading ingredients from API:", error);
      // Si hay error, retornar array vacío
      userCache.ingredients = [];
      return [];
    }
  }

  /**
   * Guardar ingredientes (guardado optimista: actualiza UI primero, luego guarda en servidor)
   */
  async saveIngredients(ingredients: Ingredient[]): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const userCache = this.getUserCache();
    
    // GUARDADO OPTIMISTA: Actualizar cache inmediatamente para que la UI se actualice
    userCache.ingredients = ingredients.map((ing) => ({ ...ing }));

    // Notificar cambio INMEDIATAMENTE para actualizar la UI
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("que-comemos-ingredients-changed", {
          detail: { timestamp: Date.now() },
        })
      );
    });

    // Guardar en la API en segundo plano (no bloquea la UI)
    try {
      await apiRequest('/api/ingredients', {
        method: 'POST',
        body: JSON.stringify(ingredients),
      });
    } catch (error) {
      console.error("Error guardando ingredientes en la API:", error);
      // En caso de error, podríamos revertir el cambio o mostrar una notificación
      // Por ahora, solo logueamos el error
      throw error;
    }
  }

  /**
   * Agregar un ingrediente
   */
  async addIngredient(ingredient: Ingredient): Promise<Ingredient> {
    const ingredients = await this.loadIngredients();
    // Verificar si ya existe un ingrediente con el mismo id
    const existingIndex = ingredients.findIndex(
      (ing) => ing.id === ingredient.id
    );
    if (existingIndex !== -1) {
      // Si existe, actualizarlo en lugar de agregarlo
      const updatedIngredients = ingredients.map((ing, i) =>
        i === existingIndex ? { ...ingredient } : { ...ing }
      );
      await this.saveIngredients(updatedIngredients);
      return ingredient;
    }
    // Crear un nuevo array en lugar de mutar el existente
    const updatedIngredients = [...ingredients, ingredient];
    await this.saveIngredients(updatedIngredients);
    return ingredient;
  }

  /**
   * Actualizar un ingrediente por id
   */
  async updateIngredient(
    id: string,
    updates: Partial<Ingredient>
  ): Promise<void> {
    const ingredients = await this.loadIngredients();
    // Buscar por id
    const index = ingredients.findIndex(
      (ing) => ing.id === id
    );
    if (index === -1) {
      // Si no existe, crear uno nuevo en lugar de lanzar error
      // Esto hace el método más robusto
      const newIngredient: Ingredient = {
        id: updates.id || id,
        category: (updates.category || "other") as IngredientCategory,
        measure: updates.measure || "",
      };
      await this.addIngredient(newIngredient);
      return;
    }
    // Crear un nuevo array completo en lugar de mutar el existente
    const updatedIngredients = ingredients.map((ing, i) =>
      i === index ? { ...ing, ...updates } : { ...ing }
    );
    await this.saveIngredients(updatedIngredients);
  }

  /**
   * Eliminar un ingrediente por id
   */
  async deleteIngredient(id: string): Promise<void> {
    const ingredients = await this.loadIngredients();
    const filtered = ingredients.filter((ing) => ing.id !== id);
    await this.saveIngredients(filtered);
  }

  /**
   * Eliminar todos los ingredientes del inventario
   */
  async deleteAllIngredients(): Promise<void> {
    await this.saveIngredients([]);
  }

  /**
   * Cargar recetas desde la API
   */
  async loadRecipes(forceReload = false): Promise<Recipe[]> {
    const userId = this.getUserId();
    if (!userId) {
      return [];
    }

    const userCache = this.getUserCache();
    
    // Si hay cache y no se fuerza recarga, devolver una copia nueva
    if (userCache.recipes && !forceReload) {
      return userCache.recipes.map((rec) => ({ ...rec }));
    }

    try {
      const recipes = await apiRequest<Recipe[]>('/api/recipes');
      userCache.recipes = recipes || [];
      return userCache.recipes.map((rec) => ({ ...rec }));
    } catch (error) {
      console.error("Error loading recipes from API:", error);
      userCache.recipes = [];
      return [];
    }
  }

  /**
   * Guardar recetas (guardado optimista: actualiza UI primero, luego guarda en servidor)
   */
  async saveRecipes(recipes: Recipe[]): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const userCache = this.getUserCache();
    
    // GUARDADO OPTIMISTA: Actualizar cache inmediatamente
    userCache.recipes = recipes.map((rec) => ({ ...rec }));

    // Notificar cambio INMEDIATAMENTE para actualizar la UI
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("que-comemos-recipes-changed", {
          detail: { timestamp: Date.now() },
        })
      );
    });

    // Guardar en la API en segundo plano
    try {
      await apiRequest('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(recipes),
      });
    } catch (error) {
      console.error("Error guardando recetas en la API:", error);
      throw error;
    }
  }

  /**
   * Agregar una receta
   */
  async addRecipe(recipe: Recipe): Promise<Recipe> {
    const recipes = await this.loadRecipes();
    // Verificar si ya existe una receta con el mismo nombre
    const existingIndex = recipes.findIndex((rec) => rec.name === recipe.name);
    if (existingIndex !== -1) {
      // Si existe, actualizarla en lugar de agregarla
      const updatedRecipes = recipes.map((rec, i) =>
        i === existingIndex ? { ...recipe } : { ...rec }
      );
      await this.saveRecipes(updatedRecipes);
      return recipe;
    }
    recipes.push(recipe);
    await this.saveRecipes(recipes);
    return recipe;
  }

  /**
   * Actualizar una receta por nombre
   */
  async updateRecipe(name: string, updates: Partial<Recipe>): Promise<void> {
    const recipes = await this.loadRecipes();
    const index = recipes.findIndex((rec) => rec.name === name);
    if (index === -1) {
      throw new Error(`Recipe with name ${name} not found`);
    }
    recipes[index] = { ...recipes[index], ...updates };
    await this.saveRecipes(recipes);
  }

  /**
   * Eliminar una receta por nombre
   */
  async deleteRecipe(name: string): Promise<void> {
    const recipes = await this.loadRecipes();
    const filtered = recipes.filter((rec) => rec.name !== name);
    await this.saveRecipes(filtered);
  }

  /**
   * Eliminar todas las recetas
   */
  async deleteAllRecipes(): Promise<void> {
    await this.saveRecipes([]);
  }

  /**
   * Obtener una receta por nombre
   */
  async getRecipe(name: string): Promise<Recipe | undefined> {
    const recipes = await this.loadRecipes();
    return recipes.find((rec) => rec.name === name);
  }

  /**
   * Exportar ingredientes como JSON (para descargar)
   */
  exportIngredients(): string {
    const userId = this.getUserId();
    if (!userId) {
      return JSON.stringify([], null, 2);
    }
    const userCache = this.getUserCache();
    return JSON.stringify(userCache.ingredients || [], null, 2);
  }

  /**
   * Exportar recetas como JSON (para descargar)
   */
  exportRecipes(): string {
    const userId = this.getUserId();
    if (!userId) {
      return JSON.stringify([], null, 2);
    }
    const userCache = this.getUserCache();
    return JSON.stringify(userCache.recipes || [], null, 2);
  }

  /**
   * Importar ingredientes desde JSON
   */
  async importIngredients(json: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const ingredients = JSON.parse(json) as Ingredient[];
      const userCache = this.getUserCache();
      userCache.ingredients = null; // Limpiar cache para forzar recarga
      await this.saveIngredients(ingredients);
    } catch (error) {
      console.error("Error importing ingredients:", error);
      throw error;
    }
  }

  /**
   * Importar recetas desde JSON
   */
  async importRecipes(json: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const recipes = JSON.parse(json) as Recipe[];
      const userCache = this.getUserCache();
      userCache.recipes = null; // Limpiar cache para forzar recarga
      await this.saveRecipes(recipes);
    } catch (error) {
      console.error("Error importing recipes:", error);
      throw error;
    }
  }

  /**
   * Limpiar cache (útil después de importar o cambiar de usuario)
   */
  clearCache(userId?: string): void {
    if (userId) {
      // Limpiar cache de un usuario específico
      delete cacheByUser[userId];
    } else {
      // Limpiar todo el cache
      const currentUserId = this.getUserId();
      if (currentUserId && cacheByUser[currentUserId]) {
        cacheByUser[currentUserId] = {
          ingredients: null,
          recipes: null,
          shoppingList: null,
          week: null,
        };
      }
    }
  }

  /**
   * Resetear recetas desde los datos originales
   */
  async resetRecipes(): Promise<void> {
    try {
      // Cargar desde los datos originales
      const originalRecipesModule = await import(
        "../data/recipes/recipes.json"
      );
      const originalRecipes = (originalRecipesModule.default || []) as Recipe[];

      const userId = this.getUserId();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      // Limpiar cache para forzar recarga
      const userCache = this.getUserCache();
      userCache.recipes = null;

      // Guardar las recetas originales
      await this.saveRecipes(originalRecipes);
    } catch (error) {
      console.error("Error resetting recipes:", error);
      throw error;
    }
  }

  /**
   * Cargar lista de compra desde la API
   */
  async loadShoppingList(forceReload = false): Promise<ShoppingListData> {
    const userId = this.getUserId();
    if (!userId) {
      const emptyData = {
        generalItems: [],
        recipeLists: [],
      };
      return emptyData;
    }

    const userCache = this.getUserCache();
    
    // Si hay cache y no se fuerza recarga, devolver una copia nueva
    if (userCache.shoppingList && !forceReload) {
      return JSON.parse(JSON.stringify(userCache.shoppingList));
    }

    try {
      const shoppingList = await apiRequest<ShoppingListData>('/api/shopping-list');
      const data = shoppingList || { generalItems: [], recipeLists: [] };
      userCache.shoppingList = JSON.parse(JSON.stringify(data));
      return JSON.parse(JSON.stringify(userCache.shoppingList));
    } catch (error) {
      console.error("Error loading shopping list from API:", error);
      const emptyData = {
        generalItems: [],
        recipeLists: [],
      };
      userCache.shoppingList = JSON.parse(JSON.stringify(emptyData));
      return JSON.parse(JSON.stringify(emptyData));
    }
  }

  /**
   * Guardar lista de compra (guardado optimista: actualiza UI primero, luego guarda en servidor)
   */
  async saveShoppingList(data: ShoppingListData): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const userCache = this.getUserCache();
    
    // GUARDADO OPTIMISTA: Actualizar cache inmediatamente
    userCache.shoppingList = JSON.parse(JSON.stringify(data));

    // Notificar cambio INMEDIATAMENTE para actualizar la UI
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("que-comemos-shopping-list-changed", {
          detail: { timestamp: Date.now() },
        })
      );
    });

    // Guardar en la API en segundo plano
    try {
      await apiRequest('/api/shopping-list', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error guardando lista de compra en la API:", error);
      throw error;
    }
  }

  /**
   * Agregar ingrediente a la lista general (sin receta)
   */
  async addGeneralShoppingItem(item: ShoppingListItem): Promise<void> {
    const data = await this.loadShoppingList();
    // Evitar duplicados por id
    const exists = data.generalItems.some(
      (i) => i.id === item.id
    );
    if (!exists) {
      data.generalItems.push(item);
      await this.saveShoppingList(data);
    }
  }

  /**
   * Eliminar ingrediente de la lista general
   */
  async removeGeneralShoppingItem(itemId: string): Promise<void> {
    const data = await this.loadShoppingList();
    data.generalItems = data.generalItems.filter(
      (i) => i.id !== itemId
    );
    await this.saveShoppingList(data);
  }

  /**
   * Agregar lista de compra para una receta confirmada
   */
  async addRecipeShoppingList(
    recipeName: string,
    items: ShoppingListItem[]
  ): Promise<void> {
    const data = await this.loadShoppingList();
    // Buscar el índice de la receta existente para preservar el orden
    const existingIndex = data.recipeLists.findIndex(
      (list) => list.recipeName === recipeName
    );
    
    if (existingIndex !== -1) {
      // Actualizar la lista existente en su posición original
      data.recipeLists[existingIndex] = { recipeName, items };
    } else {
      // Si no existe, agregar al final
      data.recipeLists.push({ recipeName, items });
    }
    await this.saveShoppingList(data);
  }

  /**
   * Eliminar receta de toda la semana (función interna para evitar recursión)
   */
  private async _removeRecipeFromAllWeek(recipeName: string): Promise<void> {
    const weekData = await this.loadWeek();
    const days: DayOfWeek[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const mealTypes: MealType[] = ["lunch", "dinner"];

    let weekChanged = false;
    for (const day of days) {
      for (const mealType of mealTypes) {
        const originalLength = weekData[day][mealType].length;
        weekData[day][mealType] = weekData[day][mealType].filter(
          (meal: WeekMeal) => meal.recipeName !== recipeName
        );
        if (weekData[day][mealType].length !== originalLength) {
          weekChanged = true;
        }
      }
    }

    // Solo guardar si hubo cambios
    if (weekChanged) {
      await this.saveWeek(weekData);
    }
  }

  /**
   * Eliminar lista de compra de una receta
   */
  async removeRecipeShoppingList(recipeName: string): Promise<void> {
    const data = await this.loadShoppingList();
    data.recipeLists = data.recipeLists.filter(
      (list) => list.recipeName !== recipeName
    );
    await this.saveShoppingList(data);

    // También eliminar la receta de la planificación semanal
    await this._removeRecipeFromAllWeek(recipeName);
  }

  /**
   * Actualizar item en lista general
   */
  async updateGeneralShoppingItem(
    itemId: string,
    updates: Partial<ShoppingListItem>
  ): Promise<void> {
    const data = await this.loadShoppingList();
    const index = data.generalItems.findIndex(
      (i) => i.id === itemId
    );
    if (index !== -1) {
      data.generalItems[index] = { ...data.generalItems[index], ...updates };
      await this.saveShoppingList(data);
    }
  }

  /**
   * Cargar datos de la semana desde la API
   */
  async loadWeek(forceReload = false): Promise<WeekData> {
    const userId = this.getUserId();
    if (!userId) {
      const emptyWeek: WeekData = {
        monday: { lunch: [], dinner: [] },
        tuesday: { lunch: [], dinner: [] },
        wednesday: { lunch: [], dinner: [] },
        thursday: { lunch: [], dinner: [] },
        friday: { lunch: [], dinner: [] },
        saturday: { lunch: [], dinner: [] },
        sunday: { lunch: [], dinner: [] },
      };
      return emptyWeek;
    }

    const userCache = this.getUserCache();
    
    // Si hay cache y no se fuerza recarga, devolver una copia nueva
    if (userCache.week && !forceReload) {
      return JSON.parse(JSON.stringify(userCache.week));
    }

    try {
      const week = await apiRequest<WeekData>('/api/week');
      const weekData = week || {
        monday: { lunch: [], dinner: [] },
        tuesday: { lunch: [], dinner: [] },
        wednesday: { lunch: [], dinner: [] },
        thursday: { lunch: [], dinner: [] },
        friday: { lunch: [], dinner: [] },
        saturday: { lunch: [], dinner: [] },
        sunday: { lunch: [], dinner: [] },
      };
      userCache.week = JSON.parse(JSON.stringify(weekData));
      return JSON.parse(JSON.stringify(userCache.week));
    } catch (error) {
      console.error("Error loading week from API:", error);
      const emptyWeek: WeekData = {
        monday: { lunch: [], dinner: [] },
        tuesday: { lunch: [], dinner: [] },
        wednesday: { lunch: [], dinner: [] },
        thursday: { lunch: [], dinner: [] },
        friday: { lunch: [], dinner: [] },
        saturday: { lunch: [], dinner: [] },
        sunday: { lunch: [], dinner: [] },
      };
      userCache.week = JSON.parse(JSON.stringify(emptyWeek));
      return JSON.parse(JSON.stringify(emptyWeek));
    }
  }

  /**
   * Guardar datos de la semana (guardado optimista: actualiza UI primero, luego guarda en servidor)
   */
  async saveWeek(data: WeekData): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const userCache = this.getUserCache();
    
    // GUARDADO OPTIMISTA: Actualizar cache inmediatamente
    userCache.week = JSON.parse(JSON.stringify(data));

    // Notificar cambio INMEDIATAMENTE para actualizar la UI
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent("que-comemos-week-changed", {
          detail: { timestamp: Date.now() },
        })
      );
    });

    // Guardar en la API en segundo plano
    try {
      await apiRequest('/api/week', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error guardando datos de la semana en la API:", error);
      throw error;
    }
  }

  /**
   * Agregar receta a un día y comida específica
   */
  async addRecipeToWeek(
    day: DayOfWeek,
    mealType: MealType,
    recipeName: string
  ): Promise<void> {
    const data = await this.loadWeek();
    // Evitar duplicados
    const exists = data[day][mealType].some(
      (meal) => meal.recipeName === recipeName
    );
    if (!exists) {
      data[day][mealType].push({ recipeName });
      await this.saveWeek(data);
    }
  }

  /**
   * Marcar una sola instancia de la receta como completada siguiendo el orden:
   * lunes comida → lunes cena → martes comida → martes cena → etc.
   */
  async markOneRecipeInstanceAsCompleted(recipeName: string): Promise<void> {
    const data = await this.loadWeek();
    const days: DayOfWeek[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    // Orden: primero lunch, luego dinner
    const mealTypes: MealType[] = ["lunch", "dinner"];

    let marked = false;
    // Recorrer en orden: lunes lunch → lunes dinner → martes lunch → martes dinner → etc.
    for (const day of days) {
      if (marked) break;
      for (const mealType of mealTypes) {
        if (marked) break;
        const index = data[day][mealType].findIndex(
          (meal) => meal.recipeName === recipeName && !meal.completed
        );
        if (index !== -1) {
          data[day][mealType][index] = {
            ...data[day][mealType][index],
            completed: true,
          };
          marked = true;
        }
      }
    }

    if (marked) {
      await this.saveWeek(data);

      // Verificar si la receta todavía tiene instancias no completadas
      const hasIncompleteInstances = days.some((day) =>
        mealTypes.some((mealType) =>
          data[day][mealType].some(
            (meal: WeekMeal) =>
              meal.recipeName === recipeName && !meal.completed
          )
        )
      );

      // Si no hay más instancias incompletas, eliminar la receta de la lista de compra
      if (!hasIncompleteInstances) {
        const shoppingData = await this.loadShoppingList();
        shoppingData.recipeLists = shoppingData.recipeLists.filter(
          (list) => list.recipeName !== recipeName
        );
        await this.saveShoppingList(shoppingData);
      }
    }
  }

  /**
   * Eliminar receta de un día y comida específica
   */
  async removeRecipeFromWeek(
    day: DayOfWeek,
    mealType: MealType,
    recipeName: string
  ): Promise<void> {
    const data = await this.loadWeek();
    data[day][mealType] = data[day][mealType].filter(
      (meal) => meal.recipeName !== recipeName
    );
    await this.saveWeek(data);

    // Verificar si la receta está en algún otro día de la semana
    const isRecipeInOtherDays = Object.entries(data).some(
      ([currentDay, dayMeals]: [string, WeekDayMeals]) => {
        if (currentDay === day) {
          // Solo verificar el otro tipo de comida del mismo día
          return dayMeals[mealType === "lunch" ? "dinner" : "lunch"].some(
            (meal: WeekMeal) => meal.recipeName === recipeName
          );
        } else {
          // Verificar ambos tipos de comida de otros días
          return (
            dayMeals.lunch.some(
              (meal: WeekMeal) => meal.recipeName === recipeName
            ) ||
            dayMeals.dinner.some(
              (meal: WeekMeal) => meal.recipeName === recipeName
            )
          );
        }
      }
    );

    // Si la receta no está en ningún otro día/comida, eliminarla de la lista de compra
    if (!isRecipeInOtherDays) {
      await this.removeRecipeShoppingList(recipeName);
    }
  }

  /**
   * Vaciar toda la planificación semanal
   */
  async clearWeek(): Promise<void> {
    // Obtener todas las recetas únicas de la semana antes de limpiarla
    const currentWeek = await this.loadWeek();
    const recipeNames = new Set<string>();
    Object.values(currentWeek).forEach((dayMeals: WeekDayMeals) => {
      dayMeals.lunch.forEach((meal: WeekMeal) =>
        recipeNames.add(meal.recipeName)
      );
      dayMeals.dinner.forEach((meal: WeekMeal) =>
        recipeNames.add(meal.recipeName)
      );
    });

    // Crear semana vacía y guardarla
    const emptyWeek: WeekData = {
      monday: { lunch: [], dinner: [] },
      tuesday: { lunch: [], dinner: [] },
      wednesday: { lunch: [], dinner: [] },
      thursday: { lunch: [], dinner: [] },
      friday: { lunch: [], dinner: [] },
      saturday: { lunch: [], dinner: [] },
      sunday: { lunch: [], dinner: [] },
    };
    await this.saveWeek(emptyWeek);

    // Eliminar cada receta de la lista de compra
    for (const recipeName of recipeNames) {
      await this.removeRecipeShoppingList(recipeName);
    }
  }
}

export const storage = new JSONFileService();
