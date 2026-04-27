const { Router } = require('express');
const { body } = require('express-validator');
const ventasController = require('../controllers/ventas.controller');

const router = Router();

/**
 * ROUTES: Ventas
 */

// Validaciones para registrar una venta
const validacionesVenta = [
  body('items')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto en la venta'),
  body('items.*.productoId')
    .isInt({ min: 1 }).withMessage('Cada item debe tener un productoId válido'),
  body('items.*.cantidad')
    .isInt({ min: 1 }).withMessage('La cantidad de cada item debe ser al menos 1'),
  body('metodoPago')
    .notEmpty().withMessage('El método de pago es obligatorio')
    .isIn(['efectivo', 'transferencia', 'tarjeta'])
    .withMessage('Método de pago inválido. Use: efectivo, transferencia o tarjeta'),
];

// GET /ventas/resumen-hoy — ANTES de /:id para que no lo capture el param
router.get('/resumen-hoy', ventasController.getResumenHoy);

// GET /ventas
router.get('/', ventasController.getAll);

// GET /ventas/:id
router.get('/:id', ventasController.getById);

// POST /ventas
router.post('/', validacionesVenta, ventasController.registrar);

module.exports = router;
