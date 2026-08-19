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

> 💡 Tên nhóm rất đáng để đặt: trò **Thẻ lật ghi nhớ** dùng chính các nhóm này
> làm màn hình "Em muốn ôn chủ đề nào?", nên học sinh học từng chủ đề nhỏ thay
> vì phải lật hết mấy chục thẻ trong một lượt. Bài nào không có tên nhóm thì
> website tự cắt thành từng phần 10 từ (sửa số này ở `config.js` →
> `game.flashcardChunk`).

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

## Tài khoản cho nhiều giáo viên

Website có 2 loại tài khoản:

| | Quản trị viên | Giáo viên |
|---|---|---|
| Đăng nhập | tài khoản `admin` + mật khẩu trong `config.js` | tài khoản do quản trị viên cấp |
| Xem điểm | tất cả các lớp | chỉ lớp được gán |
| Tạo lớp mới | ✅ | ✅ (lớp tự tạo được gán ngay cho mình) |
| Xoá lớp | ✅ | ❌ |
| Thêm bài học | ✅ | ✅ |
| Mở phòng Kahoot | ✅ | ✅ |
| Tạo tài khoản giáo viên | ✅ | ❌ |

### Cấp tài khoản cho một giáo viên

1. Đăng nhập bằng tài khoản quản trị (`admin` + mật khẩu trong `config.js`)
2. **Quản trị** → thẻ **👩‍🏫 Giáo viên**
3. Điền: **Tài khoản** (viết liền không dấu, ví dụ `colan`), **Tên hiển thị**
   (ví dụ `Cô Lan`), **Mật khẩu**, rồi tick các **lớp** giáo viên đó phụ trách
4. Bấm **Tạo tài khoản**

Giáo viên vào trang chủ → thẻ **👩‍🏫 Giáo viên** → gõ tài khoản + mật khẩu vừa
được cấp. Họ chỉ nhìn thấy điểm và học sinh của lớp mình.

Trong bảng danh sách còn có nút **🔑 Đổi mật khẩu** và **🏫 Gán lớp** để sửa
lại sau, và nút 🗑️ để xoá tài khoản.

Giáo viên cũng **tự mở lớp mới được**: vào **Quản trị → 🏫 Lớp học** → nhập mã
lớp + tên lớp → **Thêm lớp**. Lớp vừa tạo tự động thuộc về tài khoản đó, không
cần nhờ quản trị viên gán. Chỉ việc **xoá lớp** mới cần quản trị viên.

### Phòng Kahoot

Mọi giáo viên (kể cả tài khoản thường) đều mở được phòng: nút **⚡ Phòng Kahoot**
trên thanh trên cùng hoặc trong trang Quản trị.

**Cách công bố đáp án:** học sinh bấm chọn xong chỉ thấy "📨 Đã ghi nhận!" và ô
mình đã chọn — **chưa biết đúng hay sai**. Đáp án chỉ hiện ra khi:

- cả lớp đã trả lời xong, hoặc
- hết giờ của câu đó, hoặc
- thầy/cô bấm **👁️ Công bố đáp án ngay** (dùng khi có bạn vắng/máy hỏng)

Nhờ vậy các bạn trả lời sau không nhìn được đáp án của bạn bên cạnh.

> ⚠️ **Quan trọng:** tài khoản giáo viên chỉ dùng chung được giữa các máy khi
> đã bật Supabase (thẻ **☁️ Kết nối**). Chưa bật Supabase thì tài khoản chỉ
> nằm trên chính máy đã tạo.

### Bật Supabase — 2 phần, phải làm ĐỦ CẢ HAI

Rất nhiều người làm xong phần 1 rồi tưởng đã xong, nhưng website vẫn báo
"đang ở chế độ ngoại tuyến". Lý do: tạo bảng chỉ là dựng kho chứa, website
còn phải biết **địa chỉ kho** và **chìa khoá** thì mới gửi dữ liệu vào được.

**Phần 1 — Tạo bảng (làm 1 lần)**
Supabase → **SQL Editor** → dán toàn bộ `supabase/schema.sql` → **Run**.
Xong thấy các bảng `classes`, `teachers`, `students`, `scores`, `lessons`,
`rooms`, `room_players` trong mục Table Editor.

**Phần 2 — Nối website với Supabase**
Supabase → **Project Settings → API** → chép 2 giá trị:

- **Project URL** (dạng `https://abcxyz.supabase.co`)
- **anon public key** (chuỗi dài bắt đầu bằng `eyJ...`)

Rồi dán vào **Quản trị → ☁️ Kết nối** → **Lưu & kiểm tra kết nối**.
Trang sẽ tải lại; nếu hiện "✅ Đã kết nối máy chủ" là thành công.

> Cách nhập trên web chỉ có tác dụng **trên chính máy vừa nhập** — dùng để thử
> nhanh. Để cả trung tâm (máy học sinh, máy giáo viên khác) đều kết nối, chép
> đoạn code mà thẻ Kết nối hiện ra vào `public/js/config.js` (thay cho phần
> `supabase` đang có) rồi `git push`.

**"anon public key" có bị lộ không?** Không sao. Đây là khoá công khai, Supabase
thiết kế để nhúng thẳng vào website tĩnh; quyền truy cập được kiểm soát bằng
Row Level Security trong `schema.sql`. Tuyệt đối **không** dùng `service_role key`.

### Đổi mật khẩu quản trị

Mở `public/js/config.js`, sửa 2 dòng:

```js
adminUsername: 'admin',           // tên đăng nhập của quản trị viên
teacherPassword: 'nezha2026',     // ⚠️ đổi mật khẩu này
```

rồi `npm run build` và đưa lại bản mới lên host.

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
| Mật khẩu quản trị | `public/js/config.js` → `teacherPassword` |
| Tên đăng nhập quản trị | `public/js/config.js` → `adminUsername` |
| Tài khoản các giáo viên khác | Trang **Quản trị → 👩‍🏫 Giáo viên** (không cần sửa code) |
| Danh sách mã lớp | `public/js/config.js` → `classes` |
| Tên trung tâm, khẩu hiệu | `public/js/config.js` → `siteName`, `siteTagline` |
| Số câu mỗi lượt, thời gian trả lời, số mạng | `public/js/config.js` → `game` |
| Chủ đề thẻ lật (bài chưa chia nhóm cắt mấy từ 1 phần) | `public/js/config.js` → `game.flashcardChunk` |
| Tốc độ rơi & mức tăng khó của Na Tra đại chiến | `public/js/config.js` → `game.rushStartSeconds`, `rushLevelEvery`, `rushSpeedUp`, `rushMinSeconds` |
| Số chữ mỗi lượt của trò Tập viết | `public/js/config.js` → `game.writeChars` |
| Bảng xếp hạng lớp trên trang học sinh | `public/js/views/home.js` |
| Kết nối Supabase | `public/js/config.js` → `supabase` |
| Từ vựng, mẫu câu, danh sách trò chơi | `public/js/data.js` |
| Từ điển tự tra khi upload file | `public/js/dict.js` |
| Màu sắc, phông chữ, giao diện | `public/css/style.css` |
| Nội dung một trò chơi cụ thể | `public/js/games/<tên trò>.js` |
| Bảng số 1–99 | `public/js/views/numbers.js` |
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

> **Nếu Cloudflare dùng lệnh deploy `npx wrangler deploy`** (bản Workers mới):
> dự án đã có sẵn file `wrangler.jsonc` ở thư mục gốc để khai báo điều hướng SPA.
> Không được thêm file `_redirects` với luật `/* /index.html 200` — Cloudflare sẽ
> báo lỗi *"Infinite loop detected"* và deploy thất bại. File `_redirects` chỉ
> dành cho Netlify và chỉ được tạo khi build trên Netlify.

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

---

# F. Hai chức năng mới (bản 1.2)

## Trò "Tập viết chữ Hán" ✍️

Màn hình chia đôi: bên trái là **chữ mẫu** (bấm vào để máy viết lại đúng thứ tự
nét), bên phải là **ô để học sinh viết** bằng chuột hoặc ngón tay.

Luật tính điểm:

- Mỗi chữ phải viết **đúng thứ tự nét 2 lần**
- Lần nào sai nét thì lần đó **không được tính**, phải viết lại từ đầu
- Sai quá 3 nét ở một lần thì máy tự hiện gợi ý nét tiếp theo
- Viết 6 lần vẫn chưa đạt thì tự chuyển sang chữ khác, chữ đó vào mục "Cần ôn lại"

Chữ để luyện được **tách ra từ chính từ vựng của bài** (ví dụ 生日 → luyện 生 rồi
日), mỗi lượt 8 chữ — đổi số này ở `config.js` → `game.writeChars`.

> ⚠️ **Trò này cần mạng.** Dữ liệu thứ tự nét của từng chữ được tải từ thư viện
> mã nguồn mở Hanzi Writer (địa chỉ trong `config.js` → `game.hanziWriterCdn`).
> Nếu mạng lớp học chặn, trò sẽ hiện thông báo hướng dẫn chứ không treo. Các trò
> còn lại không cần mạng ngoài.

## Bảng xếp hạng lớp cho học sinh 🏆

Ngay trên trang chính của học sinh, dưới phần chọn trò chơi:

- **Top 5** của lớp, xếp theo tổng điểm cộng dồn tất cả các bài
- Dòng của chính em được **tô vàng** và ghi thêm chữ "(em)"
- Nếu em chưa lọt top 5 thì vẫn có một dòng riêng hiện đúng thứ hạng của em
- Bên dưới có chip **"Em đang xếp thứ 3/12 trong lớp"** và **"Còn N điểm nữa là
  vượt bạn phía trên"** để tạo động lực

> Bảng chỉ hiện đủ cả lớp khi đã bật Supabase. Chưa bật thì mỗi máy chỉ thấy dữ
> liệu của chính máy đó.
