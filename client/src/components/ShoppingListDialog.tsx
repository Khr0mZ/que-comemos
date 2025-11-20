import { Box, Button, Dialog, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Ingredient } from "../types";
import type { IngredientData } from "../utils/ingredientTranslations";
import { getAllIngredients } from "../utils/ingredientTranslations";

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
  const { t, i18n } = useTranslation();
  const [allIngredientsData, setAllIngredientsData] = useState<
    IngredientData[]
  >([]);

  useEffect(() => {
    getAllIngredients().then(setAllIngredientsData);
  }, []);

  // Usar el id del ingrediente como key para resetear el estado cuando cambia
  const ingredientKey = ingredient?.id || "";
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
    <Dialog
      key={ingredientKey}
      open={open}
      onClose={handleClose}
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
          {t("inventory.addToShoppingList") || "Agregar a lista de compra"}
        </Typography>

        <Box
          sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            {ingredient &&
              (() => {
                const ingData = allIngredientsData.find(
                  (g) => g.id === ingredient.id
                );
                const displayName = ingData
                  ? i18n.language === "en"
                    ? ingData.nameEN
                    : ingData.nameES
                  : ingredient.id;
                return (
                  <>
                    {t("inventory.ingredientName") || "Ingrediente"}:{" "}
                    <strong>{displayName}</strong>
                  </>
                );
              })()}
          </Typography>
          <TextField
            fullWidth
            label={t("inventory.measure") || "Cantidad / Medida"}
            value={measure}
            onChange={(e) => setMeasure(e.target.value)}
            placeholder="ej: 2 kg, 500 g, 1 litro"
            autoFocus
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            {t("inventory.shoppingMeasureHint") ||
              "Ingresa la cantidad que necesitas comprar"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 1,
            width: "100%",
          }}
        >
          <Button onClick={handleClose} variant="outlined">
            {t("inventory.cancel")}
          </Button>
          <Button variant="contained" onClick={handleConfirm}>
            {t("inventory.add") || "Agregar"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
