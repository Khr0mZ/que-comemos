import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import IngredientDialog from "../components/IngredientDialog";
import WarningDialog from "../components/WarningDialog";
import ShoppingListDialog from "../components/ShoppingListDialog";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  deleteAllIngredients,
  deleteIngredient,
  saveIngredient,
  updateIngredient,
  useIngredients,
  storage,
} from "../hooks/useStorage";
import type { Ingredient, IngredientCategory } from "../types";
import {
  findIngredientData,
  getAllIngredients,
  normalizeSearchText,
  translateIngredient,
} from "../utils/ingredientTranslations";

export default function InventoryPage() {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState("");
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
  const [ingredientForShoppingList, setIngredientForShoppingList] = useState<Ingredient | null>(null);

  const { ingredients: allIngredients } = useIngredients();

  const ingredients = useMemo(() => {
    if (!searchQuery.trim()) {
      return allIngredients;
    }
    const normalizedSearch = normalizeSearchText(searchQuery);
    return allIngredients.filter((ing) => {
      const englishName = normalizeSearchText(ing.name);
      const spanishName = normalizeSearchText(translateIngredient(ing.name));
      return (
        englishName.includes(normalizedSearch) ||
        spanishName.includes(normalizedSearch)
      );
    });
  }, [allIngredients, searchQuery]);

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
        // Buscar únicamente en la traducción en español
        const translatedName = translateIngredient(ing.name);
        const normalizedTranslated = normalizeSearchText(translatedName);

        // Buscar al inicio del nombre completo o al inicio de cualquier palabra
        const words = normalizedTranslated.split(/\s+/);
        const matchesTranslation =
          normalizedTranslated.startsWith(normalizedSearch) ||
          words.some((word) => word.startsWith(normalizedSearch));

        // Debe coincidir con la búsqueda en español Y no estar ya en el inventario
        return (
          matchesTranslation &&
          !currentIngredients?.some(
            (local) => local.name.toLowerCase() === ing.name.toLowerCase()
          )
        );
      });

      if (!cancelled) {
        setGlobalIngredients(filtered.map((ing) => ing.name).slice(0, 10)); // Limitar a 10 resultados
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
    const name = String(ingredientData.name || "").trim();
    const category = String(ingredientData.category || "other").trim();

    if (!name || !category) {
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
      name,
      category: validCategory,
      measure: String(ingredientData.measure || ""),
    };

    try {
      if (editingIngredient && editingIngredient.name) {
        // Si el nombre cambió, necesitamos eliminar el antiguo y crear uno nuevo
        // O si el nombre es el mismo, actualizar directamente
        if (
          editingIngredient.name.toLowerCase() === dataToSave.name.toLowerCase()
        ) {
          // El nombre no cambió, actualizar normalmente
          await updateIngredient(editingIngredient.name, dataToSave);
        } else {
          // El nombre cambió, eliminar el antiguo y crear uno nuevo
          await deleteIngredient(editingIngredient.name);
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

  const handleDelete = useCallback((name: string) => {
    setIngredientToDelete(name);
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

  const handleAddGlobal = async (ingredientName: string) => {
    // Buscar la categoría del ingrediente en la lista global
    const ingredientData = await findIngredientData(ingredientName);
    const category = ingredientData?.category || "other";

    setEditingIngredient({
      name: ingredientName,
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
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <span style={{ fontSize: "1rem" }}>🗑️</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("inventory.deleteAllIngredients")}
            </Box>
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowAddForm(true)}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <span style={{ fontSize: "1rem" }}>➕</span>
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {t("inventory.addIngredient")}
            </Box>
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t("inventory.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>🔍</span>
            ),
          }}
        />
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
            {globalIngredients.map((ing, idx) => (
              <Button
                key={idx}
                variant="outlined"
                onClick={() => handleAddGlobal(ing)}
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
                {translateIngredient(ing)}
              </Button>
            ))}
          </Box>
        </Card>
      )}

      <Box
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
        {ingredients.length === 0 ? (
          <Card sx={{ gridColumn: "1 / -1" }}>
            <CardContent>
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                {t("inventory.noIngredients")}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          ingredients.map((ingredient) => (
            <Card key={ingredient.name}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                    {translateIngredient(ingredient.name)}
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
                    onClick={() => handleDelete(ingredient.name)}
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
                    title={t("inventory.addToShoppingList") || "Agregar a lista de compra"}
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
          ))
        )}
      </Box>

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
            await storage.addGeneralShoppingItem({
              name: ingredientForShoppingList.name,
              measure: measure.trim(),
            });
            showSnackbar(
              t("inventory.addedToShoppingList") ||
                `${translateIngredient(ingredientForShoppingList.name)} agregado a la lista de compra`,
              "success"
            );
          }
        }}
      />
    </Container>
  );
}
