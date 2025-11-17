// Tipos principales de la aplicación

export interface Ingredient {
    name: string
    category: IngredientCategory
    measure: string
}

export type IngredientCategory = 'vegetable' | 'fruit' | 'meat' | 'dairy' | 'grain' | 'spice' | 'beverage' | 'other'

export interface RecipeIngredient {
    name: string
    measure: string
}

export interface Recipe {
    name: string
    category: string
    area: string
    instructionsES?: string
    instructionsEN?: string
    imageURL?: string
    tags?: string[]
    videoURL?: string
    sourceURL?: string
    ingredients: RecipeIngredient[]
    source?: string
}

export interface ShoppingListItem {
    name: string
    measure: string
}

export interface RecipeAvailability {
    recipe: Recipe
    missingIngredients: ShoppingListItem[]
    availabilityStatus: 'available' | 'partial' | 'unavailable'
}
