const { validationResult } = require('express-validator');
const cajaService = require('../services/caja.service');

/**
 * CONTROLLER: Caja — pasa req.usuarioId al service
 */

const getEstado = async (req, res) => {
  try {
    const caja = await cajaService.getCajaAbierta(req.usuarioId);
    res.json({ success: true, data: caja });
  } catch (error) {
    console.error('[GET /caja]', error);
    res.status(500).json({ success: false, message: 'Error al obtener estado de caja' });
  }
};

const apertura = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const caja = await cajaService.abrirCaja(req.body, req.usuarioId);
    res.status(201).json({
      success: true,
      data:    caja,
      message: `Caja abierta con $${parseFloat(caja.montoInicial).toFixed(2)} de monto inicial`,
    });
  } catch (error) {
    console.error('[POST /caja/apertura]', error.message);
    const status = error.message.includes('ya existe') ? 409 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const egreso = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const mov = await cajaService.registrarEgreso(req.body, req.usuarioId);
    res.status(201).json({
      success: true,
      data:    mov,
      message: `Egreso registrado: ${mov.concepto} — $${parseFloat(mov.monto).toFixed(2)}`,
    });
  } catch (error) {
    console.error('[POST /caja/egreso]', error.message);
    const status = error.message.includes('No hay') ? 422 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const cierre = async (req, res) => {
  try {
    const caja = await cajaService.cerrarCaja(req.body, req.usuarioId);
    res.json({
      success: true,
      data:    caja,
      message: `Caja cerrada. Saldo final: $${parseFloat(caja.montoFinal).toFixed(2)}`,
    });
  } catch (error) {
    console.error('[POST /caja/cierre]', error.message);
    const status = error.message.includes('No hay') ? 422 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const historial = async (req, res) => {
  try {
    const { limit } = req.query;
    const cajas = await cajaService.getHistorial(limit, req.usuarioId);
    res.json({ success: true, data: cajas });
  } catch (error) {
    console.error('[GET /caja/historial]', error);
    res.status(500).json({ success: false, message: 'Error al obtener historial de cajas' });
  }
};

const getById = async (req, res) => {
  try {
    const caja = await cajaService.getById(req.params.id, req.usuarioId);
    if (!caja) return res.status(404).json({ success: false, message: 'Caja no encontrada' });
    res.json({ success: true, data: caja });
  } catch (error) {
    console.error('[GET /caja/:id]', error);
    res.status(500).json({ success: false, message: 'Error al obtener la caja' });
  }
};

module.exports = { getEstado, apertura, egreso, cierre, historial, getById };
