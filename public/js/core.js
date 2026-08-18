/**
 * CORE — các hàm dùng chung: tạo DOM, điều hướng, phát âm, âm thanh, hiệu ứng.
 * Không phụ thuộc thư viện ngoài.
 */

/**
 * Chuỗi "?v=..." của bản build đang chạy (rỗng khi chạy `npm run dev`).
 * Dùng khi nạp động file trò chơi để trình duyệt học sinh không dùng lại
 * bản cũ trong bộ nhớ đệm sau khi thầy/cô cập nhật website.
 */
export const BUILD_Q = new URL(import.meta.url).search;

/* ------------------------------------------------------------ DOM */

/**
 * Tạo phần tử nhanh.
 *   el('div.card', { onclick: f }, 'Nội dung')
 *   el('button.btn.btn-lg', {}, ['Chơi ', el('b', {}, 'ngay')])
 */
export function el(spec, attrs = {}, children = null) {
  const [tagPart, ...classes] = String(spec).split('.');
  const node = document.createElement(tagPart || 'div');
  if (classes.length) node.className = classes.join(' ');

  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className += (node.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }

  append(node, children);
  return node;
}

export function append(parent, children) {
  if (children === null || children === undefined || children === false) return parent;
  if (Array.isArray(children)) {
    children.forEach((c) => append(parent, c));
    return parent;
  }
  parent.append(children instanceof Node ? children : document.createTextNode(String(children)));
  return parent;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ------------------------------------------------------------ tiện ích */

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sample = (arr, n) => shuffle(arr).slice(0, n);
export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Bỏ dấu thanh pinyin để so sánh khoan dung: "nǐ hǎo" -> "ni hao" */
export function stripTone(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-̏]/g, '')
    .replace(/ü/g, 'v')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

export function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  return (parts[parts.length - 1][0] || '?').toUpperCase();
}

/* ------------------------------------------------------------ phát âm */

let voices = [];
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

/** Chọn giọng tiếng Trung phổ thông tốt nhất có trên máy học sinh */
function pickZhVoice() {
  if (!voices.length) loadVoices();
  const zh = voices.filter((v) => /^zh(-|_)?(CN|Hans)?/i.test(v.lang) || /Chinese/i.test(v.name));
  if (!zh.length) return null;
  const preferred = zh.find((v) => /Xiaoxiao|Yunxi|Huihui|Tingting|Mei-?Jia|Google/i.test(v.name));
  return preferred || zh[0];
}

export function canSpeak() {
  return 'speechSynthesis' in window && !!pickZhVoice();
}

/** Đọc to một chuỗi tiếng Trung. rate < 1 = đọc chậm cho học sinh nghe rõ. */
export function speak(text, { rate = 0.82, pitch = 1 } = {}) {
  if (!('speechSynthesis' in window)) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    const v = pickZhVoice();
    if (v) u.voice = v;
    u.lang = 'zh-CN';
    u.rate = rate;
    u.pitch = pitch;
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ âm thanh */

let ac = null;
function audio() {
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) ac = new C();
  }
  if (ac && ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq, dur, type = 'sine', vol = 0.14, delay = 0) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(c.destination);
  const t = c.currentTime + delay;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  correct() { tone(660, 0.1, 'triangle'); tone(880, 0.16, 'triangle', 0.12, 0.09); },
  wrong() { tone(200, 0.2, 'sawtooth', 0.09); tone(150, 0.26, 'sawtooth', 0.08, 0.08); },
  flip() { tone(520, 0.06, 'sine', 0.07); },
  tick() { tone(1050, 0.035, 'square', 0.04); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 'triangle', 0.13, i * 0.11)); },
  lose() { [420, 350, 260].forEach((f, i) => tone(f, 0.28, 'sine', 0.1, i * 0.13)); },
  join() { tone(740, 0.09, 'sine', 0.09); tone(988, 0.12, 'sine', 0.08, 0.07); },
};

let soundOn = localStorage.getItem('nz_sound') !== 'off';
export const sound = {
  get on() { return soundOn; },
  toggle() {
    soundOn = !soundOn;
    localStorage.setItem('nz_sound', soundOn ? 'on' : 'off');
    return soundOn;
  },
};
// Bọc sfx để tôn trọng nút bật/tắt âm thanh
for (const k of Object.keys(sfx)) {
  const fn = sfx[k];
  sfx[k] = (...a) => { if (soundOn) fn(...a); };
}

/* ------------------------------------------------------------ hiệu ứng */

export function toast(msg, kind = '') {
  let host = $('.toast-host');
  if (!host) {
    host = el('div.toast-host');
    document.body.append(host);
  }
  const t = el('div.toast' + (kind ? '.' + kind : ''), {}, msg);
  host.append(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(12px)';
    setTimeout(() => t.remove(), 320);
  }, 2400);
}

export function confetti(count = 60) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#D93A2B', '#F5901E', '#FFC02E', '#FFD75E', '#22A15A', '#2C79E8'];
  for (let i = 0; i < count; i++) {
    const c = el('div.confetti');
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * 0.5 + 's';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.append(c);
    setTimeout(() => c.remove(), 4200);
  }
}

/* ------------------------------------------------------------ router */

const routes = [];
let notFound = null;

export function route(pattern, handler) {
  routes.push({ pattern, handler });
}
export function setNotFound(fn) { notFound = fn; }

export function go(path, replace = false) {
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  render();
}

export function currentPath() {
  return location.pathname.replace(/\/+$/, '') || '/';
}

export function render() {
  const path = currentPath();
  for (const r of routes) {
    const params = matchRoute(r.pattern, path);
    if (params) {
      window.scrollTo(0, 0);
      r.handler(params);
      return;
    }
  }
  if (notFound) notFound();
}

function matchRoute(pattern, path) {
  const pp = pattern.split('/').filter(Boolean);
  const ap = path.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    else if (pp[i] !== ap[i]) return null;
  }
  return params;
}

window.addEventListener('popstate', render);

// Bắt mọi thẻ <a data-link> để điều hướng không tải lại trang
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a) return;
  e.preventDefault();
  go(a.getAttribute('href'));
});

/* ------------------------------------------------------------ app root */

export function mount(...nodes) {
  const root = document.getElementById('app');
  clear(root);
  append(root, nodes);
  return root;
}
