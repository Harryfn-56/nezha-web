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
};

const read = (k, def) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const CLOUD = hasCloud();

/* ==================================================================== */
/*  Lớp gọi REST Supabase                                               */
/* ==================================================================== */

async function sb(table, { method = 'GET', query = '', body = null, prefer = '' } = {}) {
  if (!CLOUD) throw new Error('Chưa cấu hình Supabase');
  const url = `${CONFIG.supabase.url.replace(/\/$/, '')}/rest/v1/${table}${query}`;
  const headers = {
    apikey: CONFIG.supabase.anonKey,
    Authorization: `Bearer ${CONFIG.supabase.anonKey}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
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
  return read(LS.user, null);
}

export function logout() {
  localStorage.removeItem(LS.user);
}

/** Học sinh: tên + mã lớp (mã lớp đóng vai trò mật khẩu) */
export async function loginStudent(name, classCode) {
  name = String(name).trim().replace(/\s+/g, ' ');
  classCode = String(classCode).trim().toUpperCase();

  if (name.length < 2) throw new Error('Vui lòng nhập họ tên đầy đủ của em');
  if (!classCode) throw new Error('Vui lòng nhập mã lớp');

  const classes = await listClasses();
  const found = classes.find((c) => c.code.toUpperCase() === classCode);
  if (!found) throw new Error('Mã lớp không đúng. Em hỏi lại thầy/cô nhé!');

  const user = {
    role: 'student',
    name,
    classCode: found.code,
    className: found.name,
    id: `${found.code}::${name.toLowerCase()}`,
    since: Date.now(),
  };

  if (CLOUD) {
    try {
      await sb('students', {
        method: 'POST',
        body: { id: user.id, name, class_code: found.code },
        prefer: 'resolution=merge-duplicates',
      });
    } catch (e) { console.warn('Không lưu được học sinh lên cloud:', e.message); }
  }

  write(LS.user, user);
  return user;
}

/** Giáo viên: mật khẩu trong config.js */
export function loginTeacher(password) {
  if (String(password) !== CONFIG.teacherPassword) {
    throw new Error('Mật khẩu giáo viên không đúng');
  }
  const user = { role: 'teacher', name: 'Giáo viên', id: 'teacher', since: Date.now() };
  write(LS.user, user);
  return user;
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
    played_at: new Date().toISOString(),
  };

  // Luôn lưu bản sao ở máy để học sinh xem được lịch sử kể cả khi mất mạng
  const local = read(LS.scores, []);
  local.push(row);
  write(LS.scores, local.slice(-500));

  if (CLOUD) {
    try { await sb('scores', { method: 'POST', body: row }); }
    catch (e) { console.warn('Không gửi được điểm lên cloud:', e.message); }
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

/** Gom điểm theo học sinh để làm bảng tổng hợp cho giáo viên */
export function summarise(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.student_id || r.student_name;
    if (!map.has(key)) {
      map.set(key, {
        name: r.student_name, classCode: r.class_code,
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
    updated_at: new Date().toISOString(),
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
  patch.updated_at = new Date().toISOString();
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
    joined_at: new Date().toISOString(),
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
