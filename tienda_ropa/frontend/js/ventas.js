// =============================================
// URBAN THREADS — ventas.js
// Sistema de carrito de ventas completo
// =============================================

// ==================== ESTADO ====================
let productos     = [];       // catálogo completo
let carrito       = [];       // items en el carrito
let categorias    = [];       // lista de categorías disponibles
let categoriaActiva = 'Todos';
let metodoPago    = 'efectivo';
let cargandoVenta = false;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  cargarResumenHoy();
  cargarHistorial();
});

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos() {
  try {
    const res = await ProductosAPI.getAll();
    productos = res.data;

    // Extraer categorías únicas
    categorias = ['Todos', ...new Set(productos.map(p => p.categoria))];

    renderCategoriaTabs();
    renderProductosGrid();
  } catch (err) {
    Toast.error('No se pudieron cargar los productos. ¿El backend está corriendo?');
  }
}

// ==================== TABS DE CATEGORÍA ====================
function renderCategoriaTabs() {
  const container = document.getElementById('categoria-tabs');
  container.innerHTML = categorias.map(cat => `
    <button
      class="tab-btn ${cat === categoriaActiva ? 'active' : ''}"
      onclick="filtrarCategoria('${cat.replace(/'/g, "\\'")}')"
    >${cat}</button>
  `).join('');
}

function filtrarCategoria(cat) {
  categoriaActiva = cat;
  renderCategoriaTabs();
  renderProductosGrid(document.getElementById('buscar-producto').value);
}

// ==================== GRID DE PRODUCTOS ====================
function renderProductosGrid(search = '') {
  const grid = document.getElementById('productos-grid');

  let filtrados = productos.filter(p => {
    const matchCat    = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const matchSearch = !search || p.nombre.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!filtrados.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;">
        <div class="empty-state" style="padding:40px 0;">
          <div class="empty-icon">👕</div>
          <h3>Sin productos</h3>
          <p>No hay productos que coincidan con la búsqueda</p>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = filtrados.map(p => {
    const sinStock = p.stock === 0;
    const stockBajo = p.stock > 0 && p.stock < 5;
    return `
    <div
      class="producto-card ${sinStock ? 'sin-stock' : ''}"
      id="pc-${p.id}"
      onclick="${sinStock ? '' : `agregarAlCarrito(${p.id})`}"
      title="${sinStock ? 'Sin stock disponible' : `Agregar ${p.nombre} al carrito`}"
    >
      <div class="pc-add-indicator">+</div>
      <div class="pc-categoria">${p.categoria}</div>
      <div class="pc-nombre">${p.nombre}</div>
      <div class="pc-precio">${Format.price(p.precio)}</div>
      <div class="pc-stock">
        ${sinStock
          ? '<span style="color:#f87171;">✕ Sin stock</span>'
          : stockBajo
            ? `<span style="color:#f59e0b;">⚠ Stock: ${p.stock}</span>`
            : `Stock: ${p.stock}`
        }
      </div>
    </div>`;
  }).join('');
}

// ==================== BÚSQUEDA DE PRODUCTOS ====================
let searchBuscarTimeout;
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('buscar-producto').addEventListener('input', e => {
    clearTimeout(searchBuscarTimeout);
    searchBuscarTimeout = setTimeout(() => renderProductosGrid(e.target.value), 250);
  });
});

// ==================== CARRITO: AGREGAR ====================
function agregarAlCarrito(productoId) {
  const producto = productos.find(p => p.id === productoId);
  if (!producto || producto.stock === 0) return;

  const itemExistente = carrito.find(i => i.productoId === productoId);

  if (itemExistente) {
    // Verificar que no supere el stock disponible
    if (itemExistente.cantidad >= producto.stock) {
      Toast.warning(`Stock máximo disponible: ${producto.stock} unidades`);
      return;
    }
    itemExistente.cantidad += 1;
    itemExistente.subtotal = itemExistente.cantidad * parseFloat(producto.precio);
  } else {
    carrito.push({
      productoId:  producto.id,
      nombre:      producto.nombre,
      precio:      parseFloat(producto.precio),
      cantidad:    1,
      subtotal:    parseFloat(producto.precio),
      stock:       producto.stock,
    });
  }

  // Animación visual en la tarjeta
  const card = document.getElementById(`pc-${productoId}`);
  if (card) {
    card.classList.add('added');
    setTimeout(() => card.classList.remove('added'), 500);
  }

  renderCarrito();
}

// ==================== CARRITO: MODIFICAR CANTIDAD ====================
function cambiarCantidad(productoId, delta) {
  const item = carrito.find(i => i.productoId === productoId);
  if (!item) return;

  const nuevaCantidad = item.cantidad + delta;

  if (nuevaCantidad <= 0) {
    quitarDelCarrito(productoId);
    return;
  }

  if (nuevaCantidad > item.stock) {
    Toast.warning(`Stock máximo: ${item.stock}`);
    return;
  }

  item.cantidad = nuevaCantidad;
  item.subtotal = nuevaCantidad * item.precio;

  renderCarrito();
}

// ==================== CARRITO: QUITAR ITEM ====================
function quitarDelCarrito(productoId) {
  carrito = carrito.filter(i => i.productoId !== productoId);
  renderCarrito();
}

// ==================== CARRITO: VACIAR ====================
function vaciarCarrito() {
  if (!carrito.length) return;
  if (!confirm('¿Vaciar todos los productos del carrito?')) return;
  carrito = [];
  renderCarrito();
}

// ==================== CARRITO: RENDER ====================
function renderCarrito() {
  const itemsContainer = document.getElementById('carrito-items');
  const countBadge     = document.getElementById('carrito-count');
  const totalDisplay   = document.getElementById('carrito-total');
  const btnConfirmar   = document.getElementById('btn-confirmar');

  const totalItems = carrito.reduce((sum, i) => sum + i.cantidad, 0);
  const totalMonto = carrito.reduce((sum, i) => sum + i.subtotal, 0);

  countBadge.textContent = totalItems;

  // Items
  if (!carrito.length) {
    itemsContainer.innerHTML = `
      <div class="carrito-empty">
        <div class="empty-icon">🛒</div>
        <p>El carrito está vacío.<br>Hacé click en un producto para agregar.</p>
      </div>`;
  } else {
    itemsContainer.innerHTML = carrito.map(item => `
      <div class="carrito-item">
        <div class="ci-info">
          <div class="ci-nombre" title="${item.nombre}">${item.nombre}</div>
          <div class="ci-precio">${Format.price(item.precio)} c/u</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn qty-minus" onclick="cambiarCantidad(${item.productoId}, -1)" title="Quitar uno">−</button>
          <span class="qty-value">${item.cantidad}</span>
          <button class="qty-btn" onclick="cambiarCantidad(${item.productoId}, +1)" title="Agregar uno">+</button>
        </div>
        <div class="ci-subtotal">${Format.price(item.subtotal)}</div>
        <button class="btn-remove-item" onclick="quitarDelCarrito(${item.productoId})" title="Quitar del carrito">✕</button>
      </div>
    `).join('');
  }

  // Total
  totalDisplay.textContent = Format.price(totalMonto);

  // Habilitar botón solo si hay items
  btnConfirmar.disabled = carrito.length === 0 || cargandoVenta;
}

// ==================== MÉTODO DE PAGO ====================
function seleccionarMetodoPago(metodo) {
  metodoPago = metodo;
  document.querySelectorAll('.mp-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.metodo === metodo);
  });
}

// ==================== CONFIRMAR VENTA ====================
async function confirmarVenta() {
  if (!carrito.length || cargandoVenta) return;

  cargandoVenta = true;
  const btn = document.getElementById('btn-confirmar');
  btn.disabled = true;
  btn.innerHTML = '<span style="font-size:16px;">⏳</span> Procesando...';

  try {
    // Verificar si hay caja abierta para vincular la venta
    let cajaId = null;
    try {
      const cajaRes = await CajaAPI.getEstado();
      if (cajaRes.data && cajaRes.data.id) {
        cajaId = cajaRes.data.id;
      }
    } catch (e) {
      // Si no se puede obtener estado de caja, se continúa sin cajaId
    }

    const payload = {
      items: carrito.map(i => ({
        productoId: i.productoId,
        cantidad:   i.cantidad,
      })),
      metodoPago,
      ...(cajaId && { cajaId }),
    };

    const res = await VentasAPI.registrar(payload);
    const venta = res.data;

    Toast.success(`✅ Venta #${venta.id} registrada por ${Format.price(venta.total)}`);

    // Limpiar carrito
    carrito = [];
    renderCarrito();

    // Actualizar catálogo de productos (para reflejar nuevo stock)
    await cargarProductos();

    // Refrescar historial y resumen
    await cargarHistorial();
    await cargarResumenHoy();

  } catch (err) {
    Toast.error(err.message);
  } finally {
    cargandoVenta = false;
    btn.disabled = false;
    btn.innerHTML = '✅ Confirmar Venta';
    renderCarrito();
  }
}

// ==================== RESUMEN DEL DÍA ====================
async function cargarResumenHoy() {
  try {
    const res = await VentasAPI.resumenHoy();
    const { totalVentas, totalMonto, porMetodoPago } = res.data;

    document.getElementById('stat-ventas-hoy').textContent   = totalVentas;
    document.getElementById('stat-monto-hoy').textContent    = Format.price(totalMonto);
    document.getElementById('stat-efectivo-hoy').textContent = Format.price(porMetodoPago.efectivo || 0);
    document.getElementById('stat-digital-hoy').textContent  = Format.price(
      (porMetodoPago.transferencia || 0) + (porMetodoPago.tarjeta || 0)
    );
  } catch (err) {
    // Silencioso si falla el resumen
  }
}

// ==================== HISTORIAL ====================
async function cargarHistorial(fecha = '') {
  const tbody = document.getElementById('historial-body');
  tbody.innerHTML = `<tr><td colspan="5"><div class="loader-wrapper"><div class="loader-ring"></div></div></td></tr>`;

  try {
    const res = await VentasAPI.getAll(fecha, 30);
    const ventas = res.data;

    if (!ventas.length) {
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state" style="padding:30px 0;">
            <div class="empty-icon">📋</div>
            <h3>Sin ventas</h3>
            <p>${fecha ? 'No hay ventas en esa fecha' : 'Aún no se registraron ventas hoy'}</p>
          </div>
        </td></tr>`;
      return;
    }

    const iconMetodo = { efectivo: '💵', transferencia: '📲', tarjeta: '💳' };

    tbody.innerHTML = ventas.map(v => `
      <tr>
        <td style="color:var(--text-muted);font-size:12px;">#${String(v.id).padStart(4,'0')}</td>
        <td style="font-size:12px;">${Format.datetime(v.createdAt)}</td>
        <td>
          <span class="metodo-badge metodo-${v.metodoPago}">
            ${iconMetodo[v.metodoPago] || ''} ${v.metodoPago}
          </span>
        </td>
        <td style="font-size:12px;color:var(--text-secondary);">
          ${v.detalles.length} producto${v.detalles.length !== 1 ? 's' : ''}
        </td>
        <td class="text-price">${Format.price(v.total)}</td>
        <td>
          <button class="btn-edit-custom" onclick="verDetalleVenta(${v.id})">
            🔍 Ver
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">Error al cargar historial</td></tr>`;
  }
}

// ==================== FILTRO HISTORIAL POR FECHA ====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filtro-fecha').addEventListener('change', e => {
    cargarHistorial(e.target.value);
  });
});

// ==================== MODAL DETALLE VENTA ====================
async function verDetalleVenta(id) {
  try {
    const res = await VentasAPI.getById(id);
    const v   = res.data;

    const iconMetodo = { efectivo: '💵', transferencia: '📲', tarjeta: '💳' };

    document.getElementById('modal-detalle-content').innerHTML = `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:11px;color:var(--text-muted);">VENTA</div>
          <div style="font-size:18px;font-weight:800;">#${String(v.id).padStart(4,'0')}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:var(--text-muted);">${Format.datetime(v.createdAt)}</div>
          <span class="metodo-badge metodo-${v.metodoPago}">${iconMetodo[v.metodoPago]} ${v.metodoPago}</span>
        </div>
      </div>

      <div style="background:var(--bg-body);border-radius:8px;padding:14px;margin-bottom:14px;">
        ${v.detalles.map(d => `
          <div class="detalle-venta-item">
            <div>
              <div class="dv-nombre">${d.producto.nombre}</div>
              <div class="dv-qty">${d.cantidad} × ${Format.price(d.precioUnit)}</div>
            </div>
            <div class="dv-precio">${Format.price(d.subtotal)}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border);">
        <span style="font-size:14px;font-weight:600;color:var(--text-secondary);">TOTAL</span>
        <span style="font-size:22px;font-weight:800;color:#5ddf89;">${Format.price(v.total)}</span>
      </div>

      ${v.observaciones ? `<p style="margin-top:12px;font-size:12px;color:var(--text-muted);">📝 ${v.observaciones}</p>` : ''}
    `;

    document.getElementById('modalDetalleVenta').classList.add('show');
  } catch (err) {
    Toast.error('No se pudo cargar el detalle de la venta');
  }
}

function cerrarModalDetalle() {
  document.getElementById('modalDetalleVenta').classList.remove('show');
}

document.addEventListener('click', e => {
  if (e.target.id === 'modalDetalleVenta') cerrarModalDetalle();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarModalDetalle();
});

// ==================== INICIALIZAR CARRITO ====================
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar método de pago por defecto
  seleccionarMetodoPago('efectivo');
  renderCarrito();
});
