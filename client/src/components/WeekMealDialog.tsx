import {
  Box,
  Button,
  Dialog,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DayOfWeek, MealType } from "../types";

interface WeekMealDialogProps {
  open: boolean;
  recipeName: string;
  onClose: () => void;
  onConfirm: (day: DayOfWeek, mealType: MealType) => void;
}

export default function WeekMealDialog({
  open,
  recipeName,
  onClose,
  onConfirm,
}: WeekMealDialogProps) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");

  const days: { value: DayOfWeek; label: string }[] = [
    { value: "monday", label: t("week.days.monday") },
    { value: "tuesday", label: t("week.days.tuesday") },
    { value: "wednesday", label: t("week.days.wednesday") },
    { value: "thursday", label: t("week.days.thursday") },
    { value: "friday", label: t("week.days.friday") },
    { value: "saturday", label: t("week.days.saturday") },
    { value: "sunday", label: t("week.days.sunday") },
  ];

  const mealTypes: { value: MealType; label: string }[] = [
    { value: "lunch", label: t("week.mealTypes.lunch") },
    { value: "dinner", label: t("week.mealTypes.dinner") },
  ];

  const handleConfirm = () => {
    onConfirm(selectedDay, selectedMealType);
    onClose();
    // Reset to default values
    setSelectedDay("monday");
    setSelectedMealType("lunch");
  };

  const handleClose = () => {
    onClose();
    // Reset to default values
    setSelectedDay("monday");
    setSelectedMealType("lunch");
  };

  return (
    <Dialog
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
          gap: 3,
          zIndex: 1,
          height: "100%",
          width: "100%",
        }}
      >
        <Typography variant="h6" component="div" fontWeight={600}>
          {t("week.addRecipeToWeek")}
        </Typography>
        <Typography variant="body1" align="center">
          {recipeName}
        </Typography>

        <FormControl fullWidth>
          <InputLabel>{t("week.selectDay")}</InputLabel>
          <Select
            value={selectedDay}
            label={t("week.selectDay")}
            onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
          >
            {days.map((day) => (
              <MenuItem key={day.value} value={day.value}>
                {day.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t("week.selectMealType")}</InputLabel>
          <Select
            value={selectedMealType}
            label={t("week.selectMealType")}
            onChange={(e) => setSelectedMealType(e.target.value as MealType)}
          >
            {mealTypes.map((meal) => (
              <MenuItem key={meal.value} value={meal.value}>
                {meal.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
            <Button
              onClick={handleClose}
              variant="outlined"
              startIcon={<span style={{ fontSize: "1rem" }}>❌</span>}
            >
              {t("common.cancel")}
            </Button>
          </Box>
          <Box>
            <Button
              onClick={handleConfirm}
              variant="contained"
              startIcon={<span style={{ fontSize: "1rem" }}>✅</span>}
            >
              {t("common.confirm")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

