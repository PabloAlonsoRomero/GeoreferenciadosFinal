const express = require('express');
const router = express.Router();
const polygonsService = require('../services/polygonsService');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /polygons:
 *   get:
 *     tags: [Polygons]
 *     summary: Obtiene todas las zonas/polígonos activos (Acceso público)
 *     responses:
 *       200:
 *         description: Lista de polígonos
 */
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.all !== 'true') {
      filter.active = true;
    }
    const list = await polygonsService.find(filter);
    res.json(list);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /polygons/{id}:
 *   get:
 *     tags: [Polygons]
 *     summary: Obtiene una zona por ID (Acceso público)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la zona
 */
router.get('/:id', async (req, res, next) => {
  try {
    const polygon = await polygonsService.findById(req.params.id);
    res.json(polygon);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /polygons:
 *   post:
 *     tags: [Polygons]
 *     summary: Crea una nueva zona trazada en el mapa (Requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *     responses:
 *       201:
 *         description: Zona creada exitosamente
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const newPolygon = await polygonsService.create(req.body);
    res.status(201).json(newPolygon);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /polygons/{id}:
 *   patch:
 *     tags: [Polygons]
 *     summary: Actualiza una zona por ID (Requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *     responses:
 *       200:
 *         description: Zona actualizada exitosamente
 */
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedPolygon = await polygonsService.update(id, req.body);
    res.json(updatedPolygon);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /polygons/{id}:
 *   delete:
 *     tags: [Polygons]
 *     summary: Elimina una zona por ID (Requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zona eliminada (borrado lógico)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedPolygon = await polygonsService.delete(id);
    res.json({ message: 'Zona eliminada con éxito', data: deletedPolygon });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
