import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import { useSnackbar } from "../hooks/useSnackbar";
import { useIngredients, useRecipes } from "../hooks/useStorage";
import { ollamaService } from "../services/ollama";
import type { Recipe } from "../types";
import { translateIngredient } from "../utils/ingredientTranslations";
import {
  filterRecipesByArea,
  filterRecipesByCategory,
  filterRecipesByIngredients,
  filterRecipesByTags,
} from "../utils/recipeUtils";

const ITEMS_PER_PAGE = 30;

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [selectedRecipeName, setSelectedRecipeName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ollamaStatus, setOllamaStatus] = useState<{
    available: boolean;
    error?: string;
    modelFound?: boolean;
  } | null>(null);
  const [streamingText, setStreamingText] = useState<string>("");
  const [showStreamingPreview, setShowStreamingPreview] = useState(false);

  useEffect(() => {
    checkOllamaStatus();
    loadFilterData();
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

  const checkOllamaStatus = async () => {
    const status = await ollamaService.checkAvailability();
    setOllamaStatus(status);
    return status;
  };

  const { recipes: allRecipes } = useRecipes();
  const { ingredients: allIngredients } = useIngredients();

  const handleSearch = async () => {
    setLoading(true);
    setShowResults(true);

    let filtered: Recipe[] = [];

    // Caso A: Receta preseleccionada
    if (selectedRecipeName) {
      const recipe = allRecipes.find((r) => r.name === selectedRecipeName);
      if (recipe) {
        // Usar el nombre como identificador en la URL
        navigate(`/recipe/${encodeURIComponent(recipe.name)}`);
        return;
      }
    }

    // Caso B: Búsqueda por criterios
    filtered = [...allRecipes];

    // Filtrar por ingredientes
    if (selectedIngredients.length > 0) {
      filtered = filterRecipesByIngredients(filtered, selectedIngredients);
    }

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filterRecipesByCategory(filtered, selectedCategory);
    }

    // Filtrar por área
    if (selectedArea) {
      filtered = filterRecipesByArea(filtered, selectedArea);
    }

    // Filtrar por tag
    if (selectedTag) {
      filtered = filterRecipesByTags(filtered, [selectedTag]);
    }

    setSuggestedRecipes(filtered);
    setVisibleCount(ITEMS_PER_PAGE); // Reset visible count when search changes
    setLoading(false);
  };

  // Get visible recipes for infinite scroll
  const visibleRecipes = useMemo(() => {
    return suggestedRecipes.slice(0, visibleCount);
  }, [suggestedRecipes, visibleCount]);

  // Handle infinite scroll using window scroll
  const handleScroll = useCallback(() => {
    if (visibleCount >= suggestedRecipes.length) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercentage = (scrollTop + windowHeight) / documentHeight;

    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8) {
      setVisibleCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, suggestedRecipes.length)
      );
    }
  }, [visibleCount, suggestedRecipes.length]);

  // Attach scroll listener to window
  useEffect(() => {
    if (showResults && suggestedRecipes.length > 0) {
      window.addEventListener("scroll", handleScroll);
      // Also check on mount in case content is already scrolled
      handleScroll();
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll, showResults, suggestedRecipes.length]);

  const handleGenerateAI = async () => {
    // Verificar estado antes de generar
    const status = await checkOllamaStatus();
    if (!status.available) {
      showSnackbar(
        `Ollama no está disponible:\n\n${status.error}\n\nPor favor verifica que Ollama esté corriendo.`,
        "error"
      );
      return;
    }
    if (!status.modelFound) {
      showSnackbar(
        `Modelo no encontrado:\n\n${status.error}\n\nPor favor ejecuta: ollama pull gpt-oss:20b`,
        "error"
      );
      return;
    }

    setGeneratingAI(true);
    setStreamingText("");
    setShowStreamingPreview(true);

    try {
      const ingredientNames =
        selectedIngredients.length > 0
          ? selectedIngredients
          : allIngredients.map((ing) => ing.name).slice(0, 5);

      if (ingredientNames.length === 0) {
        showSnackbar(
          "Por favor selecciona al menos un ingrediente o añade ingredientes a tu inventario.",
          "warning"
        );
        setGeneratingAI(false);
        setShowStreamingPreview(false);
        return;
      }

      const aiRecipe = await ollamaService.generateRecipe(
        ingredientNames,
        i18n.language,
        (text) => {
          // Callback de progreso: actualizar el texto mientras se genera
          setStreamingText(text);
        }
      );

      setShowStreamingPreview(false);

      if (aiRecipe) {
        navigate("/recipe/ai", { state: { recipe: aiRecipe } });
      } else {
        showSnackbar(
          "No se pudo generar la receta. Intenta de nuevo.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error generating AI recipe:", error);
      setShowStreamingPreview(false);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      showSnackbar(
        `Error al generar receta:\n\n${errorMessage}\n\nVerifica:\n1. Que Ollama esté corriendo\n2. Que el modelo gpt-oss:20b esté instalado\n3. La consola del navegador para más detalles`,
        "error"
      );
    } finally {
      setGeneratingAI(false);
      setStreamingText("");
    }
  };

  const toggleIngredient = (ingredientName: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientName)
        ? prev.filter((name) => name !== ingredientName)
        : [...prev, ingredientName]
    );
  };

  const handleViewRecipe = async (recipe: Recipe) => {
    navigate(`/recipe/${encodeURIComponent(recipe.name)}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography variant="h2" sx={{ mb: 3 }}>
        {t("home.title")}
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>{t("home.selectRecipe")}</InputLabel>
            <Select
              value={selectedRecipeName}
              onChange={(e) => setSelectedRecipeName(e.target.value)}
              label={t("home.selectRecipe")}
            >
              <MenuItem value="">-- {t("home.selectRecipe")} --</MenuItem>
              {allRecipes.map((recipe) => (
                <MenuItem key={recipe.name} value={recipe.name}>
                  {recipe.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t("home.selectCategory")}</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label={t("home.selectCategory")}
            >
              <MenuItem value="">-- {t("home.selectCategory")} --</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {t(`categories.${category}`, { defaultValue: category })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t("home.selectArea")}</InputLabel>
            <Select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              label={t("home.selectArea")}
            >
              <MenuItem value="">-- {t("home.selectArea")} --</MenuItem>
              {areas.map((area) => (
                <MenuItem key={area} value={area}>
                  {t(`areas.${area}`, { defaultValue: area })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t("home.selectTag")}</InputLabel>
            <Select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              label={t("home.selectTag")}
            >
              <MenuItem value="">-- {t("home.selectTag")} --</MenuItem>
              {tags.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {t(`tags.${tag}`, { defaultValue: tag })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
              {t("home.selectIngredients")}
            </Typography>
            {allIngredients.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography
                    align="center"
                    color="text.secondary"
                    sx={{ py: 4 }}
                  >
                    {t("home.noIngredientsAvailable")}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  p: 1,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {allIngredients.map((ingredient) => (
                  <FormControlLabel
                    key={ingredient.name}
                    control={
                      <Checkbox
                        checked={selectedIngredients.includes(ingredient.name)}
                        onChange={() => toggleIngredient(ingredient.name)}
                      />
                    }
                    label={translateIngredient(ingredient.name)}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<span style={{ fontSize: "1.2rem" }}>🔍</span>}
              onClick={handleSearch}
              disabled={loading}
              fullWidth
            >
              {loading ? t("common.loading") : t("home.searchRecipes")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<span style={{ fontSize: "1.2rem" }}>✨</span>}
              onClick={handleGenerateAI}
              disabled={
                generatingAI ||
                (ollamaStatus
                  ? !ollamaStatus.available || !ollamaStatus.modelFound
                  : false)
              }
              title={
                ollamaStatus &&
                (!ollamaStatus.available || !ollamaStatus.modelFound)
                  ? ollamaStatus.error
                  : undefined
              }
              fullWidth
            >
              {generatingAI ? t("home.aiThinking") : t("home.generateAI")}
            </Button>
          </Stack>
        </Stack>
      </Card>

      {showStreamingPreview && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6">Generando receta...</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">
                  La IA está escribiendo...
                </Typography>
              </Box>
            </Box>
            <Paper
              sx={{
                p: 2,
                bgcolor: "background.default",
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              <Typography
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  whiteSpace: "pre-wrap",
                  m: 0,
                }}
              >
                {streamingText || "Esperando respuesta..."}
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}

      {showResults && (
        <Box>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {suggestedRecipes.length === 0 ? (
                <Card>
                  <CardContent>
                    <Typography
                      align="center"
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      {t("home.noResults")}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {suggestedRecipes.length > 0 && (
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
                              showActions={false}
                            />
                          ))}
                        </Box>
                      </Box>
                      {visibleCount < suggestedRecipes.length && (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("recipes.loadingMore", {
                              loaded: visibleCount,
                              total: suggestedRecipes.length,
                            }) ||
                              `Mostrando ${visibleCount} de ${suggestedRecipes.length} recetas`}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      )}
    </Container>
  );
}
