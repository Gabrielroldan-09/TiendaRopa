// =============================================
// URBAN THREADS — UI Utilities
// Toast, modals, loaders, formatters
// =============================================

// ---- Toast Notifications ----
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'toast-container-custom';
      document.body.appendChild(this._container);
    }
    return this._container;
  },

  show(message, type = 'success', duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = this._getContainer();

    const toast = document.createElement('div');
    toast.className = `toast-custom ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.success}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error', 5000),
  warning: (msg) => Toast.show(msg, 'warning'),
};

// ---- Formatters ----
const Format = {
  price: (value) => {
    const num = parseFloat(value);
    return Number.isNaN(num)
      ? '$0,00'
      : `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  date: (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  },

  datetime: (dateStr) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },
};

// ---- Stock Badge ----
function getStockBadge(stock) {
  if (stock === 0) return `<span class="badge-custom badge-danger">Sin stock</span>`;
  if (stock < 5)  return `<span class="badge-custom badge-warning">⚠ Bajo (${stock})</span>`;
  return `<span class="badge-custom badge-success">${stock}</span>`;
}

// ---- Loading State ----
function showLoader(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="loader-wrapper"><div class="loader-ring"></div></div>`;
}

function showEmptyState(containerId, title = 'Sin resultados', msg = 'No se encontraron registros') {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">👕</div>
      <h3>${title}</h3>
      <p>${msg}</p>
    </div>
  `;
}
