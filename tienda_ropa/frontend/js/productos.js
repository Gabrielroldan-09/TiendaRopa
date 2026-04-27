// =============================================
// URBAN THREADS — productos.js
// Lógica del CRUD completo de prendas
// =============================================

// Estado local del módulo
let productos = [];
let editingId = null;
let searchTimeout = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  configurarEventListeners();
});

function configurarEventListeners() {
  // Búsqueda en tiempo real (debounced)
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => cargarProductos(e.target.value), 400);
  });

  // Formulario de producto
  document.getElementById('formProducto').addEventListener('submit', handleSubmit);
}

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos(search = '') {
  showLoader('productos-body');

  try {
    const res = await ProductosAPI.getAll(search);
    productos = res.data;
    renderStats(productos);
    renderTabla(productos);
  } catch (err) {
    showEmptyState('productos-body', 'Error al cargar', err.message);
    Toast.error('No se pudieron cargar los productos. ¿El backend está corriendo?');
  }
}

// ==================== ESTADÍSTICAS ====================
function renderStats(data) {
  const total     = data.length;
  const sinStock  = data.filter(p => p.stock === 0).length;
  const stockBajo = data.filter(p => p.stock > 0 && p.stock < 5).length;
  const categorias = new Set(data.map(p => p.categoria)).size;

  document.getElementById('stat-total').textContent      = total;
  document.getElementById('stat-sin-stock').textContent  = sinStock;
  document.getElementById('stat-stock-bajo').textContent = stockBajo;
  document.getElementById('stat-categorias').textContent = categorias;
}

// ==================== RENDERIZAR TABLA ====================
function renderTabla(data) {
  const tbody = document.getElementById('productos-body');

  if (!data.length) {
    showEmptyState('productos-body', 'Sin prendas', 'No hay prendas registradas. ¡Agrega la primera!');
    return;
  }

  tbody.innerHTML = data.map((p, i) => `
    <tr class="fade-in-up" style="animation-delay: ${i * 0.04}s">
      <td>
        <span style="
          color: var(--text-muted);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        ">#${String(p.id).padStart(4,'0')}</span>
      </td>
      <td>
        <div style="font-weight: 600;">${p.nombre}</div>
      </td>
      <td>
        <span class="badge-custom badge-category">${p.categoria}</span>
      </td>
      <td class="text-price">${Format.price(p.precio)}</td>
      <td>${getStockBadge(p.stock)}</td>
      <td>
        <div class="flex-gap">
          <button class="btn-edit-custom"   onclick="abrirModalEditar(${p.id})">✏️ Editar</button>
          <button class="btn-danger-custom" onclick="eliminarProducto(${p.id}, '${p.nombre.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ==================== ABRIR MODAL NUEVO ====================
function abrirModalNuevo() {
  editingId = null;
  document.getElementById('modal-title').textContent  = '+ Nuevo Producto';
  document.getElementById('formProducto').reset();
  document.getElementById('productoId').value = '';
  document.getElementById('modal-submit-btn').textContent = 'Guardar Prenda';
  abrirModal();
}

// ==================== ABRIR MODAL EDITAR ====================
async function abrirModalEditar(id) {
  try {
    const res = await ProductosAPI.getById(id);
    const p   = res.data;
    editingId = id;

    document.getElementById('modal-title').textContent = '✏️ Editar Producto';
    document.getElementById('productoId').value         = p.id;
    document.getElementById('inputNombre').value        = p.nombre;
    document.getElementById('inputPrecio').value        = p.precio;
    document.getElementById('inputStock').value         = p.stock;
    document.getElementById('inputCategoria').value     = p.categoria;
    document.getElementById('modal-submit-btn').textContent = 'Guardar Cambios';

    abrirModal();
  } catch (err) {
    Toast.error('No se pudo cargar el producto');
  }
}

// ==================== SUBMIT FORMULARIO ====================
async function handleSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('modal-submit-btn');
  const data = {
    nombre:    document.getElementById('inputNombre').value.trim(),
    precio:    parseFloat(document.getElementById('inputPrecio').value),
    stock:     parseInt(document.getElementById('inputStock').value),
    categoria: document.getElementById('inputCategoria').value.trim(),
  };

  // Validaciones básicas
  if (!data.nombre || !data.categoria) {
    Toast.warning('Por favor completá todos los campos');
    return;
  }

  btn.disabled = true;
  btn.textContent = editingId ? 'Guardando...' : 'Creando...';

  try {
    if (editingId) {
      await ProductosAPI.update(editingId, data);
      Toast.success(`Producto "${data.nombre}" actualizado ✔`);
    } else {
      await ProductosAPI.create(data);
      Toast.success(`Prenda "${data.nombre}" creada exitosamente 👗`);
    }
    cerrarModal();
    cargarProductos(document.getElementById('searchInput').value);
  } catch (err) {
    Toast.error(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = editingId ? 'Guardar Cambios' : 'Guardar Prenda';
  }
}

// ==================== ELIMINAR ====================
async function eliminarProducto(id, nombre) {
  // Confirmación visual
  const confirmed = confirm(`¿Estás seguro de eliminar "${nombre}"?\n\nEsta acción es reversible desde la base de datos.`);
  if (!confirmed) return;

  try {
    await ProductosAPI.remove(id);
    Toast.success(`"${nombre}" eliminado correctamente`);
    cargarProductos(document.getElementById('searchInput').value);
  } catch (err) {
    Toast.error(err.message);
  }
}

// ==================== MODAL HELPERS ====================
function abrirModal() {
  document.getElementById('modalProducto').classList.add('show');
  setTimeout(() => document.getElementById('inputNombre').focus(), 200);
}

function cerrarModal() {
  document.getElementById('modalProducto').classList.remove('show');
  editingId = null;
}

// Cerrar al hacer click fuera del modal
document.addEventListener('click', (e) => {
  if (e.target.id === 'modalProducto') cerrarModal();
});

// Cerrar con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModal();
});
