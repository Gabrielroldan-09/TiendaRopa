const prisma = require('../prisma/client');

/**
 * SERVICE: Ventas — filtrado por usuarioId para multi-tenancy
 */

const registrarVenta = async ({ items, metodoPago, cajaId, observaciones, usuarioId }) => {
  return await prisma.$transaction(async (tx) => {
    let total = 0;
    const detalles = [];

    // 1 — Validar stock y calcular totales (solo productos del usuario)
    for (const item of items) {
      const producto = await tx.producto.findFirst({
        where: { id: item.productoId, usuarioId },
      });

      if (!producto) {
        throw new Error(`Producto ID ${item.productoId} no encontrado`);
      }
      if (!producto.activo) {
        throw new Error(`El producto "${producto.nombre}" no está disponible`);
      }
      if (producto.stock < item.cantidad) {
        throw new Error(
          `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, Solicitado: ${item.cantidad}`
        );
      }

      const subtotal = parseFloat(producto.precio) * item.cantidad;
      total += subtotal;

      detalles.push({
        productoId: producto.id,
        cantidad:   item.cantidad,
        precioUnit: producto.precio,
        subtotal:   subtotal,
      });
    }

    // 2 — Auto-detectar caja abierta del usuario
    let cajaIdFinal = cajaId ? parseInt(cajaId) : null;
    if (!cajaIdFinal) {
      const cajaAbierta = await tx.caja.findFirst({
        where: { estado: 'abierta', usuarioId },
      });
      if (cajaAbierta) cajaIdFinal = cajaAbierta.id;
    }

    // 3 — Crear la venta
    const venta = await tx.venta.create({
      data: {
        total:         total,
        metodoPago:    metodoPago,
        observaciones: observaciones || null,
        usuarioId:     usuarioId,
        ...(cajaIdFinal && { cajaId: cajaIdFinal }),
        detalles: {
          create: detalles.map(d => ({
            productoId: d.productoId,
            cantidad:   d.cantidad,
            precioUnit: d.precioUnit,
            subtotal:   d.subtotal,
          })),
        },
      },
      include: { detalles: { include: { producto: true } } },
    });

    // 4 — Descontar stock
    for (const item of items) {
      await tx.producto.update({
        where: { id: item.productoId },
        data:  { stock: { decrement: item.cantidad } },
      });
    }

    return venta;
  });
};

const getAll = async ({ fecha, limit = 50, usuarioId } = {}) => {
  const where = { usuarioId };

  if (fecha) {
    const start = new Date(fecha);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fecha);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  }

  return await prisma.venta.findMany({
    where,
    include: {
      detalles: {
        include: { producto: { select: { nombre: true, categoria: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take:    parseInt(limit),
  });
};

const getById = async (id, usuarioId) => {
  return await prisma.venta.findFirst({
    where: { id: Number(id), usuarioId },
    include: {
      detalles: {
        include: { producto: { select: { nombre: true, categoria: true } } },
      },
    },
  });
};

const getResumenHoy = async (usuarioId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const ventas = await prisma.venta.findMany({
    where: { usuarioId, createdAt: { gte: start, lte: end } },
  });

  const totalVentas   = ventas.length;
  const totalMonto    = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
  const porMetodoPago = ventas.reduce((acc, v) => {
    acc[v.metodoPago] = (acc[v.metodoPago] || 0) + parseFloat(v.total);
    return acc;
  }, {});

  return { totalVentas, totalMonto, porMetodoPago };
};

module.exports = { registrarVenta, getAll, getById, getResumenHoy };
