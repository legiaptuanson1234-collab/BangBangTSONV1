# BangBang

## ▶️ Chơi ngay trên web (không cần tải, không cần cài gì)

**[Mở link chơi game](https://legiaptuanson1234-collab.github.io/BangBangTSONV1/)**

Hoặc copy trực tiếp: `https://legiaptuanson1234-collab.github.io/BangBangTSONV1/`

Mở bằng trình duyệt (Chrome / Edge / Firefox / Safari) trên máy nào cũng được —
lần đầu tải ~1 GB dữ liệu, các lần sau được trình duyệt nhớ (cache) nên mở nhanh.

---

Game web chạy offline hoàn toàn (không cần mạng sau khi tải xong).
Muốn bản tải về chơi nội bộ (không cần internet): xem mục "Chạy bản offline" bên dưới.

## Cấu trúc

- `index.html` — toàn bộ game (kèm hướng dẫn trong `HUONG-DAN-MO.txt`)
- `assets/` — ~5.959 file dữ liệu/ảnh của game (~1 GB)
- `MO-GAME.bat` / `MO-GAME.sh` / `MO-GAME.ps1` — script mở game (chạy server local)

## 12 chế độ chơi

- **Nhiệt Huyết 5v5** — đấu 25 mạng (map 4)
- **Chiếm Cứ Điểm** — giữ vòng giữa map tích điểm (map 19)
- **Căn Cứ Đối Công** — phá căn cứ địch (map 12)
- **Tử Vong** — không hồi sinh, thắng 3 hiệp (map 20)
- **Hỏa Cầu** — đạn nổ diện rộng +20% tốc (map 30)
- **Phó Bản** — dọn 3 đợt địch (map 34)
- **Boss Thế Giới** — 5 người hạ 1 boss (map 35)
- **Thử Tank** — sân tập (map 4)
- **Ba Cờ Chiếm Điểm** *(M72)* — chiếm 3 cờ, giữ để tích điểm, giữ cả 3 cờ ×2 điểm (map 9)
- **Dẫn Bò Sữa** *(M72)* — dắt xe bò của mình tới chuồng địch, chặn xe địch (map 36)
- **Đuổi Xe Bom** *(M72)* — hộ tống xe bom đi đúng đường ray; người đi kèm càng nhiều xe chạy càng nhanh; xe về đích trước thắng (map 70)
- **Lốc Xoái** *(M72)* — chiếm 3 cờ giữa 4 lốc xoáy; lốc di chuyển theo đường cố định, hất tung + làm chậm người đi trúng; lốc xuất hiện lần lượt (map 170)

> 4 chế độ *(M72)* được port từ bộ máy chủ BangBang M72: **giữ nguyên bản đồ, tank và chỉ số của game này**, chỉ thêm luật chơi + vật thể (cờ / bò sữa + chuồng / xe bom / lốc xoáy) với toạ độ khớp 1:1 với bản đồ gốc.


## Chạy bản offline (không cần internet)

**KHÔNG** mở trực tiếp bằng cách double-click `index.html`: trình duyệt chặn
`fetch()` ở chế độ `file://` nên game sẽ báo "Không tải được dữ liệu game
(assets/data2.json)" và dừng lại.

| Hệ điều hành | Cách mở |
|---|---|
| Windows | Double-click `MO-GAME.bat` (tự dùng Python/Python Launcher nếu có, nếu không thì PowerShell có sẵn) |
| macOS / Linux | `./MO-GAME.sh` (cần Python 3) |
| Mọi máy (cách thủ công) | Mở terminal trong thư mục này: `python -m http.server 8000` rồi truy cập `http://localhost:8000/` |

Đóng server: bấm `Ctrl+C` trong cửa sổ server.

> Xem chi tiết thêm trong `HUONG-DAN-MO.txt`.

## Yêu cầu

- Trình duyệt hiện đại (Chrome / Edge / Firefox / Safari)
- Python (tùy chọn — chỉ dùng cho script server; nếu không có, dùng PowerShell trên Windows 10/11)

## Ghi chú

- Phiên bản trong repo này được cập nhật ngày 27/11/2026 (md5 index.html:
  `7fdd46590b4b9105505668ba1ee6e696`).
- Thêm 4 chế độ M72 (Ba Cờ Chiếm Điểm / Dẫn Bò Sữa / Đuổi Xe Bom / Lốc Xoái)
  port từ bộ máy chủ BangBang M72 — giữ nguyên tank + chỉ số game này.
- Giao diện sảnh chờ M72 (menu → hall chọn chế độ/bot → sảnh 5v5 → pick tank → loading → kết quả trận)
  dùng art Flash gốc M72 (assets/m8ui, m8ext, rez — PNG JPEXS export) + m8lobby.js/m8lobby.css.
  Chạy tĩnh, không cần server; các trường hợp M8A không có sẽ tự fallback giao diện sảnh cũ.
