import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Ingredient, IngredientCategory } from "../types";
import {
  findEnglishName,
  getAllIngredients,
  translateIngredient,
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    category: "other" as IngredientCategory,
    measure: "",
  });
  const [displayName, setDisplayName] = useState("");

  // Resetear el formulario cuando se abre/cierra o cambia el ingrediente a editar
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (editingIngredient) {
        setFormData({
          name: editingIngredient.name,
          category: editingIngredient.category,
          measure: editingIngredient.measure,
        });
        setDisplayName(translateIngredient(editingIngredient.name));
      } else {
        setFormData({
          name: "",
          category: "other",
          measure: "",
        });
        setDisplayName("");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [open, editingIngredient]);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingIngredient ? t("inventory.edit") : t("inventory.addIngredient")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <TextField
            fullWidth
            label={t("inventory.name")}
            value={displayName || formData.name}
            onChange={async (e) => {
              const newDisplayName = e.target.value;
              setDisplayName(newDisplayName);

              // Si el campo está vacío, limpiar también formData.name
              if (!newDisplayName.trim()) {
                setFormData({ ...formData, name: "" });
                return;
              }

              // Intentar encontrar el ingrediente original en inglés por su traducción
              const allIngredients = await getAllIngredients();
              const found = await findEnglishName(
                newDisplayName,
                allIngredients
              );

              if (found) {
                // Si se encuentra, usar el nombre en inglés y su categoría
                const ingredientData = allIngredients.find(
                  (ing) => ing.name === found
                );
                setFormData({
                  ...formData,
                  name: found,
                  category: ingredientData?.category || formData.category,
                });
              } else {
                // Si no se encuentra, usar el nombre ingresado directamente (ingrediente personalizado)
                setFormData({ ...formData, name: newDisplayName });
              }
            }}
            placeholder={t("inventory.name")}
          />
        </Box>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t("inventory.category")}</InputLabel>
          <Select
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value as IngredientCategory,
              })
            }
            label={t("inventory.category")}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {t(`inventory.categories.${cat}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label={t("inventory.measure") || "Medida"}
          value={formData.measure}
          onChange={(e) =>
            setFormData({ ...formData, measure: e.target.value })
          }
          placeholder="2 kg"
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("inventory.cancel")}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t("inventory.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
