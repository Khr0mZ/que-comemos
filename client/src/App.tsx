import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import UserInitializer from './components/UserInitializer';
import ClerkProviderWrapper from './components/ClerkProviderWrapper';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import ShoppingPage from './pages/ShoppingPage';
import CookingPage from './pages/CookingPage';
import WeekPage from './pages/WeekPage';
import AuthPage from './pages/AuthPage';
import { SnackbarProvider } from './components/CustomSnackbar';
import { theme } from './theme/theme';
import './i18n/config';

// Obtener la clave pública de Clerk desde las variables de entorno
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!PUBLISHABLE_KEY) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY no está configurada. Clerk no funcionará correctamente.');
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
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/shopping" element={<ShoppingPage />} />
                <Route path="/cooking" element={<CookingPage />} />
                <Route path="/week" element={<WeekPage />} />
                <Route path="/recipe/new" element={<RecipeDetailPage />} />
                <Route path="/recipe/ai" element={<RecipeDetailPage />} />
                <Route path="/recipe/:id" element={<RecipeDetailPage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </ClerkProviderWrapper>
  );
}

export default App;
