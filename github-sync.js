/*
  github-sync.js — sincronización automática con GitHub
  ======================================================
  Fuente de verdad: GitHub
  localStorage: caché local + respaldo offline

  Comportamiento:
  - Al cargar la página → fetch desde GitHub → reemplaza localStorage
  - Al guardar datos   → localStorage inmediato + push a GitHub (debounce 800ms)
  - Sin conexión       → guarda local + marca como pendiente
  - Al recuperar red   → sube pendientes automáticamente
  - Barra de estado    → dot + texto: "sincronizado" / "pendiente" / "sin conexión"

  Requiere en cada página:
    window.PAGE_FILES = { lsKey: 'data/archivo.json', ... }
*/

(function () {
  'use strict';

  const PENDING_KEY   = 'tracker_sync_pending';
  const LAST_SYNC_KEY = 'tracker_last_sync';
  const RELOAD_GUARD  = 'tracker_reload_guard';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    injectStyles();
    injectSyncBar();
    await bootSync();
    watchOnlineStatus();
    interceptLocalSaves();
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
      .btn-sync-undo {
        font-family: 'DM Mono', monospace; font-size: 10px;
        padding: 3px 10px; border-radius: 5px;
        border: 0.5px solid var(--border2); cursor: pointer;
        background: var(--surface); color: var(--text3); transition: all 0.15s;
      }
      .btn-sync-undo:hover { color: var(--urgent,#b84030); border-color: var(--urgent,#b84030); }
      @media (max-width: 480px) {
        .sync-bar { padding: 4px 1rem; }
        .sync-label { font-size: 9px; }
      }

      /* ── FOOTER DE ESTADO ── */
      .sync-footer {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        font-size: 13px;
        color: var(--text3, #aaa89f);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.4s ease;
        white-space: nowrap;
        z-index: 50;
        letter-spacing: 0.02em;
      }
      .sync-footer.visible { opacity: 1; }
    `;
    document.head.appendChild(s);
  }

  // ── BARRA ─────────────────────────────────────────────────────────────────
  function injectSyncBar() {
    setTimeout(() => {
      const topBar = document.querySelector('.top-bar');
      if (!topBar) return;
      const bar = document.createElement('div');
      bar.className = 'sync-bar';
      bar.id = 'sync-bar';
      bar.innerHTML = `
        <div class="sync-indicator">
          <div class="sync-dot busy" id="sync-dot"></div>
          <span class="sync-label" id="sync-label">iniciando…</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="sync-time" id="sync-time"></span>
          <button class="btn-sync-undo" onclick="window.GHSync.undo()" title="deshacer último guardado">↩ deshacer</button>
        </div>
      `;
      topBar.insertAdjacentElement('afterend', bar);

      // Footer de estado al final de la página
      const footer = document.createElement('div');
      footer.className = 'sync-footer';
      footer.id = 'sync-footer';
      document.body.appendChild(footer);
    }, 40);
  }

  // ── FOOTER DE ESTADO (texto al final de la página) ──────────────────────
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
      offline: { cls: 'offline', text: 'sin conexión' },
      busy:    { cls: 'busy',    text: detail || 'sincronizando…' },
      error:   { cls: 'error',   text: detail || 'error de sync' },
    };
    const s = map[state] || map.ok;
    dot.className     = `sync-dot ${s.cls}`;
    label.textContent = s.text;
    if (state === 'ok') {
      const last = localStorage.getItem(LAST_SYNC_KEY);
      if (last && time) {
        const d = new Date(last);
        const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
        const isToday = new Date().toDateString() === d.toDateString();
        time.textContent = isToday ? hm : `${d.getDate()}/${d.getMonth()+1} ${hm}`;
        // Mostrar footer solo si fue un guardado real (no la carga inicial)
        if (window._syncBootDone) showFooter(`guardado a las ${hm}`);
      }
    } else if (state === 'error') {
      showFooter(detail || 'error al guardar', 4000);
      if (time) time.textContent = '';
    } else if (time) {
      time.textContent = '';
    }
  }

  // ── UTILIDADES ────────────────────────────────────────────────────────────
  function getCfg()   { return window.config || JSON.parse(localStorage.getItem('tracker_config') || '{}'); }
  function getRepo()  { return window.REPO || getCfg().repo || 'vd159817/mi_tracker'; }
  function getToken() { return getCfg().token || ''; }

  function getPageFiles() {
    return (window.PAGE_FILES && Object.keys(window.PAGE_FILES).length)
      ? window.PAGE_FILES : {};
  }

  function getPending()    { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '{}'); } catch(e) { return {}; } }
  function setPending(o)   { localStorage.setItem(PENDING_KEY, JSON.stringify(o)); }
  function markPending(k)  { const p = getPending(); p[k] = true; setPending(p); }
  function clearPending(k) { const p = getPending(); delete p[k]; setPending(p); }
  function hasPending()    { return Object.keys(getPending()).length > 0; }

  // ── GITHUB API ────────────────────────────────────────────────────────────
  async function ghGet(path) {
    const token = getToken();
    if (!token) return null;
    const r = await fetch(
      `https://api.github.com/repos/${getRepo()}/contents/${path}`,
      { headers: { Authorization: `token ${token}` } }
    );
    return r.ok ? r.json() : null;
  }

  async function ghPut(path, data, msg) {
    const token = getToken();
    if (!token) throw new Error('sin token');
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    let sha = '';
    try { const ex = await ghGet(path); if (ex?.sha) sha = ex.sha; } catch(e) {}
    const body = { message: msg || `sync ${path} · ${new Date().toISOString().slice(0,16)}`, content };
    if (sha) body.sha = sha;
    const r = await fetch(
      `https://api.github.com/repos/${getRepo()}/contents/${path}`,
      { method:'PUT', headers:{ Authorization:`token ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify(body) }
    );
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.message || `HTTP ${r.status}`); }
    return r.json();
  }

  // ── CARGA INICIAL ─────────────────────────────────────────────────────────
  async function bootSync() {
    if (!getToken()) { setState('offline', 'configura tu token en ⚙ config'); window._syncBootDone = true; return; }
    if (!navigator.onLine) {
      setState(hasPending() ? 'pending' : 'offline'); window._syncBootDone = true;
      return;
    }

    // Guard contra reload loop
    const guard = parseInt(sessionStorage.getItem(RELOAD_GUARD) || '0');
    const justReloaded = (Date.now() - guard) < 3000;

    setState('busy', 'cargando desde github…');

    const entries = Object.entries(getPageFiles());
    if (!entries.length) { setState('ok'); return; }

    let changed = false;

    await Promise.all(entries.map(async ([lsKey, ghPath]) => {
      try {
        const remote = await ghGet(ghPath);
        if (!remote?.content) return;
        const remoteStr = JSON.stringify(
          JSON.parse(decodeURIComponent(escape(atob(remote.content))))
        );
        if (localStorage.getItem(lsKey) !== remoteStr) {
          _originalSetItem(lsKey, remoteStr);
          changed = true;
        }
      } catch(e) {}
    }));

    _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
    setState('ok');
    window._syncBootDone = true;   // a partir de aquí el footer sí aparece

    // Recargar si hubo cambios remotos (una sola vez)
    if (changed && !justReloaded) {
      sessionStorage.setItem(RELOAD_GUARD, String(Date.now()));
      location.reload();
    }
  }

  // ── COLA DE GUARDADO (debounce 800ms) ────────────────────────────────────
  let saveQueue  = {};
  let saveTimer  = null;
  let isSaving   = false;

  function queueSave(lsKey, data) {
    saveQueue[lsKey] = data;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushQueue, 800);
  }

  async function flushQueue() {
    if (isSaving || !Object.keys(saveQueue).length) return;
    if (!navigator.onLine) {
      Object.keys(saveQueue).forEach(k => markPending(k));
      saveQueue = {};
      setState('offline');
      return;
    }
    isSaving = true;
    setState('busy', 'guardando…');

    const toSave = { ...saveQueue };
    saveQueue    = {};
    const files  = getPageFiles();
    let errors   = 0;

    // Snapshot para undo
    const snapshot = {};
    Object.keys(toSave).forEach(k => { const v = localStorage.getItem(k); if (v) snapshot[k] = v; });
    if (Object.keys(snapshot).length) _originalSetItem('tracker_undo_snapshot', JSON.stringify(snapshot));

    for (const [lsKey, data] of Object.entries(toSave)) {
      const ghPath = files[lsKey];
      if (!ghPath) continue;
      try { await ghPut(ghPath, data); clearPending(lsKey); }
      catch(e) { markPending(lsKey); errors++; }
    }

    isSaving = false;
    _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
    setState(errors > 0 || hasPending() ? 'pending' : 'ok');
  }

  // ── INTERCEPTAR localStorage.setItem ─────────────────────────────────────
  const _originalSetItem = localStorage.setItem.bind(localStorage);

  function interceptLocalSaves() {
    const INTERNAL = new Set([
      PENDING_KEY, LAST_SYNC_KEY, RELOAD_GUARD,
      'tracker_undo_snapshot', 'tracker_config', 'tracker_theme',
      'tracker_last_sync', 'tracker_sync_pending',
    ]);

    localStorage.setItem = function(key, value) {
      _originalSetItem(key, value);
      if (!getToken()) return;
      if (INTERNAL.has(key)) return;
      const files = getPageFiles();
      if (!(key in files)) return;
      try { queueSave(key, JSON.parse(value)); } catch(e) {}
    };
  }

  // ── DETECCIÓN DE RED ──────────────────────────────────────────────────────
  function watchOnlineStatus() {
    window.addEventListener('offline', () => setState('offline'));
    window.addEventListener('online',  async () => {
      setState('busy', 'recuperando conexión…');
      hasPending() ? await uploadPending() : setState('ok');
    });
  }

  // ── SUBIR PENDIENTES ──────────────────────────────────────────────────────
  async function uploadPending() {
    const pending = getPending();
    const files   = getPageFiles();
    if (!Object.keys(pending).length) { setState('ok'); return; }
    setState('busy', 'subiendo pendientes…');
    let errors = 0;
    for (const lsKey of Object.keys(pending)) {
      const ghPath = files[lsKey];
      if (!ghPath) { clearPending(lsKey); continue; }
      const raw = localStorage.getItem(lsKey);
      if (!raw)  { clearPending(lsKey); continue; }
      try { await ghPut(ghPath, JSON.parse(raw), `sync pendiente: ${ghPath}`); clearPending(lsKey); }
      catch(e)   { errors++; }
    }
    _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
    setState(errors > 0 ? 'pending' : 'ok');
  }

  // ── DESHACER ──────────────────────────────────────────────────────────────
  async function undo() {
    const raw = localStorage.getItem('tracker_undo_snapshot');
    if (!raw) {
      setState('error', 'nada que deshacer');
      setTimeout(() => setState(hasPending() ? 'pending' : 'ok'), 2500);
      return;
    }
    if (!confirm('¿Restaurar al estado anterior al último guardado?')) return;
    setState('busy', 'deshaciendo…');
    try {
      const snapshot = JSON.parse(raw);
      const files    = getPageFiles();
      for (const [lsKey, val] of Object.entries(snapshot)) {
        _originalSetItem(lsKey, val);
        const ghPath = files[lsKey];
        if (ghPath) {
          try { await ghPut(ghPath, JSON.parse(val), `undo · ${ghPath}`); }
          catch(e) { markPending(lsKey); }
        }
      }
      localStorage.removeItem('tracker_undo_snapshot');
      _originalSetItem(LAST_SYNC_KEY, new Date().toISOString());
      setState('ok');
      setTimeout(() => location.reload(), 800);
    } catch(e) {
      setState('error', 'error al deshacer');
      setTimeout(() => setState(hasPending() ? 'pending' : 'ok'), 3000);
    }
  }

  // ── API PÚBLICA ───────────────────────────────────────────────────────────
  window.GHSync = { undo, uploadPending, flushQueue };

})();
