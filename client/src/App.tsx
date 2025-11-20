import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ClerkProviderWrapper from "./components/ClerkProviderWrapper";
import { SnackbarProvider } from "./components/CustomSnackbar";
import Layout from "./components/Layout";
import UserInitializer from "./components/UserInitializer";
import "./i18n/config";
import Auth from "./pages/Auth";
import Cooking from "./pages/Cooking";
import IngredientList from "./pages/IngredientList";
import Planning from "./pages/Planning";
import RecipeDetails from "./pages/RecipeDetails";
import RecipeList from "./pages/RecipeList";
import ShoppingList from "./pages/ShoppingList";
import { theme } from "./theme/theme";

// Obtener la clave pública de Clerk desde las variables de entorno
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

if (!PUBLISHABLE_KEY) {
  console.warn(
    "VITE_CLERK_PUBLISHABLE_KEY no está configurada. Clerk no funcionará correctamente."
  );
}

function App() {
  return (
    <ClerkProviderWrapper publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <UserInitializer />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Planning />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/inventory" element={<IngredientList />} />
                <Route path="/recipes" element={<RecipeList />} />
                <Route path="/shopping" element={<ShoppingList />} />
                <Route path="/cooking" element={<Cooking />} />
                <Route path="/recipe/new" element={<RecipeDetails />} />
                <Route path="/recipe/ai" element={<RecipeDetails />} />
                <Route path="/recipe/:id" element={<RecipeDetails />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </ClerkProviderWrapper>
  );
}

export default App;
