const prisma = require('../prisma/client');

/**
 * SERVICE: Productos — filtrado por usuarioId para multi-tenancy
 */

const getAll = async (search = '', usuarioId) => {
  const where = {
    activo:    true,
    usuarioId: usuarioId,
    ...(search && {
      nombre: { contains: search },
    }),
  };
  return await prisma.producto.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });
};

const getById = async (id, usuarioId) => {
  return await prisma.producto.findFirst({
    where: { id: Number(id), usuarioId },
  });
};

const create = async ({ nombre, precio, stock, categoria }, usuarioId) => {
  return await prisma.producto.create({
    data: {
      nombre:    nombre.trim(),
      precio:    parseFloat(precio),
      stock:     parseInt(stock),
      categoria: categoria.trim(),
      usuarioId: usuarioId,
    },
  });
};

const update = async (id, { nombre, precio, stock, categoria }, usuarioId) => {
  return await prisma.producto.update({
    where: { id: Number(id) },
    data: {
      ...(nombre    !== undefined && { nombre:    nombre.trim() }),
      ...(precio    !== undefined && { precio:    parseFloat(precio) }),
      ...(stock     !== undefined && { stock:     parseInt(stock) }),
      ...(categoria !== undefined && { categoria: categoria.trim() }),
    },
  });
};

const remove = async (id, usuarioId) => {
  return await prisma.producto.update({
    where: { id: Number(id) },
    data:  { activo: false },
  });
};

module.exports = { getAll, getById, create, update, remove };
