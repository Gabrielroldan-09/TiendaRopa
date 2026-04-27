const { validationResult } = require('express-validator');
const productosService = require('../services/productos.service');

/**
 * CONTROLLER: Productos — pasa req.usuarioId al service
 */

const getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const productos = await productosService.getAll(search, req.usuarioId);
    res.json({ success: true, data: productos });
  } catch (error) {
    console.error('[GET /productos]', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
};

const getById = async (req, res) => {
  try {
    const producto = await productosService.getById(req.params.id, req.usuarioId);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.json({ success: true, data: producto });
  } catch (error) {
    console.error('[GET /productos/:id]', error);
    res.status(500).json({ success: false, message: 'Error al obtener el producto' });
  }
};

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const producto = await productosService.create(req.body, req.usuarioId);
    res.status(201).json({ success: true, data: producto, message: 'Producto creado exitosamente' });
  } catch (error) {
    console.error('[POST /productos]', error);
    res.status(500).json({ success: false, message: 'Error al crear el producto' });
  }
};

const update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const existe = await productosService.getById(req.params.id, req.usuarioId);
    if (!existe) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const producto = await productosService.update(req.params.id, req.body, req.usuarioId);
    res.json({ success: true, data: producto, message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('[PUT /productos/:id]', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el producto' });
  }
};

const remove = async (req, res) => {
  try {
    const existe = await productosService.getById(req.params.id, req.usuarioId);
    if (!existe) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    await productosService.remove(req.params.id, req.usuarioId);
    res.json({ success: true, message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('[DELETE /productos/:id]', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el producto' });
  }
};

module.exports = { getAll, getById, create, update, remove };
