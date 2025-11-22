import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  IconButton,
  List,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  markOneRecipeInstanceAsCompleted,
  updateIngredient,
  useIngredients,
  useShoppingList,
  useWeek,
} from "../hooks/useStorage";
import { storage } from "../services/storage";
import type { Recipe, RecipeAvailability } from "../types";
import { getRandomColorFromString } from "../utils/colorUtils";
import type { IngredientData } from "../utils/ingredientTranslations";
import { getAllIngredients } from "../utils/ingredientTranslations";
import { checkRecipeAvailability } from "../utils/recipeUtils";

export default function Cooking() {
  const { t, i18n: i18nHook } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { shoppingList, refresh } = useShoppingList();
  const { refresh: refreshIngredients } = useIngredients();
  const { week } = useWeek();
  const [recipeAvailabilities, setRecipeAvailabilities] = useState<
    Map<string, RecipeAvailability>
  >(new Map());
  const [editingInventoryMeasures, setEditingInventoryMeasures] = useState<
    Map<string, Record<string, string>>
  >(new Map());
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [allIngredientsData, setAllIngredientsData] = useState<
    IngredientData[]
  >([]);

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

  // Obtener recetas disponibles para cocinar (sin ingredientes faltantes y con instancias no completadas)
  const availableRecipes = useMemo(() => {
    return shoppingList.recipeLists.filter((list) => {
      // Debe no tener ingredientes faltantes
      if (list.items.length > 0) return false;

      // Debe tener al menos una instancia no completada en la semana
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

      const hasIncompleteInstance = days.some((day) =>
        mealTypes.some((mealType) =>
          week[day][mealType].some(
            (meal) => meal.recipeName === list.recipeName && !meal.completed
          )
        )
      );

      return hasIncompleteInstance;
    });
  }, [shoppingList.recipeLists, week]);

  // Función helper para obtener las instrucciones según el idioma actual
  const getInstructions = (recipe: Recipe | null): string => {
    if (!recipe) return "";
    const currentLang = i18nHook.language || "es";
    if (currentLang === "en" && recipe.instructionsEN) {
      return recipe.instructionsEN;
    }
    return recipe.instructionsES || recipe.instructionsEN || "";
  };

  // Cargar disponibilidad de recetas
  useEffect(() => {
    const loadAvailabilities = async () => {
      const newAvailabilities = new Map<string, RecipeAvailability>();
      for (const recipeList of availableRecipes) {
        try {
          const recipe = await storage.getRecipe(recipeList.recipeName);
          if (recipe) {
            const availability = await checkRecipeAvailability(recipe);
            newAvailabilities.set(recipeList.recipeName, availability);
          }
        } catch (error) {
          console.error(
            `Error loading availability for recipe ${recipeList.recipeName}:`,
            error
          );
        }
      }
      setRecipeAvailabilities(newAvailabilities);
    };
    loadAvailabilities();
  }, [availableRecipes]);

  useEffect(() => {
    // Expandir todas las recetas por defecto
    const allRecipeNames = new Set(
      availableRecipes.map((list) => list.recipeName)
    );
    // Usar setTimeout para evitar el warning de setState en efecto
    const timer = setTimeout(() => {
      setExpandedRecipes(allRecipeNames);
    }, 0);
    return () => clearTimeout(timer);
  }, [availableRecipes]);

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

  const handleInventoryMeasureChange = (
    recipeName: string,
    ingredientName: string,
    newMeasure: string
  ) => {
    setEditingInventoryMeasures((prev) => {
      const newMap = new Map(prev);
      const recipeMeasures = newMap.get(recipeName) || {};
      recipeMeasures[ingredientName] = newMeasure;
      newMap.set(recipeName, recipeMeasures);
      return newMap;
    });
  };

  const handleConfirmIngredientInventory = async (
    recipeName: string,
    ingredientId: string
  ) => {
    const recipeMeasures = editingInventoryMeasures.get(recipeName);
    if (!recipeMeasures || !recipeMeasures[ingredientId]) return;

    const newMeasure = recipeMeasures[ingredientId];

    try {
      // Aplicar el cambio al inventario
      await updateIngredient(ingredientId, { measure: newMeasure });

      // Refrescar los ingredientes
      await refreshIngredients();

      // Actualizar disponibilidad
      const recipe = await storage.getRecipe(recipeName);
      if (recipe) {
        const updatedAvailability = await checkRecipeAvailability(recipe);
        setRecipeAvailabilities((prev) => {
          const newMap = new Map(prev);
          newMap.set(recipeName, updatedAvailability);
          return newMap;
        });
      }

      // Limpiar el estado de edición para este ingrediente específico
      setEditingInventoryMeasures((prev) => {
        const newMap = new Map(prev);
        const recipeMeasures = newMap.get(recipeName) || {};
        delete recipeMeasures[ingredientId];
        if (Object.keys(recipeMeasures).length === 0) {
          newMap.delete(recipeName);
        } else {
          newMap.set(recipeName, recipeMeasures);
        }
        return newMap;
      });

      showSnackbar(
        t("cooking.inventoryUpdated") || "Inventario actualizado",
        "success"
      );
    } catch (error) {
      console.error("Error updating inventory:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : "Error desconocido"),
        "error"
      );
    }
  };

  const handleCancelIngredientEdit = (
    recipeName: string,
    ingredientId: string
  ) => {
    setEditingInventoryMeasures((prev) => {
      const newMap = new Map(prev);
      const recipeMeasures = newMap.get(recipeName) || {};
      delete recipeMeasures[ingredientId];
      if (Object.keys(recipeMeasures).length === 0) {
        newMap.delete(recipeName);
      } else {
        newMap.set(recipeName, recipeMeasures);
      }
      return newMap;
    });
  };

  const handleCompleteRecipe = async (recipeName: string) => {
    try {
      // Marcar una instancia de la receta como completada
      // Si es la última instancia incompleta, también se eliminará del shopping list
      await markOneRecipeInstanceAsCompleted(recipeName);
      refresh();

      navigate("/planning");

      showSnackbar(
        t("cooking.recipeCompleted") || "¡Receta completada! ¡A comer!",
        "success"
      );
    } catch (error) {
      console.error("Error completing recipe:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : "Error desconocido"),
        "error"
      );
    }
  };

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
          {t("cooking.title") || "Cocinar"}
        </Typography>
      </Box>

      {availableRecipes.length === 0 ? (
        <Card>
          <CardContent>
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              {t("cooking.noRecipes") ||
                "No hay recetas listas para cocinar. Compra todos los ingredientes faltantes primero."}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {availableRecipes.map((recipeList) => {
            const availability = recipeAvailabilities.get(
              recipeList.recipeName
            );
            const recipeMeasures =
              editingInventoryMeasures.get(recipeList.recipeName) || {};

            return (
              <Card key={recipeList.recipeName} sx={{ mb: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: expandedRecipes.has(recipeList.recipeName) ? 2 : 0,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleRecipe(recipeList.recipeName)}
                        sx={{ fontSize: "1.2rem" }}
                      >
                        {expandedRecipes.has(recipeList.recipeName) ? "▼" : "▶"}
                      </IconButton>
                      <Typography variant="h5">
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
                  </Box>

                  {expandedRecipes.has(recipeList.recipeName) && (
                    <>
                      {/* Gestor de inventario */}
                      {availability &&
                        availability.availableIngredients.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 1, fontWeight: 600 }}
                            >
                              {t("cooking.inventoryIngredientsUsed") ||
                                "Ingredientes del inventario usados en la receta"}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 2 }}
                            >
                              {t("cooking.adjustQuantities") ||
                                "Ajusta las cantidades según lo que uses de la receta"}
                            </Typography>
                            <List dense>
                              {availability.availableIngredients.map(
                                (match, idx) => {
                                  const originalMeasure =
                                    match.inventoryIngredient.measure || "";
                                  const currentMeasure =
                                    recipeMeasures[
                                      match.inventoryIngredient.id
                                    ] !== undefined
                                      ? recipeMeasures[
                                          match.inventoryIngredient.id
                                        ]
                                      : originalMeasure;
                                  const isEdited =
                                    recipeMeasures[
                                      match.inventoryIngredient.id
                                    ] !== undefined &&
                                    recipeMeasures[
                                      match.inventoryIngredient.id
                                    ] !== originalMeasure;

                                  const ingredientId =
                                    match.inventoryIngredient.id;
                                  const baseColor =
                                    getRandomColorFromString(ingredientId);
                                  const borderColor = isEdited
                                    ? "primary.main"
                                    : baseColor;
                                  const bgColor = isEdited
                                    ? "action.selected"
                                    : baseColor;

                                  return (
                                    <ListItem
                                      key={idx}
                                      sx={{
                                        border: "1px solid",
                                        borderColor: borderColor,
                                        borderRadius: 1,
                                        mb: 1,
                                        bgcolor: bgColor,
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                          boxShadow: `0 2px 8px ${baseColor}40`,
                                          transform: "translateY(-1px)",
                                        },
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: "100%",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 2,
                                          flexWrap: {
                                            xs: "wrap",
                                            sm: "nowrap",
                                          },
                                        }}
                                      >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography
                                            variant="body1"
                                            fontWeight={500}
                                          >
                                            {(() => {
                                              const ingData =
                                                allIngredientsData.find(
                                                  (g) =>
                                                    g.id ===
                                                    match.inventoryIngredient.id
                                                );
                                              return ingData
                                                ? i18nHook.language === "en"
                                                  ? ingData.nameEN
                                                  : ingData.nameES
                                                : match.inventoryIngredient.id;
                                            })()}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {t("cooking.requiredInRecipe") ||
                                              "Requerido en receta"}
                                            :{" "}
                                            {(() => {
                                              const ingData =
                                                allIngredientsData.find(
                                                  (g) =>
                                                    g.id ===
                                                    match.recipeIngredientName
                                                );
                                              return ingData
                                                ? i18nHook.language === "en"
                                                  ? ingData.nameEN
                                                  : ingData.nameES
                                                : match.recipeIngredientName;
                                            })()}{" "}
                                            ({match.recipeIngredientMeasure})
                                          </Typography>
                                        </Box>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            minWidth: { xs: "100%", sm: 300 },
                                            flexWrap: {
                                              xs: "wrap",
                                              sm: "nowrap",
                                            },
                                          }}
                                        >
                                          <TextField
                                            size="small"
                                            value={currentMeasure}
                                            onChange={(e) =>
                                              handleInventoryMeasureChange(
                                                recipeList.recipeName,
                                                match.inventoryIngredient.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder={
                                              originalMeasure ||
                                              t("cooking.noMeasure") ||
                                              "Sin medida"
                                            }
                                            sx={{ flex: 1, minWidth: 150 }}
                                          />
                                          {isEdited && (
                                            <>
                                              <Button
                                                size="small"
                                                variant="contained"
                                                onClick={() =>
                                                  handleConfirmIngredientInventory(
                                                    recipeList.recipeName,
                                                    match.inventoryIngredient.id
                                                  )
                                                }
                                                sx={{
                                                  minWidth: "auto",
                                                  px: 1.5,
                                                  py: 0.5,
                                                  bgcolor: "#4caf50",
                                                  color: "white",
                                                  borderRadius: 2,
                                                  fontSize: "1.1rem",
                                                  fontWeight: 600,
                                                  boxShadow:
                                                    "0 2px 4px rgba(76, 175, 80, 0.3)",
                                                  "&:hover": {
                                                    bgcolor: "#45a049",
                                                    boxShadow:
                                                      "0 4px 8px rgba(76, 175, 80, 0.4)",
                                                    transform:
                                                      "translateY(-1px)",
                                                  },
                                                  transition: "all 0.2s ease",
                                                }}
                                                title={
                                                  t(
                                                    "cooking.confirmInventory"
                                                  ) || "Confirmar"
                                                }
                                              >
                                                ✓
                                              </Button>
                                              <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() =>
                                                  handleCancelIngredientEdit(
                                                    recipeList.recipeName,
                                                    match.inventoryIngredient.id
                                                  )
                                                }
                                                sx={{
                                                  minWidth: "auto",
                                                  px: 1.5,
                                                  py: 0.5,
                                                  borderColor: "#f44336",
                                                  color: "#f44336",
                                                  borderRadius: 2,
                                                  fontSize: "1.1rem",
                                                  fontWeight: 600,
                                                  borderWidth: 2,
                                                  "&:hover": {
                                                    borderColor: "#d32f2f",
                                                    bgcolor: "#ffebee",
                                                    borderWidth: 2,
                                                    transform:
                                                      "translateY(-1px)",
                                                  },
                                                  transition: "all 0.2s ease",
                                                }}
                                                title={
                                                  t("common.cancel") ||
                                                  "Cancelar"
                                                }
                                              >
                                                ✕
                                              </Button>
                                            </>
                                          )}
                                        </Box>
                                      </Box>
                                    </ListItem>
                                  );
                                }
                              )}
                            </List>
                          </Box>
                        )}

                      {/* Instrucciones */}
                      {(() => {
                        const recipe = availability?.recipe;
                        if (!recipe) return null;

                        const instructions = getInstructions(recipe);
                        if (!instructions) return null;

                        return (
                          <Card sx={{ mb: 3 }}>
                            {recipe.imageURL && (
                              <CardMedia
                                component="img"
                                height="200"
                                image={recipe.imageURL}
                                alt={recipe.name}
                              />
                            )}
                            <CardContent>
                              <Typography variant="h6" sx={{ mb: 2 }}>
                                {t("cooking.instructions") || "Instrucciones"}
                              </Typography>
                              <Box
                                sx={{
                                  "& h3": { mt: 2, mb: 1 },
                                  "& p": { mb: 1 },
                                  "& li": { mb: 0.5 },
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: instructions
                                    .split("\n")
                                    .map((line) => {
                                      if (line.trim().startsWith("#")) {
                                        return `<h3>${line.replace(
                                          /^#+\s*/,
                                          ""
                                        )}</h3>`;
                                      }
                                      if (
                                        line.trim().startsWith("-") ||
                                        line.trim().match(/^\d+\./)
                                      ) {
                                        return `<li>${line.replace(
                                          /^[-•]\s*|\d+\.\s*/,
                                          ""
                                        )}</li>`;
                                      }
                                      return `<p>${line}</p>`;
                                    })
                                    .join(""),
                                }}
                              />
                            </CardContent>
                          </Card>
                        );
                      })()}

                      {/* Botón completar */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mt: 3,
                        }}
                      >
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() =>
                            handleCompleteRecipe(recipeList.recipeName)
                          }
                          sx={{
                            bgcolor: "#ff6b35",
                            color: "white",
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            boxShadow: "0 4px 12px rgba(255, 107, 53, 0.4)",
                            "&:hover": {
                              bgcolor: "#e55a2b",
                              boxShadow: "0 6px 16px rgba(255, 107, 53, 0.5)",
                              transform: "translateY(-2px)",
                            },
                            transition: "all 0.3s ease",
                          }}
                          startIcon={
                            <span style={{ fontSize: "1.5rem" }}>🍽️</span>
                          }
                        >
                          {t("cooking.completeRecipe") || "¡A comer!"}
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Container>
  );
}
