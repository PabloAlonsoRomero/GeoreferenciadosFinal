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

// Configuración de CORS
app.use(cors());

// Middleware para entender JSON en las peticiones
app.use(express.json());

// Inyección de Rutas de la API
routerApi(app);

// Inyección de Swagger en /api-docs
setupSwagger(app);

// Middlewares para manejo unificado de errores
app.use(logErrors);
app.use(errorHandler);

// Cadena de conexión de MongoDB Atlas (Proporcionada en la materia)
// Conectamos a la base de datos "turismoBennito" para aislar los datos de este proyecto
const mongoURI = "MONGODB_URI_REMOVED_FROM_HISTORY";

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
