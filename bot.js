require('dotenv').config();
const fs = require('fs').promises;
const fsSync = require('fs'); // For synchronous writes
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
  ActivityType,
  PermissionsBitField,
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

const CONFIG_PATH = path.join(__dirname, 'serverConfig.json');
const POPULAR_COINS_PATH = path.join(__dirname, 'popularCoins.json');
const GOON_FOLDER = path.join(__dirname, 'goon');
const LOG_PATH = path.join(__dirname, 'bot.log');

let serverConfig = {};
let popularCoins = [];
const marketDataCache = new Map();

// Logging function to write to file and console
function log(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const logMessage = `[${timestamp}] ${level}: ${message}\n`;
  console.log(logMessage);
  try {
    fsSync.appendFileSync(LOG_PATH, logMessage);
  } catch (err) {
    console.error(`[ERROR] Không thể ghi log vào ${LOG_PATH}: ${err.message}`);
  }
}

async function loadConfigs() {
  try {
    if (await fs.access(CONFIG_PATH).then(() => true).catch(() => false)) {
      serverConfig = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
      log(`Đã tải serverConfig.json với ${Object.keys(serverConfig).length} guild(s)`);
    } else {
      log('Không tìm thấy serverConfig.json, khởi tạo rỗng');
    }
  } catch (err) {
    log(`Lỗi khi tải serverConfig.json: ${err.message}`, 'ERROR');
    serverConfig = {};
  }

  try {
    if (await fs.access(POPULAR_COINS_PATH).then(() => true).catch(() => false)) {
      popularCoins = JSON.parse(await fs.readFile(POPULAR_COINS_PATH, 'utf-8'));
      if (!Array.isArray(popularCoins) || popularCoins.length === 0) {
        throw new Error('popularCoins.json rỗng hoặc không hợp lệ');
      }
      log(`Đã tải ${popularCoins.length} đồng tiền từ popularCoins.json`);
    } else {
      throw new Error('Không tìm thấy popularCoins.json');
    }
  } catch (err) {
    log(`Lỗi khi tải popularCoins.json: ${err.message}`, 'ERROR');
    popularCoins = [];
  }
}

async function saveConfig() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await fs.writeFile(CONFIG_PATH, JSON.stringify(serverConfig, null, 2));
      log(`Đã lưu serverConfig.json (thử ${attempt})`);
      return;
    } catch (err) {
      log(`Lỗi khi lưu serverConfig.json (thử ${attempt}/3): ${err.message}`, 'ERROR');
      if (attempt === 3) {
        log('Không thể lưu serverConfig.json sau 3 lần thử', 'ERROR');
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

function saveConfigSync() {
  try {
    fsSync.writeFileSync(CONFIG_PATH, JSON.stringify(serverConfig, null, 2));
    log('Đã lưu serverConfig.json đồng bộ (trước khi tắt)');
  } catch (err) {
    log(`Lỗi khi lưu serverConfig.json đồng bộ: ${err.message}`, 'ERROR');
  }
}

// Auto-save config every 5 minutes
setInterval(() => {
  if (Object.keys(serverConfig).length > 0) {
    saveConfig().catch(err => log(`Lỗi khi auto-save serverConfig: ${err.message}`, 'ERROR'));
  }
}, 5 * 60 * 1000);

const commands = [
  new SlashCommandBuilder()
    .setName('setting')
    .setDescription('Chọn kênh để bot gửi báo cáo giá tiền điện tử')
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Chọn kênh văn bản để nhận báo cáo').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('follow')
    .setDescription('Thêm một đồng tiền điện tử vào danh sách theo dõi')
    .addStringOption(opt =>
      opt.setName('coin').setDescription('Nhập mã hoặc ID của đồng tiền').setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Xóa một đồng tiền khỏi danh sách theo dõi')
    .addStringOption(opt =>
      opt.setName('coin').setDescription('Chọn đồng tiền từ danh sách đang theo dõi').setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('cooldown')
    .setDescription('Thiết lập khoảng thời gian báo cáo (tối thiểu 10 phút)')
    .addStringOption(opt =>
      opt.setName('duration').setDescription('Ví dụ: "10m" hoặc "15m"').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('swap')
    .setDescription('Chuyển đổi VND sang tiền điện tử')
    .addNumberOption(opt =>
      opt.setName('amount').setDescription('Số tiền VND (ví dụ: 50000)').setRequired(true).setMinValue(0)
    )
    .addStringOption(opt =>
      opt.setName('target').setDescription('Đồng tiền điện tử đích (ID CoinGecko)').setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Hiển thị thông tin về bot: thời gian hoạt động, dung lượng ổ đĩa, số server và thành viên'),
  new SlashCommandBuilder()
    .setName('goon')
    .setDescription('Gửi một hình ảnh ngẫu nhiên từ thư mục "goon"'),
].map(cmd => cmd.toJSON());

client.once('ready', async () => {
  log(`Bot đã đăng nhập: ${client.user.tag}`);

  client.user.setActivity('Cryptocurrencies', {
    type: ActivityType.Streaming,
    url: 'https://www.twitch.tv/cryptocurrencies',
  });

  await loadConfigs();
  if (popularCoins.length === 0) {
    log('Không có đồng tiền nào được tải từ popularCoins.json. Lệnh /swap và /follow sẽ không hoạt động.', 'WARN');
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const appId = (await client.application.fetch()).id;
  try {
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    log('Đã đăng ký lệnh thành công');
  } catch (err) {
    log(`Lỗi khi đăng ký lệnh: ${err.stack}`, 'ERROR');
  }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const guildId = interaction.guildId;
      if (!serverConfig[guildId]) {
        serverConfig[guildId] = { channelId: null, coins: [], prevPrices: {}, reportIntervalMs: null, reportInterval: null };
        await saveConfig();
        log(`Khởi tạo serverConfig cho guild ${guildId}`);
      }

      // Check for administrator role or permission for restricted commands
      const restrictedCommands = ['setting', 'follow', 'remove', 'cooldown', 'bot'];
      if (restrictedCommands.includes(interaction.commandName)) {
        let member = interaction.member;
        if (member.roles.cache.size === 0) {
          try {
            member = await interaction.guild.members.fetch(interaction.user.id);
          } catch (err) {
            log(`Lỗi khi lấy thông tin thành viên ${interaction.user.id} trong guild ${guildId}: ${err.message}`, 'ERROR');
          }
        }
        const hasAdminRole = member.roles.cache.some(role => {
          const roleName = role.name.toLowerCase();
          return roleName.includes('administrator') || roleName.includes('admin') || roleName.includes('quản trị viên');
        });
        const hasAdminPerm = member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!hasAdminRole && !hasAdminPerm) {
          log(`Người dùng ${interaction.user.id} không có quyền admin khi sử dụng ${interaction.commandName} trong guild ${guildId}`, 'WARN');
          return interaction.reply({
            content: '❌ Bạn cần có vai trò quản trị viên (Administrator, Admin, Quản trị viên) hoặc quyền Quản trị viên để sử dụng lệnh này.',
            ephemeral: true,
          });
        }
      }

      // Check if /swap or /goon is used in the correct channel
      if (['swap', 'goon'].includes(interaction.commandName)) {
        if (!serverConfig[guildId].channelId || interaction.channelId !== serverConfig[guildId].channelId) {
          log(`Lệnh ${interaction.commandName} được sử dụng trong kênh sai trong guild ${guildId}`, 'WARN');
          return interaction.reply({
            content: '❌ Lệnh này chỉ có thể được sử dụng trong kênh được thiết lập bởi `/setting`.',
            ephemeral: true,
          });
        }
      }

      if (interaction.commandName === 'setting') {
        const channel = interaction.options.getChannel('channel');
        if (!channel.isTextBased()) {
          log(`Kênh không hợp lệ được chọn trong guild ${guildId}: ${channel.id}`, 'WARN');
          return interaction.reply({
            content: '❌ Vui lòng chọn một kênh văn bản.',
            ephemeral: true,
          });
        }
        serverConfig[guildId].channelId = channel.id;
        await saveConfig();
        log(`Đã đặt kênh ${channel.id} cho guild ${guildId}`);

        if (serverConfig[guildId].reportIntervalMs && serverConfig[guildId].coins.length >= 2) {
          setReportInterval(guildId, serverConfig[guildId].reportIntervalMs);
        }

        return interaction.reply({
          content: `✅ Đã chọn kênh **#${channel.name}** để nhận báo cáo giá.`,
          ephemeral: true,
        });
      }

      if (interaction.commandName === 'follow') {
        const input = interaction.options.getString('coin').toLowerCase();
        const found = popularCoins.find(
          c => c.symbol === input || c.id === input || c.name.toLowerCase().includes(input)
        );
        if (!found) {
          log(`Không tìm thấy đồng tiền ${input} trong guild ${guildId}`, 'WARN');
          return interaction.reply({
            content: `❌ Không tìm thấy đồng tiền \`${input}\`.`,
            ephemeral: true,
          });
        }
        const coinId = found.id;
        if (serverConfig[guildId].coins.length >= 20) {
          log(`Guild ${guildId} đạt giới hạn 20 đồng tiền khi thêm ${coinId}`, 'WARN');
          return interaction.reply({
            content: '❌ Đã đạt giới hạn 20 đồng tiền theo dõi trên mỗi server.',
            ephemeral: true,
          });
        }
        if (!serverConfig[guildId].coins.includes(coinId)) {
          serverConfig[guildId].coins.push(coinId);
          await saveConfig();
          log(`Đã thêm ${coinId} vào danh sách theo dõi của guild ${guildId}`);

          if (serverConfig[guildId].reportIntervalMs && serverConfig[guildId].channelId && serverConfig[guildId].coins.length >= 2) {
            setReportInterval(guildId, serverConfig[guildId].reportIntervalMs);
          }

          return interaction.reply({
            content: `✅ Đã thêm **${found.name} (${found.symbol.toUpperCase()})** vào danh sách theo dõi.`,
            ephemeral: true,
          });
        }
        log(`Đồng tiền ${coinId} đã có trong danh sách theo dõi của guild ${guildId}`, 'WARN');
        return interaction.reply({
          content: `⚠️ **${found.name} (${found.symbol.toUpperCase()})** đã có trong danh sách theo dõi.`,
          ephemeral: true,
        });
      }

      if (interaction.commandName === 'remove') {
        const input = interaction.options.getString('coin').toLowerCase();
        const list = serverConfig[guildId].coins;
        if (!list.includes(input)) {
          log(`Đồng tiền ${input} không có trong danh sách theo dõi của guild ${guildId}`, 'WARN');
          return interaction.reply({
            content: `❌ Đồng tiền \`${input}\` không có trong danh sách theo dõi.`,
            ephemeral: true,
          });
        }
        serverConfig[guildId].coins = list.filter(id => id !== input);
        if (serverConfig[guildId].prevPrices[input]) {
          delete serverConfig[guildId].prevPrices[input];
        }
        await saveConfig();
        log(`Đã xóa ${input} khỏi danh sách theo dõi của guild ${guildId}`);

        if (serverConfig[guildId].coins.length < 2 && serverConfig[guildId].reportInterval) {
          clearInterval(serverConfig[guildId].reportInterval);
          serverConfig[guildId].reportInterval = null;
          await saveConfig();
          log(`Đã hủy interval báo cáo cho guild ${guildId} do dưới 2 đồng tiền`);
        }

        const found = popularCoins.find(c => c.id === input);
        const display = found ? `${found.name} (${found.symbol.toUpperCase()})` : input;
        return interaction.reply({
          content: `🗑️ Đã xóa **${display}** khỏi danh sách theo dõi.`,
          ephemeral: true,
        });
      }

      if (interaction.commandName === 'cooldown') {
        const s = interaction.options.getString('duration').toLowerCase();
        let ms;
        if (s.endsWith('m')) {
          ms = parseInt(s.slice(0, -1), 10) * 60 * 1000;
        } else if (s.endsWith('s')) {
          ms = parseInt(s.slice(0, -1), 10) * 1000;
        } else {
          ms = parseInt(s, 10) * 60 * 1000;
        }
        if (isNaN(ms) || ms < 10 * 60 * 1000) {
          log(`Khoảng thời gian không hợp lệ ${s} trong guild ${guildId}`, 'WARN');
          return interaction.reply({
            content: '❌ Khoảng thời gian phải từ 10 phút trở lên. Ví dụ: "10m" hoặc "15m".',
            ephemeral: true,
          });
        }
        serverConfig[guildId].reportIntervalMs = ms;
        await saveConfig();
        log(`Đã đặt cooldown ${Math.floor(ms / 60000)} phút cho guild ${guildId}`);

        if (serverConfig[guildId].channelId && serverConfig[guildId].coins.length >= 2) {
          setReportInterval(guildId, ms);
        }

        return interaction.reply({
          content: `⏱️ Đã đặt khoảng thời gian báo cáo thành **${Math.floor(ms / 60000)} phút**.`,
          ephemeral: true,
        });
      }

      if (interaction.commandName === 'swap') {
        const amountVND = interaction.options.getNumber('amount');
        const target = interaction.options.getString('target').toLowerCase();

        log(`Xử lý /swap: amount=${amountVND}, target=${target} trong guild ${guildId}`);

        if (popularCoins.length === 0) {
          log('Danh sách đồng tiền rỗng trong /swap', 'ERROR');
          return interaction.reply({
            content: '❌ Lỗi hệ thống: Danh sách đồng tiền không được tải. Liên hệ quản trị viên.',
            ephemeral: false,
          });
        }

        const found = popularCoins.find(c => c.id === target);
        if (!found) {
          log(`Đồng tiền ${target} không hợp lệ trong guild ${guildId}`, 'WARN');
          return interaction.reply({
            content: `❌ ID đồng tiền \`${target}\` không hợp lệ. Vui lòng kiểm tra ID CoinGecko.`,
            ephemeral: false,
          });
        }

        await interaction.deferReply({ ephemeral: false });

        try {
          let resFiat;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              resFiat = await axios.get('https://api.exchangerate.host/convert', {
                params: { from: 'VND', to: 'USD', amount: amountVND },
                timeout: 5000,
              });
              log(`Đã chuyển ${amountVND} VND thành ${resFiat.data.result} USD (thử ${attempt})`);
              break;
            } catch (err) {
              log(`Thử ${attempt}/3 exchangerate.host thất bại: ${err.message}`, 'WARN');
              if (attempt === 3) throw err;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }

          if (!resFiat?.data?.result) {
            throw new Error('Không nhận được tỷ giá VND/USD hợp lệ');
          }
          const inUSD = resFiat.data.result;

          let priceCryptoUSD;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                params: { ids: target, vs_currencies: 'usd' },
                timeout: 5000,
              });
              priceCryptoUSD = res.data[target]?.usd;
              log(`Giá ${target}: ${priceCryptoUSD} USD (thử ${attempt})`);
              break;
            } catch (err) {
              log(`Thử ${attempt}/3 CoinGecko thất bại trong /swap: ${err.message}`, 'WARN');
              if (attempt === 3) throw err;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }

          if (!priceCryptoUSD) {
            throw new Error(`Không tìm thấy giá USD của ${target}`);
          }

          const qty = inUSD / priceCryptoUSD;
          return interaction.editReply({
            content: `💱 ${amountVND.toLocaleString('vi-VN')} ₫ ≈ ${qty.toLocaleString(undefined, {
              minimumFractionDigits: 6,
              maximumFractionDigits: 6,
            })} ${found.symbol.toUpperCase()}`,
          });
        } catch (err) {
          log(`Lỗi khi xử lý /swap trong guild ${guildId}: ${err.message}`, 'ERROR');
          return interaction.editReply({
            content: `❌ Lỗi khi chuyển đổi: ${err.message}. Vui lòng thử lại sau.`,
          });
        }
      }

      if (interaction.commandName === 'bot') {
        const uptimeMs = client.uptime;
        const seconds = Math.floor((uptimeMs / 1000) % 60);
        const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
        const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
        const uptimeString = `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`;

        let diskInfo = 'Không thể đọc thông tin ổ đĩa.';
        try {
          const df = execSync('df -h /').toString().split('\n')[1].split(/\s+/);
          diskInfo = `Tổng: ${df[1]}, Đã dùng: ${df[2]}, Còn trống: ${df[3]}, Tỷ lệ: ${df[4]}`;
        } catch {
          diskInfo = 'Lỗi khi lấy thông tin ổ đĩa.';
        }

        const totalServers = client.guilds.cache.size;
        const totalMembers = client.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0);

        const embed = new EmbedBuilder()
          .setTitle('📊 Thông Tin Bot')
          .addFields(
            { name: '⏱️ Thời Gian Hoạt Động', value: uptimeString, inline: false },
            { name: '💾 Dung Lượng Ổ Đĩa', value: diskInfo, inline: false },
            { name: '🌐 Số Server', value: `${totalServers}`, inline: false },
            { name: '👥 Tổng Thành Viên', value: `${totalMembers}`, inline: false },
            { name: '🔗 Mã Nguồn', value: '[Xem trên GitHub](https://github.com/your/repo)', inline: false }
          )
          .setTimestamp();

        log(`Hiển thị thông tin bot cho guild ${guildId}`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (interaction.commandName === 'goon') {
        try {
          await fs.access(GOON_FOLDER);
          const files = (await fs.readdir(GOON_FOLDER)).filter(f => /\.(png|jpe?g|gif)$/i.test(f));
          if (files.length === 0) {
            log(`Thư mục goon trống trong guild ${guildId}`, 'WARN');
            return interaction.reply({
              content: '❌ Thư mục "goon" trống.',
              ephemeral: false,
            });
          }
          const choice = files[Math.floor(Math.random() * files.length)];
          const attachment = new AttachmentBuilder(path.join(GOON_FOLDER, choice));
          log(`Gửi ảnh ${choice} trong guild ${guildId}`);
          return interaction.reply({ files: [attachment] });
        } catch (err) {
          log(`Lỗi khi lấy ảnh goon trong guild ${guildId}: ${err.message}`, 'ERROR');
          return interaction.reply({
            content: '❌ Lỗi khi lấy ảnh.',
            ephemeral: false,
          });
        }
      }
    }

    if (interaction.isButton()) {
      const [action, coinId] = interaction.customId.split('_', 2);
      if (!coinId) {
        log(`Tương tác nút không hợp lệ trong guild ${interaction.guildId}`, 'WARN');
        return interaction.reply({ content: '❌ Tương tác nút không hợp lệ.', ephemeral: true });
      }
      if (action === 'deposit') {
        log(`Nút deposit cho ${coinId} được nhấn trong guild ${interaction.guildId}`);
        return interaction.reply({
          content: `💧 Để nạp ${coinId.toUpperCase()}, hãy truy cập: https://remitano.com/vn`,
          ephemeral: true,
        });
      }
      if (action === 'link') {
        log(`Nút link cho ${coinId} được nhấn trong guild ${interaction.guildId}`);
        return interaction.reply({
          content: `🔗 Chi tiết ${coinId.toUpperCase()}: https://www.coingecko.com/en/coins/${coinId}`,
          ephemeral: true,
        });
      }
    }

    if (interaction.isAutocomplete()) {
      const command = interaction.commandName;
      const focusedValue = interaction.options.getFocused().toLowerCase();

      if (command === 'follow' || command === 'swap') {
        const suggestions = popularCoins
          .filter(
            c =>
              c.symbol.startsWith(focusedValue) ||
              c.id.startsWith(focusedValue) ||
              c.name.toLowerCase().includes(focusedValue)
          )
          .slice(0, 10)
          .map(c => ({
            name: `${c.name} (${c.symbol.toUpperCase()})`,
            value: c.id,
          }));
        return interaction.respond(suggestions);
      }

      if (command === 'remove') {
        const guildId = interaction.guildId;
        const currentList = serverConfig[guildId]?.coins || [];
        const suggestions = currentList
          .filter(id => id.startsWith(focusedValue))
          .map(id => {
            const found = popularCoins.find(c => c.id === id);
            const display = found ? `${found.name} (${found.symbol.toUpperCase()})` : id;
            return { name: display, value: id };
          })
          .slice(0, 10);
        return interaction.respond(suggestions);
      }
    }
  } catch (err) {
    log(`Lỗi khi xử lý interaction trong guild ${interaction.guildId}: ${err.stack}`, 'ERROR');
    if (interaction.isChatInputCommand() || interaction.isButton()) {
      const replyMethod = interaction.deferred ? interaction.editReply : interaction.reply;
      await replyMethod({
        content: '❌ Đã xảy ra lỗi khi xử lý lệnh. Vui lòng thử lại sau.',
        ephemeral: true,
      }).catch(e => log(`Lỗi khi gửi lỗi phản hồi: ${e.message}`, 'ERROR'));
    }
  }
});

function setReportInterval(guildId, ms) {
  if (serverConfig[guildId].reportInterval) {
    clearInterval(serverConfig[guildId].reportInterval);
    log(`Đã hủy interval báo cáo cũ cho guild ${guildId}`);
  }
  serverConfig[guildId].reportInterval = setInterval(() => sendPriceReports(guildId), ms);
  serverConfig[guildId].reportուՆ
reportIntervalMs = ms;
  saveConfig().catch(err => log(`Lỗi khi lưu config sau setReportInterval cho guild ${guildId}: ${err.message}`, 'ERROR'));
  log(`Đã đặt interval báo cáo ${Math.floor(ms / 60000)} phút cho guild ${guildId}`);
}

async function sendPriceReports(guildId) {
  const cfg = serverConfig[guildId];
  if (!cfg || !cfg.channelId || !cfg.coins || cfg.coins.length < 2 || !cfg.reportIntervalMs) {
    log(`Guild ${guildId} không đủ điều kiện để gửi báo cáo`, 'WARN');
    return;
  }

  const now = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  log(`Gửi báo cáo giá cho guild ${guildId} mỗi ${Math.floor(cfg.reportIntervalMs / 60000)} phút`);

  const idsParam = cfg.coins.join(',');
  let marketData, vndData;

  // Check cache for market data
  const cacheKey = `market_${idsParam}`;
  const cached = marketDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    log(`Sử dụng dữ liệu cache cho [${idsParam}] trong guild ${guildId}`);
    marketData = cached.data;
  } else {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const marketRes = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            ids: idsParam,
            order: 'market_cap_desc',
            per_page: cfg.coins.length,
            page: 1,
            price_change_percentage: '24h',
          },
          timeout: 5000,
        });
        marketData = marketRes.data;
        marketDataCache.set(cacheKey, { data: marketData, timestamp: Date.now() });
        log(`Đã tải dữ liệu thị trường (USD) cho [${idsParam}] (thử ${attempt})`);
        break;
      } catch (err) {
        log(`Thử ${attempt}/3 thất bại cho guild ${guildId} (market): ${err.message}`, 'WARN');
        if (attempt === 3) {
          log(`Lỗi khi tải dữ liệu thị trường cho guild ${guildId}: ${err.message}`, 'ERROR');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Fetch VND prices
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const vndRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: idsParam, vs_currencies: 'vnd' },
        timeout: 5000,
      });
      vndData = vndRes.data;
      log(`Đã tải giá VND cho [${idsParam}] (thử ${attempt})`);
      break;
    } catch (err) {
      log(`Thử ${attempt}/3 thất bại cho guild ${guildId} (VND): ${err.message}`, 'WARN');
      if (attempt === 3) {
        log(`Lỗi khi tải giá VND cho guild ${guildId}: ${err.message}`, 'ERROR');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  const channel = await client.channels.fetch(cfg.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    log(`Guild ${guildId}: kênh không hợp lệ, bỏ qua`, 'WARN');
    return;
  }

  for (const coin of marketData) {
    const displayName = `${coin.name} (${coin.symbol.toUpperCase()})`;
    const priceUSD = coin.current_price ?? 0;
    const change24h = coin.price_change_percentage_24h ?? 0;
    const high24h = coin.high_24h ?? 0;
    const low24h = coin.low_24h ?? 0;
    const marketCap = coin.market_cap ?? 0;
    const thumb = coin.image || null;
    const priceVND = vndData[coin.id]?.vnd ?? null;

    const prevUSD = cfg.prevPrices?.[coin.id]?.lastReport ?? null;
    let comparePrev = `– Không có dữ liệu so sánh ${Math.floor(cfg.reportIntervalMs / 60000)} phút trước.`;
    if (prevUSD !== null && prevUSD !== undefined) {
      const delta = priceUSD - prevUSD;
      const pct = prevUSD > 0 ? (delta / prevUSD) * 100 : 0;
      const emoji = delta > 0 ? '🟢' : delta < 0 ? '🔴' : '🟡';
      const sign = delta > 0 ? '+' : '';
      comparePrev = `${emoji} \`${sign}${delta.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })} (${sign}${pct.toFixed(2)}%)\``;
    }

    let compare7d = '– Không có dữ liệu so sánh 7 ngày.';
    try {
      const cacheKey = `${coin.id}_7d`;
      if (!cfg.prevPrices[cacheKey] || Date.now() - cfg.prevPrices[cacheKey].timestamp > 24 * 60 * 60 * 1000) {
        const histRes = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart`,
          { params: { vs_currency: 'usd', days: 7, interval: 'daily' } }
        );
        const prices = histRes.data.prices;
        if (prices && prices.length > 0) {
          const price7d = prices[0][1];
          cfg.prevPrices[cacheKey] = { price: price7d, timestamp: Date.now() };
        }
      }
      if (cfg.prevPrices[cacheKey]) {
        const price7d = cfg.prevPrices[cacheKey].price;
        const delta7 = priceUSD - price7d;
        const pct7 = price7d > 0 ? (delta7 / price7d) * 100 : 0;
        const emoji7 = delta7 > 0 ? '🟢' : delta7 < 0 ? '🔴' : '🟡';
        const sign7 = delta7 > 0 ? '+' : '';
        compare7d = `${emoji7} \`${sign7}${delta7.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })} (${sign7}${pct7.toFixed(2)}%)\``;
      }
    } catch (err) {
      log(`Lỗi khi lấy dữ liệu 7 ngày cho ${coin.id} trong guild ${guildId}: ${err.message}`, 'ERROR');
    }

    const embed = new EmbedBuilder()
      .setTitle(`${displayName} – Báo Cáo Giá`)
      .setColor(0x1abc9c)
      .setThumbnail(thumb)
      .addFields(
        {
          name: 'Giá Hiện Tại (USD)',
          value: `\`${priceUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\``,
          inline: true,
        },
        {
          name: 'Tương Đương (VND)',
          value: priceVND ? `\`${priceVND.toLocaleString('vi-VN')} ₫\`` : `\`Không có dữ liệu\``,
          inline: true,
        },
        { name: `So Với ${Math.floor(cfg.reportIntervalMs / 60000)} Phút Trước`, value: comparePrev, inline: false },
        { name: 'So Với 7 Ngày Trước', value: compare7d, inline: false },
        { name: 'Biến Động 24h', value: `\`${change24h.toFixed(2)}%\``, inline: true },
        {
          name: 'Cao / Thấp 24h',
          value: `• Cao: \`${high24h.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\`\n` +
                 `• Thấp: \`${low24h.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\``,
          inline: false,
        },
        {
          name: 'Vốn Hóa Thị Trường (USD)',
          value: `\`${marketCap.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\``,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Dữ liệu từ CoinGecko', iconURL: 'https://www.coingecko.com/favicon.ico' });

    const depositButton = new ButtonBuilder()
      .setCustomId(`deposit_${coin.id}`)
      .setLabel('Mở ví')
      .setStyle(ButtonStyle.Primary);

    const linkButton = new ButtonBuilder()
      .setCustomId(`link_${coin.id}`)
      .setLabel('Xem chi tiết')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(depositButton, linkButton);

    try {
      await channel.send({ embeds: [embed], components: [row] });
      log(`Đã gửi báo cáo cho ${displayName} trong guild ${guildId}`);
    } catch (err) {
      log(`Lỗi khi gửi báo cáo cho ${displayName} trong guild ${guildId}: ${err.message}`, 'ERROR');
    }

    if (!cfg.prevPrices) cfg.prevPrices = {};
    cfg.prevPrices[coin.id] = { lastReport: priceUSD, ...(cfg.prevPrices[coin.id] || {}) };
  }

  await saveConfig().catch(err => log(`Lỗi khi lưu config sau sendPriceReports cho guild ${guildId}: ${err.message}`, 'ERROR'));
}

// Global error handlers
process.on('uncaughtException', err => {
  log(`Uncaught Exception: ${err.stack}`, 'ERROR');
  saveConfigSync();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at ${promise}: ${reason.stack || reason}`, 'ERROR');
  saveConfigSync();
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Nhận tín hiệu SIGTERM, đang tắt bot...');
  for (const guildId in serverConfig) {
    if (serverConfig[guildId].reportInterval) {
      clearInterval(serverConfig[guildId].reportInterval);
      log(`Đã hủy interval báo cáo cho guild ${guildId}`);
    }
  }
  saveConfigSync();
  client.destroy();
  log('Bot đã tắt');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
  log(`Lỗi đăng nhập: ${err.stack}`, 'ERROR');
  saveConfigSync();
  process.exit(1);
});