require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes      = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes    = require('./routes/ventas.routes');
const cajaRoutes      = require('./routes/caja.routes');
const reportesRoutes  = require('./routes/reportes.routes');
const authMiddleware  = require('./middlewares/auth.middleware');

const app  = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARES ====================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir frontend estático ──
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Logger básico de requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==================== RUTAS ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🌿 Botánica Herrera API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ── RUTAS PÚBLICAS (sin autenticación) ──
app.use('/auth', authRoutes);

// ── RUTAS PROTEGIDAS (requieren JWT válido) ──
app.use('/productos', authMiddleware, productosRoutes);
app.use('/ventas',    authMiddleware, ventasRoutes);
app.use('/caja',      authMiddleware, cajaRoutes);
app.use('/reportes',  authMiddleware, reportesRoutes);

// ==================== MANEJO DE ERRORES ====================

// Para rutas GET desconocidas → servir login (SPA-like fallback)
app.get('*', (req, res) => {
  // Si es una ruta de API no encontrada, devolver JSON
  if (req.url.startsWith('/auth') || req.url.startsWith('/productos') ||
      req.url.startsWith('/ventas') || req.url.startsWith('/caja') ||
      req.url.startsWith('/reportes')) {
    return res.status(404).json({ success: false, message: `Ruta ${req.url} no encontrada` });
  }
  // Para el frontend, servir login.html
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'login.html'));
});

// Error handling global
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// ==================== INICIO DEL SERVIDOR ====================
app.listen(PORT, () => {
  console.log('\n🌿 ================================');
  console.log('   Botánica Herrera - Backend API');
  console.log('🌿 ================================');
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔐 Auth:      http://localhost:${PORT}/auth`);
  console.log(`📦 Productos: http://localhost:${PORT}/productos`);
  console.log(`🛒 Ventas:    http://localhost:${PORT}/ventas`);
  console.log(`💰 Caja:      http://localhost:${PORT}/caja`);
  console.log(`📊 Reportes:  http://localhost:${PORT}/reportes`);
  console.log('🌿 ================================\n');
});

module.exports = app;
