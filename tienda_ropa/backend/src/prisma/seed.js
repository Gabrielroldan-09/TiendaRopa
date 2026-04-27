const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de ejemplo...');

  // Limpiar datos previos
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.egreso.deleteMany();
  await prisma.caja.deleteMany();
  await prisma.producto.deleteMany();

  // ==================== PRODUCTOS DE EJEMPLO ====================
  const productos = [
    { nombre: 'Menta Fresca', precio: 150.00,  stock: 50,  categoria: 'Hierbas Frescas' },
    { nombre: 'Lavanda Seca', precio: 350.00,  stock: 30,  categoria: 'Hierbas Secas' },
    { nombre: 'Manzanilla a Granel', precio: 200.00, stock: 40, categoria: 'Hierbas Secas' },
    { nombre: 'Romero Fresco', precio: 120.00, stock: 25,  categoria: 'Hierbas Frescas' },
    { nombre: 'Tilo Medicinal', precio: 280.00, stock: 20, categoria: 'Medicinales' },
    { nombre: 'Cedrón', precio: 180.00, stock: 35,  categoria: 'Hierbas Frescas' },
    { nombre: 'Aceite Esencial Lavanda', precio: 1200.00, stock: 15, categoria: 'Aceites Esenciales' },
    { nombre: 'Aceite Esencial Eucalipto', precio: 950.00, stock: 12, categoria: 'Aceites Esenciales' },
    { nombre: 'Sahumerio Palo Santo', precio: 450.00, stock: 3, categoria: 'Sahumerios' },
    { nombre: 'Incienso Natural', precio: 320.00, stock: 8,  categoria: 'Sahumerios' },
    { nombre: 'Té Verde Orgánico', precio: 580.00, stock: 22, categoria: 'Infusiones' },
    { nombre: 'Yerba Mate Premium', precio: 750.00, stock: 18, categoria: 'Infusiones' },
    { nombre: 'Cúrcuma en Polvo', precio: 400.00, stock: 4,  categoria: 'Especias' },
    { nombre: 'Jengibre Deshidratado', precio: 360.00, stock: 28, categoria: 'Especias' },
    { nombre: 'Aloe Vera Natural', precio: 220.00, stock: 45, categoria: 'Plantas' },
  ];

  for (const p of productos) {
    await prisma.producto.create({ data: p });
  }

  console.log(`✅ ${productos.length} productos creados exitosamente`);
  console.log('🎉 Seed completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
