import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { translateIngredient } from "../utils/ingredientTranslations";
import type { Ingredient } from "../types";

interface ShoppingListDialogProps {
  open: boolean;
  ingredient: Ingredient | null;
  onClose: () => void;
  onConfirm: (measure: string) => void;
}

export default function ShoppingListDialog({
  open,
  ingredient,
  onClose,
  onConfirm,
}: ShoppingListDialogProps) {
  const { t } = useTranslation();
  // Usar el nombre del ingrediente como key para resetear el estado cuando cambia
  const ingredientKey = ingredient?.name || "";
  const [measure, setMeasure] = useState(ingredient?.measure || "");

  // Resetear el estado cuando cambia el ingrediente usando la key del componente
  // El estado se resetea automáticamente cuando cambia la key del componente padre

  const handleConfirm = () => {
    if (ingredient) {
      onConfirm(measure);
      onClose();
    }
  };

  const handleClose = () => {
    setMeasure("");
    onClose();
  };

  return (
    <Dialog key={ingredientKey} open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("inventory.addToShoppingList") || "Agregar a lista de compra"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {ingredient && (
              <>
                {t("inventory.ingredientName") || "Ingrediente"}:{" "}
                <strong>{translateIngredient(ingredient.name)}</strong>
              </>
            )}
          </Typography>
          <TextField
            fullWidth
            label={t("inventory.measure") || "Cantidad / Medida"}
            value={measure}
            onChange={(e) => setMeasure(e.target.value)}
            placeholder="ej: 2 kg, 500 g, 1 litro"
            autoFocus
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {t("inventory.shoppingMeasureHint") ||
              "Ingresa la cantidad que necesitas comprar"}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("inventory.cancel")}</Button>
        <Button variant="contained" onClick={handleConfirm}>
          {t("inventory.add") || "Agregar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

