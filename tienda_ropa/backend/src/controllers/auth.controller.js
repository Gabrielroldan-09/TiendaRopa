const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

/**
 * CONTROLLER: Auth
 */

/**
 * POST /auth/register
 */
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { nombre, email, password } = req.body;
    const result = await authService.registrar({ nombre, email, password });

    res.status(201).json({
      success: true,
      data:    result,
      message: `Bienvenido, ${result.usuario.nombre}! Tu cuenta fue creada exitosamente.`,
    });
  } catch (error) {
    console.error('[POST /auth/register]', error.message);
    const status = error.message.includes('Ya existe') ? 409 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data:    result,
      message: `Bienvenido de vuelta, ${result.usuario.nombre}!`,
    });
  } catch (error) {
    console.error('[POST /auth/login]', error.message);
    res.status(401).json({ success: false, message: error.message });
  }
};

/**
 * GET /auth/me
 * Devuelve los datos del usuario autenticado (requiere token)
 */
const me = async (req, res) => {
  res.json({
    success: true,
    data: {
      id:     req.usuarioId,
      nombre: req.usuarioNombre,
      email:  req.usuarioEmail,
    },
  });
};

module.exports = { register, login, me };
