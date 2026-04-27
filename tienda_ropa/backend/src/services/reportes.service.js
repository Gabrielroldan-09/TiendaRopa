const prisma = require('../prisma/client');

/**
 * SERVICE: Reportes — filtrado por usuarioId para multi-tenancy
 */

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── KPIs ────────────────────────────────────────────────────────────────────
const getKPIs = async (periodo = 'hoy', usuarioId) => {
  let fechaDesde;
  const now = new Date();

  if (periodo === 'hoy')        fechaDesde = startOfDay(now);
  else if (periodo === '7dias') fechaDesde = daysAgo(6);
  else                          fechaDesde = daysAgo(29);

  const ventas = await prisma.venta.findMany({
    where: { usuarioId, createdAt: { gte: fechaDesde, lte: endOfDay(now) } },
    include: {
      detalles: {
        include: { producto: { select: { nombre: true, categoria: true } } },
      },
    },
  });

  const egresos = await prisma.egreso.findMany({
    where: {
      createdAt: { gte: fechaDesde, lte: endOfDay(now) },
      caja:      { usuarioId },
    },
  });

  const totalIngresos      = ventas.reduce((s, v) => s + parseFloat(v.total), 0);
  const totalEgresos       = egresos.reduce((s, e) => s + parseFloat(e.monto), 0);
  const ganancia           = totalIngresos - totalEgresos;
  const totalTransacciones = ventas.length;
  const ticketPromedio     = totalTransacciones ? totalIngresos / totalTransacciones : 0;
  const totalUnidades      = ventas.reduce(
    (s, v) => s + v.detalles.reduce((ss, d) => ss + d.cantidad, 0), 0
  );

  const porMetodoPago = ventas.reduce((acc, v) => {
    acc[v.metodoPago] = (acc[v.metodoPago] || 0) + parseFloat(v.total);
    return acc;
  }, {});

  const stockCritico  = await prisma.producto.count({ where: { usuarioId, activo: true, stock: { lte: 5 } } });
  const totalProductos = await prisma.producto.count({ where: { usuarioId, activo: true } });

  return {
    periodo, fechaDesde, fechaHasta: endOfDay(now),
    totalIngresos, totalEgresos, ganancia,
    totalTransacciones, ticketPromedio, totalUnidades,
    porMetodoPago, stockCritico, totalProductos,
  };
};

// ─── Evolución diaria ─────────────────────────────────────────────────────────
const getEvolucionDiaria = async (dias = 7, usuarioId) => {
  const fechaDesde = daysAgo(dias - 1);
  const now        = new Date();

  const ventas = await prisma.venta.findMany({
    where:   { usuarioId, createdAt: { gte: fechaDesde, lte: endOfDay(now) } },
    select:  { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const mapa = {};
  for (let i = dias - 1; i >= 0; i--) {
    const d   = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    mapa[key] = { fecha: key, total: 0, cantidad: 0 };
  }

  for (const v of ventas) {
    const key = new Date(v.createdAt).toISOString().slice(0, 10);
    if (mapa[key]) {
      mapa[key].total    += parseFloat(v.total);
      mapa[key].cantidad += 1;
    }
  }

  return Object.values(mapa);
};

// ─── Top Productos ────────────────────────────────────────────────────────────
const getTopProductos = async (periodo = '7dias', limit = 10, usuarioId) => {
  let fechaDesde;
  const now = new Date();

  if (periodo === 'hoy')        fechaDesde = startOfDay(now);
  else if (periodo === '7dias') fechaDesde = daysAgo(6);
  else                          fechaDesde = daysAgo(29);

  const detalles = await prisma.detalleVenta.findMany({
    where: { venta: { usuarioId, createdAt: { gte: fechaDesde, lte: endOfDay(now) } } },
    include: { producto: { select: { nombre: true, categoria: true, precio: true } } },
  });

  const grupos = {};
  for (const d of detalles) {
    const pid = d.productoId;
    if (!grupos[pid]) {
      grupos[pid] = {
        productoId: pid,
        nombre:     d.producto.nombre,
        categoria:  d.producto.categoria,
        precio:     parseFloat(d.producto.precio),
        unidades:   0,
        ingresos:   0,
      };
    }
    grupos[pid].unidades += d.cantidad;
    grupos[pid].ingresos += parseFloat(d.subtotal);
  }

  return Object.values(grupos)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, parseInt(limit));
};

// ─── Ventas por Categoría ─────────────────────────────────────────────────────
const getVentasPorCategoria = async (periodo = '7dias', usuarioId) => {
  let fechaDesde;
  const now = new Date();

  if (periodo === 'hoy')        fechaDesde = startOfDay(now);
  else if (periodo === '7dias') fechaDesde = daysAgo(6);
  else                          fechaDesde = daysAgo(29);

  const detalles = await prisma.detalleVenta.findMany({
    where:   { venta: { usuarioId, createdAt: { gte: fechaDesde, lte: endOfDay(now) } } },
    include: { producto: { select: { categoria: true } } },
  });

  const grupos = {};
  for (const d of detalles) {
    const cat = d.producto.categoria || 'Sin categoría';
    grupos[cat] = (grupos[cat] || 0) + parseFloat(d.subtotal);
  }

  return Object.entries(grupos)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);
};

// ─── Resumen de Cajas ─────────────────────────────────────────────────────────
const getResumenCajas = async (limit = 10, usuarioId) => {
  return await prisma.caja.findMany({
    where:   { estado: 'cerrada', usuarioId },
    include: {
      _count:  { select: { ventas: true, egresos: true } },
      egresos: { select: { monto: true } },
    },
    orderBy: { apertura: 'desc' },
    take:    parseInt(limit),
  });
};

module.exports = {
  getKPIs,
  getEvolucionDiaria,
  getTopProductos,
  getVentasPorCategoria,
  getResumenCajas,
};
