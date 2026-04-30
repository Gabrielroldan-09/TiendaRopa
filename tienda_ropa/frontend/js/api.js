// =============================================
// URBAN THREADS — API Client Utility
// Centraliza todas las llamadas al backend
// Incluye token JWT en cada request
// =============================================

const API_BASE = 'https://tiendaropa-production-ca22.up.railway.app';

// Función base para fetch con manejo de errores y auth
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('bh_token');

  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type':  'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  // Si el token expiró o no es válido → redirigir a login
  if (response.status === 401) {
    localStorage.removeItem('bh_token');
    localStorage.removeItem('bh_user');
    window.location.href = 'login.html';
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    const msg = data.errors
      ? data.errors.map(e => e.msg).join(', ')
      : data.message || 'Error desconocido';
    throw new Error(msg);
  }

  return data;
}

// ==================== AUTH API ====================
const AuthAPI = {
  login:    (data) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me:       ()     => apiFetch('/auth/me'),
};

// ==================== PRODUCTOS API ====================
const ProductosAPI = {
  getAll:  (search = '') => apiFetch(`/productos${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id)          => apiFetch(`/productos/${id}`),
  create:  (data)        => apiFetch('/productos', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id, data)    => apiFetch(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove:  (id)          => apiFetch(`/productos/${id}`, { method: 'DELETE' }),
};

// ==================== VENTAS API ====================
const VentasAPI = {
  registrar:  (data)                  => apiFetch('/ventas', { method: 'POST', body: JSON.stringify(data) }),
  getAll:     (fecha = '', limit = 50) => apiFetch(`/ventas${buildQuery({ fecha, limit })}`),
  getById:    (id)                    => apiFetch(`/ventas/${id}`),
  resumenHoy: ()                      => apiFetch('/ventas/resumen-hoy'),
};

// ==================== CAJA API ====================
const CajaAPI = {
  getEstado:    ()      => apiFetch('/caja'),
  getHistorial: (limit) => apiFetch(`/caja/historial${limit ? `?limit=${limit}` : ''}`),
  getById:      (id)    => apiFetch(`/caja/${id}`),
  abrir:        (data)  => apiFetch('/caja/apertura', { method: 'POST', body: JSON.stringify(data) }),
  egreso:       (data)  => apiFetch('/caja/egreso',   { method: 'POST', body: JSON.stringify(data) }),
  cerrar:       (data)  => apiFetch('/caja/cierre',   { method: 'POST', body: JSON.stringify(data) }),
};

// ==================== REPORTES API ====================
const ReportesAPI = {
  kpis:         (periodo = 'hoy')               => apiFetch(`/reportes/kpis${buildQuery({ periodo })}`),
  evolucion:    (dias = 7)                      => apiFetch(`/reportes/evolucion${buildQuery({ dias })}`),
  topProductos: (periodo = '7dias', limit = 10) => apiFetch(`/reportes/top-productos${buildQuery({ periodo, limit })}`),
  categorias:   (periodo = '7dias')             => apiFetch(`/reportes/categorias${buildQuery({ periodo })}`),
  cajas:        (limit = 10)                    => apiFetch(`/reportes/cajas${buildQuery({ limit })}`),
};

// Helper: build query string (ignores empty values)
function buildQuery(params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}
