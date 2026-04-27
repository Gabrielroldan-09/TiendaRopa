// =============================================
// URBAN THREADS — auth.js
// Manejo de sesión: token, usuario, redirects
// =============================================

const AUTH_KEY  = 'bh_token';
const USER_KEY  = 'bh_user';

// ---- Verificar si hay sesión activa ----
function checkAuth() {
  const token = localStorage.getItem(AUTH_KEY);
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  // Verificar expiración decodificando el payload del JWT
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      logout();
      return false;
    }
  } catch (_) {
    logout();
    return false;
  }
  return true;
}

// ---- Obtener token ----
function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

// ---- Guardar sesión después del login ----
function saveSession(token, usuario) {
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

// ---- Obtener datos del usuario desde localStorage ----
function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || {};
  } catch (_) {
    return {};
  }
}

// ---- Cerrar sesión ----
function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = 'login.html';
}

// ---- Inyectar info del usuario en el sidebar ----
function renderUserInfo() {
  const user = getUser();
  if (!user.nombre) return;

  // Buscar el contenedor del sidebar footer
  const footer = document.querySelector('.sidebar-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="sidebar-user">
      <div class="su-avatar">${user.nombre.charAt(0).toUpperCase()}</div>
      <div class="su-info">
        <div class="su-nombre">${user.nombre}</div>
        <div class="su-email">${user.email || ''}</div>
      </div>
    </div>
    <button class="btn-logout" onclick="logout()" title="Cerrar sesión">
      <span>🚪</span> Cerrar sesión
    </button>
  `;
}

// ---- Init: verificar auth y mostrar usuario ----
document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    renderUserInfo();
  }
});
