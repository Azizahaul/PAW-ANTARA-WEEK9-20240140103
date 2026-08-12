// Global Application State
let currentUser = null;
let allTodos = [];
let activeFilter = 'all'; // 'all' | 'active' | 'completed'
let activeAuthTab = 'login'; // 'login' | 'register'

// DOM Elements
const authContainer = document.getElementById('auth-container');
const todoContainer = document.getElementById('todo-container');
const userNavBar = document.getElementById('user-nav-bar');
const userDisplayName = document.getElementById('user-display-name');
const userAvatarInitial = document.getElementById('user-avatar-initial');
const btnLogout = document.getElementById('btn-logout');

const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

const addTodoForm = document.getElementById('add-todo-form');
const newTodoTitle = document.getElementById('new-todo-title');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');

const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');

const editModal = document.getElementById('edit-modal');
const editTodoForm = document.getElementById('edit-todo-form');
const editTodoId = document.getElementById('edit-todo-id');
const editTodoTitle = document.getElementById('edit-todo-title');
const editTodoIsDone = document.getElementById('edit-todo-isdone');

// Helper: Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');

  const bgColors = {
    success: 'bg-emerald-600 border-emerald-500',
    error: 'bg-rose-600 border-rose-500',
    info: 'bg-indigo-600 border-indigo-500',
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info',
  };

  toast.className = `flex items-center space-x-3 px-4 py-3 rounded-xl border text-white text-sm shadow-xl transition-all transform duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-base"></i>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// API Helper
async function apiRequest(endpoint, options = {}) {
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // penting untuk session cookie
  };

  try {
    const response = await fetch(endpoint, { ...defaultOptions, ...options });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    return { ok: false, status: 500, data: { message: 'Gagal terhubung ke server API' } };
  }
}

// Check Session on Init
async function checkAuthSession() {
  const result = await apiRequest('/api/auth/me');
  if (result.ok && result.data.success) {
    currentUser = result.data.data;
    showAppDashboard();
    fetchTodos();
  } else {
    showAuthScreen();
  }
}

// UI State Switchers
function showAuthScreen() {
  authContainer.classList.remove('hidden');
  todoContainer.classList.add('hidden');
  userNavBar.classList.add('hidden');
}

function showAppDashboard() {
  authContainer.classList.add('hidden');
  todoContainer.classList.remove('hidden');
  userNavBar.classList.remove('hidden');

  if (currentUser) {
    userDisplayName.textContent = currentUser.username;
    userAvatarInitial.textContent = currentUser.username.charAt(0).toUpperCase();
  }
}

// Quick Fill Auth
function fillQuickAuth(username, password) {
  document.getElementById('auth-username').value = username;
  document.getElementById('auth-password').value = password;
}

// Tab Auth Switcher
tabLogin.addEventListener('click', () => setAuthTab('login'));
tabRegister.addEventListener('click', () => setAuthTab('register'));

function setAuthTab(tab) {
  activeAuthTab = tab;
  if (tab === 'login') {
    tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 transition shadow';
    tabRegister.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition';
    authTitle.textContent = 'Masuk ke Akun Anda';
    authSubmitBtn.querySelector('span').textContent = 'Login';
  } else {
    tabRegister.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 transition shadow';
    tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition';
    authTitle.textContent = 'Daftar Akun Baru';
    authSubmitBtn.querySelector('span').textContent = 'Daftar Akun';
  }
}

// Handle Auth Form Submission
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;

  const endpoint = activeAuthTab === 'login' ? '/api/auth/login' : '/api/auth/register';

  const res = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (res.ok && res.data.success) {
    currentUser = res.data.data;
    showToast(res.data.message || (activeAuthTab === 'login' ? 'Login berhasil' : 'Registrasi berhasil'), 'success');
    showAppDashboard();
    fetchTodos();
  } else {
    showToast(res.data.message || 'Gagal autentikasi', 'error');
  }
});

// Handle Logout
btnLogout.addEventListener('click', async () => {
  const res = await apiRequest('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  allTodos = [];
  showToast('Anda telah logout', 'info');
  showAuthScreen();
});

// Fetch All Todos for Logged-In User
async function fetchTodos() {
  const res = await apiRequest('/api/todos');
  if (res.ok && res.data.success) {
    allTodos = res.data.data || [];
    renderTodos();
  } else {
    showToast(res.data.message || 'Gagal mengambil data todo', 'error');
  }
}

// Render Todos & Global Statistics
function renderTodos() {
  todoList.innerHTML = '';

  // Global Statistics across ALL user todos
  const totalCount = allTodos.length;
  const completedCount = allTodos.filter(t => t.is_done).length;
  const pendingCount = totalCount - completedCount;

  statTotal.textContent = totalCount;
  statCompleted.textContent = completedCount;
  statPending.textContent = pendingCount;

  // Filter todos based on active tab
  let filtered = allTodos;
  if (activeFilter === 'active') {
    filtered = allTodos.filter(t => !t.is_done);
  } else if (activeFilter === 'completed') {
    filtered = allTodos.filter(t => t.is_done);
  }

  // Filter search query
  const searchInput = document.getElementById('search-todo');
  const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (search) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
  }

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach((todo) => {
    const item = document.createElement('div');
    item.className = `flex items-center justify-between p-4 rounded-xl glass-card transition-all duration-200 border ${
      todo.is_done ? 'border-emerald-500/20 bg-slate-900/40 opacity-75' : 'border-slate-800 hover:border-indigo-500/30'
    }`;

    item.innerHTML = `
      <div class="flex items-center space-x-3 min-w-0 flex-1 mr-3">
        <button onclick="toggleTodoStatus(${todo.id}, ${!todo.is_done})"
          class="w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
            todo.is_done
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-600 hover:border-indigo-500 text-transparent'
          }">
          <i class="fa-solid fa-check text-xs"></i>
        </button>
        <span class="text-sm font-medium ${todo.is_done ? 'line-through text-slate-400' : 'text-slate-200'} truncate">
          ${escapeHtml(todo.title)}
        </span>
      </div>

      <div class="flex items-center space-x-2">
        <button onclick="openEditModal(${todo.id}, '${escapeQuote(todo.title)}', ${todo.is_done})"
          class="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition" title="Edit">
          <i class="fa-solid fa-pen-to-square text-xs"></i>
        </button>
        <button onclick="deleteTodo(${todo.id})"
          class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition" title="Hapus">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    `;

    todoList.appendChild(item);
  });
}

// Add Todo
addTodoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = newTodoTitle.value.trim();
  if (!title) return;

  const res = await apiRequest('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });

  if (res.ok && res.data.success) {
    newTodoTitle.value = '';
    showToast('Todo berhasil ditambahkan', 'success');
    fetchTodos();
  } else {
    showToast(res.data.message || 'Gagal menambah todo', 'error');
  }
});

// Toggle Status (is_done)
async function toggleTodoStatus(id, newStatus) {
  const res = await apiRequest(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ is_done: newStatus }),
  });

  if (res.ok && res.data.success) {
    showToast(`Todo ditandai ${newStatus ? 'selesai' : 'belum selesai'}`, 'success');
    fetchTodos();
  } else {
    showToast(res.data.message || 'Gagal mengubah status', 'error');
  }
}

// Delete Todo
async function deleteTodo(id) {
  if (!confirm('Yakin ingin menghapus todo ini?')) return;

  const res = await apiRequest(`/api/todos/${id}`, {
    method: 'DELETE',
  });

  if (res.ok && res.data.success) {
    showToast('Todo berhasil dihapus', 'info');
    fetchTodos();
  } else {
    showToast(res.data.message || 'Gagal menghapus todo', 'error');
  }
}

// Edit Modal Handling
function openEditModal(id, title, isDone) {
  editTodoId.value = id;
  editTodoTitle.value = title;
  editTodoIsDone.checked = isDone;
  editModal.classList.remove('hidden');
}

function closeEditModal() {
  editModal.classList.add('hidden');
}

editTodoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = editTodoId.value;
  const title = editTodoTitle.value.trim();
  const is_done = editTodoIsDone.checked;

  if (!title) {
    showToast('Judul todo tidak boleh kosong', 'error');
    return;
  }

  const res = await apiRequest(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, is_done }),
  });

  if (res.ok && res.data.success) {
    closeEditModal();
    showToast('Todo berhasil diubah', 'success');
    fetchTodos();
  } else {
    showToast(res.data.message || 'Gagal mengedit todo', 'error');
  }
});

// Filter Handlers
function setFilter(filter) {
  activeFilter = filter;
  ['all', 'active', 'completed'].forEach((f) => {
    const btn = document.getElementById(`filter-${f}`);
    if (!btn) return;
    if (f === filter) {
      btn.className = 'px-4 py-1.5 font-semibold rounded-lg text-white bg-indigo-600 transition shadow';
    } else {
      btn.className = 'px-4 py-1.5 font-semibold rounded-lg text-slate-400 hover:text-white transition';
    }
  });
  renderTodos();
}

// Search Handler
function handleSearch() {
  renderTodos();
}

// Utility Functions
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

function escapeQuote(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', checkAuthSession);
