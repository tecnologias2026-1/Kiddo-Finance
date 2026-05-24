// ============================================================
// KIDDO FINANCE — app.js  (versión backend)
// ============================================================

'use strict';

// ============================================================
// API
// ============================================================
let API = null; // Se carga desde api/url.php al iniciar

async function apiFetch(url, opts = {}) {
  try {
    const res = await fetch(API + url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
    if (res.status === 401) { window.location.href = 'login.html'; return null; }
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error del servidor');
    return json.data;
  } catch (e) {
    if (e.message && e.message !== 'Failed to fetch') showToast(e.message, 'error');
    throw e;
  }
}
const apiGet    = (url)                 => apiFetch(url);
const apiPost   = (url, body)           => apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
const apiPut    = (url, body)           => apiFetch(url, { method: 'PUT',  body: JSON.stringify(body) });
const apiDelete = (url)                 => apiFetch(url, { method: 'DELETE' });

// ============================================================
// CACHE EN MEMORIA
// ============================================================
const _cache = { perfiles: [], movimientos: [], metas: [], perfilActivo: null };

const obtenerPerfiles      = ()        => _cache.perfiles;
const obtenerPerfilActivo  = ()        => _cache.perfilActivo;
const obtenerMovimientos   = ()        => _cache.movimientos;
const obtenerMetas         = ()        => _cache.metas;

// ============================================================
// CARGA DE DATOS DESDE API
// ============================================================
async function cargarPerfiles() {
  _cache.perfiles = await apiGet('/perfiles.php') || [];
}
async function cargarMovimientos(perfilId) {
  if (!perfilId) { _cache.movimientos = []; return; }
  const data = await apiGet(`/movimientos.php?perfil_id=${perfilId}`) || [];
  // La API devuelve más viejos primero con ORDER BY fecha DESC
  _cache.movimientos = data.reverse();
}
async function cargarMetas(perfilId) {
  if (!perfilId) { _cache.metas = []; return; }
  const data = await apiGet(`/metas.php?perfil_id=${perfilId}`) || [];
  _cache.metas = data.map(m => ({
    id: m.id,
    nombre: m.nombre,
    monto: m.monto_target,
    ahorrado: m.ahorrado,
    fecha: m.fecha_limite,
    categoria: m.categoria,
  }));
}
async function cargarDashboard(perfilId) {
  if (!perfilId) { _cache.movimientos = []; _cache.metas = []; return null; }
  const data = await apiGet(`/dashboard.php?perfil_id=${perfilId}`);
  if (!data) return null;
  _cache.movimientos = (data.movimientos || []).reverse();
  _cache.metas = (data.metas || []).map(m => ({
    id: m.id,
    nombre: m.nombre,
    monto: m.monto_target,
    ahorrado: m.ahorrado,
    fecha: m.fecha_limite,
    categoria: m.categoria,
  }));
  return data;
}

// ============================================================
// UTILIDADES
// ============================================================
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ============================================================
// TOAST (notificaciones)
// ============================================================
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// SISTEMA DE EVENTOS INTERNOS
// ============================================================
const _callbacks = { perfil: [], movimiento: [], meta: [] };

function on(event, cb)  { if (_callbacks[event]) _callbacks[event].push(cb); }
function emit(event)    { (_callbacks[event] || []).forEach(cb => cb()); }

// ============================================================
// SIDEBAR
// ============================================================
function initSidebar() {
  const sidebar   = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  if (!sidebar || !toggleBtn) return;

  const isDesktop = window.innerWidth > 768;
  const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

  if (savedCollapsed && isDesktop) {
    sidebar.classList.add('collapsed');
    toggleBtn.classList.add('active');
  }

  toggleBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('expanded-mobile');
    } else {
      sidebar.classList.toggle('collapsed');
      toggleBtn.classList.toggle('active');
      localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    }
  });

  document.addEventListener('click', (e) => {
    if (
      window.innerWidth <= 768 &&
      sidebar.classList.contains('expanded-mobile') &&
      !sidebar.contains(e.target)
    ) {
      sidebar.classList.remove('expanded-mobile');
    }
  });

  // Cerrar sesión via API
  const logoutLink = document.querySelector('.sidebar-bottom a[href="login.html"]');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await apiPost('/logout.php', {});
      window.location.href = 'login.html';
    });
  }
}

// ============================================================
// PERFIL ACTIVO — UI
// ============================================================
function actualizarUIPerfilActivo(perfil) {
  const el = document.getElementById('nombreDashboard');
  if (el) el.textContent = perfil ? escapeHtml(perfil.nombre) : 'Invitado';

  const previewNombre = document.getElementById('previewNombre');
  const previewEdad   = document.getElementById('previewEdad');
  if (previewNombre && perfil) previewNombre.textContent = escapeHtml(perfil.nombre);
  if (previewEdad   && perfil) previewEdad.textContent   = perfil.edad;
}

async function setPerfilActivo(perfil) {
  _cache.perfilActivo = perfil;
  if (perfil) {
    localStorage.setItem('kiddo-perfil-activo-id', String(perfil.id));
  } else {
    localStorage.removeItem('kiddo-perfil-activo-id');
  }
  actualizarUIPerfilActivo(perfil);
  if (perfil) {
    await cargarDashboard(perfil.id);
  } else {
    _cache.movimientos = [];
    _cache.metas = [];
  }
  emit('perfil');
  renderizarListaPerfiles();
}

// ============================================================
// PERFILES — FORMULARIO
// ============================================================
function initPerfilesForm() {
  const form        = document.getElementById('perfilForm');
  const nombreInput = document.getElementById('nombre');
  const edadInput   = document.getElementById('edad');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = nombreInput.value.trim();
    const edad   = Number(edadInput.value);

    if (!nombre) { showToast('Escribe el nombre del niño/a', 'error'); return; }
    if (!edad || edad < 1 || edad > 17) { showToast('Ingresa una edad válida (1–17)', 'error'); return; }

    const perfiles = obtenerPerfiles();
    const existente = perfiles.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());

    let perfil;
    if (existente) {
      const res = await apiPut('/perfiles.php', { id: existente.id, nombre, edad });
      if (!res) return;
      perfil = { ...existente, nombre, edad };
      showToast(`Perfil de ${nombre} actualizado ✏️`);
    } else {
      const res = await apiPost('/perfiles.php', { nombre, edad });
      if (!res) return;
      perfil = { ...res, nombre, edad };
      showToast(`¡Perfil de ${nombre} creado! 🎉`);
    }

    // Actualizar cache
    await cargarPerfiles();
    await setPerfilActivo(perfil);
    form.reset();
    renderizarListaPerfiles();
  });
}

function renderizarListaPerfiles() {
  const container = document.getElementById('childrenContainer');
  if (!container) return;

  const perfiles = obtenerPerfiles();
  const activo   = obtenerPerfilActivo();

  if (perfiles.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:.875rem;padding:12px 0;">Aún no hay perfiles. ¡Crea uno arriba!</p>';
    return;
  }

  container.innerHTML = '';
  perfiles.forEach(perfil => {
    const card = document.createElement('div');
    card.className = 'child-card' + (activo && activo.nombre === perfil.nombre ? ' active' : '');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Seleccionar perfil de ${perfil.nombre}`);

    card.innerHTML = `
      <div class="child-avatar">${escapeHtml(perfil.nombre.charAt(0).toUpperCase())}</div>
      <div class="child-name">${escapeHtml(perfil.nombre)}</div>
      <div class="child-age">${perfil.edad} años</div>
    `;

    const select = async () => {
      await setPerfilActivo(perfil);
      const ni = document.getElementById('nombre');
      const ei = document.getElementById('edad');
      if (ni) ni.value = perfil.nombre;
      if (ei) ei.value = perfil.edad;
      showToast(`Perfil de ${perfil.nombre} seleccionado`, 'info');
    };

    card.addEventListener('click', select);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
    container.appendChild(card);
  });
}

// ============================================================
// BALANCE
// ============================================================
function calcularBalance() {
  const activo = obtenerPerfilActivo();
  if (!activo) return 0;
  return obtenerMovimientos()
    .reduce((acc, m) => acc + (m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto)), 0);
}

function renderizarBalance() {
  const el = document.getElementById('balanceAmount');
  if (el) el.textContent = formatMoney(calcularBalance());

  const saldoEl = document.querySelector('.saldo-amount');
  if (saldoEl) saldoEl.textContent = formatMoney(Math.max(0, calcularBalance()));
}

// ============================================================
// MOVIMIENTOS — RENDER
// ============================================================
function buildMovementCard(mov) {
  const card = document.createElement('div');
  card.className = 'movement-card';
  card.innerHTML = `
    <div class="movement-left">
      <div class="movement-icon ${escapeHtml(mov.tipo)}">${mov.tipo === 'ingreso' ? '↑' : '↓'}</div>
      <div>
        <div class="movement-title">${escapeHtml(mov.descripcion)}</div>
        <div class="movement-category">${escapeHtml(mov.categoria)}</div>
        <div class="movement-meta">${formatDate(mov.fecha)}</div>
      </div>
    </div>
    <div class="movement-value ${escapeHtml(mov.tipo)}">
      ${mov.tipo === 'ingreso' ? '+' : '-'}${formatMoney(mov.monto)}
    </div>
  `;
  return card;
}

function renderizarUltimosMovimientos() {
  const el = document.getElementById('recentMovements');
  if (!el) return;

  const activo = obtenerPerfilActivo();
  if (!activo) { el.innerHTML = '<p style="color:var(--text-secondary)">Selecciona un perfil para ver movimientos.</p>'; return; }

  const movs = obtenerMovimientos()
    .slice(0, 5);

  if (!movs.length) { el.innerHTML = '<p style="color:var(--text-secondary)">No hay movimientos aún.</p>'; return; }

  el.innerHTML = '';
  movs.forEach(m => {
    const item = document.createElement('div');
    item.className = 'movement-item';
    item.innerHTML = `
      <div class="movement-info">
        <h4>${escapeHtml(m.descripcion)}</h4>
        <p>${escapeHtml(m.categoria)} · ${formatDate(m.fecha)}</p>
      </div>
      <div class="movement-amount ${escapeHtml(m.tipo)}">
        ${m.tipo === 'ingreso' ? '+' : '-'}${formatMoney(m.monto)}
      </div>
    `;
    el.appendChild(item);
  });
}

function renderizarMovimientosLista(containerId, filtro = 'todos', limite = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const activo = obtenerPerfilActivo();
  if (!activo) { container.innerHTML = '<p style="padding:16px;color:var(--text-secondary)">Selecciona o crea un perfil.</p>'; return; }

  let movs = obtenerMovimientos();

  if (filtro !== 'todos') movs = movs.filter(m => m.tipo === filtro);
  if (limite) movs = movs.slice(0, limite);

  if (!movs.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div><p>Sin movimientos aquí</p></div>';
    return;
  }

  container.innerHTML = '';
  movs.forEach(m => container.appendChild(buildMovementCard(m)));
}

// ============================================================
// MOVIMIENTOS — GUARDAR
// ============================================================
let currentTipo = 'ingreso';

async function guardarMovimiento(monto, descripcion, categoria) {
  const activo = obtenerPerfilActivo();
  if (!activo) { showToast('Primero crea o selecciona un perfil', 'error'); return false; }

  const montoNum = parseFloat(monto);
  if (!montoNum || montoNum <= 0) { showToast('Ingresa un monto válido mayor a 0', 'error'); return false; }
  if (!descripcion.trim()) { showToast('Escribe una descripción', 'error'); return false; }
  if (!categoria) { showToast('Selecciona una categoría', 'error'); return false; }

  const res = await apiPost('/movimientos.php', {
    perfil_id: activo.id,
    tipo: currentTipo,
    monto: montoNum,
    descripcion: descripcion.trim(),
    categoria: categoria.trim(),
  });
  if (!res) return false;

  await cargarMovimientos(activo.id);
  emit('movimiento');
  return true;
}

function initMovimientosForm() {
  const form          = document.getElementById('movimientoForm');
  const montoInput    = document.getElementById('monto');
  const descInput     = document.getElementById('descripcion');
  const categoriaInput = document.getElementById('categoria');
  const toggleBtns    = document.querySelectorAll('.toggle-btn');
  const submitBtn     = document.querySelector('.btn-submit-movement');
  if (!form) return;

  const updateToggle = (tipo) => {
    currentTipo = tipo;
    toggleBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.type === tipo);
      if (b.dataset.type === 'gasto' && tipo === 'gasto') b.classList.add('gasto');
      else b.classList.remove('gasto');
    });
    if (submitBtn) submitBtn.textContent = tipo === 'ingreso' ? 'Registrar Ingreso ↑' : 'Registrar Gasto ↓';
  };

  toggleBtns.forEach(b => b.addEventListener('click', () => updateToggle(b.dataset.type)));
  updateToggle('ingreso');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = await guardarMovimiento(montoInput.value, descInput.value, categoriaInput.value);
    if (ok) {
      form.reset();
      updateToggle(currentTipo);
      showToast(currentTipo === 'ingreso' ? '¡Ingreso registrado! 🎉' : 'Gasto registrado 💸');
    }
  });
}

// ============================================================
// HISTORIAL — ESTADÍSTICAS Y FILTROS
// ============================================================
function actualizarEstadisticasHistorial() {
  const activo = obtenerPerfilActivo();
  const totalIngresosEl = document.getElementById('totalIngresos');
  const totalGastosEl   = document.getElementById('totalGastos');
  const balanceNetoEl   = document.getElementById('balanceNeto');
  if (!totalIngresosEl) return;

  if (!activo) {
    [totalIngresosEl, totalGastosEl, balanceNetoEl].forEach(el => { if (el) el.textContent = formatMoney(0); });
    return;
  }

  const movs = obtenerMovimientos();
  const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + Number(m.monto), 0);
  const gastos   = movs.filter(m => m.tipo === 'gasto').reduce((a, m) => a + Number(m.monto), 0);

  if (totalIngresosEl) totalIngresosEl.textContent = formatMoney(ingresos);
  if (totalGastosEl)   totalGastosEl.textContent   = formatMoney(gastos);
  if (balanceNetoEl)   balanceNetoEl.textContent   = formatMoney(ingresos - gastos);
}

function initFiltrosHistorial() {
  const tabs = document.querySelectorAll('.filter-tabs .tab');
  if (!tabs.length) return;

  let filtroActual = 'todos';
  const aplicar = () => {
    renderizarMovimientosLista('historialMovimientos', filtroActual);
    actualizarEstadisticasHistorial();
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filtroActual = tab.dataset.filter;
      aplicar();
    });
  });

  aplicar();
}

// ============================================================
// METAS — SISTEMA UNIFICADO
// ============================================================
async function guardarMeta(nombre, monto, fecha, categoria) {
  const activo = obtenerPerfilActivo();
  if (!activo) { showToast('Primero selecciona un perfil', 'error'); return false; }

  if (!nombre.trim()) { showToast('Escribe el nombre de la meta', 'error'); return false; }
  const montoNum = parseFloat(monto);
  if (!montoNum || montoNum <= 0) { showToast('Ingresa un monto válido', 'error'); return false; }
  if (!fecha) { showToast('Selecciona una fecha límite', 'error'); return false; }
  if (!categoria) { showToast('Selecciona una categoría', 'error'); return false; }

  const hoy = new Date().toISOString().split('T')[0];
  if (fecha < hoy) { showToast('La fecha no puede ser en el pasado', 'warning'); return false; }

  const res = await apiPost('/metas.php', {
    perfil_id: activo.id,
    nombre: nombre.trim(),
    monto: montoNum,
    fecha,
    categoria: categoria.trim(),
  });
  if (!res) return false;

  await cargarMetas(activo.id);
  emit('meta');
  return true;
}

async function actualizarProgreso(id, valor) {
  const val = parseFloat(valor);
  if (isNaN(val) || val < 0) { showToast('Valor inválido', 'error'); return; }

  const res = await apiPut('/metas.php', { id, ahorrado: val });
  if (!res) return;

  const activo = obtenerPerfilActivo();
  if (activo) await cargarMetas(activo.id);
  emit('meta');

  const meta = obtenerMetas().find(m => m.id === id);
  if (meta && meta.ahorrado >= meta.monto) showToast(`¡Meta "${meta.nombre}" completada! 🏆`, 'success');
  else showToast('Progreso actualizado 📈', 'info');
}

function buildMetaCard(meta, compact = false) {
  const porcentaje = Math.min(100, (meta.ahorrado / meta.monto) * 100);
  const completada = meta.ahorrado >= meta.monto;

  const card = document.createElement('div');
  card.className = 'meta-card' + (completada ? ' completed' : '');

  card.innerHTML = `
    <div class="meta-header">
      <div>
        <h3>${escapeHtml(meta.nombre)}</h3>
        <span class="meta-category">${escapeHtml(meta.categoria)}</span>
      </div>
      <span class="meta-amount">${formatMoney(meta.monto)}</span>
    </div>
    <div class="progress-container">
      <div class="progress-bar" style="width:${porcentaje}%"></div>
    </div>
    <div class="meta-info">
      <span class="meta-percent">${porcentaje.toFixed(0)}% completado</span>
      <span>${formatMoney(meta.ahorrado)} ahorrados</span>
    </div>
    ${!compact ? `
      <div class="meta-date">📅 Meta para: ${escapeHtml(meta.fecha)}</div>
      ${!completada ? `
        <div class="meta-input-row">
          <input
            type="number"
            class="meta-input-field"
            placeholder="¿Cuánto has ahorrado?"
            value="${meta.ahorrado}"
            min="0"
            max="${meta.monto}"
            data-id="${meta.id}"
          >
          <button class="btn-update btn-update-meta" data-id="${meta.id}">Actualizar</button>
        </div>
      ` : '<div class="meta-complete" style="color:var(--success);font-weight:700;margin-top:10px;">🏆 ¡Meta alcanzada!</div>'}
    ` : ''}
  `;

  return card;
}

function renderizarMetas() {
  const container = document.getElementById('metasContainer');
  if (!container) return;

  const metas = obtenerMetas();
  container.innerHTML = '';

  if (!metas.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <p>No tienes metas aún 🎯</p>
      </div>`;
    return;
  }

  metas.forEach(meta => {
    const card = buildMetaCard(meta, false);
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-update-meta').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = Number(btn.dataset.id);
      const input = container.querySelector(`input[data-id="${id}"]`);
      if (input) actualizarProgreso(id, input.value);
    });
  });
}

function renderizarResumenMetas() {
  const container = document.getElementById('dashboardMetas');
  if (!container) return;

  const metas = obtenerMetas();
  container.innerHTML = '';

  if (!metas.length) {
    container.innerHTML = `<p style="color:var(--text-secondary);font-size:.875rem">No tienes metas aún. <a href="metas.html" style="color:var(--primary);font-weight:700">Crea una →</a></p>`;
    return;
  }

  metas.slice(0, 3).forEach(meta => {
    const card = buildMetaCard(meta, true);
    container.appendChild(card);
  });
}

function renderDashboardMetas() {
  const metas     = obtenerMetas();
  const fill      = document.getElementById('globalFill');
  const text      = document.getElementById('globalText');
  if (!fill && !text) return;

  if (!metas.length) {
    if (fill) fill.style.width = '0%';
    if (text) text.textContent = '0% completado';
    return;
  }

  const totalMeta     = metas.reduce((a, m) => a + Number(m.monto),    0);
  const totalAhorrado = metas.reduce((a, m) => a + Number(m.ahorrado), 0);
  const pct = totalMeta ? (totalAhorrado / totalMeta) * 100 : 0;

  if (fill) fill.style.width = pct.toFixed(1) + '%';
  if (text) text.textContent = pct.toFixed(1) + '% completado';
}

// ============================================================
// MODAL METAS — ÚNICO LISTENER
// ============================================================
function initMetasModal() {
  const modal       = document.getElementById('metaModal');
  const openBtns    = document.querySelectorAll('.openModalBtn');
  const closeBtn    = document.getElementById('closeModal');
  const form        = document.getElementById('metaForm');
  if (!modal || !form) return;

  const open  = () => modal.classList.add('active');
  const close = () => modal.classList.remove('active');

  openBtns.forEach(b => b.addEventListener('click', open));
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = await guardarMeta(
      document.getElementById('metaNombre').value,
      document.getElementById('metaMonto').value,
      document.getElementById('metaFecha').value,
      document.getElementById('metaCategoria').value,
    );
    if (ok) {
      form.reset();
      close();
      renderizarMetas();
      renderizarResumenMetas();
      renderDashboardMetas();
      showToast('¡Meta creada! 🎯');
    }
  });
}

// ============================================================
// LOGROS
// ============================================================
function actualizarLogros() {
  const activo     = obtenerPerfilActivo();
  const metas      = obtenerMetas();
  const movs       = activo ? obtenerMovimientos() : [];
  const ingresos   = movs.filter(m => m.tipo === 'ingreso');
  const gastos     = movs.filter(m => m.tipo === 'gasto');
  const balance    = calcularBalance();

  const logros = {
    primeraMeta:       metas.length > 0,
    ahorroInicial:     ingresos.length > 0,
    gastadorConsciente: gastos.length > 0,
    metaCumplida:      metas.some(m => m.ahorrado >= m.monto),
    ahorradorExperto:  balance >= 100000,
  };

  const desbloqueados = Object.values(logros).filter(Boolean).length;

  const ring = document.querySelector('.progress-ring');
  if (ring) ring.innerHTML = `${desbloqueados}/5<br><span style="font-size:.65rem;opacity:.8">logros</span>`;

  const progressText = document.querySelector('.progress-info p');
  if (progressText) progressText.textContent = `Has desbloqueado ${desbloqueados} de 5 logros`;

  const keys = ['primeraMeta', 'ahorroInicial', 'gastadorConsciente', 'metaCumplida', 'ahorradorExperto'];
  document.querySelectorAll('.badge-item').forEach((item, i) => {
    const key = keys[i];
    const statusEl = item.querySelector('.badge-status');
    if (logros[key]) {
      item.classList.add('unlocked');
      if (statusEl) statusEl.textContent = '✅ Desbloqueado';
    } else {
      item.classList.remove('unlocked');
      if (statusEl) statusEl.textContent = '🔒 Bloqueado';
    }
  });

  const ctaEl = document.querySelector('.logros-cta');
  if (ctaEl) {
    ctaEl.textContent = desbloqueados === 5
      ? '🏆 ¡Eres un maestro del ahorro! ¡Todos los logros desbloqueados!'
      : `¡Sigue usando la app para desbloquear los ${5 - desbloqueados} logros restantes!`;
  }
}

// ============================================================
// ACTUALIZACIÓN GLOBAL DE LA UI
// ============================================================
function actualizarTodaLaUI() {
  renderizarBalance();
  renderizarUltimosMovimientos();
  renderizarResumenMetas();
  renderDashboardMetas();
  actualizarLogros();

  if (document.getElementById('movementsList')) {
    renderizarMovimientosLista('movementsList', 'todos', 10);
  }

  if (document.getElementById('historialMovimientos')) {
    const activeTab = document.querySelector('.filter-tabs .tab.active');
    renderizarMovimientosLista('historialMovimientos', activeTab?.dataset.filter || 'todos');
    actualizarEstadisticasHistorial();
  }

  if (document.getElementById('childrenContainer')) {
    renderizarListaPerfiles();
  }

  if (document.getElementById('metasContainer')) {
    renderizarMetas();
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  }

  // Cargar URL base de la API
  try {
    const urlRes = await fetch('api/url.php');
    const urlConfig = await urlRes.json();
    API = urlConfig.api_base;
  } catch {
    showToast('Error al conectar con el servidor', 'error');
    return;
  }

  initSidebar();

  // Cargar datos del usuario autenticado
  try {
    await cargarPerfiles();
  } catch {
    return; // apiFetch ya redirige a login si 401
  }

  // Seleccionar perfil guardado, o el primero
  const perfiles = obtenerPerfiles();
  const savedId = localStorage.getItem('kiddo-perfil-activo-id');
  let selected = savedId ? perfiles.find(p => Number(p.id) === Number(savedId)) : null;
  if (!selected && perfiles.length > 0) selected = perfiles[0];

  if (selected) {
    await setPerfilActivo(selected);
  } else {
    _cache.perfilActivo = null;
    actualizarUIPerfilActivo(null);
  }

  initPerfilesForm();
  initMovimientosForm();
  initMetasModal();

  if (document.getElementById('historialMovimientos')) {
    initFiltrosHistorial();
  }

  on('perfil',     actualizarTodaLaUI);
  on('movimiento', actualizarTodaLaUI);
  on('meta',       actualizarTodaLaUI);

  actualizarTodaLaUI();
});
