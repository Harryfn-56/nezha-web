/**
 * MÁY CHỦ SUPABASE GIẢ — chỉ dùng để KIỂM THỬ trên máy, không đưa lên web.
 *
 * Bắt chước vừa đủ phần REST của Supabase (PostgREST) mà website dùng, để
 * chạy thử phòng Kahoot nhiều máy mà không cần tài khoản Supabase thật.
 * Nhờ nó mới kiểm tra được lỗi "máy học sinh lệch giờ làm đồng hồ chạy hụt".
 *
 *   node scripts/fake-supabase.js        → chạy ở http://localhost:5175
 */
import http from 'node:http';

const PORT = Number(process.env.PORT || 5175);
const db = {
  classes: [], students: [], teachers: [], scores: [], lessons: [],
  rooms: [], room_players: [],
};
const PK = { classes: 'code', students: 'id', teachers: 'username', lessons: 'id', rooms: 'pin', room_players: 'id', scores: null };

/** ?pin=eq.123&order=score.desc&limit=5&select=* */
function parseQuery(url) {
  const q = new URL(url, 'http://x').searchParams;
  const filters = [];
  let order = null;
  let limit = null;
  for (const [k, v] of q.entries()) {
    if (k === 'select') continue;
    if (k === 'order') { order = v; continue; }
    if (k === 'limit') { limit = Number(v); continue; }
    const m = String(v).match(/^eq\.(.*)$/);
    if (m) filters.push([k, decodeURIComponent(m[1])]);
  }
  return { filters, order, limit };
}

function applyQuery(rows, { filters, order, limit }) {
  let out = rows.filter((r) => filters.every(([k, v]) => String(r[k]) === v));
  if (order) {
    for (const part of order.split(',').reverse()) {
      const [field, dir] = part.split('.');
      out = out.slice().sort((a, b) => {
        const x = a[field], y = b[field];
        const c = typeof x === 'number' && typeof y === 'number'
          ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
        return dir === 'desc' ? -c : c;
      });
    }
  }
  if (limit) out = out.slice(0, limit);
  return out;
}

const server = http.createServer((req, res) => {
  const [, rest, ver, table] = req.url.split('?')[0].split('/');
  const send = (code, body) => {
    res.writeHead(code, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Expose-Headers': 'Date',
    });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };

  if (req.method === 'OPTIONS') return send(204);
  if (rest !== 'rest' || ver !== 'v1' || !db[table]) return send(404, { message: 'no table ' + table });

  const q = parseQuery(req.url);
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : null;

    if (req.method === 'GET') return send(200, applyQuery(db[table], q));

    if (req.method === 'POST') {
      const rows = Array.isArray(body) ? body : [body];
      const pk = PK[table];
      for (const row of rows) {
        if (pk) {
          const i = db[table].findIndex((r) => String(r[pk]) === String(row[pk]));
          if (i >= 0) { db[table][i] = { ...db[table][i], ...row }; continue; }
        }
        db[table].push({ ...row });
      }
      return send(201, rows);
    }

    if (req.method === 'PATCH') {
      const hit = applyQuery(db[table], q);
      hit.forEach((r) => Object.assign(r, body));
      return send(200, hit);
    }

    if (req.method === 'DELETE') {
      const hit = new Set(applyQuery(db[table], q));
      db[table] = db[table].filter((r) => !hit.has(r));
      return send(204);
    }

    send(405, { message: 'method' });
  });
});

server.listen(PORT, () => {
  console.log(`  🧪 Supabase giả đang chạy ở http://localhost:${PORT}  (chỉ để kiểm thử)`);
});
