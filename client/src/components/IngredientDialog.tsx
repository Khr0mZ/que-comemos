import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Ingredient, IngredientCategory } from "../types";
import {
  getAutocompleteColorStyles,
  getTextFieldColorStyles,
} from "../utils/colorUtils";
import {
  getAllIngredients,
  normalizeSearchText,
} from "../utils/ingredientTranslations";

interface IngredientDialogProps {
  open: boolean;
  editingIngredient: Ingredient | null;
  onClose: () => void;
  onSave: (ingredient: Ingredient) => void;
}

const categories: IngredientCategory[] = [
  "vegetable",
  "fruit",
  "meat",
  "dairy",
  "grain",
  "spice",
  "beverage",
  "other",
];

export default function IngredientDialog({
  open,
  editingIngredient,
  onClose,
  onSave,
}: IngredientDialogProps) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    id: "",
    category: "other" as IngredientCategory,
    measure: "",
  });
  const [displayName, setDisplayName] = useState("");
  const [allIngredients, setAllIngredients] = useState<
    Awaited<ReturnType<typeof getAllIngredients>>
  >([]);

  // Cargar ingredientes globales y ordenarlos según el idioma actual
  useEffect(() => {
    const loadIngredients = async () => {
      const ingredients = await getAllIngredients();
      const currentLang = i18n.language || "es";

      // Ordenar alfabéticamente según el idioma actual
      const sorted = [...ingredients].sort((a, b) => {
        const nameA = currentLang === "en" ? a.nameEN : a.nameES;
        const nameB = currentLang === "en" ? b.nameEN : b.nameES;

        return normalizeSearchText(nameA).localeCompare(
          normalizeSearchText(nameB),
          currentLang,
          { sensitivity: "base" }
        );
      });

      setAllIngredients(sorted);
    };
    loadIngredients();
  }, [i18n.language]);

  // Resetear el formulario cuando se abre/cierra o cambia el ingrediente a editar
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (editingIngredient) {
        const ingData = allIngredients.find(
          (g) => g.id === editingIngredient.id
        );
        const display = ingData
          ? i18n.language === "en"
            ? ingData.nameEN
            : ingData.nameES
          : editingIngredient.id;
        setFormData({
          id: editingIngredient.id,
          category: editingIngredient.category,
          measure: editingIngredient.measure,
        });
        setDisplayName(display);
      } else {
        setFormData({
          id: "",
          category: "other",
          measure: "",
        });
        setDisplayName("");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [open, editingIngredient, allIngredients, i18n.language]);

  const handleSave = () => {
    if (!formData.id.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            position: "relative",
            overflow: "hidden",
            borderRadius: 2,
            backgroundColor: "transparent",
            boxShadow: "none",
            width: "400px",
            height: "400px",
            maxWidth: "400px",
            maxHeight: "400px",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "url(/dialog.webp)",
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              zIndex: 0,
            },
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          p: 6,
          gap: 2,
          zIndex: 1,
          height: "100%",
          width: "100%",
        }}
      >
        <Typography variant="h6" component="div" fontWeight={600}>
          {editingIngredient
            ? t("inventory.edit")
            : t("inventory.addIngredient")}
        </Typography>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Autocomplete
            fullWidth
            options={allIngredients}
            value={allIngredients.find((g) => g.id === formData.id) || null}
            onChange={(_, newValue) => {
              // Cuando se selecciona una opción explícitamente
              if (newValue && typeof newValue !== "string") {
                const ingData = newValue;
                setFormData({
                  ...formData,
                  id: ingData.id,
                  category: ingData.category,
                });
                setDisplayName(
                  i18n.language === "en" ? ingData.nameEN : ingData.nameES
                );
              } else {
                // Si se limpia la selección
                setFormData({ ...formData, id: "" });
                setDisplayName("");
              }
            }}
            inputValue={displayName}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === "input") {
                setDisplayName(newInputValue);
              } else if (reason === "clear") {
                setFormData({ ...formData, id: "" });
                setDisplayName("");
              }
            }}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return i18n.language === "en" ? option.nameEN : option.nameES;
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={getAutocompleteColorStyles(t("inventory.name"))}
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
                label={t("inventory.name")}
                placeholder={t("inventory.name")}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  if (!inputValue || !inputValue.trim()) {
                    return;
                  }

                  const currentLang = i18n.language || "es";
                  const normalizedSearch = normalizeSearchText(inputValue);

                  // Buscar el ingrediente más aproximado
                  // Prioridad: 1) Coincidencia exacta, 2) Empieza con, 3) Contiene
                  let bestMatch: (typeof allIngredients)[0] | null = null;
                  let bestScore = 0;

                  for (const ingData of allIngredients) {
                    const nameInCurrentLang =
                      currentLang === "en" ? ingData.nameEN : ingData.nameES;
                    const normalizedName =
                      normalizeSearchText(nameInCurrentLang);

                    let score = 0;
                    if (normalizedName === normalizedSearch) {
                      score = 3; // Coincidencia exacta
                    } else if (normalizedName.startsWith(normalizedSearch)) {
                      score = 2; // Empieza con
                    } else if (normalizedName.includes(normalizedSearch)) {
                      score = 1; // Contiene
                    }

                    if (score > bestScore) {
                      bestScore = score;
                      bestMatch = ingData;
                    }
                  }

                  if (bestMatch && bestScore > 0) {
                    setFormData({
                      ...formData,
                      id: bestMatch.id,
                      category: bestMatch.category,
                    });
                    setDisplayName(
                      currentLang === "en" ? bestMatch.nameEN : bestMatch.nameES
                    );
                  }
                }}
              />
            )}
          />

          <Autocomplete
            fullWidth
            options={categories}
            value={formData.category}
            onChange={(_, newValue) =>
              setFormData({
                ...formData,
                category: (newValue as IngredientCategory) || "other",
              })
            }
            getOptionLabel={(option) => t(`inventory.categories.${option}`)}
            sx={getAutocompleteColorStyles(t("inventory.category"))}
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
              <TextField {...params} label={t("inventory.category")} />
            )}
          />

          <TextField
            fullWidth
            label={t("inventory.measure") || "Medida"}
            value={formData.measure}
            onChange={(e) =>
              setFormData({ ...formData, measure: e.target.value })
            }
            placeholder="2 kg"
            sx={getTextFieldColorStyles(t("inventory.measure") || "Medida")}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 1,
            height: "100%",
          }}
        >
          <Box>
            <Button onClick={onClose} variant="outlined">
              {t("inventory.cancel")}
            </Button>
          </Box>
          <Box>
            <Button variant="contained" onClick={handleSave}>
              {t("inventory.save")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
