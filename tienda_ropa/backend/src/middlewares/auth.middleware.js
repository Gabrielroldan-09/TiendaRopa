const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'botanica-herrera-secret-key-2025';

/**
 * MIDDLEWARE: Auth
 * Verifica el token JWT y agrega usuarioId al request
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Agregar datos del usuario al request
    req.usuarioId     = payload.id;
    req.usuarioNombre = payload.nombre;
    req.usuarioEmail  = payload.email;

    next();
  } catch (error) {
    const msg = error.name === 'TokenExpiredError'
      ? 'Tu sesión expiró. Iniciá sesión nuevamente.'
      : 'Token inválido.';

    return res.status(401).json({ success: false, message: msg });
  }
};

module.exports = authMiddleware;
