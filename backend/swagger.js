const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de TurismoBennito',
    version: '1.0.0',
    description: `Documentación interactiva de la API para el Proyecto Final de Sistemas Georreferenciados.

**¿Cómo autenticarte?**
1. Usa \`POST /users/login\` para iniciar sesión (sin token requerido).
2. Copia el campo \`token\` de la respuesta.
3. Haz clic en el botón **Authorize 🔒** en la parte superior derecha.
4. Pega el token en el campo y haz clic en **Authorize**.
5. Ya puedes probar todos los endpoints protegidos.`
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local de desarrollo'
    }
  ],
  tags: [
    { name: 'Users', description: 'Gestión de cuentas de usuario y autenticación' },
    { name: 'Points', description: 'CRUD de puntos / ubicaciones turísticas' },
    { name: 'Comments', description: 'CRUD de reseñas y comentarios en puntos' },
    { name: 'Polygons', description: 'CRUD de zonas / polígonos turísticos' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Introduce tu token JWT obtenido del endpoint POST /users/login'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, './routes/*.js').replace(/\\/g, '/')]
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
}

module.exports = setupSwagger;
