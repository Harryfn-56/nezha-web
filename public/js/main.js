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

/* --------------------------------------------------- các trò chơi */
const GAME_MODULES = {
  flashcard: () => import('./games/flashcard.js'),
  quiz: () => import('./games/quiz.js'),
  match: () => import('./games/match.js'),
  pinyin: () => import('./games/pinyin.js'),
  listen: () => import('./games/listen.js'),
  sentence: () => import('./games/sentence.js'),
  datequiz: () => import('./games/datequiz.js'),
  rush: () => import('./games/rush.js'),
};

async function playView({ lessonId, gameId }) {
  const u = currentUser();
  if (!u) return go('/', true);

  const game = getGame(gameId);
  const loader = GAME_MODULES[gameId];
  if (!game || !loader) return go('/hoc', true);

  const lesson = await getLessonById(lessonId);
  if (!lesson || !lesson.words || lesson.words.length < 4) {
    toast('Bài này chưa đủ từ vựng để chơi', 'bad');
    return go('/hoc', true);
  }

  // Khung chứa game (không dùng nav để học sinh tập trung)
  const container = el('div');
  mount(container);

  const mod = await loader();
  mod.play(game, lesson, container);
}

/* --------------------------------------------------- đường dẫn */

route('/', () => {
  const u = currentUser();
  if (u) return go(u.role === 'teacher' ? '/quan-tri' : '/hoc', true);
  login.view();
});

route('/hoc', () => home.view());
route('/quan-tri', () => admin.view());
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
