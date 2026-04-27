const reportesService = require('../services/reportes.service');

/**
 * CONTROLLER: Reportes — pasa req.usuarioId al service
 */

const kpis = async (req, res) => {
  try {
    const { periodo = 'hoy' } = req.query;
    const datos = await reportesService.getKPIs(periodo, req.usuarioId);
    res.json({ success: true, data: datos });
  } catch (error) {
    console.error('[GET /reportes/kpis]', error);
    res.status(500).json({ success: false, message: 'Error al obtener KPIs' });
  }
};

const evolucion = async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const datos = await reportesService.getEvolucionDiaria(dias, req.usuarioId);
    res.json({ success: true, data: datos });
  } catch (error) {
    console.error('[GET /reportes/evolucion]', error);
    res.status(500).json({ success: false, message: 'Error al obtener evolución diaria' });
  }
};

const topProductos = async (req, res) => {
  try {
    const { periodo = '7dias', limit = 10 } = req.query;
    const datos = await reportesService.getTopProductos(periodo, limit, req.usuarioId);
    res.json({ success: true, data: datos });
  } catch (error) {
    console.error('[GET /reportes/top-productos]', error);
    res.status(500).json({ success: false, message: 'Error al obtener top productos' });
  }
};

const categorias = async (req, res) => {
  try {
    const { periodo = '7dias' } = req.query;
    const datos = await reportesService.getVentasPorCategoria(periodo, req.usuarioId);
    res.json({ success: true, data: datos });
  } catch (error) {
    console.error('[GET /reportes/categorias]', error);
    res.status(500).json({ success: false, message: 'Error al obtener ventas por categoría' });
  }
};

const resumenCajas = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const datos = await reportesService.getResumenCajas(limit, req.usuarioId);
    res.json({ success: true, data: datos });
  } catch (error) {
    console.error('[GET /reportes/cajas]', error);
    res.status(500).json({ success: false, message: 'Error al obtener resumen de cajas' });
  }
};

module.exports = { kpis, evolucion, topProductos, categorias, resumenCajas };
