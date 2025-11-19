import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import WarningDialog from "../components/WarningDialog";
import {
  deleteAllRecipes,
  deleteRecipe,
  resetRecipes,
  useRecipes,
} from "../hooks/useStorage";
import type { Recipe } from "../types";

const ITEMS_PER_PAGE = 30;

export default function RecipesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const containerRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const { recipes: allRecipes } = useRecipes();

  const recipes = useMemo(() => {
    if (!searchQuery.trim()) {
      return allRecipes;
    }
    const searchLower = searchQuery.toLowerCase();
    return allRecipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(searchLower) ||
        (recipe.tags &&
          recipe.tags.some((tag) => tag.toLowerCase().includes(searchLower))) ||
        (recipe.category &&
          recipe.category.toLowerCase().includes(searchLower)) ||
        (recipe.area && recipe.area.toLowerCase().includes(searchLower))
    );
  }, [allRecipes, searchQuery]);

  // Reset visible count when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(ITEMS_PER_PAGE);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get visible recipes for infinite scroll
  const visibleRecipes = useMemo(() => {
    return recipes.slice(0, visibleCount);
  }, [recipes, visibleCount]);

  // Handle infinite scroll using window scroll
  const handleScroll = useCallback(() => {
    if (visibleCount >= recipes.length) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercentage = (scrollTop + windowHeight) / documentHeight;

    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8) {
      setVisibleCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, recipes.length)
      );
    }
  }, [visibleCount, recipes.length]);

  const handleViewRecipe = useCallback(
    (recipe: Recipe) => {
      navigate(`/recipe/${encodeURIComponent(recipe.name)}`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (recipe: Recipe) => {
      navigate(`/recipe/${encodeURIComponent(recipe.name)}`, {
        state: { edit: true },
      });
    },
    [navigate]
  );

  const handleDelete = useCallback((name: string) => {
    setRecipeToDelete(name);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (recipeToDelete) {
      await deleteRecipe(recipeToDelete);
      setRecipeToDelete(null);
    }
    setDeleteDialogOpen(false);
  }, [recipeToDelete]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setRecipeToDelete(null);
  }, []);

  const handleReset = useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const confirmReset = useCallback(async () => {
    try {
      await resetRecipes();
      setResetDialogOpen(false);
    } catch (error) {
      console.error("Error resetting recipes:", error);
    }
  }, []);

  const cancelReset = useCallback(() => {
    setResetDialogOpen(false);
  }, []);

  const handleDeleteAll = useCallback(() => {
    setDeleteAllDialogOpen(true);
  }, []);

  const confirmDeleteAll = useCallback(async () => {
    try {
      await deleteAllRecipes();
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error("Error deleting all recipes:", error);
    }
  }, []);

  const cancelDeleteAll = useCallback(() => {
    setDeleteAllDialogOpen(false);
  }, []);

  // Attach scroll listener to window
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    // Also check on mount in case content is already scrolled
    const timer = setTimeout(() => {
      handleScroll();
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

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
          {t("recipes.title")}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAll}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <span style={{ fontSize: "1rem" }}>🗑️</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("recipes.deleteAllRecipes")}
            </Box>
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleReset}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <span style={{ fontSize: "1rem" }}>🔄</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("recipes.resetRecipes")}
            </Box>
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/recipe/new")}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <span style={{ fontSize: "1rem" }}>➕</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("recipes.addRecipe")}
            </Box>
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t("recipes.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>
                  🔍
                </span>
              ),
            },
          }}
        />
      </Box>

      {recipes.length === 0 && (
        <Card>
          <CardContent>
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              {t("recipes.noRecipes")}
            </Typography>
          </CardContent>
        </Card>
      )}

      {recipes.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box
            ref={containerRef}
            sx={{
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: 2,
              }}
            >
              {visibleRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.name}
                  recipe={recipe}
                  onView={handleViewRecipe}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </Box>
          </Box>
          {visibleCount < recipes.length && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("recipes.loadingMore", {
                  loaded: visibleCount,
                  total: recipes.length,
                }) || `Mostrando ${visibleCount} de ${recipes.length} recetas`}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <WarningDialog
        open={deleteDialogOpen}
        title={t("recipes.deleteRecipe")}
        message={t("recipes.deleteRecipeMessage")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <WarningDialog
        open={resetDialogOpen}
        title={t("recipes.resetRecipes")}
        message={t("recipes.resetRecipesMessage")}
        onConfirm={confirmReset}
        onCancel={cancelReset}
      />

      <WarningDialog
        open={deleteAllDialogOpen}
        title={t("recipes.deleteAllRecipes")}
        message={t("recipes.deleteAllRecipesMessage")}
        onConfirm={confirmDeleteAll}
        onCancel={cancelDeleteAll}
      />
    </Container>
  );
}
