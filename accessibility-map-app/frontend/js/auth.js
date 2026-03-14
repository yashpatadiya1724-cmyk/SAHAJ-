// =============================================
// AUTH.JS — SAHAJ Platform
// Aasaan Raasta, Sabke Liye
// =============================================


const API_BASE = 'http://localhost:5000/api';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch { return null; }
}

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Update nav based on auth state
function updateNav() {
  const user = getUser();
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const roleBadge = user.role === 'admin'
      ? '<span style="background:#F3E5F5;color:#7B1FA2;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">ADMIN</span>'
      : user.role === 'contributor'
      ? '<span style="background:#FFF3E0;color:var(--saffron);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">CONTRIBUTOR</span>'
      : '';

    navAuth.innerHTML = `
      ${user.role === 'admin' ? '<a href="admin.html" class="btn btn-sm" style="background:#F3E5F5;color:#7B1FA2;">🛡 Admin</a>' : ''}
      <div style="display:flex;align-items:center;gap:10px;padding:6px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;" onclick="toggleUserMenu()">
        <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--saffron),var(--india-green));display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;">${initials}</div>
        <div>
          <div style="font-size:13px;font-weight:600;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">${roleBadge}</div>
        </div>
        <span style="font-size:10px;color:var(--text-muted);">▼</span>
      </div>
      <div id="userMenu" style="display:none;position:absolute;right:24px;top:65px;background:white;border:1px solid var(--border);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);min-width:180px;z-index:2000;overflow:hidden;">
        <a href="add-location.html" style="display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:14px;color:var(--text-primary);border-bottom:1px solid var(--border);">📍 Add Location</a>
        <a href="dashboard.html" style="display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:14px;color:var(--text-primary);border-bottom:1px solid var(--border);">📊 Dashboard</a>
        <button onclick="logout()" style="display:flex;align-items:center;gap:8px;padding:12px 16px;font-size:14px;color:var(--danger);width:100%;border:none;background:none;cursor:pointer;text-align:left;">🚪 Logout</button>
      </div>
    `;
  }
  // else default login/register buttons are already in HTML
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close menu on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('userMenu');
  if (menu && !menu.contains(e.target) && !e.target.closest('[onclick="toggleUserMenu()"]')) {
    menu.style.display = 'none';
  }
});

// Run on page load
document.addEventListener('DOMContentLoaded', updateNav);

// Toast helper (global)
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
