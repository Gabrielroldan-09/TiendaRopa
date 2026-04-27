const { Router } = require('express');
const { body } = require('express-validator');
const cajaController = require('../controllers/caja.controller');

const router = Router();

/**
 * ROUTES: Caja
 */

// GET /caja — estado actual
router.get('/', cajaController.getEstado);

// GET /caja/historial — historial de cajas
router.get('/historial', cajaController.historial);

// GET /caja/:id — detalle de una caja
router.get('/:id', cajaController.getById);

// POST /caja/apertura — abrir caja
router.post('/apertura', [
  body('montoInicial')
    .notEmpty().withMessage('El monto inicial es obligatorio')
    .isFloat({ min: 0 }).withMessage('El monto inicial debe ser un número >= 0'),
], cajaController.apertura);

// POST /caja/egreso — registrar egreso
router.post('/egreso', [
  body('concepto')
    .notEmpty().withMessage('El concepto del egreso es obligatorio')
    .isLength({ max: 200 }).withMessage('El concepto no puede superar 200 caracteres'),
  body('monto')
    .notEmpty().withMessage('El monto es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
], cajaController.egreso);

// POST /caja/cierre — cerrar caja
router.post('/cierre', cajaController.cierre);

module.exports = router;
