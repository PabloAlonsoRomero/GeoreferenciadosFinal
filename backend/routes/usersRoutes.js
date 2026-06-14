const express = require('express');
const router = express.Router();
const usersService = require('../services/usersService');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /users/register:
 *   post:
 *     tags: [Users]
 *     summary: Registra un nuevo usuario común (rol 'user')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@correo.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error en la solicitud (ej. formato inválido o email duplicado)
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Por defecto al registrarse libremente, el rol es 'user'
    const newUser = await usersService.create(email, password, 'user');
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags: [Users]
 *     summary: Inicia sesión usando correo y obtiene un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@correo.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login exitoso, retorna el token y datos del usuario
 *       400:
 *         description: Credenciales incorrectas
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const loginResult = await usersService.login(email, password);
    res.json(loginResult);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Obtiene todos los usuarios registrados (Solo Administradores)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere admin)
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const list = await usersService.getAll();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Crea un usuario con cualquier rol (Solo Administradores)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       403:
 *         description: Acceso denegado
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const newUser = await usersService.create(email, password, role);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Modifica los datos de un usuario (Solo Administradores)
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               active:
 *                 type: boolean
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario modificado exitosamente
 */
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const updatedUser = await usersService.update(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Elimina/desactiva un usuario (Solo Administradores)
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
 *         description: Usuario desactivado exitosamente
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const deletedUser = await usersService.delete(req.params.id);
    res.json({ message: 'Usuario desactivado exitosamente', data: deletedUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
