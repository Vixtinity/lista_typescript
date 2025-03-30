import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT: number = 3000;

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Interfaces
interface Item {
  id: number;
  descripcion: string;
}

interface ListaItems {
  items: Item[];
}

// Función para leer el archivo JSON
function leerArchivoJson(): Promise<ListaItems> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(process.cwd(), 'lista.json'), 'utf8', (err, data) => {
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
    fs.writeFile(
      path.join(process.cwd(), 'lista.json'),
      JSON.stringify(data, null, 2),
      'utf8',
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

// Rutas
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'views', 'index.html'));
});

// Obtener items
app.get('/items', async (req: Request, res: Response) => {
  try {
    const data = await leerArchivoJson();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer el archivo' });
  }
});

// Agregar un nuevo item
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

// Eliminar un item
app.delete('/items/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    const data = await leerArchivoJson();
    const index = data.items.findIndex((item) => item.id === parseInt(id));
    if (index === -1) {
      res.status(404).json({ error: 'Item no encontrado' });
      return;
    }
    data.items.splice(index, 1);
    await escribirArchivoJson(data);
    res.json({ message: 'Item eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el item' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});