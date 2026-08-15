/**
 * NHẬP BÀI HỌC TỪ FILE — Word (.docx), text (.txt/.md), CSV và PDF (cơ bản).
 *
 * Đọc .docx mà không cần thư viện ngoài: file .docx thực chất là một file ZIP,
 * bên trong có word/document.xml. Trình duyệt hiện đại có sẵn
 * DecompressionStream('deflate-raw') nên ta tự giải nén được.
 */

import { lookup } from './dict.js';

/* ==================================================================== */
/*  Đọc file ZIP tối giản (đủ dùng cho .docx)                           */
/* ==================================================================== */

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Trình duyệt không hỗ trợ giải nén. Hãy dùng Chrome/Edge/Safari bản mới.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Tìm và trả về nội dung của 1 file bên trong ZIP theo tên */
async function readZipEntry(buffer, wantName) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Tìm End of Central Directory (chữ ký 0x06054b50), quét ngược từ cuối
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 66000; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('File .docx không hợp lệ');

  const count = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const dec = new TextDecoder();

  for (let n = 0; n < count; n++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOff = view.getUint32(ptr + 42, true);
    const name = dec.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));

    if (name === wantName) {
      // Đọc local file header để biết vị trí dữ liệu thật
      const lnLen = view.getUint16(localOff + 26, true);
      const leLen = view.getUint16(localOff + 28, true);
      const dataStart = localOff + 30 + lnLen + leLen;
      const raw = bytes.subarray(dataStart, dataStart + compSize);
      return method === 0 ? raw : await inflateRaw(raw);
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('Không tìm thấy nội dung trong file Word');
}

/* ==================================================================== */
/*  Trích văn bản theo từng loại file                                   */
/* ==================================================================== */

async function textFromDocx(file) {
  const buf = await file.arrayBuffer();
  const xmlBytes = await readZipEntry(buf, 'word/document.xml');
  const xml = new TextDecoder('utf-8').decode(xmlBytes);

  // Chuyển thẻ xuống dòng / hết đoạn thành \n rồi bỏ hết thẻ XML
  return xml
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Trích text từ PDF ở mức cơ bản — dùng được với PDF xuất từ Word. */
async function textFromPdf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const latin = new TextDecoder('latin1').decode(bytes);
  const chunks = [];

  // Tìm các stream, giải nén nếu là FlateDecode
  const re = /stream\r?\n?/g;
  let m;
  while ((m = re.exec(latin)) !== null) {
    const start = m.index + m[0].length;
    const end = latin.indexOf('endstream', start);
    if (end < 0) continue;
    let data = bytes.subarray(start, end);
    // Bỏ 2 byte header zlib nếu có rồi giải nén raw
    try {
      const head = latin.slice(Math.max(0, m.index - 220), m.index);
      if (/FlateDecode/.test(head)) {
        const off = (data[0] === 0x78) ? 2 : 0;
        data = await inflateRaw(data.subarray(off));
      }
    } catch { continue; }
    chunks.push(new TextDecoder('utf-8', { fatal: false }).decode(data));
  }

  // Lấy nội dung trong các toán tử vẽ chữ: (...)Tj  và  [(...)...]TJ
  const out = [];
  for (const c of chunks) {
    const tj = c.match(/\((?:\\.|[^\\()])*\)/g);
    if (tj) out.push(tj.map((s) => s.slice(1, -1).replace(/\\([()\\])/g, '$1')).join(''));
  }
  const text = out.join('\n').trim();
  if (!text) {
    throw new Error('Không đọc được chữ trong PDF này (PDF dạng ảnh scan hoặc font đặc biệt). Hãy mở PDF, bôi đen, copy rồi dán vào ô "Dán văn bản" bên dưới.');
  }
  return text;
}

export async function extractText(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.docx')) return textFromDocx(file);
  if (name.endsWith('.pdf')) return textFromPdf(file);
  if (name.endsWith('.doc')) {
    throw new Error('File .doc đời cũ không đọc được. Hãy mở bằng Word rồi "Save As" thành .docx.');
  }
  return (await file.text()).trim();
}

/* ==================================================================== */
/*  Phân tích văn bản thành danh sách từ vựng                           */
/* ==================================================================== */

const HAN = /[一-鿿]/;
const HAN_RUN = /[一-鿿]+[？。！，、]?/g;

/**
 * Nhận diện 3 kiểu trình bày phổ biến của giáo viên:
 *   1) "汉字 | pinyin | nghĩa"  hoặc dùng dấu tab / phẩy / gạch ngang
 *   2) "汉字 pinyin nghĩa"
 *   3) Chỉ có chữ Hán, cách nhau bởi dấu phẩy hoặc xuống dòng → tự tra từ điển
 * Câu (có từ 4 chữ Hán trở lên hoặc có dấu ？。！) được tách riêng thành mẫu câu.
 */
export function parseVocab(text) {
  const words = [];
  const sentences = [];
  const seen = new Set();

  const push = (hz, py = '', vi = '', tag = '') => {
    hz = hz.replace(/[\s]/g, '');
    if (!hz || !HAN.test(hz) || seen.has(hz)) return;
    seen.add(hz);
    if (!py || !vi) {
      const d = lookup(hz);
      if (d) { py = py || d.py; vi = vi || d.vi; }
    }
    words.push({ hz, py: py.trim(), vi: vi.trim(), tag: tag || 'Từ vựng' });
  };

  let currentTag = '';

  for (let rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Dòng tiêu đề (không chứa chữ Hán) → dùng làm tên nhóm
    if (!HAN.test(line)) {
      if (line.length <= 60) currentTag = line.replace(/[:：].*$/, '').replace(/^[-•*\d.\s]+/, '').trim();
      continue;
    }

    // Kiểu có dấu phân cách rõ ràng
    const parts = line.split(/\s*[|\t]\s*|\s+[-–—]\s+|\s*[:：]\s*/).filter(Boolean);
    if (parts.length >= 2 && HAN.test(parts[0]) && !HAN.test(parts[1])) {
      const hz = parts[0].replace(/[，,]$/, '').trim();
      const rest = parts.slice(1);
      const py = /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüv]/i.test(rest[0]) && rest.length > 1 ? rest[0] : '';
      const vi = py ? rest.slice(1).join(' ') : rest.join(' ');
      push(hz, py, vi, currentTag);
      continue;
    }

    // Câu hoàn chỉnh → cho vào phần mẫu câu
    const hanOnly = (line.match(/[一-鿿]/g) || []).length;
    if (/[？。！?]/.test(line) && hanOnly >= 3) {
      const hz = (line.match(/[一-鿿？。！，、]+/g) || []).join('');
      const vi = line.replace(/[一-鿿？。！，、]+/g, ' ').trim();
      if (hz) sentences.push({ hz, py: '', vi });
      continue;
    }

    // Còn lại: danh sách chữ Hán ngăn cách bằng phẩy / khoảng trắng
    const found = line.match(HAN_RUN) || [];
    for (const f of found) {
      const clean = f.replace(/[？。！，、]/g, '');
      if (clean.length >= 5) sentences.push({ hz: clean, py: '', vi: '' });
      else push(clean, '', '', currentTag);
    }
  }

  return { words, sentences };
}

/** Gói kết quả thành 1 bài học hoàn chỉnh */
export function buildLesson({ title, code, subtitle, words, sentences }) {
  return {
    id: 'lesson-' + Date.now().toString(36),
    code: code || '',
    title: title || 'Bài học mới',
    subtitle: subtitle || '',
    emoji: '📗',
    color: 'orange',
    words: words.filter((w) => w.hz && w.vi),
    sentences: (sentences || []).filter((s) => s.hz),
    custom: true,
    createdAt: Date.now(),
  };
}
