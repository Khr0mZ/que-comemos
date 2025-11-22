import { Router, type Request, type Response } from "express";
import { getUserDataTimestamps } from "../utils/fileSystem.js";

const router = Router();

// GET /api/sync - Obtener timestamps de última modificación de todos los archivos
router.get("/", (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const timestamps = getUserDataTimestamps(userId);
    res.json(timestamps);
  } catch (error) {
    console.error("Error obteniendo timestamps:", error);
    res.status(500).json({ error: "Error obteniendo timestamps" });
  }
});

export default router;
