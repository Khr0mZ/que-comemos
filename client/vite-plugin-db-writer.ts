import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function dbWriterPlugin(): Plugin {
  return {
    name: 'db-writer',
    buildStart() {
      // Asegurarse de que el directorio db existe
      // Los archivos JSON se crean automáticamente en los directorios de usuario cuando se necesitan
      const dbDir = path.join(process.cwd(), 'src/db');
      
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
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
            const { userId, data: ingredients } = JSON.parse(body);
            if (!userId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'userId is required' }));
              return;
            }
            
            // Usar process.cwd() para obtener la raíz del proyecto
            const userDbDir = path.join(process.cwd(), 'src/db', userId);
            const filePath = path.join(userDbDir, 'ingredients.json');
            
            // Asegurarse de que el directorio existe
            if (!fs.existsSync(userDbDir)) {
              fs.mkdirSync(userDbDir, { recursive: true });
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
            const { userId, data: recipes } = JSON.parse(body);
            if (!userId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'userId is required' }));
              return;
            }
            
            // Usar process.cwd() para obtener la raíz del proyecto
            const userDbDir = path.join(process.cwd(), 'src/db', userId);
            const filePath = path.join(userDbDir, 'recipes.json');
            
            // Asegurarse de que el directorio existe
            if (!fs.existsSync(userDbDir)) {
              fs.mkdirSync(userDbDir, { recursive: true });
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

      server.middlewares.use('/api/save-shopping-list', async (req, res) => {
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
            const { userId, data: shoppingList } = JSON.parse(body);
            if (!userId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'userId is required' }));
              return;
            }
            
            // Usar process.cwd() para obtener la raíz del proyecto
            const userDbDir = path.join(process.cwd(), 'src/db', userId);
            const filePath = path.join(userDbDir, 'shopping-list.json');
            
            // Asegurarse de que el directorio existe
            if (!fs.existsSync(userDbDir)) {
              fs.mkdirSync(userDbDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, JSON.stringify(shoppingList, null, 2), 'utf-8');
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          });
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });

      server.middlewares.use('/api/load-shopping-list', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          const dbDir = path.join(process.cwd(), 'src/db');
          const filePath = path.join(dbDir, 'shopping-list.json');
          
          if (!fs.existsSync(filePath)) {
            const emptyShoppingList = {
              generalItems: [],
              recipeLists: [],
            };
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(emptyShoppingList));
            return;
          }
          
          const data = fs.readFileSync(filePath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(data);
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });

      server.middlewares.use('/api/save-week', async (req, res) => {
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
            const { userId, data: week } = JSON.parse(body);
            if (!userId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'userId is required' }));
              return;
            }
            
            // Usar process.cwd() para obtener la raíz del proyecto
            const userDbDir = path.join(process.cwd(), 'src/db', userId);
            const filePath = path.join(userDbDir, 'week.json');
            
            // Asegurarse de que el directorio existe
            if (!fs.existsSync(userDbDir)) {
              fs.mkdirSync(userDbDir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, JSON.stringify(week, null, 2), 'utf-8');
            
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

