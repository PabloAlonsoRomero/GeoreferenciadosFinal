const usersRoutes = require('./usersRoutes');
const pointsRoutes = require('./pointsRoutes');
const commentsRoutes = require('./commentsRoutes');
const polygonsRoutes = require('./polygonsRoutes');

function routerApi(app) {
  app.use('/users', usersRoutes);
  app.use('/points', pointsRoutes);
  app.use('/comments', commentsRoutes);
  app.use('/polygons', polygonsRoutes);
}

module.exports = routerApi;
