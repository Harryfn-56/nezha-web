/**
 * BỘ CHẤM PHÁT ÂM THEO ÂM TIẾT
 * ======================================================================
 * Trước đây phần Luyện phát âm chấm bằng cách so CHỮ HÁN mà máy nghe được
 * với chữ Hán mẫu. Cách đó có 2 chỗ sai:
 *
 *   1) Tiếng Trung nhiều chữ ĐỒNG ÂM. Em đọc đúng "shī" (师) nhưng máy ghi
 *      ra 十 / 是 / 诗 — vẫn là đọc chuẩn mà bị chấm 0 điểm. Từ 1 chữ bị
 *      oan nhiều nhất vì máy không có ngữ cảnh để đoán đúng chữ.
 *   2) Chấm kiểu "giống / không giống" nên không nói được em SAI Ở ĐÂU:
 *      sai phụ âm đầu, sai vần, hay chỉ sai thanh điệu?
 *
 * Bộ này tách mỗi âm tiết thành 3 phần rồi chấm riêng từng phần:
 *
 *      hǎo   →   thanh mẫu "h"  +  vận mẫu "ao"  +  thanh điệu 3
 *                (phụ âm đầu)      (vần)            (dấu)
 *
 *      Điểm 1 âm tiết = 40% thanh mẫu + 40% vận mẫu + 20% thanh điệu
 *
 * Cặp âm dễ lẫn (zh/z, n/l, an/ang...) được 50% điểm kèm lời nhắc cụ thể,
 * để em biết đường sửa chứ không chỉ thấy "sai".
 */

import { CHAR_PY } from './pinyin-data.js';
import { DICT } from './dict.js';

/* ==================================================================== */
/*  1. Tách thanh điệu khỏi pinyin                                      */
/* ==================================================================== */

const TONE_MARK = {
  'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
  'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
  'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
  'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
  'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
  'ǖ': ['v', 1], 'ǘ': ['v', 2], 'ǚ': ['v', 3], 'ǜ': ['v', 4],
  'ü': ['v', 0], 'ê': ['e', 0],
  'ń': ['n', 2], 'ň': ['n', 3], 'ǹ': ['n', 4], 'ḿ': ['m', 2],
};

/** "hǎo" → { plain: 'hao', tone: 3 } · "hao3" → { plain:'hao', tone:3 } */
export function stripTone(raw) {
  let s = String(raw || '').normalize('NFC').toLowerCase();
  let tone = 0;
  let plain = '';
  for (const ch of s) {
    const hit = TONE_MARK[ch];
    if (hit) {
      plain += hit[0];
      if (hit[1]) tone = hit[1];
    } else if (ch >= '1' && ch <= '5') {
      tone = ch === '5' ? 0 : Number(ch);
    } else if ((ch >= 'a' && ch <= 'z') || ch === 'v') {
      plain += ch;
    }
    // dấu câu, khoảng trắng, dấu ' → bỏ
  }
  return { plain, tone };
}

/* ==================================================================== */
/*  2. Cắt một chuỗi pinyin thành từng âm tiết                          */
/* ==================================================================== */

// Xếp dài trước để "zh" không bị cắt nhầm thành "z"
const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
  'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w', ''];

const FINALS = new Set([
  'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'er',
  'i', 'ia', 'ie', 'iao', 'iu', 'iou', 'ian', 'in', 'iang', 'ing', 'iong',
  'u', 'ua', 'uo', 'uai', 'ui', 'uei', 'uan', 'un', 'uen', 'uang', 'ueng',
  'v', 've', 'van', 'vn', 'ue', 'uan', 'n', 'ng', 'm',
]);

/** Các cách cắt 1 chuỗi chữ cái thành âm tiết (ưu tiên âm tiết dài trước) */
function cutAll(s, out = [], acc = [], depth = 0) {
  if (depth > 24) return out;
  if (!s) { out.push(acc.slice()); return out; }
  const cands = [];
  for (const ini of INITIALS) {
    if (ini && !s.startsWith(ini)) continue;
    const rest = s.slice(ini.length);
    for (let k = Math.min(4, rest.length); k >= 1; k--) {
      const fin = rest.slice(0, k);
      if (FINALS.has(fin)) cands.push(ini + fin);
    }
  }
  // dài trước
  cands.sort((a, b) => b.length - a.length);
  const seen = new Set();
  for (const syl of cands) {
    if (seen.has(syl)) continue;
    seen.add(syl);
    acc.push(syl);
    cutAll(s.slice(syl.length), out, acc, depth + 1);
    acc.pop();
    if (out.length > 40) break;
  }
  return out;
}

/**
 * Cắt cả câu pinyin thành âm tiết có thanh điệu.
 * @param {string} py   "Nǐ jiào shénme míngzi?"
 * @param {number} want số âm tiết mong muốn (= số chữ Hán); 0 = tuỳ ý
 * @returns {Array<{plain, tone}>|null}
 */
export function splitPinyin(py, want = 0) {
  const raw = String(py || '').normalize('NFC').toLowerCase();
  // Cắt theo khoảng trắng / dấu câu / dấu nháy, giữ lại chữ có dấu thanh
  const tokens = raw.split(/[^a-zàáǎàāēéěèīíǐìōóǒòūúǔùǖǘǚǜüêńňǹḿv]+/i).filter(Boolean);
  if (!tokens.length) return null;

  // Mỗi token: liệt kê các cách cắt (theo chuỗi không dấu), rồi ghép thanh điệu
  const perToken = tokens.map((tk) => {
    const { plain } = stripTone(tk);
    const ways = cutAll(plain).filter((w) => w.length);
    // gắn thanh điệu: đọc lại token, mỗi âm tiết lấy dấu thanh nằm trong nó
    return ways.map((w) => attachTones(tk, w)).filter(Boolean);
  });
  if (perToken.some((w) => !w.length)) return null;

  // Chọn tổ hợp có tổng số âm tiết đúng bằng `want` (nếu có yêu cầu)
  const pick = chooseCombo(perToken, want);
  return pick;
}

/** Gắn dấu thanh của token gốc vào từng âm tiết đã cắt */
function attachTones(token, sylPlains) {
  const chars = Array.from(String(token).normalize('NFC').toLowerCase());
  const out = [];
  let idx = 0;                        // vị trí trong chuỗi không dấu
  const tones = [];
  const plainChars = [];
  for (const ch of chars) {
    const hit = TONE_MARK[ch];
    if (hit) { plainChars.push(hit[0]); tones.push(hit[1] || 0); }
    else if ((ch >= 'a' && ch <= 'z')) { plainChars.push(ch); tones.push(0); }
    else if (ch >= '1' && ch <= '5') {
      // kiểu "hao3": dấu số đứng sau âm tiết
      if (tones.length) tones[tones.length - 1] = ch === '5' ? 0 : Number(ch);
    }
  }
  for (const p of sylPlains) {
    let tone = 0;
    for (let k = 0; k < p.length; k++) {
      const t = tones[idx + k];
      if (t) { tone = t; break; }
    }
    if (plainChars.slice(idx, idx + p.length).join('') !== p) return null;
    idx += p.length;
    out.push({ plain: p, tone });
  }
  return out;
}

/** Chọn tổ hợp cách cắt sao cho tổng số âm tiết = want (0 = lấy cách đầu tiên) */
function chooseCombo(perToken, want) {
  if (!want) return perToken.map((w) => w[0]).flat();
  const n = perToken.length;
  let found = null;
  (function walk(i, acc, total) {
    if (found || total > want) return;
    if (i === n) { if (total === want) found = acc.slice(); return; }
    for (const way of perToken[i]) {
      acc.push(...way);
      walk(i + 1, acc, total + way.length);
      acc.length -= way.length;
      if (found) return;
    }
  })(0, [], 0);
  return found || perToken.map((w) => w[0]).flat();
}

/* ==================================================================== */
/*  3. Tách âm tiết thành thanh mẫu + vận mẫu (đã chuẩn hoá)            */
/* ==================================================================== */

// y-/w- chỉ là cách VIẾT của i-/u-/ü-. Quy về cùng một dạng để so cho đúng.
const Y_MAP = {
  yi: 'i', ya: 'ia', ye: 'ie', yao: 'iao', you: 'iu', yan: 'ian', yin: 'in',
  yang: 'iang', ying: 'ing', yong: 'iong', yu: 'v', yue: 've', yuan: 'van', yun: 'vn',
};
const W_MAP = {
  wu: 'u', wa: 'ua', wo: 'uo', wai: 'uai', wei: 'ui', wan: 'uan', wen: 'un',
  wang: 'uang', weng: 'ueng',
};

/** 'hao' → { ini:'h', fin:'ao' } */
export function parts(plain) {
  const s = String(plain || '');
  if (!s) return { ini: '', fin: '' };
  if (Y_MAP[s]) return { ini: '', fin: Y_MAP[s] };
  if (W_MAP[s]) return { ini: '', fin: W_MAP[s] };
  if (s[0] === 'y') return { ini: '', fin: 'i' + s.slice(1) };
  if (s[0] === 'w') return { ini: '', fin: 'u' + s.slice(1) };

  let ini = '';
  for (const c of INITIALS) {
    if (c && s.startsWith(c)) { ini = c; break; }
  }
  let fin = s.slice(ini.length);
  // sau j/q/x thì "u" thật ra là "ü"
  if ('jqx'.includes(ini)) {
    if (fin === 'u') fin = 'v';
    else if (fin === 'ue') fin = 've';
    else if (fin === 'uan') fin = 'van';
    else if (fin === 'un') fin = 'vn';
  }
  if (fin === 'iou') fin = 'iu';
  if (fin === 'uei') fin = 'ui';
  if (fin === 'uen') fin = 'un';
  return { ini, fin };
}

/** Ghép dấu thanh trở lại để hiện cho học sinh: ('hao', 3) → 'hǎo' */
export function withTone(plain, tone) {
  let s = String(plain || '').replace(/v/g, 'ü');
  if (!tone) return s;
  const marks = {
    a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè', i: 'īíǐì', u: 'ūúǔù', 'ü': 'ǖǘǚǜ',
  };
  let at = -1;
  const lower = s;
  for (const v of ['a', 'o', 'e']) { const k = lower.indexOf(v); if (k >= 0) { at = k; break; } }
  if (at < 0) {
    // iu / ui → dấu ở nguyên âm cuối; còn lại lấy nguyên âm đầu tiên
    for (let k = s.length - 1; k >= 0; k--) {
      if ('iuü'.includes(s[k])) { at = k; break; }
    }
  }
  if (at < 0) return s;
  const ch = s[at];
  const set = marks[ch];
  if (!set) return s;
  return s.slice(0, at) + set[tone - 1] + s.slice(at + 1);
}

/* ==================================================================== */
/*  4. Những cặp âm hay lẫn — chấm 50% kèm lời nhắc                     */
/* ==================================================================== */

const NEAR_INITIAL = [
  [['zh', 'z'], 'Lưỡi phải cong lên khi đọc zh (z thì lưỡi thẳng)'],
  [['ch', 'c'], 'Lưỡi phải cong lên khi đọc ch (c thì lưỡi thẳng)'],
  [['sh', 's'], 'Lưỡi phải cong lên khi đọc sh (s thì lưỡi thẳng)'],
  [['zh', 'ch'], 'ch bật hơi mạnh, zh không bật hơi'],
  [['z', 'c'], 'c bật hơi mạnh, z không bật hơi'],
  [['j', 'q'], 'q bật hơi mạnh, j không bật hơi'],
  [['b', 'p'], 'p bật hơi mạnh, b không bật hơi'],
  [['d', 't'], 't bật hơi mạnh, d không bật hơi'],
  [['g', 'k'], 'k bật hơi mạnh, g không bật hơi'],
  [['n', 'l'], 'n là âm mũi, l đầu lưỡi — đừng đọc lẫn'],
  [['h', 'f'], 'h phát từ cổ họng, f là răng chạm môi'],
  [['j', 'zh'], 'j lưỡi thẳng, zh lưỡi cong'],
  [['q', 'ch'], 'q lưỡi thẳng, ch lưỡi cong'],
  [['x', 'sh'], 'x lưỡi thẳng, sh lưỡi cong'],
  [['r', 'l'], 'r lưỡi cong, l đầu lưỡi chạm lợi'],
  [['s', 'x'], 's đầu lưỡi, x giữa lưỡi'],
];

const NEAR_FINAL = [
  [['an', 'ang'], 'ang kéo dài, kết thúc ở cổ họng; an gọn, lưỡi chạm lợi'],
  [['en', 'eng'], 'eng kéo dài ở cổ họng; en gọn hơn'],
  [['in', 'ing'], 'ing kéo dài ở cổ họng; in gọn hơn'],
  [['ian', 'iang'], 'iang kéo dài ở cổ họng; ian gọn hơn'],
  [['uan', 'uang'], 'uang kéo dài ở cổ họng; uan gọn hơn'],
  [['o', 'uo'], 'uo có âm "u" tròn môi trước'],
  [['e', 'o'], 'e không tròn môi, o phải tròn môi'],
  [['i', 'v'], 'ü phải chúm môi lại như thổi nến'],
  [['u', 'v'], 'ü chúm môi và lưỡi đưa ra trước, u lưỡi lùi sau'],
  [['ai', 'ei'], 'ai mở miệng to, ei miệng hẹp hơn'],
  [['ao', 'ou'], 'ao mở miệng to rồi tròn, ou tròn môi ngay'],
  [['ia', 'ie'], 'ie kết thúc ở âm "ê", ia kết thúc ở âm "a"'],
  [['u', 'ou'], 'ou có 2 âm nối nhau, u chỉ 1 âm'],
  [['ui', 'ei'], 'ui bắt đầu bằng âm "u" tròn môi'],
  [['iu', 'ou'], 'iu bắt đầu bằng âm "i"'],
  [['ong', 'eng'], 'ong tròn môi, eng không tròn môi'],
  [['er', 'e'], 'er phải cong lưỡi lên'],
];

const TONE_NAME = ['nhẹ (không dấu)', '1 – cao và đều', '2 – lên giọng',
  '3 – xuống rồi lên', '4 – xuống dứt khoát'];

function nearHit(list, a, b) {
  for (const [pair, tip] of list) {
    if ((pair[0] === a && pair[1] === b) || (pair[1] === a && pair[0] === b)) return tip;
  }
  return null;
}

/* ==================================================================== */
/*  5. Bảng tra cách đọc của từng chữ Hán                               */
/* ==================================================================== */

const isHan = (c) => /[一-鿿]/.test(c);
let MAP = null;                        // chữ Hán → Set các âm tiết (plain+tone)

function put(ch, syl) {
  if (!syl || !syl.plain) return;
  if (!MAP.has(ch)) MAP.set(ch, []);
  const arr = MAP.get(ch);
  if (!arr.some((x) => x.plain === syl.plain && x.tone === syl.tone)) arr.push(syl);
}

/** Học cách đọc từ một cặp (chữ Hán, pinyin) — dùng cho cả bài của giáo viên */
export function learnPair(hz, py) {
  ensureMap();
  const chars = Array.from(String(hz || '')).filter(isHan);
  if (!chars.length) return;
  const sylls = splitPinyin(py, chars.length);
  if (!sylls || sylls.length !== chars.length) return;
  chars.forEach((c, i) => put(c, sylls[i]));
}

/** Nạp toàn bộ từ + mẫu câu của một bài vào bảng tra */
export function learnLesson(lesson) {
  if (!lesson) return;
  for (const w of lesson.words || []) learnPair(w.hz, w.py);
  for (const s of lesson.sentences || []) learnPair(s.hz, s.py);
}

function ensureMap() {
  if (MAP) return;
  MAP = new Map();
  // 1) bảng chữ hay bị nghe nhầm
  for (const [ch, py] of Object.entries(CHAR_PY)) {
    if (Array.from(ch).length !== 1) continue;
    for (const one of String(py).split('/')) {
      const { plain, tone } = stripTone(one);
      if (plain) put(ch, { plain, tone });
    }
  }
  // 2) từ điển tra nhanh (cả từ 2–3 chữ, tự tách theo số âm tiết)
  for (const [hz, val] of Object.entries(DICT)) learnPair(hz, val[0]);
}

/** Các cách đọc có thể của 1 chữ Hán */
export function readingsOf(ch) {
  ensureMap();
  return MAP.get(ch) || null;
}

/* ==================================================================== */
/*  6. Chấm điểm                                                        */
/* ==================================================================== */

/* Trọng số 3 phần của một âm tiết — giáo viên chỉnh được trong config.js.
 * Thanh điệu để 30% vì đây là lỗi phổ biến nhất của người Việt học tiếng Trung. */
const W = { ini: 0.35, fin: 0.35, tone: 0.30 };

export function setWeights(w) {
  if (!w) return;
  const a = Number(w.initial), b = Number(w.final), c = Number(w.tone);
  const sum = a + b + c;
  if (!sum || !Number.isFinite(sum)) return;
  W.ini = a / sum; W.fin = b / sum; W.tone = c / sum;
}

/** Điểm 0–1 giữa 2 âm tiết + lời nhắc cụ thể */
function syllableScore(t, h) {
  const a = parts(t.plain), b = parts(h.plain);
  const tips = [];
  let s = 0;

  // Thanh mẫu (phụ âm đầu)
  if (a.ini === b.ini) s += W.ini;
  else {
    const tip = nearHit(NEAR_INITIAL, a.ini, b.ini);
    if (tip) { s += W.ini / 2; tips.push(`Phụ âm đầu: ${tip}`); }
    else tips.push(`Sai phụ âm đầu — cần "${a.ini || 'không có phụ âm'}", em đọc thành "${b.ini || 'không có'}"`);
  }

  // Vận mẫu (vần)
  if (a.fin === b.fin) s += W.fin;
  else {
    const tip = nearHit(NEAR_FINAL, a.fin, b.fin);
    if (tip) { s += W.fin / 2; tips.push(`Vần: ${tip}`); }
    else tips.push(`Sai vần — cần "${a.fin}", em đọc thành "${b.fin}"`);
  }

  // Thanh điệu — chữ mang THANH NHẸ thì không chấm (thanh nhẹ đọc nhanh và
  // nhẹ, cao độ phụ thuộc chữ đứng trước nên không đo được chính xác)
  if (!t.tone) s += W.tone;
  else if (t.tone === h.tone) s += W.tone;
  else if (!h.tone) { s += W.tone * 0.6; tips.push('Thanh điệu chưa rõ — đọc dứt khoát hơn nhé'); }
  else {
    tips.push(`Sai thanh điệu — cần thanh ${TONE_NAME[t.tone]}, em đọc thanh ${TONE_NAME[h.tone]}`);
  }

  return { s: Math.min(1, s), tips };
}

/** Ghép cặp âm tiết mẫu ↔ âm tiết máy nghe được (Levenshtein có nhớ đường đi) */
function align(tgt, heard) {
  const m = tgt.length, n = heard.length;
  const cost = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const from = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(''));
  for (let i = 1; i <= m; i++) { cost[i][0] = i; from[i][0] = 'D'; }
  for (let j = 1; j <= n; j++) { cost[0][j] = j; from[0][j] = 'I'; }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = cost[i - 1][j - 1] + subCost(tgt[i - 1], heard[j - 1]);
      const del = cost[i - 1][j] + 1;
      const ins = cost[i][j - 1] + 1;
      const best = Math.min(sub, del, ins);
      cost[i][j] = best;
      from[i][j] = best === sub ? 'S' : best === del ? 'D' : 'I';
    }
  }

  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const op = i === 0 ? 'I' : j === 0 ? 'D' : from[i][j];
    if (op === 'S') { ops.push({ op: 'S', t: tgt[--i], h: heard[--j] }); }
    else if (op === 'D') { ops.push({ op: 'D', t: tgt[--i] }); }
    else { ops.push({ op: 'I', h: heard[--j] }); }
  }
  return ops.reverse();
}

/** Chi phí thay thế: âm càng giống càng rẻ (0 = trùng khít) */
function subCost(t, h) {
  if (!h || h.unknown) return 1;
  return 1 - syllableScore(t, h).s * 0.9;
}

/** Chọn cách đọc hợp nhất của 1 chữ khi chữ đó có nhiều âm */
function bestReading(list, target) {
  if (!list || !list.length) return null;
  if (!target) return list[0];
  let best = list[0], bs = -1;
  for (const r of list) {
    const s = syllableScore(target, r).s;
    if (s > bs) { bs = s; best = r; }
  }
  return best;
}

/**
 * CHẤM MỘT LẦN ĐỌC.
 *
 * @param {{hz, py}} item   từ/câu mẫu
 * @param {string} heardHz  chữ Hán máy nghe được
 * @returns {{
 *   pct: number,               // điểm 0–100
 *   syllables: Array,          // chi tiết từng âm tiết
 *   extra: Array,              // âm tiết em đọc thừa
 *   tips: Array<string>,       // 3 lời nhắc quan trọng nhất
 *   mode: 'phonetic'|'text',   // chấm theo âm hay chỉ so chữ (khi thiếu dữ liệu)
 *   homophone: boolean         // máy nghe ra chữ đồng âm (đọc đúng)
 * }}
 */
export function scoreSpeech(item, heardHz, opts = {}) {
  ensureMap();
  // Thanh điệu ĐO ĐƯỢC từ giọng thật (voice.js). Bộ nhận diện chữ không đáng
  // tin về thanh điệu — nó đoán chữ theo ngữ cảnh, nên "hǎo" có thể ra 号 (hào)
  // dù em đọc đúng. Đo cao độ giọng chính xác hơn nhiều.
  const measured = Array.isArray(opts.tones) ? opts.tones : null;
  const tgtChars = Array.from(String(item.hz || '')).filter(isHan);
  const heardChars = Array.from(String(heardHz || '')).filter(isHan);

  if (!tgtChars.length) return textOnly(item.hz, heardHz);

  // --- âm tiết mẫu ---
  let tgt = splitPinyin(item.py, tgtChars.length);
  if (!tgt || tgt.length !== tgtChars.length) {
    tgt = tgtChars.map((c) => (readingsOf(c) || [{ plain: '', tone: 0 }])[0]);
  }
  if (tgt.some((s) => !s.plain)) return textOnly(item.hz, heardHz);

  if (!heardChars.length) {
    return {
      pct: 0, syllables: tgtChars.map((c, i) => ({ hz: c, py: tgt[i], state: 'miss', tips: [] })),
      extra: [], tips: ['Máy chưa nghe được chữ tiếng Trung nào'], mode: 'phonetic', homophone: false,
    };
  }

  // --- âm tiết máy nghe được ---
  const heardList = heardChars.map((c) => ({ hz: c, list: readingsOf(c) }));
  if (heardList.every((x) => !x.list)) {
    // Không tra được chữ nào → đành so chữ Hán như trước
    return textOnly(item.hz, heardHz);
  }

  // gán tạm cách đọc theo vị trí để căn chỉnh, sau đó chọn lại cho khớp
  const heard = heardList.map((x, k) => {
    const guide = tgt[Math.min(k, tgt.length - 1)];
    const r = bestReading(x.list, guide);
    return r ? { ...r, hz: x.hz } : { plain: '', tone: 0, hz: x.hz, unknown: true };
  });

  const ops = align(tgt, heard);

  const syllables = [];
  const extra = [];
  const allTips = [];
  const useMeasured = measured && measured.length === tgt.length;
  let sum = 0;
  let ti = 0;

  for (const op of ops) {
    if (op.op === 'S') {
      const hz = tgtChars[ti];
      if (op.h.unknown) {
        syllables.push({ hz, py: op.t, heard: op.h, state: 'bad', tips: [`Máy nghe ra chữ "${op.h.hz}" — không tra được cách đọc`] });
      } else {
        // Nếu đo được cao độ thật thì lấy thanh điệu đo được, chuẩn hơn
        const md = useMeasured ? measured[ti] : null;
        const h = (md && md.tone) ? { ...op.h, tone: md.tone } : op.h;
        const { s, tips } = syllableScore(op.t, h);
        sum += s;
        const state = s >= 0.95 ? 'ok' : s >= 0.6 ? 'warn' : 'bad';
        syllables.push({
          hz, py: op.t, heard: h, state, score: s, tips,
          toneFrom: (md && md.tone) ? 'pitch' : 'text',
          contour: md ? md.contour : null,
        });
        for (const t of tips) allTips.push({ hz, t, s });
      }
      ti++;
    } else if (op.op === 'D') {
      syllables.push({ hz: tgtChars[ti], py: op.t, state: 'miss', tips: ['Em chưa đọc chữ này'] });
      allTips.push({ hz: tgtChars[ti], t: 'Chưa đọc chữ này', s: 0 });
      ti++;
    } else {
      extra.push(op.h);
    }
  }

  let pct = (sum / tgt.length) * 100;
  // Đọc thừa chữ thì trừ điểm (đọc lan man mà vẫn trúng vài âm)
  if (extra.length) pct -= Math.min(35, extra.length * (60 / tgt.length));
  pct = Math.max(0, Math.min(100, Math.round(pct)));

  // Máy nghe ra chữ đồng âm nhưng âm khớp hoàn toàn → em đọc đúng
  const homophone = pct >= 95 && String(heardHz).replace(/[^一-鿿]/g, '') !== tgtChars.join('');

  allTips.sort((a, b) => a.s - b.s);
  const tips = [];
  const seenTip = new Set();
  for (const x of allTips) {
    const line = `${x.hz}: ${x.t}`;
    if (seenTip.has(line)) continue;
    seenTip.add(line);
    tips.push(line);
    if (tips.length >= 3) break;
  }
  if (extra.length) tips.push(`Em đọc thừa ${extra.length} âm tiết`);

  return { pct, syllables, extra, tips, mode: 'phonetic', homophone };
}

/** Không đủ dữ liệu pinyin → quay về cách cũ: so từng chữ Hán */
function textOnly(targetHz, heardHz) {
  const a = String(heardHz || '').replace(/[^一-鿿]/g, '');
  const b = String(targetHz || '').replace(/[^一-鿿]/g, '');
  if (!a || !b) return { pct: 0, syllables: [], extra: [], tips: [], mode: 'text', homophone: false };

  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  let pct = (1 - prev[n] / Math.max(m, n)) * 100;
  const gap = Math.abs(m - n) / n;
  if (gap > 0.34) pct -= Math.min(30, (gap - 0.34) * 60);

  return {
    pct: Math.max(0, Math.round(pct)), syllables: [], extra: [],
    tips: [], mode: 'text', homophone: false,
  };
}
