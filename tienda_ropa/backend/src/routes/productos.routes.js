const { Router } = require('express');
const { body, param } = require('express-validator');
const productosController = require('../controllers/productos.controller');

const router = Router();

/**
 * ROUTES: Productos
 * Valida inputs con express-validator antes de llegar al controller
 */

// Reglas de validación reutilizables
const validacionesProducto = [
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 150 }).withMessage('El nombre no puede superar 150 caracteres'),
  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser un número positivo'),
  body('stock')
    .notEmpty().withMessage('El stock es obligatorio')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero >= 0'),
  body('categoria')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isLength({ max: 100 }).withMessage('La categoría no puede superar 100 caracteres'),
];

// GET /productos?search=...
router.get('/', productosController.getAll);

// GET /productos/:id
router.get('/:id', productosController.getById);

// POST /productos
router.post('/', validacionesProducto, productosController.create);

// PUT /productos/:id
router.put('/:id', validacionesProducto, productosController.update);

// DELETE /productos/:id
router.delete('/:id', productosController.remove);

module.exports = router;
