import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { storage } from "../services/storage";
import { syncService } from "../services/sync";
import type { Recipe } from "../types";
import { setGetTokenFunction } from "../utils/api";

/**
 * Componente que inicializa el userId en storage cuando Clerk carga
 * También configura la función para obtener tokens de autenticación
 */
export default function UserInitializer() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    // Configurar la función para obtener tokens
    if (getToken) {
      setGetTokenFunction(async () => {
        try {
          return await getToken();
        } catch (error) {
          console.error("Error obteniendo token:", error);
          return null;
        }
      });
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Usuario autenticado: establecer userId y cargar datos del servidor
        const previousUserId = storage.getUserId();
        storage.setUserId(user.id);

        // Si el usuario cambió o es la primera vez, cargar datos del servidor
        if (previousUserId !== user.id) {
          // Limpiar cache del usuario anterior si existe
          if (previousUserId) {
            storage.clearCache(previousUserId);
          }

          // Resetear servicio de sincronización
          syncService.stopSync();
          syncService.reset();

          // Cargar datos del nuevo usuario desde el servidor
          // Forzar recarga de todos los datos
          Promise.all([
            storage.loadIngredients(true),
            storage.loadRecipes(true),
            storage.loadShoppingList(true),
            storage.loadWeek(true),
          ])
            .then(async () => {
              // Si es la primera vez que el usuario se loguea (no tiene recetas),
              // copiar todas las recetas originales desde el servidor
              const recipes = await storage.loadRecipes(false);
              if (recipes.length === 0) {
                try {
                  // Cargar recetas originales desde el archivo JSON
                  const originalRecipesModule = await import(
                    "../data/recipes/recipes.json"
                  );
                  const originalRecipes = (originalRecipesModule.default ||
                    []) as Recipe[];

                  // Guardar las recetas originales para el nuevo usuario
                  await storage.saveRecipes(originalRecipes);
                } catch (error) {
                  console.error(
                    "Error inicializando recetas para nuevo usuario:",
                    error
                  );
                }
              }

              // Disparar eventos para que los hooks recarguen los datos
              window.dispatchEvent(
                new Event("que-comemos-ingredients-changed")
              );
              window.dispatchEvent(new Event("que-comemos-recipes-changed"));
              window.dispatchEvent(
                new Event("que-comemos-shopping-list-changed")
              );
              window.dispatchEvent(new Event("que-comemos-week-changed"));

              // Iniciar sincronización después de cargar los datos iniciales
              syncService.startSync();
            })
            .catch((error) => {
              console.error("Error cargando datos del usuario:", error);
            });
        } else if (!syncService.isConnected()) {
          // Si el usuario no cambió pero el SSE no está conectado, iniciarlo
          syncService.startSync();
        }
      } else {
        // Usuario no autenticado: limpiar userId y detener sincronización
        const previousUserId = storage.getUserId();
        storage.setUserId(null);
        syncService.stopSync();
        syncService.reset();

        // Limpiar cache cuando el usuario cierra sesión
        if (previousUserId) {
          storage.clearCache(previousUserId);
        }
      }
    }
  }, [user, isLoaded]);

  // Este componente no renderiza nada
  return null;
}
