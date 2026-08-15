# 📖 Hướng dẫn mở rộng website NeZha

Tài liệu này trả lời 2 câu hỏi:

- [A. Thêm bài học mới](#a-thêm-bài-học-mới) — không cần biết code
- [B. Thêm dạng trò chơi mới](#b-thêm-dạng-trò-chơi-mới) — cần sửa 2 file

---

# A. Thêm bài học mới

Có 2 cách. **Quan trọng: hai cách này khác nhau ở chỗ bài học được lưu ở đâu.**

| | Cách 1 — Upload trên web | Cách 2 — Sửa file `data.js` |
|---|---|---|
| Cần biết code? | Không | Một chút (chỉ copy-paste) |
| Mất bao lâu? | 2 phút | 10 phút |
| Chưa bật Supabase | ⚠️ Chỉ có trên **đúng máy tính đó** | ✅ Mọi máy đều thấy |
| Đã bật Supabase | ✅ Mọi máy đều thấy | ✅ Mọi máy đều thấy |

> 💡 **Lời khuyên:** nếu định dùng lâu dài và thêm bài thường xuyên, hãy bật
> Supabase (mục 4 trong README, miễn phí, ~5 phút). Khi đó Cách 1 là đủ cho
> mọi trường hợp và thầy/cô không bao giờ phải đụng vào code nữa.

---

## Cách 1 — Upload file Word/PDF trên trang Quản trị

1. Đăng nhập tab **Giáo viên**
2. **Quản trị** → thẻ **📚 Bài học**
3. Điền **Tên bài** (VD: `Ôn tập bài 6–10`), **Mã lớp**, **Mô tả ngắn**
4. Kéo thả file Word `.docx` vào ô, hoặc bấm để chọn file
5. Hệ thống tự tách từ vựng và **tự tra pinyin + nghĩa** cho các từ thông dụng
6. Kiểm tra lại bảng hiện ra — sửa/bổ sung những ô còn trống
7. Bấm **💾 Lưu bài học**

Bài mới xuất hiện ngay trong ô "Chọn bài để ôn" ở trang học sinh, và **chơi được
với cả 8 trò chơi** mà không phải làm gì thêm.

### Cách trình bày file Word để máy đọc chuẩn nhất

**Tốt nhất** — mỗi dòng một từ, ngăn cách bằng dấu `|`:

```
Gia đình
爸爸 | bàba | bố
妈妈 | māma | mẹ
哥哥 | gēge | anh trai

Màu sắc
红 | hóng | màu đỏ
蓝 | lán | màu xanh dương
```

Dòng không có chữ Hán (như `Gia đình`, `Màu sắc`) sẽ tự thành **tên nhóm từ**.

**Cũng được** — chỉ liệt kê chữ Hán, cách nhau bằng dấu phẩy hoặc xuống dòng:

```
爸爸，妈妈，哥哥，姐姐
红，蓝，白，黑
```

Máy sẽ tra từ điển HSK1 có sẵn (khoảng 200 từ) để tự điền pinyin và nghĩa.
Từ nào không có trong từ điển sẽ để trống — thầy/cô gõ tay vào bảng.

**Câu hoàn chỉnh** (có dấu `。`, `？`, `！` hoặc từ 5 chữ Hán trở lên) sẽ được
tách riêng thành **mẫu câu**, dùng cho trò chơi "Sắp xếp câu":

```
我爱我的家。
你的爸爸叫什么名字？
```

Nhớ gõ nghĩa tiếng Việt cho các câu này trong bảng xem trước, vì trò "Sắp xếp
câu" hiện nghĩa tiếng Việt rồi cho học sinh xếp chữ Hán.

### Lưu ý về PDF

PDF xuất từ Word thường đọc được. PDF dạng **ảnh scan** hoặc dùng font đặc biệt
thì không đọc được — khi đó thầy/cô mở PDF, bôi đen, copy rồi **dán vào ô "Dán
văn bản"** ở ngay bên dưới.

---

## Cách 2 — Thêm thẳng vào file `data.js`

Bài thêm theo cách này nằm trong chính mã nguồn website, nên **mọi máy đều thấy**
kể cả khi chưa bật Supabase.

Mở file `public/js/data.js`. Tìm mảng `LESSONS`, thêm một khối mới **trước dấu
`];`** ở cuối mảng (nhớ dấu phẩy ngăn cách giữa các bài):

```js
  {
    id: 'tn1101-6-10',                    // mã riêng, không trùng bài khác
    code: 'TN1101',
    title: 'Ôn tập từ vựng bài 6–10',
    subtitle: 'Gia đình · Màu sắc · Đồ vật',
    emoji: '🧧',
    color: 'orange',                      // red|orange|amber|green|blue|purple|teal|crimson

    words: [
      { hz: '爸爸', py: 'bàba',  vi: 'bố',        tag: 'Gia đình' },
      { hz: '妈妈', py: 'māma',  vi: 'mẹ',        tag: 'Gia đình' },
      { hz: '哥哥', py: 'gēge',  vi: 'anh trai',  tag: 'Gia đình' },
      { hz: '红',   py: 'hóng',  vi: 'màu đỏ',    tag: 'Màu sắc'  },
      // ...thêm bao nhiêu từ tuỳ ý, tối thiểu 4 từ
    ],

    sentences: [
      { hz: '这是我的爸爸。', py: 'Zhè shì wǒ de bàba.', vi: 'Đây là bố của tôi.' },
      { hz: '我喜欢红色。',   py: 'Wǒ xǐhuan hóngsè.',   vi: 'Tôi thích màu đỏ.' },
    ],
  },
```

**Quy tắc cần nhớ:**

- Mỗi từ phải có đủ `hz` (Hán tự), `py` (pinyin), `vi` (nghĩa tiếng Việt)
- `tag` là tên nhóm, hiện trên thẻ flashcard — có thể bỏ trống
- Mỗi bài cần **ít nhất 4 từ** thì trắc nghiệm mới đủ 4 đáp án
- Muốn game "Ghép cặp" đủ 8 cặp thì nên có từ 8 từ trở lên
- Dấu phẩy, dấu ngoặc phải đúng — thiếu một dấu là website trắng trang

Xong thì chạy:

```bash
npm run build
```

rồi tải lại thư mục `dist/` lên Hostinger.

**Kiểm tra nhanh trước khi build** — nếu lỡ gõ sai dấu phẩy:

```bash
node --input-type=module --check < public/js/data.js
```

Không hiện gì = đúng cú pháp.

---

## Thêm lớp mới

**Quản trị** → **🏫 Lớp học** → nhập mã lớp + tên → **Thêm lớp**.

Hoặc sửa mảng `classes` trong `public/js/config.js` để lớp có sẵn trên mọi máy.

---

# B. Thêm dạng trò chơi mới

Website được thiết kế để việc này chỉ tốn **2 bước**.

## Bước 1 — Tạo file trò chơi

Copy file mẫu `public/js/games/_mau-tro-choi.js` thành file mới, ví dụ
`public/js/games/dung-hay-sai.js`.

File mẫu đã viết sẵn một trò trắc nghiệm hoàn chỉnh kèm chú thích tiếng Việt
từng dòng — thầy/cô chỉ cần sửa phần giữa cho hợp ý tưởng.

Cấu trúc bắt buộc của mọi file trò chơi:

```js
import { el, shuffle, sample, sleep, speak } from '../core.js';
import { Shell } from './shell.js';

export function play(game, lesson, container) {
  const shell = new Shell({ game, lesson, total: 10 });
  shell.attach(container);
  // ...phần chơi ở đây...
}
```

**Những thứ đã có sẵn, không phải tự viết:**

| Việc | Hàm dùng |
|---|---|
| Thanh tiến độ trên đầu | `shell.progress(đãXong, tổngSố)` |
| Cộng điểm, đếm chuỗi đúng, gom từ sai để ôn lại | `shell.mark(đúngHaySai, điểm, từ)` |
| Vẽ nội dung ra màn hình | `shell.setStage(...)` |
| Đồng hồ đếm ngược | `shell.countdown(giây, khiChạy, khiHết)` |
| Kết thúc + lưu điểm + màn hình sao/kết quả | `shell.finish()` |
| Đọc to tiếng Trung | `speak('你好')` |
| Xáo trộn / bốc ngẫu nhiên | `shuffle(mảng)` / `sample(mảng, n)` |
| Âm thanh đúng/sai | `sfx.correct()` / `sfx.wrong()` |
| Điểm theo tốc độ trả lời | `timeScore(thờiGianCònLại)` |

Phần lưu điểm về Supabase, tính sao, hiện danh sách "cần ôn lại" — **Shell tự
làm hết**, trò chơi mới không phải viết lại.

## Bước 2 — Khai báo trong `data.js`

Mở `public/js/data.js`, thêm vào cuối mảng `GAMES`:

```js
  {
    id: 'dung-hay-sai',          // ⚠️ PHẢI trùng tên file (không có đuôi .js)
    name: 'Đúng hay Sai',
    cn: '对还是错',
    desc: 'Hiện một cặp Hán tự và nghĩa, bấm Đúng/Sai thật nhanh',
    icon: '⚖️',
    color: 'purple',
    skill: 'Phản xạ',
  },
```

Xong. Chạy `npm run dev` để thử — thẻ trò chơi mới tự xuất hiện ở trang chính,
website tự tìm và nạp file `games/dung-hay-sai.js`. Không phải sửa file nào khác.

Rồi `npm run build` và tải lại `dist/` lên Hostinger.

## Cách giao diện lấy màu

Trong CSS đã có sẵn 8 bộ màu. Chỉ cần đặt đúng tên trong `color:` là thẻ trò
chơi và các nút tự đổi màu theo:

`red` · `orange` · `amber` · `green` · `blue` · `purple` · `teal` · `crimson`

## Các lớp CSS hay dùng khi viết trò chơi

| Lớp | Dùng để |
|---|---|
| `qbox` | khung câu hỏi lớn màu trắng ở giữa |
| `q-hz` | chữ Hán cỡ rất lớn |
| `q-vi` | câu tiếng Việt cỡ lớn |
| `lbl` | dòng chữ nhỏ in hoa phía trên câu hỏi |
| `opts` + `opt` | lưới 4 đáp án (tự thành 1 cột trên điện thoại) |
| `opt correct` / `opt wrong` / `opt dim` | tô xanh / đỏ / làm mờ đáp án |
| `btn btn-lg` | nút bấm lớn |
| `card` | khung trắng bo góc có đổ bóng |
| `bar timer` | thanh đồng hồ đếm ngược |

## Ý tưởng trò chơi có thể làm tiếp

- **Tô nét chữ Hán** — dùng `<canvas>`, học sinh vẽ theo nét mờ
- **Đoán chữ bí ẩn** — hiện dần từng phần chữ, đoán sớm nhiều điểm
- **Nối chữ (接龙)** — chữ cuối từ này là chữ đầu từ kia
- **Đúng hay Sai** — cặp Hán tự + nghĩa, bấm nhanh Đúng/Sai
- **Điền vào chỗ trống** — `我___明明。` chọn từ đúng
- **Nghe viết chính tả** — máy đọc câu, học sinh gõ pinyin
- **Bingo từ vựng** — lưới 5×5, thầy cô đọc, học sinh đánh dấu

---

# C. Nếu thầy/cô không muốn tự code

Mã nguồn đã có sẵn trên GitHub. Bất cứ lúc nào cần thêm bài hay thêm trò chơi,
mở một phiên Claude mới, đưa link repo GitHub (hoặc file zip mã nguồn) và nói rõ:

> "Đây là website game tiếng Trung của tôi. Thêm giúp tôi trò chơi *Đoán chữ bí
> ẩn*: hiện dần từng nét chữ Hán, học sinh đoán nghĩa, đoán càng sớm càng nhiều
> điểm. Làm theo đúng mẫu trong `public/js/games/_mau-tro-choi.js`."

Hoặc với bài học mới, chỉ cần đính kèm file Word và nói:

> "Thêm nội dung file Word này thành một bài mới trong `public/js/data.js`,
> có đủ pinyin và nghĩa tiếng Việt."

File `_mau-tro-choi.js` và tài liệu này chính là để phiên Claude sau đọc và làm
đúng chuẩn của dự án.

---

# D. Bảng tra nhanh — sửa gì thì mở file nào

| Muốn đổi | Mở file |
|---|---|
| Mật khẩu giáo viên | `public/js/config.js` → `teacherPassword` |
| Danh sách mã lớp | `public/js/config.js` → `classes` |
| Tên trung tâm, khẩu hiệu | `public/js/config.js` → `siteName`, `siteTagline` |
| Số câu mỗi lượt, thời gian trả lời, số mạng | `public/js/config.js` → `game` |
| Kết nối Supabase | `public/js/config.js` → `supabase` |
| Từ vựng, mẫu câu, danh sách trò chơi | `public/js/data.js` |
| Từ điển tự tra khi upload file | `public/js/dict.js` |
| Màu sắc, phông chữ, giao diện | `public/css/style.css` |
| Nội dung một trò chơi cụ thể | `public/js/games/<tên trò>.js` |
| Trang đăng nhập / trang chính / quản trị | `public/js/views/` |
| Logo | `public/assets/logo.png` (và `logo-trong-suot.png`) |

Sau mọi thay đổi: `npm run build` → tải lại `dist/` lên Hostinger.

---

# E. Các nơi host miễn phí (thay cho Hostinger)

Website này là trang tĩnh nên host ở đâu cũng được. File build `dist/` đã kèm sẵn
cấu hình cho cả 4 nền tảng dưới đây — không phải sửa gì thêm.

| | Cloudflare Pages | Netlify | Vercel | GitHub Pages |
|---|---|---|---|---|
| Băng thông/tháng | **Không giới hạn** | 100 GB | 100 GB | 100 GB (mềm) |
| Tên miền riêng | ✅ miễn phí | ✅ | ✅ | ✅ |
| HTTPS | ✅ tự động | ✅ | ✅ | ✅ |
| Tự deploy khi push GitHub | ✅ | ✅ | ✅ | ✅ (qua Actions) |
| Chống DDoS | ✅ | ❌ | ❌ | ❌ |
| Cho dùng mục đích kinh doanh | ✅ | ✅ | ✅ | ⚠️ Điều khoản cấm dùng cho SaaS/thương mại |

## Khuyến nghị: Cloudflare Pages

Lý do hợp với trung tâm dạy học:

- **Băng thông không giới hạn** — cả lớp 30 em cùng vào chơi Kahoot không lo vượt hạn mức
- Máy chủ ở ~300 thành phố, có node tại Việt Nam nên **tải nhanh**
- Nối thẳng với GitHub: mỗi lần `git push` là website **tự cập nhật**, không cần FTP
- Được địa chỉ sẵn dạng `nezha-web.pages.dev`, gắn tên miền riêng sau cũng được

### Các bước (khoảng 5 phút)

1. Vào https://dash.cloudflare.com → đăng ký miễn phí
2. Menu trái → **Workers & Pages** → **Create** → thẻ **Pages** → **Connect to Git**
3. Cho phép Cloudflare truy cập GitHub → chọn repo **nezha-web**
4. Ở phần cấu hình build, điền đúng 2 ô:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Bấm **Save and Deploy**, chờ ~1 phút

Xong. Website chạy tại `https://nezha-web.pages.dev`. Từ giờ mỗi lần `git push`
là Cloudflare tự build lại và cập nhật.

**Gắn tên miền riêng:** vào project vừa tạo → **Custom domains** → **Set up a
domain** → nhập tên miền → làm theo hướng dẫn đổi DNS.

## Netlify / Vercel

Cách làm gần như hệt Cloudflare: đăng nhập bằng GitHub → Import repo →
build command `npm run build`, output `dist` → Deploy.

## GitHub Pages — có 1 lưu ý quan trọng

GitHub Pages đặt website tại `harryfn-56.github.io/nezha-web/`, tức là nằm trong
**thư mục con**. Website này dùng đường dẫn tuyệt đối (`/js/main.js`) nên đặt ở
thư mục con sẽ **không chạy**.

Chỉ dùng được GitHub Pages nếu anh **gắn tên miền riêng** (khi đó website nằm ở
gốc tên miền). Ngoài ra điều khoản của GitHub Pages không cho phép dùng cho mục
đích thương mại — trung tâm dạy học có thu học phí thì nên tránh.

→ Vì vậy **Cloudflare Pages là lựa chọn tốt nhất** cho dự án này.

## Vẫn muốn dùng Hostinger?

Không sao cả — Hostinger vẫn chạy tốt và anh đã có sẵn cấu hình `.htaccess`.
Có thể dùng **cả hai**: Cloudflare Pages làm bản chính (nhanh, tự cập nhật),
Hostinger làm bản dự phòng.
