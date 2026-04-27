const { validationResult } = require('express-validator');
const ventasService = require('../services/ventas.service');

/**
 * CONTROLLER: Ventas — pasa req.usuarioId al service
 */

const registrar = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { items, metodoPago, cajaId, observaciones } = req.body;

    const venta = await ventasService.registrarVenta({
      items,
      metodoPago,
      cajaId,
      observaciones,
      usuarioId: req.usuarioId,
    });

    res.status(201).json({
      success: true,
      data:    venta,
      message: `Venta registrada por $${parseFloat(venta.total).toFixed(2)}`,
    });
  } catch (error) {
    console.error('[POST /ventas]', error.message);
    const status = error.message.includes('Stock insuficiente') ||
                   error.message.includes('no encontrado') ||
                   error.message.includes('no está disponible')
      ? 422 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { fecha, limit } = req.query;
    const ventas = await ventasService.getAll({ fecha, limit, usuarioId: req.usuarioId });
    res.json({ success: true, data: ventas });
  } catch (error) {
    console.error('[GET /ventas]', error);
    res.status(500).json({ success: false, message: 'Error al obtener ventas' });
  }
};

const getResumenHoy = async (req, res) => {
  try {
    const resumen = await ventasService.getResumenHoy(req.usuarioId);
    res.json({ success: true, data: resumen });
  } catch (error) {
    console.error('[GET /ventas/resumen-hoy]', error);
    res.status(500).json({ success: false, message: 'Error al obtener resumen' });
  }
};

const getById = async (req, res) => {
  try {
    const venta = await ventasService.getById(req.params.id, req.usuarioId);
    if (!venta) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    }
    res.json({ success: true, data: venta });
  } catch (error) {
    console.error('[GET /ventas/:id]', error);
    res.status(500).json({ success: false, message: 'Error al obtener la venta' });
  }
};

module.exports = { registrar, getAll, getResumenHoy, getById };
