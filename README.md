Bot Báo Giá Tiền Điện Tử
Giới Thiệu
Bot Báo Giá Tiền Điện Tử là một bot Discord được thiết kế để cung cấp thông tin giá cả và báo cáo về các đồng tiền điện tử. Bot hỗ trợ theo dõi giá, chuyển đổi tiền tệ, hiển thị thông tin hệ thống, và gửi hình ảnh ngẫu nhiên từ thư mục được chỉ định. Bot sử dụng API từ CoinGecko để lấy dữ liệu giá và ExchangeRate để chuyển đổi tiền tệ.
Bot được xây dựng bằng Node.js và thư viện discord.js, với các tính năng quản lý cấu hình server, tự động lưu trữ dữ liệu, và xử lý lỗi mạnh mẽ. Các lệnh được thiết kế để dễ sử dụng, với giao diện tương tác qua lệnh gạch chéo (/).
Tính Năng

Theo dõi giá tiền điện tử: Người dùng có thể thêm/xóa các đồng tiền vào danh sách theo dõi và nhận báo cáo giá định kỳ.
Chuyển đổi tiền tệ: Chuyển đổi từ VND sang các đồng tiền điện tử dựa trên tỷ giá thực tế.
Báo cáo chi tiết: Cung cấp thông tin giá USD/VND, biến động 24h, vốn hóa thị trường, và so sánh giá theo thời gian.
Quản lý cấu hình server: Cho phép thiết lập kênh báo cáo và khoảng thời gian báo cáo.
Thông tin bot: Hiển thị thời gian hoạt động, dung lượng ổ đĩa, số server, và số thành viên.
Hình ảnh ngẫu nhiên: Gửi ảnh ngẫu nhiên từ thư mục goon khi được yêu cầu.
Tương tác nút: Cung cấp nút để xem chi tiết đồng tiền hoặc mở ví trên Remitano.
Tự động hoàn thành: Hỗ trợ gợi ý khi nhập mã hoặc tên đồng tiền.

Cài Đặt
Yêu Cầu

Node.js: Phiên bản 16.x hoặc cao hơn.
npm: Công cụ quản lý gói của Node.js.
Tài khoản Discord Developer: Để tạo bot và lấy token.
API Keys: 
CoinGecko API (miễn phí, không cần key).
ExchangeRate API (miễn phí, không cần key).


Thư mục goon: Chứa các file ảnh (PNG, JPG, GIF) cho lệnh /goon.
File cấu hình:
serverConfig.json: Lưu trữ cấu hình cho từng server Discord.
popularCoins.json: Danh sách các đồng tiền điện tử được hỗ trợ.
bot.log: File nhật ký hoạt động của bot.



Cài Đặt

Clone repository:
git clone <repository-url>
cd <repository-folder>


Cài đặt dependencies:
npm install


Tạo file .env:Tạo file .env trong thư mục gốc và thêm token Discord:
DISCORD_TOKEN=your_discord_bot_token


Chuẩn bị file cấu hình:

Tạo file popularCoins.json với danh sách đồng tiền, ví dụ:[
  {"id": "bitcoin", "symbol": "btc", "name": "Bitcoin"},
  {"id": "ethereum", "symbol": "eth", "name": "Ethereum"}
]


Tạo thư mục goon và thêm các file ảnh (PNG, JPG, GIF) nếu muốn sử dụng lệnh /goon.


Chạy bot:
node index.js



Lệnh Có Sẵn
Bot hỗ trợ các lệnh gạch chéo (/) sau:



Lệnh
Mô Tả
Quyền Yêu Cầu



/setting
Chọn kênh văn bản để bot gửi báo cáo giá tiền điện tử.
Quản trị viên


/follow
Thêm một đồng tiền điện tử vào danh sách theo dõi.
Quản trị viên


/remove
Xóa một đồng tiền khỏi danh sách theo dõi.
Quản trị viên


/cooldown
Thiết lập khoảng thời gian báo cáo (tối thiểu 10 phút).
Quản trị viên


/swap
Chuyển đổi VND sang một đồng tiền điện tử cụ thể.
Tất cả (trong kênh đã thiết lập)


/bot
Hiển thị thông tin về bot: thời gian hoạt động, dung lượng ổ đĩa, v.v.
Quản trị viên


/goon
Gửi một hình ảnh ngẫu nhiên từ thư mục goon.
Tất cả (trong kênh đã thiết lập)


Cách Sử Dụng

Mời bot vào server:

Tạo bot trong Discord Developer Portal.
Mời bot vào server với quyền Send Messages, Embed Links, Attach Files, và View Channels.


Thiết lập kênh báo cáo:

Sử dụng /setting để chọn kênh văn bản nơi bot sẽ gửi báo cáo giá.


Theo dõi đồng tiền:

Sử dụng /follow để thêm đồng tiền vào danh sách theo dõi (tối đa 20 đồng/server).
Sử dụng /remove để xóa đồng tiền khỏi danh sách.


Đặt khoảng thời gian báo cáo:

Sử dụng /cooldown để thiết lập thời gian giữa các báo cáo (ví dụ: 10m cho 10 phút).


Chuyển đổi tiền tệ:

Sử dụng /swap để chuyển đổi từ VND sang đồng tiền điện tử (ví dụ: /swap amount: 50000 target: bitcoin).


Xem thông tin bot:

Sử dụng /bot để xem thông tin hệ thống và trạng thái bot.


Gửi ảnh ngẫu nhiên:

Sử dụng /goon để gửi một ảnh ngẫu nhiên từ thư mục goon.



Cấu Trúc File

index.js: File chính chứa mã nguồn bot.
serverConfig.json: Lưu cấu hình server (kênh, danh sách đồng tiền, khoảng thời gian báo cáo).
popularCoins.json: Danh sách đồng tiền điện tử được hỗ trợ.
bot.log: Nhật ký hoạt động của bot.
goon/: Thư mục chứa ảnh cho lệnh /goon.
.env: File chứa token Discord.

Xử Lý Lỗi

Bot ghi lại mọi lỗi vào bot.log với thời gian theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
Xử lý lỗi toàn cục (uncaughtException, unhandledRejection) đảm bảo bot lưu cấu hình trước khi thoát.
Tự động thử lại (retry) khi gọi API thất bại (tối đa 3 lần).
Lưu trữ cache dữ liệu thị trường trong 5 phút để giảm tải API.

Hạn Chế

Giới hạn API: Bot phụ thuộc vào API CoinGecko và ExchangeRate, có thể bị giới hạn tốc độ gọi.
Giới hạn đồng tiền: Mỗi server chỉ theo dõi tối đa 20 đồng tiền.
Thư mục goon: Lệnh /goon yêu cầu thư mục goon chứa ít nhất một file ảnh hợp lệ.
Quyền quản trị: Một số lệnh yêu cầu quyền quản trị viên hoặc vai trò có từ "admin" trong tên.

Đóng Góp

Fork repository này.
Tạo branch mới (git checkout -b feature/your-feature).
Commit thay đổi (git commit -am 'Thêm tính năng XYZ').
Push lên branch (git push origin feature/your-feature).
Tạo Pull Request.

Giấy Phép
Bot được phát hành dưới MIT License. Xem file LICENSE để biết thêm chi tiết.
Liên Hệ
Nếu bạn gặp vấn đề hoặc cần hỗ trợ, hãy mở một issue trên GitHub hoặc liên hệ qua Discord: [Your Discord Handle].

Bot được xây dựng với ❤️ bởi [Your Name].
