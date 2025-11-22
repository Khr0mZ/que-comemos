import { Box, Button, CircularProgress, Dialog, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface WarningDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function WarningDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading = false,
}: WarningDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
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
          {title}
        </Typography>
        <Typography variant="body1">{message}</Typography>
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
            <Button onClick={onCancel} variant="outlined" disabled={loading}>
              {cancelText || t("common.cancel")}
            </Button>
          </Box>
          <Box>
            <Button
              onClick={onConfirm}
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: "error.main",
                "&:hover": { color: "error.main" },
                minWidth: 100,
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "inherit" }} />
              ) : (
                confirmText || t("common.confirm")
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
