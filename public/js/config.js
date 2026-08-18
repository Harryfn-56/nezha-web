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
   * 2) TÀI KHOẢN QUẢN TRỊ (chủ trung tâm)
   *    Đây là tài khoản cao nhất: xem điểm TẤT CẢ các lớp, thêm/xoá lớp,
   *    và tạo tài khoản cho từng giáo viên ngay trong trang Quản trị.
   *    ⚠️ Hãy đổi mật khẩu trước khi đưa website lên mạng.
   *
   *    Các giáo viên khác KHÔNG cần khai báo ở đây — quản trị viên vào
   *    trang Quản trị → thẻ "Giáo viên" → Thêm giáo viên là xong.
   * ---------------------------------------------------------------- */
  adminUsername: 'admin',
  teacherPassword: 'nezha2026',   // mật khẩu của tài khoản quản trị

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
    url: '',
    anonKey: '',
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

    /* --- Thẻ lật ghi nhớ: chia bộ thẻ thành từng chủ đề nhỏ ---------
     * Bài nào có sẵn cột "Nhóm/chủ đề" thì chia theo chủ đề.
     * Bài nào chưa chia chủ đề thì tự cắt thành từng phần, mỗi phần
     * flashcardChunk từ.                                             */
    flashcardChunk: 10,

    /* --- Na Tra đại chiến: chữ rơi nhanh dần -----------------------
     * Cứ mỗi rushLevelEvery câu thì lên 1 cấp, chữ rơi nhanh hơn.
     * Thời gian rơi (giây) = rushStartSeconds × rushSpeedUp^(cấp − 1),
     * nhanh nhất là rushMinSeconds.
     *   Ví dụ với thông số mặc định:
     *     Cấp 1: 4.5s · Cấp 2: 3.7s · Cấp 3: 3.0s · Cấp 4: 2.5s
     *     Cấp 5: 2.0s · Cấp 6: 1.7s · Cấp 7 trở đi: 1.4s
     * Muốn khó hơn nữa: giảm rushStartSeconds hoặc giảm rushSpeedUp. */
    rushStartSeconds: 4.5,      // thời gian rơi ở cấp 1 (giây)
    rushLevelEvery: 6,          // bao nhiêu câu thì tăng tốc 1 lần
    rushSpeedUp: 0.82,          // mỗi cấp còn 82% thời gian của cấp trước
    rushMinSeconds: 1.4,        // nhanh nhất (giây)
  },
};

/** Supabase đã được cấu hình chưa? */
export function hasCloud() {
  return Boolean(CONFIG.supabase.url && CONFIG.supabase.anonKey);
}
