import { Router, type Request, type Response } from 'express';
import { readUserFile, writeUserFile } from '../utils/fileSystem.js';
import { notifyUserChange } from '../services/websocket.js';
import type { Ingredient } from '../types/index.js';

const router = Router();

const FILENAME = 'ingredients.json';

// GET /api/ingredients - Obtener todos los ingredientes
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const ingredients = readUserFile<Ingredient[]>(userId, FILENAME) || [];
    res.json(ingredients);
  } catch (error) {
    console.error('Error obteniendo ingredientes:', error);
    res.status(500).json({ error: 'Error obteniendo ingredientes' });
  }
});

// POST /api/ingredients - Guardar ingredientes
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const ingredients = req.body as Ingredient[];
    
    if (!Array.isArray(ingredients)) {
      res.status(400).json({ error: 'Los ingredientes deben ser un array' });
      return;
    }
    
    writeUserFile(userId, FILENAME, ingredients);
    
    // Notificar a todos los clientes del usuario sobre el cambio
    notifyUserChange(userId, 'ingredients');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando ingredientes:', error);
    res.status(500).json({ error: 'Error guardando ingredientes' });
  }
});

export default router;

