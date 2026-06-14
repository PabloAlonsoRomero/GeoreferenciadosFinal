const express = require('express');
const router = express.Router();
const commentsService = require('../services/commentsService');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /comments/point/{pointId}:
 *   get:
 *     tags: [Comments]
 *     summary: Obtiene todos los comentarios asociados a un punto (Acceso público)
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de comentarios
 */
router.get('/point/:pointId', async (req, res, next) => {
  try {
    const comments = await commentsService.findByPoint(req.params.pointId);
    res.json(comments);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /comments:
 *   get:
 *     tags: [Comments]
 *     summary: Obtiene todos los comentarios registrados (Solo Administradores)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los comentarios
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const list = await commentsService.getAll();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /comments:
 *   post:
 *     tags: [Comments]
 *     summary: Agrega una nueva reseña/comentario (Requiere autenticación)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pointId:
 *                 type: string
 *               comment:
 *                 type: string
 *               rating:
 *                 type: number
 *     responses:
 *       201:
 *         description: Comentario creado
 *       401:
 *         description: No autorizado
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { userId, email } = req.user; // Obtenidos del token decodificado
    const newComment = await commentsService.create(userId, email, req.body);
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Modifica un comentario por ID (Requiere autenticación, solo autor)
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
 *               comment:
 *                 type: string
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Comentario modificado con éxito
 *       403:
 *         description: No es el autor del comentario
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const updatedComment = await commentsService.update(req.params.id, userId, req.body);
    res.json(updatedComment);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Elimina un comentario por ID (Requiere autenticación, solo autor)
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
 *         description: Comentario eliminado
 *       403:
 *         description: No es el autor del comentario
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    if (role === 'admin') {
      await commentsService.deleteForce(req.params.id);
    } else {
      await commentsService.delete(req.params.id, userId);
    }
    res.json({ message: 'Comentario eliminado con éxito' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
