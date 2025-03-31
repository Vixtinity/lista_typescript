import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT: number = 3000;

// Definición de interfaces
interface Item {
  id: number;
  descripcion: string;
}

interface ListaItems {
  items: Item[];
}

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para obtener los items desde el archivo JSON
app.get('/items', (req: Request, res: Response) => {
  leerArchivoJson()
    .then(data => res.json(data))
    .catch(error => res.status(500).json({ error: 'Error al leer el archivo' }));
});

app.post('/items', async (req: Request, res: Response) => {
  const { descripcion } = req.body;
  if (!descripcion) {
    res.status(400).json({ error: 'Descripción del item es requerida' });
    return;
  }

  const nuevoItem: Item = { id: Date.now(), descripcion };

  try {
    const data = await leerArchivoJson();
    data.items.push(nuevoItem);
    await escribirArchivoJson(data);
    res.json(nuevoItem);
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar el item' });
  }
});

// Ruta para eliminar un item de la lista
app.delete('/items/:id', (req, res) => {
    const { id } = req.params;
  
    leerArchivoJson()
      .then(data => {
        const index = data.items.findIndex(item => item.id === parseInt(id));
        if (index === -1) {
          res.status(404).json({ error: 'Item no encontrado' });
          return Promise.reject();
        }
        data.items.splice(index, 1);
        // Escribe los cambios en el archivo
        return escribirArchivoJson(data);
      })
      .then(() => {
        // Después de escribir, envía la respuesta
        res.json({ message: 'Item eliminado' });
      })
      .catch(error => {
        // Maneja cualquier error que ocurra
        res.status(500).json({ error: 'Error al eliminar el item' });
      });
  });
  

// Función para leer el archivo JSON
function leerArchivoJson(): Promise<ListaItems> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, 'lista.json'), 'utf8', (err, data) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(data) as ListaItems);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Función para escribir en el archivo JSON
function escribirArchivoJson(data: ListaItems): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.join(__dirname, 'lista.json'), JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
