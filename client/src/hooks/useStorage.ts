import { useCallback, useEffect, useRef, useState } from 'react'
import { storage } from '../db/storage'
import type { Ingredient, Recipe } from '../types'

// Re-export storage for convenience
export { storage }

/**
 * Hook para obtener ingredientes con reactividad
 */
export function useIngredients() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)

    const loadIngredients = useCallback(async () => {
        try {
            // Cargar desde el cache (que ya está actualizado cuando se dispara el evento)
            const data = await storage.loadIngredients(false)
            // Usar JSON.parse/stringify para crear una copia completamente nueva
            // Esto asegura que React siempre detecte el cambio
            const newData = JSON.parse(JSON.stringify(data))
            // Siempre actualizar para asegurar que los cambios se reflejen
            setIngredients(newData)
            setLoading(false)
        } catch (error) {
            console.error('Error loading ingredients:', error)
            setLoading(false)
        }
    }, [])

    // Usar useRef para mantener la referencia más reciente de la función
    const loadIngredientsRef = useRef(loadIngredients)

    useEffect(() => {
        // Actualizar ref dentro del efecto
        loadIngredientsRef.current = loadIngredients
        loadIngredientsRef.current()

        // Escuchar cambios usando un evento personalizado
        const handleCustomStorageChange = () => {
            loadIngredientsRef.current()
        }

        window.addEventListener('que-comemos-ingredients-changed', handleCustomStorageChange)

        return () => {
            window.removeEventListener('que-comemos-ingredients-changed', handleCustomStorageChange)
        }
    }, [loadIngredients])

    return { ingredients, loading, refresh: loadIngredients }
}

/**
 * Hook para obtener recetas con reactividad
 */
export function useRecipes() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)

    const loadRecipes = async () => {
        try {
            setLoading(true)
            const data = await storage.loadRecipes()
            setRecipes(data)
        } catch (error) {
            console.error('Error loading recipes:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRecipes()

        // Escuchar cambios usando un evento personalizado
        const handleCustomStorageChange = () => {
            loadRecipes()
        }

        window.addEventListener('que-comemos-recipes-changed', handleCustomStorageChange)

        return () => {
            window.removeEventListener('que-comemos-recipes-changed', handleCustomStorageChange)
        }
    }, [])

    return { recipes, loading, refresh: loadRecipes }
}

/**
 * Disparar evento personalizado para notificar cambios
 */
function notifyRecipesChange() {
    window.dispatchEvent(new Event('que-comemos-recipes-changed'))
}

/**
 * Wrapper para guardar ingredientes y notificar cambios
 */
export async function saveIngredient(ingredient: Ingredient): Promise<Ingredient> {
    const result = await storage.addIngredient(ingredient)
    // No necesitamos notificar aquí porque saveIngredients ya lo hace
    return result
}

export async function updateIngredient(name: string, updates: Partial<Ingredient>): Promise<void> {
    await storage.updateIngredient(name, updates)
    // No necesitamos notificar aquí porque saveIngredients ya lo hace
    // notifyIngredientsChange();
}

export async function deleteIngredient(name: string): Promise<void> {
    await storage.deleteIngredient(name)
    // No necesitamos notificar aquí porque saveIngredients ya lo hace
    // notifyIngredientsChange();
}

/**
 * Wrapper para guardar recetas y notificar cambios
 */
export async function saveRecipe(recipe: Recipe): Promise<Recipe> {
    const result = await storage.addRecipe(recipe)
    notifyRecipesChange()
    return result
}

export async function updateRecipe(name: string, updates: Partial<Recipe>): Promise<void> {
    await storage.updateRecipe(name, updates)
    notifyRecipesChange()
}

export async function deleteRecipe(name: string): Promise<void> {
    await storage.deleteRecipe(name)
    notifyRecipesChange()
}
