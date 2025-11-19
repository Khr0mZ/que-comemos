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
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import WarningDialog from "../components/WarningDialog";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  clearWeek,
  removeRecipeFromWeek,
  useWeek,
} from "../hooks/useStorage";
import type { DayOfWeek, MealType } from "../types";

export default function WeekPage() {
  const { t } = useTranslation();
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
        t("common.error") + ": " + (error instanceof Error ? error.message : ""),
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
        t("common.error") + ": " + (error instanceof Error ? error.message : ""),
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
      (dayMeals) =>
        dayMeals.lunch.length === 0 && dayMeals.dinner.length === 0
    );
  }, [week]);

  const handleViewRecipe = useCallback(
    (recipeName: string) => {
      navigate(`/recipe/${encodeURIComponent(recipeName)}`);
    },
    [navigate]
  );

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

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}></TableCell>
              {days.map((day) => (
                <TableCell key={day.value} align="center" sx={{ fontWeight: 600 }}>
                  {day.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {mealTypes.map((meal) => (
              <TableRow key={meal.value}>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: 600, minWidth: 120 }}
                >
                  {meal.label}
                </TableCell>
                {days.map((day) => {
                  const meals = week[day.value][meal.value];
                  return (
                    <TableCell key={`${day.value}-${meal.value}`} align="center">
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          minHeight: 60,
                          alignItems: "center",
                          justifyContent: "flex-start",
                          py: 1,
                        }}
                      >
                        {meals.length === 0 ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontStyle: "italic" }}
                          >
                            {t("week.noRecipes")}
                          </Typography>
                        ) : (
                          meals.map((mealItem, index) => (
                            <Chip
                              key={`${mealItem.recipeName}-${index}`}
                              label={mealItem.recipeName}
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
                                bgcolor: mealItem.completed
                                  ? "success.main"
                                  : undefined,
                                color: mealItem.completed
                                  ? "success.contrastText"
                                  : undefined,
                                "&:hover": {
                                  bgcolor: mealItem.completed
                                    ? "success.dark"
                                    : "action.hover",
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
                recipe: recipeToDelete.recipeName,
                day: days.find((d) => d.value === recipeToDelete.day)?.label,
                meal: mealTypes.find((m) => m.value === recipeToDelete.mealType)
                  ?.label,
              }) ||
              `¿Estás seguro de querer eliminar "${recipeToDelete.recipeName}" del ${days.find((d) => d.value === recipeToDelete.day)?.label} (${mealTypes.find((m) => m.value === recipeToDelete.mealType)?.label})?`
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

