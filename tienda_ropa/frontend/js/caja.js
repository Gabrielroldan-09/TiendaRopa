// =============================================
// BOTÁNICA HERRERA — caja.js
// Control de caja diaria: apertura, egresos, cierre
// =============================================

// ==================== ESTADO ====================
let cajaActual = null;  // caja abierta (o null)

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
  cargarEstadoCaja();
  cargarHistorialCajas();
});

// ==================== CARGAR ESTADO DE CAJA ====================
async function cargarEstadoCaja() {
  try {
    const res = await CajaAPI.getEstado();
    cajaActual = res.data;
    renderEstado();
  } catch (err) {
    Toast.error('No se pudo obtener el estado de la caja. ¿El backend está corriendo?');
    renderSinConexion();
  }
}

// ==================== RENDERIZAR ESTADO ====================
function renderEstado() {
  const banner       = document.getElementById('caja-banner');
  const panelMain    = document.getElementById('caja-main');
  const panelAcciones = document.getElementById('caja-acciones');

  if (!cajaActual) {
    // === SIN CAJA ABIERTA → mostrar formulario de apertura ===
    banner.className = 'caja-estado-banner sin-caja';
    banner.innerHTML = `
      <div class="banner-left">
        <div class="banner-icon">🔒</div>
        <div class="banner-info">
          <div class="banner-titulo">Caja Cerrada</div>
          <div class="banner-subtitulo">Abrí la caja para comenzar a operar</div>
        </div>
      </div>`;

    panelMain.innerHTML = `
      <div class="apertura-form-card">
        <div class="apertura-form-header">
          <span>🔓 Abrir Caja</span>
        </div>
        <div class="apertura-form-body">
          <div class="form-group">
            <label class="form-label-custom" for="inputMontoInicial">Monto Inicial en Caja ($)</label>
            <input type="number" id="inputMontoInicial" class="form-control-custom"
              placeholder="Ej: 5000" min="0" step="0.01" value="0" />
          </div>
          <div class="form-group">
            <label class="form-label-custom" for="inputObsApertura">Observaciones (opcional)</label>
            <input type="text" id="inputObsApertura" class="form-control-custom"
              placeholder="Ej: Turno mañana, cambio contado..." maxlength="200" />
          </div>
          <button class="btn-primary-custom w-100" onclick="abrirCaja()" id="btnAbrirCaja" style="justify-content:center;">
            🔓 Abrir Caja
          </button>
        </div>
      </div>`;

    panelAcciones.innerHTML = `
      <div class="card-custom" style="text-align:center;padding:40px 20px;">
        <div style="font-size:40px;margin-bottom:12px;opacity:0.4;">💰</div>
        <p style="font-size:13px;color:var(--text-muted);">Abrí la caja para<br>ver el resumen y las acciones</p>
      </div>`;

  } else {
    // === CAJA ABIERTA → mostrar panel operativo ===
    const horaApertura = Format.datetime(cajaActual.apertura);

    banner.className = 'caja-estado-banner abierta';
    banner.innerHTML = `
      <div class="banner-left">
        <div class="banner-icon">✅</div>
        <div class="banner-info">
          <div class="banner-titulo">Caja Abierta</div>
          <div class="banner-subtitulo">Abierta desde ${horaApertura}</div>
        </div>
      </div>
      <div>
        <span class="badge-caja-abierta">● Operando</span>
      </div>`;

    renderPanelOperativo();
    renderPanelAcciones();
  }
}

// ==================== PANEL OPERATIVO (CAJA ABIERTA) ====================
function renderPanelOperativo() {
  const panelMain = document.getElementById('caja-main');

  const ventas  = cajaActual.ventas  || [];
  const egresos = cajaActual.egresos || [];

  // Combinar movimientos y ordenar cronológicamente
  const movimientos = [
    ...ventas.map(v => ({
      tipo:      'ingreso',
      concepto:  `Venta #${String(v.id).padStart(4,'0')} (${v.metodoPago})`,
      monto:     parseFloat(v.total),
      hora:      v.createdAt,
    })),
    ...egresos.map(e => ({
      tipo:      'egreso',
      concepto:  e.concepto,
      monto:     parseFloat(e.monto),
      hora:      e.createdAt,
    })),
  ].sort((a, b) => new Date(b.hora) - new Date(a.hora));

  panelMain.innerHTML = `
    <!-- Monto Inicial -->
    <div class="monto-display">
      <div class="md-label">Monto Inicial de Caja</div>
      <div class="md-value">${Format.price(cajaActual.montoInicial)}</div>
    </div>

    <!-- Formulario Egreso -->
    <div class="egreso-form">
      <div class="egreso-form-title">📤 Registrar Egreso Manual</div>
      <div style="display:grid;grid-template-columns:1fr 120px auto;gap:10px;align-items:end;">
        <div>
          <label class="form-label-custom" for="inputConcepto">Concepto</label>
          <input type="text" id="inputConcepto" class="form-control-custom"
            placeholder="Ej: Compra de bolsas" maxlength="200" />
        </div>
        <div>
          <label class="form-label-custom" for="inputMontoEgreso">Monto ($)</label>
          <input type="number" id="inputMontoEgreso" class="form-control-custom"
            placeholder="0.00" min="0.01" step="0.01" />
        </div>
        <button class="btn-primary-custom" onclick="registrarEgreso()" id="btnEgreso" style="height:41px;">
          + Agregar
        </button>
      </div>
    </div>

    <!-- Movimientos del día -->
    <div class="card-custom">
      <div class="card-title" style="margin-bottom:4px;">📋 Movimientos del Día</div>
      <div class="card-subtitle">Ingresos (ventas) y egresos manuales</div>
      <div class="movimientos-lista" id="movimientos-lista">
        ${movimientos.length === 0
          ? `<div class="empty-state" style="padding:30px 10px;">
               <div class="empty-icon">📋</div>
               <h3>Sin movimientos</h3>
               <p>Aún no hay ventas ni egresos registrados en esta caja</p>
             </div>`
          : movimientos.map(m => `
              <div class="movimiento-item">
                <div class="mov-left">
                  <div class="mov-dot ${m.tipo}"></div>
                  <div>
                    <div class="mov-concepto">${m.concepto}</div>
                    <div class="mov-hora">${Format.datetime(m.hora)}</div>
                  </div>
                </div>
                <div class="mov-monto ${m.tipo}">
                  ${m.tipo === 'egreso' ? '−' : '+'}${Format.price(m.monto)}
                </div>
              </div>
            `).join('')
        }
      </div>
    </div>`;
}

// ==================== PANEL DERECHO: RESUMEN + ACCIONES ====================
function renderPanelAcciones() {
  const panel = document.getElementById('caja-acciones');

  const ventas  = cajaActual.ventas  || [];
  const egresos = cajaActual.egresos || [];

  const montoInicial  = parseFloat(cajaActual.montoInicial);
  const totalVentas   = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
  const totalEgresos  = egresos.reduce((sum, e) => sum + parseFloat(e.monto), 0);
  const saldoActual   = montoInicial + totalVentas - totalEgresos;

  // Desglose por método de pago
  const porMetodo = ventas.reduce((acc, v) => {
    acc[v.metodoPago] = (acc[v.metodoPago] || 0) + parseFloat(v.total);
    return acc;
  }, {});

  panel.innerHTML = `
    <!-- Resumen numérico -->
    <div class="resumen-card">
      <div class="resumen-row">
        <span class="resumen-label">💵 Monto Inicial</span>
        <span class="resumen-valor neutro">${Format.price(montoInicial)}</span>
      </div>
      <div class="resumen-row">
        <span class="resumen-label">📈 Total Ventas (${ventas.length})</span>
        <span class="resumen-valor positivo">+${Format.price(totalVentas)}</span>
      </div>
      ${porMetodo.efectivo ? `
        <div class="resumen-row" style="padding-left:36px;">
          <span class="resumen-label" style="font-size:12px;">💵 Efectivo</span>
          <span class="resumen-valor positivo" style="font-size:13px;">${Format.price(porMetodo.efectivo)}</span>
        </div>` : ''}
      ${porMetodo.transferencia ? `
        <div class="resumen-row" style="padding-left:36px;">
          <span class="resumen-label" style="font-size:12px;">📲 Transferencia</span>
          <span class="resumen-valor positivo" style="font-size:13px;">${Format.price(porMetodo.transferencia)}</span>
        </div>` : ''}
      ${porMetodo.tarjeta ? `
        <div class="resumen-row" style="padding-left:36px;">
          <span class="resumen-label" style="font-size:12px;">💳 Tarjeta</span>
          <span class="resumen-valor positivo" style="font-size:13px;">${Format.price(porMetodo.tarjeta)}</span>
        </div>` : ''}
      <div class="resumen-row">
        <span class="resumen-label">📤 Total Egresos (${egresos.length})</span>
        <span class="resumen-valor negativo">−${Format.price(totalEgresos)}</span>
      </div>
      <div class="resumen-row destacado">
        <span class="resumen-label"><strong>💰 Saldo Actual</strong></span>
        <span class="resumen-valor total">${Format.price(saldoActual)}</span>
      </div>
    </div>

    <!-- Botón cerrar caja -->
    <button class="btn-cerrar-caja" onclick="confirmarCierreCaja()" id="btnCerrarCaja">
      🔒 Cerrar Caja
    </button>`;
}

function renderSinConexion() {
  const panelMain    = document.getElementById('caja-main');
  const panelAcciones = document.getElementById('caja-acciones');
  const banner       = document.getElementById('caja-banner');

  banner.className = 'caja-estado-banner sin-caja';
  banner.innerHTML = `
    <div class="banner-left">
      <div class="banner-icon">⚠️</div>
      <div class="banner-info">
        <div class="banner-titulo">Error de Conexión</div>
        <div class="banner-subtitulo">No se pudo conectar con el servidor</div>
      </div>
    </div>
    <button class="btn-primary-custom" onclick="cargarEstadoCaja()">🔄 Reintentar</button>`;

  panelMain.innerHTML = '';
  panelAcciones.innerHTML = '';
}

// ==================== ABRIR CAJA ====================
async function abrirCaja() {
  const btn = document.getElementById('btnAbrirCaja');
  const montoInicial = parseFloat(document.getElementById('inputMontoInicial').value) || 0;
  const observaciones = document.getElementById('inputObsApertura')?.value.trim() || '';

  btn.disabled = true;
  btn.textContent = '⏳ Abriendo...';

  try {
    await CajaAPI.abrir({ montoInicial, observaciones });
    Toast.success(`✅ Caja abierta con ${Format.price(montoInicial)} de monto inicial`);
    await cargarEstadoCaja();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔓 Abrir Caja';
  }
}

// ==================== REGISTRAR EGRESO ====================
async function registrarEgreso() {
  const concepto   = document.getElementById('inputConcepto').value.trim();
  const monto      = parseFloat(document.getElementById('inputMontoEgreso').value);
  const btn        = document.getElementById('btnEgreso');

  if (!concepto) { Toast.warning('Ingresá un concepto para el egreso'); return; }
  if (!monto || monto <= 0) { Toast.warning('Ingresá un monto válido'); return; }

  btn.disabled = true;
  btn.textContent = '⏳...';

  try {
    await CajaAPI.egreso({ concepto, monto });
    Toast.success(`📤 Egreso registrado: ${concepto} — ${Format.price(monto)}`);
    // Limpiar formulario
    document.getElementById('inputConcepto').value = '';
    document.getElementById('inputMontoEgreso').value = '';
    // Recargar estado
    await cargarEstadoCaja();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '+ Agregar';
  }
}

// ==================== CERRAR CAJA ====================
async function confirmarCierreCaja() {
  if (!cajaActual) return;

  const ventas  = cajaActual.ventas  || [];
  const egresos = cajaActual.egresos || [];
  const montoInicial = parseFloat(cajaActual.montoInicial);
  const totalVentas  = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
  const totalEgresos = egresos.reduce((sum, e) => sum + parseFloat(e.monto), 0);
  const saldoFinal   = montoInicial + totalVentas - totalEgresos;

  // Modal de confirmación con resumen
  document.getElementById('modal-cierre-content').innerHTML = `
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
      Estás a punto de cerrar la caja. Revisá el resumen antes de confirmar:
    </p>
    <div class="cierre-resumen">
      <div class="cierre-row">
        <span class="cr-label">💵 Monto Inicial</span>
        <span class="cr-val" style="color:var(--text-primary);">${Format.price(montoInicial)}</span>
      </div>
      <div class="cierre-row">
        <span class="cr-label">📈 Total Ventas (${ventas.length})</span>
        <span class="cr-val" style="color:#5ddf89;">+${Format.price(totalVentas)}</span>
      </div>
      <div class="cierre-row">
        <span class="cr-label">📤 Total Egresos (${egresos.length})</span>
        <span class="cr-val" style="color:#f87171;">−${Format.price(totalEgresos)}</span>
      </div>
      <div class="cierre-row total-final">
        <span class="cr-label"><strong>💰 Saldo Final</strong></span>
        <span class="cr-val">${Format.price(saldoFinal)}</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label-custom" for="inputObsCierre">Observaciones de Cierre (opcional)</label>
      <input type="text" id="inputObsCierre" class="form-control-custom"
        placeholder="Ej: Todo cuadra, dinero contado..." maxlength="200" />
    </div>`;

  document.getElementById('modalCierre').classList.add('show');
}

async function ejecutarCierre() {
  const btn = document.getElementById('btnConfirmarCierre');
  const observaciones = document.getElementById('inputObsCierre')?.value.trim() || '';

  btn.disabled = true;
  btn.textContent = '⏳ Cerrando...';

  try {
    const res = await CajaAPI.cerrar({ observaciones });
    const caja = res.data;

    cerrarModalCierre();
    Toast.success(`🔒 Caja cerrada. Saldo final: ${Format.price(caja.montoFinal)}`);

    cajaActual = null;
    renderEstado();
    await cargarHistorialCajas();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔒 Confirmar Cierre';
  }
}

function cerrarModalCierre() {
  document.getElementById('modalCierre').classList.remove('show');
}

// ==================== HISTORIAL DE CAJAS ====================
async function cargarHistorialCajas() {
  const container = document.getElementById('historial-cajas');
  container.innerHTML = `<div class="loader-wrapper"><div class="loader-ring"></div></div>`;

  try {
    const res = await CajaAPI.getHistorial(20);
    const cajas = res.data;

    if (!cajas.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding:30px 10px;">
          <div class="empty-icon">📋</div>
          <h3>Sin historial</h3>
          <p>No se encontraron registros de cajas anteriores</p>
        </div>`;
      return;
    }

    container.innerHTML = cajas.map((c, i) => {
      const esAbierta = c.estado === 'abierta';
      const mFinal    = c.montoFinal !== null ? Format.price(c.montoFinal) : '—';
      const numVentas = c._count?.ventas || 0;
      const numEgresos = c.egresos?.length || 0;

      return `
      <div class="historial-caja-item fade-in-up" style="animation-delay:${i * 0.05}s"
           onclick="verDetalleCaja(${c.id})">
        <div>
          <div class="hci-fecha">${Format.date(c.apertura)}</div>
          <div class="hci-hora">
            ${Format.datetime(c.apertura)}${c.cierre ? ` → ${Format.datetime(c.cierre)}` : ''}
          </div>
        </div>
        <div class="hci-stats">
          <div class="hci-stat">
            <div class="hci-stat-val" style="color:var(--text-primary);">${Format.price(c.montoInicial)}</div>
            <div class="hci-stat-label">Inicial</div>
          </div>
          <div class="hci-stat">
            <div class="hci-stat-val" style="color:#5ddf89;">${c.totalVentas !== null ? Format.price(c.totalVentas) : '—'}</div>
            <div class="hci-stat-label">Ventas (${numVentas})</div>
          </div>
          <div class="hci-stat">
            <div class="hci-stat-val" style="color:#f87171;">${c.totalEgresos !== null ? Format.price(c.totalEgresos) : '—'}</div>
            <div class="hci-stat-label">Egresos (${numEgresos})</div>
          </div>
          <div class="hci-stat">
            <div class="hci-stat-val" style="color:#5ddf89;">${mFinal}</div>
            <div class="hci-stat-label">Saldo Final</div>
          </div>
        </div>
        <span class="${esAbierta ? 'badge-caja-abierta' : 'badge-caja-cerrada'}">
          ${esAbierta ? '● Abierta' : '● Cerrada'}
        </span>
      </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state" style="padding:20px;">
        <p style="color:var(--text-muted);font-size:13px;">Error al cargar historial</p>
      </div>`;
  }
}

// ==================== VER DETALLE DE UNA CAJA ====================
async function verDetalleCaja(id) {
  try {
    const res = await CajaAPI.getById(id);
    const c   = res.data;

    const ventas  = c.ventas  || [];
    const egresos = c.egresos || [];

    document.getElementById('modal-detalle-caja-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;color:var(--text-muted);">CAJA</div>
          <div style="font-size:18px;font-weight:800;">#${String(c.id).padStart(4,'0')}</div>
        </div>
        <span class="${c.estado === 'abierta' ? 'badge-caja-abierta' : 'badge-caja-cerrada'}">
          ${c.estado === 'abierta' ? '● Abierta' : '● Cerrada'}
        </span>
      </div>

      <!-- Resumen -->
      <div class="cierre-resumen">
        <div class="cierre-row">
          <span class="cr-label">🕐 Apertura</span>
          <span class="cr-val" style="font-size:12px;color:var(--text-primary);">${Format.datetime(c.apertura)}</span>
        </div>
        ${c.cierre ? `
        <div class="cierre-row">
          <span class="cr-label">🕐 Cierre</span>
          <span class="cr-val" style="font-size:12px;color:var(--text-primary);">${Format.datetime(c.cierre)}</span>
        </div>` : ''}
        <div class="cierre-row">
          <span class="cr-label">💵 Monto Inicial</span>
          <span class="cr-val" style="color:var(--text-primary);">${Format.price(c.montoInicial)}</span>
        </div>
        <div class="cierre-row">
          <span class="cr-label">📈 Total Ventas (${ventas.length})</span>
          <span class="cr-val" style="color:#5ddf89;">+${Format.price(c.totalVentas || 0)}</span>
        </div>
        <div class="cierre-row">
          <span class="cr-label">📤 Total Egresos (${egresos.length})</span>
          <span class="cr-val" style="color:#f87171;">−${Format.price(c.totalEgresos || 0)}</span>
        </div>
        ${c.montoFinal !== null ? `
        <div class="cierre-row total-final">
          <span class="cr-label"><strong>💰 Saldo Final</strong></span>
          <span class="cr-val">${Format.price(c.montoFinal)}</span>
        </div>` : ''}
      </div>

      <!-- Ventas -->
      ${ventas.length > 0 ? `
      <div class="detalle-caja-section">
        <h4>📈 Ventas (${ventas.length})</h4>
        ${ventas.map(v => `
          <div class="movimiento-item">
            <div class="mov-left">
              <div class="mov-dot ingreso"></div>
              <div>
                <div class="mov-concepto">Venta #${String(v.id).padStart(4,'0')} — ${v.metodoPago}</div>
                <div class="mov-hora">${Format.datetime(v.createdAt)}</div>
              </div>
            </div>
            <div class="mov-monto ingreso">+${Format.price(v.total)}</div>
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Egresos -->
      ${egresos.length > 0 ? `
      <div class="detalle-caja-section">
        <h4>📤 Egresos (${egresos.length})</h4>
        ${egresos.map(e => `
          <div class="movimiento-item">
            <div class="mov-left">
              <div class="mov-dot egreso"></div>
              <div>
                <div class="mov-concepto">${e.concepto}</div>
                <div class="mov-hora">${Format.datetime(e.createdAt)}</div>
              </div>
            </div>
            <div class="mov-monto egreso">−${Format.price(e.monto)}</div>
          </div>
        `).join('')}
      </div>` : ''}

      ${c.observaciones ? `<p style="margin-top:12px;font-size:12px;color:var(--text-muted);">📝 ${c.observaciones}</p>` : ''}
    `;

    document.getElementById('modalDetalleCaja').classList.add('show');
  } catch (err) {
    Toast.error('No se pudo cargar el detalle de la caja');
  }
}

function cerrarModalDetalleCaja() {
  document.getElementById('modalDetalleCaja').classList.remove('show');
}

// ==================== EVENT LISTENERS GLOBALES ====================
document.addEventListener('click', e => {
  if (e.target.id === 'modalCierre') cerrarModalCierre();
  if (e.target.id === 'modalDetalleCaja') cerrarModalDetalleCaja();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    cerrarModalCierre();
    cerrarModalDetalleCaja();
  }
});
