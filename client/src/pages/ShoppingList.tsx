import {
  Box,
  Card,
  CardContent,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import WarningDialog from "../components/WarningDialog";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  saveIngredient,
  useIngredients,
  useShoppingList,
  useWeek,
} from "../hooks/useStorage";
import { storage } from "../services/storage";
import type { Ingredient } from "../types";
import {
  getAllIngredients,
} from "../utils/ingredientTranslations";
import type { IngredientData } from "../utils/ingredientTranslations";
import { getRandomColorFromString } from "../utils/colorUtils";

export default function ShoppingList() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const { shoppingList, refresh } = useShoppingList();
  const { refresh: refreshIngredients } = useIngredients();
  const { week } = useWeek();
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [deleteRecipeDialogOpen, setDeleteRecipeDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [allIngredientsData, setAllIngredientsData] = useState<IngredientData[]>([]);

  useEffect(() => {
    getAllIngredients().then(setAllIngredientsData);
  }, []);

  // Contar cuántas veces aparece cada receta en la semana (solo las no completadas)
  const recipeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const days: Array<keyof typeof week> = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const mealTypes: Array<"lunch" | "dinner"> = ["lunch", "dinner"];

    for (const day of days) {
      for (const mealType of mealTypes) {
        for (const meal of week[day][mealType]) {
          // Solo contar las recetas no completadas
          if (!meal.completed) {
            counts[meal.recipeName] = (counts[meal.recipeName] || 0) + 1;
          }
        }
      }
    }

    return counts;
  }, [week]);

  useEffect(() => {
    // Expandir todas las recetas por defecto
    const allRecipeNames = new Set(
      shoppingList.recipeLists.map((list) => list.recipeName)
    );
    setExpandedRecipes(allRecipeNames);
  }, [shoppingList.recipeLists]);

  const toggleRecipe = (recipeName: string) => {
    setExpandedRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeName)) {
        newSet.delete(recipeName);
      } else {
        newSet.add(recipeName);
      }
      return newSet;
    });
  };

  const handleRemoveGeneralItem = async (itemId: string) => {
    await storage.removeGeneralShoppingItem(itemId);
    refresh();
  };

  const handleRemoveRecipeList = useCallback((recipeName: string) => {
    setRecipeToDelete(recipeName);
    setDeleteRecipeDialogOpen(true);
  }, []);

  const confirmDeleteRecipe = useCallback(async () => {
    if (!recipeToDelete) return;

    try {
      await storage.removeRecipeShoppingList(recipeToDelete);
      showSnackbar(
        t("shopping.recipeRemovedFromShopping") ||
          "Receta eliminada del carrito de compra",
        "success"
      );
      setRecipeToDelete(null);
      refresh();
    } catch (error) {
      console.error("Error removing recipe from shopping list:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : "Error desconocido"),
        "error"
      );
    } finally {
      setDeleteRecipeDialogOpen(false);
    }
  }, [recipeToDelete, showSnackbar, t, refresh]);

  const cancelDeleteRecipe = useCallback(() => {
    setDeleteRecipeDialogOpen(false);
    setRecipeToDelete(null);
  }, []);

  const handleRemoveRecipeItem = async (
    recipeName: string,
    itemId: string
  ) => {
    const recipeList = shoppingList.recipeLists.find(
      (list) => list.recipeName === recipeName
    );
    if (recipeList) {
      // Encontrar el item que se va a eliminar para obtener su medida
      const itemToRemove = recipeList.items.find(
        (item) => item.id === itemId
      );

      if (itemToRemove) {
        try {
          // Buscar el ingrediente completo en la lista global por id
          const ingredientData = allIngredientsData.find(
            (g) => g.id === itemToRemove.id
          );
          const category = ingredientData?.category || "other";

          // Agregar el ingrediente al inventario porque se compró
          const newIngredient: Ingredient = {
            id: itemToRemove.id,
            category: category as Ingredient["category"],
            measure: itemToRemove.measure || "",
          };

          await saveIngredient(newIngredient);
          await refreshIngredients();

          const displayName = ingredientData
            ? i18n.language === "en"
              ? ingredientData.nameEN
              : ingredientData.nameES
            : itemToRemove.id;

          showSnackbar(
            t("shopping.ingredientAddedToInventory") ||
              `${displayName} agregado al inventario`,
            "success"
          );
        } catch (error) {
          console.error("Error adding ingredient to inventory:", error);
          showSnackbar(
            t("common.error") +
              ": " +
              (error instanceof Error ? error.message : "Error desconocido"),
            "error"
          );
        }
      }

      // Eliminar el item de la lista de compra
      const updatedItems = recipeList.items.filter(
        (item) => item.id !== itemId
      );
      // Mantener la lista de la receta incluso si no hay items faltantes
      // para que el usuario pueda gestionar los ingredientes del inventario
      await storage.addRecipeShoppingList(recipeName, updatedItems);
      refresh();
    }
  };

  const hasItems =
    shoppingList.generalItems.length > 0 || shoppingList.recipeLists.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h2" component="h2">
          {t("shopping.title") || "Carrito de la compra"}
        </Typography>
      </Box>

      {!hasItems ? (
        <Card>
          <CardContent>
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              {t("shopping.noItems") || "No hay items en tu lista de compra."}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Lista general (sin receta) */}
          {shoppingList.generalItems.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    {t("shopping.generalItems") || "Ingredientes sin receta"}
                  </Typography>
                </Box>
                <List>
                  {shoppingList.generalItems.map((item, idx) => {
                    const ingData = allIngredientsData.find((g) => g.id === item.id);
                    const displayName = ingData
                      ? i18n.language === "en"
                        ? ingData.nameEN
                        : ingData.nameES
                      : item.id;
                    const baseColor = getRandomColorFromString(item.id);
                    
                    return (
                      <ListItem
                        key={idx}
                        sx={{
                          border: "1px solid",
                          borderColor: baseColor,
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: baseColor,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            boxShadow: `0 2px 8px ${baseColor}40`,
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <ListItemText
                          primary={displayName}
                          secondary={
                            item.measure ||
                            t("shopping.noMeasure") ||
                            "Sin medida"
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveGeneralItem(item.id)}
                          sx={{ fontSize: "1.3rem" }}
                        >
                          🗑️
                        </IconButton>
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Listas por receta */}
          {shoppingList.recipeLists.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t("shopping.recipeLists") || "Listas por receta"}
              </Typography>
              {shoppingList.recipeLists.map((recipeList) => (
                <Card key={recipeList.recipeName} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: expandedRecipes.has(recipeList.recipeName) ? 2 : 0,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => toggleRecipe(recipeList.recipeName)}
                          sx={{ fontSize: "1.2rem" }}
                        >
                          {expandedRecipes.has(recipeList.recipeName)
                            ? "▼"
                            : "▶"}
                        </IconButton>
                        <Typography variant="h6">
                          {recipeList.recipeName}
                          {recipeCounts[recipeList.recipeName] > 1 && (
                            <Box
                              component="span"
                              sx={{
                                ml: 1,
                                px: 1,
                                py: 0.5,
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                borderRadius: 1,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                              }}
                            >
                              x{recipeCounts[recipeList.recipeName]}
                            </Box>
                          )}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleRemoveRecipeList(recipeList.recipeName)
                          }
                          sx={{ fontSize: "1.3rem" }}
                          title={
                            t("shopping.removeRecipe") ||
                            "Eliminar receta del carrito"
                          }
                        >
                          🗑️
                        </IconButton>
                      </Box>
                    </Box>
                    {expandedRecipes.has(recipeList.recipeName) && (
                      <>
                        {/* Lista de ingredientes faltantes */}
                        <List>
                          {recipeList.items.length === 0 ? (
                            <ListItem>
                              <ListItemText
                                primary={
                                  t("shopping.allItemsPurchased") ||
                                  "Todos los ingredientes han sido comprados"
                                }
                                secondary={
                                  t("shopping.goToCooking") ||
                                  "Ve a la página de Cocinar para gestionar el inventario y ver las instrucciones"
                                }
                              />
                            </ListItem>
                          ) : (
                            <>
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ mb: 1, fontWeight: 600 }}
                                >
                                  {t("home.missingIngredients") ||
                                    "Ingredientes faltantes"}
                                </Typography>
                              </Box>
                              {recipeList.items.map((item, idx) => {
                                const ingData = allIngredientsData.find((g) => g.id === item.id);
                                const displayName = ingData
                                  ? i18n.language === "en"
                                    ? ingData.nameEN
                                    : ingData.nameES
                                  : item.id;
                                const baseColor = getRandomColorFromString(item.id);
                                
                                return (
                                  <ListItem
                                    key={idx}
                                    sx={{
                                      border: "1px solid",
                                      borderColor: baseColor,
                                      borderRadius: 1,
                                      mb: 1,
                                      bgcolor: baseColor,
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        boxShadow: `0 2px 8px ${baseColor}40`,
                                        transform: "translateY(-1px)",
                                      },
                                    }}
                                  >
                                    <ListItemText
                                      primary={displayName}
                                      secondary={
                                        item.measure ||
                                        t("shopping.noMeasure") ||
                                        "Sin medida"
                                      }
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleRemoveRecipeItem(
                                          recipeList.recipeName,
                                          item.id
                                        )
                                      }
                                      sx={{ fontSize: "1.3rem" }}
                                    >
                                      🗑️
                                    </IconButton>
                                  </ListItem>
                                );
                              })}
                            </>
                          )}
                        </List>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}

      <WarningDialog
        open={deleteRecipeDialogOpen}
        title={t("shopping.removeRecipe")}
        message={
          recipeToDelete
            ? t("shopping.removeRecipeMessage", {
                recipe: recipeToDelete,
              }) ||
              `¿Estás seguro de querer eliminar "${recipeToDelete}" del carrito de compra? También se eliminará de la planificación semanal.`
            : ""
        }
        onConfirm={confirmDeleteRecipe}
        onCancel={cancelDeleteRecipe}
      />
    </Container>
  );
}
