/**
 * TRANG ĐĂNG NHẬP
 * Học sinh: Họ tên + Mã lớp (mã lớp chính là mật khẩu, ví dụ TH2001)
 * Giáo viên: Mật khẩu đặt trong config.js
 */

import { el, mount, go, toast, sfx } from '../core.js';
import { CONFIG } from '../config.js';
import { loginStudent, loginTeacher, listClasses } from '../store.js';

export function view() {
  let mode = 'student';

  const err = el('div', { style: { marginBottom: '14px' } });
  const body = el('div.login-body');

  function setErr(msg, kind = '') {
    err.replaceChildren(msg ? el('div.alert' + (kind ? '.' + kind : ''), {}, msg) : '');
  }

  function drawStudent() {
    const name = el('input.input.input-lg', {
      placeholder: 'Ví dụ: Nguyễn Minh An',
      autocomplete: 'name',
      value: localStorage.getItem('nz_lastname') || '',
    });
    const code = el('input.input.input-lg', {
      placeholder: 'Ví dụ: TH2001',
      autocapitalize: 'characters',
      autocomplete: 'off',
      style: { textTransform: 'uppercase', letterSpacing: '.12em', textAlign: 'center', fontWeight: '800' },
      value: localStorage.getItem('nz_lastclass') || '',
    });

    const btn = el('button.btn.btn-lg.btn-block', {}, '🚀 Bắt đầu học');

    async function submit() {
      setErr('');
      btn.disabled = true;
      btn.textContent = 'Đang vào...';
      try {
        await loginStudent(name.value, code.value);
        localStorage.setItem('nz_lastname', name.value.trim());
        localStorage.setItem('nz_lastclass', code.value.trim().toUpperCase());
        sfx.win();
        go('/hoc');
      } catch (e) {
        setErr(e.message);
        btn.disabled = false;
        btn.textContent = '🚀 Bắt đầu học';
      }
    }

    btn.onclick = submit;
    [name, code].forEach((i) => i.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    }));

    body.replaceChildren(
      seg(),
      err,
      el('label.field', {}, [el('span', {}, 'Họ và tên của em'), name]),
      el('label.field', {}, [
        el('span', {}, 'Mã lớp (thầy/cô cho em)'),
        code,
        el('div.hint', {}, 'Mã lớp cũng chính là mật khẩu của em'),
      ]),
      btn,
      el('div.hint.tcenter', { style: { marginTop: '16px' } }, [
        'Vào phòng chơi nhanh? ',
        el('a', { href: '/vao-phong', 'data-link': '' }, 'Nhập mã PIN tại đây →'),
      ]),
    );

    setTimeout(() => (name.value ? code : name).focus(), 80);
    showClasses();
  }

  async function showClasses() {
    try {
      const cs = await listClasses();
      if (!cs.length) return;
      body.append(el('div', { style: { marginTop: '18px' } }, [
        el('div.hint.tcenter', { style: { marginBottom: '7px' } }, 'Các lớp đang mở:'),
        el('div.row.wrapf', { style: { justifyContent: 'center', gap: '6px' } },
          cs.map((c) => el('span.chip.chip-soft', { title: c.name }, c.code))),
      ]));
    } catch { /* bỏ qua */ }
  }

  function drawTeacher() {
    const pw = el('input.input.input-lg', {
      type: 'password',
      placeholder: 'Mật khẩu giáo viên',
      autocomplete: 'current-password',
    });
    const btn = el('button.btn.btn-lg.btn-block.btn-dark', {}, '🔑 Vào trang quản trị');

    function submit() {
      setErr('');
      try {
        loginTeacher(pw.value);
        sfx.win();
        go('/quan-tri');
      } catch (e) {
        setErr(e.message);
        pw.value = '';
        pw.focus();
      }
    }
    btn.onclick = submit;
    pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

    body.replaceChildren(
      seg(),
      err,
      el('label.field', {}, [el('span', {}, 'Mật khẩu'), pw]),
      btn,
      el('div.hint.tcenter', { style: { marginTop: '14px' } },
        'Mật khẩu được đặt trong file config.js'),
    );
    setTimeout(() => pw.focus(), 80);
  }

  function seg() {
    return el('div.seg', {}, [
      el('button' + (mode === 'student' ? '.on' : ''), {
        onclick: () => { mode = 'student'; setErr(''); drawStudent(); },
      }, '🎒 Học sinh'),
      el('button' + (mode === 'teacher' ? '.on' : ''), {
        onclick: () => { mode = 'teacher'; setErr(''); drawTeacher(); },
      }, '👩‍🏫 Giáo viên'),
    ]);
  }

  drawStudent();

  mount(el('div.login', {}, el('div.login-card', {}, [
    el('div.login-top', {}, [
      el('img', { src: '/assets/logo.png', alt: CONFIG.siteName }),
      el('h1', {}, CONFIG.siteName),
      el('p', {}, CONFIG.siteTagline),
    ]),
    body,
  ])));
}
