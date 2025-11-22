import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import WeekMealDialog from "../components/WeekMealDialog";
import areasData from "../data/recipes/areas.json";
import categoriesData from "../data/recipes/categories.json";
import tagsData from "../data/recipes/tags.json";
import { useSnackbar } from "../hooks/useSnackbar";
import {
  addRecipeToWeek,
  saveRecipe,
  storage,
  updateRecipe,
  useIngredients,
} from "../hooks/useStorage";
import type { DayOfWeek, MealType, Recipe, RecipeIngredient } from "../types";
import {
  getAutocompleteColorStyles,
  getTextFieldColorStyles,
} from "../utils/colorUtils";
import type { IngredientData } from "../utils/ingredientTranslations";
import {
  getAllIngredients,
  normalizeSearchText,
} from "../utils/ingredientTranslations";
import {
  checkRecipeAvailability,
  getYouTubeEmbedUrl,
} from "../utils/recipeUtils";

export default function RecipeDetails() {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Recipe>({
    name: "",
    ingredients: [],
    instructionsES: "",
    instructionsEN: "",
    tags: [],
    imageURL: "",
    videoURL: "",
    sourceURL: "",
    category: "",
    area: "",
  });
  const [availability, setAvailability] = useState<Awaited<
    ReturnType<typeof checkRecipeAvailability>
  > | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);

  const categories = categoriesData as string[];
  const areas = areasData as string[];
  const tags = tagsData as string[];
  const { ingredients: userIngredients } = useIngredients();
  const [allIngredientNames, setAllIngredientNames] = useState<string[]>([]);
  const [allIngredientsData, setAllIngredientsData] = useState<
    IngredientData[]
  >([]);
  const [ingredientInputValues, setIngredientInputValues] = useState<
    Record<number, string>
  >({});

  // Cargar ids de ingredientes (globales + del usuario, sin duplicados)
  useEffect(() => {
    const loadIngredients = async () => {
      const globalIngredients = await getAllIngredients();
      setAllIngredientsData(globalIngredients);
      const globalIds = globalIngredients.map((ing) => ing.id);
      const userIds = userIngredients.map((ing) => ing.id);

      // Combinar y eliminar duplicados por id
      const allIds = [...globalIds, ...userIds];
      const uniqueIds = Array.from(new Set(allIds));

      // Ordenar alfabéticamente según el idioma actual
      const currentLang = i18n.language || "es";
      const sortedIds = [...uniqueIds].sort((a, b) => {
        const ingA = globalIngredients.find((g) => g.id === a);
        const ingB = globalIngredients.find((g) => g.id === b);

        if (!ingA || !ingB) return 0;

        const nameA = currentLang === "en" ? ingA.nameEN : ingA.nameES;
        const nameB = currentLang === "en" ? ingB.nameEN : ingB.nameES;

        return normalizeSearchText(nameA).localeCompare(
          normalizeSearchText(nameB),
          currentLang,
          { sensitivity: "base" }
        );
      });

      setAllIngredientNames(sortedIds); // Mantener el nombre de la variable por compatibilidad
    };
    loadIngredients();
  }, [userIngredients, i18n.language]);

  // Función helper para obtener las instrucciones según el idioma actual
  const getInstructions = (recipe: Recipe | null): string => {
    if (!recipe) return "";
    const currentLang = i18n.language || "es";
    if (currentLang === "en" && recipe.instructionsEN) {
      return recipe.instructionsEN;
    }
    return recipe.instructionsES || recipe.instructionsEN || "";
  };

  const loadRecipe = useCallback(async () => {
    setLoading(true);
    try {
      const path = location.pathname;

      if (path === "/recipe/new") {
        // Modo creación - inicializar formulario vacío
        setIsCreating(true);
        setIsEditing(true);
        setRecipe(null);
        setFormData({
          name: "",
          ingredients: [],
          instructionsES: "",
          instructionsEN: "",
          tags: [],
          imageURL: "",
          videoURL: "",
          sourceURL: "",
          category: "",
          area: "",
        });
      } else if (path.includes("/recipe/ai")) {
        // Receta generada por IA (viene del state)
        setIsCreating(false);
        const aiRecipe = location.state?.recipe;
        if (aiRecipe) {
          setRecipe(aiRecipe);
        }
      } else if (params.id) {
        // Receta local - usar nombre como identificador
        setIsCreating(false);
        const decodedName = decodeURIComponent(params.id);
        const localRecipe = await storage.getRecipe(decodedName);
        if (localRecipe) {
          setRecipe(localRecipe);
        }
      }
    } catch (error) {
      console.error("Error loading recipe:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id, location.pathname, location.state]);

  const checkAvailability = useCallback(async () => {
    if (!recipe) return;
    const result = await checkRecipeAvailability(recipe);
    setAvailability(result);
  }, [recipe]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  useEffect(() => {
    if (recipe && !isCreating) {
      // Inicializar formData cuando se carga la receta
      setFormData({
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructionsES: recipe.instructionsES || "",
        instructionsEN: recipe.instructionsEN || "",
        tags: recipe.tags || [],
        imageURL: recipe.imageURL || "",
        videoURL: recipe.videoURL || "",
        sourceURL: recipe.sourceURL || "",
        category: recipe.category || "",
        area: recipe.area || "",
      });
      // Si viene con estado de edición, activar modo edición después de inicializar formData
      if (location.state?.edit) {
        setIsEditing(true);
      } else {
        setIsEditing(false); // Reset editing mode when recipe changes
      }
      // Reset video visibility when recipe changes
      setShowVideo(false);
      checkAvailability();
    }
  }, [recipe, isCreating, location.state?.edit, checkAvailability]);

  const handleSave = async () => {
    if (!recipe) return;

    const recipeToSave: Recipe = {
      name: recipe.name,
      ingredients: recipe.ingredients,
      instructionsES: recipe.instructionsES,
      instructionsEN: recipe.instructionsEN,
      tags: recipe.tags,
      imageURL: recipe.imageURL,
      videoURL: recipe.videoURL,
      sourceURL: recipe.sourceURL,
      category: recipe.category,
      area: recipe.area,
      source: recipe.source,
    };

    await saveRecipe(recipeToSave);
    showSnackbar(t("recipes.saveRecipe") + "!", "success");
    navigate("/recipes");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isCreating) {
      // Si está creando, volver a la lista de recetas
      navigate("/recipes");
    } else {
      setIsEditing(false);
      // Restaurar datos originales
      if (recipe) {
        setFormData({
          name: recipe.name,
          ingredients: recipe.ingredients,
          instructionsES: recipe.instructionsES || "",
          instructionsEN: recipe.instructionsEN || "",
          tags: recipe.tags || [],
          imageURL: recipe.imageURL || "",
          videoURL: recipe.videoURL || "",
          sourceURL: recipe.sourceURL || "",
          category: recipe.category || "",
          area: recipe.area || "",
        });
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.name.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const recipeToSave: Recipe = {
        name: formData.name,
        ingredients: formData.ingredients,
        instructionsES: formData.instructionsES?.trim() || undefined,
        instructionsEN: formData.instructionsEN?.trim() || undefined,
        tags:
          formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
        imageURL: formData.imageURL?.trim() || undefined,
        videoURL: formData.videoURL?.trim() || undefined,
        sourceURL: formData.sourceURL?.trim() || undefined,
        category: formData.category || "",
        area: formData.area || "",
        source: isCreating ? "local" : recipe?.source || "local",
        internal: isCreating ? true : recipe?.internal, // Marcar como interna si es nueva receta
      };

      if (isCreating) {
        // Crear nueva receta
        await saveRecipe(recipeToSave);
        showSnackbar(t("recipes.saveRecipe") + "!", "success");
        navigate(`/recipe/${encodeURIComponent(recipeToSave.name)}`);
      } else if (recipe) {
        // Actualizar receta existente
        const originalName = recipe.name;
        await updateRecipe(originalName, recipeToSave);
        setRecipe(recipeToSave);
        setIsCreating(false);
        // Recargar disponibilidad con la receta actualizada
        const updatedAvailability = await checkRecipeAvailability(recipeToSave);
        setAvailability(updatedAvailability);
        showSnackbar(t("recipes.saveRecipe") + "!", "success");
        // Cerrar modo edición después de guardar
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : "Error desconocido"),
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { id: "", measure: "" }],
    });
  };

  const updateIngredient = (
    index: number,
    field: keyof RecipeIngredient,
    value: string
  ) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleConfirmRecipe = () => {
    if (!recipe) return;
    // Abrir el diálogo para elegir día y comida/cena
    setWeekDialogOpen(true);
  };

  const handleWeekDialogConfirm = async (
    day: DayOfWeek,
    mealType: MealType
  ) => {
    if (!recipe) return;

    try {
      // Agregar la receta a la semana
      await addRecipeToWeek(day, mealType, recipe.name);

      // Agregar la receta a la lista de compra, incluso si no hay ingredientes faltantes
      // Esto permite que la receta aparezca en CookingPage si todos los ingredientes están disponibles
      const missingIngredients = availability?.missingIngredients || [];
      await storage.addRecipeShoppingList(recipe.name, missingIngredients);

      showSnackbar(
        t("week.recipeAddedToWeek") ||
          "Receta añadida a la semana y lista de compra.",
        "success"
      );
    } catch (error) {
      console.error("Error confirming recipe:", error);
      showSnackbar(
        t("common.error") +
          ": " +
          (error instanceof Error ? error.message : "Error desconocido"),
        "error"
      );
    }
  };

  const canEdit = recipe && (recipe.source === "local" || !recipe.source);
  const isNewRecipe = isCreating;

  if (loading && !isNewRecipe) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!recipe && !isNewRecipe) {
    return (
      <Box sx={{ p: 3 }}>
        <Button variant="contained" onClick={() => navigate("/")}>
          {t("common.back")}
        </Button>
      </Box>
    );
  }

  const displayRecipe = isEditing ? formData : recipe;
  const displayImageURL = isEditing ? formData.imageURL : recipe?.imageURL;
  const displayVideoURL = isEditing ? formData.videoURL : recipe?.videoURL;
  const displaySourceURL = isEditing ? formData.sourceURL : recipe?.sourceURL;

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        {!isEditing && (
          <Button variant="outlined" onClick={() => navigate("/recipes")}>
            {t("common.back")}
          </Button>
        )}
        {isEditing && <Box />}
        {!isEditing && !isNewRecipe && (canEdit || availability) && (
          <Stack direction="row" spacing={1}>
            {canEdit && (
              <Button variant="contained" onClick={handleEdit}>
                {t("recipes.editRecipe")}
              </Button>
            )}
            {availability && (
              <Button variant="contained" onClick={handleConfirmRecipe}>
                {t("home.confirmRecipe") || "Confirmar Receta"}
              </Button>
            )}
          </Stack>
        )}
        {isNewRecipe && (
          <Typography variant="h5">{t("recipes.addRecipe")}</Typography>
        )}
        {isEditing && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={isSaving}
              sx={{ minWidth: 100 }}
            >
              {isSaving ? (
                <CircularProgress size={20} sx={{ color: "inherit" }} />
              ) : (
                t("common.save")
              )}
            </Button>
          </Stack>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        {isEditing ? (
          <CardContent>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={t("recipes.titleLabel")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    sx={getTextFieldColorStyles("recipes.titleLabel")}
                  />
                  <Autocomplete
                    options={categories}
                    value={formData.category || null}
                    onChange={(_, newValue) =>
                      setFormData({ ...formData, category: newValue || "" })
                    }
                    getOptionLabel={(option) =>
                      t(`categories.${option}`, { defaultValue: option })
                    }
                    sx={getAutocompleteColorStyles("recipes.category")}
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
                        label={t("recipes.category")}
                        placeholder="Selecciona una categoría"
                      />
                    )}
                  />
                  <Autocomplete
                    options={areas}
                    value={formData.area || null}
                    onChange={(_, newValue) =>
                      setFormData({ ...formData, area: newValue || "" })
                    }
                    getOptionLabel={(option) =>
                      t(`areas.${option}`, { defaultValue: option })
                    }
                    sx={getAutocompleteColorStyles("recipes.area")}
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
                        label={t("recipes.area")}
                        placeholder="Selecciona un área"
                      />
                    )}
                  />
                  <Autocomplete
                    multiple
                    options={tags}
                    value={formData.tags}
                    onChange={(_, newValue) =>
                      setFormData({ ...formData, tags: newValue })
                    }
                    getOptionLabel={(option) =>
                      t(`tags.${option}`, { defaultValue: option })
                    }
                    sx={getAutocompleteColorStyles("recipes.tagsLabel")}
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
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("recipes.tagsLabel")}
                        placeholder="Selecciona tags"
                      />
                    )}
                  />
                  <TextField
                    fullWidth
                    label={t("recipes.sourceUrl")}
                    value={formData.sourceURL}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceURL: e.target.value })
                    }
                    placeholder="https://ejemplo.com/receta"
                    sx={getTextFieldColorStyles("recipes.sourceUrl")}
                  />
                </Stack>
              </Box>
              <Box>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 200,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      border: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    {formData.imageURL ? (
                      <Avatar
                        src={formData.imageURL}
                        alt="Preview"
                        variant="rounded"
                        sx={{
                          width: "100%",
                          maxWidth: 300,
                          height: 200,
                          objectFit: "cover",
                        }}
                        imgProps={{
                          onError: (e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Vista previa de imagen
                      </Typography>
                    )}
                  </Box>
                  <TextField
                    fullWidth
                    label={t("recipes.imageUrl")}
                    value={formData.imageURL}
                    onChange={(e) =>
                      setFormData({ ...formData, imageURL: e.target.value })
                    }
                    placeholder="https://ejemplo.com/imagen.jpg"
                    sx={getTextFieldColorStyles("recipes.imageUrl")}
                  />
                  <TextField
                    fullWidth
                    label={t("recipes.videoUrl")}
                    value={formData.videoURL}
                    onChange={(e) =>
                      setFormData({ ...formData, videoURL: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    sx={getTextFieldColorStyles("recipes.videoUrl")}
                  />
                </Stack>
              </Box>
            </Box>
          </CardContent>
        ) : (
          <>
            {displayImageURL && (
              <CardMedia
                component="img"
                height="300"
                image={displayImageURL}
                alt={displayRecipe?.name}
              />
            )}
            <CardContent>
              <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
                {displayRecipe?.name}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {displayRecipe?.category && (
                  <Chip
                    label={t(`categories.${displayRecipe.category}`, {
                      defaultValue: displayRecipe.category,
                    })}
                    size="small"
                    color="primary"
                  />
                )}
                {displayRecipe?.area && (
                  <Chip
                    label={t(`areas.${displayRecipe.area}`, {
                      defaultValue: displayRecipe.area,
                    })}
                    size="small"
                    color="secondary"
                  />
                )}
                {displayRecipe?.tags &&
                  displayRecipe.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={t(`tags.${tag}`, { defaultValue: tag })}
                      size="small"
                      color="info"
                    />
                  ))}
              </Stack>
              {(displayVideoURL || displaySourceURL) && (
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{ mt: 2 }}
                >
                  {displayVideoURL && (
                    <Button
                      variant="contained"
                      onClick={() => setShowVideo(!showVideo)}
                    >
                      {showVideo
                        ? t("recipes.hideVideo")
                        : t("recipes.watchVideo")}
                    </Button>
                  )}
                  {displaySourceURL && (
                    <Button
                      variant="contained"
                      href={displaySourceURL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("recipes.viewSource")}
                    </Button>
                  )}
                </Stack>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {!isEditing && displayVideoURL && getYouTubeEmbedUrl(displayVideoURL) && (
        <Collapse in={showVideo} timeout={500}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t("recipes.video")}
              </Typography>
              {showVideo && (
                <Box
                  sx={{
                    position: "relative",
                    paddingBottom: "56.25%", // 16:9 aspect ratio
                    height: 0,
                    overflow: "hidden",
                    borderRadius: 1,
                    "& iframe": {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: 0,
                    },
                  }}
                >
                  <iframe
                    src={getYouTubeEmbedUrl(displayVideoURL) || undefined}
                    title={`${displayRecipe?.name} - Video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Collapse>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
          gap: 3,
        }}
      >
        <Card>
          <CardContent>
            {isEditing ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="h5">
                    {t("recipes.ingredientsLabel")}
                  </Typography>
                  <IconButton
                    onClick={addIngredient}
                    size="small"
                    sx={{ fontSize: "1rem" }}
                    title={t("recipes.addIngredient")}
                  >
                    ➕
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    maxHeight: 500,
                    overflowY: "auto",
                    p: 1,
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  {formData.ingredients.map((ing, index) => (
                    <Stack
                      key={`ingredient-${index}-${i18n.language}`}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Autocomplete
                        options={allIngredientNames}
                        value={ing.id || null}
                        onChange={(_, newValue) => {
                          // Cuando se selecciona una opción, newValue es el id
                          updateIngredient(index, "id", newValue || "");
                          // Limpiar el estado del input cuando se selecciona
                          setIngredientInputValues((prev) => {
                            const newValues = { ...prev };
                            delete newValues[index];
                            return newValues;
                          });
                        }}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") {
                            const ingData = allIngredientsData.find(
                              (g) => g.id === option
                            );
                            if (ingData) {
                              return i18n.language === "en"
                                ? ingData.nameEN
                                : ingData.nameES;
                            }
                            return option;
                          }
                          return "";
                        }}
                        filterOptions={(options, { inputValue }) => {
                          const currentLang = i18n.language || "es";

                          // Filtrar opciones basándose SOLO en el idioma seleccionado (igual que IngredientList)
                          if (!inputValue || !inputValue.trim()) {
                            // Cuando no hay input, devolver las opciones ordenadas
                            return [...options].sort((a, b) => {
                              const ingDataA = allIngredientsData.find(
                                (g) => g.id === a
                              );
                              const ingDataB = allIngredientsData.find(
                                (g) => g.id === b
                              );
                              if (!ingDataA || !ingDataB) return 0;

                              const nameA =
                                currentLang === "en"
                                  ? ingDataA.nameEN
                                  : ingDataA.nameES;
                              const nameB =
                                currentLang === "en"
                                  ? ingDataB.nameEN
                                  : ingDataB.nameES;

                              return normalizeSearchText(nameA).localeCompare(
                                normalizeSearchText(nameB),
                                currentLang,
                                { sensitivity: "base" }
                              );
                            });
                          }

                          const normalizedSearch =
                            normalizeSearchText(inputValue);

                          // Filtrar solo por el nombre del idioma actual usando normalizeSearchText
                          const filtered = options.filter((optionId) => {
                            const ingData = allIngredientsData.find(
                              (g) => g.id === optionId
                            );
                            if (!ingData) return false;

                            // Solo buscar en el nombre del idioma actual (igual que IngredientList)
                            const nameInCurrentLang =
                              currentLang === "en"
                                ? ingData.nameEN
                                : ingData.nameES;
                            const normalizedTranslated =
                              normalizeSearchText(nameInCurrentLang);

                            // Buscar al inicio del nombre completo o al inicio de cualquier palabra (igual que IngredientList)
                            const words = normalizedTranslated.split(/\s+/);
                            const matchesTranslation =
                              normalizedTranslated.startsWith(
                                normalizedSearch
                              ) ||
                              words.some((word) =>
                                word.startsWith(normalizedSearch)
                              );

                            return matchesTranslation;
                          });

                          // Ordenar alfabéticamente por el nombre del idioma actual
                          return filtered.sort((a, b) => {
                            const ingDataA = allIngredientsData.find(
                              (g) => g.id === a
                            );
                            const ingDataB = allIngredientsData.find(
                              (g) => g.id === b
                            );
                            if (!ingDataA || !ingDataB) return 0;

                            const nameA =
                              currentLang === "en"
                                ? ingDataA.nameEN
                                : ingDataA.nameES;
                            const nameB =
                              currentLang === "en"
                                ? ingDataB.nameEN
                                : ingDataB.nameES;

                            return normalizeSearchText(nameA).localeCompare(
                              normalizeSearchText(nameB),
                              currentLang,
                              { sensitivity: "base" }
                            );
                          });
                        }}
                        isOptionEqualToValue={(option, value) => {
                          // Comparar por id
                          return option === value;
                        }}
                        inputValue={
                          ingredientInputValues[index] !== undefined
                            ? ingredientInputValues[index]
                            : ing.id
                            ? (() => {
                                const ingData = allIngredientsData.find(
                                  (g) => g.id === ing.id
                                );
                                return ingData
                                  ? i18n.language === "en"
                                    ? ingData.nameEN
                                    : ingData.nameES
                                  : ing.id;
                              })()
                            : ""
                        }
                        onInputChange={(_, newInputValue, reason) => {
                          // Actualizar el estado del input para permitir escribir y filtrar
                          setIngredientInputValues((prev) => ({
                            ...prev,
                            [index]: newInputValue,
                          }));

                          if (reason === "clear") {
                            // Cuando se limpia el campo
                            updateIngredient(index, "id", "");
                            setIngredientInputValues((prev) => {
                              const newValues = { ...prev };
                              delete newValues[index];
                              return newValues;
                            });
                          } else if (reason === "reset") {
                            // Cuando se resetea, limpiar el estado del input
                            setIngredientInputValues((prev) => {
                              const newValues = { ...prev };
                              delete newValues[index];
                              return newValues;
                            });
                          }
                        }}
                        sx={{
                          flex: 2,
                          ...getAutocompleteColorStyles(
                            `recipes.ingredientName-${index}`
                          ),
                        }}
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
                            label={t("recipes.ingredientName")}
                            placeholder={t("recipes.ingredientName")}
                            size="small"
                            sx={{ flex: 2 }}
                            onBlur={(e) => {
                              const inputValue = e.target.value;
                              if (!inputValue || !inputValue.trim()) {
                                return;
                              }

                              const currentLang = i18n.language || "es";
                              const normalizedSearch =
                                normalizeSearchText(inputValue);

                              // Buscar el ingrediente más aproximado
                              // Prioridad: 1) Coincidencia exacta, 2) Empieza con, 3) Contiene
                              let bestMatch: IngredientData | null = null;
                              let bestScore = 0;

                              for (const ingData of allIngredientsData) {
                                const nameInCurrentLang =
                                  currentLang === "en"
                                    ? ingData.nameEN
                                    : ingData.nameES;
                                const normalizedName =
                                  normalizeSearchText(nameInCurrentLang);

                                let score = 0;
                                if (normalizedName === normalizedSearch) {
                                  score = 3; // Coincidencia exacta
                                } else if (
                                  normalizedName.startsWith(normalizedSearch)
                                ) {
                                  score = 2; // Empieza con
                                } else if (
                                  normalizedName.includes(normalizedSearch)
                                ) {
                                  score = 1; // Contiene
                                }

                                if (score > bestScore) {
                                  bestScore = score;
                                  bestMatch = ingData;
                                }
                              }

                              if (bestMatch && bestScore > 0) {
                                updateIngredient(index, "id", bestMatch.id);
                                setIngredientInputValues((prev) => {
                                  const newValues = { ...prev };
                                  delete newValues[index];
                                  return newValues;
                                });
                              }
                            }}
                          />
                        )}
                        size="small"
                      />
                      <TextField
                        label={t("recipes.ingredientMeasure")}
                        placeholder="ej: 2 kg"
                        value={ing.measure}
                        onChange={(e) =>
                          updateIngredient(index, "measure", e.target.value)
                        }
                        sx={{
                          flex: 1,
                          ...getTextFieldColorStyles(
                            `recipes.ingredientMeasure-${index}`
                          ),
                        }}
                        size="small"
                      />
                      <IconButton
                        onClick={() => {
                          removeIngredient(index);
                          // Limpiar el estado del input cuando se elimina el ingrediente
                          setIngredientInputValues((prev) => {
                            const newValues = { ...prev };
                            delete newValues[index];
                            // Reindexar los valores después de eliminar
                            const reindexed: Record<number, string> = {};
                            Object.keys(newValues).forEach((key) => {
                              const keyNum = parseInt(key);
                              if (keyNum < index) {
                                reindexed[keyNum] = newValues[keyNum];
                              } else if (keyNum > index) {
                                reindexed[keyNum - 1] = newValues[keyNum];
                              }
                            });
                            return reindexed;
                          });
                        }}
                        size="small"
                        sx={{ fontSize: "1.3rem" }}
                      >
                        🗑️
                      </IconButton>
                    </Stack>
                  ))}
                </Box>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  {t("recipes.ingredientsLabel")}
                </Typography>
                <List key={`ingredients-${i18n.language}`}>
                  {displayRecipe?.ingredients.map((ingredient, idx) => {
                    // Buscar el ingrediente completo por id
                    const ingData = allIngredientsData.find(
                      (g) => g.id === ingredient.id
                    );
                    const displayName = ingData
                      ? i18n.language === "en"
                        ? ingData.nameEN
                        : ingData.nameES
                      : ingredient.id;
                    return (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={displayName}
                          secondary={ingredient.measure}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {t("recipes.instructionsLabel")}
            </Typography>
            {isEditing ? (
              <TextField
                key={`instructions-${i18n.language}`}
                label={t("recipes.instructionsLabel")}
                fullWidth
                multiline
                rows={20}
                value={
                  i18n.language === "en"
                    ? formData.instructionsEN || ""
                    : formData.instructionsES || ""
                }
                onChange={(e) => {
                  const currentLang = i18n.language || "es";
                  if (currentLang === "en") {
                    setFormData({
                      ...formData,
                      instructionsEN: e.target.value,
                    });
                  } else {
                    setFormData({
                      ...formData,
                      instructionsES: e.target.value,
                    });
                  }
                }}
                placeholder={t("recipes.instructionsLabel")}
                sx={getTextFieldColorStyles("recipes.instructionsLabel")}
              />
            ) : (
              <Box
                sx={{
                  "& h3": { mt: 2, mb: 1 },
                  "& p": { mb: 1 },
                  "& li": { mb: 0.5 },
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    getInstructions(displayRecipe)
                      .split("\n")
                      .map((line) => {
                        if (line.trim().startsWith("#")) {
                          return `<h3>${line.replace(/^#+\s*/, "")}</h3>`;
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
                      .join("") || "",
                }}
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {!isEditing && recipe && recipe.source === "ai" && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Button variant="contained" onClick={handleSave}>
            {t("recipes.saveRecipe")}
          </Button>
        </Box>
      )}

      <WeekMealDialog
        open={weekDialogOpen}
        recipeName={recipe?.name || ""}
        onClose={() => setWeekDialogOpen(false)}
        onConfirm={handleWeekDialogConfirm}
      />
    </Container>
  );
}
