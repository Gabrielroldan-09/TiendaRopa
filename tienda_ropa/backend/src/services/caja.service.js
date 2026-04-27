const prisma = require('../prisma/client');

/**
 * SERVICE: Caja — filtrado por usuarioId para multi-tenancy
 */

const getCajaAbierta = async (usuarioId) => {
  return await prisma.caja.findFirst({
    where: { estado: 'abierta', usuarioId },
    include: {
      egresos: { orderBy: { createdAt: 'desc' } },
      ventas:  { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { apertura: 'desc' },
  });
};

const abrirCaja = async ({ montoInicial, observaciones }, usuarioId) => {
  const cajaExistente = await prisma.caja.findFirst({
    where: { estado: 'abierta', usuarioId },
  });

  if (cajaExistente) {
    throw new Error('Ya existe una caja abierta. Cerrá la caja actual antes de abrir una nueva.');
  }

  return await prisma.caja.create({
    data: {
      montoInicial:  parseFloat(montoInicial),
      estado:        'abierta',
      observaciones: observaciones || null,
      usuarioId:     usuarioId,
    },
  });
};

const registrarEgreso = async ({ concepto, monto }, usuarioId) => {
  const caja = await prisma.caja.findFirst({
    where: { estado: 'abierta', usuarioId },
  });
  if (!caja) throw new Error('No hay una caja abierta. Abrí la caja primero.');

  return await prisma.egreso.create({
    data: {
      concepto: concepto.trim(),
      monto:    parseFloat(monto),
      cajaId:   caja.id,
    },
  });
};

const cerrarCaja = async ({ observaciones } = {}, usuarioId) => {
  const caja = await prisma.caja.findFirst({
    where:   { estado: 'abierta', usuarioId },
    include: { ventas: true, egresos: true },
  });

  if (!caja) throw new Error('No hay una caja abierta para cerrar.');

  const totalVentas  = caja.ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
  const totalEgresos = caja.egresos.reduce((sum, e) => sum + parseFloat(e.monto), 0);
  const montoFinal   = parseFloat(caja.montoInicial) + totalVentas - totalEgresos;

  return await prisma.caja.update({
    where: { id: caja.id },
    data:  {
      estado:        'cerrada',
      cierre:        new Date(),
      totalVentas:   totalVentas,
      totalEgresos:  totalEgresos,
      montoFinal:    montoFinal,
      observaciones: observaciones || caja.observaciones,
    },
    include: {
      ventas:  { include: { detalles: true } },
      egresos: true,
    },
  });
};

const getHistorial = async (limit = 20, usuarioId) => {
  return await prisma.caja.findMany({
    where:   { usuarioId },
    include: {
      egresos: { orderBy: { createdAt: 'asc' } },
      _count:  { select: { ventas: true } },
    },
    orderBy: { apertura: 'desc' },
    take:    parseInt(limit),
  });
};

const getById = async (id, usuarioId) => {
  return await prisma.caja.findFirst({
    where: { id: Number(id), usuarioId },
    include: {
      ventas:  {
        include: { detalles: { include: { producto: { select: { nombre: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
      egresos: { orderBy: { createdAt: 'asc' } },
    },
  });
};

module.exports = { getCajaAbierta, abrirCaja, registrarEgreso, cerrarCaja, getHistorial, getById };
