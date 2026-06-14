const jwt = require('jsonwebtoken');

// Clave secreta estática para JWT (apropiada para desarrollo escolar)
const JWT_SECRET = 'bennito-secret-token-key-lasalle-2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación. Inicie sesión.' });
  }

  const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: 'Formato de token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adjunta los datos decodificados del usuario a la request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Sesión inválida o expirada. Por favor, vuelva a iniciar sesión.' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Administrador.' });
  }
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
