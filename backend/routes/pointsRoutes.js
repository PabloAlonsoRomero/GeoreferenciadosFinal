const express = require('express');
const router = express.Router();
const pointsService = require('../services/pointsService');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /points:
 *   get:
 *     tags: [Points]
 *     summary: Obtiene todas las ubicaciones/puntos activos (Acceso público)
 *     responses:
 *       200:
 *         description: Lista de puntos
 */
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.all !== 'true') {
      filter.active = true;
    }
    const points = await pointsService.find(filter);
    res.json(points);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /points/{id}:
 *   get:
 *     tags: [Points]
 *     summary: Obtiene una ubicación por ID (Acceso público)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la ubicación
 *       404:
 *         description: Ubicación no encontrada
 */
router.get('/:id', async (req, res, next) => {
  try {
    const point = await pointsService.findById(req.params.id);
    res.json(point);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /points:
 *   post:
 *     tags: [Points]
 *     summary: Crea un nuevo punto turístico (Requiere autenticación)
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
 *               description:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Punto creado con éxito
 *       401:
 *         description: No autorizado
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const newPoint = await pointsService.create(req.body);
    res.status(201).json(newPoint);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /points/{id}:
 *   patch:
 *     tags: [Points]
 *     summary: Actualiza una ubicación por ID (Requiere autenticación)
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
 *               description:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Punto actualizado con éxito
 *       401:
 *         description: No autorizado
 */
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedPoint = await pointsService.update(id, req.body);
    res.json(updatedPoint);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /points/{id}:
 *   delete:
 *     tags: [Points]
 *     summary: Elimina una ubicación por ID (Requiere autenticación)
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
 *         description: Ubicación eliminada correctamente (borrado lógico)
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedPoint = await pointsService.delete(id);
    res.json({ message: 'Ubicación eliminada correctamente', data: deletedPoint });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
