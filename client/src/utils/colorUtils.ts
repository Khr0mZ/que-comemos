/**
 * Colores pastel que coinciden con la paleta de la aplicación
 */
export const PASTEL_COLORS = [
  "#FFB3BA", // Rosa pastel
  "#FFDFBA", // Durazno pastel
  "#B4F8C8", // Verde menta pastel
  "#A0E7E5", // Turquesa pastel
  "#FEC8D8", // Rosa claro
  "#FFDFD3", // Durazno claro
  "#A9DEF9", // Azul cielo
  "#D0F4DE", // Verde claro
  "#FFE4F0", // Rosa muy claro
  "#FFDAE6", // Rosa claro
  "#E7FDFF", // Azul muy claro
  "#A78BFA", // Morado pastel
  "#F0E6FF", // Lavanda claro
  "#FFC8E0", // Rosa suave
  "#C8E6FF", // Azul suave
  "#C8FFE0", // Verde suave
  "#FFE6C8", // Durazno suave
  "#E6C8FF", // Morado suave
];

/**
 * Genera un hash simple a partir de un string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  return Math.abs(hash);
}

/**
 * Obtiene un color pastel aleatorio pero consistente basado en un string
 * @param str - String para generar el color (ej: nombre de ingrediente)
 * @returns Color hexadecimal en formato string
 */
export function getRandomColorFromString(str: string): string {
  if (!str) return PASTEL_COLORS[0];
  const hash = hashString(str);
  const index = hash % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
}

/**
 * Genera estilos para TextField con colores aleatorios pero consistentes
 * @param fieldId - Identificador único del campo (ej: label, placeholder, etc.)
 * @returns Objeto de estilos sx para Material-UI
 */
export function getTextFieldColorStyles(fieldId: string) {
  const baseColor = getRandomColorFromString(fieldId);
  const hoverColor = lightenColor(baseColor, 0.1);
  const borderColor = darkenColor(baseColor, 0.2);
  const shadowColor = `${baseColor}40`;

  return {
    "& .MuiOutlinedInput-root": {
      backgroundColor: baseColor,
      "&:hover": {
        backgroundColor: hoverColor,
        "& fieldset": {
          borderColor: borderColor,
          borderWidth: 2,
          boxShadow: `0 0 0 3px ${shadowColor}`,
        },
      },
      "&.Mui-focused": {
        backgroundColor: "#FFFFFF",
        "& fieldset": {
          borderColor: borderColor,
          borderWidth: 3,
          boxShadow: `0 0 0 4px ${shadowColor}`,
        },
      },
    },
  };
}

/**
 * Genera estilos para Autocomplete con colores aleatorios pero consistentes
 * @param fieldId - Identificador único del campo (ej: label, placeholder, etc.)
 * @returns Objeto de estilos sx para Material-UI
 */
export function getAutocompleteColorStyles(fieldId: string) {
  const baseColor = getRandomColorFromString(fieldId);
  const hoverColor = lightenColor(baseColor, 0.1);
  const borderColor = darkenColor(baseColor, 0.2);
  const shadowColor = `${baseColor}40`;

  return {
    "& .MuiOutlinedInput-root": {
      backgroundColor: baseColor,
      "&:hover": {
        backgroundColor: hoverColor,
        "& fieldset": {
          borderColor: borderColor,
          borderWidth: 2,
          boxShadow: `0 0 0 3px ${shadowColor}`,
        },
      },
      "&.Mui-focused": {
        backgroundColor: "#FFFFFF",
        "& fieldset": {
          borderColor: borderColor,
          borderWidth: 3,
          boxShadow: `0 0 0 4px ${shadowColor}`,
        },
      },
    },
  };
}

/**
 * Aclara un color hexadecimal
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Oscurece un color hexadecimal
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * percent));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * percent));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

