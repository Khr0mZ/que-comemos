// Tipos compartidos con el cliente
// Estos tipos deben coincidir con los del cliente

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
  name: string;
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

export interface ConfirmedRecipeShoppingList {
  recipeName: string;
  items: ShoppingListItem[];
}

export interface ShoppingListData {
  generalItems: ShoppingListItem[];
  recipeLists: ConfirmedRecipeShoppingList[];
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

