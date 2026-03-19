/*
  historial.js — modal de historial reutilizable para tracker
  Incluir en hoy.html, estudio.html, alimentacion.html
  <script src="historial.js"></script>

  Uso desde cada página:
    Historial.show('sleep')     → sueño
    Historial.show('exercise')  → ejercicio
    Historial.show('study')     → estudio
    Historial.show('food')      → alimentación
*/

(function () {
  'use strict';

  // ── ESTILOS ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .hist-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.55); z-index: 500;
      align-items: flex-start; justify-content: center;
      padding: 1rem; overflow-y: auto;
    }
    .hist-overlay.open { display: flex; }

    .hist-modal {
      background: var(--surface); border: 0.5px solid var(--border2);
      border-radius: 12px; width: 100%; max-width: 680px;
      margin: auto; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    }

    .hist-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.25rem 0.875rem;
      border-bottom: 0.5px solid var(--border);
      background: var(--surface2);
    }
    .hist-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px; font-weight: 300; color: var(--text);
    }
    .hist-title span {
      font-size: 12px; font-family: 'DM Mono', monospace;
      color: var(--text3); margin-left: 8px; font-style: normal;
    }
    .hist-close {
      background: none; border: none; color: var(--text3);
      font-size: 18px; cursor: pointer; padding: 0 4px;
      transition: color 0.15s; line-height: 1;
    }
    .hist-close:hover { color: var(--text); }

    .hist-filters {
      display: flex; gap: 6px; padding: 0.75rem 1.25rem;
      border-bottom: 0.5px solid var(--border); flex-wrap: wrap;
      align-items: center;
    }
    .hist-filter-label {
      font-size: 10px; color: var(--text3);
      font-family: 'DM Mono', monospace; letter-spacing: 0.06em;
    }
    .hist-filter-btn {
      font-family: 'DM Mono', monospace; font-size: 10px;
      padding: 3px 10px; border-radius: 999px;
      border: 0.5px solid var(--border2); cursor: pointer;
      background: var(--surface); color: var(--text2);
      transition: all 0.15s;
    }
    .hist-filter-btn.active {
      background: var(--accent); color: #fff; border-color: var(--accent);
    }

    .hist-body {
      padding: 0.75rem 1.25rem 1.25rem;
      max-height: 60vh; overflow-y: auto;
    }

    .hist-empty {
      text-align: center; padding: 2.5rem 1rem;
      font-family: 'Cormorant Garamond', serif;
      font-size: 18px; color: var(--text3); font-style: italic;
    }

    .hist-table {
      width: 100%; border-collapse: collapse; font-size: 11px;
      font-family: 'DM Mono', monospace;
    }
    .hist-table th {
      text-align: left; padding: 5px 8px;
      font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--text3); border-bottom: 0.5px solid var(--border);
      white-space: nowrap;
    }
    .hist-table td {
      padding: 8px 8px; border-bottom: 0.5px solid var(--border);
      color: var(--text2); vertical-align: top;
    }
    .hist-table tr:last-child td { border-bottom: none; }
    .hist-table tr:hover td { background: var(--surface2); }

    .hist-date {
      font-size: 11px; color: var(--text); white-space: nowrap; font-weight: 500;
    }
    .hist-date-sub {
      font-size: 9px; color: var(--text3); margin-top: 2px;
    }
    .hist-val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 18px; font-weight: 300; line-height: 1; color: var(--accent);
    }
    .hist-tag {
      display: inline-block; font-size: 9px; padding: 2px 7px;
      border-radius: 999px; border: 0.5px solid var(--border2);
      color: var(--text3); margin: 1px 2px 1px 0;
    }
    .hist-tag.ok   { background: rgba(58,106,74,0.12); color: var(--normal); border-color: var(--normal); }
    .hist-tag.warn { background: rgba(180,110,40,0.12); color: var(--warn,#b46e28); border-color: var(--warn,#b46e28); }
    .hist-tag.bad  { background: rgba(184,64,48,0.12); color: var(--urgent); border-color: var(--urgent); }
    .hist-tag.blue { background: rgba(44,111,173,0.12); color: var(--soft); border-color: var(--soft); }
    .hist-tag.purple { background: rgba(122,74,154,0.12); color: #7a4a9a; border-color: #7a4a9a; }

    .hist-del {
      background: none; border: none; color: var(--text3);
      font-size: 12px; cursor: pointer; padding: 2px 4px;
      transition: color 0.15s; opacity: 0.5;
    }
    .hist-del:hover { color: var(--urgent); opacity: 1; }

    .hist-notes {
      font-size: 10px; color: var(--text3); font-style: italic;
      max-width: 200px; line-height: 1.4;
      overflow: hidden; display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }

    .hist-pill {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      font-size: 10px; font-weight: 600; border: 1.5px solid;
    }
    .hist-pill.q1 { color: var(--urgent); border-color: var(--urgent); background: rgba(184,64,48,0.08); }
    .hist-pill.q2 { color: var(--warn,#b46e28); border-color: var(--warn,#b46e28); background: rgba(180,110,40,0.08); }
    .hist-pill.q3 { color: #8a9a3a; border-color: #8a9a3a; background: rgba(138,154,58,0.08); }
    .hist-pill.q4 { color: var(--normal); border-color: var(--normal); background: rgba(58,106,74,0.08); }
    .hist-pill.q5 { color: var(--soft); border-color: var(--soft); background: rgba(44,111,173,0.08); }

    /* Responsive */
    @media (max-width: 600px) {
      .hist-modal { max-width: 100%; border-radius: 16px 16px 0 0; margin-top: auto; margin-bottom: 0; }
      .hist-table th:nth-child(n+4), .hist-table td:nth-child(n+4) { display: none; }
      .hist-body { max-height: 55vh; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML DEL MODAL ───────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.className = 'hist-overlay';
  overlay.id = 'hist-overlay';
  overlay.innerHTML = `
    <div class="hist-modal">
      <div class="hist-header">
        <div class="hist-title" id="hist-title">historial</div>
        <button class="hist-close" onclick="Historial.close()">✕</button>
      </div>
      <div class="hist-filters" id="hist-filters"></div>
      <div class="hist-body" id="hist-body"></div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) Historial.close(); });
  document.body.appendChild(overlay);

  // ── UTILIDADES ───────────────────────────────────────────────────────────
  const DIAS = ['dom','lun','mar','mié','jue','vie','sáb'];
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

  function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getDate()} ${MESES[d.getMonth()]}`;
  }
  function fmtDay(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return DIAS[d.getDay()];
  }
  function pill(val) {
    if (!val) return '<span style="color:var(--text3)">—</span>';
    const cls = val <= 1 ? 'q1' : val <= 2 ? 'q2' : val <= 3 ? 'q3' : val <= 4 ? 'q4' : 'q5';
    return `<span class="hist-pill ${cls}">${val}</span>`;
  }
  function tag(text, cls = '') {
    return `<span class="hist-tag ${cls}">${text}</span>`;
  }

  // ── ESTADO ───────────────────────────────────────────────────────────────
  let currentType = null;
  let currentFilter = 'all';

  // ── RENDERIZADORES POR TIPO ───────────────────────────────────────────────

  function renderSleep(data, filter) {
    let rows = [...data].sort((a,b) => b.date.localeCompare(a.date));
    if (filter === 'bad')  rows = rows.filter(r => r.hours < 6 || r.quality <= 2);
    if (filter === 'good') rows = rows.filter(r => r.hours >= 7.5 && r.quality >= 4);
    if (filter === '30')   rows = rows.slice(0, 30);
    if (!rows.length) return '<div class="hist-empty">sin registros</div>';

    let html = `<table class="hist-table">
      <thead><tr>
        <th>fecha</th><th>horas</th><th>calidad</th>
        <th>conciliar</th><th>despertar</th><th>sueño</th><th>notas</th><th></th>
      </tr></thead><tbody>`;

    for (const r of rows) {
      const dreamIcon = r.dreamType === 'pesadilla' ? '😨' :
                        r.dreamType === 'estresante' ? '😟' :
                        r.dreamType === 'bueno' ? '😊' : r.dreamType ? '😐' : '';
      html += `<tr>
        <td>
          <div class="hist-date">${fmtDate(r.date)}</div>
          <div class="hist-date-sub">${fmtDay(r.date)}</div>
        </td>
        <td><span class="hist-val">${r.hours || '—'}</span><span style="font-size:9px;color:var(--text3)">h</span></td>
        <td>${pill(r.quality)}</td>
        <td>${pill(r.conciliation)}</td>
        <td>${pill(r.wakeFeeling)}</td>
        <td>${dreamIcon ? tag(dreamIcon + ' ' + (r.dreamType || ''), '') : '<span style="color:var(--text3)">—</span>'}</td>
        <td><div class="hist-notes">${r.obs || r.dreamText || ''}</div></td>
        <td><button class="hist-del" title="eliminar" onclick="Historial._del('sleep','${r.date}')">✕</button></td>
      </tr>`;
    }
    return html + '</tbody></table>';
  }

  function renderExercise(data, filter) {
    let rows = [...data].sort((a,b) => b.date.localeCompare(a.date));
    if (filter === 'upper') rows = rows.filter(r => r.tren === 'superior');
    if (filter === 'lower') rows = rows.filter(r => r.tren === 'inferior');
    if (filter === 'full')  rows = rows.filter(r => r.tren === 'full');
    if (filter === '30')    rows = rows.slice(0, 30);
    if (!rows.length) return '<div class="hist-empty">sin registros</div>';

    let html = `<table class="hist-table">
      <thead><tr>
        <th>fecha</th><th>tren</th><th>ejercicios</th>
        <th>rir</th><th>peso</th><th>checks</th><th>notas</th><th></th>
      </tr></thead><tbody>`;

    for (const r of rows) {
      const exList = (r.exercises || []).slice(0,3).map(e => e.name).join(', ');
      const checksOk = [r.ateWell && 'comida', r.sleptWell && 'sueño', r.goodTech && 'técnica', r.usedWeight && 'peso+']
                        .filter(Boolean);
      html += `<tr>
        <td>
          <div class="hist-date">${fmtDate(r.date)}</div>
          <div class="hist-date-sub">${fmtDay(r.date)} · sem ${r.week || '?'}</div>
        </td>
        <td>${r.tren ? tag(r.tren, r.tren === 'superior' ? 'blue' : r.tren === 'inferior' ? 'ok' : 'purple') : '—'}</td>
        <td style="font-size:10px;color:var(--text2);max-width:130px;">${exList || '—'}</td>
        <td>${r.rir != null ? r.rir : '—'}</td>
        <td>${r.weight ? `<span class="hist-val" style="font-size:15px">${r.weight}</span><span style="font-size:9px;color:var(--text3)">kg</span>` : '—'}</td>
        <td>${checksOk.map(c => tag(c,'ok')).join('') || '—'}</td>
        <td><div class="hist-notes">${r.notes || ''}</div></td>
        <td><button class="hist-del" title="eliminar" onclick="Historial._del('exercise','${r.date}')">✕</button></td>
      </tr>`;
    }
    return html + '</tbody></table>';
  }

  function renderStudy(data, filter) {
    let rows = [...data].sort((a,b) => b.date.localeCompare(a.date));
    if (filter === 'auto') rows = rows.filter(r => r.context?.auto);
    if (filter === 'uni')  rows = rows.filter(r => r.context?.uni);
    if (filter === '30')   rows = rows.slice(0, 30);
    if (!rows.length) return '<div class="hist-empty">sin registros</div>';

    let html = `<table class="hist-table">
      <thead><tr>
        <th>fecha</th><th>horas</th><th>materia</th>
        <th>calidad</th><th>concentración</th><th>páginas</th><th>notas</th><th></th>
      </tr></thead><tbody>`;

    for (const r of rows) {
      const ctx = r.context?.auto && r.context?.uni ? tag('ambos','blue') :
                  r.context?.auto ? tag('auto','blue') :
                  r.context?.uni  ? tag('uni','purple') : '';
      const hrs = r.totalHours ? (r.totalHours).toFixed(1) : '—';
      html += `<tr>
        <td>
          <div class="hist-date">${fmtDate(r.date)}</div>
          <div class="hist-date-sub">${fmtDay(r.date)}</div>
        </td>
        <td><span class="hist-val">${hrs}</span><span style="font-size:9px;color:var(--text3)">h</span></td>
        <td style="font-size:10px;max-width:120px;">
          ${ctx}
          <div style="margin-top:2px;color:var(--text)">${r.subject || '—'}</div>
          <div style="color:var(--text3)">${(r.types||[]).join(' · ')}</div>
        </td>
        <td>${pill(r.calidad)}</td>
        <td>${pill(r.concentracion)}</td>
        <td>${r.pages || '—'}</td>
        <td><div class="hist-notes">${r.obs || ''}</div></td>
        <td><button class="hist-del" title="eliminar" onclick="Historial._del('study','${r.date}')">✕</button></td>
      </tr>`;
    }
    return html + '</tbody></table>';
  }

  function renderFood(data, filter) {
    let rows = [...data].sort((a,b) => b.date.localeCompare(a.date));
    if (filter === 'ok')   rows = rows.filter(r => r.totals?.kcal >= 1200 && r.totals?.kcal <= 1700);
    if (filter === 'low')  rows = rows.filter(r => r.totals?.kcal < 1200);
    if (filter === 'high') rows = rows.filter(r => r.totals?.kcal > 1700);
    if (filter === '30')   rows = rows.slice(0, 30);
    if (!rows.length) return '<div class="hist-empty">sin registros</div>';

    let html = `<table class="hist-table">
      <thead><tr>
        <th>fecha</th><th>kcal</th><th>proteína</th>
        <th>carbs</th><th>grasa</th><th>extras</th><th></th>
      </tr></thead><tbody>`;

    for (const r of rows) {
      const t = r.totals || {};
      const kcalCls = !t.kcal ? '' : t.kcal < 1200 ? 'warn' : t.kcal > 1700 ? 'bad' : 'ok';
      const protCls = !t.prot ? '' : t.prot >= 70 ? 'ok' : 'warn';
      const extras = (r.extras || []).slice(0,2).map(e => e.name || e).join(', ');
      html += `<tr>
        <td>
          <div class="hist-date">${fmtDate(r.date)}</div>
          <div class="hist-date-sub">${fmtDay(r.date)}</div>
        </td>
        <td>${t.kcal ? `<span class="hist-tag ${kcalCls}">${Math.round(t.kcal)} kcal</span>` : '—'}</td>
        <td>${t.prot ? `<span class="hist-tag ${protCls}">${Math.round(t.prot)}g</span>` : '—'}</td>
        <td>${t.carb ? `${Math.round(t.carb)}g` : '—'}</td>
        <td>${t.fat  ? `${Math.round(t.fat)}g` : '—'}</td>
        <td style="font-size:10px;color:var(--text3);max-width:120px;">${extras || '—'}</td>
        <td><button class="hist-del" title="eliminar" onclick="Historial._del('food','${r.date}')">✕</button></td>
      </tr>`;
    }
    return html + '</tbody></table>';
  }

  // ── FILTROS POR TIPO ─────────────────────────────────────────────────────
  const FILTERS = {
    sleep:    [['all','todos'],['good','buenas noches'],['bad','malas noches'],['30','últimos 30']],
    exercise: [['all','todos'],['upper','tren superior'],['lower','tren inferior'],['full','full body'],['30','últimos 30']],
    study:    [['all','todos'],['auto','autodidacta'],['uni','universidad'],['30','últimos 30']],
    food:     [['all','todos'],['ok','en rango'],['low','bajo'],['high','exceso'],['30','últimos 30']],
  };

  const TITLES = {
    sleep: 'sueño', exercise: 'ejercicio', study: 'estudio', food: 'alimentación'
  };

  // ── API PÚBLICA ───────────────────────────────────────────────────────────
  function show(type) {
    currentType = type;
    currentFilter = 'all';
    document.getElementById('hist-title').innerHTML =
      `historial <span>${TITLES[type] || type}</span>`;
    _renderFilters();
    _renderBody();
    document.getElementById('hist-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('hist-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function _renderFilters() {
    const filters = FILTERS[currentType] || [['all','todos']];
    document.getElementById('hist-filters').innerHTML = filters.map(([val, label]) =>
      `<button class="hist-filter-btn ${val === currentFilter ? 'active' : ''}"
         onclick="Historial._setFilter('${val}')">${label}</button>`
    ).join('');
  }

  function _setFilter(val) {
    currentFilter = val;
    _renderFilters();
    _renderBody();
  }

  function _renderBody() {
    const data = _getData(currentType);
    let html = '';
    if (currentType === 'sleep')    html = renderSleep(data, currentFilter);
    if (currentType === 'exercise') html = renderExercise(data, currentFilter);
    if (currentType === 'study')    html = renderStudy(data, currentFilter);
    if (currentType === 'food')     html = renderFood(data, currentFilter);
    document.getElementById('hist-body').innerHTML = html;
  }

  function _getData(type) {
    const keys = { sleep: 'tracker_sleep', exercise: 'tracker_exercise',
                   study: 'tracker_study', food: 'food_data' };
    try { return JSON.parse(localStorage.getItem(keys[type]) || '[]'); } catch(e) { return []; }
  }

  function _del(type, date) {
    if (!confirm(`¿Eliminar el registro del ${fmtDate(date)}?`)) return;
    const keys = { sleep: 'tracker_sleep', exercise: 'tracker_exercise',
                   study: 'tracker_study', food: 'food_data' };
    const lsKey = keys[type];
    let data = _getData(type).filter(r => r.date !== date);
    localStorage.setItem(lsKey, JSON.stringify(data));

    // Sincronizar con GitHub si hay token
    const cfg = window.config || JSON.parse(localStorage.getItem('tracker_config') || '{}');
    if (cfg.token && window.saveToGitHub) {
      const ghPaths = { sleep: 'data/sleep.json', exercise: 'data/exercise.json',
                        study: 'data/study.json', food: 'data/food.json' };
      window.saveToGitHub(ghPaths[type], data).catch(console.error);
    }
    _renderBody();
  }

  window.Historial = { show, close, _del, _setFilter, _renderBody };
})();
