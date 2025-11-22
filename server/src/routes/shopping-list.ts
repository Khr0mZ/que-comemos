import { Router, type Request, type Response } from 'express';
import { readUserFile, writeUserFile } from '../utils/fileSystem.js';
import { notifyUserChange } from '../services/websocket.js';
import type { ShoppingListData } from '../types/index.js';

const router = Router();

const FILENAME = 'shopping-list.json';

// GET /api/shopping-list - Obtener lista de compra
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const shoppingList = readUserFile<ShoppingListData>(userId, FILENAME);
    
    if (!shoppingList) {
      // Retornar estructura vacía si no existe
      const emptyData: ShoppingListData = {
        generalItems: [],
        recipeLists: [],
      };
      res.json(emptyData);
      return;
    }
    
    res.json(shoppingList);
  } catch (error) {
    console.error('Error obteniendo lista de compra:', error);
    res.status(500).json({ error: 'Error obteniendo lista de compra' });
  }
});

// POST /api/shopping-list - Guardar lista de compra
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const shoppingList = req.body as ShoppingListData;
    
    if (!shoppingList || typeof shoppingList !== 'object') {
      res.status(400).json({ error: 'Datos inválidos' });
      return;
    }
    
    writeUserFile(userId, FILENAME, shoppingList);
    
    // Notificar a todos los clientes del usuario sobre el cambio
    notifyUserChange(userId, 'shopping-list');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando lista de compra:', error);
    res.status(500).json({ error: 'Error guardando lista de compra' });
  }
});

export default router;

