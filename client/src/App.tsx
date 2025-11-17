import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import { SnackbarProvider } from './components/CustomSnackbar';
import { theme } from './theme/theme';
import './i18n/config';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipe/new" element={<RecipeDetailPage />} />
              <Route path="/recipe/ai" element={<RecipeDetailPage />} />
              <Route path="/recipe/:id" element={<RecipeDetailPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
