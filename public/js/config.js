/**
 * ⚙️  FILE CẤU HÌNH — GIÁO VIÊN CHỈNH Ở ĐÂY
 * ======================================================================
 * Sau khi sửa file này, chạy `npm run build` rồi tải lại thư mục dist/
 * lên Hostinger là xong.
 */

export const CONFIG = {
  /* ------------------------------------------------------------------
   * 1) TÊN TRUNG TÂM
   * ---------------------------------------------------------------- */
  siteName: 'NeZha Chinese Center',
  siteTagline: 'Học tiếng Trung — Chơi mà nhớ',

  /* ------------------------------------------------------------------
   * 2) MẬT KHẨU GIÁO VIÊN
   *    Dùng để vào trang Quản trị (xem điểm, thêm bài, mở phòng Kahoot).
   *    ⚠️ Hãy đổi thành mật khẩu của riêng bạn trước khi đưa lên mạng.
   * ---------------------------------------------------------------- */
  teacherPassword: 'Nezha@2026',

  /* ------------------------------------------------------------------
   * 3) DANH SÁCH MÃ LỚP (chính là mật khẩu của học sinh)
   *    Học sinh gõ tên + mã lớp để vào. Mã nào không có trong danh sách
   *    này thì không vào được.
   *    Bạn cũng có thể thêm/xoá lớp ngay trong trang Quản trị.
   * ---------------------------------------------------------------- */
  classes: [
    { code: 'TN1101', name: 'Lớp TN1101 — Sơ cấp 1' },
    { code: 'TH2001', name: 'Lớp TH2001 — Thiếu nhi' },
  ],

  /* ------------------------------------------------------------------
   * 4) SUPABASE — nơi lưu điểm học sinh & chạy phòng Kahoot
   *
   *    ➜ Nếu để trống: website vẫn chạy đủ 8 game, điểm lưu trên chính
   *      máy của học sinh (giáo viên không xem tập trung được).
   *
   *    ➜ Cách bật (miễn phí, khoảng 5 phút):
   *      B1. Vào supabase.com → Sign up → New project
   *      B2. Mở tab SQL Editor → dán toàn bộ nội dung file
   *          supabase/schema.sql trong dự án này → bấm Run
   *      B3. Vào Project Settings → API, chép 2 giá trị vào bên dưới:
   *            Project URL      →  url
   *            anon public key  →  anonKey
   *      B4. npm run build  →  tải lại dist/ lên Hostinger
   * ---------------------------------------------------------------- */
  supabase: {
    url: 'https://bgduzfskeqfnboytktus.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZHV6ZnNrZXFmbmJveXRrdHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTQxMTEsImV4cCI6MjEwMjM3MDExMX0.oU89B3qG0GJlJ1Zup3l0T9_Ttrch4vWgo712oJ2ETqU',
  },

  /* ------------------------------------------------------------------
   * 5) THÔNG SỐ TRÒ CHƠI
   * ---------------------------------------------------------------- */
  game: {
    questionsPerRound: 12,      // số câu mỗi lượt chơi
    matchPairs: 8,              // số cặp trong game Ghép cặp
    quizSeconds: 20,            // thời gian trả lời 1 câu trắc nghiệm
    liveSeconds: 20,            // thời gian 1 câu trong phòng Kahoot
    rushLives: 3,               // số mạng trong game Na Tra đại chiến
    passPercent: 60,            // % để coi là "đạt"
  },
};

/** Supabase đã được cấu hình chưa? */
export function hasCloud() {
  return Boolean(CONFIG.supabase.url && CONFIG.supabase.anonKey);
}
