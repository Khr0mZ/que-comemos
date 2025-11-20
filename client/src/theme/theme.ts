import { createTheme } from "@mui/material/styles";

// Add global CSS for animations
const style = document.createElement("style");
style.innerHTML = `
@keyframes checkBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
`;
document.head.appendChild(style);

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
          borderRadius: 20,
          padding: "10px 24px",
          fontWeight: 400,
          boxShadow: "0 4px 12px rgba(255, 23, 68, 0.2)",
          textTransform: "none",
          fontSize: "1rem",
          letterSpacing: "0.02em",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(255, 23, 68, 0.3)",
            transform: "translateY(-2px) scale(1.05) rotate(-2deg)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #a9def3 0%, #e7fdff 100%)",
          color: "#333",
          border: "2px solid #a9def3",
          "&:hover": {
            background: "linear-gradient(135deg, #FF6B9D 0%, #FFC107 100%)",
            color: "#fff",
            borderColor: "#FF1744",
            transform: "translateY(-3px) scale(1.08) rotate(2deg)",
          },
          // Add variety with nth-child selectors for different gradients
          "&:nth-of-type(2n)": {
            background: "linear-gradient(135deg, #FFB3BA 0%, #FFDFBA 100%)",
            borderColor: "#FF9AA2",
            "&:hover": {
              background: "linear-gradient(135deg, #B4F8C8 0%, #A0E7E5 100%)",
              borderColor: "#81C784",
            },
          },
          "&:nth-of-type(3n)": {
            background: "linear-gradient(135deg, #FEC8D8 0%, #FFDFD3 100%)",
            borderColor: "#FF6B9D",
            "&:hover": {
              background: "linear-gradient(135deg, #A9DEF9 0%, #D0F4DE 100%)",
              borderColor: "#4CAF50",
            },
          },
        },
        outlined: {
          fontWeight: 400,
          borderWidth: 2,
          background: "linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)",
          "&:hover": {
            borderWidth: 3,
            background: "linear-gradient(135deg, #FFE4E1 0%, #E7FDFF 100%)",
            transform: "scale(1.08) rotate(-3deg)",
            boxShadow: "0 6px 20px rgba(169, 222, 243, 0.3)",
          },
          // Colorful variety for outlined buttons
          "&:nth-of-type(2n)": {
            background: "linear-gradient(135deg, #FFFFFF 0%, #F0F8FF 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #D0F4DE 0%, #FFE4F0 100%)",
              borderColor: "#4CAF50",
            },
          },
          "&:nth-of-type(3n)": {
            background: "linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #FFDAE6 0%, #E7FDFF 100%)",
              borderColor: "#FF6B9D",
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          borderRadius: 24,
          boxShadow: "0 4px 20px rgba(255, 23, 68, 0.12)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          border: "2px solid #FFC10740",
          background:
            "linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 50%, #F0F8FF 100%)",
          "&:hover": {
            transform: "translateY(-4px) scale(1.01)",
            boxShadow: "0 8px 30px rgba(255, 193, 7, 0.25)",
            borderColor: "#FFC107",
          },
          // Add colorful variety to cards
          "&:nth-of-type(3n+1)": {
            background:
              "linear-gradient(135deg, #FFF5F7 0%, #FFF9E6 50%, #FFFFFF 100%)",
            borderColor: "#FFB3BA40",
          },
          "&:nth-of-type(3n+2)": {
            background:
              "linear-gradient(135deg, #F0F8FF 0%, #E7FDFF 50%, #FFFFFF 100%)",
            borderColor: "#A9DEF340",
          },
          "&:nth-of-type(3n+3)": {
            background:
              "linear-gradient(135deg, #F5FFF5 0%, #FFFEF0 50%, #FFFFFF 100%)",
            borderColor: "#B4F8C840",
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
            backgroundColor: "#F0E6FF",
            fontFamily: '"Patrick Hand", cursive',
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            "&:hover": {
              backgroundColor: "#E1D5FF",
              transform: "scale(1.01)",
            },
            "&:hover fieldset": {
              borderColor: "#A78BFA",
              borderWidth: 2,
              boxShadow: "0 0 0 3px rgba(167, 139, 250, 0.1)",
            },
            "&.Mui-focused": {
              backgroundColor: "#FFFFFF",
              transform: "scale(1.02) rotate(0.5deg)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#8B5CF6",
              borderWidth: 3,
              boxShadow: "0 0 0 4px rgba(139, 92, 246, 0.15)",
            },
          },
          "& .MuiInputLabel-root": {
            fontFamily: '"Patrick Hand", cursive',
          },
          // Add colorful variety to inputs
          "&:nth-of-type(2n) .MuiOutlinedInput-root": {
            backgroundColor: "#D0F4DE",
            "&:hover": {
              backgroundColor: "#B4F8C8",
            },
            "&:hover fieldset": {
              borderColor: "#4CAF50",
              boxShadow: "0 0 0 3px rgba(76, 175, 80, 0.15)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2E7D32",
              boxShadow: "0 0 0 4px rgba(46, 125, 50, 0.15)",
            },
          },
          "&:nth-of-type(3n) .MuiOutlinedInput-root": {
            backgroundColor: "#FFE4F0",
            "&:hover": {
              backgroundColor: "#FFDAE6",
            },
            "&:hover fieldset": {
              borderColor: "#FF6B9D",
              boxShadow: "0 0 0 3px rgba(255, 107, 157, 0.15)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#E91E63",
              boxShadow: "0 0 0 4px rgba(233, 30, 99, 0.15)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          borderRadius: 20,
          fontWeight: 500,
          fontSize: "0.95rem",
          padding: "6px 12px",
          height: "auto",
          background: "linear-gradient(135deg, #a9def3 0%, #e7fdff 100%)",
          border: "2px solid #a9def3",
          transition: "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          boxShadow: "0 2px 8px rgba(169, 222, 243, 0.3)",
          "&:hover": {
            transform: "scale(1.05) rotate(-2deg)",
            background: "linear-gradient(135deg, #FF6B9D 0%, #FFC107 100%)",
            borderColor: "#FF1744",
            boxShadow: "0 4px 12px rgba(255, 193, 7, 0.4)",
          },
        },
        colorPrimary: {
          background: "linear-gradient(135deg, #FF6B9D 0%, #FF1744 100%)",
          border: "2px solid #FF1744",
          color: "#fff",
          "&:hover": {
            background: "linear-gradient(135deg, #FFC107 0%, #FF6B9D 100%)",
          },
        },
        colorSecondary: {
          background: "linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)",
          border: "2px solid #FFC107",
          color: "#333",
          "&:hover": {
            background: "linear-gradient(135deg, #FFD54F 0%, #FFC107 100%)",
          },
        },
        colorSuccess: {
          background: "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)",
          border: "2px solid #388E3C",
          color: "#fff",
          "&:hover": {
            background: "linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)",
          },
        },
        colorInfo: {
          background: "linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)",
          border: "2px solid #2196F3",
          color: "#fff",
        },
        colorWarning: {
          background: "linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)",
          border: "2px solid #FF9800",
          color: "#fff",
        },
        colorError: {
          background: "linear-gradient(135deg, #E91E63 0%, #F06292 100%)",
          border: "2px solid #E91E63",
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
          fontSize: "1.5rem",
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
    MuiCheckbox: {
      styleOverrides: {
        root: {
          transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          borderRadius: 8,
          padding: 10,
          "&:hover": {
            transform: "scale(1.15) rotate(-5deg)",
            backgroundColor: "rgba(169, 222, 243, 0.1)",
          },
          "&.Mui-checked": {
            animation: "checkBounce 0.3s ease",
            color: "#4CAF50",
            "&:hover": {
              transform: "scale(1.15) rotate(5deg)",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
            },
          },
          // Colorful variety for checkboxes
          "& .MuiSvgIcon-root": {
            fontSize: "1.8rem",
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
          },
          // Estilos para checkboxes sin marcar con colores aleatorios
          "&:not(.Mui-checked)": {
            "&[data-color]": {
              color: "var(--checkbox-color)",
              "&:hover": {
                backgroundColor: "var(--checkbox-hover-bg)",
                "& .MuiSvgIcon-root": {
                  filter: "drop-shadow(0 2px 6px var(--checkbox-shadow))",
                },
              },
              "& .MuiSvgIcon-root": {
                filter: "drop-shadow(0 2px 4px var(--checkbox-shadow))",
              },
            },
          },
          "&:nth-of-type(3n+1).Mui-checked": {
            color: "#FF6B9D",
            "& .MuiSvgIcon-root": {
              filter: "drop-shadow(0 2px 6px rgba(255, 107, 157, 0.4))",
            },
          },
          "&:nth-of-type(3n+2).Mui-checked": {
            color: "#A78BFA",
            "& .MuiSvgIcon-root": {
              filter: "drop-shadow(0 2px 6px rgba(167, 139, 250, 0.4))",
            },
          },
          "&:nth-of-type(3n+3).Mui-checked": {
            color: "#4CAF50",
            "& .MuiSvgIcon-root": {
              filter: "drop-shadow(0 2px 6px rgba(76, 175, 80, 0.4))",
            },
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Patrick Hand", cursive',
          margin: 0,
          padding: "4px 8px",
          borderRadius: 12,
          transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          "&:hover": {
            backgroundColor: "rgba(169, 222, 243, 0.08)",
            transform: "scale(1.05) rotate(-2deg)",
            // Trigger checkbox hover effect when hovering the label
            "& .MuiCheckbox-root": {
              transform: "scale(1.15) rotate(-5deg)",
              backgroundColor: "rgba(169, 222, 243, 0.1)",
            },
            "& .MuiCheckbox-root.Mui-checked": {
              transform: "scale(1.15) rotate(5deg)",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
            },
          },
          // Change rotation when checkbox is checked
          "&:has(.Mui-checked)": {
            "&:hover": {
              transform: "scale(1.05) rotate(2deg)",
            },
          },
          // Colorful variety for labels
          "&:nth-of-type(3n+1):hover": {
            backgroundColor: "rgba(255, 107, 157, 0.08)",
            "& .MuiCheckbox-root.Mui-checked": {
              backgroundColor: "rgba(255, 107, 157, 0.1)",
            },
          },
          "&:nth-of-type(3n+2):hover": {
            backgroundColor: "rgba(167, 139, 250, 0.08)",
            "& .MuiCheckbox-root.Mui-checked": {
              backgroundColor: "rgba(167, 139, 250, 0.1)",
            },
          },
          "&:nth-of-type(3n+3):hover": {
            backgroundColor: "rgba(76, 175, 80, 0.08)",
            "& .MuiCheckbox-root.Mui-checked": {
              backgroundColor: "rgba(76, 175, 80, 0.1)",
            },
          },
        },
        label: {
          fontFamily: '"Patrick Hand", cursive',
          fontSize: "1rem",
          fontWeight: 400,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.2s",
          "&:hover": {
            transform: "scale(1.1) rotate(5deg)",
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: "0 10px 30px rgba(255, 23, 68, 0.15)",
          border: "2px solid #FFC107",
          overflow: "hidden",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
          },
        },
        tag: {
          borderRadius: 16,
        },
        paper: {
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(255, 23, 68, 0.15)",
          border: "2px solid #FFC107",
          background: "linear-gradient(135deg, #FFFFFF 0%, #FFF9E6 100%)",
        },
        option: {
          fontFamily: '"Patrick Hand", cursive',
          transition: "all 0.2s",
          "&:hover": {
            background: "linear-gradient(135deg, #FFE4E1 0%, #FFF9E6 100%)",
            transform: "translateX(5px)",
          },
          "&.Mui-focused": {
            background: "linear-gradient(135deg, #FFB3BA 0%, #FFDFBA 100%)",
          },
        },
      },
    },
  },
});
