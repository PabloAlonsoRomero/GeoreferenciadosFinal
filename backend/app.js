/**
 * app.js: Punto de entrada principal para el servidor de TurismoBennito.
 * Inicializa la conexión a MongoDB Atlas, configura middlewares y monta las rutas.
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const setupSwagger = require('./swagger');
const routerApi = require('./routes/rutas');
const { logErrors, errorHandler } = require('./middlewares/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS — permite peticiones desde localhost (dev) y Vercel (prod)
const allowedOrigins = [
  'http://localhost:4200',
  // ⚠️ Reemplaza esta URL con tu dominio de Vercel después de desplegar el frontend
  'https://turismo-bennito.vercel.app',
  process.env.FRONTEND_URL // permite configurarlo por variable de entorno en Render
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origen (Postman, Swagger local, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS no permitido para: ${origin}`));
    }
  },
  credentials: true
}));


// Middleware para entender JSON en las peticiones
app.use(express.json());

// Inyección de Rutas de la API
routerApi(app);

// Inyección de Swagger en /api-docs
setupSwagger(app);

// Middlewares para manejo unificado de errores
app.use(logErrors);
app.use(errorHandler);

// La URI de MongoDB se lee de la variable de entorno (configurada en Render)
// En desarrollo local, crea un archivo backend/.env con MONGO_URI=tu_cadena_de_conexion
const mongoURI = process.env.MONGO_URI || "MONGODB_URI_REMOVED_FROM_HISTORY";

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Conectado a MongoDB Atlas con éxito.');
    
    // Eliminar el índice único antiguo de 'username' para evitar errores de clave duplicada
    mongoose.connection.db.collection('users').dropIndex('username_1')
      .then(() => console.log('Índice antiguo "username_1" eliminado con éxito.'))
      .catch(err => {
        // Ignorar el error si el índice ya no existe
        if (err.codeName !== 'IndexNotFound' && err.message !== 'index not found with name [username_1]') {
          console.log('Índice "username_1" no requirió eliminación (ya removido o no existente).');
        }
      });

    app.listen(port, () => {
      console.log(`Servidor Express corriendo en el puerto: ${port}`);
      console.log(`Documentación de Swagger disponible en: http://localhost:${port}/api-docs`);
    });
  })
  .catch(err => {
    console.error('Error al conectar con MongoDB Atlas:', err);
  });
