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

## Danh sách học sinh — ai được vào học

**Chỉ giáo viên tạo được tài khoản học sinh.** Học sinh không tự đăng ký được,
nên không có chuyện một em tạo nhiều tên khác nhau để chơi trước xem đáp án.

**Quản trị → 🎒 Học sinh** → chọn lớp → thêm từng em, hoặc **dán cả danh sách**
(mỗi dòng một tên) rồi bấm *Thêm cả danh sách*.

Học sinh đăng nhập bằng **họ tên + mã lớp**:

- Tên phải có trong danh sách của lớp đó, sai tên là không vào được
- Gõ **không dấu vẫn được** (`nguyen minh an` = `Nguyễn Minh An`), hoa/thường tuỳ ý
- Lớp chưa có danh sách thì chưa em nào vào được — web sẽ báo rõ để em đi hỏi thầy/cô

Trong bảng có nút **⬇️ Tải danh sách (CSV)** và **🖨️ In danh sách** để phát cho lớp.

> ⚠️ Chưa bật Supabase thì danh sách chỉ nằm trên máy đã nhập. Muốn học sinh
> đăng nhập từ máy/điện thoại của các em thì phải bật Supabase (xem mục bên dưới).

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

---

# G. Ba chức năng mới (bản 1.3)

## 🎤 Luyện phát âm có chấm điểm

Nghe máy đọc mẫu → bấm micro đọc lại → máy chấm điểm. Có **cả từ lẻ lẫn câu
hoàn chỉnh** (khoảng 40% số lượt là câu, lấy từ phần mẫu câu của bài).

Cách chấm: dùng bộ nhận diện giọng nói tiếng Trung của trình duyệt, so câu máy
nghe được với câu mẫu theo từng chữ:

| Tỉ lệ giống | Kết quả |
|---|---|
| ≥ 85% | ✔ Rất chuẩn — được điểm tối đa, sang câu mới luôn |
| 60–84% | Tạm được — nhắc nghe lại mẫu |
| < 60% | Chưa đúng — cho thử lại, mỗi câu 2 lần, lấy lần tốt nhất |

Chỉnh 3 con số này ở `config.js` → `game.speakItems`, `speakGoodPercent`,
`speakPassPercent`.

> Cần **Chrome hoặc Edge, có micro và có mạng**. Máy nào không hỗ trợ thì trò tự
> chuyển sang **chế độ tự nghe lại**: thu âm giọng của em rồi phát lại ngay cạnh
> giọng mẫu để em tự so — vẫn luyện được, chỉ là không có điểm tự động.

## 🚀 Phi thuyền bắn thiên thạch

Chữ Hán rơi xuống như thiên thạch, **nhiều viên cùng lúc**. Học sinh gõ pinyin
(không cần dấu thanh) để bắn hạ. Viên nào chạm đất thì mất 1 mạng, hết 3 mạng
là kết thúc.

Độ khó tăng dần giống Na Tra đại chiến — cứ 6 viên bắn trúng thì lên 1 cấp:

| Cấp | Thời gian rơi | Số viên cùng lúc |
|---|---|---|
| 1 | 9.0 giây | 2 |
| 3 | 6.7 giây | 3 |
| 5 | 5.0 giây | 4 |
| 7 trở đi | 3.0 giây | 5 |

Sửa ở `config.js` → `game.shipStartSeconds`, `shipLevelEvery`, `shipSpeedUp`,
`shipMinSeconds`, `shipMaxMeteors`, `shipLives`.

## Soát lại nội dung 11 trò chơi

Đã rà lại toàn bộ nội dung và sửa mấy chỗ dễ gây oan cho học sinh:

- **Từ đồng âm không còn đứng chung câu hỏi**: 他 và 她 cùng đọc "tā" nên trước
  đây trò *Nghe chọn từ* có thể cho cả hai vào 4 đáp án — nghe đúng vẫn bị chấm
  sai. Nay đáp án nhiễu luôn khác cách đọc (và khác nghĩa ở các trò hỏi nghĩa).
- **Trò Ghép cặp** không lấy 2 từ trùng nghĩa vào cùng một ván.
- **Phi thuyền** không thả 2 thiên thạch cùng pinyin cùng lúc.
- Bổ sung chữ **零 (líng — số 0)** vào từ vựng vì câu "我二零一五年出生。" có dùng.
- Sửa mô tả trò *Ngày tháng NeZha* cho khớp đúng dạng câu hỏi trong trò
  (`11/8/2026 → 2026年8月11号`).

---

# H. Bản 1.4 — giao diện mới và sửa lỗi đồng hồ Kahoot

## Đã sửa: học sinh bị hụt thời gian trong phòng Kahoot

**Hiện tượng:** thầy/cô để 20 giây nhưng có em vào chỉ còn 5 giây, em khác lại
bình thường.

**Nguyên nhân:** phòng thi lưu mốc "câu hỏi bắt đầu lúc mấy giờ". Trước đây máy
học sinh lấy **giờ của chính máy đó** để trừ ra thời gian còn lại. Điện thoại /
máy tính nào bị lệch giờ (chạy nhanh 15 giây) thì đồng hồ hụt đúng 15 giây —
nên chỉ những em có máy sai giờ mới bị.

**Cách sửa:** mọi mốc thời gian trong phòng Kahoot nay tính theo **giờ máy chủ**.
Website tự đo độ lệch giữa máy đang dùng và máy chủ (đọc giờ trong phần đầu mỗi
lần gọi Supabase) rồi bù lại. Máy học sinh có sai giờ vẫn được đủ thời gian.

Kèm theo:

- Máy học sinh giờ có **đồng hồ đếm ngược bằng số** (trước chỉ có thanh chạy)
- Máy nào lệch giờ trên 20 giây sẽ được nhắc nhẹ ở phòng chờ để chỉnh lại
- **Lỡ thoát / tải lại trang giữa chừng thì tự vào lại đúng phòng**, giữ nguyên điểm
- Hai bạn **trùng tên** trong một phòng sẽ tự thành "Tên" và "Tên (2)" cho khỏi lẫn điểm

### Cách tự kiểm tra lại phòng Kahoot

Dự án có sẵn một máy chủ Supabase giả để thử nhiều máy ngay trên 1 máy tính:

```bash
node scripts/dev-server.js        # cửa sổ 1 — website
node scripts/fake-supabase.js     # cửa sổ 2 — máy chủ giả
python3 scripts/test-kahoot-clock.py   # cửa sổ 3 — chạy kiểm thử
```

Bài kiểm thử này giả lập một máy học sinh **chạy nhanh 15 giây** và kiểm tra
đồng hồ vẫn còn ~19 giây. (Chạy với mã nguồn cũ thì con số rơi xuống 3–5 giây.)

## Giao diện được nâng cấp

- **Viền mềm bằng bóng đổ nhiều lớp** thay cho viền 1px cứng ở thẻ, bảng, ô nhập
- **Xuất hiện có nhịp**: các thẻ trò chơi và ô thống kê hiện lên lần lượt, mờ dần vào
- **Bấm là lún**: thẻ trò chơi và đáp án Kahoot có phản hồi khi chạm
- **Số liệu cân đều** (tabular numbers) — điểm, đồng hồ, bảng điểm không bị nhảy chữ
- **Vùng bấm tối thiểu 40–44px** cho nút nhỏ, dễ bấm trên điện thoại
- Vòng sáng khi dùng bàn phím, chữ mượt hơn trên máy Mac, tiêu đề tự cân dòng
- Màn hình kết quả có vệt sáng chạy ngang cho ra chất ăn mừng

> Ghi chú kỹ thuật: hai bộ thư viện Watermelon UI và motion-primitives đều là
> component React + Tailwind, trong khi website này cố ý viết thuần JavaScript
> không phụ thuộc thư viện (để chạy được trên mọi hosting rẻ tiền và tải nhanh
> trên wifi lớp học). Vì vậy phần nâng cấp trên áp dụng **nguyên tắc thiết kế**
> của các bộ đó bằng CSS thuần, không kéo React vào dự án.

---

# I. Bản 1.5 — Supabase cắm sẵn, chấm phát âm chuẩn hơn, giao diện mới

## Supabase đã lưu sẵn trong mã nguồn

`public/js/config.js` giờ đã có sẵn `url` và `anonKey` của trung tâm, không phải
dán lại mỗi lần cập nhật nữa. Mỗi lần tôi gửi bản mới, thầy/cô cứ giải nén đè
là chạy được ngay.

Muốn tạm trỏ sang một Supabase khác để thử: **Quản trị → ☁️ Kết nối** → nhập rồi
lưu (chỉ có tác dụng trên máy đó, bấm *Xoá cấu hình trên máy này* là quay về).

> 🔒 **Lưu ý:** `anonKey` là khoá công khai, nhúng vào web tĩnh là đúng cách.
> Nhưng vì quy tắc truy cập trong `schema.sql` đang mở cho mọi người đọc/ghi,
> nên đừng công bố địa chỉ website ra ngoài phạm vi trung tâm. Dữ liệu ở đây chỉ
> gồm tên học sinh và điểm ôn tập, không có gì nhạy cảm.

## Chấm phát âm: đã tìm ra vì sao đọc sai vẫn "đúng"

Có 3 lỗi cộng lại, nay đã sửa hết:

| Lỗi | Vì sao thành "đọc sai vẫn đúng" | Đã sửa |
|---|---|---|
| Lấy 3 phương án của bộ nhận diện rồi chọn cái giống câu mẫu nhất | Máy đoán mò, trong 3 phương án gần như luôn có câu mẫu | Chỉ lấy **1 phương án máy nghe rõ nhất** |
| Vừa vào câu là loa tự đọc mẫu | Bấm micro ngay thì **micro nghe chính tiếng loa** → chấm 100% | Bỏ tự đọc mẫu; mở micro là **tắt loa** trước |
| Không xét độ rõ, không phạt nói thừa/thiếu | Ề à vài tiếng cũng qua | Độ rõ < 50% thì không được "rất chuẩn"; nói thừa/thiếu quá nhiều bị trừ |

Thêm 2 lớp bảo vệ nữa: kết quả trả về **dưới 0,5 giây** coi như nghe nhầm tiếng
loa (không tính), và mức đạt nâng từ 60% lên **70%**.

Màn hình cũng hiện rõ **máy nghe được câu gì · giống bao nhiêu % · độ rõ bao
nhiêu** để thầy/cô kiểm chứng ngay tại chỗ.

> Máy không hỗ trợ nhận diện giọng nói sẽ hiện cảnh báo vàng "đang chạy chế độ
> TỰ ĐÁNH GIÁ — điểm chỉ mang tính luyện tập", để không ai nhầm là máy đã chấm.

## Giao diện mới

- **Thanh điều hướng dạng đảo nổi**, kính mờ, tách khỏi mép trên
- **Khung lồng 2 lớp** (vỏ ngoài mềm + lõi trắng nổi khối) cho thẻ trò chơi, ô
  thống kê, khung câu hỏi, bảng, thẻ đăng nhập — nhìn như vật thể thật
- **Khối chào mừng** to hơn, có nhãn lớp và 2 nút bo tròn kèm "nút con" ở đuôi,
  trong đó nút chính gợi ý luôn trò em chưa chơi
- **Vòng tròn tiến độ** cho Độ chính xác và Trò đã thử; các ô còn lại có huy hiệu
- **Nhãn nhỏ** (11 TRÒ · THI ĐUA · NHẬT KÝ) phía trên mỗi tiêu đề mục
- **Hiện dần khi cuộn tới** thay vì bày ra hết cùng lúc
- Hạt nhiễu rất nhẹ phủ toàn trang cho cảm giác giấy in, không gắt màn hình

## Phi thuyền: gợi ý theo đúng những gì em đã gõ

Trước đây chỉ cần gõ đúng 1–2 chữ cái đầu là viên thiên thạch hiện luôn **cả**
pinyin — hoá ra bày sẵn đáp án. Nay trên viên thiên thạch **chỉ hiện đúng phần
em đã gõ**:

| Em gõ (thiên thạch 你好 — `nihao`) | Hiện trên thiên thạch |
|---|---|
| `ni` | `ni` màu xanh, viền viên sáng xanh |
| `nih` | `nih` màu xanh |
| `nin` | `ni` xanh + `n` nền đỏ, viền viên chuyển đỏ |

Viên nào không khớp chữ cái nào thì **không hiện gì cả**. Phi thuyền tự ngắm
viên mà em đang gõ đúng nhiều chữ nhất.


---

# J. Bản 1.6 — Chỉ số theo dõi lớp cho giáo viên

Thẻ **📊 Bảng điểm** trong trang Quản trị nay không chỉ liệt kê điểm, mà trả lời
được 4 câu hỏi thầy/cô hay hỏi nhất.

## ⚠️ Việc cần làm một lần trước khi dùng

Mục "Hay sai ở đâu" cần thêm **một cột mới** trong Supabase. Vào Supabase →
**SQL Editor** → dán lại **toàn bộ** file `supabase/schema.sql` → **Run**. Chạy
lại nhiều lần không sao cả (mọi câu lệnh đều là `if not exists`), dữ liệu cũ
không mất gì.

Nếu chưa chạy, website vẫn lưu điểm bình thường — chỉ là mục "Hay sai ở đâu"
chưa có dữ liệu. Các lượt chơi **cũ** cũng không có chi tiết từ sai; mục này chỉ
đầy dần từ những lượt chơi mới.

## 4 bộ lọc ở đầu thẻ

| Ô | Dùng để |
|---|---|
| **Lớp** | Chọn 1 lớp, hoặc xem gộp tất cả các lớp thầy/cô phụ trách |
| **Xem của ai** | 👥 Cả lớp, hoặc chọn **riêng một em** — mọi số liệu bên dưới đổi theo |
| **Trò chơi** | Chỉ xem số liệu của một trò |
| **Khoảng thời gian** | Từ trước tới nay · 7 ngày · 30 ngày · Hôm nay |

Bộ lọc thời gian chính là cách trả lời "buổi hôm nay em nào đã ôn bài rồi?" —
chọn **Hôm nay** là ra ngay.

## 1) Bao nhiêu em đã làm bài, em nào chưa

- Ô thống kê **✅ Đã làm bài** hiện dạng `12/18` (đã làm / sĩ số trong danh sách).
- **Thanh tiến độ của lớp** đổi màu: xanh ≥ 80%, cam 60–79%, đỏ dưới 60%.
- Thẻ vàng **"⏳ … em chưa làm bài"** liệt kê **đích danh từng em**. Nút
  **📋 Chép danh sách** chép hết tên vào bộ nhớ tạm để dán thẳng vào Zalo nhóm
  phụ huynh.
- Cả lớp làm đủ thì thẻ vàng biến mất, thay bằng dòng xanh chúc mừng.

> Muốn mục này chạy đúng thì lớp phải có danh sách học sinh (thẻ **🎒 Học sinh**).
> Chưa nhập danh sách thì website không biết em nào còn thiếu.

## 2) Đúng bao nhiêu % ở mỗi trò chơi

Mỗi trò một thanh đo, **xếp trò làm kém nhất lên trên** — nhìn phát biết ngay
nên ôn phần nào. Dưới mỗi thanh ghi rõ `số câu đúng / tổng câu · số lượt · số em`.

## 3) Hay sai ở đâu

Bảng **25 từ bị sai nhiều nhất**, kèm pinyin, nghĩa, **số lần sai**, **bao nhiêu
em sai** và **sai ở trò nào** (biểu tượng trò chơi). Có nút tải CSV để in ra làm
phiếu ôn tập.

Cột "bao nhiêu em sai" là cột đáng chú ý nhất: 1 em sai 10 lần là chuyện của em
đó, còn 10 em cùng sai 1 từ nghĩa là **buổi sau nên giảng lại từ đó**.

## 4) Xem riêng từng em

Chọn tên em ở ô **"Xem của ai"** (hoặc bấm **🔍 Xem riêng** ở bảng điểm):

- Thẻ tên em + lần vào học gần nhất
- Lượt chơi · % chính xác · số câu đúng · tổng điểm của riêng em
- % đúng từng trò **của riêng em**
- **🕹️ Chưa thử N trò** — liệt kê những trò em đó chưa từng mở
- Những từ **em đó** hay sai

Bấm lại "👥 Cả lớp" để quay về xem toàn lớp.

## Những chỗ khác được bổ sung

- Bảng **Chi tiết từng lượt chơi** có thêm cột **Từ sai** và tô màu ô "Đúng".
- File CSV tải về có thêm cột **% đúng** và **Từ sai**.

---

# K. Bản 1.7 — Chấm phát âm chi tiết theo từng âm tiết

## Hai lỗi cũ đã sửa

**1. Từ chỉ có 1 chữ thì máy không nghe được.** Ba nguyên nhân, đã sửa cả ba:

| Nguyên nhân | Cách sửa |
|---|---|
| Máy tự ngắt ngay khi nghe thấy im lặng, mà từ 1 chữ chỉ dài ~0,3 giây nên chưa kịp nghe đã ngắt | Bật chế độ nghe liên tục; website tự quyết định lúc nào dừng (em đọc xong ~0,8 giây, hoặc bấm nút "⏹️ Xong") |
| Bản cũ coi mọi kết quả trả về sớm hơn 0,5 giây là "micro nghe nhầm tiếng loa" rồi **vứt đi** — đúng những từ ngắn nhất bị vứt oan | Nay chặn tiếng loa bằng cách **khoá nút micro trong lúc loa đang đọc mẫu** và tắt hẳn loa trước khi mở micro, nên không cần vứt kết quả nữa |
| Máy nghe không ra chữ là báo "không nghe thấy gì" rồi thôi | Nay vẫn **đo cao độ giọng** để chấm thanh điệu và báo lại cho em; lần đó **không bị tính** là một lượt thử |

**2. Chấm theo chữ nên hay chấm oan.** Tiếng Trung rất nhiều chữ đồng âm: em
đọc đúng "shī" (师) mà máy ghi ra 十 / 诗 / 是 là bị 0 điểm. Từ 1 chữ bị oan
nhiều nhất vì máy không có ngữ cảnh để đoán chữ. Nay **so ÂM chứ không so chữ**.

## Cách chấm mới

Mỗi âm tiết được tách làm 3 phần và chấm riêng từng phần:

```
   hǎo   =    h       +     ao      +   thanh 3
           thanh mẫu      vận mẫu       (dấu)
             35%            35%          30%
```

- **Thanh mẫu / vận mẫu**: lấy chữ máy nghe được → đổi sang pinyin → so âm.
  Cặp âm dễ lẫn (zh/z, ch/c, sh/s, n/l, an/ang, in/ing, ü/u…) được **nửa số
  điểm** kèm lời nhắc cụ thể, ví dụ *"Lưỡi phải cong lên khi đọc sh"*.
- **Thanh điệu**: **đo trực tiếp cao độ giọng của em** chứ không lấy theo chữ.
  Website thu tiếng, tính tần số giọng 90 lần/giây (cùng nguyên lý máy lên dây
  đàn), rồi xem đường cong đi lên hay đi xuống để biết em đọc thanh mấy.

> Vì sao phải đo: bộ nhận diện đoán chữ theo ngữ cảnh nên **rất hay sai thanh
> điệu**. Em đọc đúng `hǎo` mà máy ghi ra 号 (hào) là mất điểm oan. Đo cao độ
> thì biết chính xác em đọc thanh mấy. Đã kiểm thử với 13 mẫu giọng (giọng
> cao/thấp, âm tiết ngắn/dài, 1–3 âm tiết): đo đúng 13/13.

## Học sinh nhìn thấy gì

- **Dưới câu mẫu**: từng chữ kèm pinyin, tên thanh điệu và hình dáng lên xuống
- **Trong lúc đọc**: cột sóng nhấp nháy theo giọng, tự dừng khi đọc xong
- **Sau khi chấm**: mỗi chữ một thẻ màu (xanh đạt · vàng gần đúng · đỏ sai) với
  3 dấu 声 (thanh mẫu) · 韵 (vận mẫu) · 调 (thanh điệu), và **đường cao độ**
  — nét đứt là thanh điệu mẫu, nét liền là giọng em vừa đọc
- **Tối đa 3 lời nhắc** cụ thể nhất, ví dụ *"住: Sai thanh điệu — cần thanh 4
  xuống dứt khoát, em đọc thanh 3 xuống rồi lên"*
- Máy nghe ra chữ đồng âm thì báo rõ *"chữ đồng âm, em đọc đúng rồi!"*

## Thầy/cô chỉnh được gì trong `public/js/config.js`

```js
speakTries: 3,          // mỗi câu được thử mấy lần (lấy lần cao nhất)
speakMaxSeconds: 6,     // nghe tối đa bao nhiêu giây rồi tự dừng
speakUsePitch: true,    // có đo cao độ để chấm thanh điệu không
speakWeights: { initial: 35, final: 35, tone: 30 },
```

Muốn siết thanh điệu chặt hơn thì tăng `tone` lên (ví dụ `{initial:30, final:30,
tone:40}`) — tổng bao nhiêu cũng được, hệ thống tự quy về 100%.

Chữ mang **thanh nhẹ** (的, 吗, 子, 们…) không bị chấm thanh điệu, vì thanh nhẹ
đọc nhanh và cao độ phụ thuộc chữ đứng trước nên không đo chính xác được.

## Máy không đo được cao độ thì sao?

Máy cũ, hoặc học sinh không cho dùng micro → website tự quay về cách chấm bằng
chữ như cũ, vẫn chơi được bình thường. Máy không có nhận diện giọng nói (Safari
cũ, Firefox) vẫn giữ chế độ **tự nghe lại**: thu âm rồi phát lại cạnh giọng mẫu.

## File mới trong dự án

| File | Việc |
|---|---|
| `public/js/voice.js` | Thu micro, đo cao độ giọng (F0), cắt âm tiết, đoán thanh điệu |
| `public/js/pinyin.js` | Cắt pinyin thành thanh mẫu/vận mẫu/thanh điệu, chấm điểm, sinh lời nhắc |
| `public/js/pinyin-data.js` | Cách đọc của ~450 chữ Hán hay bị máy nghe nhầm (thầy/cô bổ sung được) |
| `scripts/test-phatam.py` | Kiểm thử riêng phần phát âm bằng file giọng giả lập |

Chữ trong bài học thì **không cần khai báo** ở `pinyin-data.js` — hệ thống tự học
cách đọc từ chính cột pinyin của bài đó.

---

# L. Bản 1.8 — Giao diện "Neo" cho phần trò chơi

Lấy theo bộ **Neo Brutalism UI Library** (Figma Community) thầy/cô gửi.

## Công thức của phong cách này

Chỉ có 4 quy tắc, lặp lại ở mọi thành phần:

| | |
|---|---|
| Viền | **2px đen `#1A1A1A`** ở mọi thứ |
| Bóng | **cứng `4px 4px 0` đen** — không mờ, không chuyển sắc |
| Bo góc | **8px** (vuông vức, không tròn mềm) |
| Màu | phẳng, rực, **chữ đen** trên nền màu |

Bảng màu lấy đúng từ file Figma:

| Tên | Mã | Dùng cho |
|---|---|---|
| Pink | `#FF6B6B` | nút chính, thanh tiến độ |
| Purple | `#A388EE` | thẻ trò chơi |
| Green | `#4ECDC4` | nút "đúng", đáp án đúng |
| Yellow | `#FFE66D` | khối chào mừng, nhãn điểm, mặt trước thẻ lật |
| Blue | `#45B7D1` | thẻ trò chơi |
| Orange | `#F7A072` | cảnh báo |
| Destructive | `#FF4757` | đáp án sai |
| Nền | `#FDF2E9` | nền cả trang |
| Chữ/viền | `#1A1A1A` | tất cả |

## Áp ở đâu

**Chỉ trang của học sinh**: trang chính (`/hoc`), 11 trò chơi (`/choi/...`),
vào phòng Kahoot (`/vao-phong`), bảng số (`/bang-so`).

**Không đụng tới**: trang đăng nhập, trang bài học, trang quản trị và bảng
điểm của thầy/cô — vẫn giữ giao diện kem mềm cũ, đọc lâu đỡ mỏi mắt.

Cách đổi: mảng `NEO_PATHS` trong `public/js/core.js`.

```js
const NEO_PATHS = ['/hoc', '/choi', '/vao-phong', '/bang-so'];
```

- Muốn áp cho **cả website**: thêm `'/'` vào mảng.
- Muốn **bỏ hẳn**, quay về giao diện cũ: để mảng rỗng `[]`.
- Muốn chỉ áp cho **một vài trò**: đổi thành `['/choi/tn1101-1-5/rush']` chẳng hạn.

Toàn bộ phần CSS nằm ở cuối `public/css/style.css`, mục
**"BẢN 1.8 — GIAO DIỆN NEO"**, mọi dòng đều bắt đầu bằng `[data-skin="neo"]`
nên không ảnh hưởng gì tới giao diện cũ.

## Về font chữ

File Figma dùng **Space Grotesk**. Website **không** dùng font đó, vì tôi chưa
xác nhận được nó có đủ dấu tiếng Việt (ă, ơ, ộ, ề…) hay không — thiếu là vỡ dấu
cả trang. Thay vào đó dùng **Be Vietnam Pro** (font website đang có sẵn, đủ dấu
tiếng Việt) ở nét rất đậm 800 — vuông vức, hợp phong cách, và chắc chắn hiển thị
đúng tiếng Việt.

Nếu thầy/cô muốn thử đúng font của Figma: thêm `Space+Grotesk:wght@400;500;700`
vào thẻ `<link>` Google Fonts trong `public/index.html`, rồi sửa 1 dòng trong
`style.css`:

```css
[data-skin="neo"] { --f-display: 'Space Grotesk', var(--f-body); }
```

Nhớ kiểm tra kỹ các chữ có dấu trước khi đưa lên cho học sinh dùng.

## Trò phi thuyền

Trò bắn thiên thạch giữ nguyên nền vũ trụ tối — viền đen trên nền đen thì không
nhìn thấy gì. Chỉ có thanh HUD phía trên là theo giao diện mới.

## Lấp hai bên lề trên màn hình rộng (bản 1.8b)

Màn 1920px thì hai bên nội dung trống hơn 400px mỗi bên. Đã xử lý 3 lớp:

**1. Nới khung nội dung.** Từ 1280px trở lên, khung rộng 1360px thay vì 1120px
→ thẻ trò chơi thành **5 thẻ/hàng**, ô thống kê 5 ô/hàng, thanh điều hướng cũng
rộng theo cho khỏi lệch. Riêng 1280–1500px vẫn để 4 thẻ/hàng cho thẻ khỏi bị bóp.
Màn 1440px sau khi nới thì gần như hết trống.

**2. Nền lưới chấm.** Hoa văn phẳng quen thuộc của neo-brutalism, chấm đen mờ
11% cách nhau 26px, phủ toàn trang kể cả hai bên lề.

**3. Sticker hai bên** (chỉ hiện từ 1700px trở lên — hẹp hơn thì không đủ chỗ):

| Bên trái | Bên phải |
|---|---|
| 你好 (vàng) · ★ (xanh ngọc) · 加油 (hồng) | 学 (tím) · logo NeZha (trắng) · 谢谢 (xanh dương) |

Kèm mấy hình tròn/vuông rỗng ruột viền mờ để lấp phần lề còn lại. Tất cả nằm
**sau** nội dung và không bắt chuột, nên không bao giờ che nút bấm.

**Sửa ở đâu:**

- Đổi chữ trên sticker: mảng `STICKERS` trong `public/js/views/layout.js`
- Đổi vị trí/màu sticker: mục `.st-1` … `.st-6` cuối `public/css/style.css`
- Bỏ hẳn trang trí: xoá `neo ? deco() : null` trong hàm `page()` của `layout.js`
- Đổi độ rộng khung: sửa `1360px` trong khối `@media (min-width: 1280px)`

**Ghi chú:** chữ ghi dưới sticker để tiếng Việt chứ không để pinyin, vì dấu
thanh pinyin (ǎ, ǐ, ǚ) không phải font nào cũng có — thiếu là hiện sai chữ.

---

# M. Bản 1.9 — Phi thuyền bắn thiên thạch chậm lại gấp 3

Học sinh phản ánh thiên thạch rơi nhanh quá, chưa kịp gõ pinyin đã chạm đất.

**Đã đổi:** thời gian rơi ban đầu **9 giây → 27 giây** (gấp 3), và mốc nhanh
nhất cũng nhân 3 (**3 giây → 9 giây**) để độ khó vẫn tăng đều đúng như cũ, chỉ
là chậm hơn 3 lần ở mọi cấp.

| Cấp | Thời gian rơi | Số viên cùng lúc |
|---|---|---|
| 1 | 27,0s | 2 |
| 2 | 23,2s | 2 |
| 3 | 20,0s | 3 |
| 4 | 17,2s | 3 |
| 5 | 14,8s | 4 |
| 6 | 12,7s | 4 |
| 7 | 10,9s | 5 |
| 8 | 9,4s | 5 |
| 9 trở đi | 9,0s | 5 |

Cứ bắn trúng 6 viên thì lên 1 cấp, nên phải bắn trúng 48 viên mới tới cấp khó nhất.

**Một chỗ phải sửa kèm.** Trước đây khoảng cách giữa 2 lần thả thiên thạch được
tính theo thời gian rơi. Nếu để nguyên thì rơi chậm gấp 3 kéo theo **thả viên
mới cũng chậm gấp 3** — cấp 1 phải hơn 11 giây mới có viên mới, màn hình trống
trơn, trò chơi thành ì ạch. Nay có thêm trần `shipSpawnMaxSeconds` (mặc định
4,5 giây): mỗi viên vẫn có nhiều thời gian, nhưng màn hình luôn đủ viên để bắn.

**Muốn chỉnh thêm** — trong `public/js/config.js`:

```js
shipStartSeconds: 27,       // chậm hơn nữa thì tăng số này
shipMinSeconds: 9,          // ... và tăng số này cùng tỉ lệ
shipLevelEvery: 6,          // muốn khó nhanh hơn thì giảm (vd 4)
shipSpawnMaxSeconds: 4.5,   // lâu nhất bao nhiêu giây thì thả viên mới
```

Giữ `shipStartSeconds` gấp 3 lần `shipMinSeconds` thì đường tăng độ khó vẫn
đúng như bảng trên.

---

# N. Bản 2.0 — App trên điện thoại

Website nay **cài được vào điện thoại như một cái app thật**: có icon NeZha
ngoài màn hình chính, mở ra toàn màn hình (không thấy thanh địa chỉ trình
duyệt), và **chơi được cả khi mất mạng**.

Không phải lên App Store hay Google Play, không mất phí, không phải cài thêm
phần mềm gì. Kỹ thuật này gọi là **PWA**; chỉ cần website chạy trên https —
Cloudflare đã có sẵn.

## Học sinh cài thế nào

**Android (Chrome):** mở website → sau vài giây hiện thanh **"📲 Cài NeZha
Game vào máy"** → bấm **Cài đặt** → xong. (Hoặc menu ⋮ → *Cài ứng dụng*.)

**iPhone (bắt buộc dùng Safari):** mở website → bấm **Cài đặt** trên thanh mời
→ website hiện hướng dẫn 3 bước: nút **Chia sẻ ⬆️** → **Thêm vào MH chính ➕**
→ **Thêm**. Chrome trên iPhone không cài được, phải là Safari.

Bấm **"Để sau"** thì thanh mời không hiện lại nữa (nhớ trong máy học sinh).

## Icon app

Icon **không** dùng nguyên logo, vì logo có dòng chữ "NeZha CHINESE CENTER" —
thu về 48px trên màn hình điện thoại thì dòng chữ đó thành một vệt mờ. Icon chỉ
lấy **phần nhân vật + ngọn lửa**, phóng to trên nền kem.

| File | Dùng cho |
|---|---|
| `icon-192.png`, `icon-512.png` | Android, cửa sổ cài app |
| `maskable-192.png`, `maskable-512.png` | Android cắt icon thành hình tròn — nhân vật thu nhỏ 60% để không bị cắt mất đầu |
| `icon-180.png` | iPhone / iPad |
| `favicon.png` | tab trình duyệt |

Đổi logo thì chạy lại: `python3 scripts/make-icons.py` (cần `pip install pillow`).

## Chơi được khi mất mạng

File `public/sw.js` tải sẵn **42 file** (toàn bộ giao diện, 11 trò chơi, bài
học, icon) về máy học sinh. Mất mạng vẫn mở app, vẫn chơi đủ 11 trò, điểm lưu
tạm trong máy.

**Ba nguyên tắc trong sw.js — đừng sửa nếu chưa hiểu rõ:**

1. **Trang HTML luôn lấy từ mạng trước.** Nếu lấy từ bộ đệm trước, máy học sinh
   sẽ kẹt mãi ở bản cũ sau khi thầy/cô cập nhật — đúng lỗi đã gặp hồi trước.
2. **File js/css/ảnh lấy từ bộ đệm trước** cho nhanh. An toàn vì mỗi bản build
   đều gắn `?v=<mã bản>` khác nhau vào tên file.
3. **Lệnh gọi Supabase không bao giờ được lưu đệm.** Phòng Kahoot phải là dữ
   liệu thật ngay lúc đó.

Có bản mới thì app hiện thanh vàng **"🎉 Đã có bản mới — Cập nhật"**, học sinh
bấm mới tải lại, **không tự tải lại giữa lúc đang chơi**.

> Chạy `npm run dev` thì service worker **không** bật (nhận biết qua thẻ
> `<meta name="nz-build">` còn nguyên placeholder). Nếu bật, mọi sửa đổi trong
> file js sẽ bị bộ đệm che mất, sửa mãi không thấy đổi gì.

## Lối tắt

Giữ lâu vào icon app hiện 3 lối tắt: **Vào phòng Kahoot** · **Chọn trò chơi** ·
**Bảng số 1–99**. Sửa trong `public/manifest.webmanifest`, mục `shortcuts`.

## Tiện thể sửa một lỗi cũ trên điện thoại

Thanh điều hướng có 2 nút + ô tên + nút thoát, cộng lại rộng 439px trong khi màn
hình điện thoại chỉ 390px → cả trang bị đẩy lệch, vuốt ngang được. Nay thu gọn
dần: dưới 560px bỏ dòng "Chinese Center" và cho nhóm nút xuống dòng nếu chật,
dưới 430px ô tên chỉ còn chữ cái viết tắt. Đã khoá `overflow-x` để trang không
bao giờ vuốt ngang được nữa.

## Kiểm thử

`python3 scripts/test-pwa.py` — phải chạy trên **bản đã build**:

```
npm run build
node scripts/dev-server.js dist 4173
python3 scripts/test-pwa.py
```

Kiểm tra manifest, icon, service worker, số file tải sẵn, và **ngắt mạng thật**
rồi thử mở app + chơi thử một trò.
