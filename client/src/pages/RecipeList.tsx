import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import WarningDialog from "../components/WarningDialog";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  deleteAllRecipes,
  deleteRecipe,
  resetRecipes,
  useIngredients,
  useRecipes,
} from "../hooks/useStorage";

import type { Recipe } from "../types";
import {
  getAutocompleteColorStyles,
  getRandomColorFromString,
  getTextFieldColorStyles,
} from "../utils/colorUtils";
import type { IngredientData } from "../utils/ingredientTranslations";
import { getAllIngredients } from "../utils/ingredientTranslations";
import {
  filterRecipesByArea,
  filterRecipesByCategory,
  filterRecipesByIngredients,
  filterRecipesByTags,
  getRecipeName,
} from "../utils/recipeUtils";

const ITEMS_PER_PAGE = 30;

export default function RecipeList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showOnlyInternal, setShowOnlyInternal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [allIngredientsData, setAllIngredientsData] = useState<
    IngredientData[]
  >([]);

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const containerRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResettingRecipes, setIsResettingRecipes] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAllRecipes, setIsDeletingAllRecipes] = useState(false);

  const { recipes: allRecipes, loading: recipesLoading } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();

  useEffect(() => {
    loadFilterData();
    getAllIngredients().then(setAllIngredientsData);
  }, []);

  const loadFilterData = async () => {
    try {
      const [categoriesModule, areasModule, tagsModule] = await Promise.all([
        import("../data/recipes/categories.json"),
        import("../data/recipes/areas.json"),
        import("../data/recipes/tags.json"),
      ]);
      setCategories(categoriesModule.default || []);
      setAreas(areasModule.default || []);
      setTags(tagsModule.default || []);
    } catch (error) {
      console.error("Error loading filter data:", error);
    }
  };

  // Filtrar ingredientes disponibles
  const availableIngredients = useMemo(() => {
    return allIngredients.filter(
      (ing) =>
        ing.measure !== undefined &&
        ing.measure !== null &&
        ing.measure.trim() !== "" &&
        ing.measure.trim() !== "0"
    );
  }, [allIngredients]);

  const recipes = useMemo(() => {
    let filtered = allRecipes;

    // Text search
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const currentLang = i18n.language || "es";
      filtered = filtered.filter((recipe) => {
        const recipeName = getRecipeName(recipe, currentLang);
        return (
          recipeName.toLowerCase().includes(searchLower) ||
          (recipe.tags &&
            recipe.tags.some((tag) =>
              tag.toLowerCase().includes(searchLower)
            )) ||
          (recipe.category &&
            recipe.category.toLowerCase().includes(searchLower)) ||
          (recipe.area && recipe.area.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filter by ingredients
    if (selectedIngredients.length > 0) {
      filtered = filterRecipesByIngredients(filtered, selectedIngredients);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filterRecipesByCategory(filtered, selectedCategory);
    }

    // Filter by area
    if (selectedArea) {
      filtered = filterRecipesByArea(filtered, selectedArea);
    }

    // Filter by tag
    if (selectedTags.length > 0) {
      filtered = filterRecipesByTags(filtered, selectedTags);
    }

    // Filter by internal
    if (showOnlyInternal) {
      filtered = filtered.filter((recipe) => recipe.internal === true);
    }

    return filtered;
  }, [
    allRecipes,
    searchQuery,
    selectedCategory,
    selectedArea,
    selectedTags,
    selectedIngredients,
    showOnlyInternal,
    i18n.language,
  ]);

  // Reset visible count when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(ITEMS_PER_PAGE);
    }, 0);
    return () => clearTimeout(timer);
  }, [
    searchQuery,
    selectedCategory,
    selectedArea,
    selectedTags,
    selectedIngredients,
    showOnlyInternal,
  ]);

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
      const identifier = recipe.nameES || recipe.nameEN;
      navigate(`/recipe/${encodeURIComponent(identifier)}`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (recipe: Recipe) => {
      const identifier = recipe.nameES || recipe.nameEN;
      navigate(`/recipe/${encodeURIComponent(identifier)}`, {
        state: { edit: true },
      });
    },
    [navigate]
  );

  const handleDelete = useCallback((identifier: string) => {
    setRecipeToDelete(identifier);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (recipeToDelete) {
      try {
        setIsDeletingRecipe(true);
        await deleteRecipe(recipeToDelete);
        setRecipeToDelete(null);
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error("Error deleting recipe:", error);
      } finally {
        setIsDeletingRecipe(false);
      }
    }
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
      setIsResettingRecipes(true);
      await resetRecipes();
      setResetDialogOpen(false);
    } catch (error) {
      console.error("Error resetting recipes:", error);
    } finally {
      setIsResettingRecipes(false);
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
      setIsDeletingAllRecipes(true);
      await deleteAllRecipes();
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error("Error deleting all recipes:", error);
    } finally {
      setIsDeletingAllRecipes(false);
    }
  }, []);

  const handleRandomRecipe = () => {
    if (recipes.length === 0) {
      showSnackbar(t("recipes.noRecipesFound"), "warning");
      return;
    }
    const randomIndex = Math.floor(Math.random() * recipes.length);
    const randomRecipe = recipes[randomIndex];
    const identifier = randomRecipe.nameES || randomRecipe.nameEN;
    navigate(`/recipe/${encodeURIComponent(identifier)}`);
  };

  const toggleIngredient = (ingredientName: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientName)
        ? prev.filter((name) => name !== ingredientName)
        : [...prev, ingredientName]
    );
  };

  const cancelDeleteAll = useCallback(() => {
    setDeleteAllDialogOpen(false);
  }, []);

  // Attach scroll listener to window with throttling
  useEffect(() => {
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    // Also check on mount in case content is already scrolled
    const timer = setTimeout(() => {
      handleScroll();
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", throttledScroll);
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
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={handleRandomRecipe}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1rem" }}>🎲</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("recipes.randomRecipe") || "Aleatoria"}
            </Box>
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAll}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              whiteSpace: "nowrap",
            }}
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
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1rem" }}>🔄</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("recipes.resetRecipes")}
            </Box>
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/recipe/new")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1rem" }}>➕</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("recipes.addRecipe")}
            </Box>
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Card sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <TextField
                fullWidth
                placeholder={t("recipes.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={
                  (getTextFieldColorStyles("recipes.searchPlaceholder"),
                  { flex: 1, minWidth: 200 })
                }
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOnlyInternal}
                    onChange={(e) => setShowOnlyInternal(e.target.checked)}
                    sx={{
                      color: "#FF1744",
                      "&.Mui-checked": {
                        color: "#FF1744",
                      },
                    }}
                  />
                }
                label={t("recipes.showOnlyInternal") || "Solo recetas internas"}
                sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Autocomplete
                sx={{
                  minWidth: 200,
                  flex: 1,
                  ...getAutocompleteColorStyles("home.selectCategory"),
                }}
                options={categories}
                value={selectedCategory || null}
                onChange={(_, newValue) => setSelectedCategory(newValue || "")}
                getOptionLabel={(option) =>
                  t(`categories.${option}`, { defaultValue: option })
                }
                slotProps={{
                  popper: {
                    sx: {
                      maxWidth: "100%",
                      "& .MuiAutocomplete-listbox": {
                        maxWidth: "100%",
                        overflowX: "hidden",
                      },
                    },
                  },
                  paper: {
                    sx: {
                      maxWidth: "100%",
                      overflowX: "hidden",
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("home.selectCategory")}
                    placeholder={t("home.selectCategory")}
                  />
                )}
              />

              <Autocomplete
                sx={{
                  minWidth: 200,
                  flex: 1,
                  ...getAutocompleteColorStyles("home.selectArea"),
                }}
                options={areas}
                value={selectedArea || null}
                onChange={(_, newValue) => setSelectedArea(newValue || "")}
                getOptionLabel={(option) =>
                  t(`areas.${option}`, { defaultValue: option })
                }
                slotProps={{
                  popper: {
                    sx: {
                      maxWidth: "100%",
                      "& .MuiAutocomplete-listbox": {
                        maxWidth: "100%",
                        overflowX: "hidden",
                      },
                    },
                  },
                  paper: {
                    sx: {
                      maxWidth: "100%",
                      overflowX: "hidden",
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("home.selectArea")}
                    placeholder={t("home.selectArea")}
                  />
                )}
              />

              <Autocomplete
                multiple
                sx={{
                  minWidth: 200,
                  flex: 1,
                  ...getAutocompleteColorStyles("home.selectTag"),
                }}
                options={tags}
                value={selectedTags}
                onChange={(_, newValue) => setSelectedTags(newValue)}
                getOptionLabel={(option) =>
                  t(`tags.${option}`, { defaultValue: option })
                }
                slotProps={{
                  popper: {
                    sx: {
                      maxWidth: "100%",
                      "& .MuiAutocomplete-listbox": {
                        maxWidth: "100%",
                        overflowX: "hidden",
                      },
                    },
                  },
                  paper: {
                    sx: {
                      maxWidth: "100%",
                      overflowX: "hidden",
                    },
                  },
                }}
                renderValue={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={t(`tags.${option}`, { defaultValue: option })}
                      {...getTagProps({ index })}
                      key={option}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t("home.selectTag")}
                    placeholder={t("home.selectTag")}
                  />
                )}
              />
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                {t("home.selectIngredients")}
              </Typography>
              {availableIngredients.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  {t("home.noIngredientsAvailable")}
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    p: 1,
                    bgcolor: "background.default",
                    borderRadius: 1,
                    maxHeight: 150,
                    overflowY: "auto",
                  }}
                >
                  {availableIngredients.map((ingredient) => {
                    const isChecked = selectedIngredients.includes(
                      ingredient.id
                    );
                    const randomColor = getRandomColorFromString(ingredient.id);
                    const colorWithOpacity = `${randomColor}15`;
                    const shadowColor = `${randomColor}40`;

                    return (
                      <FormControlLabel
                        key={ingredient.id}
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleIngredient(ingredient.id)}
                            sx={
                              !isChecked
                                ? {
                                    "--checkbox-color": randomColor,
                                    "--checkbox-hover-bg": colorWithOpacity,
                                    "--checkbox-shadow": shadowColor,
                                    color: randomColor,
                                    "&:hover": {
                                      backgroundColor: colorWithOpacity,
                                      "& .MuiSvgIcon-root": {
                                        filter: `drop-shadow(0 2px 6px ${shadowColor})`,
                                      },
                                    },
                                    "& .MuiSvgIcon-root": {
                                      filter: `drop-shadow(0 2px 4px ${shadowColor})`,
                                    },
                                  }
                                : undefined
                            }
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {(() => {
                              const ingData = allIngredientsData.find(
                                (g) => g.id === ingredient.id
                              );
                              return ingData
                                ? i18n.language === "en"
                                  ? ingData.nameEN
                                  : ingData.nameES
                                : ingredient.id;
                            })()}
                          </Typography>
                        }
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
          </Stack>
        </Card>
      </Box>

      {recipesLoading && (
        <Box sx={{ mb: 4 }}>
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
            {Array.from({ length: 8 }).map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Skeleton variant="rectangular" width="100%" height={200} />
                <Box
                  sx={{
                    px: 1,
                    py: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={32}
                    sx={{ mb: 1 }}
                  />
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}
                  >
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                  </Box>
                </Box>
                <Box sx={{ mt: "auto" }}>
                  <Box
                    sx={{ display: "flex", gap: 1, alignItems: "center", p: 1 }}
                  >
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {!recipesLoading && recipes.length === 0 && (
        <Card>
          <CardContent>
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              {t("recipes.noRecipes")}
            </Typography>
          </CardContent>
        </Card>
      )}

      {!recipesLoading && recipes.length > 0 && (
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
                  key={recipe.nameES || recipe.nameEN}
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
        loading={isDeletingRecipe}
      />

      <WarningDialog
        open={resetDialogOpen}
        title={t("recipes.resetRecipes")}
        message={t("recipes.resetRecipesMessage")}
        onConfirm={confirmReset}
        onCancel={cancelReset}
        loading={isResettingRecipes}
      />

      <WarningDialog
        open={deleteAllDialogOpen}
        title={t("recipes.deleteAllRecipes")}
        message={t("recipes.deleteAllRecipesMessage")}
        onConfirm={confirmDeleteAll}
        onCancel={cancelDeleteAll}
        loading={isDeletingAllRecipes}
      />
    </Container>
  );
}
