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
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import IngredientDialog from "../components/IngredientDialog";
import ShoppingListDialog from "../components/ShoppingListDialog";
import WarningDialog from "../components/WarningDialog";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  deleteAllIngredients,
  deleteIngredient,
  saveIngredient,
  storage,
  updateIngredient,
  useIngredients,
} from "../hooks/useStorage";
import type { Ingredient, IngredientCategory } from "../types";
import {
  getAutocompleteColorStyles,
  getTextFieldColorStyles,
} from "../utils/colorUtils";
import {
  getAllIngredients,
  normalizeSearchText,
} from "../utils/ingredientTranslations";

const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  "vegetable",
  "fruit",
  "meat",
  "dairy",
  "grain",
  "spice",
  "beverage",
  "other",
];

const ITEMS_PER_PAGE = 30;

export default function IngredientList() {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    IngredientCategory | ""
  >("");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [globalIngredients, setGlobalIngredients] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(
    null
  );
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [shoppingListDialogOpen, setShoppingListDialogOpen] = useState(false);
  const [ingredientForShoppingList, setIngredientForShoppingList] =
    useState<Ingredient | null>(null);

  const { ingredients: allIngredients } = useIngredients();
  const { i18n } = useTranslation();
  const [globalIngredientsData, setGlobalIngredientsData] = useState<
    Awaited<ReturnType<typeof getAllIngredients>>
  >([]);

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar datos globales de ingredientes para tener acceso a nameES y nameEN
  useEffect(() => {
    getAllIngredients().then(setGlobalIngredientsData);
  }, []);

  const ingredients = useMemo(() => {
    let filtered = allIngredients;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((ing) => ing.category === selectedCategory);
    }

    // Filter by missing (no measure or empty/zero measure)
    if (showOnlyMissing) {
      filtered = filtered.filter(
        (ing) =>
          !ing.measure ||
          ing.measure.trim() === "" ||
          ing.measure.trim() === "0"
      );
    }

    // Text search
    if (searchQuery.trim()) {
      const normalizedSearch = normalizeSearchText(searchQuery);
      filtered = filtered.filter((ing) => {
        // Buscar el ingrediente completo en la lista global para obtener nameEN y nameES
        const ingData = globalIngredientsData.find((g) => g.id === ing.id);
        const englishName = ingData ? normalizeSearchText(ingData.nameEN) : "";
        const spanishName = ingData ? normalizeSearchText(ingData.nameES) : "";
        return (
          englishName.includes(normalizedSearch) ||
          spanishName.includes(normalizedSearch)
        );
      });
    }

    // Ordenar alfabéticamente según el idioma
    const currentLang = i18n.language || "es";
    filtered = [...filtered].sort((a, b) => {
      // Buscar los datos completos del ingrediente en la lista global por id
      const ingA = globalIngredientsData.find((g) => g.id === a.id);
      const ingB = globalIngredientsData.find((g) => g.id === b.id);

      // Obtener el nombre según el idioma
      const nameA =
        currentLang === "en" ? ingA?.nameEN || a.id : ingA?.nameES || a.id;
      const nameB =
        currentLang === "en" ? ingB?.nameEN || b.id : ingB?.nameES || b.id;

      // Ordenar alfabéticamente ignorando mayúsculas y acentos
      return normalizeSearchText(nameA).localeCompare(
        normalizeSearchText(nameB),
        currentLang,
        { sensitivity: "base" }
      );
    });

    return filtered;
  }, [
    allIngredients,
    searchQuery,
    selectedCategory,
    showOnlyMissing,
    i18n.language,
    globalIngredientsData,
  ]);

  // Reset visible count when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(ITEMS_PER_PAGE);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, showOnlyMissing]);

  // Get visible ingredients for infinite scroll
  const visibleIngredients = useMemo(() => {
    return ingredients.slice(0, visibleCount);
  }, [ingredients, visibleCount]);

  // Handle infinite scroll using window scroll
  const handleScroll = useCallback(() => {
    if (visibleCount >= ingredients.length) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercentage = (scrollTop + windowHeight) / documentHeight;

    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8) {
      setVisibleCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, ingredients.length)
      );
    }
  }, [visibleCount, ingredients.length]);

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    let cancelled = false;

    const loadGlobalIngredients = async () => {
      const allIngredients = await getAllIngredients();
      if (cancelled) return;

      const currentIngredients = ingredients;
      const normalizedSearch = normalizeSearchText(searchQuery);

      // Filtrar buscando SOLO en las traducciones en español
      const filtered = allIngredients.filter((ing) => {
        // Buscar únicamente en la traducción en español (nameES)
        const normalizedTranslated = normalizeSearchText(ing.nameES);

        // Buscar al inicio del nombre completo o al inicio de cualquier palabra
        const words = normalizedTranslated.split(/\s+/);
        const matchesTranslation =
          normalizedTranslated.startsWith(normalizedSearch) ||
          words.some((word) => word.startsWith(normalizedSearch));

        // Debe coincidir con la búsqueda en español Y no estar ya en el inventario
        return (
          matchesTranslation &&
          !currentIngredients?.some((local) => local.id === ing.id)
        );
      });

      if (!cancelled) {
        setGlobalIngredients(filtered.map((ing) => ing.id).slice(0, 10)); // Limitar a 10 resultados
      }
    };

    loadGlobalIngredients();

    return () => {
      cancelled = true;
    };
  }, [searchQuery, ingredients]);

  // Limpiar ingredientes globales cuando no hay búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        setGlobalIngredients([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleSave = async (ingredientData: Ingredient) => {
    // Asegurar que los campos requeridos tienen valores válidos
    const id = String(ingredientData.id || "").trim();
    const category = String(ingredientData.category || "other").trim();

    if (!id || !category) {
      console.error("Invalid ingredient data:", ingredientData);
      return;
    }

    // Validar que category es un valor válido
    const validCategories: IngredientCategory[] = [
      "vegetable",
      "fruit",
      "meat",
      "dairy",
      "grain",
      "spice",
      "beverage",
      "other",
    ];
    const validCategory = validCategories.includes(
      category as IngredientCategory
    )
      ? (category as IngredientCategory)
      : "other";

    const dataToSave: Ingredient = {
      id,
      category: validCategory,
      measure: String(ingredientData.measure || ""),
    };

    try {
      if (editingIngredient && editingIngredient.id) {
        // Si el id cambió, necesitamos eliminar el antiguo y crear uno nuevo
        // O si el id es el mismo, actualizar directamente
        if (editingIngredient.id === dataToSave.id) {
          // El id no cambió, actualizar normalmente
          await updateIngredient(editingIngredient.id, dataToSave);
        } else {
          // El id cambió, eliminar el antiguo y crear uno nuevo
          await deleteIngredient(editingIngredient.id);
          await saveIngredient(dataToSave);
        }
      } else {
        // Nuevo ingrediente, usar saveIngredient que maneja duplicados automáticamente
        await saveIngredient(dataToSave);
      }
      setShowAddForm(false);
      setEditingIngredient(null);
    } catch (error) {
      console.error("Error saving ingredient:", error);
      console.error("Data being saved:", dataToSave);
      // Si falla la actualización, intentar crear como nuevo ingrediente
      try {
        await saveIngredient(dataToSave);
        setShowAddForm(false);
        setEditingIngredient(null);
      } catch (fallbackError) {
        console.error("Error in fallback save:", fallbackError);
      }
    }
  };

  const handleDelete = useCallback((id: string) => {
    setIngredientToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (ingredientToDelete) {
      await deleteIngredient(ingredientToDelete);
      setIngredientToDelete(null);
    }
    setDeleteDialogOpen(false);
  }, [ingredientToDelete]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setIngredientToDelete(null);
  }, []);

  const handleDeleteAll = useCallback(() => {
    setDeleteAllDialogOpen(true);
  }, []);

  const confirmDeleteAll = useCallback(async () => {
    try {
      await deleteAllIngredients();
      showSnackbar(
        t("inventory.allIngredientsDeleted") ||
          "Todos los ingredientes han sido eliminados",
        "success"
      );
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error("Error deleting all ingredients:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : "Error desconocido"),
        "error"
      );
    }
  }, [showSnackbar, t]);

  const cancelDeleteAll = useCallback(() => {
    setDeleteAllDialogOpen(false);
  }, []);

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setShowAddForm(true);
  };

  const handleAddGlobal = async (ingredientId: string) => {
    // Buscar el ingrediente completo en la lista global por id
    const ingredientData = globalIngredientsData.find(
      (g) => g.id === ingredientId
    );
    const category = ingredientData?.category || "other";

    setEditingIngredient({
      id: ingredientId,
      category: category as IngredientCategory,
      measure: "",
    });
    setShowAddForm(true);
  };

  const handleCloseDialog = () => {
    setShowAddForm(false);
    setEditingIngredient(null);
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
        <Typography variant="h2" component="h2" sx={{ color: "#333" }}>
          {t("inventory.title")}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteAll}
            disabled={allIngredients.length === 0}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1rem" }}>🗑️</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("inventory.deleteAllIngredients")}
            </Box>
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowAddForm(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "1rem" }}>➕</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("inventory.addIngredient")}
            </Box>
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Card sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder={t("inventory.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={getTextFieldColorStyles("inventory.searchPlaceholder")}
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

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Autocomplete
                sx={{
                  minWidth: 200,
                  flex: 1,
                  ...getAutocompleteColorStyles("inventory.category"),
                }}
                options={INGREDIENT_CATEGORIES}
                value={selectedCategory || null}
                onChange={(_, newValue) => setSelectedCategory(newValue || "")}
                getOptionLabel={(option) =>
                  t(`inventory.categories.${option}`, { defaultValue: option })
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
                    label={t("inventory.category")}
                    placeholder={t("inventory.category")}
                  />
                )}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOnlyMissing}
                    onChange={(e) => setShowOnlyMissing(e.target.checked)}
                  />
                }
                label={
                  t("inventory.showOnlyMissing") || "Solo los que no tengo"
                }
              />
            </Box>
          </Stack>
        </Card>
      </Box>

      <IngredientDialog
        open={showAddForm}
        editingIngredient={editingIngredient}
        onClose={handleCloseDialog}
        onSave={handleSave}
      />

      {searchQuery.trim() && globalIngredients.length > 0 && (
        <Card sx={{ mb: 2, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sugerencias de ingredientes:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {globalIngredients.map((ingId, idx) => {
              const ingData = globalIngredientsData.find((g) => g.id === ingId);
              const displayName = ingData
                ? i18n.language === "en"
                  ? ingData.nameEN
                  : ingData.nameES
                : ingId;
              return (
                <Button
                  key={idx}
                  variant="outlined"
                  onClick={() => handleAddGlobal(ingId)}
                  sx={{
                    borderRadius: 3,
                    borderWidth: 2,
                    borderColor: "#FFC107",
                    color: "#FF1744",
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "#FF1744",
                      backgroundColor: "#FFC107",
                      color: "#fff",
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  {displayName}
                </Button>
              );
            })}
          </Box>
        </Card>
      )}

      {ingredients.length === 0 ? (
        <Card>
          <CardContent>
            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
              {t("inventory.noIngredients")}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Box
            ref={containerRef}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {visibleIngredients.map((ingredient) => {
              const ingData = globalIngredientsData.find(
                (g) => g.id === ingredient.id
              );
              const displayName = ingData
                ? i18n.language === "en"
                  ? ingData.nameEN
                  : ingData.nameES
                : ingredient.id;
              return (
                <Card key={ingredient.id}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                        {displayName}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(ingredient)}
                        sx={{ fontSize: "1.3rem" }}
                      >
                        ✏️
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(ingredient.id)}
                        sx={{ fontSize: "1.3rem" }}
                      >
                        🗑️
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setIngredientForShoppingList(ingredient);
                          setShoppingListDialogOpen(true);
                        }}
                        sx={{ fontSize: "1.3rem" }}
                        title={
                          t("inventory.addToShoppingList") ||
                          "Agregar a lista de compra"
                        }
                      >
                        🛒
                      </IconButton>
                    </Box>
                    <Chip
                      label={t(`inventory.categories.${ingredient.category}`)}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {ingredient.measure}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          {visibleCount < ingredients.length && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("inventory.loadingMore", {
                  loaded: visibleCount,
                  total: ingredients.length,
                }) ||
                  `Mostrando ${visibleCount} de ${ingredients.length} ingredientes`}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <WarningDialog
        open={deleteDialogOpen}
        title={t("inventory.delete")}
        message={t("inventory.deleteMessage")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <WarningDialog
        open={deleteAllDialogOpen}
        title={t("inventory.deleteAllIngredients")}
        message={t("inventory.deleteAllIngredientsMessage")}
        onConfirm={confirmDeleteAll}
        onCancel={cancelDeleteAll}
      />

      <ShoppingListDialog
        open={shoppingListDialogOpen}
        ingredient={ingredientForShoppingList}
        onClose={() => {
          setShoppingListDialogOpen(false);
          setIngredientForShoppingList(null);
        }}
        onConfirm={async (measure) => {
          if (ingredientForShoppingList) {
            const ingData = globalIngredientsData.find(
              (g) => g.id === ingredientForShoppingList.id
            );
            const displayName = ingData
              ? i18n.language === "en"
                ? ingData.nameEN
                : ingData.nameES
              : ingredientForShoppingList.id;
            await storage.addGeneralShoppingItem({
              id: ingredientForShoppingList.id,
              measure: measure.trim(),
            });
            showSnackbar(
              t("inventory.addedToShoppingList") ||
                `${displayName} agregado a la lista de compra`,
              "success"
            );
          }
        }}
      />
    </Container>
  );
}
