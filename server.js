/**
 * FNB Print Agent - Local server chạy trên máy tính quầy thu ngân
 * Nhận lệnh in từ browser (kể cả điện thoại qua WiFi) và gửi ESC/POS ra máy in qua TCP
 *
 * Cài đặt: npm install express cors
 * Chạy:    node server.js
 *
 * Lấy IP máy tính:
 *   Windows : ipconfig  → IPv4 Address
 *   macOS   : ifconfig  → inet 192.168.x.x
 *   Linux   : ip addr   → inet 192.168.x.x
 */

const express = require('express');
const cors    = require('cors');
const net     = require('net');

const app  = express();
const PORT = 12345;

// ─── Bảo mật: token xác thực đơn giản ────────────────────────────
// Đổi chuỗi này thành bất kỳ mật khẩu nào bạn muốn
// Phải khớp với VITE_PRINT_AGENT_TOKEN trong file .env của React app
const AGENT_TOKEN = process.env.AGENT_TOKEN || 'fnb-print-2024';

app.use(cors({
  origin: '*', // Cho phép mọi origin (điện thoại, máy tính bảng trong LAN)
}));
app.use(express.json({ limit: '5mb' }));

// Middleware kiểm tra token (áp dụng cho tất cả route trừ /health)
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const token = req.headers['x-agent-token'];
  if (token !== AGENT_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
});

// ─── ESC/POS Commands ─────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

const CMD = {
  INIT:        Buffer.from([ESC, 0x40]),
  CENTER:      Buffer.from([ESC, 0x61, 0x01]),
  LEFT:        Buffer.from([ESC, 0x61, 0x00]),
  BOLD_ON:     Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF:    Buffer.from([ESC, 0x45, 0x00]),
  DOUBLE_SIZE: Buffer.from([GS, 0x21, 0x11]),
  NORMAL_SIZE: Buffer.from([GS, 0x21, 0x00]),
  CUT:         Buffer.from([GS, 0x56, 0x41, 0x10]),
  FEED:        (lines) => Buffer.from([ESC, 0x64, lines]),
};

function encodeVN(text) {
  return Buffer.from(text, 'utf8');
}

// ─── Tạo nội dung ESC/POS ─────────────────────────────────────────
function buildReceiptBuffer(data, paperWidth = 80) {
  const CHARS = paperWidth === 58 ? 32 : 48;
  const buffers = [];

  const push = (buf) => buffers.push(buf);
  const text = (str) => buffers.push(encodeVN(str));
  const nl   = () => buffers.push(Buffer.from([LF]));
  const line = (ch = '-') => text(ch.repeat(CHARS));

  const padRow = (left, right, width = CHARS) => {
    const space = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };

  push(CMD.INIT);

  // Header
  push(CMD.CENTER);
  if (data.storeName) {
    push(CMD.BOLD_ON);
    push(CMD.DOUBLE_SIZE);
    text(data.storeName); nl();
    push(CMD.NORMAL_SIZE);
    push(CMD.BOLD_OFF);
  }
  if (data.address) { text(data.address); nl(); }
  if (data.phone)   { text('DT: ' + data.phone); nl(); }

  nl();
  push(CMD.BOLD_ON);
  text(data.type === 'kitchen' ? '--- PHIEU BEP ---' : '--- HOA DON ---');
  push(CMD.BOLD_OFF);
  nl(); nl();

  // Thông tin đơn
  push(CMD.LEFT);
  text('Ban: ' + (data.tableName || '?')); nl();
  if (data.staffName) { text('NV: ' + data.staffName); nl(); }
  text('Ngay: ' + new Date().toLocaleString('vi-VN')); nl();
  line(); nl();

  // Danh sách món
  if (data.type === 'kitchen') {
    for (const item of data.items) {
      push(CMD.BOLD_ON);
      push(CMD.DOUBLE_SIZE);
      text(`x${item.quantity} ${item.name}`); nl();
      push(CMD.NORMAL_SIZE);
      push(CMD.BOLD_OFF);
      if (item.note) { text(`  * ${item.note}`); nl(); }
    }
  } else {
    text(padRow('Mon hang', 'SL   Thanh tien', CHARS)); nl();
    line(); nl();
    for (const item of data.items) {
      const price    = (item.price * item.quantity).toLocaleString('vi-VN');
      const qtyPrice = `${item.quantity}  ${price}`;
      text(padRow(item.name.substring(0, CHARS - qtyPrice.length - 2), qtyPrice, CHARS)); nl();
      if (item.note) { text(`  (${item.note})`); nl(); }
    }
    if (data.total !== undefined) {
      line(); nl();
      push(CMD.BOLD_ON);
      text(padRow('TONG CONG:', data.total.toLocaleString('vi-VN') + 'd', CHARS)); nl();
      push(CMD.BOLD_OFF);
      if (data.discount) {
        text(padRow('Giam gia:', '-' + data.discount.toLocaleString('vi-VN') + 'd', CHARS)); nl();
      }
    }
  }

  nl(); nl();
  push(CMD.CENTER);
  text('Cam on quy khach!'); nl();
  push(CMD.FEED(4));
  push(CMD.CUT);

  return Buffer.concat(buffers);
}

// ─── Gửi dữ liệu tới máy in qua TCP ──────────────────────────────
function printToSocket(ip, port, buffer) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(port, ip, () => {
      socket.write(buffer, (err) => {
        if (err) return reject(new Error('Ghi dữ liệu thất bại: ' + err.message));
        socket.end();
        resolve(true);
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout kết nối tới ${ip}:${port}`));
    });

    socket.on('error', (err) => {
      reject(new Error(`Không kết nối được ${ip}:${port} — ${err.message}`));
    });
  });
}

// ─── API: Health check (không cần token) ─────────────────────────
app.get('/health', (_, res) => {
  res.json({ ok: true, version: '1.1.0' });
});

// ─── API: Test kết nối TCP tới máy in ────────────────────────────
app.post('/test', async (req, res) => {
  const { ip, port = 9100 } = req.body;
  if (!ip) return res.status(400).json({ ok: false, error: 'Thiếu địa chỉ IP' });

  try {
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.connect(port, ip, () => { socket.destroy(); resolve(); });
      socket.on('timeout', () => { socket.destroy(); reject(new Error('Timeout')); });
      socket.on('error', reject);
    });
    res.json({ ok: true, message: `Kết nối thành công tới ${ip}:${port}` });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ─── API: In hóa đơn / phiếu bếp ────────────────────────────────
app.post('/print', async (req, res) => {
  const { printer, data } = req.body;

  if (!printer || !data) {
    return res.status(400).json({ ok: false, error: 'Thiếu thông tin printer hoặc data' });
  }

  if (printer.connectionType !== 'lan') {
    return res.status(400).json({ ok: false, error: 'Agent chỉ hỗ trợ LAN. Bluetooth/USB xử lý trực tiếp trên trình duyệt.' });
  }

  if (!printer.ipAddress) {
    return res.status(400).json({ ok: false, error: 'Thiếu địa chỉ IP máy in' });
  }

  try {
    const buffer = buildReceiptBuffer(data, parseInt(printer.paperSize) || 80);
    await printToSocket(printer.ipAddress, printer.port || 9100, buffer);
    res.json({ ok: true, message: 'In thành công' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── API: Quét mạng LAN tìm máy in ──────────────────────────────
app.post('/scan', async (req, res) => {
  const { subnet = '192.168.1', port = 9100 } = req.body;
  const found = [];
  const promises = [];

  console.log(`Quét ${subnet}.1-254 cổng ${port}...`);

  for (let i = 1; i <= 254; i++) {
    const ip = `${subnet}.${i}`;
    promises.push(
      new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(300);
        socket.connect(port, ip, () => {
          found.push({ ip, port, name: `Máy in ${ip}` });
          socket.destroy();
          resolve();
        });
        socket.on('timeout', () => { socket.destroy(); resolve(); });
        socket.on('error', () => resolve());
      })
    );
  }

  // Quét theo batch 50 host, tránh quá tải
  const BATCH = 50;
  for (let i = 0; i < promises.length; i += BATCH) {
    await Promise.all(promises.slice(i, i + BATCH));
  }

  console.log(`Xong. Tìm thấy ${found.length} thiết bị.`);
  res.json({ ok: true, found });
});

// ─── Khởi động — lắng nghe toàn bộ mạng (0.0.0.0) ───────────────
app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let localIP = 'localhost';

  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        localIP = addr.address;
        break;
      }
    }
  }

  console.log('\n✓ FNB Print Agent đang chạy');
  console.log(`  Máy tính này     : http://localhost:${PORT}`);
  console.log(`  Điện thoại/máy khác: http://${localIP}:${PORT}`);
  console.log(`\n  → Dán địa chỉ sau vào VITE_PRINT_AGENT_URL trong file .env:`);
  console.log(`    VITE_PRINT_AGENT_URL=http://${localIP}:${PORT}\n`);
});
