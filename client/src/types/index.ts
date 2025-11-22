// Tipos principales de la aplicación

export interface Ingredient {
  id: string;
  category: IngredientCategory;
  measure: string;
}

export type IngredientCategory =
  | "vegetable"
  | "fruit"
  | "meat"
  | "dairy"
  | "grain"
  | "spice"
  | "beverage"
  | "other";

export interface RecipeIngredient {
  id: string;
  measure: string;
}

export interface Recipe {
  nameES: string;
  nameEN: string;
  category: string;
  area: string;
  instructionsES?: string;
  instructionsEN?: string;
  imageURL?: string;
  tags?: string[];
  videoURL?: string;
  sourceURL?: string;
  ingredients: RecipeIngredient[];
  source?: string;
  internal?: boolean; // true si la receta es interna (no es una de las recetas originales de recipes.json)
}

export interface ShoppingListItem {
  id: string;
  measure: string;
}

export interface InventoryIngredientMatch {
  recipeIngredientName: string; // ID del ingrediente en la receta
  recipeIngredientMeasure: string; // Medida requerida en la receta
  inventoryIngredient: Ingredient; // Ingrediente del inventario que coincide
}

export interface RecipeAvailability {
  recipe: Recipe;
  missingIngredients: ShoppingListItem[];
  availableIngredients: InventoryIngredientMatch[]; // Ingredientes del inventario que se usan en la receta
  availabilityStatus: "available" | "partial" | "unavailable";
}

export interface ConfirmedRecipeShoppingList {
  recipeName: string;
  items: ShoppingListItem[];
}

export interface ShoppingListData {
  generalItems: ShoppingListItem[]; // Ingredientes sin receta
  recipeLists: ConfirmedRecipeShoppingList[]; // Listas por receta confirmada
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
export type MealType = "lunch" | "dinner";

export interface WeekMeal {
  recipeName: string;
  completed?: boolean;
}

export interface WeekDayMeals {
  lunch: WeekMeal[];
  dinner: WeekMeal[];
}

export interface WeekData {
  monday: WeekDayMeals;
  tuesday: WeekDayMeals;
  wednesday: WeekDayMeals;
  thursday: WeekDayMeals;
  friday: WeekDayMeals;
  saturday: WeekDayMeals;
  sunday: WeekDayMeals;
}
