const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../prisma/client');

const JWT_SECRET  = process.env.JWT_SECRET  || 'botanica-herrera-secret-key-2025';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

/**
 * SERVICE: Auth
 * Registro, login y generación de tokens JWT
 */

/**
 * Registrar un nuevo usuario
 */
const registrar = async ({ nombre, email, password }) => {
  // Verificar que el email no exista
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw new Error('Ya existe una cuenta con ese email.');
  }

  // Hashear la contraseña
  const hash = await bcrypt.hash(password, 12);

  // Crear usuario
  const usuario = await prisma.usuario.create({
    data: {
      nombre: nombre.trim(),
      email:  email.toLowerCase().trim(),
      password: hash,
    },
    select: { id: true, nombre: true, email: true, createdAt: true },
  });

  // Generar token
  const token = generarToken(usuario);

  return { token, usuario };
};

/**
 * Login de usuario existente
 */
const login = async ({ email, password }) => {
  // Buscar usuario por email
  const usuario = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!usuario) {
    throw new Error('Email o contraseña incorrectos.');
  }

  // Verificar contraseña
  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido) {
    throw new Error('Email o contraseña incorrectos.');
  }

  // Generar token
  const token = generarToken(usuario);

  return {
    token,
    usuario: {
      id:     usuario.id,
      nombre: usuario.nombre,
      email:  usuario.email,
    },
  };
};

/**
 * Generar JWT con payload mínimo
 */
function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

module.exports = { registrar, login };
