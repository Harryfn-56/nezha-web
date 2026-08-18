-- =====================================================================
-- NeZha Chinese Center — CƠ SỞ DỮ LIỆU
-- Dán TOÀN BỘ file này vào Supabase → SQL Editor → bấm RUN
-- =====================================================================

-- ---------------------------------------------------------------- LỚP
create table if not exists public.classes (
  code        text primary key,
  name        text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------- GIÁO VIÊN
-- Tài khoản đăng nhập của từng giáo viên, do quản trị viên tạo trong
-- trang Quản trị → thẻ "Giáo viên". Cột classes là danh sách mã lớp mà
-- giáo viên đó được xem điểm, ví dụ: ["TN1101","TH2001"]
create table if not exists public.teachers (
  username    text primary key,
  name        text not null default '',
  password    text not null default '',
  classes     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------- HỌC SINH
create table if not exists public.students (
  id          text primary key,           -- dạng "TN1101::nguyễn minh an"
  name        text not null,
  class_code  text not null,
  created_at  timestamptz not null default now()
);
create index if not exists students_class_idx on public.students (class_code);

-- --------------------------------------------------------------- ĐIỂM
create table if not exists public.scores (
  id            bigserial primary key,
  student_id    text not null,
  student_name  text not null,
  class_code    text not null default '',
  lesson_id     text not null default '',
  game_id       text not null default '',
  score         integer not null default 0,
  max_score     integer not null default 0,
  correct_count integer not null default 0,
  total_count   integer not null default 0,
  duration_ms   integer not null default 0,
  played_at     timestamptz not null default now()
);
create index if not exists scores_student_idx on public.scores (student_id, played_at desc);
create index if not exists scores_class_idx   on public.scores (class_code, played_at desc);

-- ----------------------------------------------------------- BÀI HỌC
create table if not exists public.lessons (
  id          text primary key,
  code        text not null default '',
  title       text not null default '',
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------- PHÒNG KAHOOT
create table if not exists public.rooms (
  pin                 text primary key,
  lesson_id           text not null default '',
  questions           jsonb not null default '[]'::jsonb,
  phase               text not null default 'lobby',   -- lobby | question | reveal | end
  q_index             integer not null default -1,
  question_started_at timestamptz,
  updated_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create table if not exists public.room_players (
  id             text primary key,          -- dạng "123456::minh an"
  pin            text not null,
  name           text not null,
  class_code     text not null default '',
  score          integer not null default 0,
  correct_count  integer not null default 0,
  answered_index integer not null default -1,
  joined_at      timestamptz not null default now()
);
create index if not exists room_players_pin_idx on public.room_players (pin, score desc);

-- =====================================================================
-- QUYỀN TRUY CẬP
-- Website là trang tĩnh nên dùng khoá "anon". Ở đây mở quyền đọc/ghi
-- cho anon vì đây là ứng dụng học tập nội bộ, không chứa dữ liệu nhạy cảm
-- (chỉ có tên học sinh và điểm ôn tập).
-- =====================================================================

alter table public.classes      enable row level security;
alter table public.teachers     enable row level security;
alter table public.students     enable row level security;
alter table public.scores       enable row level security;
alter table public.lessons      enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_players enable row level security;

do $$
declare t text;
begin
  foreach t in array array['classes','teachers','students','scores','lessons','rooms','room_players']
  loop
    execute format('drop policy if exists "nezha_all" on public.%I', t);
    execute format(
      'create policy "nezha_all" on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- =====================================================================
-- DỮ LIỆU BAN ĐẦU — sửa lại cho đúng lớp của trung tâm
-- =====================================================================

insert into public.classes (code, name) values
  ('TN1101', 'Lớp TN1101 — Sơ cấp 1'),
  ('TH2001', 'Lớp TH2001 — Thiếu nhi')
on conflict (code) do nothing;

-- =====================================================================
-- DỌN DẸP TỰ ĐỘNG (tuỳ chọn)
-- Xoá các phòng Kahoot cũ hơn 1 ngày để bảng không phình to.
-- Chạy tay khi cần, hoặc đặt lịch bằng pg_cron nếu gói Supabase hỗ trợ.
-- =====================================================================

create or replace function public.cleanup_old_rooms()
returns void language sql as $$
  delete from public.room_players
   where pin in (select pin from public.rooms where created_at < now() - interval '1 day');
  delete from public.rooms where created_at < now() - interval '1 day';
$$;
