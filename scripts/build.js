/**
 * Build production — chỉ dùng thư viện chuẩn của Node.js.
 *
 * Việc build làm những gì:
 *  1. Xoá và tạo lại thư mục dist/
 *  2. Chép toàn bộ public/ sang dist/
 *  3. Rút gọn (minify) CSS và JS ở mức an toàn: bỏ chú thích + khoảng trắng thừa
 *  4. Gắn "?v=<hash>" vào các link css/js trong index.html để trình duyệt học sinh
 *     luôn tải bản mới nhất sau khi giáo viên cập nhật (cache busting)
 *  5. Tạo file .htaccess cho Hostinger (SPA routing + nén + cache)
 *
 * Kết quả: thư mục dist/ là một website tĩnh hoàn chỉnh, tải thẳng lên
 * public_html của Hostinger là chạy.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'dist');

const log = (msg) => console.log('  ' + msg);

/* ---------------------------------------------------------------- utils */

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function walk(dir, base = dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, acc);
    else acc.push(path.relative(base, full));
  }
  return acc;
}

/** Minify CSS an toàn: bỏ comment và khoảng trắng thừa. */
function minifyCss(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

/**
 * Minify JS ở mức bảo thủ: chỉ bỏ comment và khoảng trắng đầu/cuối dòng.
 * Không đụng vào chuỗi, template literal, regex — an toàn tuyệt đối.
 */
function minifyJs(code) {
  const out = [];
  let i = 0;
  let line = '';
  const flush = () => {
    const t = line.trim();
    if (t) out.push(t);
    line = '';
  };
  while (i < code.length) {
    const c = code[i];
    const n = code[i + 1];

    // chuỗi '...' "..." `...`
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let s = c;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') { s += code[i] + code[i + 1]; i += 2; continue; }
        s += code[i];
        if (code[i] === quote) { i++; break; }
        i++;
      }
      line += s;
      continue;
    }
    // comment dòng
    if (c === '/' && n === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    // comment khối
    if (c === '/' && n === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '\n') { flush(); i++; continue; }
    line += c;
    i++;
  }
  flush();
  return out.join('\n');
}

function shortHash(text) {
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
}

/* ---------------------------------------------------------------- build */

console.log('');
log('🔥 Đang build NeZha Chinese Center...');
rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

const files = walk(SRC);
let jsCount = 0;
let cssCount = 0;
const hashParts = [];

for (const rel of files) {
  const from = path.join(SRC, rel);
  const to = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });

  const ext = path.extname(rel).toLowerCase();
  if (ext === '.js') {
    const code = fs.readFileSync(from, 'utf8');
    const min = minifyJs(code);
    hashParts.push(min);
    fs.writeFileSync(to, min);
    jsCount++;
  } else if (ext === '.css') {
    const code = fs.readFileSync(from, 'utf8');
    const min = minifyCss(code);
    hashParts.push(min);
    fs.writeFileSync(to, min);
    cssCount++;
  } else {
    fs.copyFileSync(from, to);
  }
}

// Cache busting cho index.html
const version = shortHash(hashParts.join('\n'));
const indexPath = path.join(OUT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html
  .replace(/(href="\/css\/[^"?]+\.css)"/g, `$1?v=${version}"`)
  .replace(/(src="\/js\/[^"?]+\.js)"/g, `$1?v=${version}"`)
  .replace('<!--BUILD_VERSION-->', version);
fs.writeFileSync(indexPath, html);

// Nội dung index.html cần cho ESM cache busting của các module con
fs.writeFileSync(path.join(OUT, 'version.txt'), version + '\n');

/* -------------------------------------------------- .htaccess Hostinger */

const htaccess = `# NeZha Chinese Center — cấu hình cho Hostinger (Apache/LiteSpeed)

# --- Điều hướng SPA: mọi đường dẫn không phải file thật đều trả về index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# --- Kiểu MIME đúng cho ES Module
AddType text/javascript .js
AddType application/manifest+json .webmanifest

# --- Nén để tải nhanh trên mạng lớp học
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

# --- Bộ nhớ đệm: ảnh/font cache lâu, HTML không cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/css "access plus 7 days"
  ExpiresByType text/javascript "access plus 7 days"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# --- Bảo mật cơ bản
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# --- Ép HTTPS (bỏ dấu # ở 3 dòng dưới sau khi đã bật SSL trong hPanel)
# RewriteCond %{HTTPS} off
# RewriteCond %{HTTP:X-Forwarded-Proto} !https
# RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
`;
fs.writeFileSync(path.join(OUT, '.htaccess'), htaccess);

/* ------------------------------------ cấu hình cho các host miễn phí */

/*
 * LƯU Ý QUAN TRỌNG VỀ CLOUDFLARE
 * Cloudflare (Workers Static Assets) KHÔNG chấp nhận luật "/* -> /index.html 200"
 * trong file _redirects — nó báo lỗi "Infinite loop detected".
 * Với Cloudflare, việc điều hướng SPA được khai báo trong wrangler.jsonc:
 *     "assets": { "not_found_handling": "single-page-application" }
 * Vì vậy chỉ tạo _redirects / _headers khi build trên Netlify.
 */
const isNetlify = !!(process.env.NETLIFY || process.env.NETLIFY_BUILD_BASE);
if (isNetlify) {
  // Netlify: mọi đường dẫn không phải file thật -> index.html
  fs.writeFileSync(path.join(OUT, '_redirects'), '/*    /index.html   200\n');
  // Netlify: thêm kiểu MIME đúng cho ES Module
  fs.writeFileSync(path.join(OUT, '_headers'),
    '/js/*\n  Content-Type: text/javascript; charset=utf-8\n');
}

// Vercel
fs.writeFileSync(path.join(OUT, 'vercel.json'), JSON.stringify({
  cleanUrls: true,
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
}, null, 2) + '\n');

// GitHub Pages: không có cấu hình máy chủ, dùng mẹo 404.html = index.html
fs.copyFileSync(indexPath, path.join(OUT, '404.html'));
// và .nojekyll để GitHub không bỏ qua các file/thư mục bắt đầu bằng dấu _
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

/* ---------------------------------------------------------------- xong */

const total = walk(OUT).length;
const bytes = walk(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);

log(`✅ Đã build xong: ${jsCount} file JS, ${cssCount} file CSS, tổng ${total} file`);
log(`📦 Dung lượng: ${(bytes / 1024).toFixed(0)} KB`);
log(`🏷️  Phiên bản: ${version}`);
log(`📁 Thư mục xuất: dist/  → tải toàn bộ nội dung này lên public_html của Hostinger`);
console.log('');
