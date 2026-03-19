/*
  server.js — servidor local para mi tracker
  ===========================================
  Endpoints:
    GET  /health          → ping
    GET  /datos           → todos los datos
    GET  /datos/:seccion  → una sección
    POST /guardar         → guarda/actualiza datos

  Uso:
    node server.js
    node server.js --port=3001

  Instalar:
    npm install express cors
*/

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const PORT      = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1] || '3000');
const DATA_FILE = path.join(__dirname, 'server_data.json');

const app = express();

// ── CORS EXPLÍCITO ────────────────────────────────────────────────────────
// Configuración manual (no solo el middleware cors) para máxima compatibilidad
// con WebView de tablets y navegadores con restricciones.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Max-Age':       '86400',   // cache preflight 24h
};

// Aplicar CORS a todas las respuestas
app.use((req, res, next) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  // Responder preflight OPTIONS inmediatamente
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// ── BODY PARSER ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
// Aceptar también text/plain con JSON dentro (algunos WebView mandan esto)
app.use(express.text({ type: 'text/plain', limit: '10mb' }));

// ── MIDDLEWARE DE LOGS ────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const ip    = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?';

  res.on('finish', () => {
    const ms      = Date.now() - start;
    const status  = res.statusCode;
    const color   = status >= 500 ? '\x1b[31m'   // rojo
                  : status >= 400 ? '\x1b[33m'   // amarillo
                  : status >= 200 ? '\x1b[32m'   // verde
                  : '\x1b[0m';
    const reset   = '\x1b[0m';
    console.log(`${color}${status}${reset} ${req.method} ${req.path} — ${ip} — ${ms}ms`);
  });

  next();
});

// ── ARCHIVOS ESTÁTICOS ────────────────────────────────────────────────────
app.use(express.static(__dirname));

// ── HELPERS ───────────────────────────────────────────────────────────────
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch(e) {
    console.error('[ERROR] leyendo datos:', e.message);
    return {};
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch(e) {
    console.error('[ERROR] guardando datos:', e.message);
    return false;
  }
}

// Parsear body que puede venir como string (WebView compatibility)
function parseBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(e) { return null; }
  }
  return req.body;
}

// ── ENDPOINTS ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString(), server: 'mi-tracker' });
});

app.get('/datos', (req, res) => {
  res.json(readData());
});

app.get('/datos/:seccion', (req, res) => {
  const data    = readData();
  const seccion = req.params.seccion;
  if (data[seccion] === undefined) {
    return res.status(404).json({ error: `sección '${seccion}' no encontrada` });
  }
  res.json(data[seccion]);
});

app.post('/guardar', (req, res) => {
  const incoming = parseBody(req);

  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    console.error('[ERROR] body inválido:', typeof req.body, req.body?.slice?.(0, 100));
    return res.status(400).json({ error: 'body inválido, se espera JSON' });
  }

  const current = readData();
  const updated = { ...current, ...incoming, _lastModified: new Date().toISOString() };

  if (!writeData(updated)) {
    return res.status(500).json({ error: 'error al escribir en disco' });
  }

  console.log(`[GUARDADO] claves: ${Object.keys(incoming).join(', ')}`);
  res.json({ ok: true, ts: updated._lastModified, keys: Object.keys(incoming) });
});

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `ruta no encontrada: ${req.method} ${req.path}` });
});

// ── INICIO ────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips  = [];
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }

  console.log('\n─────────────────────────────────────────────────');
  console.log('  mi tracker · servidor local');
  console.log('─────────────────────────────────────────────────');
  console.log(`  localhost:   http://localhost:${PORT}`);
  ips.forEach(ip => console.log(`  red local:   http://${ip}:${PORT}  ← usar en tablet`));
  console.log('─────────────────────────────────────────────────');
  console.log(`  datos:       ${DATA_FILE}`);
  console.log('─────────────────────────────────────────────────\n');

  // Recordatorio si solo hay loopback
  if (ips.length === 0) {
    console.warn('⚠  No se detectó IP de red local. ¿Estás conectada a WiFi?');
  }
});
