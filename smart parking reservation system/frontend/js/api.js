const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function getCurrentUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'admin';
}
function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
function requireAuth() {
  if (!getToken()) window.location.href = 'login.html';
}
function requireAdminPage() {
  requireAuth();
  if (!isAdmin()) {
    alert('This page is for admins only.');
    window.location.href = 'locations.html';
  }
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

function showError(el, message) { el.textContent = message; el.style.display = 'block'; }
function hideError(el) { el.style.display = 'none'; }
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
