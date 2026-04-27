const { Router } = require('express');
const reportesController = require('../controllers/reportes.controller');

const router = Router();

/**
 * ROUTES: Reportes
 * Todas las rutas son GET (solo lectura, no modifican datos)
 */

// GET /reportes/kpis?periodo=hoy|7dias|30dias
router.get('/kpis', reportesController.kpis);

// GET /reportes/evolucion?dias=7|30
router.get('/evolucion', reportesController.evolucion);

// GET /reportes/top-productos?periodo=7dias&limit=10
router.get('/top-productos', reportesController.topProductos);

// GET /reportes/categorias?periodo=7dias
router.get('/categorias', reportesController.categorias);

// GET /reportes/cajas?limit=10
router.get('/cajas', reportesController.resumenCajas);

module.exports = router;
