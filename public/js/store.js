/**
 * STORE — đăng nhập, lưu điểm, quản lý lớp/bài học, phòng chơi Kahoot.
 *
 * Hai chế độ chạy song song:
 *   • CLOUD  — khi đã điền Supabase trong config.js. Dữ liệu tập trung,
 *              giáo viên xem được điểm của mọi học sinh, Kahoot chơi
 *              nhiều máy được.
 *   • LOCAL  — khi chưa cấu hình. Mọi thứ lưu trong localStorage của
 *              máy học sinh. Website vẫn chơi được đủ 8 game.
 *
 * Giao tiếp với Supabase qua REST (PostgREST) bằng fetch — không cần
 * cài thư viện, chạy được trên mọi hosting tĩnh.
 */

import { CONFIG, hasCloud } from './config.js';
import { LESSONS } from './data.js';

const LS = {
  user: 'nz_user',
  scores: 'nz_scores',
  classes: 'nz_classes',
  lessons: 'nz_lessons',
  rooms: 'nz_rooms',
  teachers: 'nz_teachers',
  students: 'nz_students',
};

const read = (k, def) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const CLOUD = hasCloud();

/* ==================================================================== */
/*  Lớp gọi REST Supabase                                               */
/* ==================================================================== */

/* --------------------------------------------------------------------
 * ĐỒNG HỒ CHUNG
 * Máy tính / điện thoại của học sinh nhiều khi bị lệch giờ vài chục giây.
 * Phòng Kahoot tính thời gian bằng mốc "câu hỏi bắt đầu lúc mấy giờ", nên
 * máy nào lệch giờ là đồng hồ đếm ngược bị hụt đúng bằng khoảng lệch đó
 * (có em chỉ còn 5 giây trong khi thầy/cô để 20 giây).
 *
 * Cách xử lý: mỗi lần gọi Supabase, đọc giờ máy chủ ở header "Date" rồi
 * tính độ lệch so với giờ máy này. Mọi phép tính thời gian trong phòng
 * Kahoot dùng serverNow() thay cho Date.now().
 * Chưa bật Supabase thì thầy/cô và học sinh dùng chung 1 máy nên độ lệch
 * bằng 0, không ảnh hưởng gì.
 * ------------------------------------------------------------------ */
let clockSkew = 0;          // giờ máy chủ − giờ máy này (ms)
let skewKnown = false;

function noteServerClock(res, sentAt) {
  try {
    const raw = res.headers.get('date');
    if (!raw) return;
    const serverAt = Date.parse(raw);
    if (!Number.isFinite(serverAt)) return;
    const now = Date.now();
    const rtt = now - sentAt;
    if (rtt > 8000) return;                       // mạng quá chậm, mẫu không đáng tin
    // Header Date chỉ chính xác tới giây → cộng thêm 0,5s cho về giữa giây
    const sample = serverAt + 500 + rtt / 2 - now;
    clockSkew = skewKnown ? clockSkew * 0.7 + sample * 0.3 : sample;
    skewKnown = true;
  } catch { /* bỏ qua */ }
}

/** Giờ hiện tại theo máy chủ (ms). Chưa biết độ lệch thì dùng giờ máy này. */
export function serverNow() {
  return Date.now() + clockSkew;
}

/** Máy này đang lệch giờ bao nhiêu giây so với máy chủ (để hiện cảnh báo) */
export function clockSkewSeconds() {
  return skewKnown ? Math.round(clockSkew / 1000) : 0;
}

async function sb(table, { method = 'GET', query = '', body = null, prefer = '' } = {}) {
  if (!CLOUD) throw new Error('Chưa cấu hình Supabase');
  const url = `${CONFIG.supabase.url.replace(/\/$/, '')}/rest/v1/${table}${query}`;
  const headers = {
    apikey: CONFIG.supabase.anonKey,
    Authorization: `Bearer ${CONFIG.supabase.anonKey}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;

  const sentAt = Date.now();
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  noteServerClock(res, sentAt);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase ${res.status}: ${txt.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Kiểm tra kết nối Supabase — dùng ở trang Quản trị */
export async function pingCloud() {
  if (!CLOUD) return { ok: false, msg: 'Chưa cấu hình Supabase trong config.js' };
  try {
    await sb('classes', { query: '?select=code&limit=1' });
    return { ok: true, msg: 'Đã kết nối Supabase' };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

/* ==================================================================== */
/*  Lớp học                                                             */
/* ==================================================================== */

export async function listClasses() {
  if (CLOUD) {
    try {
      const rows = await sb('classes', { query: '?select=*&order=code' });
      if (rows && rows.length) return rows;
    } catch (e) { console.warn('listClasses:', e.message); }
  }
  const local = read(LS.classes, null);
  return local || CONFIG.classes;
}

export async function addClass(code, name) {
  code = code.trim().toUpperCase();
  if (!code) throw new Error('Mã lớp không được để trống');
  const row = { code, name: name.trim() || 'Lớp ' + code };
  if (CLOUD) {
    await sb('classes', { method: 'POST', body: row, prefer: 'resolution=merge-duplicates' });
  }
  const local = read(LS.classes, null) || CONFIG.classes.slice();
  if (!local.some((c) => c.code === code)) local.push(row);
  write(LS.classes, local);
  return row;
}

export async function removeClass(code) {
  if (CLOUD) {
    try { await sb('classes', { method: 'DELETE', query: `?code=eq.${encodeURIComponent(code)}` }); }
    catch (e) { console.warn(e.message); }
  }
  const local = (read(LS.classes, null) || CONFIG.classes.slice()).filter((c) => c.code !== code);
  write(LS.classes, local);
}

/* ==================================================================== */
/*  Đăng nhập                                                           */
/* ==================================================================== */

export function currentUser() {
  const u = read(LS.user, null);
  // Tài khoản giáo viên đăng nhập từ bản cũ (chưa có nhiều tài khoản)
  // vẫn được coi là quản trị viên để không mất quyền xem.
  if (u && u.role === 'teacher' && u.isAdmin === undefined && u.id === 'teacher') {
    u.isAdmin = true;
  }
  return u;
}

export function logout() {
  localStorage.removeItem(LS.user);
}

/* ==================================================================== */
/*  DANH SÁCH HỌC SINH (chỉ giáo viên được thêm)                        */
/* ==================================================================== */

/** Bỏ dấu tiếng Việt + chữ thường, để so tên không phụ thuộc cách gõ dấu */
export function normName(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export const studentId = (classCode, name) =>
  `${String(classCode).toUpperCase()}::${normName(name)}`;

/** Danh sách học sinh của 1 lớp (bỏ trống mã lớp = lấy tất cả) */
export async function listStudents(classCode = '') {
  const code = String(classCode || '').toUpperCase();
  if (CLOUD) {
    try {
      const q = code
        ? `?select=*&class_code=eq.${encodeURIComponent(code)}&order=name`
        : '?select=*&order=class_code,name';
      const rows = await sb('students', { query: q });
      if (rows) return rows;
    } catch (e) { console.warn('listStudents:', e.message); }
  }
  const local = read(LS.students, []);
  return code ? local.filter((s) => String(s.class_code).toUpperCase() === code) : local;
}

/** Giáo viên thêm 1 học sinh vào lớp */
export async function addStudent(classCode, name) {
  const code = String(classCode || '').trim().toUpperCase();
  const nm = String(name || '').trim().replace(/\s+/g, ' ');
  if (!code) throw new Error('Chưa chọn lớp');
  if (nm.length < 2) throw new Error('Tên học sinh quá ngắn');

  const row = { id: studentId(code, nm), name: nm, class_code: code };

  const local = read(LS.students, []).filter((s) => s.id !== row.id);
  local.push(row);
  write(LS.students, local);

  if (CLOUD) {
    try {
      await sb('students', { method: 'POST', body: row, prefer: 'resolution=merge-duplicates' });
    } catch (e) { console.warn('Không lưu được học sinh lên cloud:', e.message); }
  }
  return row;
}

/** Thêm nhiều học sinh cùng lúc — mỗi dòng 1 tên */
export async function addStudents(classCode, text) {
  const names = String(text || '')
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2);
  const added = [];
  for (const nm of names) {
    try { added.push(await addStudent(classCode, nm)); } catch { /* bỏ qua tên lỗi */ }
  }
  return added;
}

export async function removeStudent(id) {
  write(LS.students, read(LS.students, []).filter((s) => s.id !== id));
  if (CLOUD) {
    try { await sb('students', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` }); }
    catch (e) { console.warn(e.message); }
  }
}

/**
 * Học sinh đăng nhập: họ tên + mã lớp.
 * Tên PHẢI có sẵn trong danh sách lớp do giáo viên nhập — như vậy học sinh
 * không tự tạo được tài khoản lạ để chơi trước xem đáp án.
 */
export async function loginStudent(name, classCode) {
  name = String(name).trim().replace(/\s+/g, ' ');
  classCode = String(classCode).trim().toUpperCase();

  if (name.length < 2) throw new Error('Vui lòng nhập họ tên đầy đủ của em');
  if (!classCode) throw new Error('Vui lòng nhập mã lớp');

  const classes = await listClasses();
  const found = classes.find((c) => c.code.toUpperCase() === classCode);
  if (!found) throw new Error('Mã lớp không đúng. Em hỏi lại thầy/cô nhé!');

  const roster = await listStudents(found.code);
  if (!roster.length) {
    throw new Error('Lớp này chưa có danh sách học sinh. Thầy/cô cần thêm tên các em trong trang Quản trị trước.');
  }

  const hit = roster.find((s) => normName(s.name) === normName(name));
  if (!hit) {
    throw new Error('Không tìm thấy tên em trong danh sách lớp. Em kiểm tra lại chính tả hoặc hỏi thầy/cô nhé!');
  }

  const user = {
    role: 'student',
    name: hit.name,                 // dùng đúng tên thầy/cô đã nhập
    classCode: found.code,
    className: found.name,
    id: hit.id || studentId(found.code, hit.name),
    since: Date.now(),
  };

  write(LS.user, user);
  return user;
}

/**
 * Đăng nhập giáo viên.
 *  • Tài khoản quản trị: CONFIG.adminUsername + CONFIG.teacherPassword
 *    (để trống ô tài khoản mà gõ đúng mật khẩu quản trị cũng vào được —
 *     giữ nguyên thói quen cũ).
 *  • Giáo viên thường: tài khoản do quản trị viên tạo trong trang Quản trị.
 */
export async function loginTeacher(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const pw = String(password || '');

  const adminUser = String(CONFIG.adminUsername || 'admin').toLowerCase();
  if ((!u || u === adminUser) && pw && pw === CONFIG.teacherPassword) {
    const user = {
      role: 'teacher', isAdmin: true, name: 'Quản trị viên',
      username: adminUser, id: 'teacher', classes: [], since: Date.now(),
    };
    write(LS.user, user);
    return user;
  }

  if (!u) throw new Error('Vui lòng nhập tài khoản giáo viên');

  const teachers = await listTeachers();
  const found = teachers.find((t) => String(t.username).toLowerCase() === u);
  if (!found || String(found.password) !== pw) {
    throw new Error('Tài khoản hoặc mật khẩu không đúng');
  }

  const user = {
    role: 'teacher',
    isAdmin: false,
    name: found.name || found.username,
    username: found.username,
    id: 'gv::' + found.username,
    classes: Array.isArray(found.classes) ? found.classes : [],
    since: Date.now(),
  };
  write(LS.user, user);
  return user;
}

/* ==================================================================== */
/*  Tài khoản giáo viên (do quản trị viên tạo)                          */
/* ==================================================================== */

function normTeacher(t) {
  return {
    username: String(t.username || '').trim().toLowerCase(),
    name: t.name || t.username,
    password: String(t.password || ''),
    classes: Array.isArray(t.classes) ? t.classes : (t.classes ? [t.classes] : []),
  };
}

export async function listTeachers() {
  if (CLOUD) {
    try {
      const rows = await sb('teachers', { query: '?select=*&order=username' });
      if (rows) return rows.map(normTeacher);
    } catch (e) { console.warn('listTeachers:', e.message); }
  }
  return read(LS.teachers, []).map(normTeacher);
}

export async function saveTeacher(t) {
  const row = normTeacher(t);
  if (!row.username) throw new Error('Tài khoản không được để trống');
  if (!/^[a-z0-9._-]+$/.test(row.username)) {
    throw new Error('Tài khoản chỉ gồm chữ thường, số và dấu . _ - (không dấu, không khoảng trắng)');
  }
  if (row.password.length < 4) throw new Error('Mật khẩu cần ít nhất 4 ký tự');
  if (row.username === String(CONFIG.adminUsername || 'admin').toLowerCase()) {
    throw new Error('Tài khoản này trùng với tài khoản quản trị, hãy chọn tên khác');
  }

  const local = read(LS.teachers, []).filter((x) => String(x.username).toLowerCase() !== row.username);
  local.push(row);
  write(LS.teachers, local);

  if (CLOUD) {
    try {
      await sb('teachers', { method: 'POST', body: row, prefer: 'resolution=merge-duplicates' });
    } catch (e) { console.warn('Không lưu được giáo viên lên cloud:', e.message); }
  }
  return row;
}

export async function removeTeacher(username) {
  const u = String(username).toLowerCase();
  write(LS.teachers, read(LS.teachers, []).filter((x) => String(x.username).toLowerCase() !== u));
  if (CLOUD) {
    try { await sb('teachers', { method: 'DELETE', query: `?username=eq.${encodeURIComponent(u)}` }); }
    catch (e) { console.warn(e.message); }
  }
}

/**
 * Giáo viên tự tạo lớp thì lớp đó được gán luôn cho chính họ.
 * Cập nhật cả bản ghi giáo viên lẫn phiên đăng nhập đang mở.
 */
export async function assignClassToSelf(code) {
  const user = currentUser();
  if (!user || user.role !== 'teacher' || user.isAdmin) return;

  const c = String(code).trim().toUpperCase();
  const list = Array.isArray(user.classes) ? user.classes.slice() : [];
  if (!list.some((x) => String(x).toUpperCase() === c)) list.push(c);

  const teachers = await listTeachers();
  const me = teachers.find((t) => t.username === String(user.username).toLowerCase());
  if (me) {
    try { await saveTeacher({ ...me, classes: list }); }
    catch (e) { console.warn('Không cập nhật được lớp cho giáo viên:', e.message); }
  }

  user.classes = list;
  write(LS.user, user);
  return list;
}

/** Giáo viên này được xem những lớp nào? (quản trị viên: tất cả) */
export function canSeeClass(user, code) {
  if (!user || user.role !== 'teacher') return false;
  if (user.isAdmin) return true;
  const list = user.classes || [];
  if (!list.length) return false;
  return list.some((c) => String(c).toUpperCase() === String(code || '').toUpperCase());
}

/* ==================================================================== */
/*  Điểm số                                                             */
/* ==================================================================== */

/**
 * Lưu kết quả một lượt chơi.
 * @param {{lessonId, gameId, score, maxScore, correct, total, durationMs}} r
 */
export async function saveScore(r) {
  const user = currentUser();
  if (!user || user.role !== 'student') return;

  const row = {
    student_id: user.id,
    student_name: user.name,
    class_code: user.classCode,
    lesson_id: r.lessonId,
    game_id: r.gameId,
    score: Math.round(r.score),
    max_score: Math.round(r.maxScore),
    correct_count: r.correct,
    total_count: r.total,
    duration_ms: Math.round(r.durationMs || 0),
    // Những từ em trả lời sai — để thầy/cô biết cả lớp hay vướng ở đâu
    wrong_words: Array.isArray(r.wrongWords) ? r.wrongWords : [],
    played_at: new Date().toISOString(),
  };

  // Luôn lưu bản sao ở máy để học sinh xem được lịch sử kể cả khi mất mạng
  const local = read(LS.scores, []);
  local.push(row);
  write(LS.scores, local.slice(-500));

  if (CLOUD) {
    try { await sb('scores', { method: 'POST', body: row }); }
    catch (e) {
      // Bảng scores cũ chưa có cột wrong_words (chưa chạy lại schema.sql)
      // → gửi lại bản không có cột đó để vẫn lưu được điểm.
      if (/wrong_words/.test(e.message)) {
        const { wrong_words, ...plain } = row;
        try { await sb('scores', { method: 'POST', body: plain }); }
        catch (e2) { console.warn('Không gửi được điểm lên cloud:', e2.message); }
      } else {
        console.warn('Không gửi được điểm lên cloud:', e.message);
      }
    }
  }
  return row;
}

/** Điểm của học sinh đang đăng nhập */
export async function myScores() {
  const user = currentUser();
  if (!user) return [];
  if (CLOUD) {
    try {
      const rows = await sb('scores', {
        query: `?select=*&student_id=eq.${encodeURIComponent(user.id)}&order=played_at.desc&limit=200`,
      });
      if (rows) return rows;
    } catch (e) { console.warn(e.message); }
  }
  return read(LS.scores, [])
    .filter((s) => s.student_id === user.id)
    .reverse();
}

/** Toàn bộ điểm (trang Quản trị) */
export async function allScores({ classCode = '', limit = 1000 } = {}) {
  if (CLOUD) {
    try {
      let q = `?select=*&order=played_at.desc&limit=${limit}`;
      if (classCode) q += `&class_code=eq.${encodeURIComponent(classCode)}`;
      const rows = await sb('scores', { query: q });
      if (rows) return rows;
    } catch (e) { console.warn(e.message); }
  }
  let rows = read(LS.scores, []).slice().reverse();
  if (classCode) rows = rows.filter((s) => s.class_code === classCode);
  return rows;
}

/**
 * Bảng xếp hạng của một lớp — dùng cho trang chính của học sinh.
 * Xếp theo TỔNG ĐIỂM cộng dồn của tất cả các bài.
 * @returns {{board: Array, me: object|null, myRank: number, totalStudents: number}}
 */
export async function classLeaderboard(classCode, top = 5) {
  const code = String(classCode || '').toUpperCase();
  let rows = [];

  if (CLOUD) {
    try {
      rows = await sb('scores', {
        query: `?select=student_id,student_name,class_code,score,correct_count,total_count,game_id,played_at`
             + `&class_code=eq.${encodeURIComponent(code)}&order=played_at.desc&limit=5000`,
      }) || [];
    } catch (e) { console.warn('classLeaderboard:', e.message); }
  } else {
    rows = read(LS.scores, []).filter((s) => String(s.class_code).toUpperCase() === code);
  }

  const all = summarise(rows);            // đã sắp xếp giảm dần theo tổng điểm
  const user = currentUser();
  const myIdx = user
    ? all.findIndex((s) => s.id === user.id || s.name === user.name)
    : -1;

  return {
    board: all.slice(0, top),
    me: myIdx >= 0 ? all[myIdx] : null,
    myRank: myIdx >= 0 ? myIdx + 1 : 0,
    totalStudents: all.length,
  };
}

/** Gom điểm theo học sinh để làm bảng tổng hợp cho giáo viên */
export function summarise(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.student_id || r.student_name;
    if (!map.has(key)) {
      map.set(key, {
        id: key, name: r.student_name, classCode: r.class_code,
        plays: 0, totalScore: 0, correct: 0, total: 0, last: 0, games: new Set(),
      });
    }
    const s = map.get(key);
    s.plays++;
    s.totalScore += r.score || 0;
    s.correct += r.correct_count || 0;
    s.total += r.total_count || 0;
    s.games.add(r.game_id);
    const t = new Date(r.played_at).getTime();
    if (t > s.last) s.last = t;
  }
  return Array.from(map.values())
    .map((s) => ({
      ...s,
      games: s.games.size,
      accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * BÁO CÁO CHO GIÁO VIÊN — gom điểm thành các con số dễ đọc.
 *
 * @param {Array}  rows    các lượt chơi (đã lọc sẵn theo lớp/trò/khoảng thời gian)
 * @param {Array}  roster  danh sách học sinh của lớp (bảng students)
 * @returns {{
 *   done: Array, todo: Array, extra: Array,
 *   byGame: Array, byLesson: Array, mistakes: Array,
 *   plays: number, correct: number, total: number, accuracy: number
 * }}
 *   done    — em đã làm bài (kèm số liệu)
 *   todo    — em CHƯA làm bài lần nào trong khoảng đang xem
 *   extra   — có điểm nhưng không còn trong danh sách lớp
 *   byGame  — đúng bao nhiêu % ở từng trò chơi
 *   mistakes— những từ bị sai nhiều nhất
 */
export function buildReport(rows, roster = []) {
  const board = summarise(rows);
  const byId = new Map();
  for (const s of board) {
    byId.set(s.id, s);
    byId.set(normName(s.name), s);
  }

  const done = [];
  const todo = [];
  const usedIds = new Set();

  for (const st of roster) {
    const hit = byId.get(st.id) || byId.get(normName(st.name));
    if (hit) {
      usedIds.add(hit.id);
      done.push({ ...hit, name: st.name, classCode: st.class_code || hit.classCode });
    } else {
      todo.push({ id: st.id, name: st.name, classCode: st.class_code || '' });
    }
  }

  // Có điểm nhưng không nằm trong danh sách lớp (bị xoá tên, hoặc lớp chưa nhập roster)
  const extra = board.filter((s) => !usedIds.has(s.id));
  if (!roster.length) done.push(...extra.map((s) => ({ ...s })));

  done.sort((a, b) => b.totalScore - a.totalScore);
  todo.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  /* ---- Đúng bao nhiêu % ở từng trò chơi ---- */
  const gm = new Map();
  const lm = new Map();
  let plays = 0, correct = 0, total = 0;

  for (const r of rows) {
    plays++;
    correct += r.correct_count || 0;
    total += r.total_count || 0;

    for (const [map, key] of [[gm, r.game_id || '?'], [lm, r.lesson_id || '?']]) {
      if (!map.has(key)) map.set(key, { key, plays: 0, correct: 0, total: 0, score: 0, students: new Set() });
      const g = map.get(key);
      g.plays++;
      g.correct += r.correct_count || 0;
      g.total += r.total_count || 0;
      g.score += r.score || 0;
      g.students.add(r.student_id || r.student_name);
    }
  }

  const finish = (m) => Array.from(m.values())
    .map((g) => ({
      ...g,
      students: g.students.size,
      accuracy: g.total ? Math.round((g.correct / g.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);   // trò yếu nhất lên đầu

  /* ---- Hay sai ở từ nào ---- */
  const wm = new Map();
  for (const r of rows) {
    const list = Array.isArray(r.wrong_words) ? r.wrong_words : [];
    for (const w of list) {
      const hz = String(w.hz || '').trim();
      if (!hz) continue;
      if (!wm.has(hz)) wm.set(hz, { hz, py: w.py || '', vi: w.vi || '', n: 0, students: new Set(), games: new Set() });
      const it = wm.get(hz);
      it.n += Math.max(1, Number(w.n) || 1);
      it.students.add(r.student_id || r.student_name);
      it.games.add(r.game_id);
      if (!it.py && w.py) it.py = w.py;
      if (!it.vi && w.vi) it.vi = w.vi;
    }
  }
  const mistakes = Array.from(wm.values())
    .map((w) => ({ ...w, students: w.students.size, games: Array.from(w.games) }))
    .sort((a, b) => b.n - a.n || b.students - a.students);

  return {
    done, todo, extra,
    byGame: finish(gm), byLesson: finish(lm), mistakes,
    plays, correct, total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
  };
}

/* ==================================================================== */
/*  Bài học (bài mặc định + bài giáo viên tự thêm)                      */
/* ==================================================================== */

export async function listLessons() {
  const custom = read(LS.lessons, []);
  let cloud = [];
  if (CLOUD) {
    try {
      const rows = await sb('lessons', { query: '?select=*&order=created_at.desc' });
      cloud = (rows || []).map((r) => r.payload);
    } catch (e) { console.warn(e.message); }
  }
  const seen = new Set();
  return [...LESSONS, ...cloud, ...custom].filter((l) => {
    if (!l || seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });
}

export async function saveLesson(lesson) {
  const custom = read(LS.lessons, []).filter((l) => l.id !== lesson.id);
  custom.push(lesson);
  write(LS.lessons, custom);
  if (CLOUD) {
    try {
      await sb('lessons', {
        method: 'POST',
        body: { id: lesson.id, code: lesson.code || '', title: lesson.title, payload: lesson },
        prefer: 'resolution=merge-duplicates',
      });
    } catch (e) { console.warn('Không lưu bài lên cloud:', e.message); }
  }
  return lesson;
}

export async function deleteLesson(id) {
  write(LS.lessons, read(LS.lessons, []).filter((l) => l.id !== id));
  if (CLOUD) {
    try { await sb('lessons', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` }); }
    catch (e) { console.warn(e.message); }
  }
}

export async function getLessonById(id) {
  const all = await listLessons();
  return all.find((l) => l.id === id) || all[0];
}

/* ==================================================================== */
/*  PHÒNG CHƠI KAHOOT                                                   */
/* ==================================================================== */

export function makePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Tạo phòng mới. state = { phase, qIndex, startedAt } */
export async function createRoom(pin, lessonId, questions) {
  const room = {
    pin,
    lesson_id: lessonId,
    questions,
    phase: 'lobby',
    q_index: -1,
    question_started_at: null,
    updated_at: new Date(serverNow()).toISOString(),
  };
  if (CLOUD) {
    await sb('rooms', { method: 'POST', body: room, prefer: 'resolution=merge-duplicates' });
  } else {
    const rooms = read(LS.rooms, {});
    rooms[pin] = room;
    write(LS.rooms, rooms);
  }
  return room;
}

export async function getRoom(pin) {
  if (CLOUD) {
    const rows = await sb('rooms', { query: `?select=*&pin=eq.${encodeURIComponent(pin)}&limit=1` });
    return rows && rows[0] ? rows[0] : null;
  }
  return read(LS.rooms, {})[pin] || null;
}

export async function updateRoom(pin, patch) {
  patch.updated_at = new Date(serverNow()).toISOString();
  if (CLOUD) {
    await sb('rooms', { method: 'PATCH', query: `?pin=eq.${encodeURIComponent(pin)}`, body: patch });
  } else {
    const rooms = read(LS.rooms, {});
    if (rooms[pin]) Object.assign(rooms[pin], patch);
    write(LS.rooms, rooms);
  }
}

export async function closeRoom(pin) {
  if (CLOUD) {
    try {
      await sb('room_players', { method: 'DELETE', query: `?pin=eq.${encodeURIComponent(pin)}` });
      await sb('rooms', { method: 'DELETE', query: `?pin=eq.${encodeURIComponent(pin)}` });
    } catch (e) { console.warn(e.message); }
  } else {
    const rooms = read(LS.rooms, {});
    delete rooms[pin];
    write(LS.rooms, rooms);
  }
}

export async function joinRoom(pin, name, classCode) {
  const room = await getRoom(pin);
  if (!room) throw new Error('Không tìm thấy phòng với mã PIN này');
  const player = {
    id: `${pin}::${name.toLowerCase()}`,
    pin,
    name,
    class_code: classCode || '',
    score: 0,
    correct_count: 0,
    answered_index: -1,
    joined_at: new Date(serverNow()).toISOString(),
  };
  if (CLOUD) {
    await sb('room_players', { method: 'POST', body: player, prefer: 'resolution=merge-duplicates' });
  } else {
    const rooms = read(LS.rooms, {});
    rooms[pin] = rooms[pin] || room;
    rooms[pin].players = rooms[pin].players || [];
    const ex = rooms[pin].players.findIndex((p) => p.id === player.id);
    if (ex >= 0) rooms[pin].players[ex] = player;
    else rooms[pin].players.push(player);
    write(LS.rooms, rooms);
  }
  return player;
}

export async function listPlayers(pin) {
  if (CLOUD) {
    const rows = await sb('room_players', {
      query: `?select=*&pin=eq.${encodeURIComponent(pin)}&order=score.desc`,
    });
    return rows || [];
  }
  const room = read(LS.rooms, {})[pin];
  return (room && room.players ? room.players : []).slice().sort((a, b) => b.score - a.score);
}

export async function submitAnswer(pin, playerId, qIndex, gained, isCorrect) {
  if (CLOUD) {
    const rows = await sb('room_players', {
      query: `?select=*&id=eq.${encodeURIComponent(playerId)}&limit=1`,
    });
    const p = rows && rows[0];
    if (!p) return;
    await sb('room_players', {
      method: 'PATCH',
      query: `?id=eq.${encodeURIComponent(playerId)}`,
      body: {
        score: (p.score || 0) + gained,
        correct_count: (p.correct_count || 0) + (isCorrect ? 1 : 0),
        answered_index: qIndex,
      },
    });
  } else {
    const rooms = read(LS.rooms, {});
    const room = rooms[pin];
    if (!room || !room.players) return;
    const p = room.players.find((x) => x.id === playerId);
    if (!p) return;
    p.score += gained;
    p.correct_count += isCorrect ? 1 : 0;
    p.answered_index = qIndex;
    write(LS.rooms, rooms);
  }
}

/** Theo dõi phòng bằng cách hỏi lại máy chủ mỗi `ms` (đơn giản & bền hơn websocket) */
export function watchRoom(pin, cb, ms = 1200) {
  let stopped = false;
  let timer = null;
  const tick = async () => {
    if (stopped) return;
    try {
      const [room, players] = await Promise.all([getRoom(pin), listPlayers(pin)]);
      if (!stopped) cb(room, players);
    } catch (e) { /* mạng chập chờn — thử lại lượt sau */ }
    if (!stopped) timer = setTimeout(tick, ms);
  };
  tick();
  return () => { stopped = true; clearTimeout(timer); };
}
