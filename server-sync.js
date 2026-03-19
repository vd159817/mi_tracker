/*
  server-sync.js — sincronización automática con servidor local Node.js
  ======================================================================
  Reemplaza github-sync.js. Misma interfaz de usuario, diferente backend.

  Fuente de verdad: GET /datos  /  POST /guardar  (servidor Node.js local)
  localStorage:     solo para configuración (URL del servidor) y caché offline

  Comportamiento:
  - Al cargar   → GET /datos → pobla localStorage → recarga si hay cambios
  - Al modificar → localStorage inmediato + POST /guardar (debounce 800ms)
  - Sin servidor → guarda local + marca pendiente
  - Al reconectar → sube pendientes automáticamente
  - Polling cada 3s → detecta cambios de otros dispositivos en la red

  Configuración:
  - URL del servidor configurable desde la UI (no hardcodeada)
  - Se guarda en localStorage['tracker_server_url']
  - Default: http://localhost:3000

  Requiere en cada página:
    window.PAGE_FILES = { lsKey: 'nombreClave', ... }
    (mismo formato que github-sync.js — sin cambios en los HTML)
*/

(function () {
  'use strict';

  // ── CLAVES INTERNAS ───────────────────────────────────────────────────────
  const SERVER_URL_KEY = 'tracker_server_url';
  const PENDING_KEY    = 'tracker_sync_pending';
  const LAST_SYNC_KEY  = 'tracker_last_sync';
  const UNDO_KEY       = 'tracker_undo_snapshot';
  const DEFAULT_URL    = 'http://localhost:3000';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    injectStyles();
    injectSyncBar();
    captureUndoSnapshot();
    await bootSync();
    watchOnlineStatus();
    watchPageClose();
    interceptLocalSaves();
    startPolling();
  }

  // ── CONFIGURACIÓN DE URL ───────────────────────────────────────────────────
  function getServerUrl() {
    return (localStorage.getItem(SERVER_URL_KEY) || DEFAULT_URL).replace(/\/$/, '');
  }

  function setServerUrl(url) {
    _originalSetItem(SERVER_URL_KEY, url.trim().replace(/\/$/, ''));
  }

  // ── ESTILOS ───────────────────────────────────────────────────────────────
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      .sync-bar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 5px 1.5rem; background: var(--surface2);
        border-bottom: 0.5px solid var(--border); gap: 8px;
        font-family: 'DM Mono', monospace;
      }
      .sync-indicator { display: flex; align-items: center; gap: 7px; font-size: 10px; }
      .sync-dot {
        width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        transition: background 0.3s;
      }
      .sync-dot.ok      { background: var(--normal,  #3a6a52); }
      .sync-dot.pending { background: var(--warn,    #b46e28);
                          animation: sync-pulse 1.5s ease-in-out infinite; }
      .sync-dot.offline { background: var(--text3,   #aaa89f); }
      .sync-dot.busy    { background: var(--soft,    #2c6fad);
                          animation: sync-pulse 0.8s ease-in-out infinite; }
      .sync-dot.error   { background: var(--urgent,  #b84030); }
      @keyframes sync-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      .sync-label { color: var(--text3); letter-spacing: 0.04em; }
      .sync-time  { color: var(--text3); font-size: 9px; }

      .btn-sync-undo, .btn-sync-cfg {
        font-family: 'DM Mono', monospace; font-size: 10px;
        padding: 3px 10px; border-radius: 5px;
        border: 0.5px solid var(--border2); cursor: pointer;
        background: var(--surface); color: var(--text3); transition: all 0.15s;
      }
      .btn-sync-undo:hover { color: var(--urgent,#b84030); border-color: var(--urgent,#b84030); }
      .btn-sync-cfg:hover  { color: var(--accent); border-color: var(--accent2); }

      /* Modal de configuración del servidor */
      .srv-cfg-overlay {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.5); z-index: 600;
        align-items: center; justify-content: center; padding: 1rem;
      }
      .srv-cfg-overlay.open { display: flex; }
      .srv-cfg-modal {
        background: var(--surface); border: 0.5px solid var(--border2);
        border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 420px;
        font-family: 'DM Mono', monospace;
      }
      .srv-cfg-title {
        font-family: 'Cormorant Garamond', serif; font-size: 20px;
        font-weight: 300; color: var(--text); margin-bottom: 1rem;
      }
      .srv-cfg-label { font-size: 10px; color: var(--text3); text-transform: uppercase;
                       letter-spacing: 0.06em; margin-bottom: 4px; display: block; }
      .srv-cfg-input {
        width: 100%; font-family: 'DM Mono', monospace; font-size: 13px;
        background: var(--surface2); border: 0.5px solid var(--border2);
        border-radius: 6px; color: var(--text); padding: 8px 10px;
        outline: none; margin-bottom: 0.75rem;
      }
      .srv-cfg-input:focus { border-color: var(--accent2); }
      .srv-cfg-status { font-size: 11px; margin-bottom: 0.75rem; min-height: 16px; }
      .srv-cfg-status.ok  { color: var(--normal); }
      .srv-cfg-status.err { color: var(--urgent); }
      .srv-cfg-actions { display: flex; gap: 8px; justify-content: flex-end; }
      .srv-cfg-btn {
        font-family: 'DM Mono', monospace; font-size: 11px; padding: 6px 14px;
        border-radius: 6px; border: none; cursor: pointer; transition: opacity 0.2s;
      }
      .srv-cfg-btn.primary { background: var(--accent); color: #fff; }
      .srv-cfg-btn.primary:hover { opacity: 0.85; }
      .srv-cfg-btn.ghost  { background: none; border: 0.5px solid var(--border2); color: var(--text2); }
      .srv-cfg-btn.ghost:hover { border-color: var(--accent2); color: var(--accent); }

      /* Footer de estado */
      .sync-footer {
        position: fixed; bottom: 1.5rem; left: 50%;
        transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif; font-style: italic;
        font-size: 13px; color: var(--text3, #aaa89f);
        pointer-events: none; opacity: 0;
        transition: opacity 0.4s ease;
        white-space: nowrap; z-index: 50; letter-spacing: 0.02em;
      }
      .sync-footer.visible { opacity: 1; }

      @media (max-width: 480px) {
        .sync-bar { padding: 4px 1rem; }
        .sync-label { font-size: 9px; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── BARRA DE ESTADO ───────────────────────────────────────────────────────
  function injectSyncBar() {
    setTimeout(() => {
      const topBar = document.querySelector('.top-bar');
      if (!topBar) return;

      const bar = document.createElement('div');
      bar.className = 'sync-bar'; bar.id = 'sync-bar';
      bar.innerHTML = `
        <div class="sync-indicator">
          <div class="sync-dot busy" id="sync-dot"></div>
          <span class="sync-label" id="sync-label">conectando…</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="sync-time" id="sync-time"></span>
          <button class="btn-sync-cfg" onclick="window.SrvSync.openConfig()"
            title="configurar URL del servidor">⚙ servidor</button>
          <button class="btn-sync-undo" onclick="window.SrvSync.undo()"
            title="deshacer cambios de esta sesión">↩ deshacer</button>
        </div>
      `;
      topBar.insertAdjacentElement('afterend', bar);

      // Modal de configuración
      const modal = document.createElement('div');
      modal.className = 'srv-cfg-overlay'; modal.id = 'srv-cfg-overlay';
      modal.innerHTML = `
        <div class="srv-cfg-modal">
          <div class="srv-cfg-title">servidor local</div>
          <label class="srv-cfg-label">URL del servidor</label>
          <input class="srv-cfg-input" id="srv-cfg-input"
            placeholder="http://192.168.x.x:3000"
            value="${getServerUrl()}" />
          <div class="srv-cfg-status" id="srv-cfg-status"></div>
          <div class="srv-cfg-actions">
            <button class="srv-cfg-btn ghost" onclick="window.SrvSync.closeConfig()">cancelar</button>
            <button class="srv-cfg-btn ghost" onclick="window.SrvSync.testConnection()">probar conexión</button>
            <button class="srv-cfg-btn primary" onclick="window.SrvSync.saveConfig()">guardar</button>
          </div>
        </div>
      `;
      modal.addEventListener('click', e => {
        if (e.target === modal) window.SrvSync.closeConfig();
      });
      document.body.appendChild(modal);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'sync-footer'; footer.id = 'sync-footer';
      document.body.appendChild(footer);
    }, 40);
  }

  // ── MODAL DE CONFIGURACIÓN ────────────────────────────────────────────────
  function openConfig() {
    const overlay = document.getElementById('srv-cfg-overlay');
    const input   = document.getElementById('srv-cfg-input');
    if (!overlay) return;
    if (input) input.value = getServerUrl();
    setCfgStatus('');
    overlay.classList.add('open');
  }

  function closeConfig() {
    const overlay = document.getElementById('srv-cfg-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function setCfgStatus(msg, ok = true) {
    const el = document.getElementById('srv-cfg-status');
    if (!el) return;
    el.textContent = msg;
    el.className   = `srv-cfg-status ${msg ? (ok ? 'ok' : 'err') : ''}`;
  }

  async function testConnection() {
    const input = document.getElementById('srv-cfg-input');
    const url   = (input?.value || '').trim().replace(/\/$/, '');
    if (!url) { setCfgStatus('ingresa una URL', false); return; }
    setCfgStatus('probando…');
    try {
      const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
      const j = await r.json();
      if (j.ok) setCfgStatus(`✓ conectado · ${url}`, true);
      else      setCfgStatus('servidor respondió pero sin health check', false);
    } catch(e) {
      setCfgStatus(`✗ no se pudo conectar: ${e.message}`, false);
    }
  }

  function saveConfig() {
    const input = document.getElementById('srv-cfg-input');
    const url   = (input?.value || '').trim().replace(/\/$/, '');
    if (!url) { setCfgStatus('ingresa una URL', false); return; }
    setServerUrl(url);
    setCfgStatus('✓ guardado — recargando…', true);
    setTimeout(() => { closeConfig(); location.reload(); }, 800);
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  let footerTimer = null;
  function showFooter(msg, duration = 2500) {
    const el = document.getElementById('sync-footer');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(footerTimer);
    footerTimer = setTimeout(() => el.classList.remove('visible'), duration);
  }

  // ── ESTADO UI ─────────────────────────────────────────────────────────────
  function setState(state, detail) {
    const dot   = document.getElementById('sync-dot');
    const label = document.getElementById('sync-label');
    const time  = document.getElementById('sync-time');
    if (!dot || !label) return;
    const map = {
      ok:      { cls: 'ok',      text: 'sincronizado' },
      pending: { cls: 'pending', text: 'pendiente de sync' },
      offline: { cls: 'offline', text: 'sin servidor' },
      busy:    { cls: 'busy',    text: detail || 'sincronizando…' },
      error:   { cls: 'error',   text: detail || 'error de sync' },
    };
    const s = map[state] || map.ok;
    dot.className     = `sync-dot ${s.cls}`;
    label.textContent = s.text;
    if (state === 'ok') {
      const last = localStorage.getItem(LAST_SYNC_KEY);
      if (last && time) {
        const d  = new Date(last);
        const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
        const isToday = new Date().toDateString() === d.toDateString();
        time.textContent = isToday ? hm : `${d.getDate()}/${d.getMonth()+1} ${hm}`;
        if (window._syncBootDone) showFooter(`guardado a las ${hm}`);
      }
    } else if (state === 'error') {
      showFooter(detail || 'error al guardar', 4000);
      if (time) time.textContent = '';
    } else if (time) {
      time.textContent = '';
    }
  }

  // ── PAGE FILES ────────────────────────────────────────────────────────────
  // Misma interfaz que github-sync: PAGE_FILES = { lsKey: 'nombreClave' }
  // La "ruta" en el servidor es simplemente la clave (sin 'data/' ni '.json')
  function getPageFiles() {
    return (window.PAGE_FILES && Object.keys(window.PAGE_FILES).length)
      ? window.PAGE_FILES : {};
  }

  // Convierte 'data/sleep.json' → 'sleep' para usar como clave en el servidor
  function toServerKey(ghPath) {
    return ghPath.replace(/^data\//, '').replace(/\.json$/, '');
  }

  // ── PENDIENTES ────────────────────────────────────────────────────────────
  function getPending()    { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '{}'); } catch(e) { return {}; } }
  function setPending(o)   { _originalSetItem(PENDING_KEY, JSON.stringify(o)); }
  function markPending(k)  { const p = getPending(); p[k] = true;   setPending(p); }
  function clearPending(k) { const p = getPending(); delete p[k];   setPending(p); }
  function hasPending()    { return Object.keys(getPending()).length > 0; }

  // ── API DEL SERVIDOR ──────────────────────────────────────────────────────
  async function apiGet() {
    const r = await fetch(`${getServerUrl()}/datos`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function apiPost(payload) {
    const r = await fetch(`${getServerUrl()}/guardar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function apiHealth() {
    const r = await fetch(`${getServerUrl()}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return r.ok;
  }

  // ── SNAPSHOT DE UNDO ──────────────────────────────────────────────────────
  function captureUndoSnapshot() {
    const files = getPageFiles();
    if (!Object.keys(files).length) return;
    if (sessionStorage.getItem('undo_captured')) return;
    const snapshot = {};
    for (const lsKey of Object.keys(files)) {
      const v = localStorage.getItem(lsKey);
      if (v) snapshot[lsKey] = v;
    }
    if (Object.keys(snapshot).length) {
      _originalSetItem(UNDO_KEY, JSON.stringify(snapshot));
      sessionStorage.setItem('undo_captured', '1');
    }
  }

  // ── CARGA INICIAL ─────────────────────────────────────────────────────────
  async function bootSync() {
    setState('busy', 'conectando al servidor…');

    const serverAlive = await apiHealth().catch(() => false);
    if (!serverAlive) {
      setState(hasPending() ? 'pending' : 'offline');
      window._syncBootDone = true;
      return;
    }

    try {
      const remoteAll = await apiGet();
      const files     = getPageFiles();
      const pending   = getPending();
      let changed     = false;

      for (const [lsKey, ghPath] of Object.entries(files)) {
        // No sobreescribir claves con datos pendientes sin subir
        if (pending[lsKey]) continue;

        const serverKey = toServerKey(ghPath);
        const remoteVal = remoteAll[serverKey];
        if (remoteVal === undefined) continue;

        const remoteStr = JSON.stringify(remoteVal);
        const localStr  = localStorage.getItem(lsKey);

        if (localStr !== remoteStr) {
          _originalSetItem(lsKey, remoteStr);
          changed = true;
        }
      }

      _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
      setState('ok');
      window._syncBootDone = true;

      // Recargar una sola vez si hubo cambios remotos
      const guard = parseInt(sessionStorage.getItem('reload_guard') || '0');
      if (changed && (Date.now() - guard) > 3000) {
        sessionStorage.setItem('reload_guard', String(Date.now()));
        location.reload();
      }
    } catch(e) {
      setState('error', 'error al cargar datos');
      window._syncBootDone = true;
    }
  }

  // ── COLA DE GUARDADO (debounce 800ms) ─────────────────────────────────────
  let saveQueue = {};
  let saveTimer = null;
  let isSaving  = false;

  function queueSave(lsKey, data) {
    saveQueue[lsKey] = data;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushQueue, 800);
  }

  async function flushQueue() {
    if (isSaving || !Object.keys(saveQueue).length) return;

    const serverAlive = await apiHealth().catch(() => false);
    if (!serverAlive) {
      Object.keys(saveQueue).forEach(k => markPending(k));
      saveQueue = {};
      setState('offline');
      return;
    }

    isSaving = true;
    setState('busy', 'guardando…');

    // Construir payload: { serverKey: data, ... }
    const toSave  = { ...saveQueue };
    const files   = getPageFiles();
    const payload = {};

    for (const [lsKey, data] of Object.entries(toSave)) {
      const ghPath    = files[lsKey];
      if (!ghPath) { delete saveQueue[lsKey]; continue; }
      const serverKey = toServerKey(ghPath);
      payload[serverKey] = data;
    }

    let errors = 0;
    if (Object.keys(payload).length) {
      try {
        await apiPost(payload);
        // Éxito: limpiar cola y pendientes
        for (const lsKey of Object.keys(toSave)) {
          clearPending(lsKey);
          delete saveQueue[lsKey];
        }
      } catch(e) {
        // Fallo: marcar todos como pendientes, mantener en cola
        for (const lsKey of Object.keys(toSave)) markPending(lsKey);
        errors++;
      }
    }

    isSaving = false;
    _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
    setState(errors > 0 || hasPending() ? 'pending' : 'ok');

    if (errors > 0 && Object.keys(saveQueue).length > 0) {
      saveTimer = setTimeout(flushQueue, 5000);  // retry en 5s
    }
  }

  // ── INTERCEPTAR localStorage.setItem ─────────────────────────────────────
  const _originalSetItem = localStorage.setItem.bind(localStorage);

  function interceptLocalSaves() {
    const INTERNAL = new Set([
      PENDING_KEY, LAST_SYNC_KEY, UNDO_KEY, SERVER_URL_KEY,
      'tracker_config', 'tracker_theme', 'tracker_last_sync',
      'tracker_sync_pending', 'reload_guard', 'undo_captured',
    ]);

    localStorage.setItem = function(key, value) {
      _originalSetItem(key, value);
      if (INTERNAL.has(key)) return;
      const files = getPageFiles();
      if (!(key in files)) return;
      try { queueSave(key, JSON.parse(value)); } catch(e) {}
    };
  }

  // ── POLLING (detecta cambios de otros dispositivos) ────────────────────────
  let pollingInterval = null;
  let lastPollData    = null;

  function startPolling() {
    // Esperar 5s después del boot antes de empezar el polling
    setTimeout(() => {
      pollingInterval = setInterval(poll, 3000);
    }, 5000);
  }

  async function poll() {
    // No hacer polling si hay una operación en curso o el usuario está escribiendo
    if (isSaving || Object.keys(saveQueue).length > 0) return;

    try {
      const remoteAll = await apiGet();
      const files     = getPageFiles();
      let   changed   = false;

      for (const [lsKey, ghPath] of Object.entries(files)) {
        if (getPending()[lsKey]) continue;   // no sobreescribir pendientes

        const serverKey = toServerKey(ghPath);
        const remoteVal = remoteAll[serverKey];
        if (remoteVal === undefined) continue;

        const remoteStr = JSON.stringify(remoteVal);
        const localStr  = localStorage.getItem(lsKey);

        if (localStr !== remoteStr) {
          _originalSetItem(lsKey, remoteStr);
          changed = true;
        }
      }

      if (changed) {
        _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
        setState('ok');
        // Recargar para que la UI refleje los nuevos datos
        location.reload();
      }
    } catch(e) {
      // Servidor no disponible: no cambiar estado durante polling
      // (evita flicker si es un corte momentáneo)
    }
  }

  // ── DETECCIÓN DE RED ──────────────────────────────────────────────────────
  function watchOnlineStatus() {
    window.addEventListener('offline', () => setState('offline'));
    window.addEventListener('online', async () => {
      setState('busy', 'reconectando…');
      if (Object.keys(saveQueue).length) await flushQueue();
      if (hasPending()) await uploadPending();
      else setState('ok');
    });
  }

  // ── AVISO AL CERRAR CON PENDIENTES ────────────────────────────────────────
  function watchPageClose() {
    window.addEventListener('beforeunload', (e) => {
      if (Object.keys(saveQueue).length > 0 || hasPending() || isSaving) {
        e.preventDefault();
        e.returnValue = 'Hay datos sin sincronizar. ¿Cerrar de todas formas?';
      }
    });
  }

  // ── SUBIR PENDIENTES ──────────────────────────────────────────────────────
  async function uploadPending() {
    const pending = getPending();
    const files   = getPageFiles();
    if (!Object.keys(pending).length) { setState('ok'); return; }

    setState('busy', 'subiendo pendientes…');
    const payload = {};

    for (const lsKey of Object.keys(pending)) {
      const ghPath = files[lsKey];
      if (!ghPath) { clearPending(lsKey); continue; }
      const raw = localStorage.getItem(lsKey);
      if (!raw)  { clearPending(lsKey); continue; }
      const serverKey = toServerKey(ghPath);
      try { payload[serverKey] = JSON.parse(raw); } catch(e) {}
    }

    let errors = 0;
    if (Object.keys(payload).length) {
      try {
        await apiPost(payload);
        Object.keys(pending).forEach(k => clearPending(k));
      } catch(e) { errors++; }
    }

    _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
    setState(errors > 0 ? 'pending' : 'ok');
  }

  // ── DESHACER ──────────────────────────────────────────────────────────────
  async function undo() {
    const raw = localStorage.getItem(UNDO_KEY);
    if (!raw) {
      setState('error', 'nada que deshacer');
      setTimeout(() => setState(hasPending() ? 'pending' : 'ok'), 2500);
      return;
    }
    if (!confirm(
      '¿Restaurar al estado en que estaban los datos al abrir la página?\n' +
      'Esto revertirá todos los cambios de esta sesión.'
    )) return;

    setState('busy', 'deshaciendo…');
    try {
      const snapshot = JSON.parse(raw);
      const files    = getPageFiles();
      const payload  = {};

      for (const [lsKey, val] of Object.entries(snapshot)) {
        _originalSetItem(lsKey, val);
        const ghPath = files[lsKey];
        if (ghPath) {
          const serverKey = toServerKey(ghPath);
          try { payload[serverKey] = JSON.parse(val); } catch(e) {}
        }
      }

      if (Object.keys(payload).length) await apiPost(payload);

      localStorage.removeItem(UNDO_KEY);
      sessionStorage.removeItem('undo_captured');
      _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
      setState('ok');
      setTimeout(() => location.reload(), 800);
    } catch(e) {
      setState('error', 'error al deshacer');
      setTimeout(() => setState(hasPending() ? 'pending' : 'ok'), 3000);
    }
  }

  // ── API PÚBLICA ───────────────────────────────────────────────────────────
  window.SrvSync = {
    undo, uploadPending, flushQueue,
    openConfig, closeConfig, testConnection, saveConfig,
  };

  // Compatibilidad con código que llame window.GHSync
  window.GHSync = window.SrvSync;

})();
