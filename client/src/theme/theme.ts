import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#FF1744", // Rojo vibrante
      light: "#FF6B9D",
      dark: "#C51162",
      contrastText: "#fff",
    },
    secondary: {
      main: "#FFC107", // Amarillo dorado
      light: "#FFD54F",
      dark: "#FF8F00",
      contrastText: "#333",
    },
    success: {
      main: "#4CAF50", // Verde
      light: "#81C784",
      dark: "#388E3C",
    },
    info: {
      main: "#2196F3", // Azul
      light: "#64B5F6",
      dark: "#1976D2",
    },
    warning: {
      main: "#FF9800", // Naranja
      light: "#FFB74D",
      dark: "#F57C00",
    },
    error: {
      main: "#E91E63", // Rosa vibrante
      light: "#F06292",
      dark: "#C2185B",
    },
    background: {
      default: "#FFF9E6", // Fondo crema muy claro
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#555",
    },
  },
  typography: {
    fontFamily:
      '"Patrick Hand", cursive, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
      fontSize: "2rem",
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
      fontSize: "1.5rem",
      letterSpacing: "-0.01em",
    },
    h3: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
      fontSize: "1.2rem",
    },
    h4: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
    },
    h5: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
    },
    h6: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
    },
    body1: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
    },
    button: {
      fontFamily: '"Patrick Hand", cursive',
      textTransform: "none",
      fontWeight: 400,
      letterSpacing: "0.02em",
    },
    caption: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
    },
    overline: {
      fontFamily: '"Patrick Hand", cursive',
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          borderRadius: 16,
          padding: "0 1rem",
          fontWeight: 400,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          textTransform: "none",
          fontSize: "1rem",
          letterSpacing: "0.02em",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
          },
        },
        contained: {
          transition: "all 0.3s ease",
          backgroundColor: "#a9def3",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#e7fdff",
            color: "#a9def3",
          },
        },
        outlined: {
          fontWeight: 400,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          borderRadius: 20,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          border: "2px solid transparent",
          "&:hover": {
            //transform: "translateY(-4px) scale(1.02)",
            boxShadow: "0 8px 30px rgba(255, 23, 68, 0.3)",
            borderColor: "#FFC107",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
            backgroundColor: "#fff",
            fontFamily: '"Patrick Hand", cursive',
            "&:hover fieldset": {
              borderColor: "#FFC107",
              borderWidth: 2,
            },
            "&.Mui-focused fieldset": {
              borderColor: "#FF1744",
              borderWidth: 3,
            },
          },
          "& .MuiInputLabel-root": {
            fontFamily: '"Patrick Hand", cursive',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          borderRadius: 20,
          fontWeight: 400,
          fontSize: "0.875rem",
          padding: "4px 12px",
          height: "auto",
        },
        colorPrimary: {
          backgroundColor: "#FF1744",
          color: "#fff",
        },
        colorSecondary: {
          backgroundColor: "#FFC107",
          color: "#333",
        },
        colorSuccess: {
          backgroundColor: "#4CAF50",
          color: "#fff",
        },
        colorInfo: {
          backgroundColor: "#2196F3",
          color: "#fff",
        },
        colorWarning: {
          backgroundColor: "#FF9800",
          color: "#fff",
        },
        colorError: {
          backgroundColor: "#E91E63",
          color: "#fff",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          borderRadius: 0,
          boxShadow: "none",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          fontWeight: 400,
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
        },
      },
    },
  },
});
