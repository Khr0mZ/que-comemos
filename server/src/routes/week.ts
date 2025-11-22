import { Router, type Request, type Response } from 'express';
import { readUserFile, writeUserFile } from '../utils/fileSystem.js';
import { notifyUserChange } from '../services/websocket.js';
import type { WeekData } from '../types/index.js';

const router = Router();

const FILENAME = 'week.json';

// GET /api/week - Obtener datos de la semana
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const week = readUserFile<WeekData>(userId, FILENAME);
    
    if (!week) {
      // Retornar estructura vacía si no existe
      const emptyWeek: WeekData = {
        monday: { lunch: [], dinner: [] },
        tuesday: { lunch: [], dinner: [] },
        wednesday: { lunch: [], dinner: [] },
        thursday: { lunch: [], dinner: [] },
        friday: { lunch: [], dinner: [] },
        saturday: { lunch: [], dinner: [] },
        sunday: { lunch: [], dinner: [] },
      };
      res.json(emptyWeek);
      return;
    }
    
    res.json(week);
  } catch (error) {
    console.error('Error obteniendo datos de la semana:', error);
    res.status(500).json({ error: 'Error obteniendo datos de la semana' });
  }
});

// POST /api/week - Guardar datos de la semana
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const week = req.body as WeekData;
    
    if (!week || typeof week !== 'object') {
      res.status(400).json({ error: 'Datos inválidos' });
      return;
    }
    
    writeUserFile(userId, FILENAME, week);
    
    // Notificar a todos los clientes del usuario sobre el cambio
    notifyUserChange(userId, 'week');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando datos de la semana:', error);
    res.status(500).json({ error: 'Error guardando datos de la semana' });
  }
});

export default router;

