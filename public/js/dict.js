/**
 * TỪ ĐIỂN TRA NHANH — dùng khi giáo viên tải bài mới lên.
 * Hệ thống sẽ tự điền pinyin + nghĩa cho những từ có trong bảng này,
 * giáo viên chỉ cần bổ sung những từ còn thiếu.
 *
 * Phạm vi: từ vựng HSK 1 và các từ hay gặp ở lớp thiếu nhi/sơ cấp.
 * Định dạng:  'Hán tự': ['pinyin', 'nghĩa tiếng Việt']
 */

export const DICT = {
  /* --- Đại từ, xưng hô --- */
  '我': ['wǒ', 'tôi, tớ'], '你': ['nǐ', 'bạn, cậu'], '您': ['nín', 'ngài (kính ngữ)'],
  '他': ['tā', 'anh ấy'], '她': ['tā', 'cô ấy'], '它': ['tā', 'nó (đồ vật, con vật)'],
  '我们': ['wǒmen', 'chúng tôi'], '你们': ['nǐmen', 'các bạn'], '他们': ['tāmen', 'họ'],
  '她们': ['tāmen', 'các cô ấy'], '大家': ['dàjiā', 'mọi người'], '自己': ['zìjǐ', 'bản thân'],

  /* --- Chào hỏi, lịch sự --- */
  '你好': ['nǐ hǎo', 'xin chào'], '您好': ['nín hǎo', 'xin chào (kính ngữ)'],
  '再见': ['zàijiàn', 'tạm biệt'], '谢谢': ['xièxie', 'cảm ơn'],
  '不客气': ['bú kèqi', 'không có gì'], '对不起': ['duìbuqǐ', 'xin lỗi'],
  '没关系': ['méi guānxi', 'không sao'], '请': ['qǐng', 'mời, xin'],
  '早上好': ['zǎoshang hǎo', 'chào buổi sáng'], '晚安': ['wǎn\'ān', 'chúc ngủ ngon'],

  /* --- Số đếm --- */
  '零': ['líng', 'không (0)'], '一': ['yī', 'một (1)'], '二': ['èr', 'hai (2)'],
  '三': ['sān', 'ba (3)'], '四': ['sì', 'bốn (4)'], '五': ['wǔ', 'năm (5)'],
  '六': ['liù', 'sáu (6)'], '七': ['qī', 'bảy (7)'], '八': ['bā', 'tám (8)'],
  '九': ['jiǔ', 'chín (9)'], '十': ['shí', 'mười (10)'], '百': ['bǎi', 'trăm'],
  '千': ['qiān', 'nghìn'], '万': ['wàn', 'vạn (10.000)'], '两': ['liǎng', 'hai (khi đếm)'],
  '几': ['jǐ', 'mấy, bao nhiêu'], '多少': ['duōshao', 'bao nhiêu'],

  /* --- Thời gian --- */
  '年': ['nián', 'năm'], '月': ['yuè', 'tháng'], '号': ['hào', 'ngày (trong tháng)'],
  '日': ['rì', 'ngày'], '星期': ['xīngqī', 'tuần, thứ'], '今天': ['jīntiān', 'hôm nay'],
  '昨天': ['zuótiān', 'hôm qua'], '明天': ['míngtiān', 'ngày mai'],
  '今年': ['jīnnián', 'năm nay'], '明年': ['míngnián', 'năm sau'], '去年': ['qùnián', 'năm ngoái'],
  '现在': ['xiànzài', 'bây giờ'], '点': ['diǎn', 'giờ'], '分钟': ['fēnzhōng', 'phút'],
  '时候': ['shíhou', 'lúc, khi'], '上午': ['shàngwǔ', 'buổi sáng'], '中午': ['zhōngwǔ', 'buổi trưa'],
  '下午': ['xiàwǔ', 'buổi chiều'], '晚上': ['wǎnshang', 'buổi tối'], '早上': ['zǎoshang', 'sáng sớm'],
  '生日': ['shēngrì', 'sinh nhật'], '出生': ['chūshēng', 'sinh ra'], '岁': ['suì', 'tuổi'],

  /* --- Gia đình --- */
  '爸爸': ['bàba', 'bố'], '妈妈': ['māma', 'mẹ'], '哥哥': ['gēge', 'anh trai'],
  '姐姐': ['jiějie', 'chị gái'], '弟弟': ['dìdi', 'em trai'], '妹妹': ['mèimei', 'em gái'],
  '爷爷': ['yéye', 'ông nội'], '奶奶': ['nǎinai', 'bà nội'], '家': ['jiā', 'nhà, gia đình'],
  '儿子': ['érzi', 'con trai'], '女儿': ['nǚ\'ér', 'con gái'], '朋友': ['péngyou', 'bạn bè'],

  /* --- Trường lớp --- */
  '老师': ['lǎoshī', 'thầy/cô giáo'], '学生': ['xuésheng', 'học sinh'],
  '同学': ['tóngxué', 'bạn học'], '学校': ['xuéxiào', 'trường học'],
  '教室': ['jiàoshì', 'phòng học'], '学习': ['xuéxí', 'học tập'],
  '汉语': ['Hànyǔ', 'tiếng Hán'], '中文': ['Zhōngwén', 'tiếng Trung'],
  '书': ['shū', 'sách'], '本子': ['běnzi', 'vở'], '笔': ['bǐ', 'bút'],
  '写': ['xiě', 'viết'], '读': ['dú', 'đọc'], '看': ['kàn', 'nhìn, xem'],
  '听': ['tīng', 'nghe'], '说': ['shuō', 'nói'], '问': ['wèn', 'hỏi'],
  '会': ['huì', 'biết, sẽ'], '能': ['néng', 'có thể'], '字': ['zì', 'chữ'],

  /* --- Động từ thường dùng --- */
  '是': ['shì', 'là'], '有': ['yǒu', 'có'], '在': ['zài', 'ở, đang'],
  '去': ['qù', 'đi'], '来': ['lái', 'đến'], '吃': ['chī', 'ăn'], '喝': ['hē', 'uống'],
  '叫': ['jiào', 'gọi là, tên là'], '做': ['zuò', 'làm'], '想': ['xiǎng', 'muốn, nhớ'],
  '喜欢': ['xǐhuan', 'thích'], '爱': ['ài', 'yêu'], '买': ['mǎi', 'mua'],
  '住': ['zhù', 'ở, sống'], '回': ['huí', 'về'], '坐': ['zuò', 'ngồi'],
  '开': ['kāi', 'mở'], '睡觉': ['shuìjiào', 'đi ngủ'], '工作': ['gōngzuò', 'làm việc'],
  '认识': ['rènshi', 'quen biết'], '玩': ['wán', 'chơi'], '走': ['zǒu', 'đi bộ'],

  /* --- Tính từ --- */
  '好': ['hǎo', 'tốt, khỏe'], '大': ['dà', 'to, lớn'], '小': ['xiǎo', 'nhỏ'],
  '多': ['duō', 'nhiều'], '少': ['shǎo', 'ít'], '高': ['gāo', 'cao'],
  '新': ['xīn', 'mới'], '老': ['lǎo', 'già, cũ'], '热': ['rè', 'nóng'],
  '冷': ['lěng', 'lạnh'], '快': ['kuài', 'nhanh'], '慢': ['màn', 'chậm'],
  '漂亮': ['piàoliang', 'xinh đẹp'], '高兴': ['gāoxìng', 'vui'], '忙': ['máng', 'bận'],
  '累': ['lèi', 'mệt'], '对': ['duì', 'đúng'], '错': ['cuò', 'sai'],

  /* --- Nghi vấn, hư từ --- */
  '什么': ['shénme', 'gì, cái gì'], '谁': ['shéi', 'ai'], '哪': ['nǎ', 'nào'],
  '哪儿': ['nǎr', 'ở đâu'], '怎么': ['zěnme', 'thế nào'], '为什么': ['wèishénme', 'tại sao'],
  '吗': ['ma', 'trợ từ nghi vấn'], '呢': ['ne', 'trợ từ'], '的': ['de', 'của'],
  '不': ['bù', 'không'], '没': ['méi', 'không, chưa'], '也': ['yě', 'cũng'],
  '很': ['hěn', 'rất'], '都': ['dōu', 'đều'], '和': ['hé', 'và'], '太': ['tài', 'quá'],
  '名字': ['míngzi', 'tên'], '一起': ['yìqǐ', 'cùng nhau'],

  /* --- Đồ vật, nơi chốn --- */
  '水': ['shuǐ', 'nước'], '茶': ['chá', 'trà'], '米饭': ['mǐfàn', 'cơm'],
  '菜': ['cài', 'món ăn, rau'], '苹果': ['píngguǒ', 'quả táo'], '钱': ['qián', 'tiền'],
  '猫': ['māo', 'con mèo'], '狗': ['gǒu', 'con chó'], '桌子': ['zhuōzi', 'cái bàn'],
  '椅子': ['yǐzi', 'cái ghế'], '电脑': ['diànnǎo', 'máy tính'], '电话': ['diànhuà', 'điện thoại'],
  '中国': ['Zhōngguó', 'Trung Quốc'], '越南': ['Yuènán', 'Việt Nam'],
  '医院': ['yīyuàn', 'bệnh viện'], '商店': ['shāngdiàn', 'cửa hàng'],
  '前面': ['qiánmiàn', 'phía trước'], '后面': ['hòumiàn', 'phía sau'],
  '上': ['shàng', 'trên'], '下': ['xià', 'dưới'], '里': ['lǐ', 'trong'],

  /* --- Màu sắc & cơ thể --- */
  '红': ['hóng', 'màu đỏ'], '黄': ['huáng', 'màu vàng'], '蓝': ['lán', 'màu xanh dương'],
  '白': ['bái', 'màu trắng'], '黑': ['hēi', 'màu đen'], '绿': ['lǜ', 'màu xanh lá'],
  '头': ['tóu', 'đầu'], '眼睛': ['yǎnjing', 'mắt'], '手': ['shǒu', 'tay'],
  '口': ['kǒu', 'miệng'], '人': ['rén', 'người'], '心': ['xīn', 'tim, lòng'],
};

/** Tra 1 từ. Trả về { py, vi } hoặc null. */
export function lookup(hz) {
  const hit = DICT[hz];
  if (hit) return { py: hit[0], vi: hit[1] };

  // Không có sẵn: thử ghép pinyin từ từng chữ đơn (chỉ để gợi ý)
  const chars = Array.from(hz);
  if (chars.length > 1 && chars.every((c) => DICT[c])) {
    return {
      py: chars.map((c) => DICT[c][0]).join(''),
      vi: chars.map((c) => DICT[c][1]).join(' + '),
      guess: true,
    };
  }
  return null;
}
