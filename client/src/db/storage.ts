import type { Ingredient, IngredientCategory, Recipe } from '../types';

// Cache en memoria para los datos cargados
let ingredientsCache: Ingredient[] | null = null;
let recipesCache: Recipe[] | null = null;

/**
 * Servicio de almacenamiento usando archivos JSON en la carpeta db
 */
class JSONFileService {
  /**
   * Cargar ingredientes desde el archivo JSON
   */
  async loadIngredients(forceReload = false): Promise<Ingredient[]> {
    // Si hay cache, devolver una copia nueva para asegurar que React detecte cambios
    if (ingredientsCache && !forceReload) {
      return ingredientsCache.map(ing => ({ ...ing }));
    }

    // Solo cargar desde archivo si no hay cache
    try {
      const ingredientsModule = await import('./ingredients.json');
      const ingredients = (ingredientsModule.default || []) as Ingredient[];
      ingredientsCache = ingredients;
      return ingredientsCache.map(ing => ({ ...ing }));
    } catch (error) {
      console.error('Error loading ingredients from JSON file:', error);
      return [];
    }
  }

  /**
   * Guardar ingredientes (actualiza el cache y escribe al archivo)
   */
  async saveIngredients(ingredients: Ingredient[]): Promise<void> {
    // Crear una copia nueva del array para evitar referencias compartidas
    // Esto asegura que siempre tengamos una nueva referencia
    ingredientsCache = ingredients.map(ing => ({ ...ing }));
    
    // Notificar cambio INMEDIATAMENTE después de actualizar el cache
    // Usar requestAnimationFrame para asegurar que el evento se dispare
    // en el siguiente frame de renderizado
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('que-comemos-ingredients-changed', {
        detail: { timestamp: Date.now() }
      }));
    });
    
    // Intentar guardar en el archivo JSON (solo funciona en desarrollo)
    // Esto se hace después de notificar para no bloquear la UI
    try {
      const response = await fetch('/api/save-ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredients),
      });
      
      if (!response.ok) {
        console.warn('No se pudo guardar en el archivo (esto es normal en producción)');
      }
    } catch {
      // En producción o si el servidor no está disponible, solo actualizamos el cache
      console.warn('No se pudo guardar en el archivo (esto es normal en producción)');
    }
  }

  /**
   * Agregar un ingrediente
   */
  async addIngredient(ingredient: Ingredient): Promise<Ingredient> {
    const ingredients = await this.loadIngredients();
    // Verificar si ya existe un ingrediente con el mismo nombre
    const existingIndex = ingredients.findIndex(ing => ing.name === ingredient.name);
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
   * Actualizar un ingrediente por nombre
   */
  async updateIngredient(name: string, updates: Partial<Ingredient>): Promise<void> {
    const ingredients = await this.loadIngredients();
    // Buscar por nombre (case-insensitive para mayor robustez)
    const index = ingredients.findIndex(
      ing => ing.name.toLowerCase() === name.toLowerCase()
    );
    if (index === -1) {
      // Si no existe, crear uno nuevo en lugar de lanzar error
      // Esto hace el método más robusto
      const newIngredient: Ingredient = {
        name: updates.name || name,
        category: (updates.category || 'other') as IngredientCategory,
        measure: updates.measure || '',
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
   * Eliminar un ingrediente por nombre
   */
  async deleteIngredient(name: string): Promise<void> {
    const ingredients = await this.loadIngredients();
    const filtered = ingredients.filter(ing => ing.name !== name);
    await this.saveIngredients(filtered);
  }

  /**
   * Cargar recetas desde el archivo JSON
   */
  async loadRecipes(): Promise<Recipe[]> {
    if (recipesCache) {
      return recipesCache;
    }

    try {
      const recipesModule = await import('./recipes.json');
      const recipes = (recipesModule.default || []) as Recipe[];
      recipesCache = recipes;
      return recipesCache;
    } catch (error) {
      console.error('Error loading recipes from JSON file:', error);
      return [];
    }
  }

  /**
   * Guardar recetas (actualiza el cache y escribe al archivo)
   */
  async saveRecipes(recipes: Recipe[]): Promise<void> {
    recipesCache = recipes;
    
    // Intentar guardar en el archivo JSON (solo funciona en desarrollo)
    try {
      const response = await fetch('/api/save-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipes),
      });
      
      if (!response.ok) {
        console.warn('No se pudo guardar en el archivo (esto es normal en producción)');
      }
    } catch {
      // En producción o si el servidor no está disponible, solo actualizamos el cache
      console.warn('No se pudo guardar en el archivo (esto es normal en producción)');
    }
    
    // Notificar cambio para que los hooks se actualicen
    window.dispatchEvent(new Event('que-comemos-recipes-changed'));
  }

  /**
   * Agregar una receta
   */
  async addRecipe(recipe: Recipe): Promise<Recipe> {
    const recipes = await this.loadRecipes();
    // Verificar si ya existe una receta con el mismo nombre
    const existingIndex = recipes.findIndex(rec => rec.name === recipe.name);
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
    const index = recipes.findIndex(rec => rec.name === name);
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
    const filtered = recipes.filter(rec => rec.name !== name);
    await this.saveRecipes(filtered);
  }

  /**
   * Obtener una receta por nombre
   */
  async getRecipe(name: string): Promise<Recipe | undefined> {
    const recipes = await this.loadRecipes();
    return recipes.find(rec => rec.name === name);
  }

  /**
   * Exportar ingredientes como JSON (para descargar)
   */
  exportIngredients(): string {
    return JSON.stringify(ingredientsCache || [], null, 2);
  }

  /**
   * Exportar recetas como JSON (para descargar)
   */
  exportRecipes(): string {
    return JSON.stringify(recipesCache || [], null, 2);
  }

  /**
   * Importar ingredientes desde JSON
   */
  async importIngredients(json: string): Promise<void> {
    try {
      const ingredients = JSON.parse(json) as Ingredient[];
      ingredientsCache = null; // Limpiar cache para forzar recarga
      await this.saveIngredients(ingredients);
    } catch (error) {
      console.error('Error importing ingredients:', error);
      throw error;
    }
  }

  /**
   * Importar recetas desde JSON
   */
  async importRecipes(json: string): Promise<void> {
    try {
      const recipes = JSON.parse(json) as Recipe[];
      recipesCache = null; // Limpiar cache para forzar recarga
      await this.saveRecipes(recipes);
    } catch (error) {
      console.error('Error importing recipes:', error);
      throw error;
    }
  }

  /**
   * Limpiar cache (útil después de importar)
   */
  clearCache(): void {
    ingredientsCache = null;
    recipesCache = null;
  }
}

export const storage = new JSONFileService();

