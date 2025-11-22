import { Router, type Request, type Response } from 'express';
import { readUserFile, writeUserFile } from '../utils/fileSystem.js';
import { notifyUserChange } from '../services/websocket.js';
import type { Recipe } from '../types/index.js';

const router = Router();

const FILENAME = 'recipes.json';

// GET /api/recipes - Obtener todas las recetas
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const recipes = readUserFile<Recipe[]>(userId, FILENAME) || [];
    res.json(recipes);
  } catch (error) {
    console.error('Error obteniendo recetas:', error);
    res.status(500).json({ error: 'Error obteniendo recetas' });
  }
});

// POST /api/recipes - Guardar recetas
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const recipes = req.body as Recipe[];
    
    if (!Array.isArray(recipes)) {
      res.status(400).json({ error: 'Las recetas deben ser un array' });
      return;
    }
    
    writeUserFile(userId, FILENAME, recipes);
    
    // Notificar a todos los clientes del usuario sobre el cambio
    notifyUserChange(userId, 'recipes');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando recetas:', error);
    res.status(500).json({ error: 'Error guardando recetas' });
  }
});

export default router;

