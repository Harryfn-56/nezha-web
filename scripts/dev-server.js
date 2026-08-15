/**
 * Máy chủ phát triển (chỉ dùng thư viện chuẩn của Node.js - không cần cài gì).
 *   npm run dev       -> phục vụ thư mục public/ tại http://localhost:5173
 *   npm run preview   -> phục vụ thư mục dist/  tại http://localhost:4173
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const dirArg = process.argv[2] || 'public';
const portArg = Number(process.argv[3]) || Number(process.env.PORT) || 5173;
const SERVE_DIR = path.resolve(ROOT, dirArg);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  let filePath = path.join(SERVE_DIR, urlPath);

  // Chặn truy cập ra ngoài thư mục gốc
  if (!filePath.startsWith(SERVE_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  // SPA fallback: đường dẫn không có đuôi file -> trả về index.html
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    filePath = path.join(SERVE_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>Không tìm thấy: ' + urlPath + '</p>');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(portArg, () => {
  console.log('');
  console.log('  🔥 NeZha Chinese Center — Game ôn tập');
  console.log('  ➜  Thư mục: ' + path.relative(ROOT, SERVE_DIR) + '/');
  console.log('  ➜  Địa chỉ:  http://localhost:' + portArg);
  console.log('');
});
