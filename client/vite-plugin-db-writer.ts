import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function dbWriterPlugin(): Plugin {
  return {
    name: 'db-writer',
    buildStart() {
      // Asegurarse de que los archivos existan al iniciar
      const dbDir = path.join(process.cwd(), 'src/db');
      const ingredientsPath = path.join(dbDir, 'ingredients.json');
      const recipesPath = path.join(dbDir, 'recipes.json');

      // Crear directorio si no existe
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Crear ingredients.json si no existe
      if (!fs.existsSync(ingredientsPath)) {
        fs.writeFileSync(ingredientsPath, JSON.stringify([], null, 2), 'utf-8');
        console.log('Created ingredients.json with empty array');
      }

      // Crear recipes.json si no existe
      if (!fs.existsSync(recipesPath)) {
        fs.writeFileSync(recipesPath, JSON.stringify([], null, 2), 'utf-8');
        console.log('Created recipes.json with empty array');
      }
    },
    configureServer(server) {
      server.middlewares.use('/api/save-ingredients', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', () => {
            const ingredients = JSON.parse(body);
            // Usar process.cwd() para obtener la raíz del proyecto
            const dbDir = path.join(process.cwd(), 'src/db');
            const filePath = path.join(dbDir, 'ingredients.json');
            
            // Asegurarse de que el directorio existe
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, JSON.stringify(ingredients, null, 2), 'utf-8');
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          });
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });

      server.middlewares.use('/api/save-recipes', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', () => {
            const recipes = JSON.parse(body);
            // Usar process.cwd() para obtener la raíz del proyecto
            const dbDir = path.join(process.cwd(), 'src/db');
            const filePath = path.join(dbDir, 'recipes.json');
            
            // Asegurarse de que el directorio existe
            if (!fs.existsSync(dbDir)) {
              fs.mkdirSync(dbDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, JSON.stringify(recipes, null, 2), 'utf-8');
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          });
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });
    },
  };
}

