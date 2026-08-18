/**
 * ĐIỂM KHỞI ĐỘNG — khai báo các đường dẫn của website.
 */

import { route, setNotFound, render, go, mount, el, toast } from './core.js';
import { getGame } from './data.js';
import { currentUser, getLessonById } from './store.js';
import { page } from './views/layout.js';
import * as login from './views/login.js';
import * as home from './views/home.js';
import * as admin from './views/admin.js';
import * as live from './views/live.js';
import * as numbers from './views/numbers.js';

/* ---------------------------------------------------- các trò chơi
 * Không cần khai báo danh sách ở đây: mỗi trò chơi có `id` trong data.js
 * sẽ tự động nạp file public/js/games/<id>.js
 * → Muốn thêm trò chơi mới chỉ cần làm 2 việc:
 *     1. Tạo file  public/js/games/ten-tro-choi.js  (xem file mẫu _mau-tro-choi.js)
 *     2. Thêm 1 mục vào mảng GAMES trong data.js với id = 'ten-tro-choi'
 */
async function playView({ lessonId, gameId }) {
  const u = currentUser();
  if (!u) return go('/', true);

  const game = getGame(gameId);
  if (!game) return go('/hoc', true);
  // Chỉ cho phép chữ thường, số và dấu gạch ngang để tránh nạp nhầm file
  const safeId = String(gameId).replace(/[^a-z0-9-]/gi, '');
  const loader = () => import(`./games/${safeId}.js`);

  const lesson = await getLessonById(lessonId);
  if (!lesson || !lesson.words || lesson.words.length < 4) {
    toast('Bài này chưa đủ từ vựng để chơi', 'bad');
    return go('/hoc', true);
  }

  // Khung chứa game (không dùng nav để học sinh tập trung)
  const container = el('div');
  mount(container);

  try {
    const mod = await loader();
    mod.play(game, lesson, container);
  } catch (e) {
    console.error(e);
    toast(`Chưa có file games/${safeId}.js cho trò chơi này`, 'bad');
    go('/hoc', true);
  }
}

/* --------------------------------------------------- đường dẫn */

route('/', () => {
  const u = currentUser();
  if (u) return go(u.role === 'teacher' ? '/quan-tri' : '/hoc', true);
  login.view();
});

route('/hoc', () => home.view());
route('/quan-tri', () => admin.view());
route('/bang-so', () => numbers.view());
route('/live', () => live.host());
route('/vao-phong', () => live.join());
route('/choi/:lessonId/:gameId', playView);

setNotFound(() => {
  mount(page(el('div.wrap.empty', {}, [
    el('div.ic', {}, '🧭'),
    el('h1', {}, 'Không tìm thấy trang'),
    el('p', {}, 'Đường dẫn này không tồn tại.'),
    el('a.btn', { href: '/', 'data-link': '' }, 'Về trang chính'),
  ])));
});

/* --------------------------------------------------- khởi động */

render();

// Ẩn màn hình chờ ban đầu
const boot = document.getElementById('boot');
if (boot) boot.remove();
