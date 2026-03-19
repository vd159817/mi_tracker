/*
  server.js — servidor local para mi tracker
  ===========================================
  Endpoints:
    GET  /datos           → devuelve todos los datos actuales
    POST /guardar         → recibe un objeto y actualiza los datos
    GET  /datos/:seccion  → devuelve solo una sección (ej. /datos/sleep)
    GET  /health          → ping para verificar que el servidor está vivo

  Uso:
    node server.js
    node server.js --port 3001   (cambiar puerto)

  Instalar dependencias:
    npm install express cors
*/

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

// ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
const PORT      = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1] || '3000');
const DATA_FILE = path.join(__dirname, 'server_data.json');

const app = express();

// Permitir peticiones desde cualquier origen en la red local
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Servir los archivos HTML del tracker directamente
app.use(express.static(__dirname));

// ── HELPERS ────────────────────────────────────────────────────────────────
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch(e) {
    console.error('Error leyendo datos:', e.message);
    return {};
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch(e) {
    console.error('Error guardando datos:', e.message);
    return false;
  }
}

// ── ENDPOINTS ──────────────────────────────────────────────────────────────

// Ping — para que el frontend verifique si el servidor está disponible
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// GET todos los datos
app.get('/datos', (req, res) => {
  const data = readData();
  res.json(data);
});

// GET una sección específica
app.get('/datos/:seccion', (req, res) => {
  const data    = readData();
  const seccion = req.params.seccion;
  if (data[seccion] === undefined) {
    return res.status(404).json({ error: `sección '${seccion}' no encontrada` });
  }
  res.json(data[seccion]);
});

// POST guardar datos (merge — no sobreescribe secciones no enviadas)
app.post('/guardar', (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'body inválido, se espera JSON' });
  }

  const current = readData();

  // Merge inteligente: solo actualiza las claves recibidas
  const updated = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    updated[key] = value;
  }
  updated._lastModified = new Date().toISOString();

  const ok = writeData(updated);
  if (!ok) {
    return res.status(500).json({ error: 'error al escribir en disco' });
  }

  res.json({ ok: true, ts: updated._lastModified, keys: Object.keys(incoming) });
});

// ── INICIO ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  // Mostrar IPs disponibles para acceder desde otros dispositivos
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips  = [];
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`  mi tracker — servidor local`);
  console.log(`─────────────────────────────────────────`);
  console.log(`  localhost:     http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`  red local:     http://${ip}:${PORT}`);
  });
  console.log(`─────────────────────────────────────────`);
  console.log(`  datos en:      ${DATA_FILE}`);
  console.log(`  endpoints:`);
  console.log(`    GET  /health`);
  console.log(`    GET  /datos`);
  console.log(`    GET  /datos/:seccion`);
  console.log(`    POST /guardar`);
  console.log(`─────────────────────────────────────────\n`);
});
