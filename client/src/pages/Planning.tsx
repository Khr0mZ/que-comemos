import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import WarningDialog from "../components/WarningDialog";
import { useSnackbar } from "../hooks/useSnackbar";
import { clearWeek, removeRecipeFromWeek, useWeek } from "../hooks/useStorage";
import { storage } from "../services/storage";
import type { DayOfWeek, MealType, Recipe } from "../types";
import { getRecipeName } from "../utils/recipeUtils";

export default function Planning() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { week, loading } = useWeek();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<{
    day: DayOfWeek;
    mealType: MealType;
    recipeName: string;
  } | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [recipeCache, setRecipeCache] = useState<Map<string, Recipe>>(new Map());

  const days: { value: DayOfWeek; label: string }[] = [
    { value: "monday", label: t("week.days.monday") },
    { value: "tuesday", label: t("week.days.tuesday") },
    { value: "wednesday", label: t("week.days.wednesday") },
    { value: "thursday", label: t("week.days.thursday") },
    { value: "friday", label: t("week.days.friday") },
    { value: "saturday", label: t("week.days.saturday") },
    { value: "sunday", label: t("week.days.sunday") },
  ];

  const mealTypes: { value: MealType; label: string }[] = [
    { value: "lunch", label: t("week.mealTypes.lunch") },
    { value: "dinner", label: t("week.mealTypes.dinner") },
  ];

  const handleRemoveRecipe = useCallback(
    (day: DayOfWeek, mealType: MealType, recipeName: string) => {
      setRecipeToDelete({ day, mealType, recipeName });
      setDeleteDialogOpen(true);
    },
    []
  );

  const confirmDelete = useCallback(async () => {
    if (!recipeToDelete) return;

    try {
      await removeRecipeFromWeek(
        recipeToDelete.day,
        recipeToDelete.mealType,
        recipeToDelete.recipeName
      );
      showSnackbar(
        t("week.recipeRemoved") || "Receta eliminada de la semana",
        "success"
      );
      setRecipeToDelete(null);
    } catch (error) {
      console.error("Error removing recipe:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : ""),
        "error"
      );
    } finally {
      setDeleteDialogOpen(false);
    }
  }, [recipeToDelete, showSnackbar, t]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setRecipeToDelete(null);
  }, []);

  const handleClearWeek = useCallback(() => {
    setClearDialogOpen(true);
  }, []);

  const confirmClearWeek = useCallback(async () => {
    try {
      await clearWeek();
      showSnackbar(
        t("week.weekCleared") || "Planificación semanal vaciada",
        "success"
      );
      setClearDialogOpen(false);
    } catch (error) {
      console.error("Error clearing week:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : ""),
        "error"
      );
    }
  }, [showSnackbar, t]);

  const cancelClearWeek = useCallback(() => {
    setClearDialogOpen(false);
  }, []);

  // Verificar si la semana está vacía (contar todas las recetas, completadas o no)
  const isWeekEmpty = useMemo(() => {
    return Object.values(week).every(
      (dayMeals) => dayMeals.lunch.length === 0 && dayMeals.dinner.length === 0
    );
  }, [week]);

  const handleViewRecipe = useCallback(
    (recipeName: string) => {
      navigate(`/recipe/${encodeURIComponent(recipeName)}`);
    },
    [navigate]
  );

  // Cargar recetas para mostrar nombres según idioma
  useEffect(() => {
    const loadRecipes = async () => {
      const allRecipes = await storage.loadRecipes();
      const cache = new Map<string, Recipe>();
      allRecipes.forEach((recipe) => {
        const identifier = recipe.nameES || recipe.nameEN;
        if (identifier) {
          cache.set(identifier, recipe);
        }
      });
      setRecipeCache(cache);
    };
    loadRecipes();
  }, [week]);

  const getDisplayName = useCallback((recipeName: string): string => {
    const recipe = recipeCache.get(recipeName);
    if (recipe) {
      return getRecipeName(recipe, i18n.language || "es");
    }
    return recipeName;
  }, [recipeCache, i18n.language]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Typography>{t("common.loading")}</Typography>
      </Container>
    );
  }

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
          {t("week.title")}
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearWeek}
          disabled={isWeekEmpty}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <span style={{ fontSize: "1rem" }}>🗑️</span>
          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            {t("week.clearWeek")}
          </Box>
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "24px",
          boxShadow: "0 10px 30px rgba(255, 23, 68, 0.15)",
          border: "2px solid #FFC107",
          overflowX: "auto",
          overflowY: "hidden",
          transition: "all 0.3s ease",
          background: "linear-gradient(to bottom, #FFF9E6 0%, #FFFFFF 100%)",
          "&:hover": {
            boxShadow: "0 15px 35px rgba(255, 23, 68, 0.25)",
            transform: "translateY(-2px)",
          },
        }}
      >
        <Table
          sx={{
            minWidth: 600, // Ancho mínimo para asegurar que la tabla sea más ancha que el contenedor en pantallas pequeñas
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                background:
                  "linear-gradient(135deg, #FF6B9D 0%, #FFC107 50%, #a9def3 100%)",
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "white",
                  borderBottom: "none",
                  fontSize: "1.1rem",
                }}
              ></TableCell>
              {days.map((day) => (
                <TableCell
                  key={day.value}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    color: "white",
                    fontSize: "1.2rem",
                    py: 2.5,
                    borderBottom: "none",
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    transition: "all 0.2s",
                  }}
                >
                  {day.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {mealTypes.map((meal, index) => (
              <TableRow
                key={meal.value}
                sx={{
                  "&:nth-of-type(odd)": { backgroundColor: "#FFF9E6" },
                  "&:nth-of-type(even)": { backgroundColor: "#FFFFFF" },
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "#FFD54F20",
                  },
                }}
              >
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    fontWeight: 700,
                    minWidth: 120,
                    color: "#FF1744",
                    fontSize: "1.2rem",
                    borderBottom:
                      index === mealTypes.length - 1
                        ? "none"
                        : "2px solid #FFC10730",
                    borderRight: "2px solid #FFC10730",
                  }}
                >
                  {meal.label}
                </TableCell>
                {days.map((day) => {
                  const meals = week[day.value][meal.value];
                  return (
                    <TableCell
                      key={`${day.value}-${meal.value}`}
                      align="center"
                      sx={{
                        borderBottom:
                          index === mealTypes.length - 1
                            ? "none"
                            : "2px solid #FFC10730",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                          minHeight: 80,
                          alignItems: "center",
                          justifyContent: "center",
                          py: 1.5,
                        }}
                      >
                        {meals.length === 0 ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontStyle: "italic",
                              opacity: 0.5,
                              fontSize: "1rem",
                              transition: "all 0.3s",
                              "&:hover": {
                                transform: "scale(1.2) rotate(10deg)",
                                opacity: 0.8,
                              },
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              navigate("/recipes");
                            }}
                          >
                            {t("week.noRecipes")}
                          </Typography>
                        ) : (
                          meals.map((mealItem, index) => (
                            <Chip
                              key={`${mealItem.recipeName}-${index}`}
                              label={getDisplayName(mealItem.recipeName)}
                              onClick={() =>
                                handleViewRecipe(mealItem.recipeName)
                              }
                              onDelete={() =>
                                handleRemoveRecipe(
                                  day.value,
                                  meal.value,
                                  mealItem.recipeName
                                )
                              }
                              sx={{
                                cursor: "pointer",
                                maxWidth: "100%",
                                borderRadius: "20px",
                                fontWeight: 500,
                                fontSize: "1rem",
                                padding: "8px 12px",
                                boxShadow: mealItem.completed
                                  ? "0 3px 10px rgba(76, 175, 80, 0.3)"
                                  : "0 3px 10px rgba(255, 23, 68, 0.25)",
                                transition:
                                  "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                background: mealItem.completed
                                  ? "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)"
                                  : "linear-gradient(135deg, #a9def3 0%, #e7fdff 100%)",
                                color: mealItem.completed ? "white" : "#333",
                                border: "2px solid",
                                borderColor: mealItem.completed
                                  ? "#388E3C"
                                  : "#a9def3",
                                "&:hover": {
                                  transform:
                                    "scale(1.08) translateY(-4px) rotate(-2deg)",
                                  boxShadow: mealItem.completed
                                    ? "0 6px 16px rgba(76, 175, 80, 0.5)"
                                    : "0 6px 16px rgba(255, 193, 7, 0.4)",
                                  background: mealItem.completed
                                    ? "linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)"
                                    : "linear-gradient(135deg, #FF6B9D 0%, #FFC107 100%)",
                                  color: "white",
                                  borderColor: mealItem.completed
                                    ? "#2E7D32"
                                    : "#FF1744",
                                },
                              }}
                            />
                          ))
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <WarningDialog
        open={deleteDialogOpen}
        title={t("week.removeRecipe")}
        message={
          recipeToDelete
            ? t("week.removeRecipeMessage", {
                recipe: getDisplayName(recipeToDelete.recipeName),
                day: days.find((d) => d.value === recipeToDelete.day)?.label,
                meal: mealTypes.find((m) => m.value === recipeToDelete.mealType)
                  ?.label,
              }) ||
              `¿Estás seguro de querer eliminar "${
                getDisplayName(recipeToDelete.recipeName)
              }" del ${
                days.find((d) => d.value === recipeToDelete.day)?.label
              } (${
                mealTypes.find((m) => m.value === recipeToDelete.mealType)
                  ?.label
              })?`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <WarningDialog
        open={clearDialogOpen}
        title={t("week.clearWeek")}
        message={t("week.clearWeekMessage")}
        onConfirm={confirmClearWeek}
        onCancel={cancelClearWeek}
      />
    </Container>
  );
}
