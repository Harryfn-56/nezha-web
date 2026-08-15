/**
 * NGÂN HÀNG NỘI DUNG HỌC
 * ----------------------------------------------------------------------
 * Mỗi bài học là 1 object. Giáo viên có thể thêm bài mới bằng 2 cách:
 *   (1) Vào trang Quản trị → "Thêm bài học" → tải file Word/PDF hoặc dán văn bản
 *   (2) Thêm trực tiếp vào mảng LESSONS bên dưới rồi build lại
 *
 * Cấu trúc 1 từ vựng:  { hz: Hán tự, py: pinyin, vi: nghĩa tiếng Việt, tag: nhóm }
 * Cấu trúc 1 mẫu câu:  { hz, py, vi }
 */

export const LESSONS = [
  {
    id: 'tn1101-1-5',
    code: 'TN1101',
    title: 'Ôn tập từ vựng bài 1–5',
    subtitle: 'Chào hỏi · Đại từ · Số đếm · Ngày tháng · Sinh nhật',
    emoji: '🏮',
    color: 'red',
    words: [
      /* --- Đại từ nhân xưng ------------------------------------------ */
      { hz: '我', py: 'wǒ', vi: 'tôi, tớ, mình', tag: 'Đại từ' },
      { hz: '你', py: 'nǐ', vi: 'bạn, cậu', tag: 'Đại từ' },
      { hz: '您', py: 'nín', vi: 'ngài, ông/bà (kính ngữ)', tag: 'Đại từ' },
      { hz: '他', py: 'tā', vi: 'anh ấy, cậu ấy', tag: 'Đại từ' },
      { hz: '她', py: 'tā', vi: 'cô ấy, chị ấy', tag: 'Đại từ' },
      { hz: '我们', py: 'wǒmen', vi: 'chúng tôi, chúng ta', tag: 'Đại từ' },
      { hz: '你们', py: 'nǐmen', vi: 'các bạn', tag: 'Đại từ' },
      { hz: '他们', py: 'tāmen', vi: 'họ, bọn họ', tag: 'Đại từ' },

      /* --- Trường lớp ------------------------------------------------- */
      { hz: '老师', py: 'lǎoshī', vi: 'thầy giáo, cô giáo', tag: 'Trường lớp' },
      { hz: '的', py: 'de', vi: 'của (trợ từ sở hữu)', tag: 'Trường lớp' },
      { hz: '我的老师', py: 'wǒ de lǎoshī', vi: 'thầy/cô của tôi', tag: 'Trường lớp' },

      /* --- Chào hỏi --------------------------------------------------- */
      { hz: '你好', py: 'nǐ hǎo', vi: 'xin chào', tag: 'Chào hỏi' },
      { hz: '您好', py: 'nín hǎo', vi: 'xin chào (kính ngữ)', tag: 'Chào hỏi' },
      { hz: '老师好', py: 'lǎoshī hǎo', vi: 'em chào thầy/cô', tag: 'Chào hỏi' },
      { hz: '再见', py: 'zàijiàn', vi: 'tạm biệt', tag: 'Chào hỏi' },

      /* --- Số đếm ----------------------------------------------------- */
      { hz: '一', py: 'yī', vi: 'một (1)', tag: 'Số đếm' },
      { hz: '二', py: 'èr', vi: 'hai (2)', tag: 'Số đếm' },
      { hz: '三', py: 'sān', vi: 'ba (3)', tag: 'Số đếm' },
      { hz: '四', py: 'sì', vi: 'bốn (4)', tag: 'Số đếm' },
      { hz: '五', py: 'wǔ', vi: 'năm (5)', tag: 'Số đếm' },
      { hz: '六', py: 'liù', vi: 'sáu (6)', tag: 'Số đếm' },
      { hz: '七', py: 'qī', vi: 'bảy (7)', tag: 'Số đếm' },
      { hz: '八', py: 'bā', vi: 'tám (8)', tag: 'Số đếm' },
      { hz: '九', py: 'jiǔ', vi: 'chín (9)', tag: 'Số đếm' },
      { hz: '十', py: 'shí', vi: 'mười (10)', tag: 'Số đếm' },

      /* --- Hỏi tên ---------------------------------------------------- */
      { hz: '叫', py: 'jiào', vi: 'gọi là, tên là', tag: 'Hỏi tên' },
      { hz: '什么', py: 'shénme', vi: 'gì, cái gì', tag: 'Hỏi tên' },
      { hz: '名字', py: 'míngzi', vi: 'tên', tag: 'Hỏi tên' },

      /* --- Thời gian -------------------------------------------------- */
      { hz: '昨天', py: 'zuótiān', vi: 'hôm qua', tag: 'Thời gian' },
      { hz: '今天', py: 'jīntiān', vi: 'hôm nay', tag: 'Thời gian' },
      { hz: '明天', py: 'míngtiān', vi: 'ngày mai', tag: 'Thời gian' },
      { hz: '今年', py: 'jīnnián', vi: 'năm nay', tag: 'Thời gian' },
      { hz: '明年', py: 'míngnián', vi: 'năm sau, sang năm', tag: 'Thời gian' },
      { hz: '年', py: 'nián', vi: 'năm', tag: 'Thời gian' },
      { hz: '月', py: 'yuè', vi: 'tháng', tag: 'Thời gian' },
      { hz: '号', py: 'hào', vi: 'ngày (trong tháng)', tag: 'Thời gian' },

      /* --- Các tháng -------------------------------------------------- */
      { hz: '一月', py: 'yīyuè', vi: 'tháng Một', tag: 'Tháng' },
      { hz: '二月', py: 'èryuè', vi: 'tháng Hai', tag: 'Tháng' },
      { hz: '三月', py: 'sānyuè', vi: 'tháng Ba', tag: 'Tháng' },
      { hz: '四月', py: 'sìyuè', vi: 'tháng Tư', tag: 'Tháng' },
      { hz: '五月', py: 'wǔyuè', vi: 'tháng Năm', tag: 'Tháng' },
      { hz: '六月', py: 'liùyuè', vi: 'tháng Sáu', tag: 'Tháng' },
      { hz: '七月', py: 'qīyuè', vi: 'tháng Bảy', tag: 'Tháng' },
      { hz: '八月', py: 'bāyuè', vi: 'tháng Tám', tag: 'Tháng' },
      { hz: '九月', py: 'jiǔyuè', vi: 'tháng Chín', tag: 'Tháng' },
      { hz: '十月', py: 'shíyuè', vi: 'tháng Mười', tag: 'Tháng' },
      { hz: '十一月', py: 'shíyīyuè', vi: 'tháng Mười một', tag: 'Tháng' },
      { hz: '十二月', py: "shí'èryuè", vi: 'tháng Mười hai', tag: 'Tháng' },

      /* --- Sinh nhật -------------------------------------------------- */
      { hz: '生日', py: 'shēngrì', vi: 'sinh nhật', tag: 'Sinh nhật' },
      { hz: '我的生日', py: 'wǒ de shēngrì', vi: 'sinh nhật của tôi', tag: 'Sinh nhật' },
      { hz: '你的生日', py: 'nǐ de shēngrì', vi: 'sinh nhật của bạn', tag: 'Sinh nhật' },
      { hz: '老师的生日', py: 'lǎoshī de shēngrì', vi: 'sinh nhật của thầy/cô', tag: 'Sinh nhật' },
      { hz: '出生', py: 'chūshēng', vi: 'sinh ra, ra đời', tag: 'Sinh nhật' },
      { hz: '岁', py: 'suì', vi: 'tuổi', tag: 'Sinh nhật' },
    ],

    /* --- Mẫu câu: dùng cho game "Sắp xếp câu" và "Nghe hiểu" --------- */
    sentences: [
      { hz: '你好！', py: 'Nǐ hǎo!', vi: 'Xin chào!' },
      { hz: '老师好！', py: 'Lǎoshī hǎo!', vi: 'Em chào thầy/cô!' },
      { hz: '再见！', py: 'Zàijiàn!', vi: 'Tạm biệt!' },
      { hz: '你叫什么名字？', py: 'Nǐ jiào shénme míngzi?', vi: 'Bạn tên là gì?' },
      { hz: '我叫明明。', py: 'Wǒ jiào Míngmíng.', vi: 'Tôi tên là Minh Minh.' },
      { hz: '他是我的老师。', py: 'Tā shì wǒ de lǎoshī.', vi: 'Anh ấy là thầy giáo của tôi.' },
      { hz: '今天是八月十一号。', py: 'Jīntiān shì bāyuè shíyī hào.', vi: 'Hôm nay là ngày 11 tháng 8.' },
      { hz: '我的生日是五月三号。', py: 'Wǒ de shēngrì shì wǔyuè sān hào.', vi: 'Sinh nhật của tôi là ngày 3 tháng 5.' },
      { hz: '我今年十岁。', py: 'Wǒ jīnnián shí suì.', vi: 'Năm nay tôi mười tuổi.' },
      { hz: '我二零一五年出生。', py: 'Wǒ èr líng yī wǔ nián chūshēng.', vi: 'Tôi sinh năm 2015.' },
      { hz: '明天是我的生日。', py: 'Míngtiān shì wǒ de shēngrì.', vi: 'Ngày mai là sinh nhật của tôi.' },
      { hz: '你们好！', py: 'Nǐmen hǎo!', vi: 'Chào các bạn!' },
    ],
  },
];

/* -------------------------------------------------------------------- */
/*  SỐ ĐẾM & NGÀY THÁNG — dùng cho game "Ngày tháng NeZha"              */
/* -------------------------------------------------------------------- */

export const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const DIGITS_PY = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];

/** Đổi số 1–99 sang chữ Hán (11 → 十一, 30 → 三十, 25 → 二十五) */
export function numToHanzi(n) {
  if (n < 0 || n > 99) return String(n);
  if (n < 10) return DIGITS[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + DIGITS[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return DIGITS[t] + '十' + (o ? DIGITS[o] : '');
}

/** Đọc năm theo kiểu tiếng Trung: 2026 → 二零二六 */
export function yearToHanzi(y) {
  return String(y).split('').map((d) => DIGITS[Number(d)]).join('');
}

export function yearToPinyin(y) {
  return String(y).split('').map((d) => DIGITS_PY[Number(d)]).join(' ');
}

/** 2026/8/11 → { hz: '二零二六年八月十一号', mix: '2026年8月11号' } */
export function dateToChinese(y, m, d) {
  return {
    hz: `${yearToHanzi(y)}年${numToHanzi(m)}月${numToHanzi(d)}号`,
    mix: `${y}年${m}月${d}号`,
    vi: `Ngày ${d} tháng ${m} năm ${y}`,
  };
}

/* -------------------------------------------------------------------- */
/*  DANH MỤC CÁC TRÒ CHƠI                                               */
/* -------------------------------------------------------------------- */

export const GAMES = [
  {
    id: 'flashcard',
    name: 'Thẻ lật ghi nhớ',
    cn: '闪卡',
    desc: 'Lật thẻ xem Hán tự – pinyin – nghĩa, nghe phát âm chuẩn',
    icon: '🃏',
    color: 'red',
    skill: 'Ghi nhớ',
  },
  {
    id: 'quiz',
    name: 'Trắc nghiệm 4 đáp án',
    cn: '选择题',
    desc: 'Chọn nghĩa đúng của từ trong 4 lựa chọn, tính điểm theo tốc độ',
    icon: '🎯',
    color: 'orange',
    skill: 'Nhận biết',
  },
  {
    id: 'match',
    name: 'Ghép cặp trí nhớ',
    cn: '配对',
    desc: 'Lật tìm cặp Hán tự ↔ nghĩa, càng ít lượt lật càng nhiều điểm',
    icon: '🀄',
    color: 'amber',
    skill: 'Trí nhớ',
  },
  {
    id: 'pinyin',
    name: 'Gõ pinyin',
    cn: '拼音输入',
    desc: 'Nhìn Hán tự và gõ đúng pinyin, có gợi ý dấu thanh',
    icon: '⌨️',
    color: 'green',
    skill: 'Chính tả',
  },
  {
    id: 'listen',
    name: 'Nghe chọn từ',
    cn: '听力',
    desc: 'Nghe phát âm rồi chọn đúng Hán tự tương ứng',
    icon: '🎧',
    color: 'blue',
    skill: 'Nghe hiểu',
  },
  {
    id: 'sentence',
    name: 'Sắp xếp câu',
    cn: '排句子',
    desc: 'Kéo các chữ về đúng trật tự để tạo thành câu hoàn chỉnh',
    icon: '🧩',
    color: 'purple',
    skill: 'Ngữ pháp',
  },
  {
    id: 'datequiz',
    name: 'Ngày tháng NeZha',
    cn: '日期',
    desc: 'Đổi ngày tháng năm sang tiếng Trung: 2026/8/11 → 二零二六年八月十一号',
    icon: '📅',
    color: 'teal',
    skill: 'Vận dụng',
  },
  {
    id: 'rush',
    name: 'Na Tra đại chiến',
    cn: '闯关',
    desc: 'Chữ rơi từ trên xuống, chọn nghĩa đúng thật nhanh trước khi chạm đất',
    icon: '🔥',
    color: 'crimson',
    skill: 'Phản xạ',
  },
];

export function getLesson(id) {
  return LESSONS.find((l) => l.id === id) || LESSONS[0];
}

export function getGame(id) {
  return GAMES.find((g) => g.id === id);
}
