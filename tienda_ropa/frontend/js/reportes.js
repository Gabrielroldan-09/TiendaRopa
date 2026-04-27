// =============================================
// BOTÁNICA HERRERA — reportes.js
// Módulo 4: Dashboard de Reportes & Estadísticas
// =============================================

// ─── Estado ─────────────────────────────────
let periodoActual = '7dias';
let chartEvolucion = null;
let chartMetodos   = null;
let chartCategorias = null;

// ─── Inicialización ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cargarTodo();
});

async function cargarTodo() {
  await Promise.all([
    cargarKPIs(),
    cargarEvolucion(),
    cargarTopProductos(),
    cargarCategorias(),
    cargarMetodosPago(),
  ]);
}

// ─── Selector de Período ─────────────────────
function cambiarPeriodo(periodo) {
  periodoActual = periodo;

  // Actualizar botones
  document.querySelectorAll('.periodo-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.periodo === periodo);
  });

  // Recargar todo con nuevo período
  cargarKPIs();
  cargarTopProductos();
  cargarCategorias();
  cargarMetodosPago();

  // Evolución usa su propio control de días
  const dias = periodo === 'hoy' ? 1 : periodo === '7dias' ? 7 : 30;
  cargarEvolucion(dias);
}

// ─── KPIs ────────────────────────────────────
async function cargarKPIs() {
  const grid = document.getElementById('kpi-grid');
  grid.innerHTML = Array(5).fill(0).map(() =>
    `<div class="kpi-card" style="height:120px"><div class="skeleton" style="height:100%;border-radius:12px;"></div></div>`
  ).join('');

  try {
    const res = await ReportesAPI.kpis(periodoActual);
    const d = res.data;

    const pctEfectivo      = d.totalIngresos ? ((d.porMetodoPago.efectivo || 0)      / d.totalIngresos * 100).toFixed(0) : 0;
    const pctTransferencia = d.totalIngresos ? ((d.porMetodoPago.transferencia || 0) / d.totalIngresos * 100).toFixed(0) : 0;

    grid.innerHTML = `
      <div class="kpi-card verde">
        <div class="kpi-header">
          <div class="kpi-icon">📈</div>
          <span class="kpi-badge positivo">Ingresos</span>
        </div>
        <div class="kpi-value">${Format.price(d.totalIngresos)}</div>
        <div class="kpi-label">Total de Ventas</div>
      </div>

      <div class="kpi-card rojo">
        <div class="kpi-header">
          <div class="kpi-icon">📤</div>
          <span class="kpi-badge negativo">Egresos</span>
        </div>
        <div class="kpi-value">${Format.price(d.totalEgresos)}</div>
        <div class="kpi-label">Total de Egresos</div>
      </div>

      <div class="kpi-card ${d.ganancia >= 0 ? 'verde' : 'rojo'}">
        <div class="kpi-header">
          <div class="kpi-icon">💰</div>
          <span class="kpi-badge ${d.ganancia >= 0 ? 'positivo' : 'negativo'}">
            ${d.ganancia >= 0 ? 'Positivo' : 'Negativo'}
          </span>
        </div>
        <div class="kpi-value">${Format.price(d.ganancia)}</div>
        <div class="kpi-label">Ganancia Neta</div>
      </div>

      <div class="kpi-card azul">
        <div class="kpi-header">
          <div class="kpi-icon">🛒</div>
          <span class="kpi-badge neutro">${d.totalTransacciones} ticket${d.totalTransacciones !== 1 ? 's' : ''}</span>
        </div>
        <div class="kpi-value">${Format.price(d.ticketPromedio)}</div>
        <div class="kpi-label">Ticket Promedio</div>
      </div>

      <div class="kpi-card ${d.stockCritico > 0 ? 'rojo' : 'dorado'}">
        <div class="kpi-header">
          <div class="kpi-icon">📦</div>
          <span class="kpi-badge ${d.stockCritico > 0 ? 'negativo' : 'positivo'}">
            ${d.totalProductos} activos
          </span>
        </div>
        <div class="kpi-value">${d.stockCritico}</div>
        <div class="kpi-label">Productos stock crítico</div>
      </div>
    `;
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p style="color:var(--text-muted);">Error al cargar KPIs</p></div>`;
  }
}

// ─── Gráfico de Evolución ─────────────────────
async function cargarEvolucion(dias) {
  if (dias === undefined) {
    dias = periodoActual === 'hoy' ? 1 : periodoActual === '7dias' ? 7 : 30;
  }

  const container = document.getElementById('chart-evolucion-container');
  container.innerHTML = `<div class="section-loader"><div class="loader-ring" style="width:24px;height:24px;border-width:2px;"></div> Cargando...</div>`;

  try {
    const res = await ReportesAPI.evolucion(dias);
    const data = res.data;

    container.innerHTML = `<canvas id="chartEvolucion"></canvas>`;

    if (chartEvolucion) { chartEvolucion.destroy(); chartEvolucion = null; }

    const labels  = data.map(d => formatFechaCorta(d.fecha));
    const totales = data.map(d => d.total);
    const maxVal  = Math.max(...totales, 1);

    const ctx = document.getElementById('chartEvolucion').getContext('2d');

    // Gradiente
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(45,125,70,0.35)');
    grad.addColorStop(1, 'rgba(45,125,70,0.00)');

    chartEvolucion = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ventas ($)',
          data: totales,
          borderColor: '#3da05a',
          backgroundColor: grad,
          borderWidth: 2.5,
          pointBackgroundColor: '#3da05a',
          pointRadius: dias <= 7 ? 5 : 3,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#20263a',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#f0f4f8',
            bodyColor: '#8a9ab5',
            padding: 12,
            callbacks: {
              label: ctx => ` $${ctx.parsed.y.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#5a6a85', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#5a6a85',
              font: { size: 11 },
              callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v),
            },
            beginAtZero: true,
            suggestedMax: maxVal * 1.2,
          },
        },
      },
    });
  } catch (err) {
    container.innerHTML = `<div class="section-loader">Error al cargar el gráfico</div>`;
  }
}

// ─── Gráfico Métodos de Pago ──────────────────
async function cargarMetodosPago() {
  const container = document.getElementById('metodos-container');
  container.innerHTML = `<div class="section-loader"><div class="loader-ring" style="width:24px;height:24px;border-width:2px;"></div></div>`;

  try {
    const res = await ReportesAPI.kpis(periodoActual);
    const d = res.data;

    const metodos = d.porMetodoPago;
    const total   = d.totalIngresos;

    // Mini donut chart
    const chartHtml = `
      <div style="margin-bottom:16px;">
        <canvas id="chartMetodos" style="max-height:180px;"></canvas>
      </div>
      <div class="metodos-grid">
        ${renderMetodoItem('💵', 'Efectivo',      metodos.efectivo      || 0, total)}
        ${renderMetodoItem('📲', 'Transferencia', metodos.transferencia || 0, total)}
        ${renderMetodoItem('💳', 'Tarjeta',       metodos.tarjeta       || 0, total)}
      </div>`;

    container.innerHTML = chartHtml;

    if (chartMetodos) { chartMetodos.destroy(); chartMetodos = null; }

    const ctx = document.getElementById('chartMetodos').getContext('2d');
    chartMetodos = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Efectivo', 'Transferencia', 'Tarjeta'],
        datasets: [{
          data: [
            metodos.efectivo || 0,
            metodos.transferencia || 0,
            metodos.tarjeta || 0,
          ],
          backgroundColor: ['#2d7d46', '#4cc9f0', '#f0a500'],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#20263a',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#f0f4f8',
            bodyColor: '#8a9ab5',
            callbacks: {
              label: ctx => ` $${ctx.parsed.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            },
          },
        },
      },
    });
  } catch (err) {
    container.innerHTML = `<div class="section-loader">Error al cargar</div>`;
  }
}

function renderMetodoItem(icon, label, monto, total) {
  const pct = total > 0 ? ((monto / total) * 100).toFixed(0) : 0;
  return `
    <div class="metodo-item">
      <div class="metodo-icon">${icon}</div>
      <div class="metodo-monto">${Format.price(monto)}</div>
      <div class="metodo-label">${label}</div>
      <div class="metodo-pct">${pct}%</div>
    </div>`;
}

// ─── Top Productos ────────────────────────────
async function cargarTopProductos() {
  const container = document.getElementById('ranking-container');
  container.innerHTML = `<div class="section-loader"><div class="loader-ring" style="width:24px;height:24px;border-width:2px;"></div></div>`;

  try {
    const res = await ReportesAPI.topProductos(periodoActual, 8);
    const productos = res.data;

    if (!productos.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding:30px 10px;">
          <div class="empty-icon">📦</div>
          <h3>Sin ventas</h3>
          <p>No hay ventas en este período</p>
        </div>`;
      return;
    }

    const maxUnidades = productos[0].unidades;

    container.innerHTML = `
      <div class="ranking-list">
        ${productos.map((p, i) => {
          const posClass = i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : 'other';
          const pct = maxUnidades ? (p.unidades / maxUnidades * 100).toFixed(0) : 0;
          return `
            <div class="ranking-item fade-in-up" style="animation-delay:${i * 0.04}s">
              <div class="ranking-pos ${posClass}">${i + 1}</div>
              <div class="ranking-info">
                <div class="ranking-nombre">${p.nombre}</div>
                <div class="ranking-cat">${p.categoria}</div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-fill" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="ranking-stats">
                <div class="ranking-unidades">${p.unidades} ud${p.unidades !== 1 ? 's' : ''}</div>
                <div class="ranking-ingresos">${Format.price(p.ingresos)}</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="section-loader">Error al cargar</div>`;
  }
}

// ─── Ventas por Categoría ─────────────────────
async function cargarCategorias() {
  const container = document.getElementById('chart-categorias-container');
  container.innerHTML = `<div class="section-loader"><div class="loader-ring" style="width:24px;height:24px;border-width:2px;"></div></div>`;

  try {
    const res = await ReportesAPI.categorias(periodoActual);
    const cats = res.data;

    if (!cats.length) {
      container.innerHTML = `<div class="section-loader" style="height:180px;">Sin datos en este período</div>`;
      return;
    }

    container.innerHTML = `<canvas id="chartCategorias"></canvas>`;

    if (chartCategorias) { chartCategorias.destroy(); chartCategorias = null; }

    const palette = [
      '#2d7d46','#4cc9f0','#f0a500','#7c3aed',
      '#e63946','#3da05a','#f4a261','#a78bfa',
    ];

    const ctx = document.getElementById('chartCategorias').getContext('2d');
    chartCategorias = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: cats.map(c => c.categoria),
        datasets: [{
          label: 'Ingresos ($)',
          data: cats.map(c => c.total),
          backgroundColor: cats.map((_, i) => palette[i % palette.length] + 'cc'),
          borderColor: cats.map((_, i) => palette[i % palette.length]),
          borderWidth: 1.5,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#20263a',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#f0f4f8',
            bodyColor: '#8a9ab5',
            callbacks: {
              label: ctx => ` $${ctx.parsed.y.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#5a6a85', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#5a6a85',
              font: { size: 11 },
              callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v),
            },
            beginAtZero: true,
          },
        },
      },
    });
  } catch (err) {
    container.innerHTML = `<div class="section-loader">Error al cargar</div>`;
  }
}

// ─── Helper: formatear fecha corta ───────────
function formatFechaCorta(isoDate) {
  const [y, m, d] = isoDate.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}
