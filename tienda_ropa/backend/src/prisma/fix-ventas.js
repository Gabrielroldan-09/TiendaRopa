/**
 * Script para vincular ventas huérfanas (sin cajaId) con la caja
 * que estaba abierta al momento de su creación.
 */
const prisma = require('./client');

async function fixVentasHuerfanas() {
  try {
    // 1. Obtener todas las ventas sin cajaId
    const ventasSinCaja = await prisma.venta.findMany({
      where: { cajaId: null },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`\n📋 Ventas sin cajaId: ${ventasSinCaja.length}`);

    if (ventasSinCaja.length === 0) {
      console.log('✅ No hay ventas huérfanas. Todo está vinculado correctamente.');
      return;
    }

    // 2. Obtener todas las cajas
    const cajas = await prisma.caja.findMany({
      orderBy: { apertura: 'asc' },
    });

    console.log(`📦 Cajas encontradas: ${cajas.length}`);

    let vinculadas = 0;

    for (const venta of ventasSinCaja) {
      // Buscar la caja que estaba abierta cuando se creó la venta
      const cajaCorrespondiente = cajas.find(c => {
        const ventaTime = new Date(venta.createdAt);
        const aperturaTime = new Date(c.apertura);
        const cierreTime = c.cierre ? new Date(c.cierre) : new Date(); // si está abierta, usar "ahora"

        return ventaTime >= aperturaTime && ventaTime <= cierreTime;
      });

      if (cajaCorrespondiente) {
        await prisma.venta.update({
          where: { id: venta.id },
          data: { cajaId: cajaCorrespondiente.id },
        });
        console.log(`  ✅ Venta #${venta.id} (${venta.createdAt}) → Caja #${cajaCorrespondiente.id}`);
        vinculadas++;
      } else {
        console.log(`  ⚠️ Venta #${venta.id} (${venta.createdAt}) → No se encontró caja abierta en ese momento`);
      }
    }

    console.log(`\n🎉 ${vinculadas} ventas vinculadas correctamente.\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixVentasHuerfanas();
