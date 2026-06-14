const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

class UsersService {
  async getAll() {
    // Para el panel de administración, devolvemos todos los usuarios
    return await User.find({});
  }

  async getById(id) {
    return await User.findOne({ _id: id });
  }

  async create(email, password, role = 'user') {
    if (!email) throw new Error('El correo electrónico es requerido');
    if (!password) throw new Error('La contraseña es requerida');

    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de correo electrónico inválido');
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado');
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      active: true
    });

    return await newUser.save();
  }

  async update(id, data) {
    const user = await User.findById(id);
    if (!user) throw new Error('Usuario no encontrado');

    if (data.email) {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Formato de correo electrónico inválido');
      }

      // Validar si el email ya está en uso por otro usuario
      const existingUser = await User.findOne({ email: data.email, _id: { $ne: id } });
      if (existingUser) {
        throw new Error('El correo electrónico ya está en uso');
      }
      user.email = data.email;
    }

    if (data.role) {
      if (!['user', 'admin'].includes(data.role)) {
        throw new Error('Rol de usuario inválido');
      }
      user.role = data.role;
    }

    if (data.active !== undefined) {
      user.active = data.active;
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(data.password, salt);
    }

    return await user.save();
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Correo electrónico y contraseña requeridos');
    }

    // Buscar por email (sin filtrar active aquí para dar mejor mensaje de error)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new Error('No existe una cuenta con ese correo electrónico');
    }

    // Verificar que el usuario no esté desactivado
    if (user.active === false) {
      throw new Error('Tu cuenta está desactivada. Contacta al administrador');
    }

    // Si no tiene active definido (usuarios anteriores), lo activamos automáticamente
    if (user.active === undefined || user.active === null) {
      await User.updateOne({ _id: user._id }, { $set: { active: true } });
    }

    // Comparar la contraseña ingresada con el hash guardado
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Contraseña incorrecta');
    }

    // Generar token JWT con vigencia de 24 horas, incluyendo email y rol
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    };
  }

  async delete(id) {
    // Borrado lógico: active se cambia a false
    return await User.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    );
  }
}

module.exports = new UsersService();
