# Bot Báo Giá Tiền Điện Tử

## Giới Thiệu

Đây là một bot Discord giúp theo dõi giá tiền điện tử, chuyển đổi VND sang tiền điện tử, và gửi ảnh ngẫu nhiên. Bot sử dụng API CoinGecko để lấy giá tiền điện tử và ExchangeRate để chuyển đổi tiền tệ. Bot được viết bằng Node.js và thư viện `discord.js`, dễ dàng thiết lập và sử dụng.

---

## Tính Năng

* **Theo dõi giá**: Thêm/xóa đồng tiền điện tử và nhận báo cáo giá định kỳ.
* **Chuyển đổi VND**: Chuyển đổi số tiền VND sang tiền điện tử (ví dụ: Bitcoin, Ethereum).
* **Báo cáo giá**: Hiển thị giá USD/VND, biến động 24h, vốn hóa thị trường.
* **Thiết lập kênh**: Chọn kênh Discord để gửi báo cáo giá.
* **Thông tin bot**: Xem thời gian hoạt động, dung lượng ổ đĩa, số server.
* **Ảnh ngẫu nhiên**: Gửi ảnh từ thư mục `goon` qua lệnh `/goon`.
* **Nút tương tác**: Xem chi tiết đồng tiền hoặc mở ví trên Remitano.

---

## Yêu Cầu

* **Node.js**: Phiên bản 16.x hoặc cao hơn.
* **npm**: Quản lý gói Node.js.
* **Token Discord**: Lấy từ Discord Developer Portal.
* **File cấu hình**:

  * `popularCoins.json`: Danh sách đồng tiền (ví dụ:

    ```json
    [
      { "id": "bitcoin", "symbol": "btc", "name": "Bitcoin" },
      { "id": "ethereum", "symbol": "eth", "name": "Ethereum" }
    ]
    ```
  * Thư mục `goon`: Chứa ảnh `.png`, `.jpg`, hoặc `.gif` cho lệnh `/goon`.

---

## Cài Đặt

1. **Clone repository**

   ```bash
   git clone <your-repository-url>
   cd <repository-folder>
   ```

2. **Cài đặt dependencies**

   ```bash
   npm install discord.js dotenv axios
   ```

3. **Tạo file `.env`**
   Tạo file `.env` và thêm token Discord:

   ```
   DISCORD_TOKEN=your_discord_bot_token
   ```

4. **Chuẩn bị file cấu hình**

   * Tạo `popularCoins.json` với danh sách đồng tiền.
   * Tạo thư mục `goon` và thêm ảnh nếu muốn dùng lệnh `/goon`.

5. **Chạy bot**

   * Thêm `"start": "node index.js"` vào `package.json` trong mục `"scripts"`.
   * Chạy lệnh:

     ```bash
     npm start
     ```

---

## Lệnh Có Sẵn

| Lệnh        | Mô Tả                                            | Quyền Yêu Cầu       |
| ----------- | ------------------------------------------------ | ------------------- |
| `/setting`  | Chọn kênh gửi báo cáo giá                        | Quản trị viên       |
| `/follow`   | Thêm đồng tiền vào danh sách theo dõi            | Quản trị viên       |
| `/remove`   | Xóa đồng tiền khỏi danh sách theo dõi            | Quản trị viên       |
| `/cooldown` | Đặt khoảng thời gian báo cáo (tối thiểu 10 phút) | Quản trị viên       |
| `/swap`     | Chuyển đổi VND sang tiền điện tử                 | Tất cả (trong kênh) |
| `/bot`      | Xem thông tin bot (uptime, disk, server)         | Quản trị viên       |
| `/goon`     | Gửi ảnh ngẫu nhiên từ thư mục `goon`             | Tất cả (trong kênh) |

---

## Cách Sử Dụng

1. **Mời bot vào server Discord**

   * Cấp quyền: Gửi tin nhắn, Gửi file, Nhúng link.

2. **Thiết lập kênh báo cáo**

   * Dùng `/setting` để chọn kênh nhận báo cáo giá.

3. **Theo dõi/xóa tiền**

   * Dùng `/follow` để thêm đồng tiền (tối đa 20 đồng/server).
   * Dùng `/remove` để xóa đồng tiền khỏi danh sách.

4. **Điều chỉnh khoảng thời gian báo cáo**

   * Dùng `/cooldown` để đặt thời gian báo cáo (ví dụ: `10m`).

5. **Chuyển đổi tiền**

   * Dùng `/swap amount: <số VND> target: <tên đồng tiền>`
     Ví dụ:

     ```
     /swap amount: 50000 target: bitcoin
     ```

6. **Gửi ảnh ngẫu nhiên**

   * Dùng `/goon` để bot gửi một ảnh ngẫu nhiên từ thư mục `goon`.

7. **Xem thông tin bot**

   * Dùng `/bot` để xem thời gian hoạt động (uptime), dung lượng ổ đĩa, số server mà bot đang hoạt động.

---

## Cấu Trúc File

```
├── index.js             # Mã nguồn chính của bot
├── serverConfig.json    # Lưu cấu hình server (kênh, đồng tiền, thời gian báo cáo)
├── popularCoins.json    # Danh sách đồng tiền hỗ trợ
├── bot.log              # Nhật ký hoạt động
├── goon/                # Thư mục chứa ảnh cho lệnh /goon
│   ├── image1.png
│   ├── image2.jpg
│   └── ...
├── .env                 # Lưu token Discord
└── package.json         # Khai báo dependency và scripts
```

---

## Lưu Ý

* Bot tự động lưu cấu hình mỗi 5 phút.
* Lệnh `/swap` và `/goon` chỉ hoạt động trong kênh đã được thiết lập bằng `/setting`.
* Bot giới hạn **20 đồng tiền** mỗi server.
* Nếu gặp lỗi, kiểm tra file `bot.log` để biết chi tiết.

---

## Đóng Góp

1. Fork repository này.
2. Tạo branch mới:

   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit thay đổi:

   ```bash
   git commit -m "Thêm tính năng XYZ"
   ```
4. Push lên branch:

   ```bash
   git push origin feature/your-feature
   ```
5. Tạo Pull Request trên GitHub để mình xem xét và merge.

---

## Giấy Phép

```
MIT License
```

Xem file `LICENSE` để biết thêm chi tiết.
Bot được xây dựng với ❤️ bởi ChatGPT.
