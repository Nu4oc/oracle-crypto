Bot Báo Giá Tiền Điện Tử
Giới Thiệu
Đây là một bot Discord giúp theo dõi giá tiền điện tử, chuyển đổi VND sang tiền điện tử, và gửi ảnh ngẫu nhiên. Bot sử dụng API CoinGecko để lấy giá tiền điện tử và ExchangeRate để chuyển đổi tiền tệ. Bot được viết bằng Node.js và thư viện discord.js, dễ dàng thiết lập và sử dụng.
Tính Năng

Theo dõi giá: Thêm/xóa đồng tiền điện tử và nhận báo cáo giá định kỳ.
Chuyển đổi VND: Chuyển đổi số tiền VND sang tiền điện tử (ví dụ: Bitcoin, Ethereum).
Báo cáo giá: Hiển thị giá USD/VND, biến động 24h, vốn hóa thị trường.
Thiết lập kênh: Chọn kênh Discord để gửi báo cáo giá.
Thông tin bot: Xem thời gian hoạt động, dung lượng ổ đĩa, số server.
Ảnh ngẫu nhiên: Gửi ảnh từ thư mục goon qua lệnh /goon.
Nút tương tác: Xem chi tiết đồng tiền hoặc mở ví trên Remitano.

Cài Đặt
Yêu Cầu

Node.js: Phiên bản 16.x hoặc cao hơn.
npm: Quản lý gói Node.js.
Token Discord: Lấy từ Discord Developer Portal.
File cấu hình:
popularCoins.json: Danh sách đồng tiền (ví dụ: [{"id": "bitcoin", "symbol": "btc", "name": "Bitcoin"}])
Thư mục goon: Chứa ảnh PNG, JPG, hoặc GIF cho lệnh /goon.



Các Bước Cài Đặt

Clone repository:
git clone <your-repository-url>
cd <repository-folder>


Cài đặt dependencies:
npm install discord.js dotenv axios


Tạo file .env:Tạo file .env và thêm token Discord:
DISCORD_TOKEN=your_discord_bot_token


Chuẩn bị file cấu hình:

Tạo popularCoins.json với danh sách đồng tiền.
Tạo thư mục goon và thêm ảnh nếu muốn dùng lệnh /goon.


Chạy bot:
npm start

Lưu ý: Thêm "start": "node index.js" vào package.json để dùng lệnh npm start.


Lệnh Có Sẵn



Lệnh
Mô Tả
Quyền Yêu Cầu



/setting
Chọn kênh gửi báo cáo giá
Quản trị viên


/follow
Thêm đồng tiền vào danh sách theo dõi
Quản trị viên


/remove
Xóa đồng tiền khỏi danh sách theo dõi
Quản trị viên


/cooldown
Đặt khoảng thời gian báo cáo (tối thiểu 10 phút)
Quản trị viên


/swap
Chuyển đổi VND sang tiền điện tử
Tất cả (trong kênh)


/bot
Xem thông tin bot (uptime, disk, server)
Quản trị viên


/goon
Gửi ảnh ngẫu nhiên từ thư mục goon
Tất cả (trong kênh)


Cách Sử Dụng

Mời bot vào server Discord với quyền gửi tin nhắn, gửi file, và nhúng link.
Dùng /setting để chọn kênh nhận báo cáo giá.
Dùng /follow để thêm đồng tiền (tối đa 20 đồng/server).
Dùng /cooldown để đặt thời gian báo cáo (ví dụ: 10m).
Dùng /swap để chuyển đổi tiền (ví dụ: /swap amount: 50000 target: bitcoin).
Dùng /goon để gửi ảnh ngẫu nhiên.

Cấu Trúc File

index.js: Mã nguồn chính của bot.
serverConfig.json: Lưu cấu hình server (kênh, đồng tiền, thời gian báo cáo).
popularCoins.json: Danh sách đồng tiền hỗ trợ.
bot.log: Nhật ký hoạt động.
goon/: Thư mục chứa ảnh cho lệnh /goon.
.env: Lưu token Discord.

Lưu Ý

Bot lưu cấu hình tự động mỗi 5 phút.
Lệnh /swap và /goon chỉ hoạt động trong kênh được thiết lập.
Bot giới hạn 20 đồng tiền mỗi server.
Kiểm tra bot.log nếu gặp lỗi.

Đóng Góp

Fork repository.
Tạo branch mới:git checkout -b feature/your-feature


Commit thay đổi:git commit -m "Thêm tính năng XYZ"


Push lên branch:git push origin feature/your-feature


Tạo Pull Request trên GitHub.

Giấy Phép
MIT License. Xem file LICENSE để biết thêm chi tiết.
